#!/usr/bin/env python3
"""
Script to add users to the pro plan for free by email address.

This script:
1. Takes an email address as input
2. Looks up the user in the database
3. Creates a Stripe customer if needed
4. Creates a free subscription to the pro plan
5. Updates the database with the subscription information

Usage:
    python scripts/add_user_to_pro_plan.py user@example.com
    python scripts/add_user_to_pro_plan.py user1@example.com user2@example.com user3@example.com
"""

import os
import sys
import asyncio
import stripe
from datetime import datetime, timezone

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.config import config
from utils.logger import logger
from services.supabase import DBConnection


# Initialize Stripe
stripe.api_key = config.STRIPE_SECRET_KEY


async def find_user_by_email(client, email: str):
    """Find user in the database by email address."""
    try:
        # First try to find user in auth.users
        user_result = await client.auth.admin.list_users()

        for user in user_result:
            if user.email and user.email.lower() == email.lower():
                logger.info(f"Found user {user.id} with email {email}")
                return user

        logger.warning(f"User with email {email} not found in auth.users")
        return None

    except Exception as e:
        logger.error(f"Error finding user by email {email}: {str(e)}")
        return None


async def get_user_account_id(client, user_id: str):
    """Get the account ID for a user (their personal account)."""
    try:
        result = (
            await client.schema("basejump")
            .from_("accounts")
            .select("id")
            .eq("primary_owner_user_id", user_id)
            .eq("personal_account", True)
            .execute()
        )

        if result.data and len(result.data) > 0:
            return result.data[0]["id"]

        logger.error(f"No personal account found for user {user_id}")
        return None

    except Exception as e:
        logger.error(f"Error getting account ID for user {user_id}: {str(e)}")
        return None


async def get_existing_stripe_customer(client, user_id: str):
    """Check if user already has a Stripe customer ID."""
    try:
        result = (
            await client.schema("basejump")
            .from_("billing_customers")
            .select("id, email, active")
            .eq("account_id", user_id)
            .execute()
        )

        if result.data and len(result.data) > 0:
            return result.data[0]
        return None

    except Exception as e:
        logger.error(
            f"Error checking existing Stripe customer for user {user_id}: {str(e)}"
        )
        return None


async def create_stripe_customer_for_user(client, user_id: str, email: str):
    """Create a new Stripe customer for the user."""
    try:
        logger.info(f"Creating Stripe customer for user {user_id} with email {email}")

        # Create customer in Stripe
        customer = stripe.Customer.create(
            email=email, metadata={"user_id": user_id, "migration": "true"}
        )
        logger.info(f"Created Stripe customer {customer.id}")

        # Store customer ID in database
        result = (
            await client.schema("basejump")
            .from_("billing_customers")
            .insert(
                {
                    "id": customer.id,
                    "account_id": user_id,
                    "email": email,
                    "provider": "stripe",
                    "active": True,
                }
            )
            .execute()
        )

        logger.info(f"Stored customer {customer.id} in database")
        return customer.id

    except Exception as e:
        logger.error(f"Error creating Stripe customer for user {user_id}: {str(e)}")
        return None


async def create_discount_coupon():
    """Create a 100% discount coupon for migrations."""
    try:
        coupon = stripe.Coupon.create(
            percent_off=100,
            duration="forever",
            name="Pro Plan Migration",
            id="pro_plan_migration_100_off",
        )
        logger.info(f"Created coupon: {coupon.id}")
        return coupon.id
    except stripe.error.InvalidRequestError as e:
        if "already exists" in str(e):
            logger.info("Coupon already exists, using existing one")
            return "pro_plan_migration_100_off"
        else:
            logger.error(f"Error creating coupon: {str(e)}")
            return None
    except Exception as e:
        logger.error(f"Error creating coupon: {str(e)}")
        return None


async def create_free_subscription(customer_id: str, coupon_id: str, email: str):
    """Create a free subscription for the customer."""
    try:
        subscription = stripe.Subscription.create(
            customer=customer_id,
            items=[{"price": config.STRIPE_PRO_75_ID}],
            discounts=[{"coupon": coupon_id}],
            metadata={
                "migration": "true",
                "migration_date": datetime.now(timezone.utc).isoformat(),
                "migration_reason": "Pro plan migration by email",
                "user_email": email,
            },
        )

        logger.info(
            f"Created subscription {subscription.id} for customer {customer_id}"
        )
        return subscription

    except Exception as e:
        logger.error(
            f"Error creating subscription for customer {customer_id}: {str(e)}"
        )
        return None


async def update_database_subscription(
    client, account_id: str, customer_id: str, subscription
):
    """Update the database with the new subscription information."""
    try:
        subscription_data = {
            "id": subscription.id,
            "account_id": account_id,
            "billing_customer_id": customer_id,
            "status": subscription.status,
            "price_id": config.STRIPE_PRO_75_ID,
            "plan_name": "pro_75",
            "quantity": 1,
            "cancel_at_period_end": subscription.cancel_at_period_end,
            "metadata": subscription.metadata or {},
        }

        # Add period dates if they exist
        if (
            hasattr(subscription, "current_period_start")
            and subscription.current_period_start
        ):
            subscription_data["current_period_start"] = datetime.fromtimestamp(
                subscription.current_period_start, tz=timezone.utc
            )

        if (
            hasattr(subscription, "current_period_end")
            and subscription.current_period_end
        ):
            subscription_data["current_period_end"] = datetime.fromtimestamp(
                subscription.current_period_end, tz=timezone.utc
            )

        result = (
            await client.schema("basejump")
            .from_("billing_subscriptions")
            .insert(subscription_data)
            .execute()
        )

        logger.info(f"Updated database with subscription for account {account_id}")
        return True

    except Exception as e:
        logger.error(
            f"Error updating database subscription for account {account_id}: {str(e)}"
        )
        return False


async def add_user_to_pro_plan(client, email: str):
    """Add a user to the pro plan by email address."""
    logger.info(f"Starting pro plan migration for {email}")

    # Find user by email
    user = await find_user_by_email(client, email)
    if not user:
        logger.error(f"User with email {email} not found. They need to sign up first.")
        return False

    user_id = user.id

    # Get user's account ID
    account_id = await get_user_account_id(client, user_id)
    if not account_id:
        logger.error(f"No account found for user {user_id}")
        return False

    # Check if user already has a Stripe customer
    existing_customer = await get_existing_stripe_customer(client, account_id)

    if existing_customer:
        customer_id = existing_customer["id"]
        logger.info(f"User already has Stripe customer: {customer_id}")

        # Check if they already have an active subscription
        try:
            existing_subscriptions = stripe.Subscription.list(
                customer=customer_id, status="active", price=config.STRIPE_PRO_75_ID
            )

            if existing_subscriptions.data:
                logger.info(f"User {email} already has an active pro subscription")
                return True
        except Exception as e:
            logger.error(f"Error checking existing subscriptions: {str(e)}")
    else:
        # Create new Stripe customer
        customer_id = await create_stripe_customer_for_user(client, account_id, email)
        if not customer_id:
            logger.error(f"Failed to create Stripe customer for {email}")
            return False

    # Create discount coupon
    coupon_id = await create_discount_coupon()
    if not coupon_id:
        logger.error("Failed to create discount coupon")
        return False

    # Create free subscription
    subscription = await create_free_subscription(customer_id, coupon_id, email)
    if not subscription:
        logger.error(f"Failed to create subscription for {email}")
        return False

    # Update database
    success = await update_database_subscription(
        client, account_id, customer_id, subscription
    )
    if not success:
        logger.error(f"Failed to update database for {email}")
        return False

    logger.info(f"✅ Successfully added {email} to pro plan")
    return True


async def main():
    """Main function."""
    if len(sys.argv) < 2:
        print(
            "Usage: python scripts/add_user_to_pro_plan.py user@example.com [user2@example.com ...]"
        )
        sys.exit(1)

    emails = sys.argv[1:]

    logger.info("Starting user migration to pro plan")
    logger.info(f"Environment: {config.ENV_MODE}")
    logger.info(f"Pro plan price ID: {config.STRIPE_PRO_75_ID}")
    logger.info(f"Emails to migrate: {', '.join(emails)}")

    # Initialize database connection
    db = DBConnection()
    client = await db.client

    successful_migrations = 0
    failed_migrations = 0

    for email in emails:
        try:
            success = await add_user_to_pro_plan(client, email.strip())
            if success:
                successful_migrations += 1
            else:
                failed_migrations += 1
        except Exception as e:
            failed_migrations += 1
            logger.error(f"❌ Error migrating {email}: {str(e)}")

        # Add a small delay between migrations
        await asyncio.sleep(1)

    logger.info(f"\nMigration complete!")
    logger.info(f"Successful migrations: {successful_migrations}")
    logger.info(f"Failed migrations: {failed_migrations}")

    if failed_migrations > 0:
        logger.warning("Some migrations failed. Please check the logs above.")
        sys.exit(1)
    else:
        logger.info("All migrations completed successfully!")


if __name__ == "__main__":
    asyncio.run(main())

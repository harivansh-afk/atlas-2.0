#!/usr/bin/env python3
"""
Script to migrate existing Stripe customers to the new pro plan for free.

This script takes existing Stripe customer IDs and creates free subscriptions
to the new pro plan without charging them.

Usage:
    python scripts/migrate_existing_customers.py

Customer IDs to migrate:
- cus_SRfNhFRC8cQbeB (jugal)
- cus_SLXL3KpNtSYYYN (alex)
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

# Customer IDs to migrate
CUSTOMERS_TO_MIGRATE = [
    {"customer_id": "cus_SRfNhFRC8cQbeB", "name": "jugal"},
    {"customer_id": "cus_SLXL3KpNtSYYYN", "name": "alex"},
]


async def get_user_by_customer_id(client, customer_id: str):
    """Get user information from database by Stripe customer ID."""
    try:
        result = (
            await client.schema("basejump")
            .from_("billing_customers")
            .select("account_id, email, active")
            .eq("id", customer_id)
            .execute()
        )

        if result.data and len(result.data) > 0:
            return result.data[0]
        return None
    except Exception as e:
        logger.error(f"Error getting user by customer ID {customer_id}: {str(e)}")
        return None


async def create_free_subscription(customer_id: str, price_id: str):
    """Create a free subscription for the customer."""
    try:
        # Create subscription with 100% discount coupon
        subscription = stripe.Subscription.create(
            customer=customer_id,
            items=[{"price": price_id}],
            coupon=None,  # We'll create a 100% discount instead
            trial_period_days=None,
            metadata={
                "migration": "true",
                "migration_date": datetime.now(timezone.utc).isoformat(),
                "migration_reason": "Early customer migration to pro plan",
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


async def create_discount_coupon():
    """Create a 100% discount coupon for migrations."""
    try:
        coupon = stripe.Coupon.create(
            percent_off=100,
            duration="forever",
            name="Early Customer Migration",
            id="early_customer_migration_100_off",
        )
        logger.info(f"Created coupon: {coupon.id}")
        return coupon.id
    except stripe.error.InvalidRequestError as e:
        if "already exists" in str(e):
            logger.info("Coupon already exists, using existing one")
            return "early_customer_migration_100_off"
        else:
            logger.error(f"Error creating coupon: {str(e)}")
            return None
    except Exception as e:
        logger.error(f"Error creating coupon: {str(e)}")
        return None


async def update_database_subscription(client, customer_id: str, subscription):
    """Update the database with the new subscription information."""
    try:
        # First, get the account_id for this customer
        customer_result = (
            await client.schema("basejump")
            .from_("billing_customers")
            .select("account_id")
            .eq("id", customer_id)
            .execute()
        )

        if not customer_result.data or len(customer_result.data) == 0:
            logger.error(f"No account found for customer {customer_id}")
            return False

        account_id = customer_result.data[0]["account_id"]

        # Insert subscription record
        subscription_data = {
            "id": subscription.id,
            "account_id": account_id,
            "billing_customer_id": customer_id,
            "status": subscription.status,
            "price_id": config.STRIPE_PRO_75_ID,
            "plan_name": "pro_75",
            "quantity": 1,
            "cancel_at_period_end": False,
            "current_period_start": datetime.fromtimestamp(
                subscription.current_period_start, tz=timezone.utc
            ),
            "current_period_end": datetime.fromtimestamp(
                subscription.current_period_end, tz=timezone.utc
            ),
            "metadata": subscription.metadata,
        }

        result = (
            await client.schema("basejump")
            .from_("billing_subscriptions")
            .insert(subscription_data)
            .execute()
        )

        # Update customer as active
        await client.schema("basejump").from_("billing_customers").update(
            {"active": True}
        ).eq("id", customer_id).execute()

        logger.info(f"Updated database for customer {customer_id}")
        return True

    except Exception as e:
        logger.error(f"Error updating database for customer {customer_id}: {str(e)}")
        return False


async def migrate_customer(client, customer_info):
    """Migrate a single customer to the pro plan."""
    customer_id = customer_info["customer_id"]
    name = customer_info["name"]

    logger.info(f"Starting migration for {name} (customer: {customer_id})")

    # Check if customer exists in Stripe
    try:
        stripe_customer = stripe.Customer.retrieve(customer_id)
        logger.info(f"Found Stripe customer: {stripe_customer.email}")
    except Exception as e:
        logger.error(f"Customer {customer_id} not found in Stripe: {str(e)}")
        return False

    # Check if customer exists in our database
    user_data = await get_user_by_customer_id(client, customer_id)
    if not user_data:
        logger.warning(f"Customer {customer_id} not found in our database")
        # We'll still create the subscription in Stripe for when they sign up
    else:
        logger.info(f"Found user in database: {user_data['email']}")

    # Check if customer already has an active subscription to our product
    try:
        existing_subscriptions = stripe.Subscription.list(
            customer=customer_id, status="active", price=config.STRIPE_PRO_75_ID
        )

        if existing_subscriptions.data:
            logger.info(f"Customer {customer_id} already has an active subscription")
            return True
    except Exception as e:
        logger.error(f"Error checking existing subscriptions: {str(e)}")

    # Create 100% discount coupon if it doesn't exist
    coupon_id = await create_discount_coupon()
    if not coupon_id:
        logger.error("Failed to create discount coupon")
        return False

    # Create free subscription
    try:
        subscription = stripe.Subscription.create(
            customer=customer_id,
            items=[{"price": config.STRIPE_PRO_75_ID}],
            discounts=[{"coupon": coupon_id}],
            metadata={
                "migration": "true",
                "migration_date": datetime.now(timezone.utc).isoformat(),
                "migration_reason": "Early customer migration to pro plan",
                "customer_name": name,
            },
        )

        logger.info(f"Created free subscription {subscription.id} for {name}")

        # Update database if user exists
        if user_data:
            success = await update_database_subscription(
                client, customer_id, subscription
            )
            if success:
                logger.info(f"Successfully migrated {name} to pro plan")
            else:
                logger.error(f"Failed to update database for {name}")
                return False
        else:
            logger.info(
                f"Subscription created in Stripe for {name}, will sync to database when they sign up"
            )

        return True

    except Exception as e:
        logger.error(f"Error creating subscription for {name}: {str(e)}")
        return False


async def main():
    """Main migration function."""
    logger.info("Starting customer migration to pro plan")
    logger.info(f"Environment: {config.ENV_MODE}")
    logger.info(f"Pro plan price ID: {config.STRIPE_PRO_75_ID}")

    # Initialize database connection
    db = DBConnection()
    client = await db.client

    successful_migrations = 0
    failed_migrations = 0

    for customer_info in CUSTOMERS_TO_MIGRATE:
        try:
            success = await migrate_customer(client, customer_info)
            if success:
                successful_migrations += 1
                logger.info(f"✅ Successfully migrated {customer_info['name']}")
            else:
                failed_migrations += 1
                logger.error(f"❌ Failed to migrate {customer_info['name']}")
        except Exception as e:
            failed_migrations += 1
            logger.error(f"❌ Error migrating {customer_info['name']}: {str(e)}")

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

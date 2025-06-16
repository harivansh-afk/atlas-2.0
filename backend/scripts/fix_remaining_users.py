#!/usr/bin/env python3
"""
Script to fix the remaining users that need pro plan access.
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
        # Try to find user in auth.users
        users = await client.auth.admin.list_users()
        
        for user in users:
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
        result = await client.schema("basejump").from_("accounts").select(
            "id"
        ).eq("primary_owner_user_id", user_id).eq("personal_account", True).execute()
        
        if result.data and len(result.data) > 0:
            return result.data[0]["id"]
        
        logger.error(f"No personal account found for user {user_id}")
        return None
        
    except Exception as e:
        logger.error(f"Error getting account ID for user {user_id}: {str(e)}")
        return None

async def create_discount_coupon():
    """Create a 100% discount coupon for migrations."""
    try:
        coupon = stripe.Coupon.create(
            percent_off=100,
            duration="forever",
            name="Pro Plan Migration Fix",
            id="pro_plan_migration_fix_100_off"
        )
        logger.info(f"Created coupon: {coupon.id}")
        return coupon.id
    except stripe.error.InvalidRequestError as e:
        if "already exists" in str(e):
            logger.info("Coupon already exists, using existing one")
            return "pro_plan_migration_fix_100_off"
        else:
            logger.error(f"Error creating coupon: {str(e)}")
            return None
    except Exception as e:
        logger.error(f"Error creating coupon: {str(e)}")
        return None

async def fix_rathiharivansh(client):
    """Fix rathiharivansh@gmail.com by creating a new live mode customer."""
    email = "rathiharivansh@gmail.com"
    print(f"\n=== Fixing {email} ===")
    
    # Find user
    user = await find_user_by_email(client, email)
    if not user:
        print(f"❌ User {email} not found in auth.users")
        return False
    
    user_id = user.id
    account_id = await get_user_account_id(client, user_id)
    if not account_id:
        print(f"❌ No account found for user {user_id}")
        return False
    
    print(f"✅ Found user and account: {account_id}")
    
    # Delete the old test mode customer record
    try:
        await client.schema("basejump").from_("billing_customers").delete().eq(
            "account_id", account_id
        ).execute()
        print("🗑️  Deleted old test mode customer record")
    except Exception as e:
        print(f"⚠️  Could not delete old customer record: {e}")
    
    # Create new Stripe customer
    try:
        customer = stripe.Customer.create(
            email=email,
            metadata={"user_id": user_id, "migration": "true", "fix": "test_mode_issue"}
        )
        print(f"✅ Created new Stripe customer: {customer.id}")
        
        # Store new customer in database
        await client.schema("basejump").from_("billing_customers").insert({
            "id": customer.id,
            "account_id": account_id,
            "email": email,
            "active": True,
            "provider": "stripe"
        }).execute()
        print("✅ Stored new customer in database")
        
        # Create discount coupon
        coupon_id = await create_discount_coupon()
        if not coupon_id:
            print("❌ Failed to create discount coupon")
            return False
        
        # Create free subscription
        subscription = stripe.Subscription.create(
            customer=customer.id,
            items=[{"price": config.STRIPE_PRO_75_ID}],
            discounts=[{"coupon": coupon_id}],
            metadata={
                "migration": "true",
                "migration_date": datetime.now(timezone.utc).isoformat(),
                "migration_reason": "Fix test mode customer issue",
                "user_email": email
            }
        )
        print(f"✅ Created subscription: {subscription.id}")
        
        # Store subscription in database
        subscription_data = {
            "id": subscription.id,
            "account_id": account_id,
            "billing_customer_id": customer.id,
            "status": subscription.status,
            "price_id": config.STRIPE_PRO_75_ID,
            "plan_name": "pro_75",
            "quantity": 1,
            "cancel_at_period_end": subscription.cancel_at_period_end,
            "metadata": subscription.metadata or {}
        }
        
        # Add period dates if they exist
        if hasattr(subscription, 'current_period_start') and subscription.current_period_start:
            subscription_data["current_period_start"] = datetime.fromtimestamp(
                subscription.current_period_start, tz=timezone.utc
            )
        
        if hasattr(subscription, 'current_period_end') and subscription.current_period_end:
            subscription_data["current_period_end"] = datetime.fromtimestamp(
                subscription.current_period_end, tz=timezone.utc
            )
        
        await client.schema("basejump").from_("billing_subscriptions").insert(
            subscription_data
        ).execute()
        
        print(f"✅ Successfully fixed {email} - now has pro plan access!")
        return True
        
    except Exception as e:
        print(f"❌ Error fixing {email}: {str(e)}")
        return False

async def check_asomers(client):
    """Check if asomers205@gmail.com exists and try to migrate."""
    email = "asomers205@gmail.com"
    print(f"\n=== Checking {email} ===")
    
    # Find user
    user = await find_user_by_email(client, email)
    if not user:
        print(f"❌ User {email} not found in auth.users")
        print(f"   This user needs to sign up for an account first")
        return False
    
    # If user exists, try to migrate them
    print(f"✅ User found, attempting migration...")
    
    user_id = user.id
    account_id = await get_user_account_id(client, user_id)
    if not account_id:
        print(f"❌ No account found for user {user_id}")
        return False
    
    # Create Stripe customer and subscription (similar to rathiharivansh fix)
    try:
        customer = stripe.Customer.create(
            email=email,
            metadata={"user_id": user_id, "migration": "true"}
        )
        print(f"✅ Created Stripe customer: {customer.id}")
        
        # Store customer in database
        await client.schema("basejump").from_("billing_customers").insert({
            "id": customer.id,
            "account_id": account_id,
            "email": email,
            "active": True,
            "provider": "stripe"
        }).execute()
        
        # Create discount coupon
        coupon_id = await create_discount_coupon()
        if not coupon_id:
            print("❌ Failed to create discount coupon")
            return False
        
        # Create free subscription
        subscription = stripe.Subscription.create(
            customer=customer.id,
            items=[{"price": config.STRIPE_PRO_75_ID}],
            discounts=[{"coupon": coupon_id}],
            metadata={
                "migration": "true",
                "migration_date": datetime.now(timezone.utc).isoformat(),
                "migration_reason": "Pro plan migration by email",
                "user_email": email
            }
        )
        
        # Store subscription in database
        subscription_data = {
            "id": subscription.id,
            "account_id": account_id,
            "billing_customer_id": customer.id,
            "status": subscription.status,
            "price_id": config.STRIPE_PRO_75_ID,
            "plan_name": "pro_75",
            "quantity": 1,
            "cancel_at_period_end": subscription.cancel_at_period_end,
            "metadata": subscription.metadata or {}
        }
        
        await client.schema("basejump").from_("billing_subscriptions").insert(
            subscription_data
        ).execute()
        
        print(f"✅ Successfully migrated {email} to pro plan!")
        return True
        
    except Exception as e:
        print(f"❌ Error migrating {email}: {str(e)}")
        return False

async def main():
    """Main function."""
    print("=== Fixing Remaining Users ===")
    
    # Initialize database connection
    db = DBConnection()
    client = await db.client
    
    # Fix both users
    rathi_success = await fix_rathiharivansh(client)
    asomers_success = await check_asomers(client)
    
    print(f"\n=== Results ===")
    print(f"rathiharivansh@gmail.com: {'✅ Fixed' if rathi_success else '❌ Failed'}")
    print(f"asomers205@gmail.com: {'✅ Fixed' if asomers_success else '❌ Failed'}")
    
    if rathi_success and asomers_success:
        print(f"\n🎉 All users successfully migrated to pro plan!")
    elif rathi_success or asomers_success:
        print(f"\n⚠️  Partial success - some users still need attention")
    else:
        print(f"\n❌ Both users still need manual attention")

if __name__ == "__main__":
    asyncio.run(main())

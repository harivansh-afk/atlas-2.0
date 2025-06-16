#!/usr/bin/env python3
"""
Script to manually sync specific subscriptions to the database.
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

# Known subscription mappings from our verification
KNOWN_SUBSCRIPTIONS = {
    "kangjaysen@gmail.com": {
        "customer_id": "cus_SVQmtwxNYQLv16",
        "subscription_id": "sub_1RaPvUGKgx4qnTxJC0O0vsYe"
    },
    "andrew@thnkrai.com": {
        "customer_id": "cus_SVQmHjXZZEc0oE", 
        "subscription_id": "sub_1RaPvXGKgx4qnTxJalXULRhU"
    },
    "jake@keeper.ai": {
        "customer_id": "cus_SVQmHUGW2M2wKL",
        "subscription_id": "sub_1RaPvZGKgx4qnTxJtj8FEK0E"
    },
    "bw@expat-savvy.ch": {
        "customer_id": "cus_SVQmHaI9vIq5ip",
        "subscription_id": "sub_1RaPvcGKgx4qnTxJzIz62spu"
    },
    "ianbtravis210@gmail.com": {
        "customer_id": "cus_SVQmfwsURO9wTT",
        "subscription_id": "sub_1RaPvfGKgx4qnTxJMzbldPdg"
    },
    "bjf5nv@virginia.edu": {
        "customer_id": "cus_SVQmBJo6KI69Tv",
        "subscription_id": "sub_1RaPviGKgx4qnTxJ0YX8yfUQ"
    }
}

async def get_account_id_by_customer_id(client, customer_id):
    """Get account ID from customer ID."""
    try:
        result = await client.schema("basejump").from_("billing_customers").select(
            "account_id"
        ).eq("id", customer_id).execute()
        
        if result.data and len(result.data) > 0:
            return result.data[0]["account_id"]
        return None
    except Exception as e:
        logger.error(f"Error getting account ID for customer {customer_id}: {str(e)}")
        return None

async def sync_subscription_to_database(client, email, customer_id, subscription_id):
    """Sync a specific subscription to the database."""
    try:
        print(f"🔄 Syncing {email} subscription {subscription_id}")
        
        # Get account ID
        account_id = await get_account_id_by_customer_id(client, customer_id)
        if not account_id:
            print(f"❌ No account found for customer {customer_id}")
            return False
        
        # Get subscription from Stripe
        subscription = stripe.Subscription.retrieve(subscription_id)
        
        # Prepare subscription data
        subscription_data = {
            "id": subscription.id,
            "account_id": account_id,
            "billing_customer_id": customer_id,
            "status": subscription.status,
            "price_id": config.STRIPE_PRO_75_ID,  # We know these are all pro plan
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
        
        # Check if subscription already exists
        existing = await client.schema("basejump").from_("billing_subscriptions").select(
            "id"
        ).eq("id", subscription_id).execute()
        
        if existing.data and len(existing.data) > 0:
            print(f"✅ Subscription {subscription_id} already exists in database")
            return True
        
        # Insert into database
        await client.schema("basejump").from_("billing_subscriptions").insert(
            subscription_data
        ).execute()
        
        print(f"✅ Successfully synced {email} subscription to database")
        return True
        
    except Exception as e:
        print(f"❌ Error syncing {email}: {str(e)}")
        logger.error(f"Error syncing subscription {subscription_id}: {str(e)}")
        return False

async def handle_missing_users(client, emails_to_check):
    """Handle users that might not be in the database yet."""
    missing_users = []
    
    for email in emails_to_check:
        if email == "asomers205@gmail.com":
            # This user wasn't found in auth.users earlier
            print(f"⚠️  {email} - User not found in database, needs to sign up first")
            missing_users.append(email)
        elif email == "rathiharivansh@gmail.com":
            # This user has test mode customer ID issue
            print(f"⚠️  {email} - Has test mode customer ID, needs manual migration")
            missing_users.append(email)
    
    return missing_users

async def verify_final_state(client, emails_to_check):
    """Verify the final state of all users."""
    print(f"\n=== Final Verification ===")
    
    # Get all subscriptions from database
    result = await client.schema("basejump").from_("billing_subscriptions").select(
        "id, billing_customer_id, status, price_id, plan_name"
    ).eq("price_id", config.STRIPE_PRO_75_ID).eq("status", "active").execute()
    
    active_pro_subs = result.data if result.data else []
    
    # Get customer email mapping
    customer_result = await client.schema("basejump").from_("billing_customers").select(
        "id, email"
    ).execute()
    
    customer_emails = {c['id']: c['email'] for c in customer_result.data} if customer_result.data else {}
    
    pro_users = []
    for sub in active_pro_subs:
        customer_id = sub['billing_customer_id']
        email = customer_emails.get(customer_id, "Unknown")
        pro_users.append(email)
    
    print(f"Total active Pro plan users in database: {len(pro_users)}")
    
    success_count = 0
    for email in emails_to_check:
        if email in pro_users:
            print(f"✅ {email} - Active Pro plan")
            success_count += 1
        else:
            print(f"❌ {email} - Not on Pro plan")
    
    print(f"\nSuccessfully migrated: {success_count}/{len(emails_to_check)}")
    return success_count

async def main():
    """Main function."""
    emails_to_check = [
        "asomers205@gmail.com",
        "kangjaysen@gmail.com", 
        "andrew@thnkrai.com",
        "rathiharivansh@gmail.com",
        "jake@keeper.ai",
        "bw@expat-savvy.ch",
        "ianbtravis210@gmail.com",
        "bjf5nv@virginia.edu"
    ]
    
    print("=== Manual Subscription Sync ===")
    print(f"Target emails: {len(emails_to_check)}")
    
    # Initialize database connection
    db = DBConnection()
    client = await db.client
    
    # Handle missing users first
    missing_users = await handle_missing_users(client, emails_to_check)
    
    # Sync known subscriptions
    synced_count = 0
    for email in emails_to_check:
        if email in KNOWN_SUBSCRIPTIONS:
            sub_info = KNOWN_SUBSCRIPTIONS[email]
            success = await sync_subscription_to_database(
                client, 
                email, 
                sub_info["customer_id"], 
                sub_info["subscription_id"]
            )
            if success:
                synced_count += 1
        elif email not in missing_users:
            print(f"⚠️  {email} - No known subscription mapping")
    
    # Final verification
    final_success_count = await verify_final_state(client, emails_to_check)
    
    print(f"\n=== Summary ===")
    print(f"Subscriptions synced this run: {synced_count}")
    print(f"Total users with Pro access: {final_success_count}")
    print(f"Users needing manual attention: {len(missing_users)}")
    
    if missing_users:
        print(f"\nUsers needing manual attention:")
        for user in missing_users:
            print(f"  - {user}")

if __name__ == "__main__":
    asyncio.run(main())

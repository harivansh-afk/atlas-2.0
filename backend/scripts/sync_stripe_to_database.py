#!/usr/bin/env python3
"""
Script to sync Stripe subscriptions to the database.
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

async def sync_stripe_subscriptions_to_database(client):
    """Sync all Stripe subscriptions to the database."""
    print("=== Syncing Stripe Subscriptions to Database ===")
    
    # Get all billing customers from database
    result = await client.schema("basejump").from_("billing_customers").select(
        "id, account_id, email"
    ).execute()
    
    if not result.data:
        print("❌ No billing customers found in database")
        return
    
    db_customers = {c['id']: c for c in result.data}
    print(f"Found {len(db_customers)} billing customers in database")
    
    # Get existing subscriptions from database
    sub_result = await client.schema("basejump").from_("billing_subscriptions").select(
        "id, billing_customer_id"
    ).execute()
    
    existing_subs = set()
    if sub_result.data:
        existing_subs = {sub['id'] for sub in sub_result.data}
    
    print(f"Found {len(existing_subs)} existing subscriptions in database")
    
    synced_count = 0
    skipped_count = 0
    
    for customer_id, customer_data in db_customers.items():
        print(f"\n--- Checking {customer_data['email']} ({customer_id}) ---")
        
        try:
            # Get subscriptions from Stripe
            stripe_subs = stripe.Subscription.list(customer=customer_id, limit=10)
            
            if not stripe_subs.data:
                print("   No subscriptions in Stripe")
                continue
            
            print(f"   Found {len(stripe_subs.data)} subscription(s) in Stripe")
            
            for sub in stripe_subs.data:
                if sub.id in existing_subs:
                    print(f"   ✅ Subscription {sub.id} already in database")
                    skipped_count += 1
                    continue
                
                print(f"   🔄 Syncing subscription {sub.id}")
                
                # Get the price ID from the first item
                price_id = None
                if sub.items and sub.items.data:
                    price_id = sub.items.data[0].price.id
                
                # Determine plan name
                plan_name = "unknown"
                if price_id == config.STRIPE_PRO_75_ID:
                    plan_name = "pro_75"
                elif price_id:
                    plan_name = "other"
                
                # Prepare subscription data
                subscription_data = {
                    "id": sub.id,
                    "account_id": customer_data['account_id'],
                    "billing_customer_id": customer_id,
                    "status": sub.status,
                    "price_id": price_id,
                    "plan_name": plan_name,
                    "quantity": 1,
                    "cancel_at_period_end": sub.cancel_at_period_end,
                    "metadata": sub.metadata or {}
                }
                
                # Add period dates if they exist
                if hasattr(sub, 'current_period_start') and sub.current_period_start:
                    subscription_data["current_period_start"] = datetime.fromtimestamp(
                        sub.current_period_start, tz=timezone.utc
                    )
                
                if hasattr(sub, 'current_period_end') and sub.current_period_end:
                    subscription_data["current_period_end"] = datetime.fromtimestamp(
                        sub.current_period_end, tz=timezone.utc
                    )
                
                # Insert into database
                try:
                    await client.schema("basejump").from_("billing_subscriptions").insert(
                        subscription_data
                    ).execute()
                    
                    print(f"   ✅ Successfully synced {sub.id} (plan: {plan_name})")
                    synced_count += 1
                    
                except Exception as e:
                    print(f"   ❌ Error syncing {sub.id}: {str(e)}")
                    logger.error(f"Error syncing subscription {sub.id}: {str(e)}")
                
        except Exception as e:
            print(f"   ❌ Error checking Stripe subscriptions: {str(e)}")
            logger.error(f"Error checking Stripe for customer {customer_id}: {str(e)}")
    
    print(f"\n=== Sync Summary ===")
    print(f"Subscriptions synced: {synced_count}")
    print(f"Subscriptions skipped (already existed): {skipped_count}")
    
    return synced_count

async def main():
    """Main function."""
    # Initialize database connection
    db = DBConnection()
    client = await db.client
    
    synced = await sync_stripe_subscriptions_to_database(client)
    
    if synced > 0:
        print(f"\n🎉 Successfully synced {synced} subscriptions!")
    else:
        print(f"\n✅ All subscriptions were already synced")

if __name__ == "__main__":
    asyncio.run(main())

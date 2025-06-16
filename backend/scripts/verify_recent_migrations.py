#!/usr/bin/env python3
"""
Script to verify recent migrations.
"""

import os
import sys
import asyncio
import stripe

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.config import config
from services.supabase import DBConnection

# Initialize Stripe
stripe.api_key = config.STRIPE_SECRET_KEY

async def check_recent_migrations(client):
    """Check the recent migrations."""
    print("=== Recent Migration Verification ===")
    
    emails_to_check = [
        "kangjaysen@gmail.com",
        "andrew@thnkrai.com", 
        "jake@keeper.ai",
        "bw@expat-savvy.ch",
        "ianbtravis210@gmail.com",
        "bjf5nv@virginia.edu"
    ]
    
    print(f"Checking {len(emails_to_check)} recently migrated users...")
    
    # Get billing customers from database
    result = await client.schema("basejump").from_("billing_customers").select(
        "id, account_id, email, active"
    ).execute()
    
    db_customers = {c['email']: c for c in result.data} if result.data else {}
    
    # Get subscriptions from database
    sub_result = await client.schema("basejump").from_("billing_subscriptions").select(
        "id, billing_customer_id, status, price_id, plan_name"
    ).execute()
    
    db_subs_by_customer = {}
    if sub_result.data:
        for sub in sub_result.data:
            customer_id = sub['billing_customer_id']
            if customer_id not in db_subs_by_customer:
                db_subs_by_customer[customer_id] = []
            db_subs_by_customer[customer_id].append(sub)
    
    successful_migrations = 0
    
    for email in emails_to_check:
        print(f"\n--- Checking {email} ---")
        
        # Check if in database
        if email in db_customers:
            customer_data = db_customers[email]
            customer_id = customer_data['id']
            print(f"✅ Found in database: {customer_id}")
            print(f"   Active: {customer_data['active']}")
            
            # Check subscriptions
            if customer_id in db_subs_by_customer:
                subs = db_subs_by_customer[customer_id]
                print(f"✅ Found {len(subs)} subscription(s):")
                
                for sub in subs:
                    print(f"   Sub ID: {sub['id']}")
                    print(f"   Status: {sub['status']}")
                    print(f"   Price ID: {sub['price_id']}")
                    print(f"   Plan: {sub['plan_name']}")
                    
                    if sub['price_id'] == config.STRIPE_PRO_75_ID and sub['status'] == 'active':
                        print(f"   🎉 SUCCESSFULLY MIGRATED TO PRO PLAN!")
                        successful_migrations += 1
                    else:
                        print(f"   ⚠️  Not on active pro plan")
            else:
                print(f"❌ No subscriptions found in database")
                
                # Check Stripe directly
                try:
                    stripe_subs = stripe.Subscription.list(customer=customer_id, limit=5)
                    if stripe_subs.data:
                        print(f"   But found {len(stripe_subs.data)} subscription(s) in Stripe")
                        for sub in stripe_subs.data:
                            print(f"   Stripe Sub: {sub.id} ({sub.status})")
                except Exception as e:
                    print(f"   Error checking Stripe: {e}")
        else:
            print(f"❌ Not found in database")
    
    print(f"\n=== Summary ===")
    print(f"Successfully migrated to Pro Plan: {successful_migrations}/{len(emails_to_check)}")
    
    # Also check total counts
    print(f"\n=== Database Totals ===")
    print(f"Total billing customers: {len(db_customers)}")
    print(f"Total subscriptions: {sum(len(subs) for subs in db_subs_by_customer.values())}")
    
    # Count pro plan users
    pro_users = 0
    for customer_id, subs in db_subs_by_customer.items():
        for sub in subs:
            if sub['price_id'] == config.STRIPE_PRO_75_ID and sub['status'] == 'active':
                pro_users += 1
                break
    
    print(f"Total active Pro plan users: {pro_users}")

async def main():
    """Main function."""
    # Initialize database connection
    db = DBConnection()
    client = await db.client
    
    await check_recent_migrations(client)

if __name__ == "__main__":
    asyncio.run(main())

#!/usr/bin/env python3
"""
Script to verify a single user's pro plan status.
"""

import os
import sys
import asyncio

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.config import config
from services.supabase import DBConnection

async def verify_user_pro_status(client, email):
    """Verify if a user has pro plan access."""
    print(f"=== Verifying {email} ===")
    
    # Get billing customer
    customer_result = await client.schema("basejump").from_("billing_customers").select(
        "id, account_id, email, active"
    ).eq("email", email).execute()
    
    if not customer_result.data:
        print(f"❌ No billing customer found for {email}")
        return False
    
    customer = customer_result.data[0]
    customer_id = customer['id']
    print(f"✅ Found billing customer: {customer_id}")
    print(f"   Active: {customer['active']}")
    
    # Get subscriptions
    sub_result = await client.schema("basejump").from_("billing_subscriptions").select(
        "id, status, price_id, plan_name"
    ).eq("billing_customer_id", customer_id).execute()
    
    if not sub_result.data:
        print(f"❌ No subscriptions found for {email}")
        return False
    
    print(f"✅ Found {len(sub_result.data)} subscription(s):")
    
    has_active_pro = False
    for sub in sub_result.data:
        print(f"   Sub ID: {sub['id']}")
        print(f"   Status: {sub['status']}")
        print(f"   Price ID: {sub['price_id']}")
        print(f"   Plan: {sub['plan_name']}")
        
        if sub['price_id'] == config.STRIPE_PRO_75_ID and sub['status'] == 'active':
            print(f"   🎉 ACTIVE PRO PLAN!")
            has_active_pro = True
        else:
            print(f"   ⚠️  Not active pro plan")
    
    return has_active_pro

async def main():
    """Main function."""
    email = "hari.test@gmail.com"
    
    # Initialize database connection
    db = DBConnection()
    client = await db.client
    
    success = await verify_user_pro_status(client, email)
    
    if success:
        print(f"\n🎉 {email} successfully has Pro plan access!")
    else:
        print(f"\n❌ {email} does not have Pro plan access")

if __name__ == "__main__":
    asyncio.run(main())

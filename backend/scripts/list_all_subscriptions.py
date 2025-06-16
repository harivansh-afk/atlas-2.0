#!/usr/bin/env python3
"""
Script to list all users and their subscription status.

This script provides a comprehensive overview of:
- All users in the database
- Their subscription status
- Billing information
- Summary statistics
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

async def get_all_users(client):
    """Get all users from auth.users."""
    try:
        users = await client.auth.admin.list_users()
        return users
    except Exception as e:
        logger.error(f"Error getting users: {str(e)}")
        return []

async def get_billing_customers(client):
    """Get all billing customers from database."""
    try:
        result = await client.schema("basejump").from_("billing_customers").select(
            "id, account_id, email, active, provider"
        ).execute()
        return result.data if result.data else []
    except Exception as e:
        logger.error(f"Error getting billing customers: {str(e)}")
        return []

async def get_billing_subscriptions(client):
    """Get all billing subscriptions from database."""
    try:
        result = await client.schema("basejump").from_("billing_subscriptions").select(
            "id, account_id, billing_customer_id, status, price_id, plan_name, quantity, cancel_at_period_end"
        ).execute()
        return result.data if result.data else []
    except Exception as e:
        logger.error(f"Error getting billing subscriptions: {str(e)}")
        return []

def get_stripe_customers():
    """Get all customers from Stripe."""
    try:
        customers = []
        has_more = True
        starting_after = None
        
        while has_more:
            params = {"limit": 100}
            if starting_after:
                params["starting_after"] = starting_after
            
            response = stripe.Customer.list(**params)
            customers.extend(response.data)
            
            has_more = response.has_more
            if has_more and response.data:
                starting_after = response.data[-1].id
        
        return customers
    except Exception as e:
        logger.error(f"Error getting Stripe customers: {str(e)}")
        return []

def get_stripe_subscriptions():
    """Get all subscriptions from Stripe."""
    try:
        subscriptions = []
        has_more = True
        starting_after = None
        
        while has_more:
            params = {"limit": 100, "status": "all"}
            if starting_after:
                params["starting_after"] = starting_after
            
            response = stripe.Subscription.list(**params)
            subscriptions.extend(response.data)
            
            has_more = response.has_more
            if has_more and response.data:
                starting_after = response.data[-1].id
        
        return subscriptions
    except Exception as e:
        logger.error(f"Error getting Stripe subscriptions: {str(e)}")
        return []

async def analyze_user_data(client):
    """Analyze all user and subscription data."""
    print("=== Fetching Data ===")
    
    # Get data from all sources
    print("📊 Getting users from auth.users...")
    auth_users = await get_all_users(client)
    print(f"   Found {len(auth_users)} users in auth.users")
    
    print("💳 Getting billing customers from database...")
    db_customers = await get_billing_customers(client)
    print(f"   Found {len(db_customers)} billing customers in database")
    
    print("📋 Getting subscriptions from database...")
    db_subscriptions = await get_billing_subscriptions(client)
    print(f"   Found {len(db_subscriptions)} subscriptions in database")
    
    print("🔗 Getting customers from Stripe...")
    stripe_customers = get_stripe_customers()
    print(f"   Found {len(stripe_customers)} customers in Stripe")
    
    print("📊 Getting subscriptions from Stripe...")
    stripe_subscriptions = get_stripe_subscriptions()
    print(f"   Found {len(stripe_subscriptions)} subscriptions in Stripe")
    
    print("\n" + "="*80)
    print("=== USER ANALYSIS ===")
    print("="*80)
    
    # Create lookup dictionaries
    db_customers_by_account = {c['account_id']: c for c in db_customers}
    db_customers_by_stripe_id = {c['id']: c for c in db_customers}
    db_subs_by_customer = {}
    for sub in db_subscriptions:
        customer_id = sub['billing_customer_id']
        if customer_id not in db_subs_by_customer:
            db_subs_by_customer[customer_id] = []
        db_subs_by_customer[customer_id].append(sub)
    
    stripe_customers_by_id = {c.id: c for c in stripe_customers}
    stripe_subs_by_customer = {}
    for sub in stripe_subscriptions:
        customer_id = sub.customer
        if customer_id not in stripe_subs_by_customer:
            stripe_subs_by_customer[customer_id] = []
        stripe_subs_by_customer[customer_id].append(sub)
    
    # Analyze each user
    user_count = 0
    users_with_billing = 0
    users_with_active_subs = 0
    users_with_pro_plan = 0
    
    print(f"\n{'#':<3} {'Email':<35} {'Status':<15} {'Plan':<10} {'Stripe ID':<20} {'Sync':<6}")
    print("-" * 95)
    
    for user in auth_users:
        user_count += 1
        email = user.email or "No email"
        user_id = user.id
        
        # Check if user has billing info
        billing_customer = db_customers_by_account.get(user_id)
        
        if billing_customer:
            users_with_billing += 1
            stripe_customer_id = billing_customer['id']
            
            # Check database subscriptions
            db_user_subs = db_subs_by_customer.get(stripe_customer_id, [])
            
            # Check Stripe subscriptions
            stripe_user_subs = stripe_subs_by_customer.get(stripe_customer_id, [])
            
            # Determine status
            active_db_subs = [s for s in db_user_subs if s['status'] == 'active']
            active_stripe_subs = [s for s in stripe_user_subs if s.status == 'active']
            
            if active_db_subs or active_stripe_subs:
                users_with_active_subs += 1
                status = "Active"
                
                # Check for pro plan
                has_pro = False
                plan_name = "Unknown"
                
                for sub in active_db_subs:
                    if sub['price_id'] == config.STRIPE_PRO_75_ID:
                        has_pro = True
                        plan_name = "Pro"
                        break
                    elif sub['plan_name']:
                        plan_name = sub['plan_name']
                
                if not has_pro:
                    for sub in active_stripe_subs:
                        if hasattr(sub, 'items') and sub.items:
                            for item in sub.items.data:
                                if item.price.id == config.STRIPE_PRO_75_ID:
                                    has_pro = True
                                    plan_name = "Pro"
                                    break
                
                if has_pro:
                    users_with_pro_plan += 1
            else:
                status = "No Active Sub"
                plan_name = "None"
            
            # Check sync status
            sync_status = "✅" if db_user_subs and stripe_user_subs else "⚠️"
            
            print(f"{user_count:<3} {email[:34]:<35} {status:<15} {plan_name:<10} {stripe_customer_id[:19]:<20} {sync_status:<6}")
        else:
            print(f"{user_count:<3} {email[:34]:<35} {'No Billing':<15} {'Free':<10} {'None':<20} {'❌':<6}")
    
    # Summary statistics
    print("\n" + "="*80)
    print("=== SUMMARY STATISTICS ===")
    print("="*80)
    print(f"📊 Total Users in Database: {user_count}")
    print(f"💳 Users with Billing Setup: {users_with_billing}")
    print(f"📋 Users with Active Subscriptions: {users_with_active_subs}")
    print(f"⭐ Users on Pro Plan: {users_with_pro_plan}")
    print(f"🆓 Free Users: {user_count - users_with_active_subs}")
    
    print(f"\n📈 Conversion Rates:")
    if user_count > 0:
        print(f"   Billing Setup Rate: {(users_with_billing/user_count)*100:.1f}%")
        print(f"   Subscription Rate: {(users_with_active_subs/user_count)*100:.1f}%")
        print(f"   Pro Plan Rate: {(users_with_pro_plan/user_count)*100:.1f}%")
    
    # Stripe-only customers (not in our database)
    print(f"\n🔗 Stripe Analysis:")
    print(f"   Total Stripe Customers: {len(stripe_customers)}")
    print(f"   Total Stripe Subscriptions: {len(stripe_subscriptions)}")
    
    # Find Stripe customers not in our database
    stripe_only_customers = []
    for stripe_customer in stripe_customers:
        if stripe_customer.id not in db_customers_by_stripe_id:
            stripe_only_customers.append(stripe_customer)
    
    if stripe_only_customers:
        print(f"\n⚠️  Stripe customers NOT in our database: {len(stripe_only_customers)}")
        for customer in stripe_only_customers[:10]:  # Show first 10
            print(f"   - {customer.email} ({customer.id})")
        if len(stripe_only_customers) > 10:
            print(f"   ... and {len(stripe_only_customers) - 10} more")

async def main():
    """Main function."""
    print("=== SUBSCRIPTION ANALYSIS REPORT ===")
    print(f"Environment: {config.ENV_MODE}")
    print(f"Pro Plan Price ID: {config.STRIPE_PRO_75_ID}")
    print(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Initialize database connection
    db = DBConnection()
    client = await db.client
    
    await analyze_user_data(client)
    
    print(f"\n{'='*80}")
    print("Report completed successfully! 🎉")

if __name__ == "__main__":
    asyncio.run(main())

#!/usr/bin/env python3
"""
Script to check if customers exist in the database and sync them if needed.
"""

import os
import sys
import asyncio
import stripe

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.config import config
from utils.logger import logger
from services.supabase import DBConnection

# Initialize Stripe
stripe.api_key = config.STRIPE_SECRET_KEY

async def check_customer_in_database(client, customer_id: str, customer_name: str):
    """Check if a customer exists in our database."""
    try:
        print(f"\n=== Checking {customer_name} in database ===")
        
        # Check billing_customers table
        result = await client.schema("basejump").from_("billing_customers").select(
            "id, account_id, email, active, provider"
        ).eq("id", customer_id).execute()
        
        if result.data and len(result.data) > 0:
            customer_data = result.data[0]
            print(f"✅ Found in billing_customers:")
            print(f"  Customer ID: {customer_data['id']}")
            print(f"  Account ID: {customer_data['account_id']}")
            print(f"  Email: {customer_data['email']}")
            print(f"  Active: {customer_data['active']}")
            print(f"  Provider: {customer_data['provider']}")
            
            # Check if they have subscriptions in database
            sub_result = await client.schema("basejump").from_("billing_subscriptions").select(
                "id, status, price_id, plan_name"
            ).eq("billing_customer_id", customer_id).execute()
            
            if sub_result.data and len(sub_result.data) > 0:
                print(f"✅ Found {len(sub_result.data)} subscription(s) in database:")
                for sub in sub_result.data:
                    print(f"  Sub ID: {sub['id']}")
                    print(f"  Status: {sub['status']}")
                    print(f"  Price ID: {sub['price_id']}")
                    print(f"  Plan: {sub['plan_name']}")
            else:
                print(f"❌ No subscriptions found in database")
                return False
            
            return True
        else:
            print(f"❌ Not found in billing_customers table")
            return False
            
    except Exception as e:
        print(f"❌ Error checking database: {str(e)}")
        return False

async def sync_customer_to_database(client, customer_id: str, customer_name: str):
    """Sync a Stripe customer to our database."""
    try:
        print(f"\n=== Syncing {customer_name} to database ===")
        
        # Get customer from Stripe
        customer = stripe.Customer.retrieve(customer_id)
        email = customer.email
        
        print(f"Stripe customer email: {email}")
        
        # Find user by email in auth.users
        try:
            users = await client.auth.admin.list_users()
            user_found = None
            
            for user in users:
                if user.email and user.email.lower() == email.lower():
                    user_found = user
                    break
            
            if not user_found:
                print(f"❌ User with email {email} not found in auth.users")
                print(f"   They need to sign up first before we can sync them")
                return False
            
            user_id = user_found.id
            print(f"✅ Found user in auth.users: {user_id}")
            
            # Get their account ID (personal account)
            account_result = await client.schema("basejump").from_("accounts").select(
                "id"
            ).eq("primary_owner_user_id", user_id).eq("personal_account", True).execute()
            
            if not account_result.data:
                print(f"❌ No personal account found for user {user_id}")
                return False
            
            account_id = account_result.data[0]["id"]
            print(f"✅ Found account: {account_id}")
            
            # Insert customer into billing_customers
            customer_data = {
                "id": customer_id,
                "account_id": account_id,
                "email": email,
                "active": True,
                "provider": "stripe"
            }
            
            await client.schema("basejump").from_("billing_customers").upsert(
                customer_data
            ).execute()
            
            print(f"✅ Synced customer to billing_customers")
            
            # Get active subscriptions from Stripe and sync them
            subscriptions = stripe.Subscription.list(
                customer=customer_id,
                status='active'
            )
            
            for sub in subscriptions.data:
                subscription = stripe.Subscription.retrieve(sub.id)
                
                # Get the price ID from the first item
                if subscription['items']['data']:
                    price_id = subscription['items']['data'][0]['price']['id']
                    
                    # Determine plan name
                    plan_name = "pro_75" if price_id == config.STRIPE_PRO_75_ID else "unknown"
                    
                    subscription_data = {
                        "id": subscription.id,
                        "account_id": account_id,
                        "billing_customer_id": customer_id,
                        "status": subscription.status,
                        "price_id": price_id,
                        "plan_name": plan_name,
                        "quantity": 1,
                        "cancel_at_period_end": subscription.cancel_at_period_end,
                        "metadata": subscription.metadata or {}
                    }
                    
                    await client.schema("basejump").from_("billing_subscriptions").upsert(
                        subscription_data
                    ).execute()
                    
                    print(f"✅ Synced subscription {subscription.id} (plan: {plan_name})")
            
            return True
            
        except Exception as e:
            print(f"❌ Error during sync: {str(e)}")
            return False
            
    except Exception as e:
        print(f"❌ Error syncing customer: {str(e)}")
        return False

async def main():
    """Main function."""
    print("=== Database Sync Check ===")
    
    # Initialize database connection
    db = DBConnection()
    client = await db.client
    
    customers = [
        {"id": "cus_SRfNhFRC8cQbeB", "name": "jugal"},
        {"id": "cus_SLXL3KpNtSYYYN", "name": "alex"}
    ]
    
    for customer in customers:
        customer_id = customer["id"]
        customer_name = customer["name"]
        
        # Check if customer exists in database
        exists = await check_customer_in_database(client, customer_id, customer_name)
        
        if not exists:
            print(f"\n🔄 Attempting to sync {customer_name} to database...")
            success = await sync_customer_to_database(client, customer_id, customer_name)
            
            if success:
                print(f"✅ Successfully synced {customer_name}")
            else:
                print(f"❌ Failed to sync {customer_name}")
        else:
            print(f"✅ {customer_name} is already properly synced")

if __name__ == "__main__":
    asyncio.run(main())

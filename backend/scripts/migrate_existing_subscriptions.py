#!/usr/bin/env python3
"""
Script to migrate existing customer subscriptions to the new pro plan.

This script modifies existing subscriptions to use the new pro plan price ID.
"""

import os
import sys
import stripe
from datetime import datetime

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.config import config
from utils.logger import logger

# Initialize Stripe
stripe.api_key = config.STRIPE_SECRET_KEY

def migrate_subscription(customer_id: str, customer_name: str):
    """Migrate a customer's subscription to the new pro plan."""
    try:
        print(f"\n=== Migrating {customer_name} ({customer_id}) ===")
        
        # Get customer
        customer = stripe.Customer.retrieve(customer_id)
        print(f"Customer email: {customer.email}")
        
        # Get active subscriptions
        subscriptions = stripe.Subscription.list(
            customer=customer_id,
            status='active',
            limit=10
        )
        
        if not subscriptions.data:
            print("❌ No active subscriptions found")
            return False
        
        print(f"Found {len(subscriptions.data)} active subscription(s)")
        
        for sub in subscriptions.data:
            print(f"\nProcessing subscription: {sub.id}")
            print(f"Status: {sub.status}")
            
            # Get subscription details
            subscription = stripe.Subscription.retrieve(sub.id)
            
            # Check if already on our pro plan
            current_items = []
            for item in subscription['items']['data']:
                price_id = item['price']['id']
                current_items.append({
                    'id': item['id'],
                    'price_id': price_id,
                    'quantity': item.get('quantity', 1)
                })
                print(f"  Current price: {price_id}")
                
                if price_id == config.STRIPE_PRO_75_ID:
                    print(f"  ✅ Already on our pro plan!")
                    return True
            
            # Modify subscription to use our pro plan
            print(f"  🔄 Updating to pro plan: {config.STRIPE_PRO_75_ID}")
            
            # Create new subscription items for our pro plan
            new_items = []
            for item in current_items:
                new_items.append({
                    'id': item['id'],
                    'price': config.STRIPE_PRO_75_ID,
                    'quantity': 1
                })
            
            # Update the subscription
            updated_subscription = stripe.Subscription.modify(
                subscription.id,
                items=new_items,
                proration_behavior='none',  # Don't charge for the change
                metadata={
                    'migration': 'true',
                    'migration_date': datetime.now().isoformat(),
                    'original_customer': customer_name,
                    'migration_reason': 'Existing customer migration to new pro plan'
                }
            )
            
            print(f"  ✅ Successfully updated subscription {updated_subscription.id}")
            print(f"  New status: {updated_subscription.status}")
            
            # Verify the change
            for item in updated_subscription['items']['data']:
                print(f"  New price: {item['price']['id']}")
            
            return True
            
    except Exception as e:
        print(f"❌ Error migrating {customer_name}: {str(e)}")
        logger.error(f"Error migrating {customer_name}: {str(e)}")
        return False

def main():
    """Main migration function."""
    print("=== Existing Customer Subscription Migration ===")
    print(f"Environment: {config.ENV_MODE}")
    print(f"Target pro plan price ID: {config.STRIPE_PRO_75_ID}")
    
    customers = [
        {"id": "cus_SRfNhFRC8cQbeB", "name": "jugal"},
        {"id": "cus_SLXL3KpNtSYYYN", "name": "alex"}
    ]
    
    successful = 0
    failed = 0
    
    for customer in customers:
        try:
            success = migrate_subscription(customer["id"], customer["name"])
            if success:
                successful += 1
            else:
                failed += 1
        except Exception as e:
            print(f"❌ Unexpected error with {customer['name']}: {str(e)}")
            failed += 1
    
    print(f"\n=== Migration Summary ===")
    print(f"Successful: {successful}")
    print(f"Failed: {failed}")
    
    if failed == 0:
        print("🎉 All customers successfully migrated!")
    else:
        print("⚠️ Some migrations failed - check logs above")

if __name__ == "__main__":
    main()

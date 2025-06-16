#!/usr/bin/env python3
"""
Simple verification script to check customer subscriptions.
"""

import os
import sys
import stripe

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.config import config

# Initialize Stripe
stripe.api_key = config.STRIPE_SECRET_KEY

def main():
    print("=== Simple Customer Check ===")
    print(f"Pro plan price ID: {config.STRIPE_PRO_75_ID}")
    
    customers = ["cus_SRfNhFRC8cQbeB", "cus_SLXL3KpNtSYYYN"]
    
    for customer_id in customers:
        print(f"\n--- Customer: {customer_id} ---")
        try:
            # Get customer
            customer = stripe.Customer.retrieve(customer_id)
            print(f"Email: {customer.email}")
            
            # Get subscriptions
            subs = stripe.Subscription.list(customer=customer_id)
            print(f"Total subscriptions: {len(subs.data)}")
            
            for sub in subs.data:
                print(f"  Sub ID: {sub.id}")
                print(f"  Status: {sub.status}")
                
                # Get the subscription with expanded items
                full_sub = stripe.Subscription.retrieve(sub.id, expand=['items.data.price'])
                
                for item in full_sub.items.data:
                    price_id = item.price.id
                    amount = item.price.unit_amount
                    print(f"    Price ID: {price_id}")
                    print(f"    Amount: ${amount/100 if amount else 0}")
                    
                    if price_id == config.STRIPE_PRO_75_ID:
                        print(f"    ✅ THIS IS OUR PRO PLAN!")
                    else:
                        print(f"    ❌ Different product")
                        
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    main()

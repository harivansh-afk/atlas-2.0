#!/usr/bin/env python3
"""
Script to verify the migration results by checking Stripe subscriptions.

This script checks what subscriptions were created for the migrated customers.

Usage:
    python scripts/verify_migrations.py
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


# Initialize Stripe
stripe.api_key = config.STRIPE_SECRET_KEY

# Customer IDs to check
CUSTOMERS_TO_CHECK = [
    {"customer_id": "cus_SRfNhFRC8cQbeB", "name": "jugal"},
    {"customer_id": "cus_SLXL3KpNtSYYYN", "name": "alex"},
]


def check_customer_subscriptions(customer_id: str, name: str):
    """Check subscriptions for a customer."""
    try:
        print(f"\n=== Checking {name} (customer: {customer_id}) ===")

        # Get customer info
        customer = stripe.Customer.retrieve(customer_id)
        print(f"Customer email: {customer.email}")
        print(f"Customer created: {datetime.fromtimestamp(customer.created)}")

        # Get all subscriptions for this customer
        subscriptions = stripe.Subscription.list(customer=customer_id, limit=10)

        if not subscriptions.data:
            print("❌ No subscriptions found")
            return False

        print(f"Found {len(subscriptions.data)} subscription(s):")

        has_pro_subscription = False
        for sub in subscriptions.data:
            print(f"\n  Subscription ID: {sub.id}")
            print(f"  Status: {sub.status}")
            print(f"  Created: {datetime.fromtimestamp(sub.created)}")
            if hasattr(sub, "current_period_start") and sub.current_period_start:
                print(
                    f"  Current period: {datetime.fromtimestamp(sub.current_period_start)} - {datetime.fromtimestamp(sub.current_period_end)}"
                )
            else:
                print(f"  Current period: Not available")

            # Check items
            if hasattr(sub, "items") and sub.items:
                items = sub.items.data if hasattr(sub.items, "data") else sub.items
                for item in items:
                    print(f"  Price ID: {item.price.id}")
                    print(f"  Product: {item.price.product}")
                    print(
                        f"  Amount: ${item.price.unit_amount / 100 if item.price.unit_amount else 0}"
                    )

                    if item.price.id == config.STRIPE_PRO_75_ID:
                        has_pro_subscription = True
                        print("  ✅ This is our Pro plan!")
            else:
                print("  No items found in subscription")

            # Check discount
            if sub.discount:
                print(f"  Discount: {sub.discount.coupon.percent_off}% off")
                print(f"  Coupon: {sub.discount.coupon.id}")

            # Check metadata
            if sub.metadata:
                print(f"  Metadata: {dict(sub.metadata)}")

        if has_pro_subscription:
            print(f"✅ {name} has an active Pro subscription")
            return True
        else:
            print(f"❌ {name} does not have our Pro subscription")
            return False

    except Exception as e:
        print(f"❌ Error checking {name}: {str(e)}")
        return False


def check_coupons():
    """Check if our migration coupons exist."""
    try:
        print("\n=== Checking Migration Coupons ===")

        # Check for early customer migration coupon
        try:
            coupon1 = stripe.Coupon.retrieve("early_customer_migration_100_off")
            print(
                f"✅ Early customer migration coupon exists: {coupon1.percent_off}% off"
            )
        except stripe.error.InvalidRequestError:
            print("❌ Early customer migration coupon not found")

        # Check for pro plan migration coupon
        try:
            coupon2 = stripe.Coupon.retrieve("pro_plan_migration_100_off")
            print(f"✅ Pro plan migration coupon exists: {coupon2.percent_off}% off")
        except stripe.error.InvalidRequestError:
            print("❌ Pro plan migration coupon not found")

    except Exception as e:
        print(f"❌ Error checking coupons: {str(e)}")


def main():
    """Main verification function."""
    print("=== Migration Verification Report ===")
    print(f"Environment: {config.ENV_MODE}")
    print(f"Pro plan price ID: {config.STRIPE_PRO_75_ID}")
    print(f"Stripe API Key: {config.STRIPE_SECRET_KEY[:12]}...")

    # Check coupons
    check_coupons()

    # Check each customer
    successful_customers = 0
    for customer_info in CUSTOMERS_TO_CHECK:
        success = check_customer_subscriptions(
            customer_info["customer_id"], customer_info["name"]
        )
        if success:
            successful_customers += 1

    print(f"\n=== Summary ===")
    print(
        f"Customers with Pro subscriptions: {successful_customers}/{len(CUSTOMERS_TO_CHECK)}"
    )

    if successful_customers == len(CUSTOMERS_TO_CHECK):
        print("🎉 All customers successfully migrated!")
    else:
        print("⚠️  Some customers may need manual attention")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Simple test script to verify admin functionality.
"""

import asyncio
import sys
import os

# Add the backend directory to the path
sys.path.append(os.path.dirname(__file__))

from utils.admin_utils import is_admin_user_by_email, ADMIN_EMAILS

async def test_admin_detection():
    """Test admin email detection."""
    print("Testing admin email detection...")
    
    # Test admin emails
    for email in ADMIN_EMAILS:
        is_admin = await is_admin_user_by_email(email)
        print(f"  {email}: {'✅ Admin' if is_admin else '❌ Not Admin'}")
    
    # Test non-admin email
    test_email = "test@example.com"
    is_admin = await is_admin_user_by_email(test_email)
    print(f"  {test_email}: {'✅ Admin' if is_admin else '❌ Not Admin'}")
    
    print("\nAdmin emails configured:")
    for email in ADMIN_EMAILS:
        print(f"  - {email}")

if __name__ == "__main__":
    asyncio.run(test_admin_detection())

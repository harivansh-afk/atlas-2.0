"""
Admin utilities for Atlas Agents.

This module provides utilities for admin user detection and management.
"""

from typing import Optional
from utils.logger import logger
from services.supabase import DBConnection


# List of admin email addresses
ADMIN_EMAILS = [
    "rathiharivansh@gmail.com",
    "andrew@thnkrai.com",
]


async def is_admin_user(user_id: str) -> bool:
    """
    Check if a user is an admin based on their email address.
    
    Args:
        user_id: The user ID to check
        
    Returns:
        bool: True if the user is an admin, False otherwise
    """
    try:
        db = DBConnection()
        client = await db.client
        
        # Get user email from auth.users
        user_result = await client.auth.admin.get_user_by_id(user_id)
        if not user_result or not user_result.user:
            logger.warning(f"User {user_id} not found when checking admin status")
            return False
            
        user_email = user_result.user.email
        if not user_email:
            logger.warning(f"User {user_id} has no email address")
            return False
            
        is_admin = user_email.lower() in [email.lower() for email in ADMIN_EMAILS]
        logger.info(f"Admin check for user {user_id} ({user_email}): {is_admin}")
        return is_admin
        
    except Exception as e:
        logger.error(f"Error checking admin status for user {user_id}: {str(e)}")
        return False


async def is_admin_user_by_email(email: str) -> bool:
    """
    Check if an email address belongs to an admin user.
    
    Args:
        email: The email address to check
        
    Returns:
        bool: True if the email belongs to an admin, False otherwise
    """
    if not email:
        return False
        
    return email.lower() in [admin_email.lower() for admin_email in ADMIN_EMAILS]


async def get_user_email(user_id: str) -> Optional[str]:
    """
    Get the email address for a user ID.
    
    Args:
        user_id: The user ID to get the email for
        
    Returns:
        Optional[str]: The user's email address, or None if not found
    """
    try:
        db = DBConnection()
        client = await db.client
        
        user_result = await client.auth.admin.get_user_by_id(user_id)
        if not user_result or not user_result.user:
            return None
            
        return user_result.user.email
        
    except Exception as e:
        logger.error(f"Error getting email for user {user_id}: {str(e)}")
        return None

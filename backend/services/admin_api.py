"""
Admin API endpoints for Atlas Agents.

This module provides API endpoints for admin users to manage other users' subscriptions
and perform administrative tasks.
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr
import stripe
from datetime import datetime, timezone

from utils.logger import logger
from utils.config import config
from services.supabase import DBConnection
from utils.auth_utils import get_current_user_id_from_jwt
from utils.admin_utils import is_admin_user, get_user_email
from services.billing import (
    get_user_subscription,
    SUBSCRIPTION_TIERS,
    SubscriptionStatus,
    calculate_monthly_usage,
)

# Initialize router
router = APIRouter(prefix="/admin", tags=["admin"])

# Initialize Stripe
stripe.api_key = config.STRIPE_SECRET_KEY


class UserSearchRequest(BaseModel):
    email: str


class UserSearchResponse(BaseModel):
    user_id: str
    email: str
    found: bool


class UserSubscriptionResponse(BaseModel):
    user_id: str
    email: str
    subscription_status: SubscriptionStatus


class AddUserToProRequest(BaseModel):
    email: EmailStr
    duration_months: Optional[int] = 1  # Default to 1 month


class AdminStatsResponse(BaseModel):
    total_users: int
    active_subscriptions: int
    free_users: int
    pro_users: int


async def verify_admin_access(current_user_id: str) -> None:
    """Verify that the current user is an admin."""
    if not await is_admin_user(current_user_id):
        user_email = await get_user_email(current_user_id)
        logger.warning(
            f"Non-admin user {current_user_id} ({user_email}) attempted to access admin endpoint"
        )
        raise HTTPException(
            status_code=403, detail="Access denied. Admin privileges required."
        )


@router.get("/stats", response_model=AdminStatsResponse)
async def get_admin_stats(
    current_user_id: str = Depends(get_current_user_id_from_jwt),
):
    """Get admin dashboard statistics."""
    await verify_admin_access(current_user_id)

    try:
        db = DBConnection()
        client = await db.client

        # Get total users count
        users_result = await client.auth.admin.list_users()
        total_users = len(users_result) if users_result else 0

        # Get billing customers to count active subscriptions
        customers_result = (
            await client.schema("basejump")
            .from_("billing_customers")
            .select("*")
            .execute()
        )

        active_subscriptions = 0
        if customers_result.data:
            for customer in customers_result.data:
                if customer.get("active"):
                    active_subscriptions += 1

        # Calculate free vs pro users
        pro_users = active_subscriptions
        free_users = total_users - pro_users

        return AdminStatsResponse(
            total_users=total_users,
            active_subscriptions=active_subscriptions,
            free_users=free_users,
            pro_users=pro_users,
        )

    except Exception as e:
        logger.error(f"Error getting admin stats: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error getting admin stats: {str(e)}"
        )


@router.post("/search-user", response_model=UserSearchResponse)
async def search_user(
    request: UserSearchRequest,
    current_user_id: str = Depends(get_current_user_id_from_jwt),
):
    """Search for a user by email address."""
    await verify_admin_access(current_user_id)

    try:
        db = DBConnection()
        client = await db.client

        # Search for user by email
        users = await client.auth.admin.list_users()
        user_found = None

        if users:
            for user in users:
                if user.email and user.email.lower() == request.email.lower():
                    user_found = user
                    break

        if user_found:
            return UserSearchResponse(
                user_id=user_found.id,
                email=user_found.email,
                found=True,
            )
        else:
            return UserSearchResponse(
                user_id="",
                email=request.email,
                found=False,
            )

    except Exception as e:
        logger.error(f"Error searching for user {request.email}: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error searching for user: {str(e)}"
        )


@router.get("/user/{user_id}/subscription", response_model=UserSubscriptionResponse)
async def get_user_subscription_admin(
    user_id: str,
    current_user_id: str = Depends(get_current_user_id_from_jwt),
):
    """Get subscription status for any user (admin only)."""
    await verify_admin_access(current_user_id)

    try:
        # Get user email
        user_email = await get_user_email(user_id)
        if not user_email:
            raise HTTPException(status_code=404, detail="User not found")

        # Check if target user is admin
        if await is_admin_user(user_id):
            subscription_status = SubscriptionStatus(
                status="active",
                plan_name="Admin",
                price_id="admin",
                messages_limit=100000,
                current_usage=0,
                cancel_at_period_end=False,
                has_schedule=False,
            )
        else:
            # Get subscription from Stripe
            subscription = await get_user_subscription(user_id)

            if not subscription:
                # Default to free tier
                db = DBConnection()
                client = await db.client
                current_usage = await calculate_monthly_usage(client, user_id)

                free_tier_id = config.STRIPE_FREE_TIER_ID
                free_tier_info = SUBSCRIPTION_TIERS.get(free_tier_id)

                subscription_status = SubscriptionStatus(
                    status="no_subscription",
                    plan_name=(
                        free_tier_info.get("name", "free") if free_tier_info else "free"
                    ),
                    price_id=free_tier_id,
                    messages_limit=(
                        free_tier_info.get("messages") if free_tier_info else 0
                    ),
                    current_usage=current_usage,
                )
            else:
                # Extract subscription details
                current_item = subscription["items"]["data"][0]
                current_price_id = current_item["price"]["id"]
                current_tier_info = SUBSCRIPTION_TIERS.get(current_price_id)

                if not current_tier_info:
                    current_tier_info = {"name": "unknown", "messages": 0}

                db = DBConnection()
                client = await db.client
                current_usage = await calculate_monthly_usage(client, user_id)

                subscription_status = SubscriptionStatus(
                    status=subscription["status"],
                    plan_name=subscription["plan"].get("nickname")
                    or current_tier_info["name"],
                    price_id=current_price_id,
                    current_period_end=datetime.fromtimestamp(
                        current_item["current_period_end"], tz=timezone.utc
                    ),
                    cancel_at_period_end=subscription["cancel_at_period_end"],
                    trial_end=(
                        datetime.fromtimestamp(
                            subscription["trial_end"], tz=timezone.utc
                        )
                        if subscription.get("trial_end")
                        else None
                    ),
                    messages_limit=current_tier_info["messages"],
                    current_usage=current_usage,
                    has_schedule=False,
                )

        return UserSubscriptionResponse(
            user_id=user_id,
            email=user_email,
            subscription_status=subscription_status,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting subscription for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error getting user subscription: {str(e)}"
        )


@router.post("/add-user-to-pro")
async def add_user_to_pro_plan(
    request: AddUserToProRequest,
    current_user_id: str = Depends(get_current_user_id_from_jwt),
):
    """Add a user to the pro plan (admin only)."""
    await verify_admin_access(current_user_id)

    try:
        # Import the script function
        import sys
        import os

        sys.path.append(os.path.join(os.path.dirname(__file__), "..", "scripts"))

        from add_user_to_pro_plan import add_user_to_pro_plan as add_user_script

        db = DBConnection()
        client = await db.client

        success = await add_user_script(client, request.email)

        if success:
            logger.info(
                f"Admin {current_user_id} successfully added {request.email} to pro plan"
            )
            return {
                "success": True,
                "message": f"Successfully added {request.email} to pro plan",
            }
        else:
            raise HTTPException(
                status_code=400, detail=f"Failed to add {request.email} to pro plan"
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding user {request.email} to pro plan: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error adding user to pro plan: {str(e)}"
        )

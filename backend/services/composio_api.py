"""
FastAPI endpoints for Composio MCP integration proof-of-concept
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
from .composio_client import composio_client, ComposioAppInstallation

# from utils.auth_utils import get_optional_user_id  # Not needed for this POC
from utils.logger import logger

router = APIRouter(prefix="/composio", tags=["composio"])


class CreateMCPConnectionRequest(BaseModel):
    app_key: str
    user_id: Optional[str] = None  # Optional, can get from auth


class CreateMCPConnectionResponse(BaseModel):
    success: bool
    app_key: str
    mcp_url: Optional[str] = None
    session_uuid: Optional[str] = None
    error: Optional[str] = None
    message: str


class UserSessionsResponse(BaseModel):
    user_id: str
    sessions: List[Dict[str, Any]]


@router.post("/create-mcp-connection", response_model=CreateMCPConnectionResponse)
async def create_mcp_connection(
    request: CreateMCPConnectionRequest,
):
    """
    Create a dynamic MCP connection for a user and app.
    This is the main proof-of-concept endpoint.
    """
    try:
        # Use test user for now - this is a proof of concept endpoint
        user_id = request.user_id or "test_user"

        logger.info(
            f"Creating MCP connection for user {user_id}, app {request.app_key}"
        )

        # Call our Composio client
        installation = await composio_client.create_user_mcp_connection(
            user_id=user_id, app_key=request.app_key
        )

        if installation.success:
            return CreateMCPConnectionResponse(
                success=True,
                app_key=installation.app_key,
                mcp_url=installation.mcp_url,
                session_uuid=installation.session_uuid,
                message=f"Successfully created MCP connection for {request.app_key}",
            )
        else:
            return CreateMCPConnectionResponse(
                success=False,
                app_key=installation.app_key,
                error=installation.error,
                message=f"Failed to create MCP connection for {request.app_key}",
            )

    except Exception as e:
        logger.error(f"Error in create_mcp_connection: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/user-sessions", response_model=UserSessionsResponse)
async def get_user_sessions(
    user_id: Optional[str] = None,
):
    """Get all Composio sessions for a user"""
    try:
        # Use provided user_id or default to test user
        actual_user_id = user_id or "test_user"

        sessions = composio_client.get_user_sessions(actual_user_id)

        return UserSessionsResponse(
            user_id=actual_user_id,
            sessions=[
                {"uuid": session.uuid, "user_id": session.user_id, "apps": session.apps}
                for session in sessions
            ],
        )

    except Exception as e:
        logger.error(f"Error getting user sessions: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/test-app-status")
async def test_app_status(
    app_key: str,
    session_uuid: Optional[str] = None,
):
    """Test endpoint to check app status directly"""
    try:
        if not session_uuid:
            # Generate a test session
            user_id = "test_user"
            session_uuid = composio_client._generate_session_uuid(user_id)

        status = await composio_client.check_app_status(app_key, session_uuid)

        return {
            "success": True,
            "app_key": app_key,
            "session_uuid": session_uuid,
            "status": status,
        }

    except Exception as e:
        logger.error(f"Error checking app status: {e}")
        return {
            "success": False,
            "error": str(e),
            "app_key": app_key,
            "session_uuid": session_uuid,
        }


@router.delete("/cleanup-session/{session_uuid}")
async def cleanup_session(session_uuid: str):
    """Clean up a specific session"""
    try:
        success = composio_client.cleanup_session(session_uuid)

        return {
            "success": success,
            "message": f"Session {session_uuid} cleanup: {'successful' if success else 'not found'}",
        }

    except Exception as e:
        logger.error(f"Error cleaning up session: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check():
    """Health check for Composio integration"""
    return {
        "status": "healthy",
        "service": "composio_integration",
        "base_url": composio_client.base_url,
        "active_sessions": len(composio_client._sessions),
    }

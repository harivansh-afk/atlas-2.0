"""
Composio MCP Integration API Endpoints

This module provides FastAPI endpoints for integrating Composio's dynamic MCP URLs
with our existing MCP architecture and authentication flow.
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
from utils.auth_utils import get_current_user_id_from_jwt
from utils.logger import logger
from services.composio_integration import (
    composio_mcp_service,
    ComposioMCPConnection,
    composio_tool_executor,
)
from services.mcp_custom import discover_custom_tools

router = APIRouter(prefix="/composio-mcp", tags=["composio-mcp"])


class CreateMCPConnectionRequest(BaseModel):
    """Request model for creating a Composio MCP connection"""

    app_key: str  # e.g., "gmail", "slack", "github"


class CreateMCPConnectionResponse(BaseModel):
    """Response model for MCP connection creation"""

    success: bool
    app_key: str
    qualified_name: Optional[str] = None
    mcp_url: Optional[str] = None
    auth_url: Optional[str] = None
    session_uuid: Optional[str] = None
    error: Optional[str] = None
    message: str


class ListUserConnectionsResponse(BaseModel):
    """Response model for listing user's Composio MCP connections"""

    success: bool
    connections: List[Dict[str, Any]]
    total: int


class DiscoverComposioToolsRequest(BaseModel):
    """Request model for discovering tools from a Composio MCP connection"""

    app_key: str  # e.g., "gmail", "slack", "github"


class DiscoverComposioToolsResponse(BaseModel):
    """Response model for Composio MCP tool discovery"""

    success: bool
    app_key: str
    tools: List[Dict[str, Any]]
    count: int
    mcp_url: Optional[str] = None
    error: Optional[str] = None


class UpdateComposioToolsRequest(BaseModel):
    """Request model for updating selected tools for a Composio MCP connection"""

    app_key: str
    selected_tools: List[str]  # List of tool names to enable


class UpdateComposioToolsResponse(BaseModel):
    """Response model for updating Composio MCP tools"""

    success: bool
    app_key: str
    enabled_tools: List[str]
    message: str
    error: Optional[str] = None


class InitiateAuthRequest(BaseModel):
    """Request model for initiating authentication for a Composio MCP connection"""

    app_key: str  # e.g., "gmail", "slack", "github"


class InitiateAuthResponse(BaseModel):
    """Response model for Composio MCP authentication initiation"""

    success: bool
    app_key: str
    tool_name: str
    redirect_url: Optional[str] = None
    connection_id: Optional[str] = None
    instruction: Optional[str] = None
    message: str
    error: Optional[str] = None


@router.post("/create-connection", response_model=CreateMCPConnectionResponse)
async def create_composio_mcp_connection(
    request: CreateMCPConnectionRequest,
    user_id: str = Depends(get_current_user_id_from_jwt),
):
    """
    Create a dynamic MCP connection using Composio API.

    This endpoint:
    1. Generates a user-specific MCP URL from Composio
    2. Stores the connection in Supabase
    3. Initiates the MCP connection
    4. Returns an authentication URL for one-click auth

    Args:
        request: Contains the app_key (e.g., "gmail", "slack")
        user_id: Current user ID from JWT token

    Returns:
        Response with auth_url for frontend to redirect user to
    """
    try:
        logger.info(
            f"Creating Composio MCP connection for user {user_id}, app {request.app_key}"
        )

        # Validate app_key
        supported_apps = [
            "gmail",
            "slack",
            "github",
            "notion",
            "trello",
            "asana",
            "linear",
            "jira",
            "hubspot",
            "salesforce",
            "google-drive",
            "dropbox",
            "onedrive",
            "zoom",
            "calendar",
        ]

        if request.app_key not in supported_apps:
            logger.warning(f"Unsupported app key: {request.app_key}")
            # Don't fail - let Composio handle validation

        # Get or create the connection using our service (with persistence)
        connection = await composio_mcp_service.get_or_create_user_mcp_connection(
            user_id=user_id, app_key=request.app_key
        )

        if connection.success:
            logger.info(f"Successfully created MCP connection for {request.app_key}")
            return CreateMCPConnectionResponse(
                success=True,
                app_key=connection.app_key,
                qualified_name=connection.qualified_name,
                mcp_url=connection.mcp_url,
                auth_url=connection.auth_url,
                session_uuid=connection.session_uuid,
                message=f"Successfully created MCP connection for {request.app_key}. Use auth_url to authenticate.",
            )
        else:
            logger.error(f"Failed to create MCP connection: {connection.error}")
            return CreateMCPConnectionResponse(
                success=False,
                app_key=connection.app_key,
                error=connection.error,
                message=f"Failed to create MCP connection for {request.app_key}",
            )

    except Exception as e:
        logger.error(f"Error in create_composio_mcp_connection: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/user-connections", response_model=ListUserConnectionsResponse)
async def list_user_composio_connections(
    user_id: str = Depends(get_current_user_id_from_jwt),
):
    """
    List all Composio MCP connections for the current user.

    Returns connections stored in the mcp_oauth_tokens table with
    qualified_name starting with "composio/".
    """
    try:
        logger.info(f"Listing Composio MCP connections for user {user_id}")

        # Use the service method to get connections
        connections = await composio_mcp_service.list_user_mcp_connections(user_id)

        return ListUserConnectionsResponse(
            success=True, connections=connections, total=len(connections)
        )

    except Exception as e:
        logger.error(f"Error listing user connections: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/connection/{app_key}")
async def delete_composio_connection(
    app_key: str, user_id: str = Depends(get_current_user_id_from_jwt)
):
    """
    Delete a Composio MCP connection for the user.

    Args:
        app_key: The app key to delete (e.g., "gmail")
        user_id: Current user ID from JWT token
    """
    try:
        logger.info(
            f"Deleting Composio MCP connection for user {user_id}, app {app_key}"
        )

        # Use the service method to delete connection
        deleted = await composio_mcp_service.delete_user_mcp_connection(
            user_id, app_key
        )

        if deleted:
            return {
                "success": True,
                "message": f"Successfully deleted connection for {app_key}",
            }
        else:
            return {"success": False, "message": f"No connection found for {app_key}"}

    except Exception as e:
        logger.error(f"Error deleting connection: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/supported-apps")
async def get_supported_apps():
    """
    Get list of apps supported by Composio integration.

    This endpoint returns the apps that can be connected through Composio.
    """
    supported_apps = [
        {
            "key": "gmail",
            "name": "Gmail",
            "description": "Connect to Gmail for email management",
            "icon": "📧",
            "category": "communication",
        },
        {
            "key": "slack",
            "name": "Slack",
            "description": "Connect to Slack for team communication",
            "icon": "💬",
            "category": "communication",
        },
        {
            "key": "github",
            "name": "GitHub",
            "description": "Connect to GitHub for code management",
            "icon": "🐙",
            "category": "development",
        },
        {
            "key": "notion",
            "name": "Notion",
            "description": "Connect to Notion for note-taking and documentation",
            "icon": "📝",
            "category": "productivity",
        },
        {
            "key": "google-drive",
            "name": "Google Drive",
            "description": "Connect to Google Drive for file storage",
            "icon": "📁",
            "category": "storage",
        },
        {
            "key": "linear",
            "name": "Linear",
            "description": "Connect to Linear for issue tracking",
            "icon": "📋",
            "category": "project-management",
        },
        {
            "key": "hubspot",
            "name": "HubSpot",
            "description": "Connect to HubSpot for CRM",
            "icon": "🎯",
            "category": "sales",
        },
    ]

    return {"success": True, "apps": supported_apps, "total": len(supported_apps)}


@router.post("/discover-tools", response_model=DiscoverComposioToolsResponse)
async def discover_composio_tools(
    request: DiscoverComposioToolsRequest,
    user_id: str = Depends(get_current_user_id_from_jwt),
) -> DiscoverComposioToolsResponse:
    """
    Discover available tools from an existing Composio MCP connection.

    This endpoint reuses the existing per-agent MCP discovery architecture.
    It looks up the Composio MCP URL from the user's default agent and
    discovers available tools using the same flow as custom HTTP MCPs.
    """
    try:
        logger.info(
            f"Discovering tools for Composio app: {request.app_key}, user: {user_id}"
        )

        # Get the existing Composio MCP connection from default agent
        connection = await composio_mcp_service.get_or_create_user_mcp_connection(
            user_id, request.app_key
        )

        if not connection.success or not connection.mcp_url:
            return DiscoverComposioToolsResponse(
                success=False,
                app_key=request.app_key,
                tools=[],
                count=0,
                error="Composio MCP connection not found. Please create the connection first.",
            )

        # Use the existing discover_custom_tools function with HTTP type
        # This is the EXACT same function used for per-agent custom MCP discovery
        discovery_result = await discover_custom_tools(
            request_type="http", config={"url": connection.mcp_url}
        )

        logger.info(
            f"Discovered {len(discovery_result['tools'])} tools for {request.app_key}"
        )

        return DiscoverComposioToolsResponse(
            success=True,
            app_key=request.app_key,
            tools=discovery_result["tools"],
            count=discovery_result["count"],
            mcp_url=connection.mcp_url,
        )

    except Exception as e:
        logger.error(f"Error discovering Composio tools for {request.app_key}: {e}")
        return DiscoverComposioToolsResponse(
            success=False, app_key=request.app_key, tools=[], count=0, error=str(e)
        )


@router.post("/update-tools", response_model=UpdateComposioToolsResponse)
async def update_composio_tools(
    request: UpdateComposioToolsRequest,
    user_id: str = Depends(get_current_user_id_from_jwt),
) -> UpdateComposioToolsResponse:
    """
    Update the selected tools for a Composio MCP connection in the default agent.

    This mirrors the exact per-agent MCP tool selection flow, storing the
    selected tools in the default agent's custom_mcps enabledTools array.
    """
    try:
        logger.info(
            f"Updating tools for Composio app: {request.app_key}, user: {user_id}"
        )
        logger.info(f"Selected tools: {request.selected_tools}")

        # Update the default agent's Composio MCP with selected tools
        success = await composio_mcp_service.update_mcp_enabled_tools(
            user_id, request.app_key, request.selected_tools
        )

        if success:
            return UpdateComposioToolsResponse(
                success=True,
                app_key=request.app_key,
                enabled_tools=request.selected_tools,
                message=f"Successfully updated {len(request.selected_tools)} enabled tools for {request.app_key}",
            )
        else:
            return UpdateComposioToolsResponse(
                success=False,
                app_key=request.app_key,
                enabled_tools=[],
                message="Failed to update enabled tools",
                error="Could not update default agent configuration",
            )

    except Exception as e:
        logger.error(f"Error updating Composio tools for {request.app_key}: {e}")
        return UpdateComposioToolsResponse(
            success=False,
            app_key=request.app_key,
            enabled_tools=[],
            message="Failed to update enabled tools",
            error=str(e),
        )


@router.post("/initiate-auth", response_model=InitiateAuthResponse)
async def initiate_composio_auth(
    request: InitiateAuthRequest,
    user_id: str = Depends(get_current_user_id_from_jwt),
) -> InitiateAuthResponse:
    """
    Initiate authentication for a Composio MCP connection.

    This endpoint:
    1. Retrieves the MCP URL from the default agent's custom_mcps
    2. Connects to the Composio MCP server using HTTP client
    3. Calls the {APP}-INITIATE-CONNECTION tool dynamically
    4. Extracts and returns the authentication redirect URL

    This completes the 1-click authentication flow:
    create connection → select tools → initiate auth → get redirect URL

    Args:
        request: Contains the app_key (e.g., "gmail", "slack")
        user_id: Current user ID from JWT token

    Returns:
        Response with redirect_url for frontend to open for user authentication
    """
    try:
        logger.info(
            f"Initiating authentication for Composio app: {request.app_key}, user: {user_id}"
        )

        # Execute the initiate connection tool using our new service
        result = await composio_tool_executor.execute_initiate_connection_tool(
            user_id=user_id, app_key=request.app_key
        )

        if result.success:
            logger.info(
                f"Successfully initiated auth for {request.app_key}, redirect URL: {result.redirect_url}"
            )
            return InitiateAuthResponse(
                success=True,
                app_key=result.app_key,
                tool_name=result.tool_name,
                redirect_url=result.redirect_url,
                connection_id=result.connection_id,
                instruction=result.instruction,
                message=f"Authentication initiated for {request.app_key}. Use redirect_url to complete authentication.",
            )
        else:
            logger.error(
                f"Failed to initiate auth for {request.app_key}: {result.error}"
            )
            return InitiateAuthResponse(
                success=False,
                app_key=result.app_key,
                tool_name=result.tool_name,
                message=f"Failed to initiate authentication for {request.app_key}",
                error=result.error,
            )

    except Exception as e:
        logger.error(f"Error in initiate_composio_auth: {e}")
        return InitiateAuthResponse(
            success=False,
            app_key=request.app_key,
            tool_name=f"{request.app_key.upper()}-INITIATE-CONNECTION",
            message=f"Failed to initiate authentication for {request.app_key}",
            error=str(e),
        )


@router.get("/health")
async def health_check():
    """Health check for Composio MCP integration"""
    return {
        "status": "healthy",
        "service": "composio_mcp_integration",
        "version": "1.0.0",
    }

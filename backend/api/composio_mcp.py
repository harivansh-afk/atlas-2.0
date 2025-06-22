"""
Composio MCP Integration API Endpoints

This module provides FastAPI endpoints for integrating Composio's dynamic MCP URLs
with our existing MCP architecture and authentication flow.
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
import httpx
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


class GetSupportedAppsResponse(BaseModel):
    """Response model for getting supported Composio apps"""

    success: bool
    apps: List[Dict[str, Any]]
    total: int
    message: str


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

        # Validate app_key against official Composio API
        # We'll let Composio handle validation since they have the authoritative list
        # This allows us to support all 140+ servers without hardcoding
        logger.info(f"Creating connection for app: {request.app_key}")

        # Create the connection WITHOUT storing in Supabase (new flow)
        # Storage will happen later when user confirms tool selection
        connection = await composio_mcp_service.create_user_mcp_connection_no_storage(
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


@router.get("/supported-apps", response_model=GetSupportedAppsResponse)
async def get_supported_apps():
    """
    Get list of supported Composio apps from the official Composio API.

    This endpoint fetches all available MCP servers from mcp.composio.dev
    and returns them in our standardized format.
    """
    try:
        # Fetch apps from official Composio API
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get("https://mcp.composio.dev/api/apps")
            response.raise_for_status()
            composio_apps = response.json()

        # Transform Composio apps to our format
        supported_apps = []
        for app in composio_apps:
            # Map Composio categories to our simplified categories
            category_mapping = {
                "popular": "popular",
                "collaboration & communication": "communication",
                "developer tools & devops": "development",
                "productivity & project management": "productivity",
                "ai & machine learning": "ai",
                "analytics & data": "analytics",
                "marketing & social media": "marketing",
                "crm": "crm",
                "finance & accounting": "finance",
                "document & file management": "storage",
                "scheduling & booking": "scheduling",
                "entertainment & media": "media",
                "education & lms": "education",
                "design & creative tools": "design",
                "social": "social",
                "gaming": "gaming",
                "voice": "voice",
                "email": "email",
                "other / miscellaneous": "other",
                "workflow automation": "automation",
                "sales & customer support": "support",
                "security & compliance": "security",
                "monitoring & observability": "monitoring",
                "time tracking": "productivity",
                "url shortening": "utilities",
                "email marketing": "marketing",
                "website builders": "development",
                "browser automation": "automation",
                "testing": "development",
                "data services": "analytics",
                "financial data": "finance",
                "internet security": "security",
                "database management": "development",
                "vacation rental software": "business",
                "lead generation": "marketing",
                "sales": "sales",
                "incident management": "monitoring",
                "natural language processing": "ai",
                "web scraping": "analytics",
                "web3 development": "development",
                "compliance": "security",
                "networking": "development",
                "cdn": "development",
                "dns": "development",
            }

            # Get the primary category from meta.categories or fallback to app.category
            primary_category = "other"
            if app.get("meta", {}).get("categories"):
                primary_category = app["meta"]["categories"][0].get("name", "other")
            elif app.get("category"):
                primary_category = app["category"]

            # Map to our simplified category
            mapped_category = category_mapping.get(primary_category, "other")

            # Use icon from meta.logo or fallback to a default emoji
            icon_url = app.get("meta", {}).get("logo") or app.get("icon", "")

            supported_apps.append(
                {
                    "key": app["key"],
                    "name": app["name"],
                    "description": app.get("description", f"Connect to {app['name']}"),
                    "icon": icon_url,  # Use the actual icon URL from Composio
                    "category": mapped_category,
                    "tool_count": app.get("meta", {}).get("tool_count", 0),
                    "usage_count": app.get("usageCount", 0),
                    "popular": app.get("popular", False),
                }
            )

        logger.info(f"Fetched {len(supported_apps)} apps from Composio API")

        return GetSupportedAppsResponse(
            success=True,
            apps=supported_apps,
            total=len(supported_apps),
            message=f"Successfully fetched {len(supported_apps)} supported apps from Composio",
        )

    except Exception as e:
        logger.error(f"Error fetching apps from Composio API: {e}")
        # Fallback to a minimal set if API fails
        fallback_apps = [
            {
                "key": "gmail",
                "name": "Gmail",
                "description": "Connect to Gmail for email management",
                "icon": "https://cdn.jsdelivr.net/gh/ComposioHQ/open-logos@master/gmail.svg",
                "category": "communication",
                "tool_count": 23,
                "usage_count": 196,
                "popular": True,
            },
            {
                "key": "github",
                "name": "GitHub",
                "description": "Connect to GitHub for code management",
                "icon": "https://cdn.jsdelivr.net/gh/ComposioHQ/open-logos@master/github.png",
                "category": "development",
                "tool_count": 910,
                "usage_count": 470,
                "popular": True,
            },
            {
                "key": "slack",
                "name": "Slack",
                "description": "Connect to Slack for team communication",
                "icon": "https://cdn.jsdelivr.net/gh/ComposioHQ/open-logos@master/slack.svg",
                "category": "communication",
                "tool_count": 174,
                "usage_count": 44,
                "popular": True,
            },
        ]

        return GetSupportedAppsResponse(
            success=True,
            apps=fallback_apps,
            total=len(fallback_apps),
            message=f"Using fallback apps due to API error: {str(e)}",
        )


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

        # Get the Composio MCP connection (no storage yet)
        connection = await composio_mcp_service.create_user_mcp_connection_no_storage(
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


@router.post("/refresh-connection/{app_key}")
async def refresh_mcp_connection(
    app_key: str, user_id: str = Depends(get_current_user_id_from_jwt)
):
    """
    Refresh MCP connection after OAuth authentication is completed.

    This endpoint should be called after the user completes OAuth authentication
    to ensure the MCP server URL reflects the authenticated state.
    """
    try:
        logger.info(f"Refreshing MCP connection for user {user_id}, app {app_key}")

        success = await composio_mcp_service.refresh_mcp_connection_after_auth(
            user_id, app_key
        )

        if success:
            return {
                "success": True,
                "message": f"Successfully refreshed MCP connection for {app_key}",
                "app_key": app_key,
            }
        else:
            return {
                "success": False,
                "message": f"Failed to refresh MCP connection for {app_key}",
                "app_key": app_key,
                "error": "Could not update MCP URL after authentication",
            }

    except Exception as e:
        logger.error(f"Error refreshing MCP connection for {app_key}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/debug-session/{app_key}")
async def debug_session_uuid(
    app_key: str, user_id: str = Depends(get_current_user_id_from_jwt)
):
    """Debug endpoint to check session UUID consistency"""
    try:
        # Generate session UUID using the same method
        session_uuid = composio_mcp_service._generate_session_uuid(user_id, app_key)

        # Check what's stored in Supabase
        connections = await composio_mcp_service.list_user_mcp_connections(user_id)
        stored_connection = next(
            (conn for conn in connections if conn["app_key"] == app_key), None
        )

        return {
            "user_id": user_id,
            "app_key": app_key,
            "generated_session_uuid": session_uuid,
            "stored_connection": stored_connection,
            "mcp_url_would_be": f"https://mcp.composio.dev/partner/composio/{app_key}/mcp?customerId={session_uuid}",
        }

    except Exception as e:
        logger.error(f"Error in debug session: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check():
    """Health check for Composio MCP integration"""
    return {
        "status": "healthy",
        "service": "composio_mcp_integration",
        "version": "1.0.0",
    }

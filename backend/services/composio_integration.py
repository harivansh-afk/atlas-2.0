"""
Composio MCP Integration Service

This service integrates Composio's dynamic MCP URL generation with our existing
MCP architecture and OAuth flow.

Flow:
1. Frontend requests MCP connection for a specific app (Gmail, Slack, etc.)
2. Query Composio API to generate user-specific MCP URL
3. Store the URL in Supabase using existing agents table custom_mcps column
4. Use existing MCP client to initiate connection and get auth URL
5. Return auth URL to frontend for one-click authentication

New: ComposioMCPToolExecutor for dynamic tool execution on Composio MCP servers
"""

import httpx
import uuid
import json
import base64
import re
from typing import Dict, Any, Optional, List, Set
from dataclasses import dataclass
from fastapi import HTTPException
from utils.logger import logger
from supabase import create_client, Client
import os
from datetime import datetime, timedelta

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Production-ready Composio app configuration
COMPOSIO_SUPPORTED_APPS = {
    # Communication & Collaboration
    "gmail": {
        "name": "Gmail",
        "description": "Connect to Gmail for email management and automation",
        "icon": "📧",
        "category": "communication",
        "requires_auth": True,
        "rate_limit": 100,  # requests per minute
        "timeout": 30,
    },
    "slack": {
        "name": "Slack",
        "description": "Connect to Slack for team communication and automation",
        "icon": "💬",
        "category": "communication",
        "requires_auth": True,
        "rate_limit": 100,
        "timeout": 30,
    },
    "discord": {
        "name": "Discord",
        "description": "Connect to Discord for community management",
        "icon": "🎮",
        "category": "communication",
        "requires_auth": True,
        "rate_limit": 50,
        "timeout": 30,
    },
    "microsoft-teams": {
        "name": "Microsoft Teams",
        "description": "Connect to Microsoft Teams for collaboration",
        "icon": "👥",
        "category": "communication",
        "requires_auth": True,
        "rate_limit": 100,
        "timeout": 30,
    },
    "zoom": {
        "name": "Zoom",
        "description": "Connect to Zoom for video conferencing",
        "icon": "📹",
        "category": "communication",
        "requires_auth": True,
        "rate_limit": 50,
        "timeout": 30,
    },
    # Development & Version Control
    "github": {
        "name": "GitHub",
        "description": "Connect to GitHub for code management and automation",
        "icon": "🐙",
        "category": "development",
        "requires_auth": True,
        "rate_limit": 100,
        "timeout": 30,
    },
    "gitlab": {
        "name": "GitLab",
        "description": "Connect to GitLab for code management",
        "icon": "🦊",
        "category": "development",
        "requires_auth": True,
        "rate_limit": 100,
        "timeout": 30,
    },
    "bitbucket": {
        "name": "Bitbucket",
        "description": "Connect to Bitbucket for code management",
        "icon": "🪣",
        "category": "development",
        "requires_auth": True,
        "rate_limit": 100,
        "timeout": 30,
    },
    # Productivity & Documentation
    "notion": {
        "name": "Notion",
        "description": "Connect to Notion for note-taking and documentation",
        "icon": "📝",
        "category": "productivity",
        "requires_auth": True,
        "rate_limit": 100,
        "timeout": 30,
    },
    "google-docs": {
        "name": "Google Docs",
        "description": "Connect to Google Docs for document management",
        "icon": "📄",
        "category": "productivity",
        "requires_auth": True,
        "rate_limit": 100,
        "timeout": 30,
    },
    "google-sheets": {
        "name": "Google Sheets",
        "description": "Connect to Google Sheets for spreadsheet management",
        "icon": "📊",
        "category": "productivity",
        "requires_auth": True,
        "rate_limit": 100,
        "timeout": 30,
    },
    "airtable": {
        "name": "Airtable",
        "description": "Connect to Airtable for database management",
        "icon": "🗃️",
        "category": "productivity",
        "requires_auth": True,
        "rate_limit": 100,
        "timeout": 30,
    },
    # File Storage
    "google-drive": {
        "name": "Google Drive",
        "description": "Connect to Google Drive for file storage and management",
        "icon": "📁",
        "category": "storage",
        "requires_auth": True,
        "rate_limit": 100,
        "timeout": 30,
    },
    "dropbox": {
        "name": "Dropbox",
        "description": "Connect to Dropbox for file storage",
        "icon": "📦",
        "category": "storage",
        "requires_auth": True,
        "rate_limit": 100,
        "timeout": 30,
    },
    "onedrive": {
        "name": "OneDrive",
        "description": "Connect to OneDrive for file storage",
        "icon": "☁️",
        "category": "storage",
        "requires_auth": True,
        "rate_limit": 100,
        "timeout": 30,
    },
    # Project Management
    "linear": {
        "name": "Linear",
        "description": "Connect to Linear for issue tracking and project management",
        "icon": "📋",
        "category": "project-management",
        "requires_auth": True,
        "rate_limit": 100,
        "timeout": 30,
    },
    "jira": {
        "name": "Jira",
        "description": "Connect to Jira for issue tracking",
        "icon": "🎯",
        "category": "project-management",
        "requires_auth": True,
        "rate_limit": 100,
        "timeout": 30,
    },
    "trello": {
        "name": "Trello",
        "description": "Connect to Trello for project management",
        "icon": "📌",
        "category": "project-management",
        "requires_auth": True,
        "rate_limit": 100,
        "timeout": 30,
    },
    "asana": {
        "name": "Asana",
        "description": "Connect to Asana for project management",
        "icon": "✅",
        "category": "project-management",
        "requires_auth": True,
        "rate_limit": 100,
        "timeout": 30,
    },
    "monday": {
        "name": "Monday.com",
        "description": "Connect to Monday.com for project management",
        "icon": "📅",
        "category": "project-management",
        "requires_auth": True,
        "rate_limit": 100,
        "timeout": 30,
    },
    "clickup": {
        "name": "ClickUp",
        "description": "Connect to ClickUp for project management",
        "icon": "⚡",
        "category": "project-management",
        "requires_auth": True,
        "rate_limit": 100,
        "timeout": 30,
    },
    # Sales & CRM
    "hubspot": {
        "name": "HubSpot",
        "description": "Connect to HubSpot for CRM and marketing automation",
        "icon": "🎯",
        "category": "sales",
        "requires_auth": True,
        "rate_limit": 100,
        "timeout": 30,
    },
    "salesforce": {
        "name": "Salesforce",
        "description": "Connect to Salesforce for CRM",
        "icon": "☁️",
        "category": "sales",
        "requires_auth": True,
        "rate_limit": 100,
        "timeout": 30,
    },
    "pipedrive": {
        "name": "Pipedrive",
        "description": "Connect to Pipedrive for sales management",
        "icon": "💼",
        "category": "sales",
        "requires_auth": True,
        "rate_limit": 100,
        "timeout": 30,
    },
    # Calendar & Scheduling
    "google-calendar": {
        "name": "Google Calendar",
        "description": "Connect to Google Calendar for scheduling",
        "icon": "📅",
        "category": "productivity",
        "requires_auth": True,
        "rate_limit": 100,
        "timeout": 30,
    },
    "outlook-calendar": {
        "name": "Outlook Calendar",
        "description": "Connect to Outlook Calendar for scheduling",
        "icon": "📆",
        "category": "productivity",
        "requires_auth": True,
        "rate_limit": 100,
        "timeout": 30,
    },
    "calendly": {
        "name": "Calendly",
        "description": "Connect to Calendly for appointment scheduling",
        "icon": "🗓️",
        "category": "productivity",
        "requires_auth": True,
        "rate_limit": 100,
        "timeout": 30,
    },
}

# Rate limiting configuration
RATE_LIMIT_CONFIG = {
    "default_requests_per_minute": 60,
    "default_requests_per_hour": 1000,
    "burst_limit": 10,
    "cooldown_period": 300,  # 5 minutes
}

# Validation patterns
VALIDATION_PATTERNS = {
    "app_key": re.compile(r"^[a-z0-9\-]+$"),
    "user_id": re.compile(r"^[a-zA-Z0-9\-_]+$"),
    "session_uuid": re.compile(r"^[a-f0-9\-]{36}$"),
}


@dataclass
class ComposioMCPConnection:
    """Result of Composio MCP connection creation"""

    success: bool
    app_key: str
    mcp_url: Optional[str] = None
    session_uuid: Optional[str] = None
    auth_url: Optional[str] = None
    error: Optional[str] = None
    qualified_name: Optional[str] = None


class ComposioMCPService:
    """Service for integrating Composio MCP URLs with existing architecture"""

    def __init__(self):
        self.composio_base_url = "https://mcp.composio.dev"
        self.timeout = 30.0
        self.supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        self._rate_limit_cache: Dict[str, List[datetime]] = {}

    def validate_app_key(self, app_key: str) -> tuple[bool, Optional[str]]:
        """
        Validate app key against supported apps and format requirements.

        Returns:
            tuple: (is_valid, error_message)
        """
        if not app_key:
            return False, "App key cannot be empty"

        if not isinstance(app_key, str):
            return False, "App key must be a string"

        if len(app_key) > 50:
            return False, "App key too long (max 50 characters)"

        if not VALIDATION_PATTERNS["app_key"].match(app_key):
            return (
                False,
                "App key contains invalid characters (only lowercase letters, numbers, and hyphens allowed)",
            )

        if app_key not in COMPOSIO_SUPPORTED_APPS:
            return (
                False,
                f"Unsupported app: {app_key}. Supported apps: {', '.join(COMPOSIO_SUPPORTED_APPS.keys())}",
            )

        return True, None

    def validate_user_id(self, user_id: str) -> tuple[bool, Optional[str]]:
        """
        Validate user ID format and requirements.

        Returns:
            tuple: (is_valid, error_message)
        """
        if not user_id:
            return False, "User ID cannot be empty"

        if not isinstance(user_id, str):
            return False, "User ID must be a string"

        if len(user_id) > 100:
            return False, "User ID too long (max 100 characters)"

        if not VALIDATION_PATTERNS["user_id"].match(user_id):
            return False, "User ID contains invalid characters"

        return True, None

    def check_rate_limit(
        self, user_id: str, app_key: str
    ) -> tuple[bool, Optional[str]]:
        """
        Check if user has exceeded rate limits for the app.

        Returns:
            tuple: (is_allowed, error_message)
        """
        cache_key = f"{user_id}:{app_key}"
        now = datetime.now()

        # Get app-specific rate limit or use default
        app_config = COMPOSIO_SUPPORTED_APPS.get(app_key, {})
        rate_limit = app_config.get(
            "rate_limit", RATE_LIMIT_CONFIG["default_requests_per_minute"]
        )

        # Initialize cache for this user-app combination
        if cache_key not in self._rate_limit_cache:
            self._rate_limit_cache[cache_key] = []

        # Clean old entries (older than 1 minute)
        cutoff_time = now - timedelta(minutes=1)
        self._rate_limit_cache[cache_key] = [
            timestamp
            for timestamp in self._rate_limit_cache[cache_key]
            if timestamp > cutoff_time
        ]

        # Check if rate limit exceeded
        if len(self._rate_limit_cache[cache_key]) >= rate_limit:
            return (
                False,
                f"Rate limit exceeded for {app_key}. Max {rate_limit} requests per minute.",
            )

        # Add current request to cache
        self._rate_limit_cache[cache_key].append(now)
        return True, None

    def get_app_config(self, app_key: str) -> Dict[str, Any]:
        """Get configuration for a specific app."""
        return COMPOSIO_SUPPORTED_APPS.get(app_key, {})

    def get_supported_apps(self) -> List[Dict[str, Any]]:
        """Get list of all supported apps with their metadata."""
        return [
            {"key": key, **config} for key, config in COMPOSIO_SUPPORTED_APPS.items()
        ]

    def get_apps_by_category(self, category: str) -> List[Dict[str, Any]]:
        """Get apps filtered by category."""
        return [
            {"key": key, **config}
            for key, config in COMPOSIO_SUPPORTED_APPS.items()
            if config.get("category") == category
        ]

    def _generate_session_uuid(self, user_id: str, app_key: str) -> str:
        """Generate a unique session UUID for user-app combination"""
        # Create deterministic but unique session ID
        session_data = f"{user_id}_{app_key}_{uuid.uuid4()}"
        return str(uuid.uuid5(uuid.NAMESPACE_DNS, session_data))

    async def _generate_composio_mcp_url(
        self, app_key: str, session_uuid: str
    ) -> Optional[str]:
        """Generate MCP URL from Composio API"""
        url = f"{self.composio_base_url}/api/apps/{app_key}/install"

        # Include framework parameter as required by Composio API
        payload = {"uuid": session_uuid, "framework": "mcp"}
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json, text/plain, */*",
            "Origin": "https://mcp.composio.dev",
            "Referer": f"https://mcp.composio.dev/{app_key}/{session_uuid}",
            "User-Agent": "Atlas-Agents/1.0",
        }

        cookies = {
            "uuid": session_uuid,
            "isActiveUser": session_uuid,
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                # Step 1: Install/register the session
                install_response = await client.post(
                    url, json=payload, headers=headers, cookies=cookies
                )

                if install_response.status_code != 200:
                    logger.error(
                        f"Install failed: {install_response.status_code} - {install_response.text}"
                    )
                    return None

                logger.info(f"Install successful: {install_response.json()}")

                # Step 2: Get the actual MCP URL from status endpoint
                status_url = f"{self.composio_base_url}/api/apps/{app_key}"
                status_response = await client.get(
                    status_url,
                    params={"uuid": session_uuid},
                    headers=headers,
                    cookies=cookies,
                )

                if status_response.status_code == 200:
                    status_data = status_response.json()
                    # The MCP URL is in the sseUrl field (despite the name, it's actually the MCP URL)
                    mcp_url = status_data.get("sseUrl")
                    if mcp_url:
                        logger.info(f"Got MCP URL from status: {mcp_url}")
                        return mcp_url
                    else:
                        logger.warning(f"No sseUrl in status response: {status_data}")
                else:
                    logger.error(
                        f"Status check failed: {status_response.status_code} - {status_response.text}"
                    )

                # Fallback: construct URL from known pattern
                fallback_url = f"{self.composio_base_url}/partner/composio/{app_key}/mcp?customerId={session_uuid}"
                logger.info(f"Using fallback MCP URL: {fallback_url}")
                return fallback_url

        except Exception as e:
            logger.error(f"Error generating Composio MCP URL: {e}")
            return None

    def _extract_mcp_url(
        self, response_data: Dict, app_key: str, session_uuid: str
    ) -> Optional[str]:
        """Extract MCP URL from Composio response"""
        # Try various patterns for MCP URLs
        possible_patterns = [
            response_data.get("sseUrl"),
            response_data.get("mcp_url"),
            response_data.get("url"),
            response_data.get("data", {}).get("sseUrl"),
            response_data.get("data", {}).get("mcp_url"),
            response_data.get("data", {}).get("url"),
            # Construct from known patterns
            f"https://mcp.composio.dev/partner/composio/{app_key}/mcp?customerId={session_uuid}",
            f"https://mcp.composio.dev/partner/composio/{app_key}/sse?customerId={session_uuid}",
        ]

        for url in possible_patterns:
            if url and isinstance(url, str) and url.startswith("https://"):
                return url

        return None

    async def _store_mcp_connection(
        self, user_id: str, app_key: str, mcp_url: str, session_uuid: str
    ) -> bool:
        """Store MCP connection in default agent's custom_mcps for centralized management"""
        try:
            # Use qualified_name format similar to existing MCP servers
            qualified_name = f"composio/{app_key}"

            # Normalize user ID to proper UUID format
            actual_user_id = self._normalize_user_id(user_id)
            if actual_user_id != user_id:
                logger.warning(
                    f"Converting test user ID {user_id} to UUID {actual_user_id}"
                )

            # Get account_id from user_id using basejump schema
            account_result = (
                self.supabase.schema("basejump")
                .table("accounts")
                .select("id")
                .eq("primary_owner_user_id", actual_user_id)
                .eq("personal_account", True)
                .execute()
            )

            if not account_result.data:
                logger.error(f"No personal account found for user {user_id}")
                return False

            account_id = account_result.data[0]["id"]
            logger.info(f"Found account {account_id} for user {user_id}")

            # Get or create default agent for this account
            default_agent_result = (
                self.supabase.table("agents")
                .select("agent_id, custom_mcps")
                .eq("account_id", account_id)
                .eq("is_default", True)
                .execute()
            )

            if not default_agent_result.data:
                # Create default agent if none exists
                logger.info(f"Creating default agent for account {account_id}")
                create_result = (
                    self.supabase.table("agents")
                    .insert(
                        {
                            "account_id": account_id,
                            "name": "Atlas Agent",
                            "description": "Your default Atlas agent with centralized tool configurations",
                            "system_prompt": "You are Atlas Agent, a helpful AI assistant with access to various tools and integrations. Provide clear, accurate, and helpful responses to user queries.",
                            "configured_mcps": [],
                            "custom_mcps": [],
                            "agentpress_tools": {},
                            "is_default": True,
                            "avatar": "🤖",
                            "avatar_color": "#6366f1",
                        }
                    )
                    .execute()
                )

                if not create_result.data:
                    logger.error(
                        f"Failed to create default agent for account {account_id}"
                    )
                    return False

                default_agent_id = create_result.data[0]["agent_id"]
                current_custom_mcps = []
                logger.info(
                    f"Created default agent {default_agent_id} for account {account_id}"
                )
            else:
                default_agent_id = default_agent_result.data[0]["agent_id"]
                current_custom_mcps = default_agent_result.data[0]["custom_mcps"] or []
                logger.info(
                    f"Using existing default agent {default_agent_id} for account {account_id}"
                )

            # Create new MCP config for Composio using existing 'http' custom MCP format
            new_mcp_config = {
                "name": app_key.title(),
                "type": "http",  # Composio MCPs are HTTP custom MCPs
                "config": {
                    "url": mcp_url  # This is the standard format for HTTP custom MCPs
                },
                "enabledTools": [],
                "created_at": "now()",
            }

            # Check if this app already exists in custom_mcps and update or add
            # Look for existing HTTP MCP with the same URL (Composio MCPs are HTTP MCPs)
            existing_index = None
            for i, mcp in enumerate(current_custom_mcps):
                if (
                    mcp.get("type") == "http"
                    and mcp.get("config", {}).get("url") == mcp_url
                ):
                    existing_index = i
                    break

            if existing_index is not None:
                # Update existing entry
                current_custom_mcps[existing_index] = new_mcp_config
                logger.info(f"Updated existing Composio MCP for {app_key}")
            else:
                # Add new entry
                current_custom_mcps.append(new_mcp_config)
                logger.info(f"Added new Composio MCP for {app_key}")

            # Update the default agent with new custom_mcps
            update_result = (
                self.supabase.table("agents")
                .update({"custom_mcps": current_custom_mcps})
                .eq("agent_id", default_agent_id)
                .execute()
            )

            if not update_result.data:
                logger.error(
                    f"Failed to update default agent {default_agent_id} with new MCP config"
                )
                return False

            logger.info(
                f"Stored Composio MCP connection for user {user_id}, app {app_key} in default agent {default_agent_id}"
            )
            return True

        except Exception as e:
            logger.error(f"Error storing MCP connection in default agent: {e}")
            return False

    async def update_mcp_enabled_tools(
        self, user_id: str, app_key: str, selected_tools: List[str]
    ) -> bool:
        """
        Update the enabled tools for a Composio MCP connection in the default agent.

        This mirrors the exact per-agent MCP tool selection logic, updating the
        enabledTools array in the default agent's custom_mcps for the specified app.
        """
        try:
            actual_user_id = self._normalize_user_id(user_id)

            # Get account_id from user_id using basejump schema
            account_result = (
                self.supabase.schema("basejump")
                .table("accounts")
                .select("id")
                .eq("primary_owner_user_id", actual_user_id)
                .eq("personal_account", True)
                .execute()
            )

            if not account_result.data:
                logger.error(f"No personal account found for user {user_id}")
                return False

            account_id = account_result.data[0]["id"]

            # Get default agent
            default_agent_result = (
                self.supabase.table("agents")
                .select("agent_id, custom_mcps")
                .eq("account_id", account_id)
                .eq("is_default", True)
                .execute()
            )

            if not default_agent_result.data:
                logger.error(f"No default agent found for account {account_id}")
                return False

            default_agent_id = default_agent_result.data[0]["agent_id"]
            current_custom_mcps = default_agent_result.data[0]["custom_mcps"] or []

            # Find the Composio MCP for this app and update its enabledTools
            updated = False
            for i, mcp in enumerate(current_custom_mcps):
                if (
                    mcp.get("type") == "http"
                    and mcp.get("name", "").lower() == app_key.lower()
                ):
                    # Update the enabledTools for this MCP (same as per-agent logic)
                    current_custom_mcps[i]["enabledTools"] = selected_tools
                    updated = True
                    logger.info(f"Updated enabledTools for {app_key}: {selected_tools}")
                    break

            if not updated:
                logger.error(f"Composio MCP for {app_key} not found in default agent")
                return False

            # Update the default agent with modified custom_mcps
            update_result = (
                self.supabase.table("agents")
                .update({"custom_mcps": current_custom_mcps})
                .eq("agent_id", default_agent_id)
                .execute()
            )

            if not update_result.data:
                logger.error(
                    f"Failed to update default agent {default_agent_id} with new tool selection"
                )
                return False

            logger.info(
                f"Successfully updated {len(selected_tools)} enabled tools for {app_key} in default agent {default_agent_id}"
            )
            return True

        except Exception as e:
            logger.error(f"Error updating MCP enabled tools for {app_key}: {e}")
            return False

    async def _initiate_mcp_connection(
        self, mcp_url: str, app_key: str
    ) -> Optional[str]:
        """Use existing MCP architecture to initiate connection and get auth URL"""
        try:
            # Import here to avoid circular imports
            from mcp.client.sse import sse_client
            from mcp.client.streamable_http import streamablehttp_client
            from mcp import ClientSession
            import asyncio

            logger.info(f"Initiating MCP connection to {mcp_url}")

            # For Composio URLs, we need to try connecting to see what happens
            # The URL might be:
            # 1. A direct MCP server that we can connect to
            # 2. An auth URL that redirects to OAuth
            # 3. A server that returns auth info in its response

            auth_url = None

            # Try SSE connection first (most Composio URLs use SSE)
            if "sse" in mcp_url or "/sse" in mcp_url:
                try:
                    logger.info(f"Attempting SSE connection to {mcp_url}")
                    async with asyncio.timeout(10):  # 10 second timeout
                        async with sse_client(mcp_url) as (read, write):
                            async with ClientSession(read, write) as session:
                                await session.initialize()
                                logger.info("SSE MCP session initialized successfully")

                                # Try to list tools to see if we get auth info
                                try:
                                    tools_result = await session.list_tools()
                                    logger.info(
                                        f"Got {len(tools_result.tools)} tools from MCP server"
                                    )

                                    # Check if any tools provide auth information
                                    for tool in tools_result.tools:
                                        if (
                                            "auth" in tool.name.lower()
                                            or "connect" in tool.name.lower()
                                        ):
                                            logger.info(
                                                f"Found auth-related tool: {tool.name}"
                                            )
                                            # This tool might provide auth URL
                                            # For now, we'll use the MCP URL as the auth URL
                                            auth_url = mcp_url
                                            break

                                    if not auth_url:
                                        # No specific auth tool found, use the MCP URL itself
                                        auth_url = mcp_url

                                except Exception as e:
                                    logger.warning(
                                        f"Could not list tools from MCP server: {e}"
                                    )
                                    # Even if we can't list tools, the connection worked
                                    auth_url = mcp_url

                except asyncio.TimeoutError:
                    logger.warning(f"SSE connection to {mcp_url} timed out")
                except Exception as e:
                    logger.warning(f"SSE connection failed: {e}")

            # Try HTTP connection if SSE failed or if URL suggests HTTP
            if not auth_url and ("mcp" in mcp_url or "http" in mcp_url):
                try:
                    logger.info(f"Attempting HTTP connection to {mcp_url}")
                    async with asyncio.timeout(10):  # 10 second timeout
                        async with streamablehttp_client(mcp_url) as (read, write, _):
                            async with ClientSession(read, write) as session:
                                await session.initialize()
                                logger.info("HTTP MCP session initialized successfully")

                                # Try to list tools
                                try:
                                    tools_result = await session.list_tools()
                                    logger.info(
                                        f"Got {len(tools_result.tools)} tools from HTTP MCP server"
                                    )
                                    auth_url = mcp_url
                                except Exception as e:
                                    logger.warning(
                                        f"Could not list tools from HTTP MCP server: {e}"
                                    )
                                    auth_url = mcp_url

                except asyncio.TimeoutError:
                    logger.warning(f"HTTP connection to {mcp_url} timed out")
                except Exception as e:
                    logger.warning(f"HTTP connection failed: {e}")

            # If we couldn't connect via MCP protocols, the URL might be a direct auth URL
            if not auth_url:
                logger.info(
                    f"Could not connect via MCP protocols, treating {mcp_url} as auth URL"
                )
                auth_url = mcp_url

            logger.info(f"Returning auth URL: {auth_url}")
            return auth_url

        except Exception as e:
            logger.error(f"Error initiating MCP connection: {e}")
            # Even if there's an error, return the URL - it might still work for auth
            return mcp_url

    async def get_or_create_user_mcp_connection(
        self, user_id: str, app_key: str
    ) -> ComposioMCPConnection:
        """
        Get existing MCP connection from Supabase or create new one if doesn't exist.
        This ensures we don't regenerate URLs unnecessarily and provides persistence.
        """
        try:
            logger.info(
                f"Getting or creating Composio MCP connection for user {user_id}, app {app_key}"
            )
            qualified_name = f"composio/{app_key}"

            # Step 1: Check if connection already exists in default agent
            actual_user_id = self._normalize_user_id(user_id)
            try:
                # Get account_id from user_id
                account_result = (
                    self.supabase.schema("basejump")
                    .table("accounts")
                    .select("id")
                    .eq("primary_owner_user_id", actual_user_id)
                    .eq("personal_account", True)
                    .execute()
                )

                if account_result.data:
                    account_id = account_result.data[0]["id"]

                    # Check default agent for existing Composio MCP
                    default_agent_result = (
                        self.supabase.table("agents")
                        .select("agent_id, custom_mcps")
                        .eq("account_id", account_id)
                        .eq("is_default", True)
                        .execute()
                    )

                    if default_agent_result.data:
                        default_agent = default_agent_result.data[0]
                        custom_mcps = default_agent.get("custom_mcps", [])

                        # Look for existing HTTP MCP that matches our Composio app
                        # We need to check if the MCP name matches our app_key since Composio MCPs are HTTP MCPs
                        for mcp in custom_mcps:
                            if (
                                mcp.get("type") == "http"
                                and mcp.get("name", "").lower() == app_key.lower()
                            ):

                                logger.info(
                                    f"Found existing HTTP MCP for user {user_id}, app {app_key} in default agent"
                                )

                                config = mcp.get("config", {})
                                return ComposioMCPConnection(
                                    success=True,
                                    app_key=app_key,
                                    mcp_url=config.get(
                                        "url"
                                    ),  # HTTP MCPs use 'url' key
                                    session_uuid=None,  # HTTP MCPs don't store session UUID
                                    auth_url=config.get(
                                        "url"
                                    ),  # For now, MCP URL is the auth URL
                                    qualified_name=qualified_name,
                                )

            except Exception as e:
                logger.warning(
                    f"Error checking existing connection in default agent: {e}"
                )
                # Continue to create new connection

            # Step 2: No existing connection found, create new one
            logger.info(f"No existing connection found, creating new MCP connection")

            # Generate session UUID
            session_uuid = self._generate_session_uuid(user_id, app_key)

            # Generate MCP URL from Composio
            mcp_url = await self._generate_composio_mcp_url(app_key, session_uuid)
            if not mcp_url:
                return ComposioMCPConnection(
                    success=False,
                    app_key=app_key,
                    error="Failed to generate MCP URL from Composio",
                )

            # Step 3: Store connection in Supabase
            stored = await self._store_mcp_connection(
                user_id, app_key, mcp_url, session_uuid
            )
            if not stored:
                return ComposioMCPConnection(
                    success=False,
                    app_key=app_key,
                    error="Failed to store MCP connection in database",
                )

            # Step 4: Return success with connection details
            return ComposioMCPConnection(
                success=True,
                app_key=app_key,
                mcp_url=mcp_url,
                session_uuid=session_uuid,
                auth_url=mcp_url,  # For now, MCP URL is the auth URL
                qualified_name=qualified_name,
            )

        except Exception as e:
            logger.error(f"Error in get_or_create_user_mcp_connection: {e}")
            return ComposioMCPConnection(success=False, app_key=app_key, error=str(e))

    async def create_user_mcp_connection_simple(
        self, user_id: str, app_key: str
    ) -> ComposioMCPConnection:
        """
        Simplified flow: Generate Composio MCP URL, initiate connection, return auth URL
        (No Supabase storage for testing)
        """
        try:
            logger.info(
                f"Creating Composio MCP connection for user {user_id}, app {app_key}"
            )

            # Step 1: Validate inputs
            user_valid, user_error = self.validate_user_id(user_id)
            if not user_valid:
                return ComposioMCPConnection(
                    success=False,
                    app_key=app_key,
                    error=f"Invalid user ID: {user_error}",
                )

            app_valid, app_error = self.validate_app_key(app_key)
            if not app_valid:
                return ComposioMCPConnection(
                    success=False,
                    app_key=app_key,
                    error=f"Invalid app key: {app_error}",
                )

            # Step 2: Check rate limits
            rate_ok, rate_error = self.check_rate_limit(user_id, app_key)
            if not rate_ok:
                return ComposioMCPConnection(
                    success=False,
                    app_key=app_key,
                    error=rate_error,
                )

            # Step 3: Generate session UUID
            session_uuid = self._generate_session_uuid(user_id, app_key)

            # Step 4: Generate MCP URL from Composio
            mcp_url = await self._generate_composio_mcp_url(app_key, session_uuid)
            if not mcp_url:
                return ComposioMCPConnection(
                    success=False,
                    app_key=app_key,
                    error="Failed to generate MCP URL from Composio",
                )

            # Step 5: For now, return the MCP URL as auth URL (simplified)
            # In production, this would initiate MCP connection to get actual auth URL
            return ComposioMCPConnection(
                success=True,
                app_key=app_key,
                mcp_url=mcp_url,
                session_uuid=session_uuid,
                auth_url=mcp_url,  # Simplified for testing
                qualified_name=f"composio/{app_key}",
            )

        except Exception as e:
            logger.error(f"Error in create_user_mcp_connection_simple: {e}")
            return ComposioMCPConnection(success=False, app_key=app_key, error=str(e))

    async def create_user_mcp_connection(
        self, user_id: str, app_key: str
    ) -> ComposioMCPConnection:
        """
        Main method: Get existing MCP connection or create new one with persistence.

        This method now uses the get_or_create approach to avoid regenerating URLs
        and provides proper persistence through Supabase.
        """
        return await self.get_or_create_user_mcp_connection(user_id, app_key)

    def _normalize_user_id(self, user_id: str) -> str:
        """Convert user ID to proper UUID format for database operations"""
        try:
            import uuid as uuid_module

            uuid_module.UUID(user_id)
            return user_id
        except ValueError:
            import hashlib

            hash_object = hashlib.md5(user_id.encode())
            hex_dig = hash_object.hexdigest()
            return f"{hex_dig[:8]}-{hex_dig[8:12]}-{hex_dig[12:16]}-{hex_dig[16:20]}-{hex_dig[20:32]}"

    async def list_user_mcp_connections(self, user_id: str) -> List[Dict[str, Any]]:
        """
        List all Composio MCP connections for a user from Supabase.
        """
        try:
            actual_user_id = self._normalize_user_id(user_id)
            result = (
                self.supabase.table("mcp_oauth_tokens")
                .select("*")
                .eq("user_id", actual_user_id)
                .like("qualified_name", "composio/%")
                .execute()
            )

            connections = []
            for row in result.data:
                connections.append(
                    {
                        "id": row.get("id", ""),
                        "user_id": row["user_id"],
                        "qualified_name": row["qualified_name"],
                        "app_key": row["qualified_name"].replace("composio/", ""),
                        "app_name": row["qualified_name"]
                        .replace("composio/", "")
                        .title(),
                        "mcp_url": row[
                            "access_token"
                        ],  # MCP URL stored as access_token
                        "auth_url": row["access_token"],  # Same as MCP URL for now
                        "session_uuid": row[
                            "refresh_token"
                        ],  # Session UUID stored as refresh_token
                        "status": "connected",  # Default to connected for existing connections
                        "created_at": row["created_at"],
                        "updated_at": row["updated_at"],
                        "expires_at": row.get("expires_at"),
                        "scope": row["scope"],
                    }
                )

            return connections

        except Exception as e:
            logger.error(f"Error listing user MCP connections: {e}")
            return []

    async def delete_user_mcp_connection(self, user_id: str, app_key: str) -> bool:
        """
        Delete a specific Composio MCP connection for a user.
        """
        try:
            qualified_name = f"composio/{app_key}"
            actual_user_id = self._normalize_user_id(user_id)

            result = (
                self.supabase.table("mcp_oauth_tokens")
                .delete()
                .eq("user_id", actual_user_id)
                .eq("qualified_name", qualified_name)
                .execute()
            )

            if result.data:
                logger.info(
                    f"Deleted Composio MCP connection for user {user_id}, app {app_key}"
                )
                return True
            else:
                logger.warning(
                    f"No connection found to delete for user {user_id}, app {app_key}"
                )
                return False

        except Exception as e:
            logger.error(f"Error deleting MCP connection: {e}")
            return False


# Global service instance
composio_mcp_service = ComposioMCPService()


@dataclass
class ComposioToolExecutionResult:
    """Result of executing a tool on a Composio MCP server"""

    success: bool
    app_key: str
    tool_name: str
    response_data: Optional[Dict[str, Any]] = None
    redirect_url: Optional[str] = None
    connection_id: Optional[str] = None
    instruction: Optional[str] = None
    error: Optional[str] = None


class ComposioMCPToolExecutor:
    """
    Service for executing tools on Composio MCP servers.

    This service reuses the exact same patterns as mcp_tool_wrapper.py's
    _execute_custom_mcp_tool method for HTTP MCP servers, ensuring consistency
    with the existing MCP architecture.
    """

    def __init__(self):
        self.supabase = create_client(
            os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        )

    async def execute_initiate_connection_tool(
        self, user_id: str, app_key: str
    ) -> ComposioToolExecutionResult:
        """
        Execute the initiate connection tool for a Composio MCP server.

        This method uses the existing AgentPress MCP tool wrapper system to call
        the initiate connection tool, following the same pattern as per-agent MCP tools.

        Args:
            user_id: User ID to get MCP connection for
            app_key: App key (e.g., "gmail", "slack")

        Returns:
            ComposioToolExecutionResult with redirect URL or error
        """
        try:
            logger.error(
                f"🚀 STARTING INITIATE CONNECTION - User: {user_id}, App: {app_key}"
            )

            # Step 1: Get default agent's custom_mcps configuration
            agent_mcps = await self._get_default_agent_mcps(user_id)
            if not agent_mcps:
                return ComposioToolExecutionResult(
                    success=False,
                    app_key=app_key,
                    tool_name=f"{app_key.upper()}_INITIATE_CONNECTION",
                    error=f"No default agent or MCP configuration found for user {user_id}.",
                )

            logger.info(
                f"Found {len(agent_mcps)} MCP configurations for user {user_id}"
            )

            # Step 2: Use existing MCP tool wrapper to execute the tool
            result = await self._execute_tool_via_mcp_wrapper(agent_mcps, app_key)
            return result

        except Exception as e:
            logger.error(f"Error executing initiate connection tool for {app_key}: {e}")
            return ComposioToolExecutionResult(
                success=False,
                app_key=app_key,
                tool_name=f"{app_key.upper()}_INITIATE_CONNECTION",
                error=str(e),
            )

    async def _get_default_agent_mcps(
        self, user_id: str
    ) -> Optional[List[Dict[str, Any]]]:
        """Get the default agent's custom_mcps configuration for MCP tool wrapper."""
        try:
            # Normalize user ID
            actual_user_id = composio_mcp_service._normalize_user_id(user_id)

            # Get account_id from user_id using basejump schema
            account_result = (
                self.supabase.schema("basejump")
                .table("accounts")
                .select("id")
                .eq("primary_owner_user_id", actual_user_id)
                .eq("personal_account", True)
                .execute()
            )

            if not account_result.data:
                logger.error(f"No personal account found for user {user_id}")
                return None

            account_id = account_result.data[0]["id"]

            # Get default agent's custom_mcps
            default_agent_result = (
                self.supabase.table("agents")
                .select("custom_mcps")
                .eq("account_id", account_id)
                .eq("is_default", True)
                .execute()
            )

            if not default_agent_result.data:
                logger.error(f"No default agent found for account {account_id}")
                return None

            custom_mcps = default_agent_result.data[0]["custom_mcps"] or []
            logger.info(f"Retrieved {len(custom_mcps)} custom MCPs from default agent")
            return custom_mcps

        except Exception as e:
            logger.error(f"Error retrieving default agent MCPs: {e}")
            return None

    async def _execute_tool_via_mcp_wrapper(
        self, agent_mcps: List[Dict[str, Any]], app_key: str
    ) -> ComposioToolExecutionResult:
        """Execute the initiate connection tool using the existing MCP tool wrapper."""
        try:
            # Import the MCP tool wrapper
            from agent.tools.mcp_tool_wrapper import MCPToolWrapper

            logger.info(
                f"Initializing MCP tool wrapper with {len(agent_mcps)} custom MCPs"
            )
            logger.info(f"Agent MCPs: {agent_mcps}")

            # Convert custom_mcps to the format expected by MCPToolWrapper
            mcp_configs = []
            for mcp in agent_mcps:
                if (
                    mcp.get("type") == "http"
                    and mcp.get("name", "").lower() == app_key.lower()
                ):
                    # This is our Composio MCP - convert to the expected format
                    config = {
                        "isCustom": True,
                        "customType": "http",
                        "name": mcp.get("name", app_key.title()),
                        "config": mcp.get("config", {}),
                        "enabledTools": mcp.get("enabledTools", []),
                    }
                    mcp_configs.append(config)
                    logger.info(f"Added Composio MCP config for {app_key}: {config}")

            if not mcp_configs:
                return ComposioToolExecutionResult(
                    success=False,
                    app_key=app_key,
                    tool_name=f"{app_key.upper()}_INITIATE_CONNECTION",
                    error=f"No Composio MCP configuration found for {app_key} in default agent.",
                )

            # Initialize the MCP tool wrapper
            mcp_wrapper = MCPToolWrapper(mcp_configs=mcp_configs)

            # Wait for initialization to complete
            await mcp_wrapper._ensure_initialized()

            # Get all available tools from the wrapper to see what's actually registered
            available_tools = mcp_wrapper._custom_tools
            logger.info(
                f"Available custom tools after initialization: {list(available_tools.keys())}"
            )

            # Also check dynamic tools
            dynamic_tools = mcp_wrapper._dynamic_tools
            logger.info(f"Available dynamic tools: {list(dynamic_tools.keys())}")

            # Look for initiate connection tools in the available tools
            initiate_tools = []
            for tool_name in available_tools.keys():
                if "initiate" in tool_name.lower():
                    initiate_tools.append(tool_name)
                    logger.info(f"Found potential initiate tool: {tool_name}")

            for tool_name in dynamic_tools.keys():
                if "initiate" in tool_name.lower():
                    initiate_tools.append(tool_name)
                    logger.info(f"Found potential dynamic initiate tool: {tool_name}")

            if not initiate_tools:
                logger.warning("No initiate connection tools found in available tools")
                # Let's try to call the tools directly using the method names
                # Check if there are any methods on the wrapper that match initiate patterns
                wrapper_methods = [
                    method
                    for method in dir(mcp_wrapper)
                    if "initiate" in method.lower()
                ]
                logger.info(f"Wrapper methods containing 'initiate': {wrapper_methods}")

                # Try calling the tools using direct method calls instead of call_mcp_tool
                for method_name in wrapper_methods:
                    try:
                        logger.info(
                            f"Attempting to call method directly: {method_name}"
                        )
                        method = getattr(mcp_wrapper, method_name)
                        if callable(method):
                            result = await method(tool=app_key, parameters={})
                            if result.success:
                                logger.info(
                                    f"Successfully called {method_name} directly"
                                )
                                return self._parse_agentpress_tool_result(
                                    result, app_key, method_name
                                )
                    except Exception as method_error:
                        logger.warning(
                            f"Failed to call {method_name} directly: {method_error}"
                        )
                        continue

            # Try the found initiate tools
            for tool_name in initiate_tools:
                try:
                    logger.info(f"Attempting to call found initiate tool: {tool_name}")

                    # Call the tool through the wrapper
                    result = await mcp_wrapper.call_mcp_tool(
                        tool_name=tool_name,
                        arguments={"tool": app_key, "parameters": {}},
                    )

                    if result.success:
                        logger.info(
                            f"Successfully called {tool_name}, parsing response"
                        )
                        # Parse the AgentPress ToolResult response
                        return self._parse_agentpress_tool_result(
                            result, app_key, tool_name
                        )
                    else:
                        logger.warning(f"Tool {tool_name} failed: {result.content}")

                except Exception as tool_error:
                    logger.warning(f"Failed to call {tool_name}: {tool_error}")
                    continue

            # If we get here, none of the tool names worked
            return ComposioToolExecutionResult(
                success=False,
                app_key=app_key,
                tool_name=f"{app_key.upper()}_INITIATE_CONNECTION",
                error=f"Could not find or execute initiate connection tool for {app_key}. Available tools: {list(available_tools.keys())}, Dynamic tools: {list(dynamic_tools.keys())}",
            )

        except Exception as e:
            logger.error(f"Error executing tool via MCP wrapper: {e}")
            return ComposioToolExecutionResult(
                success=False,
                app_key=app_key,
                tool_name=f"{app_key.upper()}_INITIATE_CONNECTION",
                error=f"Error with MCP tool wrapper: {str(e)}",
            )

    def _parse_agentpress_tool_result(
        self, tool_result, app_key: str, tool_name: str
    ) -> ComposioToolExecutionResult:
        """
        Parse the AgentPress ToolResult response to extract Composio-specific data.

        The tool_result.output should contain the JSON response from the Composio tool.
        """
        try:
            logger.info(f"Parsing AgentPress tool result for {tool_name}")
            logger.info(f"Tool result success: {tool_result.success}")
            logger.info(f"Tool result output: {tool_result.output}")

            if not tool_result.success:
                return ComposioToolExecutionResult(
                    success=False,
                    app_key=app_key,
                    tool_name=tool_name,
                    error=f"Tool execution failed: {tool_result.output}",
                )

            # The output should be the JSON response from Composio
            output = tool_result.output
            if isinstance(output, str):
                try:
                    output = json.loads(output)
                except json.JSONDecodeError:
                    # If it's not JSON, treat it as the raw response
                    pass

            # Parse the Composio response structure
            return self._parse_composio_tool_response(str(output), tool_name, app_key)

        except Exception as e:
            logger.error(f"Error parsing AgentPress tool result: {e}")
            return ComposioToolExecutionResult(
                success=False,
                app_key=app_key,
                tool_name=tool_name,
                error=f"Error parsing tool result: {str(e)}",
            )

    async def _get_mcp_url_from_default_agent(
        self, user_id: str, app_key: str
    ) -> Optional[str]:
        """
        Retrieve the MCP URL for a Composio app from the default agent's custom_mcps.

        This follows the exact same pattern as the existing composio_integration.py
        logic for finding HTTP custom MCPs in the default agent.
        """
        try:
            # Normalize user ID
            actual_user_id = composio_mcp_service._normalize_user_id(user_id)

            # Get account_id from user_id using basejump schema
            account_result = (
                self.supabase.schema("basejump")
                .table("accounts")
                .select("id")
                .eq("primary_owner_user_id", actual_user_id)
                .eq("personal_account", True)
                .execute()
            )

            if not account_result.data:
                logger.error(f"No personal account found for user {user_id}")
                return None

            account_id = account_result.data[0]["id"]

            # Get default agent's custom_mcps
            default_agent_result = (
                self.supabase.table("agents")
                .select("custom_mcps")
                .eq("account_id", account_id)
                .eq("is_default", True)
                .execute()
            )

            if not default_agent_result.data:
                logger.error(f"No default agent found for account {account_id}")
                return None

            custom_mcps = default_agent_result.data[0]["custom_mcps"] or []

            # Find the HTTP MCP that matches our Composio app
            for mcp in custom_mcps:
                if (
                    mcp.get("type") == "http"
                    and mcp.get("name", "").lower() == app_key.lower()
                ):
                    config = mcp.get("config", {})
                    mcp_url = config.get("url")
                    logger.info(f"Found MCP URL for {app_key}: {mcp_url}")
                    return mcp_url

            logger.warning(f"No HTTP MCP found for {app_key} in default agent")
            return None

        except Exception as e:
            logger.error(f"Error retrieving MCP URL for {app_key}: {e}")
            return None

    async def _find_initiate_connection_tool(
        self, mcp_url: str, app_key: str
    ) -> Optional[str]:
        """
        Discover available tools on the MCP server and find the correct initiate connection tool.

        This method connects to the MCP server and lists all available tools to find
        the one that matches the initiate connection pattern for the given app.
        """
        try:
            from mcp.client.streamable_http import streamablehttp_client
            from mcp import ClientSession
            import asyncio

            logger.info(
                f"Discovering tools on MCP server {mcp_url} to find initiate connection tool for {app_key}"
            )

            async with asyncio.timeout(15):  # Shorter timeout for discovery
                async with streamablehttp_client(mcp_url) as (read, write, _):
                    async with ClientSession(read, write) as session:
                        await session.initialize()
                        tools_result = await session.list_tools()

                        # Log all available tools for debugging
                        tool_names = [tool.name for tool in tools_result.tools]
                        logger.info(
                            f"Available tools on {app_key} MCP server: {tool_names}"
                        )

                        # Look for initiate connection tools with various patterns
                        possible_patterns = [
                            f"{app_key.upper()}-INITIATE-CONNECTION",
                            f"{app_key.upper()}_INITIATE_CONNECTION",
                            f"{app_key.lower()}-initiate-connection",
                            f"{app_key.lower()}_initiate_connection",
                            f"INITIATE_{app_key.upper()}_CONNECTION",
                            f"initiate_{app_key.lower()}_connection",
                            f"{app_key.upper()}-INITIATE_CONNECTION",
                            f"{app_key.lower()}-initiate_connection",
                        ]

                        # First try exact matches
                        for pattern in possible_patterns:
                            if pattern in tool_names:
                                logger.info(
                                    f"Found exact match initiate connection tool: {pattern}"
                                )
                                return pattern

                        # Then try partial matches (contains "initiate" and app name)
                        app_variations = [
                            app_key.upper(),
                            app_key.lower(),
                            app_key.title(),
                        ]
                        for tool_name in tool_names:
                            tool_lower = tool_name.lower()
                            if "initiate" in tool_lower:
                                for app_var in app_variations:
                                    if app_var.lower() in tool_lower:
                                        logger.info(
                                            f"Found partial match initiate connection tool: {tool_name}"
                                        )
                                        return tool_name

                        logger.warning(
                            f"No initiate connection tool found for {app_key}. Available tools: {tool_names}"
                        )
                        return None

        except Exception as e:
            logger.error(
                f"Error discovering initiate connection tool for {app_key}: {e}"
            )
            return None

    async def _execute_mcp_tool(
        self, mcp_url: str, tool_name: str, arguments: Dict[str, Any]
    ) -> ComposioToolExecutionResult:
        """
        Execute a tool on a Composio MCP server using HTTP client.

        This method follows the exact same pattern as mcp_tool_wrapper.py's
        _execute_custom_mcp_tool method for HTTP type MCPs, ensuring consistency.
        """
        try:
            # Import MCP clients (same pattern as mcp_tool_wrapper.py)
            from mcp.client.streamable_http import streamablehttp_client
            from mcp import ClientSession
            import asyncio

            logger.info(
                f"Executing MCP tool {tool_name} on {mcp_url} with arguments {arguments}"
            )

            # Use the exact same pattern as mcp_tool_wrapper.py for HTTP MCP execution
            try:
                async with asyncio.timeout(
                    30
                ):  # 30 second timeout (same as mcp_tool_wrapper)
                    logger.info(f"Connecting to MCP server at {mcp_url}")
                    async with streamablehttp_client(mcp_url) as (read, write, _):
                        logger.info(f"Connected to MCP server, initializing session")
                        async with ClientSession(read, write) as session:
                            logger.info(f"Session created, initializing...")
                            await session.initialize()
                            logger.info(
                                f"Session initialized, calling tool {tool_name}"
                            )
                            result = await session.call_tool(tool_name, arguments)
                            logger.info(
                                f"Tool call completed, processing result: {type(result)}"
                            )

                            # Handle the result using the same pattern as mcp_tool_wrapper.py
                            if hasattr(result, "content"):
                                content = result.content
                                logger.info(f"Result has content: {type(content)}")
                                if isinstance(content, list):
                                    # Extract text from content list
                                    text_parts = []
                                    for item in content:
                                        if hasattr(item, "text"):
                                            text_parts.append(item.text)
                                        else:
                                            text_parts.append(str(item))
                                    content_str = "\n".join(text_parts)
                                elif hasattr(content, "text"):
                                    content_str = content.text
                                else:
                                    content_str = str(content)

                                logger.info(
                                    f"Extracted content string: {content_str[:200]}..."
                                )

                                # Parse the response to extract Composio-specific data
                                return self._parse_composio_tool_response(
                                    content_str, tool_name, arguments["tool"]
                                )
                            else:
                                # Fallback: treat result as string
                                logger.info(
                                    f"Result has no content attribute, using string representation"
                                )
                                return self._parse_composio_tool_response(
                                    str(result), tool_name, arguments["tool"]
                                )

            except asyncio.TimeoutError:
                logger.error(f"Tool execution timeout for {tool_name}")
                return ComposioToolExecutionResult(
                    success=False,
                    app_key=arguments.get("tool", "unknown"),
                    tool_name=tool_name,
                    error=f"Tool execution timeout for {tool_name}",
                )
            except Exception as inner_e:
                logger.error(
                    f"Inner exception during MCP tool execution: {type(inner_e).__name__}: {str(inner_e)}"
                )
                import traceback

                logger.error(f"Full traceback: {traceback.format_exc()}")
                raise inner_e

        except Exception as e:
            logger.error(
                f"Error executing MCP tool {tool_name}: {type(e).__name__}: {str(e)}"
            )
            import traceback

            logger.error(f"Full traceback: {traceback.format_exc()}")
            return ComposioToolExecutionResult(
                success=False,
                app_key=arguments.get("tool", "unknown"),
                tool_name=tool_name,
                error=f"Error executing tool: {str(e)}",
            )

    def _parse_composio_tool_response(
        self, content_str: str, tool_name: str, app_key: str
    ) -> ComposioToolExecutionResult:
        """
        Parse the response from a Composio MCP tool to extract redirect URL using simple regex.

        This approach is much simpler and more reliable than complex JSON parsing.
        We just extract the redirect URL directly using regex since it always follows
        the pattern: https://backend.composio.dev/api/v3/s/{token}
        """
        try:
            import re

            logger.info(f"Extracting redirect URL from Composio response for {app_key}")
            logger.info(f"Raw response (first 200 chars): {content_str[:200]}...")

            # Extract redirect URL using regex
            # Pattern matches: https://backend.composio.dev/api/v3/s/anything
            redirect_pattern = r'https://backend\.composio\.dev/api/v3/s/[^\s\'"]+'
            redirect_match = re.search(redirect_pattern, content_str)

            if not redirect_match:
                logger.error(f"No redirect URL found in response for {app_key}")
                return ComposioToolExecutionResult(
                    success=False,
                    app_key=app_key,
                    tool_name=tool_name,
                    error="No redirect URL found in tool response",
                )

            redirect_url = redirect_match.group(0)
            logger.info(f"Successfully extracted redirect URL: {redirect_url}")

            # Extract connection ID if present (optional)
            connection_id_pattern = r"'connection_id':\s*'([^']+)'"
            connection_id_match = re.search(connection_id_pattern, content_str)
            connection_id = (
                connection_id_match.group(1) if connection_id_match else None
            )

            # Extract instruction if present (optional)
            instruction_pattern = r"'instruction':\s*'([^']+)'"
            instruction_match = re.search(instruction_pattern, content_str)
            instruction = instruction_match.group(1) if instruction_match else None

            logger.info(f"Extracted connection_id: {connection_id}")
            logger.info(f"Extracted instruction: {instruction}")

            return ComposioToolExecutionResult(
                success=True,
                app_key=app_key,
                tool_name=tool_name,
                response_data={"raw_response": content_str},
                redirect_url=redirect_url,
                connection_id=connection_id,
                instruction=instruction,
            )

        except Exception as e:
            logger.error(f"Error extracting redirect URL from Composio response: {e}")
            return ComposioToolExecutionResult(
                success=False,
                app_key=app_key,
                tool_name=tool_name,
                error=f"Error parsing response: {str(e)}",
            )


# Global tool executor instance
composio_tool_executor = ComposioMCPToolExecutor()

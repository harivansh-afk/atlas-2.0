"""
Composio API Client for dynamic MCP URL generation

This service handles programmatic integration with Composio's API to:
1. Create user sessions
2. Install apps for users
3. Extract dynamic MCP URLs
"""

import httpx
import uuid
from typing import Dict, Any, Optional, Tuple, List
from dataclasses import dataclass
from utils.logger import logger
import asyncio


@dataclass
class ComposioSession:
    """Represents a Composio user session"""

    uuid: str
    user_id: str
    apps: Dict[str, Any]


@dataclass
class ComposioAppInstallation:
    """Result of app installation"""

    success: bool
    app_key: str
    mcp_url: Optional[str] = None
    session_uuid: Optional[str] = None
    error: Optional[str] = None
    raw_response: Optional[Dict] = None


class ComposioClient:
    """Client for interacting with Composio's MCP API"""

    def __init__(self):
        self.base_url = "https://mcp.composio.dev"
        self.timeout = 30.0
        self._sessions: Dict[str, ComposioSession] = {}

    def _generate_session_uuid(self, user_id: str) -> str:
        """Generate or get existing session UUID for user"""
        # Check if user already has a session
        for session in self._sessions.values():
            if session.user_id == user_id:
                return session.uuid

        # Create new session
        session_uuid = str(uuid.uuid4())
        self._sessions[session_uuid] = ComposioSession(
            uuid=session_uuid, user_id=user_id, apps={}
        )
        return session_uuid

    async def check_app_status(self, app_key: str, session_uuid: str) -> Dict[str, Any]:
        """Check the status of an app for a session"""
        url = f"{self.base_url}/api/apps/{app_key}"
        params = {"uuid": session_uuid}

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(url, params=params)
                response.raise_for_status()

                logger.info(f"App status check for {app_key}: {response.status_code}")
                return response.json()

        except httpx.HTTPError as e:
            logger.error(f"Failed to check app status for {app_key}: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error checking app status: {e}")
            raise

    async def install_app(
        self, app_key: str, session_uuid: str, install_data: Optional[Dict] = None
    ) -> ComposioAppInstallation:
        """Install an app and get the MCP URL"""
        url = f"{self.base_url}/api/apps/{app_key}/install"

        # Match the exact payload from working request (27 bytes suggests {"uuid": "......"})
        payload = install_data or {"uuid": session_uuid}

        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json, text/plain, */*",
            "Origin": "https://mcp.composio.dev",
            "Referer": f"https://mcp.composio.dev/{app_key}/{session_uuid}",
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
            "DNT": "1",
            "Sec-Ch-Ua": '"Chromium";v="137", "Not/A)Brand";v="24"',
            "Sec-Ch-Ua-Mobile": "?0",
            "Sec-Ch-Ua-Platform": '"macOS"',
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-origin",
        }

        # Match the exact cookies from working request - this is crucial!
        cookies = {
            "uuid": session_uuid,
            "isActiveUser": session_uuid,  # This cookie is key!
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    url, json=payload, headers=headers, cookies=cookies
                )
                response.raise_for_status()

                response_data = response.json()
                logger.info(
                    f"App installation response for {app_key}: {response.status_code}"
                )

                # Extract MCP URL from response - pattern may vary
                mcp_url = self._extract_mcp_url(response_data, app_key, session_uuid)

                return ComposioAppInstallation(
                    success=True,
                    app_key=app_key,
                    mcp_url=mcp_url,
                    session_uuid=session_uuid,
                    raw_response=response_data,
                )

        except httpx.HTTPError as e:
            logger.error(f"Failed to install app {app_key}: {e}")
            return ComposioAppInstallation(
                success=False,
                app_key=app_key,
                error=f"HTTP Error: {e}",
                session_uuid=session_uuid,
            )
        except Exception as e:
            logger.error(f"Unexpected error installing app: {e}")
            return ComposioAppInstallation(
                success=False,
                app_key=app_key,
                error=f"Unexpected error: {e}",
                session_uuid=session_uuid,
            )

    def _extract_mcp_url(
        self, response_data: Dict, app_key: str, session_uuid: str
    ) -> Optional[str]:
        """Extract MCP URL from response (status or installation)"""
        # Common patterns for MCP URLs from Composio
        possible_patterns = [
            # From app status response - this is the key one!
            response_data.get("sseUrl"),
            # Direct URL in response
            response_data.get("mcp_url"),
            response_data.get("url"),
            response_data.get("connection_url"),
            # Nested in data object
            response_data.get("data", {}).get("mcp_url"),
            response_data.get("data", {}).get("url"),
            response_data.get("data", {}).get("sseUrl"),
            # Construct from known pattern
            f"https://mcp.composio.dev/partner/composio/{app_key}/mcp?customerId={session_uuid}",
            f"https://mcp.composio.dev/partner/composio/{app_key}/sse?customerId={session_uuid}",
            f"https://mcp.composio.dev/composio/server/{session_uuid}/mcp",
        ]

        for url in possible_patterns:
            if url and isinstance(url, str) and url.startswith("https://"):
                logger.info(f"Extracted MCP URL: {url}")
                return url

        logger.warning(f"Could not extract MCP URL from response: {response_data}")
        return None

    async def create_user_mcp_connection(
        self, user_id: str, app_key: str
    ) -> ComposioAppInstallation:
        """Complete flow: create session, check app, get MCP URL (try status first, then install if needed)"""
        try:
            # Step 1: Generate session UUID
            session_uuid = self._generate_session_uuid(user_id)
            logger.info(f"Created session {session_uuid} for user {user_id}")

            # Step 2: Check app status and try to extract MCP URL directly
            try:
                status = await self.check_app_status(app_key, session_uuid)
                logger.info(f"App {app_key} status received")

                # Try to extract MCP URL from status response
                mcp_url = self._extract_mcp_url(status, app_key, session_uuid)

                if mcp_url:
                    logger.info(
                        f"Successfully extracted MCP URL from status: {mcp_url}"
                    )
                    # Store session data
                    if session_uuid in self._sessions:
                        self._sessions[session_uuid].apps[app_key] = status

                    return ComposioAppInstallation(
                        success=True,
                        app_key=app_key,
                        mcp_url=mcp_url,
                        session_uuid=session_uuid,
                        raw_response=status,
                    )
                else:
                    logger.warning(
                        f"No MCP URL found in status response, trying installation..."
                    )

            except Exception as e:
                logger.warning(f"App status check failed: {e}")

            # Step 3: If no URL from status, try installation
            installation = await self.install_app(app_key, session_uuid)

            # Step 4: Store session data if successful
            if installation.success and session_uuid in self._sessions:
                self._sessions[session_uuid].apps[app_key] = installation.raw_response

            return installation

        except Exception as e:
            logger.error(
                f"Failed to create MCP connection for user {user_id}, app {app_key}: {e}"
            )
            return ComposioAppInstallation(success=False, app_key=app_key, error=str(e))

    def get_user_sessions(self, user_id: str) -> List[ComposioSession]:
        """Get all sessions for a user"""
        return [
            session for session in self._sessions.values() if session.user_id == user_id
        ]

    def cleanup_session(self, session_uuid: str) -> bool:
        """Clean up a session"""
        if session_uuid in self._sessions:
            del self._sessions[session_uuid]
            return True
        return False


# Global client instance
composio_client = ComposioClient()

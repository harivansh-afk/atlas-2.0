"""
Tool Information Fetcher Service

This service fetches detailed tool information from Composio MCP servers
for tools mentioned in user messages. It uses the existing MCP discovery
infrastructure to get accurate tool schemas and descriptions.
"""

import asyncio
from typing import Dict, List, Optional, Any
from utils.logger import logger
from utils.tool_mention_processor import ParsedToolMention, ToolInformation
from services.composio_integration import ComposioMCPService
from services.mcp_custom import discover_custom_tools
from agent.tools.mcp_tool_wrapper import MCPToolWrapper


class ToolInformationFetcher:
    """Fetches detailed information about tools from various MCP sources."""

    def __init__(self):
        """Initialize the tool information fetcher."""
        self.composio_service = ComposioMCPService()

    async def fetch_tool_information(
        self, mentions: List[ParsedToolMention], user_id: str
    ) -> List[ToolInformation]:
        """
        Fetch detailed information for all mentioned tools.

        Args:
            mentions: List of parsed tool mentions
            user_id: User ID for authentication and access control

        Returns:
            List of tool information objects
        """
        tool_info_list = []

        # Group mentions by type for efficient processing
        composio_mentions = [m for m in mentions if m.type == "composio_mcp"]
        custom_mentions = [
            m for m in mentions if m.type in ["custom_mcp", "configured_mcp"]
        ]

        # Fetch Composio tool information
        if composio_mentions:
            composio_info = await self._fetch_composio_tool_info(
                composio_mentions, user_id
            )
            tool_info_list.extend(composio_info)

        # Fetch custom MCP tool information
        if custom_mentions:
            custom_info = await self._fetch_custom_mcp_tool_info(
                custom_mentions, user_id
            )
            tool_info_list.extend(custom_info)

        logger.info(f"Fetched information for {len(tool_info_list)} tools")
        return tool_info_list

    async def _fetch_composio_tool_info(
        self, mentions: List[ParsedToolMention], user_id: str
    ) -> List[ToolInformation]:
        """
        Fetch tool information from Composio MCP servers.

        Args:
            mentions: List of Composio tool mentions
            user_id: User ID for authentication

        Returns:
            List of tool information objects
        """
        tool_info_list = []

        # Extract unique app keys from mentions
        app_keys = set()
        for mention in mentions:
            app_key = self._extract_app_key_from_mention(mention)
            if app_key:
                app_keys.add(app_key)

        logger.info(f"Fetching Composio tool info for apps: {list(app_keys)}")

        # Fetch tool information for each app with timeout and retry logic
        for app_key in app_keys:
            try:
                # Add timeout for the entire operation
                async with asyncio.timeout(30):  # 30 second timeout per app
                    # Get MCP connection for the app
                    connection = await self.composio_service.create_user_mcp_connection_no_storage(
                        user_id, app_key
                    )

                    if not connection.success or not connection.mcp_url:
                        logger.warning(f"Could not get MCP connection for {app_key}")
                        tool_info_list.append(
                            ToolInformation(
                                name=app_key,
                                description=f"Composio {app_key} integration",
                                input_schema={},
                                app_key=app_key,
                                error=f"MCP connection not available for {app_key}",
                            )
                        )
                        continue

                    # Discover tools using the existing infrastructure
                    discovery_result = await discover_custom_tools(
                        request_type="http", config={"url": connection.mcp_url}
                    )

                    # Validate discovery result
                    if not discovery_result or not isinstance(discovery_result, dict):
                        logger.warning(f"Invalid discovery result for {app_key}")
                        tool_info_list.append(
                            ToolInformation(
                                name=app_key,
                                description=f"Composio {app_key} integration",
                                input_schema={},
                                app_key=app_key,
                                error=f"Invalid tool discovery response for {app_key}",
                            )
                        )
                        continue

                    # Process discovered tools
                    tools = discovery_result.get("tools", [])
                    if not tools:
                        logger.warning(f"No tools found for {app_key}")
                        tool_info_list.append(
                            ToolInformation(
                                name=app_key,
                                description=f"Composio {app_key} integration",
                                input_schema={},
                                app_key=app_key,
                                error=f"No tools available for {app_key}",
                            )
                        )
                        continue

                    for tool in tools:
                        try:
                            tool_info = ToolInformation(
                                name=tool.get("name", "Unknown"),
                                description=tool.get(
                                    "description", "No description available"
                                ),
                                input_schema=tool.get("inputSchema", {}),
                                app_key=app_key,
                                mcp_url=connection.mcp_url,
                            )
                            tool_info_list.append(tool_info)
                        except Exception as tool_error:
                            logger.warning(
                                f"Error processing tool {tool.get('name', 'unknown')} for {app_key}: {tool_error}"
                            )
                            continue

                    logger.info(f"Fetched {len(tools)} tools for {app_key}")

            except asyncio.TimeoutError:
                logger.error(f"Timeout fetching tool info for {app_key}")
                tool_info_list.append(
                    ToolInformation(
                        name=app_key,
                        description=f"Composio {app_key} integration",
                        input_schema={},
                        app_key=app_key,
                        error=f"Timeout fetching tool information for {app_key}",
                    )
                )
            except Exception as e:
                logger.error(f"Error fetching tool info for {app_key}: {str(e)}")
                tool_info_list.append(
                    ToolInformation(
                        name=app_key,
                        description=f"Composio {app_key} integration",
                        input_schema={},
                        app_key=app_key,
                        error=f"Failed to fetch tool information: {str(e)}",
                    )
                )

        return tool_info_list

    async def _fetch_custom_mcp_tool_info(
        self, mentions: List[ParsedToolMention], user_id: str
    ) -> List[ToolInformation]:
        """
        Fetch tool information from custom MCP servers.

        Args:
            mentions: List of custom MCP tool mentions
            user_id: User ID for authentication

        Returns:
            List of tool information objects
        """
        tool_info_list = []

        # For custom MCP tools, we need to get the agent's MCP configuration
        # and use the MCP tool wrapper to fetch tool information
        try:
            # This would require access to the agent's MCP configuration
            # For now, we'll create placeholder information
            for mention in mentions:
                tool_info = ToolInformation(
                    name=mention.display,
                    description=f"Custom MCP tool: {mention.display}",
                    input_schema={},
                    error="Custom MCP tool information fetching not yet implemented",
                )
                tool_info_list.append(tool_info)

        except Exception as e:
            logger.error(f"Error fetching custom MCP tool info: {str(e)}")

        return tool_info_list

    def _extract_app_key_from_mention(
        self, mention: ParsedToolMention
    ) -> Optional[str]:
        """
        Extract app key from a Composio tool mention.

        Args:
            mention: The tool mention object

        Returns:
            App key if found, None otherwise
        """
        # Remove common prefixes
        cleaned_id = mention.id.replace("available_composio_", "").replace(
            "composio_", ""
        )

        # Split by underscore and take the first part as app key
        parts = cleaned_id.split("_")
        if parts:
            return parts[0].lower()

        return None

    async def get_tool_schemas_for_prompt(
        self, mentions: List[ParsedToolMention], user_id: str
    ) -> str:
        """
        Get formatted tool schemas for inclusion in the system prompt.

        Args:
            mentions: List of parsed tool mentions
            user_id: User ID for authentication

        Returns:
            Formatted string with tool information for the prompt
        """
        if not mentions:
            return ""

        tool_info_list = await self.fetch_tool_information(mentions, user_id)

        if not tool_info_list:
            return ""

        # Create a processor instance to format the prompt
        from utils.tool_mention_processor import ToolMentionProcessor

        processor = ToolMentionProcessor()

        return processor.create_tool_context_prompt(tool_info_list)

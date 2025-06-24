"""
Tool Mention Preprocessing Utility

This module provides functionality to parse tool mentions from user messages
and fetch detailed tool information from Composio MCP servers before agent execution.
This helps reduce hallucination by providing the agent with accurate tool schemas.
"""

import re
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from utils.logger import logger


@dataclass
class ParsedToolMention:
    """Represents a parsed tool mention from a user message."""

    id: str
    display: str
    type: str  # 'configured_mcp' | 'custom_mcp' | 'composio_mcp'
    status: Optional[str] = (
        None  # 'connected_to_agent' | 'connected_to_account' | 'available_to_connect'
    )
    original_text: str = ""
    start_index: int = 0
    end_index: int = 0


@dataclass
class ToolInformation:
    """Represents detailed information about a tool fetched from MCP servers."""

    name: str
    description: str
    input_schema: Dict[str, Any]
    app_key: Optional[str] = None
    mcp_url: Optional[str] = None
    error: Optional[str] = None


class ToolMentionProcessor:
    """Processes tool mentions in user messages and fetches tool information."""

    # Regular expression to match tool mentions in the format @[DisplayName](toolId)
    MENTION_REGEX = re.compile(r"@\[([^\]]+)\]\(([^)]+)\)")

    def __init__(self):
        """Initialize the tool mention processor."""
        pass

    def parse_tool_mentions(self, message: str) -> List[ParsedToolMention]:
        """
        Parse tool mentions from a message string.

        Args:
            message: The message containing potential tool mentions

        Returns:
            List of parsed tool mentions
        """
        mentions = []

        for match in self.MENTION_REGEX.finditer(message):
            display, tool_id = match.groups()
            start_index = match.start()
            end_index = match.end()
            original_text = match.group(0)

            # Determine tool type from ID
            tool_type = self._determine_tool_type(tool_id)

            mention = ParsedToolMention(
                id=tool_id,
                display=display,
                type=tool_type,
                original_text=original_text,
                start_index=start_index,
                end_index=end_index,
            )

            mentions.append(mention)

        logger.info(f"Parsed {len(mentions)} tool mentions from message")
        return mentions

    def _determine_tool_type(self, tool_id: str) -> str:
        """
        Determine the type of tool based on its ID.

        Args:
            tool_id: The tool identifier

        Returns:
            Tool type string
        """
        if tool_id.startswith("configured_mcp_") or tool_id.startswith(
            "default_configured_mcp_"
        ):
            return "configured_mcp"
        elif tool_id.startswith("custom_mcp_") or tool_id.startswith(
            "default_custom_mcp_"
        ):
            return "custom_mcp"
        elif "composio" in tool_id or tool_id.startswith("available_composio_"):
            return "composio_mcp"
        else:
            return "unknown"

    def has_tool_mentions(self, message: str) -> bool:
        """
        Check if a message contains any tool mentions.

        Args:
            message: The message to check

        Returns:
            True if the message contains tool mentions
        """
        return bool(self.MENTION_REGEX.search(message))

    def extract_composio_app_keys(self, mentions: List[ParsedToolMention]) -> List[str]:
        """
        Extract Composio app keys from tool mentions.

        Args:
            mentions: List of parsed tool mentions

        Returns:
            List of unique Composio app keys
        """
        app_keys = []

        for mention in mentions:
            if mention.type == "composio_mcp":
                # Extract app key from tool ID
                # Expected formats: 'available_composio_gmail', 'composio_slack', etc.
                app_key = self._extract_app_key_from_id(mention.id)
                if app_key and app_key not in app_keys:
                    app_keys.append(app_key)

        logger.info(f"Extracted {len(app_keys)} unique Composio app keys: {app_keys}")
        return app_keys

    def _extract_app_key_from_id(self, tool_id: str) -> Optional[str]:
        """
        Extract app key from a Composio tool ID.

        Args:
            tool_id: The tool identifier

        Returns:
            App key if found, None otherwise
        """
        # Remove common prefixes
        cleaned_id = tool_id.replace("available_composio_", "").replace("composio_", "")

        # Split by underscore and take the first part as app key
        parts = cleaned_id.split("_")
        if parts:
            return parts[0].lower()

        return None

    def create_tool_context_prompt(self, tool_info_list: List[ToolInformation]) -> str:
        """
        Create a comprehensive context prompt with tool information and task guidance.

        Args:
            tool_info_list: List of tool information objects

        Returns:
            Formatted prompt text with tool information and task-specific guidance
        """
        if not tool_info_list:
            return ""

        # Group tools by app for more concise presentation
        tools_by_app = {}
        for tool in tool_info_list:
            app_key = tool.app_key or "unknown"
            if app_key not in tools_by_app:
                tools_by_app[app_key] = []
            tools_by_app[app_key].append(tool)

        prompt_parts = [
            "\n=== MENTIONED TOOLS ===",
            "User mentioned these tools. Available functions:",
        ]

        for app_key, tools in tools_by_app.items():
            # Filter out error tools for the main list
            valid_tools = [t for t in tools if not t.error]
            error_tools = [t for t in tools if t.error]

            if valid_tools:
                # Show ALL tool names (no limit to prevent hallucination)
                tool_names = [t.name for t in valid_tools]
                prompt_parts.append(f"{app_key.upper()}: {', '.join(tool_names)}")

                # Add task-specific guidance for this tool
                task_guidance = self._get_tool_task_guidance(app_key)
                if task_guidance:
                    prompt_parts.append(task_guidance)

                # Add brief technical details for key tools (first 2 for brevity)
                prompt_parts.append("\nTechnical Details:")
                for tool in valid_tools[:2]:
                    # Extract key parameters from schema
                    key_params = self._extract_key_parameters(tool.input_schema)
                    param_str = f"({key_params})" if key_params else ""

                    # Truncate description to keep it concise
                    desc = (
                        tool.description[:60] + "..."
                        if len(tool.description) > 60
                        else tool.description
                    )
                    prompt_parts.append(f"  • {tool.name}{param_str}: {desc}")

                # If there are more than 2 tools, mention the count
                if len(valid_tools) > 2:
                    prompt_parts.append(
                        f"  • ...and {len(valid_tools) - 2} more tools available"
                    )

            # Note errors briefly
            if error_tools:
                prompt_parts.append(
                    f"{app_key.upper()}: {len(error_tools)} tools unavailable"
                )

        prompt_parts.extend(
            [
                "",
                "🔧 WORKFLOW GUIDANCE:",
                "• Use exact tool names listed above - they are connected and ready",
                "• Combine multiple tools for complex workflows (e.g., Gmail + Notion + Sheets)",
                "• Follow the workflow examples for common task patterns",
                "• Always confirm actions before executing sensitive operations",
                "• Break complex tasks into smaller, manageable steps",
                "",
                "=== END MENTIONED TOOLS ===",
                "",
            ]
        )

        return "\n".join(prompt_parts)

    def _extract_key_parameters(self, input_schema: Dict[str, Any]) -> str:
        """
        Extract key parameters from tool schema for concise display.

        Args:
            input_schema: Tool input schema

        Returns:
            Concise parameter string
        """
        if not input_schema or not isinstance(input_schema, dict):
            return ""

        properties = input_schema.get("properties", {})
        required = input_schema.get("required", [])

        if not properties:
            return ""

        # Get up to 3 most important parameters (required first)
        key_params = []

        # Add required parameters first
        for param in required[:2]:  # Max 2 required params
            if param in properties:
                param_info = properties[param]
                param_type = param_info.get("type", "")
                key_params.append(f"{param}: {param_type}")

        # Add one optional parameter if we have space
        if len(key_params) < 3:
            for param, param_info in properties.items():
                if param not in required and len(key_params) < 3:
                    param_type = param_info.get("type", "")
                    key_params.append(f"{param}?: {param_type}")
                    break

        return ", ".join(key_params)

    def _get_tool_task_guidance(self, app_key: str) -> str:
        """
        Get task-specific guidance for common workflows with each tool.

        Args:
            app_key: The application key (e.g., 'gmail', 'notion', 'slack')

        Returns:
            Formatted guidance string with common task examples
        """
        # Define task guidance for each major tool
        guidance_map = {
            "gmail": {
                "title": "📧 Gmail - Email Management",
                "common_tasks": [
                    "• Send emails: Use GMAIL_SEND_EMAIL with recipient, subject, and body",
                    "• Search emails: Use GMAIL_FETCH_EMAILS with query filters",
                    "• Reply to threads: Use GMAIL_REPLY_TO_THREAD for conversations",
                    "• Manage drafts: Use GMAIL_LIST_DRAFTS and GMAIL_SEND_DRAFT",
                    "• Get contacts: Use GMAIL_GET_CONTACTS for address book access",
                ],
                "workflow_examples": [
                    "→ Cold outreach: Search contacts → Draft personalized emails → Send sequence",
                    "→ Follow-ups: Find email threads → Reply with updates → Track responses",
                ],
            },
            "notion": {
                "title": "📝 Notion - Knowledge Management",
                "common_tasks": [
                    "• Create pages: Use NOTION_CREATE_PAGE with title and content blocks",
                    "• Update databases: Use NOTION_UPDATE_DATABASE_ITEM for records",
                    "• Search content: Use NOTION_SEARCH for finding pages/databases",
                    "• Manage properties: Use database tools for structured data",
                    "• Create templates: Set up reusable page structures",
                ],
                "workflow_examples": [
                    "→ Project tracking: Create database → Add tasks → Update status → Generate reports",
                    "→ Meeting notes: Create page → Add attendees → Record action items → Share summary",
                ],
            },
            "slack": {
                "title": "💬 Slack - Team Communication",
                "common_tasks": [
                    "• Send messages: Use SLACK_SENDS_A_MESSAGE_TO_A_SLACK_CHANNEL",
                    "• Search conversations: Use SLACK_SEARCH_FOR_MESSAGES_WITH_QUERY",
                    "• Add reactions: Use SLACK_ADD_REACTION_TO_AN_ITEM for engagement",
                    "• Set reminders: Use SLACK_CREATE_A_REMINDER for follow-ups",
                    "• Update messages: Use SLACK_UPDATES_A_SLACK_MESSAGE for edits",
                ],
                "workflow_examples": [
                    "→ Team updates: Send status → Add reactions → Create follow-up reminders",
                    "→ Incident response: Search related messages → Update team → Set action reminders",
                ],
            },
            "google": {
                "title": "📊 Google Workspace - Documents & Sheets",
                "common_tasks": [
                    "• Create documents: Use GOOGLEDOCS_CREATE_DOCUMENT for new docs",
                    "• Create spreadsheets: Use GOOGLESHEETS_CREATE_SPREADSHEET",
                    "• Update content: Use batch update operations for efficiency",
                    "• Share files: Set permissions and sharing settings",
                    "• Export data: Convert to various formats (PDF, Excel, etc.)",
                ],
                "workflow_examples": [
                    "→ Reporting: Create sheet → Import data → Add formulas → Share with team",
                    "→ Documentation: Create doc → Add content → Format → Set permissions",
                ],
            },
            "linear": {
                "title": "🎯 Linear - Project Management",
                "common_tasks": [
                    "• Create issues: Use LINEAR_CREATE_ISSUE with title, description, labels",
                    "• Update status: Use LINEAR_UPDATE_ISSUE for progress tracking",
                    "• Manage projects: Use LINEAR_CREATE_PROJECT for organization",
                    "• Set priorities: Use priority and status fields effectively",
                    "• Link issues: Create relationships between related tasks",
                ],
                "workflow_examples": [
                    "→ Bug tracking: Create issue → Set priority → Assign team → Track resolution",
                    "→ Feature development: Create epic → Break into tasks → Track progress → Review",
                ],
            },
            "hubspot": {
                "title": "🤝 HubSpot - CRM & Sales",
                "common_tasks": [
                    "• Manage contacts: Create and update contact records",
                    "• Track deals: Use deal pipeline for sales management",
                    "• Log activities: Record calls, emails, and meetings",
                    "• Create sequences: Set up automated follow-up workflows",
                    "• Generate reports: Analyze sales performance and metrics",
                ],
                "workflow_examples": [
                    "→ Lead nurturing: Create contact → Add to sequence → Track engagement → Convert",
                    "→ Sales pipeline: Create deal → Update stages → Log activities → Close deal",
                ],
            },
        }

        # Get guidance for this app, or create generic guidance
        if app_key.lower() in guidance_map:
            guidance = guidance_map[app_key.lower()]

            guidance_parts = [f"\n{guidance['title']}", "Common Tasks:"]
            guidance_parts.extend(guidance["common_tasks"])
            guidance_parts.append("\nWorkflow Examples:")
            guidance_parts.extend(guidance["workflow_examples"])

            return "\n".join(guidance_parts)
        else:
            # Generic guidance for unknown tools
            return f"\n📋 {app_key.upper()} - Available Tools\n• Use the available functions to interact with {app_key}\n• Combine multiple tool calls for complex workflows"

    def get_mention_statistics(
        self, mentions: List[ParsedToolMention]
    ) -> Dict[str, Any]:
        """
        Get statistics about tool mentions for monitoring purposes.

        Args:
            mentions: List of parsed tool mentions

        Returns:
            Dictionary with mention statistics
        """
        stats = {
            "total_mentions": len(mentions),
            "by_type": {},
            "unique_tools": set(),
            "mention_details": [],
        }

        for mention in mentions:
            # Count by type
            if mention.type not in stats["by_type"]:
                stats["by_type"][mention.type] = 0
            stats["by_type"][mention.type] += 1

            # Track unique tools
            stats["unique_tools"].add(mention.id)

            # Store mention details
            stats["mention_details"].append(
                {
                    "id": mention.id,
                    "display": mention.display,
                    "type": mention.type,
                    "status": mention.status,
                }
            )

        # Convert set to count
        stats["unique_tools"] = len(stats["unique_tools"])

        logger.info(f"Tool mention statistics: {stats}")
        return stats

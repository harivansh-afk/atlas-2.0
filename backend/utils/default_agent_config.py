"""
Default agent configuration utilities.

This module provides centralized configuration for default agent creation,
ensuring consistency across all places where default agents are created.
"""

# Default agent tools configuration - all legacy tools enabled for new users
DEFAULT_AGENT_TOOLS_CONFIG = {
    "sb_shell_tool": {
        "enabled": True,
        "description": "Execute terminal commands, run scripts, manage system processes",
    },
    "sb_files_tool": {
        "enabled": True,
        "description": "Create, read, edit, and organize files and directories",
    },
    "sb_browser_tool": {
        "enabled": True,
        "description": "Navigate websites, interact with web applications, scrape content",
    },
    "sb_deploy_tool": {
        "enabled": True,
        "description": "Deploy applications, manage containers, handle CI/CD workflows",
    },
    "sb_expose_tool": {
        "enabled": True,
        "description": "Expose local services and ports for testing and development",
    },
    "web_search_tool": {
        "enabled": True,
        "description": "Search the internet for current information and research",
    },
    "sb_vision_tool": {
        "enabled": True,
        "description": "Process images, analyze visual content, generate visual insights",
    },
    "data_providers_tool": {
        "enabled": True,
        "description": "Access external APIs and data sources",
    },
    "clado_tool": {
        "enabled": True,
        "description": "Clado integration for enhanced functionality",
    },
}

# Default agent configuration
DEFAULT_AGENT_CONFIG = {
    "name": "Atlas",
    "description": "Your default Atlas agent with centralized tool configurations",
    "system_prompt": "You are Atlas, a helpful AI assistant with access to various tools and integrations. Provide clear, accurate, and helpful responses to user queries.",
    "configured_mcps": [],
    "custom_mcps": [],
    "agentpress_tools": DEFAULT_AGENT_TOOLS_CONFIG,
    "is_default": True,
    "avatar": "🗿",
    "avatar_color": "#000000",
}


def get_default_agent_config(account_id: str) -> dict:
    """
    Get the default agent configuration for a given account.

    Args:
        account_id: The account ID to create the agent for

    Returns:
        Dict containing the complete default agent configuration
    """
    config = DEFAULT_AGENT_CONFIG.copy()
    config["account_id"] = account_id
    return config


def get_default_agent_tools() -> dict:
    """
    Get the default agent tools configuration.

    Returns:
        Dict containing the default tools configuration with all legacy tools enabled
    """
    return DEFAULT_AGENT_TOOLS_CONFIG.copy()

import React from 'react';
import {
  Search, ExternalLink, ArrowRight, Check, Loader2,
  Terminal, FolderOpen, Globe, Rocket, Link, Eye, BarChart3,
  Wrench, Zap
} from 'lucide-react';
import {
  SiGmail, SiNotion, SiLinear, SiHubspot, SiFigma, SiClickup,
  SiGooglesheets, SiGoogledocs, SiSlack, SiGithub, SiTrello,
  SiAsana, SiJira, SiDiscord, SiTwitter, SiLinkedin, SiYoutube,
  SiSpotify, SiDropbox, SiZoom, SiSalesforce, SiMailchimp,
  SiStripe, SiPaypal, SiShopify, SiWordpress, SiAdobe, SiCanva
} from 'react-icons/si';
import { FaMicrosoft, FaTwitter } from 'react-icons/fa';

// Core integration icon mapping
export const integrationIcons: Record<string, React.ComponentType<any>> = {
  'gmail': SiGmail,
  'google': SiGooglesheets, // Default to Sheets for google
  'googledocs': SiGoogledocs,
  'googlesheets': SiGooglesheets,
  'googlecalendar': SiGooglesheets, // Using sheets as fallback for calendar
  'googledrive': SiGooglesheets, // Using sheets as fallback for drive
  'notion': SiNotion,
  'linear': SiLinear,
  'hubspot': SiHubspot,
  'twitter': FaTwitter,
  'figma': SiFigma,
  'clickup': SiClickup,
  'slack': SiSlack,
  'github': SiGithub,
  'microsoft': FaMicrosoft,
  'trello': SiTrello,
  'asana': SiAsana,
  'jira': SiJira,
  'discord': SiDiscord,
  'linkedin': SiLinkedin,
  'youtube': SiYoutube,
  'spotify': SiSpotify,
  'dropbox': SiDropbox,
  'zoom': SiZoom,
  'salesforce': SiSalesforce,
  'mailchimp': SiMailchimp,
  'stripe': SiStripe,
  'paypal': SiPaypal,
  'shopify': SiShopify,
  'wordpress': SiWordpress,
  'adobe': SiAdobe,
  'canva': SiCanva,
};

// AgentPress tool icon mapping
export const agentpressIcons: Record<string, React.ComponentType<any>> = {
  'sb_shell_tool': Terminal,
  'sb_files_tool': FolderOpen,
  'sb_browser_tool': Globe,
  'sb_deploy_tool': Rocket,
  'sb_expose_tool': Link,
  'web_search_tool': Search,
  'sb_vision_tool': Eye,
  'data_providers_tool': BarChart3,
};

// State-specific icons for tool mentions
export const mentionStateIcons = {
  'available_to_connect': ExternalLink,
  'connected_to_account': ArrowRight,
  'connected_to_agent': Check,
  'loading': Loader2,
} as const;

export type MentionState = keyof typeof mentionStateIcons;

// Tool types for classification
export type ToolType = 'configured_mcp' | 'custom_mcp' | 'composio_mcp' | 'agentpress';

// Interface for tool objects
export interface ToolInfo {
  name: string;
  displayName?: string;
  qualifiedName?: string;
  isCustom?: boolean;
  type?: ToolType;
  appKey?: string;
}

/**
 * Get icon component for MCP tools based on name and metadata
 */
export function getMCPIconComponent(tool: ToolInfo): React.ComponentType<any> {
  const lowerName = tool.name.toLowerCase();
  const qualifiedName = tool.qualifiedName?.toLowerCase() || '';
  const displayName = tool.displayName?.toLowerCase() || '';

  // Handle AgentPress tools first
  if (tool.type === 'agentpress') {
    const agentpressIcon = agentpressIcons[lowerName];
    if (agentpressIcon) return agentpressIcon;
    return Wrench; // Default for unknown agentpress tools
  }

  // Handle Smithery MCP servers by qualifiedName first
  if (!tool.isCustom && qualifiedName) {
    // Common Smithery MCP servers
    if (qualifiedName.includes('exa')) return Search;
    if (qualifiedName.includes('github')) return integrationIcons['github'];
    if (qualifiedName.includes('notion')) return integrationIcons['notion'];
    if (qualifiedName.includes('slack')) return integrationIcons['slack'];
    if (qualifiedName.includes('linear')) return integrationIcons['linear'];
    if (qualifiedName.includes('figma')) return integrationIcons['figma'];
    if (qualifiedName.includes('desktop-commander')) return integrationIcons['microsoft'];
    if (qualifiedName.includes('filesystem')) return Search;
  }

  // Check all name variations (name, displayName)
  const namesToCheck = [lowerName, displayName].filter(Boolean);

  for (const nameToCheck of namesToCheck) {
    // Gmail variations
    if (nameToCheck.includes('gmail')) return integrationIcons['gmail'];

    // Google services
    if (nameToCheck.includes('google')) {
      if (nameToCheck.includes('docs')) return integrationIcons['googledocs'];
      if (nameToCheck.includes('sheets')) return integrationIcons['googlesheets'];
      if (nameToCheck.includes('calendar')) return integrationIcons['googlecalendar'];
      if (nameToCheck.includes('drive')) return integrationIcons['googledrive'];
      return integrationIcons['google']; // Default to sheets
    }

    // Other integrations
    if (nameToCheck.includes('notion')) return integrationIcons['notion'];
    if (nameToCheck.includes('linear')) return integrationIcons['linear'];
    if (nameToCheck.includes('hubspot')) return integrationIcons['hubspot'];
    if (nameToCheck.includes('twitter') || nameToCheck.includes('x.com')) return integrationIcons['twitter'];
    if (nameToCheck.includes('figma')) return integrationIcons['figma'];
    if (nameToCheck.includes('clickup')) return integrationIcons['clickup'];
    if (nameToCheck.includes('slack')) return integrationIcons['slack'];
    if (nameToCheck.includes('github')) return integrationIcons['github'];
    if (nameToCheck.includes('microsoft')) return integrationIcons['microsoft'];
    if (nameToCheck.includes('trello')) return integrationIcons['trello'];
    if (nameToCheck.includes('asana')) return integrationIcons['asana'];
    if (nameToCheck.includes('jira')) return integrationIcons['jira'];
    if (nameToCheck.includes('discord')) return integrationIcons['discord'];
    if (nameToCheck.includes('linkedin')) return integrationIcons['linkedin'];
    if (nameToCheck.includes('youtube')) return integrationIcons['youtube'];
    if (nameToCheck.includes('spotify')) return integrationIcons['spotify'];
    if (nameToCheck.includes('dropbox')) return integrationIcons['dropbox'];
    if (nameToCheck.includes('zoom')) return integrationIcons['zoom'];
    if (nameToCheck.includes('salesforce')) return integrationIcons['salesforce'];
    if (nameToCheck.includes('mailchimp')) return integrationIcons['mailchimp'];
    if (nameToCheck.includes('stripe')) return integrationIcons['stripe'];
    if (nameToCheck.includes('paypal')) return integrationIcons['paypal'];
    if (nameToCheck.includes('shopify')) return integrationIcons['shopify'];
    if (nameToCheck.includes('wordpress')) return integrationIcons['wordpress'];
    if (nameToCheck.includes('adobe')) return integrationIcons['adobe'];
    if (nameToCheck.includes('canva')) return integrationIcons['canva'];
  }

  // Default fallback
  return Search;
}

/**
 * Get icon component for tool mention states
 */
export function getMentionStateIcon(state: MentionState): React.ComponentType<any> {
  return mentionStateIcons[state];
}

/**
 * Get icon for Composio apps using the same logic as MCP tools
 */
export function getComposioAppIcon(app: { name: string; key: string; icon?: string }): React.ComponentType<any> {
  // If we have a React icon component name, try to resolve it
  if (app.icon && !app.icon.startsWith('http') && !app.icon.match(/[\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}]/u)) {
    // This might be a component name, but for now we'll fall through to name-based matching
  }

  // Use the same logic as MCP tools
  return getMCPIconComponent({
    name: app.name,
    displayName: app.name,
    appKey: app.key,
    type: 'composio_mcp'
  });
}

/**
 * Helper to get all MCP tools for an agent with their icons
 */
export function getAgentMCPTools(agent: any): Array<{name: string, IconComponent: React.ComponentType<any>}> {
  if (!agent) return [];

  const tools: Array<{name: string, IconComponent: React.ComponentType<any>}> = [];

  // Add configured MCPs
  if (agent.configured_mcps) {
    agent.configured_mcps.forEach((mcp: any) => {
      tools.push({
        name: mcp.name,
        IconComponent: getMCPIconComponent({
          ...mcp,
          isCustom: false,
          type: 'configured_mcp'
        })
      });
    });
  }

  // Add custom MCPs
  if (agent.custom_mcps) {
    agent.custom_mcps.forEach((mcp: any) => {
      tools.push({
        name: mcp.name,
        IconComponent: getMCPIconComponent({
          ...mcp,
          isCustom: true,
          type: 'custom_mcp'
        })
      });
    });
  }

  return tools;
}

/**
 * Resolve tool icon from various tool formats used across the app
 */
export function resolveToolIcon(tool: any): React.ComponentType<any> {
  // Handle ClassifiedMCPTool format
  if (tool.type && tool.name) {
    return getMCPIconComponent({
      name: tool.name,
      displayName: tool.displayName,
      qualifiedName: tool.qualifiedName,
      isCustom: tool.type === 'custom_mcp',
      type: tool.type,
      appKey: tool.appKey
    });
  }

  // Handle tool ID format (from mention markup)
  if (tool.id) {
    const toolId = tool.id;
    const displayName = tool.displayName || tool.name || '';

    // Parse tool type from ID
    let toolType: ToolType = 'custom_mcp';
    let toolName = displayName;

    if (toolId.startsWith('configured_mcp_') || toolId.startsWith('default_configured_mcp_')) {
      toolType = 'configured_mcp';
      toolName = toolId.replace(/^(default_)?configured_mcp_/, '');
    } else if (toolId.startsWith('custom_mcp_') || toolId.startsWith('default_custom_mcp_')) {
      toolType = 'custom_mcp';
      toolName = toolId.replace(/^(default_)?custom_mcp_/, '');
    } else if (toolId.includes('composio') || toolId.startsWith('available_composio_')) {
      toolType = 'composio_mcp';
      toolName = toolId.replace(/^available_composio_/, '');
    } else if (toolId.startsWith('agentpress_')) {
      toolType = 'agentpress';
      toolName = toolId.replace('agentpress_', '');
    }

    return getMCPIconComponent({
      name: toolName,
      displayName: displayName,
      isCustom: toolType === 'custom_mcp',
      type: toolType
    });
  }

  // Handle simple tool objects
  if (tool.name) {
    return getMCPIconComponent({
      name: tool.name,
      displayName: tool.displayName || tool.name,
      qualifiedName: tool.qualifiedName,
      isCustom: tool.isCustom,
      type: tool.type
    });
  }

  // Fallback
  return Search;
}

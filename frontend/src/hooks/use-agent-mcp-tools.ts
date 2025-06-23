import { useMemo } from 'react';
import { useAgent } from '@/hooks/react-query/agents/use-agents';
import { useDefaultAgentMCPs } from '@/hooks/react-query/agents/use-agents';

export interface MCPTool {
  id: string;
  name: string;
  displayName: string;
  description: string;
  icon: string;
  type: 'configured_mcp' | 'custom_mcp' | 'composio_mcp';
  config: Record<string, any>;
  enabledTools?: string[];
  toolCount?: number;
  qualifiedName?: string;
  isComposio?: boolean;
}

interface AgentMCPToolsResult {
  currentAgentMCPs: MCPTool[];
  defaultAgentMCPs: MCPTool[];
  allAgentMCPs: MCPTool[];
  isLoading: boolean;
  error: any;
}

/**
 * Hook to fetch MCP tools from current agent and default agent
 * Focuses only on custom_mcps and configured_mcps columns
 */
export function useAgentMCPTools(agentId?: string): AgentMCPToolsResult {
  const { data: agent, isLoading: agentLoading, error: agentError } = useAgent(agentId || '');
  const { data: defaultAgentMCPs, isLoading: defaultLoading } = useDefaultAgentMCPs();

  const currentAgentMCPs = useMemo((): MCPTool[] => {
    if (!agent) return [];

    const mcpTools: MCPTool[] = [];

    // Add configured MCPs (standard Smithery MCPs)
    if (agent.configured_mcps) {
      agent.configured_mcps.forEach((mcp) => {
        const qualifiedName = (mcp as any).qualifiedName || `configured_${mcp.name.replace(/\s+/g, '_').toLowerCase()}`;
        mcpTools.push({
          id: `configured_mcp_${mcp.name}`,
          name: mcp.name,
          displayName: mcp.name,
          description: `MCP server: ${mcp.name}`,
          icon: getMCPIcon(mcp.name, false, qualifiedName),
          type: 'configured_mcp',
          config: mcp.config,
          enabledTools: (mcp as any).enabledTools,
          qualifiedName,
        });
      });
    }

    // Add custom MCPs (including Composio integrations)
    if (agent.custom_mcps) {
      agent.custom_mcps.forEach((mcp) => {
        const isComposio = mcp.config?.url?.includes('mcp.composio.dev');
        mcpTools.push({
          id: `custom_mcp_${mcp.name}`,
          name: mcp.name,
          displayName: mcp.name,
          description: isComposio ? `Composio integration: ${mcp.name}` : `Custom MCP server: ${mcp.name}`,
          icon: getMCPIcon(mcp.name, true),
          type: isComposio ? 'composio_mcp' : 'custom_mcp',
          config: mcp.config,
          enabledTools: mcp.enabledTools,
          toolCount: mcp.enabledTools?.length || 0,
          isComposio,
        });
      });
    }

    return mcpTools;
  }, [agent]);

  const defaultAgentMCPTools = useMemo((): MCPTool[] => {
    if (!defaultAgentMCPs) return [];

    const mcpTools: MCPTool[] = [];

    // Add configured MCPs from default agent
    if (defaultAgentMCPs.configured_mcps) {
      defaultAgentMCPs.configured_mcps.forEach((mcp) => {
        const qualifiedName = (mcp as any).qualifiedName || `configured_${mcp.name.replace(/\s+/g, '_').toLowerCase()}`;
        mcpTools.push({
          id: `default_configured_mcp_${mcp.name}`,
          name: mcp.name,
          displayName: mcp.name,
          description: `Default MCP server: ${mcp.name}`,
          icon: getMCPIcon(mcp.name, false, qualifiedName),
          type: 'configured_mcp',
          config: mcp.config,
          enabledTools: (mcp as any).enabledTools,
          qualifiedName,
        });
      });
    }

    // Add custom MCPs from default agent
    if (defaultAgentMCPs.custom_mcps) {
      defaultAgentMCPs.custom_mcps.forEach((mcp) => {
        const isComposio = mcp.config?.url?.includes('mcp.composio.dev');
        mcpTools.push({
          id: `default_custom_mcp_${mcp.name}`,
          name: mcp.name,
          displayName: mcp.name,
          description: isComposio ? `Default Composio integration: ${mcp.name}` : `Default custom MCP: ${mcp.name}`,
          icon: getMCPIcon(mcp.name, true),
          type: isComposio ? 'composio_mcp' : 'custom_mcp',
          config: mcp.config,
          enabledTools: mcp.enabledTools,
          toolCount: mcp.enabledTools?.length || 0,
          isComposio,
        });
      });
    }

    return mcpTools;
  }, [defaultAgentMCPs]);

  const allAgentMCPs = useMemo(() => {
    return [...currentAgentMCPs, ...defaultAgentMCPTools];
  }, [currentAgentMCPs, defaultAgentMCPTools]);

  return {
    currentAgentMCPs,
    defaultAgentMCPs: defaultAgentMCPTools,
    allAgentMCPs,
    isLoading: agentLoading || defaultLoading,
    error: agentError,
  };
}

/**
 * Helper function to get MCP icon based on server name and qualifiedName
 * Enhanced to support both emoji and URL icons like the dashboard MCP carousel
 */
function getMCPIcon(mcpName: string, isCustom: boolean = false, qualifiedName?: string): string {
  if (isCustom) {
    // For custom MCPs (like Composio integrations), try to get specific icons
    const lowerName = mcpName.toLowerCase();

    // Check for known Composio apps that might have URL icons
    if (lowerName.includes('gmail') || lowerName.includes('google')) {
      return 'https://cdn.jsdelivr.net/gh/ComposioHQ/open-logos@master/gmail.svg';
    }
    if (lowerName.includes('slack')) {
      return 'https://cdn.jsdelivr.net/gh/ComposioHQ/open-logos@master/slack.svg';
    }
    if (lowerName.includes('github')) {
      return 'https://cdn.jsdelivr.net/gh/ComposioHQ/open-logos@master/github.png';
    }
    if (lowerName.includes('notion')) {
      return 'https://cdn.jsdelivr.net/gh/ComposioHQ/open-logos@master/notion.svg';
    }
    if (lowerName.includes('linear')) {
      return 'https://cdn.jsdelivr.net/gh/ComposioHQ/open-logos@master/linear.svg';
    }

    // Fallback to emoji icons for other custom MCPs
    if (lowerName.includes('calendar')) return '📅';
    if (lowerName.includes('drive')) return '💾';
    if (lowerName.includes('exa')) return '🔍';
    if (lowerName.includes('memory')) return '🧠';
    return '🔧'; // Default for custom MCPs
  }

  // For standard MCPs - use emoji icons
  const lowerName = mcpName.toLowerCase();
  const lowerQualifiedName = qualifiedName?.toLowerCase() || '';

  // Check qualifiedName first for better Smithery MCP identification
  if (lowerQualifiedName) {
    if (lowerQualifiedName.includes('exa')) return '🔍';
    if (lowerQualifiedName.includes('github')) return '🐙';
    if (lowerQualifiedName.includes('notion')) return '📝';
    if (lowerQualifiedName.includes('slack')) return '💬';
    if (lowerQualifiedName.includes('linear')) return '📋';
    if (lowerQualifiedName.includes('desktop-commander')) return '💻';
    if (lowerQualifiedName.includes('filesystem')) return '📁';
  }

  // Fallback to name-based matching
  if (lowerName.includes('exa')) return '🔍';
  if (lowerName.includes('github')) return '🐙';
  if (lowerName.includes('notion')) return '📝';
  if (lowerName.includes('slack')) return '💬';
  if (lowerName.includes('filesystem')) return '📁';
  if (lowerName.includes('linear')) return '📋';
  if (lowerName.includes('memory')) return '🧠';
  if (lowerName.includes('brave')) return '🦁';
  if (lowerName.includes('browser')) return '🌐';
  if (lowerName.includes('sqlite')) return '🗄️';
  if (lowerName.includes('postgres')) return '🐘';
  if (lowerName.includes('mysql')) return '🐬';
  return '⚡'; // Default for standard MCPs
}

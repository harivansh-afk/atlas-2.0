import React, { useMemo } from 'react';
import { useComposioMCPDiscovery } from './use-composio-mcp-discovery';
import { useAgentMCPTools, MCPTool } from './use-agent-mcp-tools';
import { ComposioApp } from '@/types/composio';
import { getComposioAppIcon } from '@/lib/icon-mapping';

export interface ClassifiedMCPTool {
  id: string;
  name: string;
  displayName: string;
  description: string;
  icon: string | React.ComponentType<any>;
  type: 'configured_mcp' | 'custom_mcp' | 'composio_mcp';
  status: 'connected_to_agent' | 'connected_to_account' | 'available_to_connect';
  config?: Record<string, any>;
  enabledTools?: string[];
  toolCount?: number;
  qualifiedName?: string;
  isComposio?: boolean;
  appKey?: string; // For Composio apps
  originalApp?: ComposioApp; // For available Composio apps
}

interface MCPToolClassificationResult {
  connectedToAgent: ClassifiedMCPTool[];
  connectedToAccount: ClassifiedMCPTool[];
  availableToConnect: ClassifiedMCPTool[];
  allTools: ClassifiedMCPTool[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook that classifies MCP tools into three states:
 * 1. Connected to current agent
 * 2. Connected to user account (via default agent) but not current agent
 * 3. Available to connect but not yet connected
 */
export function useMCPToolClassification(agentId?: string): MCPToolClassificationResult {
  const {
    availableApps,
    connectedApps,
    loading: discoveryLoading,
    error: discoveryError
  } = useComposioMCPDiscovery();

  const {
    currentAgentMCPs,
    defaultAgentMCPs,
    isLoading: agentLoading,
    error: agentError
  } = useAgentMCPTools(agentId);

  const classifiedTools = useMemo((): MCPToolClassificationResult => {
    const connectedToAgent: ClassifiedMCPTool[] = [];
    const connectedToAccount: ClassifiedMCPTool[] = [];
    const availableToConnect: ClassifiedMCPTool[] = [];

    // 1. Tools connected to current agent
    currentAgentMCPs.forEach((tool) => {
      connectedToAgent.push({
        ...tool,
        status: 'connected_to_agent',
        appKey: tool.isComposio ? tool.name.toLowerCase() : undefined,
      });
    });

    // 2. Tools connected to account (via default agent) but not current agent
    defaultAgentMCPs.forEach((defaultTool) => {
      // Check if this tool is already in the current agent
      const alreadyInCurrentAgent = currentAgentMCPs.some(currentTool =>
        currentTool.name.toLowerCase() === defaultTool.name.toLowerCase() &&
        currentTool.type === defaultTool.type
      );

      if (!alreadyInCurrentAgent) {
        connectedToAccount.push({
          ...defaultTool,
          status: 'connected_to_account',
          appKey: defaultTool.isComposio ? defaultTool.name.toLowerCase() : undefined,
        });
      }
    });

    // 3. Available Composio apps that are not yet connected
    availableApps.forEach((app) => {
      const isConnectedToAccount = connectedApps.has(app.key);

      if (!isConnectedToAccount) {
        // This app is available but not connected to the user's account
        availableToConnect.push({
          id: `available_composio_${app.key}`,
          name: app.name,
          displayName: app.name,
          description: `Available Composio integration: ${app.name}`,
          icon: getComposioAppIcon(app),
          type: 'composio_mcp',
          status: 'available_to_connect',
          isComposio: true,
          appKey: app.key,
          originalApp: app,
        });
      }
    });

    const allTools = [...connectedToAgent, ...connectedToAccount, ...availableToConnect];

    return {
      connectedToAgent,
      connectedToAccount,
      availableToConnect,
      allTools,
      isLoading: discoveryLoading || agentLoading,
      error: discoveryError || (agentError ? String(agentError) : null),
    };
  }, [currentAgentMCPs, defaultAgentMCPs, availableApps, connectedApps, discoveryLoading, agentLoading, discoveryError, agentError]);

  return classifiedTools;
}

/**
 * Hook for handling MCP server connections and authentication flows
 * Extracted from the dashboard MCP carousel to be reusable across components
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { ComposioMCPService } from '@/lib/composio-api';
import { createClient } from '@/lib/supabase/client';
import { ComposioApp } from '@/types/composio';
import { useQueryClient } from '@tanstack/react-query';
import { agentKeys } from '@/hooks/react-query/agents/keys';

interface UseMCPConnectionOptions {
  onConnectionSuccess?: (appKey: string, appName: string) => void;
  onConnectionError?: (appKey: string, appName: string, error: Error) => void;
}

export function useMCPConnection(options: UseMCPConnectionOptions = {}) {
  const queryClient = useQueryClient();
  const [connectingApps, setConnectingApps] = useState<Set<string>>(new Set());

  // Helper function to get authenticated headers
  const getAuthHeaders = useCallback(async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error('No authentication token available. Please sign in.');
    }

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    };
  }, []);

  // Handle MCP server connection with full authentication flow
  const connectToMCPServer = useCallback(async (app: ComposioApp) => {
    const { key: appKey, name: appName } = app;

    if (connectingApps.has(appKey)) return;

    setConnectingApps(prev => new Set(prev).add(appKey));

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/api$/, '') || '';
      const authHeaders = await getAuthHeaders();

      // Step 1: Create connection (generates Composio MCP URL)
      const connectionResponse = await ComposioMCPService.createConnection(appKey);

      // Step 2: Discover available tools from the MCP server
      const toolsResponse = await fetch(`${API_URL}/api/composio-mcp/discover-tools`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ app_key: appKey }),
      });

      if (!toolsResponse.ok) {
        const errorText = await toolsResponse.text();
        throw new Error(`Failed to discover tools: ${errorText}`);
      }

      const toolsData = await toolsResponse.json();

      if (!toolsData.success || !toolsData.tools?.length) {
        toast.error("No Tools Found", {
          description: `No tools are currently available for ${appName}`,
        });
        return;
      }

      // Step 3: Auto-select all available tools (simplified flow)
      const selectedTools = toolsData.tools.map((tool: any) => tool.name);

      // Step 4: Store selected tools in Supabase via backend
      const updateResponse = await fetch(`${API_URL}/api/composio-mcp/update-tools`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          app_key: appKey,
          selected_tools: selectedTools,
        }),
      });

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        throw new Error(`Failed to store tools: ${errorText}`);
      }

      const updateData = await updateResponse.json();

      if (!updateData.success) {
        throw new Error(updateData.error || 'Failed to store tools');
      }

      // Step 5: Initiate authentication and get redirect URL
      const authResponse = await fetch(`${API_URL}/api/composio-mcp/initiate-auth`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ app_key: appKey }),
      });

      if (!authResponse.ok) {
        const errorText = await authResponse.text();
        throw new Error(`Failed to initiate authentication: ${errorText}`);
      }

      const authData = await authResponse.json();

      if (authData.success && authData.redirect_url) {
        // Set flag for post-OAuth refresh
        localStorage.setItem('composio_recently_connected', appKey);

        toast.success("Redirecting to Authentication", {
          description: `${appName} configured with ${selectedTools.length} tools. Opening authentication...`,
        });

        // Automatically redirect to auth URL
        window.open(authData.redirect_url, '_blank');
      } else {
        toast.success("Integration Connected!", {
          description: `${appName} has been successfully connected with ${selectedTools.length} tools enabled.`,
        });
      }

      // Invalidate React Query cache to refresh cursor agent selector
      queryClient.invalidateQueries({ queryKey: agentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: agentKeys.defaultMCPs() });

      // Call success callback
      options.onConnectionSuccess?.(appKey, appName);

    } catch (error: any) {
      console.error('Connection error:', error);
      toast.error("Connection Failed", {
        description: error.message || `Failed to connect to ${appName}`,
      });

      // Call error callback
      options.onConnectionError?.(appKey, appName, error);
    } finally {
      setConnectingApps(prev => {
        const newSet = new Set(prev);
        newSet.delete(appKey);
        return newSet;
      });
    }
  }, [connectingApps, getAuthHeaders, options, queryClient]);

  return {
    connectToMCPServer,
    connectingApps,
    isConnecting: (appKey: string) => connectingApps.has(appKey),
  };
}

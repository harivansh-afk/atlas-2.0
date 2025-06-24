import { useState, useEffect } from 'react';
import { ComposioApp } from '@/types/composio';
import { createClient } from '@/lib/supabase/client';

interface ComposioMCPDiscoveryResult {
  availableApps: ComposioApp[];
  connectedApps: Set<string>;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook to discover available Composio MCP servers and track connection status
 * Duplicates the logic from dashboard MCP carousel for tool mentions
 */
export function useComposioMCPDiscovery(): ComposioMCPDiscoveryResult {
  const [availableApps, setAvailableApps] = useState<ComposioApp[]>([]);
  const [connectedApps, setConnectedApps] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeaders = async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('No authentication session');
    }

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    };
  };

  const loadAvailableApps = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 
                     process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/api$/, '') || '';

      const response = await fetch(`${API_URL}/api/composio-mcp/supported-apps`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        setAvailableApps(data.apps);
        setError(null);
      } else {
        throw new Error(data.message || 'Failed to load available apps');
      }
    } catch (err) {
      console.error('Error loading available apps:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setAvailableApps([]);
    }
  };

  const loadConnectedApps = async () => {
    try {
      const authHeaders = await getAuthHeaders();
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 
                     process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/api$/, '') || '';

      const response = await fetch(`${API_URL}/api/composio-mcp/user-connections`, {
        method: 'GET',
        headers: authHeaders,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const connectedAppKeys: Set<string> = new Set(
            data.connections.map((conn: any) => conn.app_key as string)
          );
          setConnectedApps(connectedAppKeys);
        }
      }
    } catch (err) {
      console.error('Error loading connected apps:', err);
      // Don't set error for connection loading failures, just log them
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load both available apps and connection status
      await Promise.all([
        loadAvailableApps(),
        loadConnectedApps(),
      ]);
    } catch (err) {
      console.error('Error loading MCP discovery data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load MCP data');
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    loadData();
  };

  // Initial load
  useEffect(() => {
    loadData();
  }, []);

  return {
    availableApps,
    connectedApps,
    loading,
    error,
    refetch,
  };
}

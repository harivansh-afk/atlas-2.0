/**
 * React Query hooks for Composio MCP integration
 *
 * These hooks provide a reactive interface to the Composio MCP API service
 * with caching, error handling, and optimistic updates.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ComposioMCPService } from '@/lib/composio-api';
import {
  ComposioApp,
  ComposioConnection,
  ComposioAppKey,
  ComposioHealthResponse,
  UseComposioConnectionsReturn,
  UseCreateComposioConnectionReturn,
  UseComposioAppsReturn,
} from '@/types/composio';
import { toast } from 'sonner';

// ============================================================================
// Query Keys
// ============================================================================

export const composioKeys = {
  all: ['composio'] as const,
  health: () => [...composioKeys.all, 'health'] as const,
  apps: () => [...composioKeys.all, 'apps'] as const,
  connections: () => [...composioKeys.all, 'connections'] as const,
  connection: (appKey: ComposioAppKey) => [...composioKeys.connections(), appKey] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Hook to get Composio service health status
 */
export const useComposioHealth = () => {
  return useQuery({
    queryKey: composioKeys.health(),
    queryFn: ComposioMCPService.healthCheck,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

/**
 * Hook to get supported Composio apps
 */
export const useComposioApps = (): UseComposioAppsReturn => {
  const query = useQuery({
    queryKey: composioKeys.apps(),
    queryFn: ComposioMCPService.getSupportedApps,
    staleTime: 30 * 60 * 1000, // 30 minutes (apps don't change often)
    retry: 2,
  });

  const getAppsByCategory = (category: string): ComposioApp[] => {
    return query.data?.apps?.filter(app => app.category === category) || [];
  };

  const searchApps = (searchQuery: string): ComposioApp[] => {
    if (!query.data?.apps || !searchQuery.trim()) return query.data?.apps || [];

    const lowercaseQuery = searchQuery.toLowerCase();
    return query.data.apps.filter(app =>
      app.name.toLowerCase().includes(lowercaseQuery) ||
      app.description.toLowerCase().includes(lowercaseQuery) ||
      app.key.toLowerCase().includes(lowercaseQuery)
    );
  };

  return {
    apps: query.data?.apps || [],
    isLoading: query.isLoading,
    error: query.error,
    getAppsByCategory,
    searchApps,
  };
};

/**
 * Hook to get user's Composio connections
 */
export const useComposioConnections = (): UseComposioConnectionsReturn => {
  const query = useQuery({
    queryKey: composioKeys.connections(),
    queryFn: ComposioMCPService.listUserConnections,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
  });

  return {
    connections: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook to check if a specific app is connected
 */
export const useComposioConnectionStatus = (appKey: ComposioAppKey) => {
  return useQuery({
    queryKey: composioKeys.connection(appKey),
    queryFn: () => ComposioMCPService.getConnectionStatus(appKey),
    staleTime: 1 * 60 * 1000, // 1 minute
    retry: 2,
  });
};

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Hook to create a new Composio connection
 */
export const useCreateComposioConnection = (): UseCreateComposioConnectionReturn => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (appKey: ComposioAppKey) => ComposioMCPService.createConnection(appKey),
    onMutate: async (appKey) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: composioKeys.connections() });
      await queryClient.cancelQueries({ queryKey: composioKeys.connection(appKey) });

      // Snapshot the previous value
      const previousConnections = queryClient.getQueryData<ComposioConnection[]>(composioKeys.connections());

      // Optimistically update to the new value
      const optimisticConnection: ComposioConnection = {
        id: `temp-${Date.now()}`,
        user_id: '',
        qualified_name: `composio/${appKey}`,
        app_key: appKey,
        app_name: appKey,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        scope: `composio_${appKey}`,
      };

      queryClient.setQueryData<ComposioConnection[]>(
        composioKeys.connections(),
        old => [...(old || []), optimisticConnection]
      );

      return { previousConnections };
    },
    onError: (error, appKey, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(composioKeys.connections(), context?.previousConnections);

      console.error(`Failed to create connection for ${appKey}:`, error);
      toast.error(`Failed to connect to ${appKey}: ${error.message}`);
    },
    onSuccess: (connection, appKey) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: composioKeys.connections() });
      queryClient.invalidateQueries({ queryKey: composioKeys.connection(appKey) });

      toast.success(`Successfully connected to ${appKey}!`);
    },
  });

  return {
    createConnection: mutation.mutateAsync,
    isCreating: mutation.isPending,
    error: mutation.error,
  };
};

/**
 * Hook to delete a Composio connection
 */
export const useDeleteComposioConnection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (appKey: ComposioAppKey) => ComposioMCPService.deleteConnection(appKey),
    onMutate: async (appKey) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: composioKeys.connections() });
      await queryClient.cancelQueries({ queryKey: composioKeys.connection(appKey) });

      // Snapshot the previous value
      const previousConnections = queryClient.getQueryData<ComposioConnection[]>(composioKeys.connections());

      // Optimistically remove the connection
      queryClient.setQueryData<ComposioConnection[]>(
        composioKeys.connections(),
        old => old?.filter(conn => conn.app_key !== appKey) || []
      );

      return { previousConnections };
    },
    onError: (error, appKey, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(composioKeys.connections(), context?.previousConnections);

      console.error(`Failed to delete connection for ${appKey}:`, error);
      toast.error(`Failed to disconnect ${appKey}: ${error.message}`);
    },
    onSuccess: (success, appKey) => {
      if (success) {
        // Invalidate and refetch
        queryClient.invalidateQueries({ queryKey: composioKeys.connections() });
        queryClient.invalidateQueries({ queryKey: composioKeys.connection(appKey) });

        toast.success(`Successfully disconnected from ${appKey}`);
      } else {
        toast.error(`Failed to disconnect from ${appKey}`);
      }
    },
  });
};

/**
 * Hook to reconnect an existing connection
 */
export const useReconnectComposioConnection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (appKey: ComposioAppKey) => ComposioMCPService.reconnectApp(appKey),
    onSuccess: (connection, appKey) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: composioKeys.connections() });
      queryClient.invalidateQueries({ queryKey: composioKeys.connection(appKey) });

      toast.success(`Successfully reconnected to ${appKey}!`);
    },
    onError: (error, appKey) => {
      console.error(`Failed to reconnect to ${appKey}:`, error);
      toast.error(`Failed to reconnect to ${appKey}: ${error.message}`);
    },
  });
};

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Hook to get connected app keys
 */
export const useConnectedApps = (): ComposioAppKey[] => {
  const { connections } = useComposioConnections();
  return connections
    .filter(conn => conn.status === 'connected' || conn.status === 'pending')
    .map(conn => conn.app_key);
};

/**
 * Hook to check if any apps are connected
 */
export const useHasComposioConnections = (): boolean => {
  const { connections } = useComposioConnections();
  return connections.length > 0;
};

/**
 * Hook to get connection count by status
 */
export const useComposioConnectionStats = () => {
  const { connections } = useComposioConnections();

  return {
    total: connections.length,
    connected: connections.filter(conn => conn.status === 'connected').length,
    pending: connections.filter(conn => conn.status === 'pending').length,
    error: connections.filter(conn => conn.status === 'error').length,
    expired: connections.filter(conn => conn.status === 'expired').length,
  };
};

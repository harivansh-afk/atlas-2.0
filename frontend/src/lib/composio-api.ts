/**
 * Centralized Composio MCP API Service
 *
 * This service provides a centralized interface for all Composio MCP operations
 * that can be used across dashboard, onboarding, and agents pages.
 */

import { createClient } from '@/lib/supabase/client';
import {
  ComposioApp,
  ComposioConnection,
  CreateComposioConnectionRequest,
  CreateComposioConnectionResponse,
  ListUserConnectionsResponse,
  DeleteConnectionResponse,
  GetSupportedAppsResponse,
  ComposioHealthResponse,
  ComposioAPIError,
  ComposioAppKey,
  ComposioConnectionStatus,
} from '@/types/composio';

// Remove /api suffix if present since we'll add it in our endpoints
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';
const API_URL = BACKEND_URL.replace(/\/api$/, '');

/**
 * Centralized Composio MCP API Service
 */
export class ComposioMCPService {
  /**
   * Get authenticated headers for API requests
   */
  private static async getAuthHeaders(): Promise<Record<string, string>> {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new ComposioAPIError('No authentication token available', 401, 'NO_AUTH_TOKEN');
    }

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    };
  }

  /**
   * Handle API response and errors
   */
  private static async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      let errorData;

      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }

      throw new ComposioAPIError(
        errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData.errorCode
      );
    }

    return response.json();
  }

  /**
   * Create a new Composio MCP connection for the current user
   */
  static async createConnection(appKey: ComposioAppKey): Promise<ComposioConnection> {
    if (!API_URL) {
      throw new ComposioAPIError('Backend URL not configured', 500, 'NO_BACKEND_URL');
    }

    const headers = await this.getAuthHeaders();
    const requestBody: CreateComposioConnectionRequest = { app_key: appKey };

    console.log(`[ComposioAPI] Creating connection for app: ${appKey}`);

    const response = await fetch(`${API_URL}/api/composio-mcp/create-connection`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    const result: CreateComposioConnectionResponse = await this.handleResponse(response);

    console.log('[ComposioAPI] Create connection response:', result);

    if (!result.success) {
      console.error('[ComposioAPI] Create connection failed:', result.error);
      throw new ComposioAPIError(result.error || 'Failed to create connection', 400, 'CREATE_FAILED');
    }

    // Transform the response to match our ComposioConnection interface
    const connection: ComposioConnection = {
      id: result.session_uuid || '',
      user_id: '', // Will be populated by backend
      qualified_name: result.qualified_name || `composio/${appKey}`,
      app_key: appKey,
      app_name: appKey, // Will be enhanced with proper app name
      mcp_url: result.mcp_url,
      auth_url: result.auth_url,
      session_uuid: result.session_uuid,
      status: (result.auth_url ? 'pending' : 'connected') as ComposioConnectionStatus,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      scope: `composio_${appKey}`,
    };

    console.log('[ComposioAPI] Transformed connection:', connection);
    return connection;
  }

  /**
   * List all Composio MCP connections for the current user
   */
  static async listUserConnections(): Promise<ComposioConnection[]> {
    if (!API_URL) {
      throw new ComposioAPIError('Backend URL not configured', 500, 'NO_BACKEND_URL');
    }

    const headers = await this.getAuthHeaders();

    console.log('[ComposioAPI] Fetching user connections');

    const response = await fetch(`${API_URL}/api/composio-mcp/user-connections`, {
      method: 'GET',
      headers,
    });

    const result: ListUserConnectionsResponse = await this.handleResponse(response);

    console.log('[ComposioAPI] List connections response:', result);

    if (!result.success) {
      console.error('[ComposioAPI] List connections failed:', result);
      throw new ComposioAPIError('Failed to fetch connections', 400, 'FETCH_FAILED');
    }

    console.log('[ComposioAPI] Found connections:', result.connections);
    return result.connections;
  }

  /**
   * Delete a Composio MCP connection
   */
  static async deleteConnection(appKey: ComposioAppKey): Promise<boolean> {
    if (!API_URL) {
      throw new ComposioAPIError('Backend URL not configured', 500, 'NO_BACKEND_URL');
    }

    const headers = await this.getAuthHeaders();

    console.log(`[ComposioAPI] Deleting connection for app: ${appKey}`);

    const response = await fetch(`${API_URL}/api/composio-mcp/connection/${appKey}`, {
      method: 'DELETE',
      headers,
    });

    const result: DeleteConnectionResponse = await this.handleResponse(response);

    return result.success;
  }

  /**
   * Get list of supported Composio apps
   */
  static async getSupportedApps(): Promise<GetSupportedAppsResponse> {
    if (!API_URL) {
      throw new ComposioAPIError('Backend URL not configured', 500, 'NO_BACKEND_URL');
    }

    console.log('[ComposioAPI] Fetching supported apps');

    const response = await fetch(`${API_URL}/api/composio-mcp/supported-apps`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result: GetSupportedAppsResponse = await this.handleResponse(response);

    if (!result.success) {
      throw new ComposioAPIError('Failed to fetch supported apps', 400, 'FETCH_APPS_FAILED');
    }

    return result;
  }

  /**
   * Health check for Composio MCP service
   */
  static async healthCheck(): Promise<ComposioHealthResponse> {
    if (!API_URL) {
      throw new ComposioAPIError('Backend URL not configured', 500, 'NO_BACKEND_URL');
    }

    console.log('[ComposioAPI] Performing health check');

    const response = await fetch(`${API_URL}/api/composio-mcp/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return this.handleResponse(response);
  }

  /**
   * Check if a specific app is connected for the current user
   */
  static async isAppConnected(appKey: ComposioAppKey): Promise<boolean> {
    try {
      const connections = await this.listUserConnections();
      console.log(`[ComposioAPI] Checking if ${appKey} is connected. Found connections:`, connections);

      const matchingConnection = connections.find(conn => conn.app_key === appKey);
      console.log(`[ComposioAPI] Matching connection for ${appKey}:`, matchingConnection);

      if (matchingConnection) {
        console.log(`[ComposioAPI] Connection status for ${appKey}:`, matchingConnection.status);
      }

      return connections.some(conn =>
        conn.app_key === appKey &&
        (conn.status === 'connected' || conn.status === 'pending')
      );
    } catch (error) {
      console.error(`[ComposioAPI] Error checking connection status for ${appKey}:`, error);
      return false;
    }
  }

  /**
   * Get connection status for a specific app
   */
  static async getConnectionStatus(appKey: ComposioAppKey): Promise<ComposioConnection | null> {
    try {
      const connections = await this.listUserConnections();
      return connections.find(conn => conn.app_key === appKey) || null;
    } catch (error) {
      console.error(`[ComposioAPI] Error getting connection status for ${appKey}:`, error);
      return null;
    }
  }

  /**
   * Refresh MCP connection after OAuth authentication is completed
   */
  static async refreshConnection(appKey: ComposioAppKey): Promise<boolean> {
    if (!API_URL) {
      throw new ComposioAPIError('Backend URL not configured', 500, 'NO_BACKEND_URL');
    }

    const headers = await this.getAuthHeaders();

    console.log(`[ComposioAPI] Refreshing connection after auth for app: ${appKey}`);

    const response = await fetch(`${API_URL}/api/composio-mcp/refresh-connection/${appKey}`, {
      method: 'POST',
      headers,
    });

    const result = await this.handleResponse<{
      success: boolean;
      message: string;
      app_key: string;
      error?: string;
    }>(response);

    console.log('[ComposioAPI] Refresh connection response:', result);

    if (!result.success) {
      console.error('[ComposioAPI] Refresh connection failed:', result.error);
      throw new ComposioAPIError(result.error || 'Failed to refresh connection', 400, 'REFRESH_FAILED');
    }

    return result.success;
  }

  /**
   * Reconnect an existing connection (useful for expired connections)
   */
  static async reconnectApp(appKey: ComposioAppKey): Promise<ComposioConnection> {
    // First delete the existing connection, then create a new one
    try {
      await this.deleteConnection(appKey);
    } catch (error) {
      // Continue even if deletion fails (connection might not exist)
      console.warn(`[ComposioAPI] Warning: Could not delete existing connection for ${appKey}:`, error);
    }

    return this.createConnection(appKey);
  }
}

/**
 * Utility functions for working with Composio data
 */
export const ComposioUtils = {
  /**
   * Filter apps by category
   */
  filterAppsByCategory: (apps: ComposioApp[], category: string): ComposioApp[] => {
    return apps.filter(app => app.category === category);
  },

  /**
   * Search apps by name or description
   */
  searchApps: (apps: ComposioApp[], query: string): ComposioApp[] => {
    const lowercaseQuery = query.toLowerCase();
    return apps.filter(app =>
      app.name.toLowerCase().includes(lowercaseQuery) ||
      app.description.toLowerCase().includes(lowercaseQuery) ||
      app.key.toLowerCase().includes(lowercaseQuery)
    );
  },

  /**
   * Get app by key
   */
  getAppByKey: (apps: ComposioApp[], appKey: ComposioAppKey): ComposioApp | undefined => {
    return apps.find(app => app.key === appKey);
  },

  /**
   * Group apps by category
   */
  groupAppsByCategory: (apps: ComposioApp[]): Record<string, ComposioApp[]> => {
    return apps.reduce((groups, app) => {
      const category = app.category || 'other';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(app);
      return groups;
    }, {} as Record<string, ComposioApp[]>);
  },

  /**
   * Format qualified name for Composio connections
   */
  formatQualifiedName: (appKey: ComposioAppKey): string => {
    return `composio/${appKey}`;
  },

  /**
   * Extract app key from qualified name
   */
  extractAppKey: (qualifiedName: string): ComposioAppKey => {
    return qualifiedName.replace('composio/', '');
  },
};

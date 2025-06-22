'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Search,
  Loader2,
  Check,
  X
} from 'lucide-react';
import { ComposioApp } from '@/types/composio';
import { createClient } from '@/lib/supabase/client';
import { MCPServerCard } from './mcp-server-card';
import { MCPToolSelectionModal } from './mcp-tool-selection-modal-new';
import { ComposioMCPService } from '@/lib/composio-api';

interface MCPServerCarouselProps {
  className?: string;
}

export function MCPServerCarousel({ className }: MCPServerCarouselProps) {
  const [apps, setApps] = useState<ComposioApp[]>([]);
  const [filteredApps, setFilteredApps] = useState<ComposioApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [connectingApps, setConnectingApps] = useState<Set<string>>(new Set());
  const [disconnectingApps, setDisconnectingApps] = useState<Set<string>>(new Set());
  const [connectedApps, setConnectedApps] = useState<Set<string>>(new Set());
  // Tool selection modal state
  const [toolSelectionModal, setToolSelectionModal] = useState<{
    isOpen: boolean;
    appKey: string;
    appName: string;
    appIcon?: string;
    tools: any[];
    mcpUrl?: string;
  }>({
    isOpen: false,
    appKey: '',
    appName: '',
    appIcon: '',
    tools: [],
  });

  // Helper function to get authenticated headers
  const getAuthHeaders = async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error('No authentication token available. Please sign in.');
    }

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    };
  };

  // Load supported apps
  useEffect(() => {
    const loadApps = async () => {
      try {
        setLoading(true);

        const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/api$/, '') || '';

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
          setApps(data.apps);
          setFilteredApps(data.apps);
        } else {
          throw new Error(data.message || 'Failed to load apps');
        }
      } catch (error) {
        console.error('Error loading apps:', error);
        toast.error("Failed to load MCP servers", {
          description: error instanceof Error ? error.message : 'Unknown error',
        });
      } finally {
        setLoading(false);
      }
    };

    loadApps();
  }, []);

  // Load existing connections and handle post-OAuth refresh
  useEffect(() => {
    const loadConnections = async () => {
      try {
        const authHeaders = await getAuthHeaders();
        const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/api$/, '') || '';

        const response = await fetch(`${API_URL}/api/composio-mcp/user-connections`, {
          method: 'GET',
          headers: authHeaders,
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            const connectedAppKeys: Set<string> = new Set(data.connections.map((conn: any) => conn.app_key as string));
            setConnectedApps(connectedAppKeys);
          }
        }
      } catch (error) {
        console.error('Error loading connections:', error);
      }
    };

    // Check if user just returned from OAuth authentication
    const handlePostOAuthRefresh = async () => {
      const recentlyConnectedKey = localStorage.getItem('composio_recently_connected');
      if (recentlyConnectedKey) {
        console.log(`Checking if ${recentlyConnectedKey} needs post-OAuth refresh...`);

        try {
          // Wait a moment for OAuth to complete on Composio's side
          await new Promise(resolve => setTimeout(resolve, 2000));

          // Automatically refresh the MCP connection after OAuth
          await ComposioMCPService.refreshConnection(recentlyConnectedKey as any);

          // Clear the flag
          localStorage.removeItem('composio_recently_connected');

          // Reload connections to show updated state
          await loadConnections();

          toast.success("Authentication Complete!", {
            description: `${recentlyConnectedKey} is now connected and ready to use.`,
          });

        } catch (error) {
          console.error('Error refreshing connection after OAuth:', error);
          console.log('Connection refresh failed, but the connection might still be functional');
        }
      }
    };

    loadConnections();
    handlePostOAuthRefresh();

    // Listen for window focus to detect when user returns from OAuth
    const handleWindowFocus = () => {
      const recentlyConnectedKey = localStorage.getItem('composio_recently_connected');
      if (recentlyConnectedKey) {
        console.log('Window focused and recently connected app detected, triggering refresh...');
        handlePostOAuthRefresh();
      }
    };

    window.addEventListener('focus', handleWindowFocus);

    return () => {
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, []);

  // Filter and sort apps (connected first)
  useEffect(() => {
    let filtered = apps;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(app =>
        app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.key.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort: connected apps first, then by popularity/name
    filtered.sort((a, b) => {
      const aConnected = connectedApps.has(a.key);
      const bConnected = connectedApps.has(b.key);

      if (aConnected && !bConnected) return -1;
      if (!aConnected && bConnected) return 1;

      // If both connected or both not connected, sort by popularity then name
      if (a.popular && !b.popular) return -1;
      if (!a.popular && b.popular) return 1;

      return a.name.localeCompare(b.name);
    });

    setFilteredApps(filtered);
  }, [apps, searchQuery, connectedApps]);

  // Handle search toggle
  const handleSearchToggle = () => {
    if (showSearch && searchQuery) {
      setSearchQuery('');
    }
    setShowSearch(!showSearch);
  };



  if (loading) {
    return (
      <div className={className}>
        <div className="flex justify-end items-center mb-2">
          <Skeleton className="h-8 w-16" />
        </div>
        <div className="flex gap-4 overflow-x-auto">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-44 rounded-lg flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  // Don't render if no apps are available
  if (apps.length === 0) {
    return null;
  }

  return (
    <>
      <div className={className}>
        {/* Header with search button - matching suggestions style */}
        <div className="flex justify-end items-center mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSearchToggle}
            className="h-8 px-3 text-sm text-muted-foreground hover:text-foreground"
          >
            <motion.div
              animate={{ rotate: showSearch ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              {showSearch && searchQuery ? <X size={14} /> : <Search size={14} />}
            </motion.div>
            <span className="ml-2">Search</span>
          </Button>
        </div>

        {/* Search input */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mb-2"
            >
              <Input
                placeholder="Search MCP servers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 text-sm"
                autoFocus
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cards container */}
        <div className="flex gap-4 overflow-x-auto scrollbar-hide">
          {filteredApps.map((app) => (
            <MCPServerCard
              key={app.key}
              app={app}
              isConnected={connectedApps.has(app.key)}
              isConnecting={connectingApps.has(app.key)}
              onConnect={() => handleConnect(app.key, app.name)}
              onDisconnect={() => handleDisconnect(app.key, app.name)}
            />
          ))}
        </div>

        {/* Results info */}
        {searchQuery && (
          <div className="text-xs text-muted-foreground mt-2">
            {filteredApps.length} results for "{searchQuery}"
          </div>
        )}
      </div>

      {/* Tool Selection Modal */}
      <MCPToolSelectionModal
        isOpen={toolSelectionModal.isOpen}
        onClose={handleToolSelectionClose}
        appKey={toolSelectionModal.appKey}
        appName={toolSelectionModal.appName}
        appIcon={toolSelectionModal.appIcon}
        tools={toolSelectionModal.tools}
        onConfirm={handleToolSelectionConfirm}
      />
    </>
  );

  // Handle MCP server connection
  async function handleConnect(appKey: string, appName: string) {
    if (connectingApps.has(appKey) || connectedApps.has(appKey)) return;

    setConnectingApps(prev => new Set(prev).add(appKey));

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/api$/, '') || '';
      const authHeaders = await getAuthHeaders();

      // Find the app to get its icon
      const app = apps.find(a => a.key === appKey);

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
        throw new Error('No tools available for this integration');
      }

      // Step 3: Show tool selection modal
      setToolSelectionModal({
        isOpen: true,
        appKey,
        appName,
        appIcon: app?.icon,
        tools: toolsData.tools,
        mcpUrl: connectionResponse.mcp_url,
      });

    } catch (error: any) {
      console.error('Connection error:', error);

      if (error.message?.includes('401') || error.message?.includes('authentication') || error.message?.includes('No authentication token')) {
        toast.error("Authentication Required", {
          description: "Please sign in to connect MCP servers",
        });
      } else {
        toast.error("Connection Failed", {
          description: error.message || `Failed to connect to ${appName}`,
        });
      }
    } finally {
      setConnectingApps(prev => {
        const newSet = new Set(prev);
        newSet.delete(appKey);
        return newSet;
      });
    }
  }

  // Handle tool selection confirmation from modal
  async function handleToolSelectionConfirm(selectedTools: string[]) {
    const { appKey, appName } = toolSelectionModal;

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/api$/, '') || '';
      const authHeaders = await getAuthHeaders();

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

      // Close modal and redirect to authentication
      setToolSelectionModal({ isOpen: false, appKey: '', appName: '', appIcon: '', tools: [] });

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

      // Mark as connected (will be verified on next load)
      setConnectedApps(prev => new Set(prev).add(appKey));

    } catch (error: any) {
      console.error('Tool selection error:', error);
      toast.error("Configuration Failed", {
        description: error.message || `Failed to configure ${appName}`,
      });
    }
  }

  // Handle modal close
  function handleToolSelectionClose() {
    setToolSelectionModal({ isOpen: false, appKey: '', appName: '', appIcon: '', tools: [] });
  }

  // Handle MCP server disconnection
  async function handleDisconnect(appKey: string, appName: string) {
    if (disconnectingApps.has(appKey) || !connectedApps.has(appKey)) return;

    setDisconnectingApps(prev => new Set(prev).add(appKey));

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/api$/, '') || '';
      const authHeaders = await getAuthHeaders();

      // Call the delete endpoint to remove the MCP connection from Supabase
      const response = await fetch(`${API_URL}/api/composio-mcp/connection/${appKey}`, {
        method: 'DELETE',
        headers: authHeaders,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to disconnect: ${errorText}`);
      }

      const data = await response.json();

      if (data.success) {
        // Remove from connected apps
        setConnectedApps(prev => {
          const newSet = new Set(prev);
          newSet.delete(appKey);
          return newSet;
        });

        toast.success("Disconnected Successfully", {
          description: `${appName} has been disconnected and removed.`,
        });
      } else {
        throw new Error(data.message || 'Failed to disconnect');
      }

    } catch (error: any) {
      console.error('Disconnect error:', error);
      toast.error("Disconnect Failed", {
        description: error.message || `Failed to disconnect ${appName}`,
      });
    } finally {
      setDisconnectingApps(prev => {
        const newSet = new Set(prev);
        newSet.delete(appKey);
        return newSet;
      });
    }
  }
}

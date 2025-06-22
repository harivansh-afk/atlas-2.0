'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Search, Filter, ExternalLink, Check, Loader2, Zap } from 'lucide-react';
import { ComposioMCPService } from '@/lib/composio-api';
import { ComposioApp, COMPOSIO_APP_CATEGORIES } from '@/types/composio';
import { createClient } from '@/lib/supabase/client';
import { MCPToolSelectionModal } from './mcp-tool-selection-modal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MCPIntegrationsProps {
  className?: string;
}

export function MCPIntegrations({ className }: MCPIntegrationsProps) {
  const [apps, setApps] = useState<ComposioApp[]>([]);
  const [filteredApps, setFilteredApps] = useState<ComposioApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [connectingApps, setConnectingApps] = useState<Set<string>>(new Set());
  const [connectedApps, setConnectedApps] = useState<Set<string>>(new Set());

  // Tool selection modal state
  const [toolSelectionModal, setToolSelectionModal] = useState<{
    isOpen: boolean;
    appKey: string;
    appName: string;
    tools: any[];
    mcpUrl?: string;
  }>({
    isOpen: false,
    appKey: '',
    appName: '',
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

        // Use the correct API endpoint directly like the test files
        const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/api$/, '') || '';
        console.log('[MCPIntegrations] Loading apps from:', `${API_URL}/api/composio-mcp/supported-apps`);

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
          toast.success("MCP Servers Loaded", {
            description: `${data.total} integrations available`,
          });
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

        // Get connected MCP servers from the agents table custom_mcps
        const response = await fetch(`${API_URL}/api/composio-mcp/user-connections`, {
          method: 'GET',
          headers: authHeaders,
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            const connectedAppKeys: Set<string> = new Set(data.connections.map((conn: any) => conn.app_key as string));
            setConnectedApps(connectedAppKeys);
            console.log('Loaded existing connections from Supabase:', connectedAppKeys);
          }
        } else {
          console.log('No existing connections found or user not authenticated');
        }
      } catch (error) {
        console.error('Error loading connections:', error);
        // Don't show error toast for this - user might not be authenticated yet
      }
    };

    // Check if user just returned from OAuth authentication
    const handlePostOAuthRefresh = async () => {
      // Check if there are any recently connected apps that might need refreshing
      // This is a simple approach - we'll check for connections that were recently created
      // and might need a refresh after OAuth completion

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
          // Don't show error toast - the connection might still work
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

  // Filter apps based on search and category
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

    // Filter by category
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'popular') {
        filtered = filtered.filter(app => app.popular);
      } else {
        filtered = filtered.filter(app => app.category === selectedCategory);
      }
    }

    setFilteredApps(filtered);
  }, [apps, searchQuery, selectedCategory]);

  // Handle MCP server connection - new modal-based flow
  const handleConnect = async (appKey: string, appName: string) => {
    if (connectingApps.has(appKey) || connectedApps.has(appKey)) return;

    setConnectingApps(prev => new Set(prev).add(appKey));

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/api$/, '') || '';
      const authHeaders = await getAuthHeaders();

      // Step 1: Create connection (generates Composio MCP URL)
      console.log(`[MCPIntegrations] Step 1: Creating connection for ${appKey}`);
      const connectionResponse = await ComposioMCPService.createConnection(appKey);
      console.log('Connection created:', connectionResponse);

      // Step 2: Discover available tools from the MCP server
      console.log(`[MCPIntegrations] Step 2: Discovering tools for ${appKey}`);
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
      console.log('Tools discovered:', toolsData);

      if (!toolsData.success || !toolsData.tools?.length) {
        throw new Error('No tools available for this integration');
      }

      // Step 3: Show tool selection modal (user chooses tools)
      console.log(`[MCPIntegrations] Step 3: Opening tool selection modal for ${appKey}`);
      setToolSelectionModal({
        isOpen: true,
        appKey,
        appName,
        tools: toolsData.tools,
        mcpUrl: connectionResponse.mcp_url,
      });

    } catch (error: any) {
      console.error('Connection error:', error);

      // Handle specific error cases
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
  };

  // Handle tool selection confirmation from modal
  const handleToolSelectionConfirm = async (selectedTools: string[]) => {
    const { appKey, appName } = toolSelectionModal;

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/api$/, '') || '';
      const authHeaders = await getAuthHeaders();

      // Step 4: Store selected tools in Supabase via backend
      console.log(`[MCPIntegrations] Step 4: Storing selected tools for ${appKey}`);
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
      console.log('Tools stored:', updateData);

      if (!updateData.success) {
        throw new Error(updateData.error || 'Failed to store tools');
      }

      // Step 5: Initiate authentication and get redirect URL
      console.log(`[MCPIntegrations] Step 5: Initiating authentication for ${appKey}`);
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
      console.log('Authentication initiated:', authData);

      // Close modal and redirect to authentication
      setToolSelectionModal({ isOpen: false, appKey: '', appName: '', tools: [] });

      if (authData.success && authData.redirect_url) {
        // Set flag for post-OAuth refresh
        localStorage.setItem('composio_recently_connected', appKey);

        // Show brief success message and redirect immediately
        toast.success("Redirecting to Authentication", {
          description: `${appName} configured with ${selectedTools.length} tools. Opening authentication...`,
        });

        // Automatically redirect to auth URL immediately
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
  };

  // Handle modal close
  const handleToolSelectionClose = () => {
    setToolSelectionModal({ isOpen: false, appKey: '', appName: '', tools: [] });
  };

  // Get unique categories for filter
  const categories = Array.from(new Set(apps.map(app => app.category))).sort();

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>MCP Integrations</CardTitle>
          <CardDescription>Connect to external services via Model Context Protocol</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-32" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          MCP Integrations
          <Badge variant="secondary">{apps.length} available</Badge>
        </CardTitle>
        <CardDescription>
          Connect to external services and tools via Model Context Protocol
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search integrations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="popular">Popular</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {COMPOSIO_APP_CATEGORIES[category as keyof typeof COMPOSIO_APP_CATEGORIES]?.name || category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Results Summary */}
          <div className="text-sm text-muted-foreground">
            Showing {filteredApps.length} of {apps.length} integrations
            {selectedCategory !== 'all' && ` in ${selectedCategory}`}
            {searchQuery && ` matching "${searchQuery}"`}
          </div>

          {/* Apps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
            <AnimatePresence>
              {filteredApps.map((app) => {
                const isConnecting = connectingApps.has(app.key);
                const isConnected = connectedApps.has(app.key);

                return (
                  <motion.div
                    key={app.key}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className={`h-full transition-all hover:shadow-md ${
                      isConnected ? 'ring-2 ring-green-500' : ''
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            {app.icon.startsWith('http') ? (
                              <img
                                src={app.icon}
                                alt={app.name}
                                className="w-8 h-8 rounded"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-8 h-8 flex items-center justify-center text-lg">
                                {app.icon}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium text-sm truncate">{app.name}</h3>
                              {app.popular && (
                                <Badge variant="secondary" className="text-xs">Popular</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                              {app.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Badge variant="outline" className="text-xs">
                                  {COMPOSIO_APP_CATEGORIES[app.category]?.name || app.category}
                                </Badge>
                                {app.tool_count && (
                                  <span>{app.tool_count} tools</span>
                                )}
                              </div>
                              <Button
                                size="sm"
                                variant={isConnected ? "secondary" : "default"}
                                onClick={() => handleConnect(app.key, app.name)}
                                disabled={isConnecting || isConnected}
                                className="text-xs h-7"
                              >
                                {isConnecting ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : isConnected ? (
                                  <Check className="h-3 w-3" />
                                ) : (
                                  "Connect"
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {filteredApps.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No integrations found matching your criteria</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="mt-2"
              >
                Clear filters
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>

    {/* Tool Selection Modal */}
    <MCPToolSelectionModal
      isOpen={toolSelectionModal.isOpen}
      onClose={handleToolSelectionClose}
      appKey={toolSelectionModal.appKey}
      appName={toolSelectionModal.appName}
      tools={toolSelectionModal.tools}
      onConfirm={handleToolSelectionConfirm}
      isLoading={connectingApps.has(toolSelectionModal.appKey)}
    />
    </>
  );
}

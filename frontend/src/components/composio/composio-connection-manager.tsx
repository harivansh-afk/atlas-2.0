/**
 * Composio Connection Manager Component
 * 
 * This component provides a simple interface for users to manage their
 * global Composio MCP connections. It shows existing connections and
 * allows creating new ones.
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Loader2, 
  Plus, 
  Trash2, 
  ExternalLink, 
  CheckCircle, 
  AlertCircle,
  RefreshCw 
} from 'lucide-react';
import { 
  useComposioConnections, 
  useComposioApps, 
  useCreateComposioConnection,
  useDeleteComposioConnection 
} from '@/hooks/react-query/composio/use-composio';
import { ComposioApp, ComposioConnection } from '@/types/composio';
import { toast } from 'sonner';

interface ComposioConnectionManagerProps {
  showTitle?: boolean;
  compact?: boolean;
  maxConnections?: number;
}

export const ComposioConnectionManager: React.FC<ComposioConnectionManagerProps> = ({
  showTitle = true,
  compact = false,
  maxConnections
}) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<ComposioApp | null>(null);

  // Hooks
  const { connections, isLoading: connectionsLoading, refetch } = useComposioConnections();
  const { apps, isLoading: appsLoading } = useComposioApps();
  const { createConnection, isCreating } = useCreateComposioConnection();
  const deleteConnection = useDeleteComposioConnection();

  // Get available apps (not already connected)
  const connectedAppKeys = connections.map(conn => conn.app_key);
  const availableApps = apps.filter(app => !connectedAppKeys.includes(app.key));

  const handleCreateConnection = async (app: ComposioApp) => {
    try {
      const connection = await createConnection(app.key);
      
      if (connection.auth_url) {
        // Open auth URL in new window
        window.open(connection.auth_url, '_blank', 'width=600,height=700');
        toast.success(`Opening authentication for ${app.name}...`);
      } else {
        toast.success(`Successfully connected to ${app.name}!`);
      }
      
      setIsAddDialogOpen(false);
      setSelectedApp(null);
      refetch();
    } catch (error) {
      console.error('Failed to create connection:', error);
      toast.error(`Failed to connect to ${app.name}`);
    }
  };

  const handleDeleteConnection = async (connection: ComposioConnection) => {
    if (!confirm(`Are you sure you want to disconnect from ${connection.app_name}?`)) {
      return;
    }

    try {
      await deleteConnection.mutateAsync(connection.app_key);
      refetch();
    } catch (error) {
      console.error('Failed to delete connection:', error);
    }
  };

  const getStatusBadge = (status: ComposioConnection['status']) => {
    switch (status) {
      case 'connected':
        return <Badge variant="default" className="bg-green-100 text-green-800">Connected</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'expired':
        return <Badge variant="outline">Expired</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: ComposioConnection['status']) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'error':
      case 'expired':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  if (connectionsLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading connections...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {showTitle && (
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Composio Connections</h3>
            <p className="text-sm text-muted-foreground">
              Manage your global app connections that can be used across all agents
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                size="sm" 
                disabled={maxConnections && connections.length >= maxConnections}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Connection
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Connection</DialogTitle>
                <DialogDescription>
                  Choose an app to connect. You'll authenticate once and can use it across all agents.
                </DialogDescription>
              </DialogHeader>
              
              {appsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading apps...</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                  {availableApps.map((app) => (
                    <Card 
                      key={app.key} 
                      className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                        selectedApp?.key === app.key ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedApp(app)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{app.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{app.name}</p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {app.category.replace('-', ' ')}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              
              {selectedApp && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{selectedApp.icon}</span>
                    <div>
                      <p className="font-medium">{selectedApp.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedApp.description}</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => handleCreateConnection(selectedApp)}
                    disabled={isCreating}
                  >
                    {isCreating ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <ExternalLink className="h-4 w-4 mr-2" />
                    )}
                    Connect
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Connections List */}
      {connections.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <div className="text-muted-foreground">
              <Plus className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No connections yet</p>
              <p className="text-sm">Add your first app connection to get started</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className={`grid gap-3 ${compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
          {connections.map((connection) => {
            const app = apps.find(a => a.key === connection.app_key);
            
            return (
              <Card key={connection.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(connection.status)}
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{app?.icon || '🔗'}</span>
                        <div>
                          <p className="font-medium text-sm">{app?.name || connection.app_name}</p>
                          <p className="text-xs text-muted-foreground">
                            Connected {new Date(connection.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {getStatusBadge(connection.status)}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteConnection(connection)}
                        disabled={deleteConnection.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Info Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          These connections are shared across all your agents. Connect once, use everywhere!
        </AlertDescription>
      </Alert>
    </div>
  );
};

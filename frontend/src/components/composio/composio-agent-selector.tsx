/**
 * Composio Agent Selector Component
 * 
 * This component allows agents to select which global Composio connections
 * to use without requiring re-authentication. It integrates with the existing
 * agent MCP configuration system.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink,
  Info
} from 'lucide-react';
import { 
  useComposioConnections, 
  useComposioApps 
} from '@/hooks/react-query/composio/use-composio';
import { ComposioConnection, ComposioApp } from '@/types/composio';

interface AgentComposioConfig {
  qualified_name: string;
  enabled: boolean;
}

interface ComposioAgentSelectorProps {
  agentId?: string;
  currentMcpConfig: any[]; // Current agent.configured_mcps
  onConfigChange: (newConfig: any[]) => void;
  disabled?: boolean;
}

export const ComposioAgentSelector: React.FC<ComposioAgentSelectorProps> = ({
  agentId,
  currentMcpConfig = [],
  onConfigChange,
  disabled = false
}) => {
  const [localConfig, setLocalConfig] = useState<AgentComposioConfig[]>([]);

  // Hooks
  const { connections, isLoading: connectionsLoading } = useComposioConnections();
  const { apps } = useComposioApps();

  // Initialize local config from current MCP config
  useEffect(() => {
    const composioConfigs = currentMcpConfig
      .filter(config => config.qualified_name?.startsWith('composio/'))
      .map(config => ({
        qualified_name: config.qualified_name,
        enabled: config.enabled ?? true
      }));

    // Add any missing connections as disabled
    const existingQualifiedNames = composioConfigs.map(c => c.qualified_name);
    const missingConnections = connections
      .filter(conn => !existingQualifiedNames.includes(conn.qualified_name))
      .map(conn => ({
        qualified_name: conn.qualified_name,
        enabled: false
      }));

    setLocalConfig([...composioConfigs, ...missingConnections]);
  }, [currentMcpConfig, connections]);

  const handleToggleConnection = (qualifiedName: string, enabled: boolean) => {
    // Update local config
    const updatedLocalConfig = localConfig.map(config =>
      config.qualified_name === qualifiedName
        ? { ...config, enabled }
        : config
    );
    setLocalConfig(updatedLocalConfig);

    // Update the full MCP config
    const nonComposioConfigs = currentMcpConfig.filter(
      config => !config.qualified_name?.startsWith('composio/')
    );

    const composioConfigs = updatedLocalConfig
      .filter(config => config.enabled) // Only include enabled ones
      .map(config => ({
        qualified_name: config.qualified_name,
        enabled: config.enabled
      }));

    const newFullConfig = [...nonComposioConfigs, ...composioConfigs];
    onConfigChange(newFullConfig);
  };

  const getConnectionStatus = (qualifiedName: string): ComposioConnection | undefined => {
    return connections.find(conn => conn.qualified_name === qualifiedName);
  };

  const getAppInfo = (qualifiedName: string): ComposioApp | undefined => {
    const appKey = qualifiedName.replace('composio/', '');
    return apps.find(app => app.key === appKey);
  };

  const getStatusBadge = (connection?: ComposioConnection) => {
    if (!connection) return <Badge variant="outline">Not Connected</Badge>;
    
    switch (connection.status) {
      case 'connected':
        return <Badge variant="default" className="bg-green-100 text-green-800">Connected</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'expired':
        return <Badge variant="outline">Expired</Badge>;
      default:
        return <Badge variant="secondary">{connection.status}</Badge>;
    }
  };

  const getStatusIcon = (connection?: ComposioConnection) => {
    if (!connection) return <AlertCircle className="h-4 w-4 text-gray-400" />;
    
    switch (connection.status) {
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

  const enabledCount = localConfig.filter(config => config.enabled).length;
  const availableCount = connections.filter(conn => conn.status === 'connected').length;

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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>Composio Connections</span>
            <Badge variant="outline">
              {enabledCount} of {availableCount} enabled
            </Badge>
          </CardTitle>
          <CardDescription>
            Select which of your global app connections this agent should use.
            No re-authentication required!
          </CardDescription>
        </CardHeader>
        <CardContent>
          {connections.length === 0 ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                No Composio connections found. Create connections in your dashboard first,
                then come back to enable them for this agent.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {connections.map((connection) => {
                const app = getAppInfo(connection.qualified_name);
                const config = localConfig.find(c => c.qualified_name === connection.qualified_name);
                const isEnabled = config?.enabled ?? false;
                const canEnable = connection.status === 'connected';

                return (
                  <div 
                    key={connection.id} 
                    className={`flex items-center justify-between p-3 border rounded-lg ${
                      !canEnable ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(connection)}
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{app?.icon || '🔗'}</span>
                        <div>
                          <p className="font-medium text-sm">
                            {app?.name || connection.app_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {app?.description || connection.qualified_name}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {getStatusBadge(connection)}
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={(checked) => 
                          handleToggleConnection(connection.qualified_name, checked)
                        }
                        disabled={disabled || !canEnable}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {connections.length > 0 && (
            <Alert className="mt-4">
              <Info className="h-4 w-4" />
              <AlertDescription>
                Only connected apps can be enabled. If an app shows as "Pending" or "Error",
                you may need to complete the authentication process.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      {enabledCount > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm">
              <p className="font-medium mb-2">This agent will have access to:</p>
              <div className="flex flex-wrap gap-2">
                {localConfig
                  .filter(config => config.enabled)
                  .map(config => {
                    const app = getAppInfo(config.qualified_name);
                    return (
                      <Badge key={config.qualified_name} variant="secondary">
                        {app?.icon} {app?.name || config.qualified_name.replace('composio/', '')}
                      </Badge>
                    );
                  })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

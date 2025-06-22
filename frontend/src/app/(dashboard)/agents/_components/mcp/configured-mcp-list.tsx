import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, X, Users } from 'lucide-react';
import { MCPConfiguration } from './types';


interface ConfiguredMcpListProps {
  configuredMCPs: MCPConfiguration[];
  onEdit: (index: number) => void;
  onRemove: (index: number) => void;
  sharedMCPNames?: string[]; // Names of MCPs that are shared from default agent
}

export const ConfiguredMcpList: React.FC<ConfiguredMcpListProps> = ({
  configuredMCPs,
  onEdit,
  onRemove,
  sharedMCPNames = [],
}) => {
  if (configuredMCPs.length === 0) return null;

  // Helper function to check if an MCP is shared from default agent
  const isSharedMCP = (mcpName: string) => {
    return sharedMCPNames.includes(mcpName);
  };

  // Helper function to get MCP icon based on type/name
  const getMCPIcon = (mcp: MCPConfiguration) => {
    if (mcp.isCustom) {
      // For custom MCPs (like Composio integrations), try to get specific icons
      const lowerName = mcp.name.toLowerCase();
      if (lowerName.includes('gmail') || lowerName.includes('google')) return '📧';
      if (lowerName.includes('slack')) return '💬';
      if (lowerName.includes('github')) return '🐙';
      if (lowerName.includes('notion')) return '📝';
      if (lowerName.includes('calendar')) return '📅';
      if (lowerName.includes('drive')) return '💾';
      return '🔧'; // Default for custom MCPs
    }
    return '⚡'; // Default for standard MCPs
  };

  return (
    <div className="space-y-2">
      {configuredMCPs.map((mcp, index) => {
        const isShared = isSharedMCP(mcp.name);

        return (
          <Card key={index} className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm">{getMCPIcon(mcp)}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm truncate">{mcp.name}</span>
                    <div className="flex items-center gap-1">
                      {isShared && (
                        <Badge variant="secondary" className="text-xs px-1.5 py-0 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                          <Users className="h-2.5 w-2.5 mr-0.5" />
                          Shared
                        </Badge>
                      )}
                      {mcp.isCustom && (
                        <Badge variant="outline" className="text-xs px-1.5 py-0">
                          Custom
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {mcp.enabledTools?.length || 0} tools enabled
                    {isShared && (
                      <span className="ml-2 text-blue-600 dark:text-blue-400">
                        • From Atlas
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onEdit(index)}
                  className="h-8 w-8 p-0"
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onRemove(index)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

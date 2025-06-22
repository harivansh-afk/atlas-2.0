import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Sparkles, Check, Users, Zap } from 'lucide-react';
import { useDefaultAgentMCPs } from '@/hooks/react-query/agents/use-agents';

interface SharedMCPListProps {
  currentMCPs: Array<{
    name: string;
    qualifiedName?: string;
    config: any;
    enabledTools?: string[];
    isCustom?: boolean;
    customType?: 'http' | 'sse';
  }>;
  onAddMCP: (mcp: any) => void;
  className?: string;
}

export const SharedMCPList: React.FC<SharedMCPListProps> = ({
  currentMCPs,
  onAddMCP,
  className
}) => {
  const { data: defaultMCPs, isLoading, error } = useDefaultAgentMCPs();

  // Helper function to check if an MCP is already added to current agent
  const isMCPAlreadyAdded = (mcpName: string, isCustom: boolean = false) => {
    return currentMCPs.some(mcp => {
      if (isCustom) {
        return mcp.isCustom && mcp.name === mcpName;
      } else {
        return !mcp.isCustom && mcp.name === mcpName;
      }
    });
  };

  // Helper function to get MCP icon based on type/name
  const getMCPIcon = (mcpName: string, isCustom: boolean = false) => {
    if (isCustom) {
      // For custom MCPs (like Composio integrations), try to get specific icons
      const lowerName = mcpName.toLowerCase();
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

  // Combine and format all available MCPs from default agent
  const availableMCPs = React.useMemo(() => {
    if (!defaultMCPs) return [];

    const mcps = [];

    // Add configured MCPs (standard Smithery MCPs)
    defaultMCPs.configured_mcps.forEach(mcp => {
      mcps.push({
        name: mcp.name,
        qualifiedName: `configured_${mcp.name.replace(/\s+/g, '_').toLowerCase()}`,
        config: mcp.config,
        enabledTools: [],
        isCustom: false,
        type: 'configured' as const,
        icon: getMCPIcon(mcp.name, false),
        toolCount: 0 // Standard MCPs don't show tool count in this context
      });
    });

    // Add custom MCPs (including Composio integrations)
    defaultMCPs.custom_mcps.forEach(mcp => {
      mcps.push({
        name: mcp.name,
        qualifiedName: `custom_${mcp.type}_${mcp.name.replace(/\s+/g, '_').toLowerCase()}`,
        config: mcp.config,
        enabledTools: mcp.enabledTools,
        isCustom: true,
        customType: mcp.type as 'http' | 'sse',
        type: 'custom' as const,
        icon: getMCPIcon(mcp.name, true),
        toolCount: mcp.enabledTools?.length || 0
      });
    });

    return mcps;
  }, [defaultMCPs]);

  if (isLoading) {
    return (
      <div className={className}>
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Shared from Atlas</span>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Shared from Atlas</span>
        </div>
        <div className="text-sm text-muted-foreground text-center py-4">
          Failed to load shared MCP servers
        </div>
      </div>
    );
  }

  if (!availableMCPs.length) {
    return (
      <div className={className}>
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Shared from Atlas</span>
        </div>
        <div className="text-sm text-muted-foreground text-center py-4">
          No MCP servers configured in your Atlas agent yet.{' '}
          <span className="text-primary">Connect some on the dashboard first.</span>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-3">
        <Users className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">Shared from Atlas</span>
        <Badge variant="secondary" className="text-xs">
          {availableMCPs.length} available
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 gap-2">
        {availableMCPs.map((mcp) => {
          const isAlreadyAdded = isMCPAlreadyAdded(mcp.name, mcp.isCustom);
          
          return (
            <motion.div
              key={mcp.qualifiedName}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="hover:shadow-sm transition-shadow">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* MCP Icon */}
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm">{mcp.icon}</span>
                      </div>
                      
                      {/* MCP Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">{mcp.name}</span>
                          {mcp.isCustom && (
                            <Badge variant="outline" className="text-xs px-1 py-0">
                              Custom
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {mcp.toolCount > 0 ? `${mcp.toolCount} tools` : 'Standard MCP'}
                        </div>
                      </div>
                    </div>
                    
                    {/* Add/Added Button */}
                    <div className="flex-shrink-0 ml-2">
                      {isAlreadyAdded ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled
                          className="h-8 w-8 p-0 text-green-500"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onAddMCP(mcp)}
                          className="h-8 w-8 p-0 hover:bg-primary hover:text-primary-foreground"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

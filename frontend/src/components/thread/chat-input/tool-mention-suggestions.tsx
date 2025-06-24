'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Check, 
  Plus, 
  ExternalLink, 
  Zap,
  ChevronRight
} from 'lucide-react';
import { ClassifiedMCPTool } from '@/hooks/use-mcp-tool-classification';

interface ToolMentionSuggestionsProps {
  tools: ClassifiedMCPTool[];
  searchQuery: string;
  onToolSelect: (tool: ClassifiedMCPTool) => void;
  onConnect?: (tool: ClassifiedMCPTool) => void;
  isLoading?: boolean;
}

interface GroupedTools {
  connectedToAgent: ClassifiedMCPTool[];
  connectedToAccount: ClassifiedMCPTool[];
  availableToConnect: ClassifiedMCPTool[];
}

export function ToolMentionSuggestions({
  tools,
  searchQuery,
  onToolSelect,
  onConnect,
  isLoading = false
}: ToolMentionSuggestionsProps) {
  // Group tools by connection status
  const groupedTools: GroupedTools = React.useMemo(() => {
    const filtered = tools.filter(tool => 
      tool.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return {
      connectedToAgent: filtered.filter(t => t.status === 'connected_to_agent'),
      connectedToAccount: filtered.filter(t => t.status === 'connected_to_account'),
      availableToConnect: filtered.filter(t => t.status === 'available_to_connect'),
    };
  }, [tools, searchQuery]);

  // Render tool icon with proper fallback logic (similar to MCP server card)
  const renderToolIcon = (tool: ClassifiedMCPTool) => {
    const isIconUrl = tool.icon && tool.icon.startsWith('http');
    
    return (
      <div className="w-7 h-7 flex-shrink-0 flex items-center justify-center bg-background border border-border rounded-md">
        {isIconUrl ? (
          <img
            src={tool.icon}
            alt={tool.displayName}
            className="w-7 h-7 object-contain rounded-md"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const fallback = target.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = 'flex';
            }}
          />
        ) : null}

        {/* Fallback icon */}
        <div
          className="w-7 h-7 flex items-center justify-center text-muted-foreground"
          style={{ display: isIconUrl ? 'none' : 'flex' }}
        >
          {tool.icon && !isIconUrl ? (
            <span className="text-lg">{tool.icon}</span>
          ) : (
            <Zap className="h-5 w-5" />
          )}
        </div>
      </div>
    );
  };

  // Render individual tool item
  const renderToolItem = (tool: ClassifiedMCPTool) => {
    const getStatusConfig = () => {
      switch (tool.status) {
        case 'connected_to_agent':
          return {
            badge: 'Connected',
            badgeVariant: 'default' as const,
            icon: <Check className="h-4 w-4 text-green-500" />,
            action: null
          };
        case 'connected_to_account':
          return {
            badge: 'Add to Agent',
            badgeVariant: 'secondary' as const,
            icon: <ChevronRight className="h-4 w-4 text-blue-500" />,
            action: () => onToolSelect(tool)
          };
        case 'available_to_connect':
          return {
            badge: 'Connect',
            badgeVariant: 'outline' as const,
            icon: <ExternalLink className="h-4 w-4 text-orange-500" />,
            action: () => onConnect?.(tool)
          };
        default:
          return {
            badge: tool.type,
            badgeVariant: 'outline' as const,
            icon: null,
            action: () => onToolSelect(tool)
          };
      }
    };

    const statusConfig = getStatusConfig();

    return (
      <motion.div
        key={tool.id}
        initial={{ opacity: 0, y: 2 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer rounded-md transition-colors"
        onClick={() => {
          if (statusConfig.action) {
            statusConfig.action();
          } else {
            onToolSelect(tool);
          }
        }}
      >
        {/* Tool Icon */}
        {renderToolIcon(tool)}

        {/* Tool Info */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-foreground truncate">
            {tool.displayName}
          </div>
          {tool.toolCount && (
            <div className="text-xs text-muted-foreground">
              {tool.toolCount} tools
            </div>
          )}
        </div>

        {/* Status Icon */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {statusConfig.icon}
          <Badge variant={statusConfig.badgeVariant} className="text-xs">
            {statusConfig.badge}
          </Badge>
        </div>
      </motion.div>
    );
  };

  // Render section with tools
  const renderSection = (title: string, tools: ClassifiedMCPTool[], showSeparator: boolean = true) => {
    if (tools.length === 0) return null;

    return (
      <div>
        {showSeparator && <Separator className="my-2" />}
        <div className="px-3 py-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {title}
          </h4>
        </div>
        <div className="space-y-1">
          {tools.map(renderToolItem)}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <div className="text-sm text-muted-foreground">Loading tools...</div>
      </div>
    );
  }

  const totalResults = groupedTools.connectedToAgent.length + 
                      groupedTools.connectedToAccount.length + 
                      groupedTools.availableToConnect.length;

  if (totalResults === 0) {
    return (
      <div className="p-4 text-center">
        <div className="text-sm text-muted-foreground">
          {searchQuery ? `No tools found for "${searchQuery}"` : 'No tools available'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-h-80 overflow-y-auto">
      {/* Connected to Agent */}
      {renderSection('Connected', groupedTools.connectedToAgent, false)}
      
      {/* Connected to Account */}
      {renderSection('Available in Account', groupedTools.connectedToAccount)}
      
      {/* Available to Connect */}
      {renderSection('Available to Connect', groupedTools.availableToConnect)}

      {/* Results count */}
      {searchQuery && (
        <div className="px-3 py-2 border-t">
          <div className="text-xs text-muted-foreground">
            {totalResults} result{totalResults !== 1 ? 's' : ''} for "{searchQuery}"
          </div>
        </div>
      )}
    </div>
  );
}

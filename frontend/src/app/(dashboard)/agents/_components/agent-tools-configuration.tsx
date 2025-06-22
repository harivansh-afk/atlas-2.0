import React, { useState, useMemo } from 'react';
import { Search, Settings2, Zap } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DEFAULT_AGENTPRESS_TOOLS, getToolDisplayName } from '../_data/tools';
import { useDefaultAgentMCPs } from '@/hooks/react-query/agents/use-agents';

interface AgentToolsConfigurationProps {
  tools: Record<string, { enabled: boolean; description: string }>;
  onToolsChange: (tools: Record<string, { enabled: boolean; description: string }>) => void;
  mcps?: Array<{ name: string; qualifiedName: string; config: any; enabledTools?: string[]; isCustom?: boolean; customType?: 'http' | 'sse' }>;
  customMcps?: Array<{ name: string; type: 'http' | 'sse'; config: any; enabledTools: string[] }>;
  onMCPToggle?: (mcpName: string, enabled: boolean, isCustom: boolean) => void;
}

export const AgentToolsConfiguration = ({
  tools,
  onToolsChange,
  mcps = [],
  customMcps = [],
  onMCPToggle
}: AgentToolsConfigurationProps) => {
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Get default agent MCPs for shared tools
  const { data: defaultMCPs, isLoading: isLoadingDefaultMCPs } = useDefaultAgentMCPs();

  const handleToolToggle = (toolName: string, enabled: boolean) => {
    const updatedTools = {
      ...tools,
      [toolName]: {
        ...tools[toolName],
        enabled
      }
    };
    onToolsChange(updatedTools);
  };

  const handleMCPToggle = (mcpName: string, enabled: boolean, isCustom: boolean) => {
    if (onMCPToggle) {
      onMCPToggle(mcpName, enabled, isCustom);
    }
  };

  // Helper function to get MCP icon using the same logic as dashboard MCP server card
  const getMCPIcon = (mcp: any) => {
    // For custom MCPs, try to get icon from known Composio apps
    if (mcp.isCustom) {
      const lowerName = mcp.name.toLowerCase();

      // Use the same icon URLs as the Composio API for consistency
      if (lowerName.includes('gmail') || lowerName.includes('google')) {
        return 'https://cdn.jsdelivr.net/gh/ComposioHQ/open-logos@master/gmail.svg';
      }
      if (lowerName.includes('slack')) {
        return 'https://cdn.jsdelivr.net/gh/ComposioHQ/open-logos@master/slack.svg';
      }
      if (lowerName.includes('github')) {
        return 'https://cdn.jsdelivr.net/gh/ComposioHQ/open-logos@master/github.png';
      }
      if (lowerName.includes('notion')) {
        return 'https://cdn.jsdelivr.net/gh/ComposioHQ/open-logos@master/notion.svg';
      }
      if (lowerName.includes('calendar')) {
        return 'https://cdn.jsdelivr.net/gh/ComposioHQ/open-logos@master/googlecalendar.svg';
      }
      if (lowerName.includes('drive')) {
        return 'https://cdn.jsdelivr.net/gh/ComposioHQ/open-logos@master/googledrive.svg';
      }
      if (lowerName.includes('linear')) {
        return 'https://cdn.jsdelivr.net/gh/ComposioHQ/open-logos@master/linear.svg';
      }
      if (lowerName.includes('jira')) {
        return 'https://cdn.jsdelivr.net/gh/ComposioHQ/open-logos@master/jira.svg';
      }
      if (lowerName.includes('trello')) {
        return 'https://cdn.jsdelivr.net/gh/ComposioHQ/open-logos@master/trello.svg';
      }
      if (lowerName.includes('discord')) {
        return 'https://cdn.jsdelivr.net/gh/ComposioHQ/open-logos@master/discord.svg';
      }
      if (lowerName.includes('twitter') || lowerName.includes('x.com')) {
        return 'https://cdn.jsdelivr.net/gh/ComposioHQ/open-logos@master/twitter.svg';
      }
      if (lowerName.includes('linkedin')) {
        return 'https://cdn.jsdelivr.net/gh/ComposioHQ/open-logos@master/linkedin.svg';
      }
      if (lowerName.includes('youtube')) {
        return 'https://cdn.jsdelivr.net/gh/ComposioHQ/open-logos@master/youtube.svg';
      }
      if (lowerName.includes('spotify')) {
        return 'https://cdn.jsdelivr.net/gh/ComposioHQ/open-logos@master/spotify.svg';
      }
      if (lowerName.includes('figma')) {
        return 'https://cdn.jsdelivr.net/gh/ComposioHQ/open-logos@master/figma.svg';
      }
      if (lowerName.includes('dropbox')) {
        return 'https://cdn.jsdelivr.net/gh/ComposioHQ/open-logos@master/dropbox.svg';
      }

      // Fallback emoji for unknown custom MCPs
      return '🔧';
    }

    // For standard MCPs, use emoji fallback
    return '⚡';
  };

  // Check if an MCP is currently enabled for this agent
  const isMCPEnabled = (mcpName: string, isCustom: boolean) => {
    if (isCustom) {
      return customMcps.some(mcp => mcp.name === mcpName);
    } else {
      return mcps.some(mcp => mcp.name === mcpName);
    }
  };

  // Get shared MCPs from default agent
  const sharedMCPs = useMemo(() => {
    if (!defaultMCPs) return [];

    const shared = [];

    // Add configured MCPs (standard Smithery MCPs)
    defaultMCPs.configured_mcps.forEach(mcp => {
      const mcpData = { ...mcp, isCustom: false };
      shared.push({
        name: mcp.name,
        type: 'mcp' as const,
        isCustom: false,
        icon: getMCPIcon(mcpData),
        toolCount: 0,
        enabled: isMCPEnabled(mcp.name, false),
        originalData: mcp
      });
    });

    // Add custom MCPs (including Composio integrations)
    defaultMCPs.custom_mcps.forEach(mcp => {
      const mcpData = { ...mcp, isCustom: true };
      shared.push({
        name: mcp.name,
        type: 'mcp' as const,
        isCustom: true,
        icon: getMCPIcon(mcpData),
        toolCount: mcp.enabledTools?.length || 0,
        enabled: isMCPEnabled(mcp.name, true),
        originalData: mcp
      });
    });

    return shared;
  }, [defaultMCPs, mcps, customMcps]);

  const getSelectedToolsCount = (): number => {
    const regularToolsCount = Object.values(tools).filter(tool => tool.enabled).length;
    const enabledMCPsCount = sharedMCPs.filter(mcp => mcp.enabled).length;
    return regularToolsCount + enabledMCPsCount;
  };

  const getFilteredTools = (): Array<[string, any]> => {
    let toolEntries = Object.entries(DEFAULT_AGENTPRESS_TOOLS);

    if (searchQuery) {
      toolEntries = toolEntries.filter(([toolName, toolInfo]) =>
        getToolDisplayName(toolName).toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return toolEntries;
  };

  const getFilteredSharedMCPs = () => {
    if (!searchQuery) return sharedMCPs;

    return sharedMCPs.filter(mcp =>
      mcp.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  return (
    <Card className='px-0 bg-transparent border-none shadow-none'>
      <CardHeader className='px-0'>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {getSelectedToolsCount()} selected
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 px-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
          {/* Shared MCP Tools - Show first */}
          {getFilteredSharedMCPs().map((mcp) => (
            <div
              key={`mcp-${mcp.name}`}
              className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border hover:border-border/80 transition-colors"
            >
              {/* Use same icon logic as dashboard MCP server card */}
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                {mcp.icon && mcp.icon.startsWith('http') ? (
                  <img
                    src={mcp.icon}
                    alt={mcp.name}
                    className="w-8 h-8 object-contain rounded"
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
                  className="w-8 h-8 flex items-center justify-center text-blue-600"
                  style={{ display: mcp.icon && mcp.icon.startsWith('http') ? 'none' : 'flex' }}
                >
                  {mcp.icon && !mcp.icon.startsWith('http') ? (
                    <span className="text-lg">{mcp.icon}</span>
                  ) : (
                    <Zap className="h-5 w-5" />
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-sm truncate">
                      {mcp.name}
                    </h4>
                    <Badge variant="secondary" className="text-xs px-1.5 py-0 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                      App
                    </Badge>
                  </div>
                  <Switch
                    checked={mcp.enabled}
                    onCheckedChange={(checked) => handleMCPToggle(mcp.name, checked, mcp.isCustom)}
                    className="flex-shrink-0"
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Regular Tools */}
          {getFilteredTools().map(([toolName, toolInfo]) => (
            <div
              key={toolName}
              className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border hover:border-border/80 transition-colors"
            >
              <div className={`w-10 h-10 rounded-lg ${toolInfo.color} flex items-center justify-center flex-shrink-0`}>
                <span className="text-lg">{toolInfo.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">
                    {getToolDisplayName(toolName)}
                  </h4>
                  <Switch
                    checked={tools[toolName]?.enabled || false}
                    onCheckedChange={(checked) => handleToolToggle(toolName, checked)}
                    className="flex-shrink-0"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {getFilteredTools().length === 0 && getFilteredSharedMCPs().length === 0 && (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">🔍</div>
            <h3 className="text-sm font-medium mb-1">No tools found</h3>
            <p className="text-xs text-muted-foreground">Try adjusting your search criteria</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

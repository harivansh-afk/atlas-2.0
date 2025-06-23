import React, { useState, useMemo, useCallback } from 'react';
import { Search, Zap, Terminal, FolderOpen, Globe } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  SiGmail, SiNotion, SiLinear, SiHubspot, SiFigma, SiClickup, SiGooglesheets, SiGoogledocs, SiSlack, SiGithub
} from 'react-icons/si';
import { FaMicrosoft, FaTwitter } from 'react-icons/fa';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
  const { data: defaultMCPs } = useDefaultAgentMCPs();

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

  // Helper function to get MCP icon component (using React icons like suggestions)
  const getMCPIconComponent = (mcp: any): React.ComponentType<any> => {
    const lowerName = mcp.name.toLowerCase();
    const qualifiedName = mcp.qualifiedName?.toLowerCase() || '';

    // Handle Smithery MCP servers by qualifiedName first
    if (!mcp.isCustom && qualifiedName) {
      // Common Smithery MCP servers
      if (qualifiedName.includes('exa')) return Search;
      if (qualifiedName.includes('github')) return SiGithub;
      if (qualifiedName.includes('notion')) return SiNotion;
      if (qualifiedName.includes('slack')) return SiSlack;
      if (qualifiedName.includes('linear')) return SiLinear;
      if (qualifiedName.includes('figma')) return SiFigma;
      if (qualifiedName.includes('desktop-commander')) return Terminal; // Terminal/desktop tool
      if (qualifiedName.includes('filesystem')) return FolderOpen; // File operations
    }

    // Try to match against known integrations by name
    if (lowerName.includes('gmail')) return SiGmail;
    if (lowerName.includes('google')) {
      if (lowerName.includes('docs')) return SiGoogledocs;
      if (lowerName.includes('sheets')) return SiGooglesheets;
      return SiGooglesheets; // Default to sheets for google
    }
    if (lowerName.includes('notion')) return SiNotion;
    if (lowerName.includes('linear')) return SiLinear;
    if (lowerName.includes('slack')) return SiSlack;
    if (lowerName.includes('github')) return SiGithub;
    if (lowerName.includes('figma')) return SiFigma;
    if (lowerName.includes('hubspot')) return SiHubspot;
    if (lowerName.includes('clickup')) return SiClickup;
    if (lowerName.includes('twitter') || lowerName.includes('x.com')) return FaTwitter;
    if (lowerName.includes('microsoft')) return FaMicrosoft;

    // Standard MCP servers
    if (lowerName.includes('terminal')) return Terminal;
    if (lowerName.includes('file') || lowerName.includes('filesystem')) return FolderOpen;
    if (lowerName.includes('browser') || lowerName.includes('web')) return Globe;

    // Default fallback
    return Zap;
  };

  // Check if an MCP is currently enabled for this agent
  const isMCPEnabled = useCallback((mcpName: string, isCustom: boolean) => {
    if (isCustom) {
      return customMcps.some(mcp => mcp.name === mcpName);
    } else {
      return mcps.some(mcp => mcp.name === mcpName);
    }
  }, [mcps, customMcps]);

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
        iconComponent: getMCPIconComponent(mcpData),
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
        iconComponent: getMCPIconComponent(mcpData),
        toolCount: mcp.enabledTools?.length || 0,
        enabled: isMCPEnabled(mcp.name, true),
        originalData: mcp
      });
    });

    return shared;
  }, [defaultMCPs, isMCPEnabled]);

  const getSelectedToolsCount = (): number => {
    const regularToolsCount = Object.values(tools).filter(tool => tool.enabled).length;
    const enabledMCPsCount = sharedMCPs.filter(mcp => mcp.enabled).length;
    return regularToolsCount + enabledMCPsCount;
  };

  const getFilteredTools = (): Array<[string, any]> => {
    let toolEntries = Object.entries(DEFAULT_AGENTPRESS_TOOLS);

    if (searchQuery) {
      toolEntries = toolEntries.filter(([toolName]) =>
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
              {/* Use React icon component like suggestions */}
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0">
                <mcp.iconComponent className="h-6 w-6" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <h4 className="font-medium text-sm truncate min-w-0">
                      {mcp.name}
                    </h4>
                    <Badge variant="secondary" className="text-xs px-1.5 py-0 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 flex-shrink-0">
                      App
                    </Badge>
                  </div>
                  <Switch
                    checked={mcp.enabled}
                    onCheckedChange={(checked) => handleMCPToggle(mcp.name, checked, mcp.isCustom)}
                    className="flex-shrink-0 ml-2"
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
                  <h4 className="font-medium text-sm truncate min-w-0 flex-1">
                    {getToolDisplayName(toolName)}
                  </h4>
                  <Switch
                    checked={tools[toolName]?.enabled || false}
                    onCheckedChange={(checked) => handleToolToggle(toolName, checked)}
                    className="flex-shrink-0 ml-2"
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

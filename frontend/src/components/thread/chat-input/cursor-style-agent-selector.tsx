'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, Plus, Infinity, User, Bot, Check, Search } from 'lucide-react';
import {
  SiGmail, SiNotion, SiLinear, SiHubspot, SiFigma, SiClickup, SiGooglesheets, SiGoogledocs, SiSlack, SiGithub
} from 'react-icons/si';
import { FaMicrosoft, FaTwitter } from 'react-icons/fa';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useAgents } from '@/hooks/react-query/agents/use-agents';
import { useRouter } from 'next/navigation';

interface CursorStyleAgentSelectorProps {
  selectedAgentId?: string;
  onAgentSelect: (agentId: string | undefined) => void;
  disabled?: boolean;
  className?: string;
}

// Integration icon mapping (same as suggestions component)
const integrationIcons: Record<string, React.ComponentType<any>> = {
  'gmail': SiGmail,
  'google': SiGooglesheets, // Default to Sheets for google
  'googledocs': SiGoogledocs,
  'googlesheets': SiGooglesheets,
  'googlecalendar': SiGooglesheets, // Using sheets as fallback for calendar
  'googledrive': SiGooglesheets, // Using sheets as fallback for drive
  'notion': SiNotion,
  'linear': SiLinear,
  'hubspot': SiHubspot,
  'twitter': FaTwitter,
  'figma': SiFigma,
  'clickup': SiClickup,
  'slack': SiSlack,
  'github': SiGithub,
  'microsoft': FaMicrosoft,
};

// Helper function to get MCP icon component (using React icons like suggestions)
const getMCPIconComponent = (mcp: any): React.ComponentType<any> => {
  const lowerName = mcp.name.toLowerCase();

  // Try to match against known integrations
  if (lowerName.includes('gmail')) return integrationIcons['gmail'];
  if (lowerName.includes('google')) {
    if (lowerName.includes('docs')) return integrationIcons['googledocs'];
    if (lowerName.includes('sheets')) return integrationIcons['googlesheets'];
    if (lowerName.includes('calendar')) return integrationIcons['googlecalendar'];
    if (lowerName.includes('drive')) return integrationIcons['googledrive'];
    return integrationIcons['google']; // Default to sheets
  }
  if (lowerName.includes('notion')) return integrationIcons['notion'];
  if (lowerName.includes('linear')) return integrationIcons['linear'];
  if (lowerName.includes('hubspot')) return integrationIcons['hubspot'];
  if (lowerName.includes('twitter')) return integrationIcons['twitter'];
  if (lowerName.includes('figma')) return integrationIcons['figma'];
  if (lowerName.includes('clickup')) return integrationIcons['clickup'];
  if (lowerName.includes('slack')) return integrationIcons['slack'];
  if (lowerName.includes('github')) return integrationIcons['github'];
  if (lowerName.includes('microsoft')) return integrationIcons['microsoft'];

  // Default fallback
  return Search;
};

// Helper function to get all MCP tools for an agent
const getAgentMCPTools = (agent: any): Array<{name: string, IconComponent: React.ComponentType<any>}> => {
  if (!agent) return [];

  const tools: Array<{name: string, IconComponent: React.ComponentType<any>}> = [];

  // Add configured MCPs
  if (agent.configured_mcps) {
    agent.configured_mcps.forEach((mcp: any) => {
      tools.push({
        name: mcp.name,
        IconComponent: getMCPIconComponent({ ...mcp, isCustom: false })
      });
    });
  }

  // Add custom MCPs
  if (agent.custom_mcps) {
    agent.custom_mcps.forEach((mcp: any) => {
      tools.push({
        name: mcp.name,
        IconComponent: getMCPIconComponent({ ...mcp, isCustom: true })
      });
    });
  }

  return tools;
};

// Icon tray component for MCP tools (exactly like suggestions component)
const MCPIconTray = ({ tools, maxIcons = 3 }: { tools: Array<{name: string, IconComponent: React.ComponentType<any>}>, maxIcons?: number }) => {
  if (!tools || tools.length === 0) return null;

  const visibleTools = tools.slice(0, maxIcons);
  const remainingCount = tools.length - maxIcons;

  return (
    <div className="flex items-center">
      {visibleTools.map((tool, idx) => {
        const IconComponent = tool.IconComponent;
        return (
          <div
            key={tool.name}
            className="relative flex items-center justify-center bg-background border border-border rounded-full shadow-sm p-1.5"
            style={{
              height: 24,
              width: 24,
              marginLeft: idx > 0 ? '-8px' : '0',
              zIndex: visibleTools.length - idx,
            }}
          >
            <IconComponent className="text-muted-foreground" size={12} />
          </div>
        );
      })}
      {remainingCount > 0 && (
        <div
          className="flex items-center justify-center bg-muted border border-border rounded-full text-xs text-muted-foreground font-medium shadow-sm"
          style={{
            height: 24,
            width: 24,
            marginLeft: '-8px',
            zIndex: 0,
          }}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
};

export function CursorStyleAgentSelector({
  selectedAgentId,
  onAgentSelect,
  disabled = false,
  className,
}: CursorStyleAgentSelectorProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const { data: agentsResponse, isLoading } = useAgents({
    limit: 100,
    sort_by: 'name',
    sort_order: 'asc'
  });

  const agents = agentsResponse?.agents || [];
  const selectedAgent = agents?.find(a => a.agent_id === selectedAgentId);
  const defaultAgent = agents?.find(a => a.is_default);
  const isUsingSuna = !selectedAgent && !defaultAgent;

  // Display the currently selected agent's name, or default agent's name, or fallback to "Atlas"
  const displayName = selectedAgent?.name || defaultAgent?.name || 'Atlas';

  // Auto-select default agent when available and no agent is currently selected
  useEffect(() => {
    if (!selectedAgentId && defaultAgent && !isLoading && onAgentSelect) {
      onAgentSelect(defaultAgent.agent_id);
    }
  }, [selectedAgentId, defaultAgent, isLoading, onAgentSelect]);

  const handleCreateAgent = () => {
    setOpen(false);
    router.push('/agents');
  };

  const handleClearSelection = () => {
    onAgentSelect(undefined);
    setOpen(false);
  };

  return (
    <div className="flex items-center gap-1">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'flex items-center gap-1 px-2 py-1 h-7 text-xs text-muted-foreground bg-muted hover:text-accent-foreground hover:bg-muted/80 rounded-lg shadow-sm dark:shadow-none',
              disabled && 'opacity-50 cursor-not-allowed',
              className
            )}
            disabled={disabled}
          >
            <Infinity className="h-3 w-3" />
            <span className="text-xs select-none">
              {displayName}
            </span>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-60 p-1"
        sideOffset={4}
      >
        {/* Default agent option - show either the database default agent or fallback "Agent" option */}
        {defaultAgent ? (
          <DropdownMenuItem
            className="flex flex-col items-start gap-0.5 px-2 py-1.5 text-xs rounded-sm cursor-pointer group"
            onSelect={() => {
              onAgentSelect(defaultAgent.agent_id);
              setOpen(false);
            }}
          >
            <div className="flex items-center gap-2 w-full">
              <div className="flex items-center gap-1 flex-1 min-w-0">
                <Badge variant="outline" className="text-xs px-1 py-0 h-4 flex-shrink-0 border-muted-foreground/30 group-hover:border-foreground/50 group-hover:text-foreground">
                  {defaultAgent.name}
                </Badge>
                {/* MCP Tools Icon Tray for default agent */}
                <MCPIconTray tools={getAgentMCPTools(defaultAgent)} maxIcons={5} />
              </div>
              {selectedAgentId === defaultAgent.agent_id && (
                <Check className="h-4 w-4 ml-auto flex-shrink-0 text-blue-500" />
              )}
            </div>
            <span className="text-xs text-muted-foreground group-hover:text-foreground pl-0 line-clamp-1">
              {defaultAgent.description || 'Your personal AI employee'}
            </span>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            className="flex flex-col items-start gap-0.5 px-2 py-1.5 text-xs rounded-sm cursor-pointer group"
            onSelect={handleClearSelection}
          >
            <div className="flex items-center gap-2 w-full">
              <div className="flex items-center gap-1 flex-1 min-w-0">
                <Badge variant="outline" className="text-xs px-1 py-0 h-4 flex-shrink-0 border-muted-foreground/30 group-hover:border-foreground/50 group-hover:text-foreground">
                  Atlas
                </Badge>
              </div>
              {isUsingSuna && (
                <Check className="h-4 w-4 ml-auto flex-shrink-0 text-blue-500" />
              )}
            </div>
            <span className="text-xs text-muted-foreground group-hover:text-foreground pl-0 line-clamp-1">
              Your personal AI employee
            </span>
          </DropdownMenuItem>
        )}

        {/* Separator only if there are other custom agents (non-default) */}
        {agents.filter(agent => !agent.is_default).length > 0 && (
          <DropdownMenuSeparator className="my-1" />
        )}

        {/* Custom agents (excluding default agent since it's shown above) */}
        {agents.filter(agent => !agent.is_default).map((agent) => (
          <DropdownMenuItem
            key={agent.agent_id}
            className="flex flex-col items-start gap-0.5 px-2 py-1.5 text-xs rounded-sm cursor-pointer group"
            onSelect={() => {
              onAgentSelect(agent.agent_id);
              setOpen(false);
            }}
          >
            <div className="flex items-center gap-2 w-full">
              {agent.avatar ? (
                <span className="text-sm">{agent.avatar}</span>
              ) : (
                <Bot className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground" />
              )}
              <div className="flex items-center gap-1 flex-1 min-w-0">
                 <span className="font-medium truncate group-hover:text-foreground">{agent.name}</span>
                 {/* MCP Tools Icon Tray for custom agents */}
                 <MCPIconTray tools={getAgentMCPTools(agent)} maxIcons={5} />
              </div>
              {selectedAgentId === agent.agent_id && (
                <Check className="h-4 w-4 ml-auto flex-shrink-0 text-blue-500" />
              )}
            </div>
            {agent.description && (
              <span className="text-xs text-muted-foreground group-hover:text-foreground pl-[22px] line-clamp-1">
                {agent.description}
              </span>
            )}
          </DropdownMenuItem>
        ))}

        {/* Agent Playground button */}
        <DropdownMenuSeparator className="my-1" />
        <DropdownMenuItem
          className="flex items-center gap-2 px-2 py-1.5 text-xs rounded-sm cursor-pointer text-muted-foreground hover:text-foreground group"
          onSelect={handleCreateAgent}
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Agent Playground</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
  );
}

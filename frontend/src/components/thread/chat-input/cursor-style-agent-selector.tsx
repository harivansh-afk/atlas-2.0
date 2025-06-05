'use client';

import React, { useState } from 'react';
import { ChevronDown, Plus, Infinity, User, Bot, Star, Check } from 'lucide-react';
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

  const displayName = selectedAgent?.name || defaultAgent?.name || 'Agent';

  const handleCreateAgent = () => {
    setOpen(false);
    router.push('/agents');
  };

  const handleClearSelection = () => {
    onAgentSelect(undefined);
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'flex items-center gap-1 px-2 py-1 h-7 text-xs text-muted-foreground bg-muted hover:text-accent-foreground hover:bg-muted/80 rounded-lg',
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
        {/* Atlas (Default) option */}
        <DropdownMenuItem
          className="flex flex-col items-start gap-0.5 px-2 py-1.5 text-xs rounded-sm cursor-pointer group"
          onSelect={handleClearSelection}
        >
          <div className="flex items-center gap-2 w-full">
            {/* <User className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground" /> */}
            <div className="flex items-center gap-1 flex-1 min-w-0">
              {/* <span className="font-medium truncate group-hover:text-foreground">Atlas</span> */}
              <Badge variant="outline" className="text-xs px-1 py-0 h-4 flex-shrink-0 border-muted-foreground/30 group-hover:border-foreground/50 group-hover:text-foreground">
                Agent
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

        {/* Separator if there are custom agents */}
        {agents.length > 0 && (
          <DropdownMenuSeparator className="my-1" />
        )}

        {/* Custom agents */}
        {agents.map((agent) => (
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
                {agent.is_default && (
                  <Badge variant="secondary" className="text-xs px-1 py-0 h-4 flex-shrink-0">
                    <Star className="h-2.5 w-2.5 mr-0.5 fill-current" />
                    System
                  </Badge>
                )}
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
  );
}

import React from 'react';
import { Settings, Trash2, Star, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { getAgentAvatar } from '../_utils/get-agent-style';

interface Agent {
  agent_id: string;
  name: string;
  description?: string;
  is_default: boolean;
  is_public?: boolean;
  marketplace_published_at?: string;
  download_count?: number;
  tags?: string[];
  created_at: string;
  updated_at?: string;
  configured_mcps?: Array<{ name: string }>;
  agentpress_tools?: Record<string, any>;
  avatar?: string;
  avatar_color?: string;
}

interface AgentsGridProps {
  agents: Agent[];
  onEditAgent: (agentId: string) => void;
  onDeleteAgent: (agentId: string) => void;
  onToggleDefault: (agentId: string, currentDefault: boolean) => void;
  deleteAgentMutation: { isPending: boolean };
}



export const AgentsGrid = ({
  agents,
  onEditAgent,
  onDeleteAgent,
  onToggleDefault,
  deleteAgentMutation
}: AgentsGridProps) => {
  const router = useRouter();

  const handleAgentClick = (agent: Agent) => {
    router.push(`/agents/new/${agent.agent_id}`);
  };

  const getAgentStyling = (agent: Agent) => {
    if (agent.avatar && agent.avatar_color) {
      return {
        avatar: agent.avatar,
        color: agent.avatar_color,
      };
    }
    return getAgentAvatar(agent.agent_id);
  };

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {agents.map((agent) => {
          const { avatar, color } = getAgentStyling(agent);

          return (
            <div
              key={agent.agent_id}
              className="bg-neutral-100 dark:bg-sidebar border border-border rounded-2xl overflow-hidden hover:bg-muted/50 transition-all duration-200 cursor-pointer group"
              onClick={() => handleAgentClick(agent)}
            >
              <div className={`h-50 flex items-center justify-center relative`} style={{ backgroundColor: color }}>
                <div className="text-4xl">
                  {avatar}
                </div>
                <div className="absolute top-3 right-3 flex gap-2">
                  {agent.is_default && (
                    <Star className="h-4 w-4 text-white fill-white drop-shadow-sm" />
                  )}
                  {agent.is_public && (
                    <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full">
                      <Globe className="h-3 w-3 text-white" />
                      <span className="text-white text-xs font-medium">{agent.download_count || 0}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-foreground font-medium text-lg line-clamp-1 flex-1">
                    {agent.name}
                  </h3>
                  {agent.is_public && (
                    <Badge variant="outline" className="text-xs shrink-0">
                      <Globe className="h-3 w-3" />
                      Public
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                  {agent.description || 'Try out this agent'}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">
                    By me
                  </span>

                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!agent.is_default && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive text-muted-foreground"
                            disabled={deleteAgentMutation.isPending}
                            title="Delete agent"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="max-w-md">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-xl">Delete Agent</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete &quot;{agent.name}&quot;? This action cannot be undone.
                              {agent.is_public && (
                                <span className="block mt-2 text-amber-600 dark:text-amber-400">
                                  Note: This agent is currently published to the marketplace and will be removed from there as well.
                                </span>
                              )}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={(e) => e.stopPropagation()}>
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteAgent(agent.agent_id);
                              }}
                              disabled={deleteAgentMutation.isPending}
                              className="bg-destructive hover:bg-destructive/90 text-white"
                            >
                              {deleteAgentMutation.isPending ? 'Deleting...' : 'Delete'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

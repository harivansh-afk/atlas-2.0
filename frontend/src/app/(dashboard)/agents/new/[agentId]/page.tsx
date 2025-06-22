'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Settings2, Sparkles, Check, Clock, Menu, MessageCircle, Globe, GlobeLock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAgent, useUpdateAgent, useDefaultAgentMCPs } from '@/hooks/react-query/agents/use-agents';
import { usePublishAgent, useUnpublishAgent } from '@/hooks/react-query/marketplace/use-marketplace';

import { toast } from 'sonner';
import { AgentToolsConfiguration } from '../../_components/agent-tools-configuration';

import { getAgentAvatar } from '../../_utils/get-agent-style';
import { EditableText } from '@/components/ui/editable';
import { StylePicker } from '../../_components/style-picker';
import { useSidebar } from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AgentBuilderChat } from '../../_components/agent-builder-chat';

import { CustomMCPDialog } from '../../_components/mcp/custom-mcp-dialog';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export default function AgentConfigurationPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const agentId = params.agentId as string;
  const isFromOnboarding = searchParams.get('onboarding') === 'true';

  const { data: agent, isLoading, error } = useAgent(agentId);
  const updateAgentMutation = useUpdateAgent();
  const { setOpen, setOpenMobile } = useSidebar();

  // Marketplace hooks
  const publishAgentMutation = usePublishAgent();
  const unpublishAgentMutation = useUnpublishAgent();

  // Ref to track if initial layout has been applied (for sidebar closing)
  const initialLayoutAppliedRef = useRef(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    system_prompt: '',
    agentpress_tools: {},
    configured_mcps: [],
    custom_mcps: [],
    is_default: false,
    avatar: '',
    avatar_color: '',
  });

  const originalDataRef = useRef<typeof formData | null>(null);
  const currentFormDataRef = useRef(formData);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [showCustomMCPDialog, setShowCustomMCPDialog] = useState(false);
  const accordionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!initialLayoutAppliedRef.current) {
      setOpen(true);
      initialLayoutAppliedRef.current = true;
    }
  }, [setOpen]);

  useEffect(() => {
    if (agent) {
      const agentData = agent as any;
      const initialData = {
        name: agentData.name || '',
        description: agentData.description || '',
        system_prompt: agentData.system_prompt || '',
        agentpress_tools: agentData.agentpress_tools || {},
        configured_mcps: agentData.configured_mcps || [],
        custom_mcps: agentData.custom_mcps || [],
        is_default: agentData.is_default || false,
        avatar: agentData.avatar || '',
        avatar_color: agentData.avatar_color || '',
      };
      setFormData(initialData);
      originalDataRef.current = { ...initialData };
    }
  }, [agent]);

  // Show custom MCP dialog when coming from onboarding
  useEffect(() => {
    if (isFromOnboarding && agent && !isLoading) {
      // Show custom MCP dialog after a short delay to ensure UI is ready
      const timer = setTimeout(() => {
        setShowCustomMCPDialog(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isFromOnboarding, agent, isLoading]);


  useEffect(() => {
    if (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('Access denied') || errorMessage.includes('403')) {
        toast.error('You don\'t have permission to edit this agent');
        router.push('/agents');
        return;
      }
    }
  }, [error, router]);

  useEffect(() => {
    currentFormDataRef.current = formData;
  }, [formData]);

  const hasDataChanged = useCallback((newData: typeof formData, originalData: typeof formData | null): boolean => {
    if (!originalData) return true;
    if (newData.name !== originalData.name ||
        newData.description !== originalData.description ||
        newData.system_prompt !== originalData.system_prompt ||
        newData.is_default !== originalData.is_default ||
        newData.avatar !== originalData.avatar ||
        newData.avatar_color !== originalData.avatar_color) {
      return true;
    }
    if (JSON.stringify(newData.agentpress_tools) !== JSON.stringify(originalData.agentpress_tools) ||
        JSON.stringify(newData.configured_mcps) !== JSON.stringify(originalData.configured_mcps) ||
        JSON.stringify(newData.custom_mcps) !== JSON.stringify(originalData.custom_mcps)) {
      return true;
    }
    return false;
  }, []);

  const saveAgent = useCallback(async (data: typeof formData) => {
    try {
      setSaveStatus('saving');
      await updateAgentMutation.mutateAsync({
        agentId,
        ...data
      });
      originalDataRef.current = { ...data };
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Error updating agent:', error);
      setSaveStatus('error');
      toast.error('Failed to update agent');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }, [agentId, updateAgentMutation]);

  const debouncedSave = useCallback((data: typeof formData) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (!hasDataChanged(data, originalDataRef.current)) {
      return;
    }
    const timer = setTimeout(() => {
      if (hasDataChanged(data, originalDataRef.current)) {
        saveAgent(data);
      }
    }, 500);

    debounceTimerRef.current = timer;
  }, [saveAgent, hasDataChanged]);

  const handleFieldChange = useCallback((field: string, value: any) => {
    const newFormData = {
      ...currentFormDataRef.current,
      [field]: value
    };

    setFormData(newFormData);
    debouncedSave(newFormData);
  }, [debouncedSave]);



  // Get default agent MCPs at the component level
  const { data: defaultMCPs } = useDefaultAgentMCPs();

  const handleMCPToggle = useCallback((mcpName: string, enabled: boolean, isCustom: boolean) => {
    if (isCustom) {
      // Handle custom MCPs
      let newCustomMcps = [...currentFormDataRef.current.custom_mcps];

      if (enabled) {
        // Add MCP from default agent if not already present
        if (defaultMCPs) {
          const defaultMCP = defaultMCPs.custom_mcps.find(mcp => mcp.name === mcpName);
          if (defaultMCP && !newCustomMcps.some(mcp => mcp.name === mcpName)) {
            newCustomMcps.push(defaultMCP);
          }
        }
      } else {
        // Remove MCP
        newCustomMcps = newCustomMcps.filter(mcp => mcp.name !== mcpName);
      }

      const newFormData = {
        ...currentFormDataRef.current,
        custom_mcps: newCustomMcps
      };
      setFormData(newFormData);
      debouncedSave(newFormData);
    } else {
      // Handle configured MCPs
      let newConfiguredMcps = [...currentFormDataRef.current.configured_mcps];

      if (enabled) {
        // Add MCP from default agent if not already present
        if (defaultMCPs) {
          const defaultMCP = defaultMCPs.configured_mcps.find(mcp => mcp.name === mcpName);
          if (defaultMCP && !newConfiguredMcps.some(mcp => mcp.name === mcpName)) {
            newConfiguredMcps.push({
              name: defaultMCP.name,
              qualifiedName: `configured_${defaultMCP.name.replace(/\s+/g, '_').toLowerCase()}`,
              config: defaultMCP.config,
              enabledTools: []
            });
          }
        }
      } else {
        // Remove MCP
        newConfiguredMcps = newConfiguredMcps.filter(mcp => mcp.name !== mcpName);
      }

      const newFormData = {
        ...currentFormDataRef.current,
        configured_mcps: newConfiguredMcps
      };
      setFormData(newFormData);
      debouncedSave(newFormData);
    }
  }, [debouncedSave, defaultMCPs]);

  const scrollToAccordion = useCallback(() => {
    if (accordionRef.current) {
      accordionRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'end'
      });
    }
  }, []);

  const handleStyleChange = useCallback((emoji: string, color: string) => {
    const newFormData = {
      ...currentFormDataRef.current,
      avatar: emoji,
      avatar_color: color,
    };
    setFormData(newFormData);
    debouncedSave(newFormData);
  }, [debouncedSave]);

  const handleCustomMCPSave = useCallback((customConfig: any) => {
    const newCustomMcp = {
      name: customConfig.name,
      type: customConfig.type as 'http' | 'sse',
      config: customConfig.config,
      enabledTools: customConfig.enabledTools
    };

    const newFormData = {
      ...currentFormDataRef.current,
      custom_mcps: [...currentFormDataRef.current.custom_mcps, newCustomMcp]
    };

    setFormData(newFormData);
    debouncedSave(newFormData);
    setShowCustomMCPDialog(false);

    toast.success(`Successfully connected ${customConfig.name} with ${customConfig.enabledTools.length} tools`);
  }, [debouncedSave]);

  // Marketplace handlers
  const handlePublish = useCallback(async () => {
    try {
      await publishAgentMutation.mutateAsync({ agentId, tags: [] });
      toast.success('Agent published to marketplace successfully!');
    } catch (error: any) {
      toast.error('Failed to publish agent to marketplace');
    }
  }, [agentId, publishAgentMutation]);

  const handleUnpublish = useCallback(async () => {
    try {
      await unpublishAgentMutation.mutateAsync(agentId);
      toast.success('Agent removed from marketplace');
    } catch (error: any) {
      toast.error('Failed to remove agent from marketplace');
    }
  }, [agentId, unpublishAgentMutation]);

  const handleChat = useCallback(() => {
    router.push(`/dashboard?agent_id=${agentId}`);
  }, [router, agentId]);

  const currentStyle = useMemo(() => {
    if (formData.avatar && formData.avatar_color) {
      return {
        avatar: formData.avatar,
        color: formData.avatar_color,
      };
    }
    return getAgentAvatar(agentId);
  }, [formData.avatar, formData.avatar_color, agentId]);

  const memoizedAgentBuilderChat = useMemo(() => (
    <AgentBuilderChat
      agentId={agentId}
      formData={formData}
      handleFieldChange={handleFieldChange}
      handleStyleChange={handleStyleChange}
      currentStyle={currentStyle}
    />
  ), [agentId, formData, handleFieldChange, handleStyleChange, currentStyle]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const getSaveStatusBadge = () => {
    const showSaved = saveStatus === 'idle' && !hasDataChanged(formData, originalDataRef.current);
    switch (saveStatus) {
      case 'saving':
        return (
          <Badge variant="secondary" className="flex items-center gap-1 text-amber-700 dark:text-amber-300 bg-amber-600/30 hover:bg-amber-700/40">
            <Clock className="h-3 w-3 animate-pulse" />
            Saving...
          </Badge>
        );
      case 'saved':
        return (
          <Badge variant="default" className="flex items-center gap-1 text-green-700 dark:text-green-300 bg-green-600/30 hover:bg-green-700/40">
            <Check className="h-3 w-3" />
            Saved
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive" className="flex items-center gap-1 text-red-700 dark:text-red-300 bg-red-600/30 hover:bg-red-700/40">
            Error saving
          </Badge>
        );

      default:
        return showSaved ? (
          <Badge variant="default" className="flex items-center gap-1 text-green-700 dark:text-green-300 bg-green-600/30 hover:bg-green-700/40">
            <Check className="h-3 w-3" />
            Saved
          </Badge>
        ) : (
          <Badge variant="destructive" className="flex items-center gap-1 text-red-700 dark:text-red-300 bg-red-600/30 hover:bg-red-700/40">
            Error saving
          </Badge>
        );
    }
  };

  const ManualConfigurationContent = useMemo(() => {
    return (
      <div className="h-full flex flex-col">
        <div className="md:hidden flex justify-between items-center mb-4 p-4 pb-0">
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setOpenMobile(true)}
                  className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-accent"
                >
                  <Menu className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Open menu</TooltipContent>
            </Tooltip>
            <div className="md:hidden flex justify-center">
              {getSaveStatusBadge()}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 md:px-12 pb-4 md:pb-12 scrollbar-hide">
            <div className="max-w-full">
              <div className='flex items-start md:items-center flex-col md:flex-row mt-6'>
                <StylePicker
                  agentId={agentId}
                  currentEmoji={currentStyle.avatar}
                  currentColor={currentStyle.color}
                  onStyleChange={handleStyleChange}
                >
                  <div
                    className="flex-shrink-0 h-12 w-12 md:h-16 md:w-16 flex items-center justify-center rounded-2xl text-xl md:text-2xl cursor-pointer hover:opacity-80 transition-opacity mb-3 md:mb-0"
                    style={{ backgroundColor: currentStyle.color }}
                  >
                    {currentStyle.avatar}
                  </div>
                </StylePicker>
                <div className='flex flex-col md:ml-3 w-full min-w-0'>
                  <EditableText
                    value={formData.name}
                    onSave={(value) => handleFieldChange('name', value)}
                    className="text-lg md:text-xl font-semibold bg-transparent"
                    placeholder="Click to add agent name..."
                  />
                  <EditableText
                    value={formData.description}
                    onSave={(value) => handleFieldChange('description', value)}
                    className="text-muted-foreground text-sm md:text-base"
                    placeholder="Click to add description..."
                  />
                </div>
              </div>

              <div className='flex flex-col mt-6 md:mt-8'>
                <div className='text-sm font-semibold text-muted-foreground mb-2'>System Prompt</div>
                <EditableText
                  value={formData.system_prompt}
                  onSave={(value) => handleFieldChange('system_prompt', value)}
                  className='bg-transparent hover:bg-transparent border-none focus-visible:ring-0 shadow-none text-sm md:text-base'
                  placeholder='Click to set system instructions...'
                  multiline={true}
                  minHeight="150px"
                />
              </div>

              <div ref={accordionRef} className="mt-6 border-t">
                <Accordion
                  type="multiple"
                  defaultValue={[]}
                  className="space-y-2"
                  onValueChange={scrollToAccordion}
                >
                  <AccordionItem value="tools" className="border-b">
                    <AccordionTrigger className="hover:no-underline text-sm md:text-base">
                      <div className="flex items-center gap-2">
                        <Settings2 className="h-4 w-4" />
                        Tools
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 overflow-x-hidden">
                      <AgentToolsConfiguration
                        tools={formData.agentpress_tools}
                        onToolsChange={(tools) => handleFieldChange('agentpress_tools', tools)}
                        mcps={formData.configured_mcps}
                        customMcps={formData.custom_mcps}
                        onMCPToggle={handleMCPToggle}
                      />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </div>
        </div>
      </div>
    );
  }, [
    agentId,
    formData,
    currentStyle,
    handleFieldChange,
    handleStyleChange,
    setOpenMobile,
    scrollToAccordion,
    getSaveStatusBadge,
    handleMCPToggle
  ]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading agent...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !agent) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isAccessDenied = errorMessage.includes('Access denied') || errorMessage.includes('403');

    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="text-center space-y-4">
          {isAccessDenied ? (
            <Alert variant="destructive">
              <AlertDescription>
                You don't have permission to edit this agent. You can only edit agents that you created.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <h2 className="text-xl font-semibold mb-2">Agent not found</h2>
              <p className="text-muted-foreground mb-4">The agent you're looking for doesn't exist.</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 flex overflow-hidden">
        <div className="hidden md:flex w-full h-full">
          {/* Left side: Agent Builder */}
          <div className="w-1/2 border-r bg-background h-full flex flex-col">
            <div className="p-4 border-b bg-muted/30">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Agent Builder</h2>
                <Badge variant="beta">Beta</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Chat with AI to build your agent
              </p>
            </div>
            <div className="flex-1 overflow-hidden">
              {memoizedAgentBuilderChat}
            </div>
          </div>

          {/* Right side: Manual Configuration */}
          <div className="w-1/2 overflow-y-auto">
            <div className="p-4 border-b bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings2 className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">Manual Configuration</h2>
                </div>
                {getSaveStatusBadge()}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Configure your agent manually
              </p>
            </div>

            {/* Action Buttons Below Header */}
            <div className="p-4 border-b bg-background">
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleChat}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  Chat
                </Button>

                {agent && (agent as any).is_public ? (
                  <Button
                    onClick={handleUnpublish}
                    disabled={unpublishAgentMutation.isPending}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    {unpublishAgentMutation.isPending ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        Unpublishing...
                      </>
                    ) : (
                      <>
                        <GlobeLock className="h-4 w-4" />
                        Make Private
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handlePublish}
                    disabled={publishAgentMutation.isPending}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    {publishAgentMutation.isPending ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        Publishing...
                      </>
                    ) : (
                      <>
                        <Globe className="h-4 w-4" />
                        Publish to Marketplace
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
            {ManualConfigurationContent}
          </div>
        </div>

        {/* Mobile: Show tabs for smaller screens */}
        <div className="md:hidden w-full h-full flex flex-col">
          <Tabs defaultValue="manual" className="flex-1 flex flex-col overflow-hidden">
            <div className='w-full flex items-center justify-center flex-shrink-0 px-4 mt-4'>
              <TabsList className="grid h-auto w-full grid-cols-2 bg-muted-foreground/10 max-w-md">
                <TabsTrigger value="agent-builder" className="flex items-center gap-1.5 px-2">
                  <span className="truncate">Builder</span>
                  <Badge variant="beta" className="text-xs">Beta</Badge>
                </TabsTrigger>
                <TabsTrigger value="manual">Manual</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="agent-builder" className="mt-0 flex-1 flex flex-col overflow-hidden">
              {memoizedAgentBuilderChat}
            </TabsContent>

            <TabsContent value="manual" className="mt-0 flex-1 overflow-hidden">
              {ManualConfigurationContent}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Custom MCP Dialog for onboarding */}
      <CustomMCPDialog
        open={showCustomMCPDialog}
        onOpenChange={setShowCustomMCPDialog}
        onSave={handleCustomMCPSave}
      />
    </div>
  );
}

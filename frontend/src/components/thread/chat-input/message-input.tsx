import React, { forwardRef, useEffect, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Square, Loader2, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UploadedFile } from './chat-input';
import { FileUploadHandler } from './file-upload-handler';
import { VoiceRecorder } from './voice-recorder';
import { ModelToggle } from './model-toggle';
import { CursorStyleAgentSelector } from './cursor-style-agent-selector';
import { useRunValidation } from '@/hooks/use-run-validation';
import { ToolMentionsInput } from './tool-mentions-input';
import { ClassifiedMCPTool } from '@/hooks/use-mcp-tool-classification';
import { toast } from 'sonner';
import { useUpdateAgent, useAgent } from '@/hooks/react-query/agents/use-agents';
import { useMCPConnection } from '@/hooks/use-mcp-connection';



interface MessageInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onMentionChange?: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onTranscription: (text: string) => void;
  placeholder: string;
  loading: boolean;
  disabled: boolean;
  isAgentRunning: boolean;
  onStopAgent?: () => void;
  isDraggingOver: boolean;
  uploadedFiles: UploadedFile[];

  fileInputRef: React.RefObject<HTMLInputElement>;
  isUploading: boolean;
  sandboxId?: string;
  setPendingFiles: React.Dispatch<React.SetStateAction<File[]>>;
  setUploadedFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>;
  setIsUploading: React.Dispatch<React.SetStateAction<boolean>>;
  hideAttachments?: boolean;
  messages?: any[]; // Add messages prop

  selectedModel: string;
  onModelChange: (model: string) => void;
  canAccessModel: (modelId: string) => boolean;
  subscriptionStatus?: 'active' | 'no_subscription';

  selectedAgentId?: string;
  onAgentSelect?: (agentId: string | undefined) => void;
}

export const MessageInput = forwardRef<HTMLTextAreaElement, MessageInputProps>(
  (
    {
      value,
      onChange,
      onMentionChange,
      onSubmit,
      onTranscription,
      placeholder,
      loading,
      disabled,
      isAgentRunning,
      onStopAgent,
      isDraggingOver,
      uploadedFiles,

      fileInputRef,
      isUploading,
      sandboxId,
      setPendingFiles,
      setUploadedFiles,
      setIsUploading,
      hideAttachments = false,
      messages = [],

      selectedModel,
      onModelChange,
      canAccessModel,
      subscriptionStatus,

      selectedAgentId,
      onAgentSelect,
    },
    ref,
  ) => {
    const { data: currentAgent } = useAgent(selectedAgentId || '');
    const updateAgentMutation = useUpdateAgent();
    const { canSubmit } = useRunValidation();

    // Use the reusable MCP connection hook
    const { connectToMCPServer } = useMCPConnection({
      onConnectionSuccess: (_, appName) => {
        toast.success('Tool Connected!', {
          description: `${appName} is now available for use.`
        });
      }
    });

    // Handle connecting to a new MCP server
    const handleToolConnect = useCallback(async (tool: ClassifiedMCPTool): Promise<void> => {
      if (!tool.originalApp) {
        toast.error('Unable to connect to this tool');
        throw new Error('Unable to connect to this tool');
      }

      try {
        // Use the reusable connection hook
        await connectToMCPServer(tool.originalApp);
      } catch (error) {
        // Error handling is done in the hook, but we need to re-throw for loading state
        throw error;
      }
    }, [connectToMCPServer]);

    // Handle adding a tool to the current agent
    const handleToolAddToAgent = useCallback(async (tool: ClassifiedMCPTool): Promise<void> => {
      if (!selectedAgentId || !currentAgent) {
        toast.error('No agent selected');
        throw new Error('No agent selected');
      }

      try {
        toast.info('Adding tool to agent...', {
          description: `Adding ${tool.displayName} to your agent`
        });

        // Add the tool to the agent's custom MCPs
        const updatedCustomMcps = [...(currentAgent.custom_mcps || [])];

        // Check if tool is already added
        const existingTool = updatedCustomMcps.find(mcp => mcp.name === tool.name);
        if (existingTool) {
          toast.warning('Tool already added', {
            description: `${tool.displayName} is already in this agent`
          });
          return;
        }

        // Add the new tool
        updatedCustomMcps.push({
          name: tool.name,
          type: tool.config?.type || 'http',
          config: tool.config,
          enabledTools: tool.enabledTools || []
        });

        await updateAgentMutation.mutateAsync({
          agentId: selectedAgentId,
          custom_mcps: updatedCustomMcps
        });

        toast.success('Tool added to agent!', {
          description: `${tool.displayName} is now available in this agent`
        });
      } catch (error) {
        console.error('Error adding tool to agent:', error);
        toast.error('Failed to add tool to agent', {
          description: error instanceof Error ? error.message : 'Please try again'
        });
        throw error; // Re-throw to allow loading state to be cleared
      }
    }, [selectedAgentId, currentAgent, updateAgentMutation]);

    useEffect(() => {
      const textarea = ref as React.RefObject<HTMLTextAreaElement>;
      if (!textarea.current) return;

      const adjustHeight = () => {
        textarea.current!.style.height = 'auto';
        const newHeight = Math.min(
          Math.max(textarea.current!.scrollHeight, 24),
          200,
        );
        textarea.current!.style.height = `${newHeight}px`;
      };

      adjustHeight();

      // Call it twice to ensure proper height calculation
      adjustHeight();

      window.addEventListener('resize', adjustHeight);
      return () => window.removeEventListener('resize', adjustHeight);
    }, [value, ref]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
        e.preventDefault();
        if (
          (value.trim() || uploadedFiles.length > 0) &&
          !loading &&
          (!disabled || isAgentRunning) &&
          canSubmit
        ) {
          onSubmit(e as unknown as React.FormEvent);
        }
      }
    };

    return (
      <div className="relative flex flex-col w-full h-auto gap-4 justify-between">

        <div className="flex flex-col gap-2 items-center px-2">
          {onMentionChange ? (
            <ToolMentionsInput
              ref={ref}
              value={value}
              onChange={onMentionChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={loading || (disabled && !isAgentRunning)}
              selectedAgentId={selectedAgentId}
              isDraggingOver={isDraggingOver}
              onToolConnect={handleToolConnect}
              onToolAddToAgent={handleToolAddToAgent}
              className={cn(
                'w-full bg-transparent dark:bg-transparent border-none shadow-none focus-visible:ring-0 px-2 py-1 text-base min-h-[40px] max-h-[200px] overflow-y-auto resize-none',
                isDraggingOver ? 'opacity-40' : '',
              )}
            />
          ) : (
            <Textarea
              ref={ref}
              value={value}
              onChange={onChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className={cn(
                'w-full bg-transparent dark:bg-transparent border-none shadow-none focus-visible:ring-0 px-2 py-1 text-base min-h-[40px] max-h-[200px] overflow-y-auto resize-none',
                isDraggingOver ? 'opacity-40' : '',
              )}
              disabled={loading || (disabled && !isAgentRunning)}
              rows={2}
            />
          )}
        </div>


        <div className="flex items-center justify-between mt-1 ml-3 mb-1 pr-2">
          <div className="flex items-center gap-3">
            {onAgentSelect && (
              <CursorStyleAgentSelector
                selectedAgentId={selectedAgentId}
                onAgentSelect={onAgentSelect}
                disabled={loading || (disabled && !isAgentRunning)}
              />
            )}
            {!hideAttachments && (
              <FileUploadHandler
                ref={fileInputRef}
                loading={loading}
                disabled={disabled}
                isAgentRunning={isAgentRunning}
                isUploading={isUploading}
                sandboxId={sandboxId}
                setPendingFiles={setPendingFiles}
                setUploadedFiles={setUploadedFiles}
                setIsUploading={setIsUploading}
                messages={messages}
              />
            )}
            <VoiceRecorder
              onTranscription={onTranscription}
              disabled={loading || (disabled && !isAgentRunning)}
            />
            <ModelToggle
              selectedModel={selectedModel}
              onModelChange={onModelChange}
              canAccessModel={canAccessModel}
              subscriptionStatus={subscriptionStatus}
            />
          </div>

          <div className='flex items-center gap-2'>
            <Button
              type="submit"
              onClick={isAgentRunning && onStopAgent ? onStopAgent : onSubmit}
              size="sm"
              className={cn(
                'w-7 h-7 flex-shrink-0 self-end',
                isAgentRunning ? 'bg-red-500 hover:bg-red-600' : '',
                (!value.trim() && uploadedFiles.length === 0 && !isAgentRunning) ||
                  loading ||
                  (disabled && !isAgentRunning) ||
                  !canSubmit
                  ? 'opacity-50'
                  : '',
              )}
              disabled={
                (!value.trim() && uploadedFiles.length === 0 && !isAgentRunning) ||
                loading ||
                (disabled && !isAgentRunning) ||
                !canSubmit
              }
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isAgentRunning ? (
                <Square className="h-4 w-4" />
              ) : (
                <ArrowUp className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  },
);

MessageInput.displayName = 'MessageInput';

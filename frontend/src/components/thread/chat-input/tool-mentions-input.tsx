'use client';

import React, { forwardRef, useCallback, useMemo, useState } from 'react';
import { MentionsInput, Mention } from 'react-mentions';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useMCPToolClassification, ClassifiedMCPTool } from '@/hooks/use-mcp-tool-classification';
import { getMentionStateIcon, resolveToolIcon } from '@/lib/icon-mapping';
import { toast } from 'sonner';

interface ToolMentionsInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  selectedAgentId?: string;
  isDraggingOver?: boolean;
  onToolConnect?: (tool: ClassifiedMCPTool) => Promise<void>;
  onToolAddToAgent?: (tool: ClassifiedMCPTool) => Promise<void>;
}

interface MentionData {
  id: string;
  display: string;
  tool: ClassifiedMCPTool;
}

export const ToolMentionsInput = forwardRef<HTMLTextAreaElement, ToolMentionsInputProps>(
  (
    {
      value,
      onChange,
      onKeyDown,
      placeholder = 'Type @ to mention tools...',
      disabled = false,
      className,
      selectedAgentId,
      isDraggingOver = false,
      onToolConnect,
      onToolAddToAgent,
    },
    ref
  ) => {
    const { resolvedTheme } = useTheme();
    const { allTools, isLoading, error } = useMCPToolClassification(selectedAgentId);
    const [actionLoading, setActionLoading] = useState<string | null>(null); // Track which tool is loading

    // Show error toast if tool classification fails
    React.useEffect(() => {
      if (error) {
        toast.error('Failed to load available tools. Please try again.');
      }
    }, [error]);

    // Convert ALL MCP tools to mention data format
    const mentionData = useMemo((): MentionData[] => {
      return allTools.map((tool) => ({
        id: tool.id,
        display: tool.displayName,
        tool,
      }));
    }, [allTools]);

    // Handle mention input change
    const handleChange = useCallback(
      (_event: any, newValue: string) => {
        onChange(newValue);
      },
      [onChange]
    );

    // Function to find the current mention being typed
    const getCurrentMention = useCallback((text: string, cursorPosition: number) => {
      // Look for @ symbol before cursor position
      const beforeCursor = text.substring(0, cursorPosition);
      const lastAtIndex = beforeCursor.lastIndexOf('@');

      if (lastAtIndex === -1) return null;

      // Get text after @ symbol
      const afterAt = text.substring(lastAtIndex + 1);
      const spaceIndex = afterAt.indexOf(' ');
      const mentionText = spaceIndex === -1 ? afterAt : afterAt.substring(0, spaceIndex);

      // Find matching tool
      const matchingTool = allTools.find(tool =>
        tool.displayName.toLowerCase().includes(mentionText.toLowerCase()) ||
        tool.name.toLowerCase().includes(mentionText.toLowerCase())
      );

      return matchingTool ? { tool: matchingTool, mentionText, startIndex: lastAtIndex } : null;
    }, [allTools]);

    // Handle key presses for Tab/Enter on mentions
    const handleKeyDown = useCallback(async (e: React.KeyboardEvent) => {
      if ((e.key === 'Tab' || e.key === 'Enter') && !e.shiftKey) {
        const target = e.target as HTMLTextAreaElement;
        const cursorPosition = target.selectionStart;
        const currentMention = getCurrentMention(value, cursorPosition);

        if (currentMention && currentMention.tool.status !== 'connected_to_agent') {
          e.preventDefault(); // Prevent default Tab/Enter behavior

          const { tool } = currentMention;
          setActionLoading(tool.id);

          try {
            if (tool.status === 'connected_to_account' && onToolAddToAgent) {
              await onToolAddToAgent(tool);
              toast.success(`${tool.displayName} added to current agent`);
            } else if (tool.status === 'available_to_connect' && onToolConnect) {
              await onToolConnect(tool);
              toast.success(`Connected to ${tool.displayName}`);
            }
          } catch (error) {
            console.error('Tool action failed:', error);

            // Show user-friendly error messages
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

            if (tool.status === 'connected_to_account') {
              toast.error(`Failed to add ${tool.displayName} to agent: ${errorMessage}`);
            } else if (tool.status === 'available_to_connect') {
              toast.error(`Failed to connect to ${tool.displayName}: ${errorMessage}`);
            } else {
              toast.error(`Tool action failed: ${errorMessage}`);
            }
          } finally {
            setActionLoading(null);
          }

          return;
        }
      }

      // Call original onKeyDown if provided
      if (onKeyDown) {
        onKeyDown(e);
      }
    }, [value, getCurrentMention, onToolConnect, onToolAddToAgent, onKeyDown]);

    // Render tool icon with clean, minimal design using shared utility
    const renderToolIcon = useCallback((tool: ClassifiedMCPTool) => {
      const IconComponent = resolveToolIcon(tool);

      return (
        <div className="w-7 h-7 flex-shrink-0 flex items-center justify-center bg-background border border-border rounded-full shadow-sm">
          <IconComponent className="h-4 w-4 text-muted-foreground" />
        </div>
      );
    }, []);

    // Handle tool action based on status with error handling
    const handleToolAction = useCallback(async (tool: ClassifiedMCPTool, event?: React.MouseEvent) => {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }

      switch (tool.status) {
        case 'connected_to_agent':
          // Tool is already connected, just add it as a mention
          return true; // Allow normal mention behavior
        case 'connected_to_account':
          // Tool is connected to account but not agent, add it to agent
          if (onToolAddToAgent) {
            setActionLoading(tool.id);
            try {
              await onToolAddToAgent(tool);
              toast.success(`${tool.displayName} added to current agent`);
            } catch (error) {
              console.error('Failed to add tool to agent:', error);
              const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
              toast.error(`Failed to add ${tool.displayName} to agent: ${errorMessage}`);
            } finally {
              setActionLoading(null);
            }
            return false; // Prevent normal mention behavior
          }
          return true;
        case 'available_to_connect':
          // Tool needs to be connected first
          if (onToolConnect) {
            setActionLoading(tool.id);
            try {
              await onToolConnect(tool);
              toast.success(`Connected to ${tool.displayName}`);
            } catch (error) {
              console.error('Failed to connect tool:', error);
              const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
              toast.error(`Failed to connect to ${tool.displayName}: ${errorMessage}`);
            } finally {
              setActionLoading(null);
            }
            return false; // Prevent normal mention behavior
          }
          return true;
        default:
          return true;
      }
    }, [onToolConnect, onToolAddToAgent]);

    // Clean, minimal suggestion renderer with action handling
    const renderSuggestion = useCallback(
      (suggestion: MentionData, _search: string, highlightedDisplay: React.ReactNode) => {
        const { tool } = suggestion;

        const getStatusIcon = () => {
          // Show loading spinner if this tool is currently being processed
          if (actionLoading === tool.id) {
            const LoadingIcon = getMentionStateIcon('loading');
            return <LoadingIcon className="h-4 w-4 animate-spin text-blue-500" />;
          }

          const StatusIcon = getMentionStateIcon(tool.status);
          const colorClass = {
            'connected_to_agent': 'text-green-500',
            'connected_to_account': 'text-blue-500',
            'available_to_connect': 'text-orange-500'
          }[tool.status] || 'text-muted-foreground';

          return <StatusIcon className={`h-4 w-4 ${colorClass}`} />;
        };

        const handleClick = async (event: React.MouseEvent) => {
          const shouldProceed = await handleToolAction(tool, event);
          if (!shouldProceed) {
            // Action was handled, don't proceed with mention
            return;
          }
          // For connected_to_agent tools, let the normal mention behavior proceed
        };

        return (
          <div
            className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 cursor-pointer transition-all duration-200 rounded-xl mx-2 group"
            onClick={handleClick}
          >
            {/* Tool Icon */}
            {renderToolIcon(tool)}

            {/* Tool Info */}
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-foreground truncate group-hover:text-foreground">
                {highlightedDisplay}
              </div>
              {tool.toolCount && tool.toolCount > 0 && (
                <div className="text-xs text-muted-foreground group-hover:text-muted-foreground/80">
                  {tool.toolCount} tools
                </div>
              )}
            </div>

            {/* Status Icon */}
            <div className="flex items-center flex-shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
              {getStatusIcon()}
            </div>
          </div>
        );
      },
      [renderToolIcon, handleToolAction, actionLoading]
    );

    // Custom mention display transform
    const displayTransform = useCallback((_id: string, display: string) => {
      return `@${display}`;
    }, []);

    // Clean, elegant styles for the mentions input with circular design
    // Use computed colors based on theme to ensure proper dark mode support
    const mentionsInputStyle = useMemo(() => {
      const isDark = resolvedTheme === 'dark';

      // Define colors based on theme
      const colors = isDark ? {
        background: 'oklch(0.145 0 0)', // --popover in dark mode
        foreground: 'oklch(0.985 0 0)', // --popover-foreground in dark mode
        border: 'oklch(0.269 0 0)', // --border in dark mode
        muted: 'oklch(0.269 0 0)', // --muted in dark mode
      } : {
        background: 'oklch(1 0 0)', // --popover in light mode
        foreground: 'oklch(0.145 0 0)', // --popover-foreground in light mode
        border: 'oklch(0.922 0 0)', // --border in light mode
        muted: 'oklch(0.97 0 0)', // --muted in light mode
      };

      return {
        control: {
          backgroundColor: 'transparent',
          fontSize: '16px',
          fontWeight: 'normal',
          border: 'none',
          outline: 'none',
        },
        '&multiLine': {
          control: {
            fontFamily: 'inherit',
            minHeight: '40px',
            maxHeight: '200px',
            overflow: 'auto',
            border: 'none',
            outline: 'none',
          },
          highlighter: {
            padding: '8px',
            border: 'none',
            overflow: 'hidden',
          },
          input: {
            padding: '8px',
            border: 'none',
            outline: 'none',
            backgroundColor: 'transparent',
            color: 'inherit',
            resize: 'none',
          },
        },
        suggestions: {
          list: {
            backgroundColor: colors.background,
            border: `1px solid ${colors.border}`,
            borderRadius: '0px',
            boxShadow: isDark
              ? '0 20px 25px -5px rgb(0 0 0 / 0.4), 0 10px 10px -5px rgb(0 0 0 / 0.2)'
              : '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04)',
            fontSize: '14px',
            maxHeight: '320px',
            maxWidth: '360px',
            overflow: 'hidden',
            padding: '8px',
            zIndex: 9999,
            backdropFilter: 'blur(12px)',
            color: colors.foreground,
          },
          item: {
            padding: '0',
            borderRadius: '6px',
            margin: '2px 0',
            '&focused': {
              backgroundColor: isDark ? 'oklch(0.269 0 0 / 0.6)' : 'oklch(0.97 0 0 / 0.6)',
            },
          },
        },
      };
    }, [resolvedTheme]);

    // Mention markup pattern
    const mentionMarkup = '@[__display__](__id__)';

    return (
      <div className={cn('w-full relative', className)}>

        <MentionsInput
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isLoading || actionLoading !== null}
          className={cn(
            'w-full bg-transparent border-none shadow-none focus-visible:ring-0 px-2 py-1 text-base min-h-[40px] max-h-[200px] overflow-y-auto resize-none',
            isDraggingOver ? 'opacity-40' : '',
            actionLoading ? 'opacity-60' : '',
            'mentions-input'
          )}
          style={mentionsInputStyle}
          singleLine={false}
          allowSpaceInQuery={true}
          forceSuggestionsAboveCursor={false}
          suggestionsPortalHost={typeof document !== 'undefined' ? document.body : undefined}
          a11ySuggestionsListLabel="Available tools"
        >
          <Mention
            trigger="@"
            data={mentionData}
            renderSuggestion={renderSuggestion}
            displayTransform={displayTransform}
            markup={mentionMarkup}
            appendSpaceOnAdd={true}
            isLoading={isLoading}
            style={{
              backgroundColor: 'hsl(var(--primary))',
              color: 'hsl(var(--primary-foreground))',
              padding: '3px 8px',
              borderRadius: '12px',
              fontWeight: '500',
              fontSize: '14px',
              boxShadow: '0 2px 4px rgb(0 0 0 / 0.1)',
            }}
          />
        </MentionsInput>
      </div>
    );
  }
);

ToolMentionsInput.displayName = 'ToolMentionsInput';

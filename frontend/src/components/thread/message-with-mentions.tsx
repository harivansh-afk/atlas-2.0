'use client';

import React from 'react';
import { ToolMentionDisplay } from './tool-mention-chip';

interface MessageWithMentionsProps {
  content: string;
  className?: string;
}

/**
 * Component that renders message content with tool mentions as styled chips
 */
export function MessageWithMentions({ content, className }: MessageWithMentionsProps) {
  // Regular expression to match tool mentions in the format @[DisplayName](toolId)
  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;

  // Parse the content and create elements
  const parseContent = (text: string) => {
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    // Reset regex lastIndex
    mentionRegex.lastIndex = 0;

    while ((match = mentionRegex.exec(text)) !== null) {
      const [fullMatch, displayName, toolId] = match;
      const startIndex = match.index;

      // Add text before the mention
      if (startIndex > lastIndex) {
        const beforeText = text.slice(lastIndex, startIndex);
        if (beforeText) {
          elements.push(beforeText);
        }
      }

      // Add the mention chip
      elements.push(
        <ToolMentionDisplay
          key={`mention-${startIndex}-${toolId}`}
          toolId={toolId}
          displayName={displayName}
          size="sm"
          className="mx-1"
        />
      );

      lastIndex = startIndex + fullMatch.length;
    }

    // Add remaining text after the last mention
    if (lastIndex < text.length) {
      const remainingText = text.slice(lastIndex);
      if (remainingText) {
        elements.push(remainingText);
      }
    }

    // If no mentions were found, return the original text
    if (elements.length === 0) {
      return text;
    }

    return elements;
  };

  const parsedContent = parseContent(content);

  return (
    <div className={className}>
      {Array.isArray(parsedContent) ? (
        parsedContent.map((element, index) => (
          <React.Fragment key={index}>{element}</React.Fragment>
        ))
      ) : (
        parsedContent
      )}
    </div>
  );
}

/**
 * Hook to check if a message contains tool mentions
 */
export function useHasToolMentions(content: string): boolean {
  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  mentionRegex.lastIndex = 0;
  return mentionRegex.test(content);
}

/**
 * Hook to extract tool mentions from message content
 */
export function useToolMentions(content: string) {
  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  const mentions: Array<{ displayName: string; toolId: string; startIndex: number }> = [];
  let match;

  mentionRegex.lastIndex = 0;
  while ((match = mentionRegex.exec(content)) !== null) {
    const [, displayName, toolId] = match;
    mentions.push({
      displayName,
      toolId,
      startIndex: match.index,
    });
  }

  return mentions;
}

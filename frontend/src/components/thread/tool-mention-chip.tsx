'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { resolveToolIcon } from '@/lib/icon-mapping';

interface ToolMentionChipProps {
  toolId: string;
  displayName: string;
  className?: string;
  variant?: 'default' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export function ToolMentionChip({
  toolId,
  displayName,
  className,
  variant = 'default',
  size = 'md'
}: ToolMentionChipProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-sm px-2.5 py-1 gap-2',
    lg: 'text-base px-3 py-1.5 gap-2.5',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4',
  };

  // Resolve icon from tool ID
  const IconComponent = resolveToolIcon({ id: toolId, name: displayName, displayName });

  return (
    <Badge
      variant={variant}
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        sizeClasses[size],
        'bg-primary/10 text-primary hover:bg-primary/20 border-primary/20',
        className
      )}
    >
      <IconComponent className={cn('flex-shrink-0', iconSizes[size])} />
      <span className="truncate">
        {displayName}
      </span>
    </Badge>
  );
}

interface ToolMentionDisplayProps {
  toolId: string;
  displayName: string;
  className?: string;
  variant?: 'default' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Component for displaying tool mentions in chat messages
 * This is used when we only have the tool ID and display name from the mention markup
 */
export function ToolMentionDisplay({
  toolId,
  displayName,
  className,
  variant = 'default',
  size = 'md'
}: ToolMentionDisplayProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-sm px-2.5 py-1 gap-2',
    lg: 'text-base px-3 py-1.5 gap-2.5',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4',
  };

  // Resolve icon from tool ID using shared utility
  const IconComponent = resolveToolIcon({ id: toolId, name: displayName, displayName });

  return (
    <Badge
      variant={variant}
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        sizeClasses[size],
        'bg-primary/10 text-primary hover:bg-primary/20 border-primary/20',
        className
      )}
    >
      <IconComponent className={cn('flex-shrink-0', iconSizes[size])} />
      <span className="truncate">
        {displayName}
      </span>
    </Badge>
  );
}

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { HAIKU_MODEL_ID } from './_use-model-selection';

interface ModelToggleProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  canAccessModel: (modelId: string) => boolean;
}

export const ModelToggle: React.FC<ModelToggleProps> = ({
  selectedModel,
  onModelChange,
  canAccessModel,
}) => {
  // Determine if we're in AL1 mode (OpenAI O3) or fast mode (Claude Haiku 3.5)
  const isAL1Mode = selectedModel === 'openai/o3';

  const handleToggle = () => {
    const newModel = isAL1Mode ? HAIKU_MODEL_ID : 'openai/o3';

    if (canAccessModel(newModel)) {
      onModelChange(newModel);

      // Show toast notification based on the NEW model we're switching TO
      if (newModel === 'openai/o3') {
        toast.success('Advanced language mode enabled', {
          description: 'Switched to OpenAI O3',
          duration: 2000,
        });
      } else {
        toast.success('Fast mode enabled', {
          description: 'Switched to Claude Haiku 3.5',
          duration: 2000,
        });
      }
    } else {
      // Show error toast if model is not accessible
      toast.error('Model not accessible', {
        description: 'Please upgrade your subscription to access this model',
        duration: 3000,
      });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleToggle}
        className={cn(
          "relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm dark:shadow-none",
          isAL1Mode
            ? "bg-blue-600"
            : "bg-muted"
        )}
        type="button"
        role="switch"
        aria-checked={isAL1Mode}
        aria-label={`Switch to ${isAL1Mode ? 'fast' : 'advanced language'} mode`}
      >
        {/* Toggle circle */}
        <span
          className={cn(
            "inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 ease-in-out",
            isAL1Mode ? "translate-x-5" : "translate-x-1"
          )}
        />
      </button>

      {/* Mode label */}
      <span className={cn(
        "text-xs text-muted-foreground select-none",
        isAL1Mode ? "font-bold" : "font-normal"
      )}>
        {isAL1Mode ? "AL1" : "AL0"}
      </span>
    </div>
  );
};

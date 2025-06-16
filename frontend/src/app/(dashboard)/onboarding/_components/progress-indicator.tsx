'use client';

import { cn } from '@/lib/utils';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  className?: string;
}

export function ProgressIndicator({ 
  currentStep, 
  totalSteps, 
  className 
}: ProgressIndicatorProps) {
  return (
    <div className={cn(
      "inline-flex items-center justify-center px-3 py-1.5 rounded-full bg-muted text-sm font-medium text-muted-foreground",
      className
    )}>
      {currentStep}/{totalSteps}
    </div>
  );
}

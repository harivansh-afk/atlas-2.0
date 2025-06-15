'use client';

import { useUsageIndicator } from '@/hooks/use-usage-indicator';

export interface RunValidationResult {
  canSubmit: boolean;
  reason?: string;
  runsRemaining?: number;
  isFreePlan?: boolean;
}

export const useRunValidation = (): RunValidationResult => {
  const usageData = useUsageIndicator();

  // If loading, be conservative and block
  if (usageData.isLoading) {
    return {
      canSubmit: false,
      reason: 'Loading subscription data...',
      runsRemaining: 0,
      isFreePlan: true,
    };
  }

  // Check if user has runs remaining
  if (!usageData.hasMessagesLeft) {
    return {
      canSubmit: false,
      reason: usageData.isFreeUser
        ? 'You have used all your free runs. Upgrade to continue using Atlas.'
        : 'You have reached your monthly run limit. Your limit will reset next month.',
      runsRemaining: usageData.messagesLeft,
      isFreePlan: usageData.isFreeUser,
    };
  }

  return {
    canSubmit: true,
    runsRemaining: usageData.messagesLeft,
    isFreePlan: usageData.isFreeUser,
  };
};

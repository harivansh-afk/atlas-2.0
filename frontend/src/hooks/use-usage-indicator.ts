'use client';

import { useSubscription } from '@/hooks/react-query/subscriptions/use-subscriptions';
import { useQueryClient } from '@tanstack/react-query';
import { subscriptionKeys } from '@/hooks/react-query/subscriptions/keys';
import { isLocalMode } from '@/lib/config';
import { useEffect } from 'react';

export interface UsageIndicatorData {
  messagesLeft: number;
  messagesLimit: number;
  currentUsage: number;
  hasMessagesLeft: boolean;
  isFreeUser: boolean;
  isLoading: boolean;
  shouldShowUpgrade: boolean;
}

/**
 * Unified hook for usage indicator data across all pages
 * Ensures consistent data and automatic cache invalidation
 */
export const useUsageIndicator = (): UsageIndicatorData => {
  const { data: subscriptionData, isLoading } = useSubscription();
  const queryClient = useQueryClient();

  // Invalidate cache when component mounts to ensure fresh data
  useEffect(() => {
    if (!isLocalMode()) {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.details() });
    }
  }, [queryClient]);

  // In local mode, return mock data
  if (isLocalMode()) {
    return {
      messagesLeft: 999,
      messagesLimit: 999,
      currentUsage: 0,
      hasMessagesLeft: true,
      isFreeUser: false,
      isLoading: false,
      shouldShowUpgrade: false,
    };
  }

  // If no subscription data yet, return loading state
  if (!subscriptionData || isLoading) {
    return {
      messagesLeft: 0,
      messagesLimit: 0,
      currentUsage: 0,
      hasMessagesLeft: false,
      isFreeUser: true,
      isLoading: true,
      shouldShowUpgrade: false,
    };
  }

  const messagesLimit = subscriptionData.messages_limit || 0;
  const currentUsage = subscriptionData.current_usage || 0;
  const messagesLeft = Math.max(0, messagesLimit - currentUsage);
  const hasMessagesLeft = messagesLeft > 0;
  const isFreeUser = subscriptionData.plan_name === 'free';
  const shouldShowUpgrade = !hasMessagesLeft && isFreeUser;

  return {
    messagesLeft,
    messagesLimit,
    currentUsage,
    hasMessagesLeft,
    isFreeUser,
    isLoading: false,
    shouldShowUpgrade,
  };
};

/**
 * Hook to manually refresh usage data
 * Useful after operations that might change usage
 */
export const useRefreshUsage = () => {
  const queryClient = useQueryClient();

  return () => {
    if (!isLocalMode()) {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.details() });
      queryClient.invalidateQueries({ queryKey: ['billing', 'status'] });
    }
  };
};

'use client';

import { createMutationHook, createQueryHook } from '@/hooks/use-query';
import {
  getSubscription,
  createPortalSession,
  SubscriptionStatus,
} from '@/lib/api';
import { subscriptionKeys } from './keys';
import { useQueryClient } from '@tanstack/react-query';

export const useSubscription = createQueryHook(
  subscriptionKeys.details(),
  getSubscription,
  {
    staleTime: 1000 * 60 * 2, // Reduced to 2 minutes for more frequent updates
    refetchOnWindowFocus: true,
    refetchOnMount: true, // Always refetch when component mounts
    refetchInterval: 1000 * 60 * 3, // Refetch every 3 minutes to keep data fresh
  },
);

export const useCreatePortalSession = () => {
  const queryClient = useQueryClient();

  return createMutationHook(
    (params: { return_url: string }) => createPortalSession(params),
    {
      onSuccess: (data) => {
        // Invalidate subscription cache to ensure fresh data when user returns
        queryClient.invalidateQueries({ queryKey: subscriptionKeys.details() });
        queryClient.invalidateQueries({ queryKey: ['billing', 'status'] });

        if (data?.url) {
          window.location.href = data.url;
        }
      },
    },
  )();
};

export const isPlan = (
  subscriptionData: SubscriptionStatus | null | undefined,
  planId?: string,
): boolean => {
  if (!subscriptionData) return planId === 'free';
  return subscriptionData.plan_name === planId;
};

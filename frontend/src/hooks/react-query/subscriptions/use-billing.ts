'use client';

import { createMutationHook, createQueryHook } from '@/hooks/use-query';
import {
  createCheckoutSession,
  checkBillingStatus,
  getAvailableModels,
  CreateCheckoutSessionRequest
} from '@/lib/api';
import { modelKeys, subscriptionKeys } from './keys';
import { useQueryClient } from '@tanstack/react-query';

export const useAvailableModels = createQueryHook(
  modelKeys.available,
  getAvailableModels,
  {
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  }
);

export const useBillingStatus = createQueryHook(
  ['billing', 'status'],
  checkBillingStatus,
  {
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
  }
);

export const useCreateCheckoutSession = () => {
  const queryClient = useQueryClient();

  return createMutationHook(
    (request: CreateCheckoutSessionRequest) => createCheckoutSession(request),
    {
      onSuccess: (data) => {
        // Invalidate subscription cache to ensure fresh data when user returns
        queryClient.invalidateQueries({ queryKey: subscriptionKeys.details() });
        queryClient.invalidateQueries({ queryKey: ['billing', 'status'] });

        if (data.url) {
          window.location.href = data.url;
        }
      },
      errorContext: {
        operation: 'create checkout session',
        resource: 'billing'
      }
    }
  )();
};

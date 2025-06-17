'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useAgents } from '@/hooks/react-query/agents/use-agents';

interface OnboardingRedirectProps {
  children: React.ReactNode;
}

/**
 * Component that automatically redirects new users to onboarding
 * Only redirects from dashboard page and only for users with no agents
 */
export function OnboardingRedirect({ children }: OnboardingRedirectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading: authLoading } = useAuth();
  const { data: agentsResponse, isLoading: agentsLoading, error: agentsError } = useAgents();
  const [hasCheckedRedirect, setHasCheckedRedirect] = useState(false);

  useEffect(() => {
    // Reset check when user changes
    if (user) {
      setHasCheckedRedirect(false);
    }
  }, [user?.id]);

  useEffect(() => {
    // Only proceed if we have a user and data is loaded, and we haven't checked yet
    if (authLoading || agentsLoading || !user || hasCheckedRedirect) {
      return;
    }

    // If there's an error loading agents, don't redirect (fail safe)
    // This includes cases where custom_agents feature flag is disabled
    if (agentsError) {
      console.error('Error loading agents, skipping onboarding redirect:', agentsError);
      setHasCheckedRedirect(true);
      return;
    }

    // Check if user has any agents
    const existingAgents = agentsResponse?.agents || [];
    const isNewUser = existingAgents.length === 0;

    // Only redirect new users to onboarding, and only from dashboard
    if (isNewUser && pathname === '/dashboard') {
      console.log('New user detected, redirecting to onboarding');
      router.push('/onboarding');
    }

    // Mark that we've checked to prevent repeated checks
    setHasCheckedRedirect(true);
  }, [user, authLoading, agentsLoading, agentsResponse, agentsError, router, pathname, hasCheckedRedirect]);

  return <>{children}</>;
}

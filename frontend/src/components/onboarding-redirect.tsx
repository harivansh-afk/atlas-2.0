'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { createClient } from '@/lib/supabase/client';

interface OnboardingRedirectProps {
  children: React.ReactNode;
}

/**
 * Component that automatically redirects new users to onboarding
 * Checks if user has a default agent - if not, redirects to onboarding
 */
export function OnboardingRedirect({ children }: OnboardingRedirectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading: authLoading } = useAuth();
  const [hasCheckedRedirect, setHasCheckedRedirect] = useState(false);
  const [isCheckingAgent, setIsCheckingAgent] = useState(false);

  useEffect(() => {
    // Reset check when user changes
    if (user) {
      setHasCheckedRedirect(false);
    }
  }, [user]);

  useEffect(() => {
    const checkForDefaultAgent = async () => {
      // Only proceed if we have a user and haven't checked yet
      if (authLoading || !user || hasCheckedRedirect || isCheckingAgent) {
        return;
      }

      // Only redirect from dashboard page
      if (pathname !== '/dashboard') {
        setHasCheckedRedirect(true);
        return;
      }

      setIsCheckingAgent(true);

      try {
        const supabase = createClient();

        // Get user's account ID from basejump schema
        const { data: accountData, error: accountError } = await supabase
          .schema('basejump')
          .from('accounts')
          .select('id')
          .eq('primary_owner_user_id', user.id)
          .eq('personal_account', true)
          .single();

        if (accountError || !accountData) {
          console.error('Error fetching account:', accountError);
          setHasCheckedRedirect(true);
          setIsCheckingAgent(false);
          return;
        }

        // Check if user has a default agent
        const { data: defaultAgent, error: agentError } = await supabase
          .from('agents')
          .select('agent_id')
          .eq('account_id', accountData.id)
          .eq('is_default', true)
          .single();

        if (agentError && agentError.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error('Error checking for default agent:', agentError);
          setHasCheckedRedirect(true);
          setIsCheckingAgent(false);
          return;
        }

        // If no default agent found, redirect to onboarding
        if (!defaultAgent) {
          console.log('No default agent found, redirecting to onboarding');
          router.push('/onboarding');
        }

        setHasCheckedRedirect(true);
      } catch (error) {
        console.error('Error in onboarding check:', error);
        setHasCheckedRedirect(true);
      } finally {
        setIsCheckingAgent(false);
      }
    };

    checkForDefaultAgent();
  }, [user, authLoading, pathname, hasCheckedRedirect, isCheckingAgent, router]);

  return <>{children}</>;
}

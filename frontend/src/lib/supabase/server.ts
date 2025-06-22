'use server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const createClient = async () => {
  const cookieStore = await cookies();
  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // Ensure the URL is in the proper format with http/https protocol
  if (supabaseUrl && !supabaseUrl.startsWith('http')) {
    // If it's just a hostname without protocol, add http://
    supabaseUrl = `http://${supabaseUrl}`;
  }

  // console.log('[SERVER] Supabase URL:', supabaseUrl);
  // console.log('[SERVER] Supabase Anon Key:', supabaseAnonKey);

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set({ name, value, ...options }),
          );
        } catch (error) {
          // The `set` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
};

/**
 * Check if a user is new (has no default agent) - server-side utility
 */
export const isNewUser = async (): Promise<boolean> => {
  try {
    const supabase = await createClient();

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return false; // If no user, they're not new, they're not authenticated
    }

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
      return false; // On error, assume not new to avoid redirect loops
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
      return false; // On error, assume not new to avoid redirect loops
    }

    // User is new if they have no default agent
    return !defaultAgent;
  } catch (error) {
    console.error('Error in isNewUser check:', error);
    return false; // On error, assume not new to avoid redirect loops
  }
};

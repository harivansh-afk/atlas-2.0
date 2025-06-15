// Environment mode types
export enum EnvMode {
  LOCAL = 'local',
  STAGING = 'staging',
  PRODUCTION = 'production',
}

// Subscription tier structure
export interface SubscriptionTierData {
  priceId: string;
  name: string;
}

// Subscription tiers structure
export interface SubscriptionTiers {
  FREE: SubscriptionTierData;
  PRO_75: SubscriptionTierData;
}

// Configuration object
interface Config {
  ENV_MODE: EnvMode;
  IS_LOCAL: boolean;
  SUBSCRIPTION_TIERS: SubscriptionTiers;
}

// Production tier IDs
const PROD_TIERS: SubscriptionTiers = {
  FREE: {
    priceId: 'free_tier',
    name: 'Free',
  },
  PRO_75: {
    priceId: 'price_1Ra0bGGKgx4qnTxJdHU2hODo', // Atlas AI Pro $75/month (PRODUCTION)
    name: 'Pro/$75',
  },
} as const;

// Staging tier IDs (REPLACE WITH YOUR STRIPE PRICE ID)
const STAGING_TIERS: SubscriptionTiers = {
  FREE: {
    priceId: 'free_tier',
    name: 'Free',
  },
  PRO_75: {
    priceId: 'price_1Ra3k9GKgx4qnTxJzhyzEBon', // Same test price ID for staging
    name: 'Pro/$75',
  },
} as const;

// Determine the environment mode from environment variables
const getEnvironmentMode = (): EnvMode => {
  // Get the environment mode from the environment variable, if set
  const envMode = process.env.NEXT_PUBLIC_ENV_MODE?.toLowerCase();

  // First check if the environment variable is explicitly set
  if (envMode) {
    if (envMode === EnvMode.LOCAL) {
      console.log('Using explicitly set LOCAL environment mode');
      return EnvMode.LOCAL;
    } else if (envMode === EnvMode.STAGING) {
      console.log('Using explicitly set STAGING environment mode');
      return EnvMode.STAGING;
    } else if (envMode === EnvMode.PRODUCTION) {
      console.log('Using explicitly set PRODUCTION environment mode');
      return EnvMode.PRODUCTION;
    }
  }

  // If no valid environment mode is set, fall back to defaults based on NODE_ENV
  if (process.env.NODE_ENV === 'development') {
    console.log('Defaulting to LOCAL environment mode in development');
    return EnvMode.LOCAL;
  } else {
    console.log('Defaulting to PRODUCTION environment mode');
    return EnvMode.PRODUCTION;
  }
};

// Get the environment mode once to ensure consistency
const currentEnvMode = getEnvironmentMode();

// Create the config object
export const config: Config = {
  ENV_MODE: currentEnvMode,
  IS_LOCAL: currentEnvMode === EnvMode.LOCAL,
  SUBSCRIPTION_TIERS:
    currentEnvMode === EnvMode.STAGING ? STAGING_TIERS : PROD_TIERS,
};

// Helper function to check if we're in local mode (for component conditionals)
export const isLocalMode = (): boolean => {
  return config.IS_LOCAL;
};

// Export subscription tier type for typing elsewhere
export type SubscriptionTier = keyof typeof PROD_TIERS;

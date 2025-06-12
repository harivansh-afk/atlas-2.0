import { extractToolData, normalizeContentToString } from '../utils';

// Types for Clado API responses
export interface CladoProfile {
  id?: string;
  name?: string;
  location?: string;
  headline?: string;
  description?: string;
  title?: string;
  profile_picture_url?: string;
  linkedin_url?: string;
  twitter_handle?: string;
  websites?: Array<{ url: string }>;
  criteria?: Record<string, string>;
}

export interface CladoExperience {
  title?: string;
  company_name?: string;
  start_date?: string;
  end_date?: string;
  description?: string;
  location?: string;
  company_logo?: string;
}

export interface CladoEducation {
  degree?: string;
  field_of_study?: string;
  school_name?: string;
  school_logo?: string;
  start_date?: string;
  end_date?: string;
  description?: string;
}

export interface CladoContact {
  type?: string;
  value?: string;
  confidence?: number;
}

export interface CladoSocialMedia {
  platform?: string;
  url?: string;
  username?: string;
}

export interface CladoUserResult {
  profile?: CladoProfile;
  experience?: CladoExperience[];
  education?: CladoEducation[];
  languages?: string[];
}

export interface CladoCompanyResult {
  id?: string;
  name?: string;
  description?: string;
  website?: string;
  industry?: string;
  size?: string;
  location?: string;
  logo_url?: string;
  linkedin_url?: string;
}

export interface CladoReaction {
  type?: string;
  user?: {
    name?: string;
    headline?: string;
    profile_url?: string;
    profile_picture?: string;
  };
}

export interface CladoDeepResearchJob {
  job_id?: string;
  status?: string;
  message?: string;
  query?: string;
  results?: CladoUserResult[];
  total?: number;
  enrichment_stats?: Record<string, any>;
}

// Utility to parse Clado tool responses
export function extractCladoData(
  assistantContent: any,
  toolContent: any,
  isSuccess: boolean,
  toolTimestamp?: string,
  assistantTimestamp?: string
): {
  toolName: string | null;
  query: string | null;
  results: any;
  cost: string | null;
  status: string | null;
  totalResults: number | null;
  jobId: string | null;
  actualIsSuccess: boolean;
  actualToolTimestamp?: string;
  actualAssistantTimestamp?: string;
} {
  const toolName: string | null = null;
  let query: string | null = null;
  let results: any = null;
  let cost: string | null = null;
  let status: string | null = null;
  let totalResults: number | null = null;
  let jobId: string | null = null;
  let actualIsSuccess = isSuccess;
  let actualToolTimestamp = toolTimestamp;
  const actualAssistantTimestamp = assistantTimestamp;

  const parseContent = (content: any) => {
    if (!content) return null;

    // First, try to extract via standard tool parser
    const { toolResult } = extractToolData(content);

    if (toolResult) {
      // If toolOutput exists, attempt to parse it for Clado data
      const outputStr = normalizeContentToString(toolResult.toolOutput);
      if (outputStr) {
        try {
          const parsedOutput = JSON.parse(outputStr);
          // Return the parsed output with tool metadata
          return {
            ...parsedOutput,
            _toolResult: toolResult // Keep reference to original tool result
          };
        } catch {
          // non-JSON output; return as string for display
          return { raw: outputStr, _toolResult: toolResult };
        }
      }
      return toolResult; // fallback to raw toolResult
    }

    // Fallback: attempt JSON.parse on string
    const contentStr = normalizeContentToString(content);
    try {
      return JSON.parse(contentStr);
    } catch {
      // Fallback: return raw string so UI can display it
      return contentStr;
    }
  };

  const parsedAssistant = parseContent(assistantContent);
  const parsedTool = parseContent(toolContent);

  // Extract arguments for fallback (query etc.)
  const { arguments: assistantArgs } = extractToolData(assistantContent || {});

  const merged: any = parsedTool || parsedAssistant;
  if (merged && typeof merged === 'object') {
    // Determine query
    query = merged.query ?? merged.input ?? assistantArgs?.query ?? query;

    // Determine results based on endpoint type and data structure
    if (merged.results) {
      results = merged.results;
      totalResults = merged.total_results ?? merged.total ?? (Array.isArray(merged.results) ? merged.results.length : null);
    } else if (merged.profile_data) {
      results = merged.profile_data;
    } else if (merged.contacts) {
      results = { contacts: merged.contacts, social_media: merged.social_media };
    } else if (merged.data) {
      results = merged.data;
    } else if (merged.reactions) {
      results = merged.reactions;
      totalResults = merged.pagination?.total_reactions ?? null;
    } else if (merged.profile) {
      // Handle direct profile data (for enrichment/scraping results)
      results = merged;
    } else if (merged.experience || merged.education) {
      // Handle profile data that's at the root level
      results = merged;
    }

    // Extract job information for deep research
    jobId = merged.job_id ?? jobId;

    // Determine cost - look for credit usage patterns
    if (typeof merged.cost === 'string') {
      const costCandidate = merged.cost.trim();
      // Accept if it contains "credit" or "used" or looks like a number followed by "credit"
      if (/credit/i.test(costCandidate) || /used/i.test(costCandidate) || /^\d+\s*(credit|used)/i.test(costCandidate)) {
        cost = costCandidate;
      }
      // Also accept if it's just a number (fallback)
      else if (/^\d+$/.test(costCandidate)) {
        cost = `${costCandidate} credits used`;
      }
      // Reject if it looks like an endpoint path
      else if (!costCandidate.includes('/') && !costCandidate.includes('endpoint')) {
        cost = costCandidate;
      }
    }
    // Also check for numeric cost
    else if (typeof merged.cost === 'number') {
      cost = `${merged.cost} credits used`;
    }

    // Status and success flags
    status = merged.status ?? merged.state ?? status;
    if (typeof merged.success === 'boolean') actualIsSuccess = merged.success;
    if (merged.timestamp) actualToolTimestamp = merged.timestamp;
  }

  // Additional fallback: check if we have tool result but no cost extracted
  if (!cost && toolContent) {
    const { toolResult } = extractToolData(toolContent);
    if (toolResult && toolResult.toolOutput) {
      try {
        const outputStr = normalizeContentToString(toolResult.toolOutput);
        const parsed = JSON.parse(outputStr);
        if (parsed && typeof parsed.cost === 'string') {
          const costCandidate = parsed.cost.trim();
          // Accept if it contains "credit" or "used" or looks like a number followed by "credit"
          if (/credit/i.test(costCandidate) || /used/i.test(costCandidate) || /^\d+\s*(credit|used)/i.test(costCandidate)) {
            cost = costCandidate;
          }
          // Also accept if it's just a number (fallback)
          else if (/^\d+$/.test(costCandidate)) {
            cost = `${costCandidate} credits used`;
          }
          // Reject if it looks like an endpoint path
          else if (!costCandidate.includes('/') && !costCandidate.includes('endpoint')) {
            cost = costCandidate;
          }
        }
        // Also check for numeric cost
        else if (parsed && typeof parsed.cost === 'number') {
          cost = `${parsed.cost} credits used`;
        }
      } catch {
        // Ignore parsing errors
      }
    }
  }

  // Final fallback: check if cost is in the _toolResult metadata
  if (!cost && merged && merged._toolResult) {
    const toolResult = merged._toolResult;
    if (toolResult.cost) {
      cost = toolResult.cost;
    }
  }

  // Debug logging for cost extraction issues (only when cost is problematic)
  if (process.env.NODE_ENV === 'development' && cost && (cost.includes('endpoint') || cost.includes('/'))) {
    console.warn('Clado Cost Extraction Issue:', {
      extractedCost: cost,
      mergedCost: merged?.cost,
      mergedCostType: typeof merged?.cost,
      toolResultCost: merged?._toolResult?.cost,
      allMergedKeys: merged ? Object.keys(merged) : null
    });
  }

  return {
    toolName,
    query,
    results,
    cost,
    status,
    totalResults,
    jobId,
    actualIsSuccess,
    actualToolTimestamp,
    actualAssistantTimestamp,
  };
}

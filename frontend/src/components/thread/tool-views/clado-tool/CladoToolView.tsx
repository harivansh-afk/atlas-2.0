import React, { useMemo } from 'react';
import {
  CheckCircle,
  AlertTriangle,
  Users,
  Building2,
  Clock,
  Loader2,
  Database,
  User,
  Mail,
  Eye,
  Heart,
  Search,
  TrendingUp,
  FileText,
} from 'lucide-react';
import { TbDeviceDesktopSearch } from 'react-icons/tb';
import { ToolViewProps } from '../types';
import { formatTimestamp } from '../utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { extractCladoData } from './_utils';
import { CladoResultRenderer } from './CladoResultRenderer';



// Helper function to get endpoint-specific icon
function getEndpointIcon(toolName: string | null) {
  switch (toolName) {
    case 'search_linkedin_users':
      return Users;
    case 'search_linkedin_companies':
      return Building2;
    case 'enrich_linkedin_profile':
      return User;
    case 'get_linkedin_contacts':
      return Mail;
    case 'scrape_linkedin_profile':
      return Eye;
    case 'get_linkedin_post_reactions':
      return Heart;
    case 'start_deep_research':
      return Database;
    case 'get_deep_research_status':
      return Clock;
    default:
      return TbDeviceDesktopSearch;
  }
}

// Helper function to get endpoint display name
function getEndpointDisplayName(toolName: string | null): string {
  switch (toolName) {
    case 'search_linkedin_users':
      return 'User Search';
    case 'search_linkedin_companies':
      return 'Company Search';
    case 'enrich_linkedin_profile':
      return 'Profile Enrichment';
    case 'get_linkedin_contacts':
      return 'Contact Retrieval';
    case 'scrape_linkedin_profile':
      return 'Profile Scraping';
    case 'get_linkedin_post_reactions':
      return 'Post Reactions';
    case 'start_deep_research':
      return 'Deep Research';
    case 'get_deep_research_status':
      return 'Research Status';
    default:
      return 'Find Anyone';
  }
}







export function CladoToolView({
  name = 'clado-tool',
  assistantContent,
  toolContent,
  assistantTimestamp,
  toolTimestamp,
  isSuccess = true,
  isStreaming = false,
}: ToolViewProps) {
  // Use helper to parse Clado responses
  const cladoData = useMemo(() =>
    extractCladoData(
      assistantContent,
      toolContent,
      isSuccess,
      toolTimestamp,
      assistantTimestamp,
    ),
  [assistantContent, toolContent, isSuccess, toolTimestamp, assistantTimestamp]);

  const {
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
  } = cladoData;

  const displayTimestamp = actualToolTimestamp || actualAssistantTimestamp;
  const endpointIcon = getEndpointIcon(toolName);
  const endpointName = getEndpointDisplayName(toolName);

  // Render results using unified component
  const renderResults = () => {
    return <CladoResultRenderer results={results} totalResults={totalResults} toolName={toolName} />;
  };

  return (
    <Card className="gap-0 flex border shadow-none border-t border-b-0 border-x-0 p-0 rounded-none flex-col h-full overflow-hidden bg-white dark:bg-zinc-950">
      {/* Header */}
      <CardHeader className="h-14 bg-zinc-50/80 dark:bg-zinc-900/80 backdrop-blur-sm border-b p-2 px-4 space-y-2">
        <div className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/20">
              {React.createElement(endpointIcon, { className: 'w-5 h-5 text-purple-500 dark:text-purple-400' })}
            </div>
            <div>
              <CardTitle className="text-base font-medium text-zinc-900 dark:text-zinc-100">
                {endpointName}
              </CardTitle>
              {toolName && toolName !== name && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                  {toolName}
                </p>
              )}
            </div>
          </div>
          {!isStreaming && (
            <Badge
              variant="secondary"
              className={cn(
                'text-xs font-medium',
                actualIsSuccess
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800',
              )}
            >
              {actualIsSuccess ? (
                <CheckCircle className="h-3 w-3 mr-1" />
              ) : (
                <AlertTriangle className="h-3 w-3 mr-1" />
              )}
              {actualIsSuccess ? 'Success' : 'Failed'}
            </Badge>
          )}
        </div>
      </CardHeader>

      {/* Body */}
      <CardContent className="p-0 h-full flex-1 overflow-hidden relative flex flex-col">
        {isStreaming ? (
          <div className="flex flex-col items-center justify-center h-full py-8 px-6">
            <div className="text-center w-full max-w-xs">
              <div className="w-16 h-16 rounded-xl mx-auto mb-4 flex items-center justify-center bg-purple-100 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500 dark:text-purple-400" />
              </div>
              <h3 className="text-base font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                Processing LinkedIn research...
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {query ? `Searching: ${query}` : 'Executing Clado operation'}
              </p>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col overflow-hidden">
            {/* Fixed header section with query, status, cost */}
            <div className="flex-shrink-0 p-4 space-y-4 border-b border-zinc-200 dark:border-zinc-800">
              {/* Query */}
              {query && (
                <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center gap-2 mb-1">
                    <Search className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Query</span>
                  </div>
                  <p className="text-sm text-zinc-800 dark:text-zinc-200">{query}</p>
                </div>
              )}

              {/* Status and Cost */}
              {(status || cost || jobId) && (
                <div className="flex flex-wrap gap-3">
                  {status && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        status === 'completed' && "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300",
                        status === 'processing' && "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300",
                        status === 'pending' && "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300",
                        status === 'error' && "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300"
                      )}
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      {status}
                    </Badge>
                  )}
                  {cost && (
                    <Badge variant="outline" className="text-xs">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {cost}
                    </Badge>
                  )}
                  {jobId && (
                    <Badge variant="outline" className="text-xs font-mono">
                      <FileText className="h-3 w-3 mr-1" />
                      {jobId}
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* Scrollable results section */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* Results */}
              {renderResults()}

              {/* No results message */}
              {!results && !isStreaming && actualIsSuccess && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center mb-3">
                    <Search className="h-6 w-6 text-zinc-400" />
                  </div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    No results found for this query
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>

      {/* Footer */}
      <div className="px-4 py-2 h-10 bg-zinc-50/50 dark:bg-zinc-900/50 backdrop-blur-sm border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center gap-4">
        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          {endpointName !== 'Find Anyone' && (
            <Badge variant="outline" className="h-6 py-0.5 text-xs">
              <TbDeviceDesktopSearch className="h-3 w-3 mr-1" />
              Find Anyone
            </Badge>
          )}
        </div>
        <div className="text-xs text-zinc-500 dark:text-zinc-400">
          {displayTimestamp ? formatTimestamp(displayTimestamp) : ''}
        </div>
      </div>
    </Card>
  );
}

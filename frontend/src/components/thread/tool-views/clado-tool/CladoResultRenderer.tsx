import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Users,
  Building2,
  MapPin,
  Briefcase,
  GraduationCap,
  Mail,
  Phone,
  Globe,
  Calendar,
  ExternalLink,
  User,
  Heart,
  ThumbsUp,
  Star,
  Database,
  Clock
} from 'lucide-react';

interface CladoResultRendererProps {
  results: any;
  totalResults?: number | null;
  toolName?: string;
}

export const CladoResultRenderer: React.FC<CladoResultRendererProps> = ({
  results,
  totalResults,
  toolName
}) => {
  if (!results) return null;

  // Helper function to format dates
  const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr === '1970-01-01T00:00:00.000Z') return 'Present';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short'
      });
    } catch {
      return dateStr;
    }
  };

  // Helper function to render a single profile
  const renderProfile = (profileData: any, isListItem = false) => {
    const CardWrapper = isListItem ? 'div' : Card;
    const ContentWrapper = isListItem ? 'div' : CardContent;

    // Handle nested profile structure or direct profile data
    const profile = profileData.profile || profileData;
    const experience = profileData.experience || [];
    const education = profileData.education || [];

    return (
      <CardWrapper className={isListItem ? 'border rounded-lg p-4 bg-white dark:bg-zinc-900' : ''}>
        <ContentWrapper className={isListItem ? '' : 'p-4'}>
          <div className="space-y-4">
            {/* Basic Info */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">
                  {profile.name || 'Unknown'}
                </h3>
                {profile.headline && (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                    {profile.headline}
                  </p>
                )}
                {profile.location && (
                  <div className="flex items-center gap-1 mt-2 text-sm text-zinc-500">
                    <MapPin className="h-3 w-3" />
                    {profile.location}
                  </div>
                )}
              </div>
              {profile.linkedin_url && (
                <a
                  href={profile.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>

            {/* Experience */}
            {experience && experience.length > 0 && (
              <div>
                <h4 className="font-medium text-sm text-zinc-700 dark:text-zinc-300 flex items-center gap-2 mb-2">
                  <Briefcase className="h-4 w-4" />
                  Experience
                </h4>
                <div className="space-y-2">
                  {experience.slice(0, 3).map((exp: any, idx: number) => (
                    <div key={idx} className="text-sm">
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">
                        {exp.title}
                      </div>
                      <div className="text-zinc-600 dark:text-zinc-400">
                        {exp.company_name}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {formatDate(exp.start_date)} - {formatDate(exp.end_date)}
                      </div>
                    </div>
                  ))}
                  {experience.length > 3 && (
                    <div className="text-xs text-zinc-500">
                      +{experience.length - 3} more positions
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Education */}
            {education && education.length > 0 && (
              <div>
                <h4 className="font-medium text-sm text-zinc-700 dark:text-zinc-300 flex items-center gap-2 mb-2">
                  <GraduationCap className="h-4 w-4" />
                  Education
                </h4>
                <div className="space-y-2">
                  {education.slice(0, 2).map((edu: any, idx: number) => (
                    <div key={idx} className="text-sm">
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">
                        {edu.school}
                      </div>
                      {edu.degree && (
                        <div className="text-zinc-600 dark:text-zinc-400">
                          {edu.degree}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ContentWrapper>
      </CardWrapper>
    );
  };

  // Helper function to render a company
  const renderCompany = (company: any, isListItem = false) => {
    const CardWrapper = isListItem ? 'div' : Card;
    const ContentWrapper = isListItem ? 'div' : CardContent;

    return (
      <CardWrapper className={isListItem ? 'border rounded-lg p-4 bg-white dark:bg-zinc-900' : ''}>
        <ContentWrapper className={isListItem ? '' : 'p-4'}>
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">
                  {company.name || company.company_name || 'Unknown Company'}
                </h3>
                {company.industry && (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                    {company.industry}
                  </p>
                )}
                {company.location && (
                  <div className="flex items-center gap-1 mt-2 text-sm text-zinc-500">
                    <MapPin className="h-3 w-3" />
                    {company.location}
                  </div>
                )}
              </div>
              {company.linkedin_url && (
                <a
                  href={company.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>

            {company.description && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-3">
                {company.description}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              {company.employee_count && (
                <Badge variant="outline" className="text-xs">
                  {company.employee_count} employees
                </Badge>
              )}
              {company.founded_year && (
                <Badge variant="outline" className="text-xs">
                  Founded {company.founded_year}
                </Badge>
              )}
            </div>
          </div>
        </ContentWrapper>
      </CardWrapper>
    );
  };

  // Helper function to render contact info
  const renderContactInfo = (contacts: any, socialMedia?: any) => {
    return (
      <Card>
        <CardContent className="p-4">
          <h4 className="font-medium text-sm text-zinc-700 dark:text-zinc-300 flex items-center gap-2 mb-3">
            <Mail className="h-4 w-4" />
            Contact Information
          </h4>
          <div className="space-y-2">
            {contacts.emails && contacts.emails.length > 0 && (
              <div>
                <div className="text-xs text-zinc-500 mb-1">Emails</div>
                {contacts.emails.map((email: string, idx: number) => (
                  <div key={idx} className="text-sm text-zinc-900 dark:text-zinc-100">
                    {email}
                  </div>
                ))}
              </div>
            )}
            {contacts.phones && contacts.phones.length > 0 && (
              <div>
                <div className="text-xs text-zinc-500 mb-1">Phones</div>
                {contacts.phones.map((phone: string, idx: number) => (
                  <div key={idx} className="text-sm text-zinc-900 dark:text-zinc-100">
                    {phone}
                  </div>
                ))}
              </div>
            )}
            {socialMedia && Object.keys(socialMedia).length > 0 && (
              <div>
                <div className="text-xs text-zinc-500 mb-1">Social Media</div>
                {Object.entries(socialMedia).map(([platform, url]: [string, any]) => (
                  <div key={platform} className="text-sm">
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 flex items-center gap-1"
                    >
                      <Globe className="h-3 w-3" />
                      {platform}
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Main rendering logic
  // Check if it's an array of user profiles
  if (Array.isArray(results) && results.length > 0 && (results[0]?.profile || results[0]?.name || results[0]?.headline)) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
            <Users className="h-4 w-4" />
            User Results
          </h4>
          {totalResults && (
            <Badge variant="outline" className="text-xs">
              {totalResults} total
            </Badge>
          )}
        </div>
        <div className="space-y-3">
          {results.map((user: any, idx: number) => (
            <div key={idx}>
              {renderProfile(user, true)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Check if it's an array of companies
  if (Array.isArray(results) && results.length > 0 && (results[0]?.company_name || (results[0]?.name && !results[0]?.profile && !results[0]?.headline))) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Company Results
          </h4>
          {totalResults && (
            <Badge variant="outline" className="text-xs">
              {totalResults} total
            </Badge>
          )}
        </div>
        <div className="space-y-3">
          {results.map((company: any, idx: number) => (
            <div key={idx}>
              {renderCompany(company, true)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Check if it's a single profile (enrichment/scraping result)
  // This handles cases where the profile data is nested or at root level
  if (typeof results === 'object' && !Array.isArray(results) &&
      (results.profile || results.experience || results.education || results.name || results.headline || results.id)) {
    return (
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
          <User className="h-4 w-4" />
          Profile Information
        </h4>
        {renderProfile(results)}
      </div>
    );
  }

  // Check if it's contact information
  if (typeof results === 'object' && !Array.isArray(results) && results.contacts) {
    return renderContactInfo(results.contacts, results.social_media);
  }

  // Check if it's post reactions (array of reactions)
  if (Array.isArray(results) && results.length > 0 && results[0]?.type && results[0]?.user) {
    return (
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
          <Heart className="h-4 w-4" />
          Post Reactions
        </h4>
        <div className="space-y-2">
          {results.map((reaction: any, idx: number) => (
            <div key={idx} className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                {reaction.type === 'LIKE' && <ThumbsUp className="h-4 w-4 text-blue-500" />}
                {reaction.type === 'LOVE' && <Heart className="h-4 w-4 text-red-500" />}
                {reaction.type === 'CELEBRATE' && <Star className="h-4 w-4 text-yellow-500" />}
                {reaction.type === 'SUPPORT' && <Heart className="h-4 w-4 text-green-500" />}
                {reaction.type === 'INSIGHTFUL' && <Star className="h-4 w-4 text-purple-500" />}
                {reaction.type === 'FUNNY' && <Star className="h-4 w-4 text-orange-500" />}
                <span className="text-xs text-zinc-500 capitalize">{reaction.type.toLowerCase()}</span>
              </div>
              {reaction.user && (
                <div className="flex-1">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {reaction.user.name}
                  </p>
                  {reaction.user.headline && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                      {reaction.user.headline}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Check if it's deep research job status
  if (typeof results === 'object' && !Array.isArray(results) && (results.job_id || results.status)) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
              <Database className="h-4 w-4" />
              Research Job Status
            </span>
            <Badge
              variant="outline"
              className={`text-xs ${
                results.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300' :
                results.status === 'processing' ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300' :
                results.status === 'pending' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300' :
                'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300'
              }`}
            >
              <Clock className="h-3 w-3 mr-1" />
              {results.status}
            </Badge>
          </div>
          {results.job_id && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono mb-1">
              Job ID: {results.job_id}
            </p>
          )}
          {results.query && (
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Query: {results.query}
            </p>
          )}
        </div>

        {results.results && Array.isArray(results.results) && results.results.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Research Results
              </h4>
              <Badge variant="outline" className="text-xs">
                {results.total || results.results.length} results
              </Badge>
            </div>
            <div className="space-y-3">
              {results.results.map((user: any, idx: number) => (
                <div key={idx}>
                  {renderProfile(user, true)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Check if it's a simple job start response
  if (typeof results === 'object' && !Array.isArray(results) && results.message && results.message.includes('started')) {
    return (
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-2 mb-2">
          <Database className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
            Deep Research Started
          </span>
        </div>
        <p className="text-xs text-blue-600 dark:text-blue-400">
          {results.message}
        </p>
        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
          Use get_deep_research_status to check progress
        </p>
      </div>
    );
  }

  // Fallback for any other structured data
  if (typeof results === 'object') {
    return (
      <Card>
        <CardContent className="p-4">
          <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
            Results
          </h4>
          <div className="max-h-96 overflow-y-auto border rounded-md p-3 bg-zinc-50 dark:bg-zinc-900">
            <pre className="text-xs text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
};

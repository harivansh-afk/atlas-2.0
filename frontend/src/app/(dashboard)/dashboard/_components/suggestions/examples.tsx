'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  RefreshCw,
  Search,
} from 'lucide-react';
import {
  SiGmail, SiNotion, SiLinear, SiHubspot, SiFigma, SiClickup, SiGooglesheets, SiGoogledocs
} from 'react-icons/si';
import { FaMicrosoft, FaTwitter } from 'react-icons/fa';

type PromptExample = {
  title: string;
  query: string;
  integrations?: string[];
};

// Integration icon mapping
const integrationIcons: Record<string, React.ComponentType<any>> = {
  'gmail.com': SiGmail,
  'google.com': SiGooglesheets, // Default to Sheets for google.com
  'googledocs.com': SiGoogledocs,
  'notion.so': SiNotion,
  'linear.app': SiLinear,
  'hubspot.com': SiHubspot,
  'twitter.com': FaTwitter,
  'figma.com': SiFigma,
  'clickup.com': SiClickup,
  'apollo.io': Search, // Using Search icon as fallback for Apollo
  'microsoft.com': FaMicrosoft,
};

const allPrompts: PromptExample[] = [
  // Sales & Marketing Automation
  {
    title: 'End-to-End Lead Generation Pipeline',
    query: 'Find 20 VP Marketing contacts at Series A SaaS companies, enrich their data with Apollo, create a tracking sheet in Google Sheets, and draft personalized cold emails using our Notion messaging templates.',
    integrations: ['apollo.io', 'google.com', 'notion.so', 'gmail.com'],
  },
  {
    title: 'Social Media Intelligence & Response',
    query: 'Monitor Twitter mentions of our competitors, summarize sentiment in a Notion page, and draft response tweets for our brand account.',
    integrations: ['twitter.com', 'notion.so'],
  },
  {
    title: 'HubSpot Sales Sequence Automation',
    query: 'When a new lead fills out our contact form, create a HubSpot contact, add them to our nurture sequence, and notify the sales team via Gmail with their enriched profile.',
    integrations: ['hubspot.com', 'apollo.io', 'gmail.com', 'linear.app'],
  },

  // Product & Project Management
  {
    title: 'Cross-Platform Project Sync',
    query: 'Sync our Linear sprint progress with ClickUp tasks, update our product roadmap in Notion, and send a weekly status email to stakeholders.',
    integrations: ['linear.app', 'clickup.com', 'notion.so', 'google.com', 'gmail.com'],
  },
  {
    title: 'Design-to-Development Handoff',
    query: 'When a Figma design is marked "Ready for Dev", create Linear tickets with design specs, update our Notion design system, and notify the engineering team.',
    integrations: ['figma.com', 'linear.app', 'notion.so'],
  },
  {
    title: 'Customer Feedback Analysis',
    query: 'Analyze all HubSpot support tickets tagged "feature request" from this month, identify patterns, and create prioritized Linear epics with supporting data.',
    integrations: ['hubspot.com', 'notion.so', 'linear.app', 'google.com'],
  },

  // Operations & Productivity
  {
    title: 'Meeting Intelligence & Follow-up',
    query: 'Summarize today\'s product meeting notes from Notion, create action items in Linear, and send follow-up emails to all attendees with their specific tasks.',

    integrations: ['notion.so', 'linear.app', 'gmail.com', 'google.com'],
  },
  {
    title: 'Vendor Research & Procurement',
    query: 'Research top 5 customer support tools, compare pricing and features in a Google Sheet, create evaluation criteria in Notion, and schedule demos via Gmail.',

    integrations: ['google.com', 'notion.so', 'gmail.com', 'linear.app'],
  },

  {
    title: 'Financial Reporting & Analysis',
    query: 'Pull Q3 sales data from HubSpot, create financial projections in Excel, update our board deck in Google Docs, and send summary to investors.',

    integrations: ['hubspot.com', 'microsoft.com', 'google.com', 'gmail.com'],
  },

  // Advanced Multi-Platform Workflows
  {
    title: 'Customer Success Automation',
    query: 'When a HubSpot deal closes, create onboarding tasks in ClickUp, add customer to our success tracking sheet, send welcome sequence via Gmail, and create success metrics dashboard in Notion.',
    integrations: ['hubspot.com', 'clickup.com', 'google.com', 'gmail.com', 'notion.so', 'linear.app'],
  },
  {
    title: 'Content Marketing & SEO Automation',
    query: 'Research trending topics in our industry, create content calendar in Notion, draft blog outlines in Google Docs, and schedule social promotion tweets.',
    integrations: ['notion.so', 'google.com', 'linear.app', 'twitter.com'],
  },
  {
    title: 'Competitive Intelligence & Analysis',
    query: 'Monitor competitor product updates, pricing changes, and social media activity. Compile insights in Notion, update our positioning doc, and alert the strategy team.',
    integrations: ['notion.so', 'google.com', 'gmail.com'],
  },

  // Technical & Development Support
  {
    title: 'Bug Triage & Development Workflow',
    query: 'When a critical bug is reported in HubSpot, create a Linear ticket, notify the dev team via Gmail, update our status page in Notion, and track resolution progress.',
    integrations: ['hubspot.com', 'linear.app', 'gmail.com', 'notion.so'],
  },
  {
    title: 'Documentation & Knowledge Management',
    query: 'When new features are deployed, update our help docs in Notion, create training materials in Google Docs, and notify the support team with change summaries.',
    integrations: ['linear.app', 'notion.so', 'google.com', 'gmail.com'],
  },
];

// Function to get random prompts
const getRandomPrompts = (count: number = 9): PromptExample[] => {
  const shuffled = [...allPrompts].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Individual card component with smooth animations
const ExampleCard = ({
  prompt,
  index,
  onSelectPrompt
}: {
  prompt: PromptExample;
  index: number;
  onSelectPrompt?: (query: string) => void;
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(cardRef, {
    once: true,
    margin: "0px 0px -20% 0px"
  });

  // Helper function to get a snippet from the query
  const getQuerySnippet = (query: string, maxLength: number = 120) => {
    if (query.length <= maxLength) return query;
    const truncated = query.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{
        opacity: 0,
        y: 20,
        scale: 0.95
      }}
      animate={isInView ? {
        opacity: 1,
        y: 0,
        scale: 1
      } : {
        opacity: 0,
        y: 20,
        scale: 0.95
      }}
      transition={{
        duration: 0.4,
        delay: index * 0.1,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      whileHover={{
        scale: 1.02,
        y: -3,
        transition: { duration: 0.2, ease: "easeOut" }
      }}
    >
      <Card
        className="cursor-pointer h-full bg-muted/50 dark:bg-muted/30 border border-border min-h-[100px] transition-shadow duration-300 hover:shadow-lg"
        onClick={() => onSelectPrompt && onSelectPrompt(prompt.query)}
      >
        <CardContent className="px-3 py-2 h-full flex flex-col justify-between">
          {/* Quote snippet at the top */}
          <div className="mb-1.5">
            <blockquote className="text-sm text-muted-foreground italic leading-relaxed">
              "{getQuerySnippet(prompt.query)}"
            </blockquote>
          </div>

          <div className="space-y-1.5">
            {/* Title only */}
            <CardTitle className="font-semibold text-foreground text-sm leading-tight">
              {prompt.title}
            </CardTitle>

            {/* Integration icons tray - larger size */}
            {prompt.integrations && prompt.integrations.length > 0 && (
              <div className="flex items-center">
                {prompt.integrations.slice(0, 5).map((integration, idx) => {
                  const IconComponent = integrationIcons[integration] || Search;
                  return (
                    <div
                      key={integration}
                      className="relative flex items-center justify-center bg-background border border-border rounded-full shadow-sm"
                      style={{
                        height: 28,
                        width: 28,
                        marginLeft: idx > 0 ? '-8px' : '0',
                        zIndex: prompt.integrations!.length - idx,
                      }}
                    >
                      <IconComponent className="text-muted-foreground" size={16} />
                    </div>
                  );
                })}
                {prompt.integrations.length > 5 && (
                  <div
                    className="flex items-center justify-center bg-muted border border-border rounded-full text-xs text-muted-foreground font-medium shadow-sm"
                    style={{
                      height: 28,
                      width: 28,
                      marginLeft: '-8px',
                      zIndex: 0,
                    }}
                  >
                    +{prompt.integrations.length - 5}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export const Examples = ({
  onSelectPrompt,
}: {
  onSelectPrompt?: (query: string) => void;
}) => {
  const [displayedPrompts, setDisplayedPrompts] = useState<PromptExample[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Initialize with random prompts on mount
  useEffect(() => {
    setDisplayedPrompts(getRandomPrompts(9));
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setDisplayedPrompts(getRandomPrompts(9));
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <span className="text-lg text-foreground font-medium">Atlas Agent Workflows</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          className="h-8 px-3 text-sm text-muted-foreground hover:text-foreground"
        >
          <motion.div
            animate={{ rotate: isRefreshing ? 360 : 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            <RefreshCw size={14} />
          </motion.div>
          <span className="ml-2">Refresh</span>
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {displayedPrompts.map((prompt, index) => (
          <ExampleCard
            key={`${prompt.title}-${index}-${isRefreshing}`}
            prompt={prompt}
            index={index}
            onSelectPrompt={onSelectPrompt}
          />
        ))}
      </div>
    </div>
  );
};

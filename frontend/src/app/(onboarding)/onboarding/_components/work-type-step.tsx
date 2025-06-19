'use client';

import { Card } from '@/components/ui/card';
import { ProgressIndicator } from './progress-indicator';

interface WorkTypeStepProps {
  onNext: (workType: string) => void;
}

// Use cases organized by category
const workCategories = {
  ops: {
    title: 'Operations',
    icon: '⚡',
    useCases: [
      'Cross-Platform Project Sync',
      'Meeting Intelligence & Follow-up',
      'Vendor Research & Procurement',
      'Financial Reporting & Analysis',
      'Bug Triage & Development Workflow',
      'Documentation & Knowledge Management'
    ]
  },
  gtm: {
    title: 'Go-to-Market',
    icon: '🚀',
    useCases: [
      'End-to-End Lead Generation Pipeline',
      'HubSpot Sales Sequence Automation',
      'Customer Success Automation',
      'Content Marketing & SEO Automation',
      'Competitive Intelligence & Analysis'
    ]
  },
  comms: {
    title: 'Communications',
    icon: '💬',
    useCases: [
      'Social Media Intelligence & Response',
      'Customer Feedback Analysis',
      'Meeting Notes & Action Items',
      'Team Notification Automation',
      'Support Ticket Management'
    ]
  },
  administrative: {
    title: 'Administrative',
    icon: '📋',
    useCases: [
      'Design-to-Development Handoff',
      'Automated Reporting & Dashboards',
      'Compliance & Documentation',
      'Resource Planning & Allocation',
      'Process Optimization'
    ]
  }
};

export function WorkTypeStep({ onNext }: WorkTypeStepProps) {
  const handleCategoryClick = (categoryKey: string) => {
    const categoryTitle = workCategories[categoryKey as keyof typeof workCategories].title;
    onNext(categoryTitle);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-background">
      {/* Progress Indicator */}
      <div className="absolute top-8 left-8">
        <ProgressIndicator currentStep={2} totalSteps={2} />
      </div>

      {/* Main Content */}
      <div className="w-full max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold">
            What kind of work do you wanna <span className="text-primary">automate</span>?
          </h1>
          <p className="text-lg text-muted-foreground">
            Choose a category to get started
          </p>
        </div>

        {/* Category Selection - Vertical Stack */}
        <div className="max-w-2xl mx-auto space-y-4">
          {Object.entries(workCategories).map(([key, category]) => (
            <Card
              key={key}
              className="p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border-2 border-border hover:border-primary/50"
              onClick={() => handleCategoryClick(key)}
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                  <span className="text-2xl">{category.icon}</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{category.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {category.useCases.length} use cases
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-32 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
      </div>
    </div>
  );
}

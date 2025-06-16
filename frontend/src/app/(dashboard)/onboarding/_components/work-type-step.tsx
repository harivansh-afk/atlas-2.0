'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ProgressIndicator } from './progress-indicator';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkTypeStepProps {
  onNext: () => void;
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
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleCategoryClick = (categoryKey: string) => {
    if (expandedCategory === categoryKey) {
      setExpandedCategory(null);
    } else {
      setExpandedCategory(categoryKey);
      setSelectedCategory(categoryKey);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-background">
      {/* Progress Indicator */}
      <div className="absolute top-8 left-8">
        <ProgressIndicator currentStep={2} totalSteps={2} />
      </div>

      {/* Main Content */}
      <div className="w-full max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold">
            What kind of work do you wanna <span className="text-primary">automate</span>?
          </h1>
          <p className="text-lg text-muted-foreground">
            Choose a category to see example use cases
          </p>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(workCategories).map(([key, category]) => (
            <Card 
              key={key}
              className={cn(
                "p-6 cursor-pointer transition-all duration-200 hover:shadow-lg border-2",
                selectedCategory === key ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              )}
              onClick={() => handleCategoryClick(key)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{category.icon}</span>
                  <h3 className="text-xl font-semibold">{category.title}</h3>
                </div>
                {expandedCategory === key ? (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                )}
              </div>

              {/* Expanded Use Cases */}
              {expandedCategory === key && (
                <div className="mt-4 space-y-2 animate-in slide-in-from-top-2 duration-200">
                  {category.useCases.map((useCase, index) => (
                    <div 
                      key={index}
                      className="p-3 rounded-lg bg-muted/50 text-sm font-medium text-muted-foreground hover:bg-muted/80 transition-colors"
                    >
                      {useCase}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Next Button */}
        <div className="flex justify-center pt-8">
          <Button 
            onClick={onNext}
            size="lg"
            className="px-8 py-3 text-lg font-medium rounded-xl"
            disabled={!selectedCategory}
          >
            Continue to Agent Builder
          </Button>
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

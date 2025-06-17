'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ProgressIndicator } from './progress-indicator';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

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

  const handleNext = () => {
    if (selectedCategory) {
      const categoryTitle = workCategories[selectedCategory as keyof typeof workCategories].title;
      onNext(categoryTitle);
    }
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
            Choose a category to see example use cases
          </p>
        </div>

        {/* Category Selection - Vertical Stack */}
        <div className="max-w-2xl mx-auto space-y-4">
          {Object.entries(workCategories).map(([key, category]) => (
            <Card
              key={key}
              className={cn(
                "p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border-2",
                selectedCategory === key
                  ? "border-primary bg-primary/5 shadow-lg scale-[1.02]"
                  : "border-border hover:border-primary/50"
              )}
              onClick={() => handleCategoryClick(key)}
            >
              <div className="flex items-center justify-between">
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
                <div className="flex items-center gap-2">
                  {selectedCategory === key && (
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  )}
                  {expandedCategory === key ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-200" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform duration-200" />
                  )}
                </div>
              </div>

              {/* Expanded Use Cases */}
              {expandedCategory === key && (
                <div className="mt-6 space-y-3 animate-in slide-in-from-top-2 duration-300">
                  <div className="h-px bg-border" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {category.useCases.map((useCase, index) => (
                      <div
                        key={index}
                        className="p-3 rounded-lg bg-muted/30 text-sm font-medium text-muted-foreground hover:bg-muted/60 transition-all duration-200 hover:scale-105"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                          {useCase}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Next Button */}
        <div className="flex justify-center pt-8">
          <Button
            onClick={handleNext}
            size="lg"
            className="px-8 py-3 text-lg font-medium rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95 disabled:hover:scale-100 disabled:hover:shadow-none"
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

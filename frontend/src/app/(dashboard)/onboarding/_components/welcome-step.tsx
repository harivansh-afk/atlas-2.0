'use client';

import { Button } from '@/components/ui/button';
import { ProgressIndicator } from './progress-indicator';

interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-background">
      {/* Progress Indicator */}
      <div className="absolute top-8 left-8">
        <ProgressIndicator currentStep={1} totalSteps={2} />
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center text-center max-w-2xl mx-auto space-y-8">
        {/* Welcome Header */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            WELCOME TO <span className="text-primary">ATLAS</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground font-medium">
            Atlas is your go-to operations agent
          </p>
        </div>

        {/* Call to Action */}
        <div className="space-y-6">
          <p className="text-2xl md:text-3xl font-medium">
            ready to <span className="text-primary font-semibold">20x</span> your operations efficiency?
          </p>
          
          <Button 
            onClick={onNext}
            size="lg"
            className="px-8 py-3 text-lg font-medium rounded-xl"
          >
            let's go
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

'use client';

import { Button } from '@/components/ui/button';
import { ProgressIndicator } from './progress-indicator';
import { Sparkles, ArrowRight } from 'lucide-react';

interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-background relative overflow-hidden">
      {/* Progress Indicator */}
      <div className="absolute top-8 left-8 z-10">
        <ProgressIndicator currentStep={1} totalSteps={2} />
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center text-center max-w-4xl mx-auto space-y-12 relative z-10">
        {/* Welcome Header with enhanced styling */}
        <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-1000">
          {/* Icon with sparkles */}
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <div className="flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/20">
                <Sparkles className="w-10 h-10 text-primary animate-pulse" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary animate-bounce delay-300" />
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground to-foreground/80 bg-clip-text text-transparent">
            WELCOME TO{' '}
            <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              ATLAS
            </span>
          </h1>

          <div className="space-y-3">
            <p className="text-2xl md:text-3xl text-muted-foreground font-medium leading-relaxed">
            Atlas is your go-to operations agent
          </p>
            <div className="w-24 h-1 bg-gradient-to-r from-primary to-primary/50 rounded-full mx-auto" />
          </div>
        </div>

        {/* Enhanced Call to Action */}
        <div className="space-y-8 animate-in fade-in-0 slide-in-from-bottom-4 duration-1000 delay-300">
          <div className="space-y-4">
            <p className="text-2xl md:text-4xl font-semibold leading-relaxed">
              Ready to{' '}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                  20x
                </span>
                <div className="absolute -inset-1 bg-primary/10 rounded-lg blur-sm -z-10" />
              </span>{' '}
              your operations efficiency?
          </p>

            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Transform your workflow with AI-powered automation that adapts to your needs
            </p>
          </div>

          <div className="flex flex-col items-center space-y-4">
          <Button
            onClick={onNext}
            size="lg"
              className="group relative px-12 py-4 text-xl font-semibold rounded-2xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 border border-primary/20"
            >
              <span className="flex items-center gap-3">
                Let's Go
                <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </Button>

            <p className="text-sm text-muted-foreground">
              Takes less than 2 minutes to set up
            </p>
          </div>
        </div>
      </div>

      {/* Enhanced Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute -top-40 -right-32 w-96 h-96 rounded-full bg-gradient-to-br from-primary/10 via-primary/5 to-transparent blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-32 w-96 h-96 rounded-full bg-gradient-to-tr from-primary/10 via-primary/5 to-transparent blur-3xl animate-pulse delay-1000" />

        {/* Floating elements */}
        <div className="absolute top-1/4 left-1/4 w-4 h-4 rounded-full bg-primary/30 animate-float" />
        <div className="absolute top-3/4 right-1/4 w-3 h-3 rounded-full bg-primary/20 animate-float delay-500" />
        <div className="absolute top-1/2 right-1/3 w-2 h-2 rounded-full bg-primary/40 animate-float delay-1000" />

        {/* Grid pattern */}
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

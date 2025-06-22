'use client';

import { Button } from '@/components/ui/button';
import { ProgressIndicator } from './progress-indicator';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

interface WorkTypeStepProps {
  onNext: (workType: string) => void;
}

export function WorkTypeStep({ onNext }: WorkTypeStepProps) {
  const handleGetStarted = () => {
    onNext('Getting Started');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-background">
      {/* Progress Indicator */}
      <div className="absolute top-8 left-8">
        <ProgressIndicator currentStep={2} totalSteps={2} />
      </div>

      {/* Main Content */}
      <div className="w-full max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold">
            You're all set! Here's what you can do next:
          </h1>
        </div>

        {/* First Screenshot - onboarding2.png */}
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="relative rounded-lg border-2 border-border overflow-hidden shadow-2xl bg-muted/20">
            <Image
              src="/onboarding2.png"
              alt="Connect your favorite apps"
              width={1200}
              height={800}
              className="w-full h-auto transition-opacity duration-300"
              priority
              quality={90}
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 768px"
            />
          </div>
          <div className="text-center">
            <p className="text-lg text-muted-foreground">
              Connect up your favourite apps with a single click!
            </p>
          </div>
        </div>

        {/* Second Screenshot - onboarding1.png */}
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="relative rounded-lg border-2 border-border overflow-hidden shadow-2xl bg-muted/20">
            <Image
              src="/onboarding1.png"
              alt="Begin automating your workflows"
              width={1200}
              height={800}
              className="w-full h-auto transition-opacity duration-300"
              priority
              quality={90}
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 768px"
            />
          </div>
          <div className="text-center">
            <p className="text-lg text-muted-foreground">
              Begin automating your workflows at scale!
            </p>
          </div>
        </div>

        {/* Get Started Button */}
        <div className="text-center">
          <Button
            onClick={handleGetStarted}
            size="lg"
            className="group relative px-12 py-4 text-xl font-semibold rounded-2xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 border border-primary/20"
          >
            <span className="flex items-center gap-3">
              Get Started
              <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
            </span>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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

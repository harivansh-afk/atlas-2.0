'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WorkTypeStep } from './_components/work-type-step';
import { useCreateAgent, useAgents } from '@/hooks/react-query/agents/use-agents';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ProgressIndicator } from './_components/progress-indicator';
import Image from 'next/image';

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const router = useRouter();
  const createAgentMutation = useCreateAgent();

  // Fetch user's existing agents to check if they already have any
  const { data: agentsResponse, isLoading: isLoadingAgents } = useAgents({
    page: 1,
    limit: 1,
    sort_by: 'created_at',
    sort_order: 'desc'
  });

  const handleNextStep = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleComplete = async (workType: string) => {
    try {
      // Wait for agents data to load if it's still loading
      if (isLoadingAgents) {
        toast.info('Loading your agents...');
        return;
      }

      // Check if user already has agents
      const existingAgents = agentsResponse?.agents || [];

      if (existingAgents.length > 0) {
        // User already has agents, redirect to their most recent agent's builder page
        const mostRecentAgent = existingAgents[0]; // Already sorted by created_at desc
        toast.success('Welcome back! Let\'s continue setting up your agent.');
        router.push(`/agents/new/${mostRecentAgent.agent_id}?onboarding=true`);
        return;
      }

      // User has no agents, create a new one
      const newAgent = await createAgentMutation.mutateAsync({
        name: `My ${workType} Agent`,
        description: `An AI agent specialized for ${workType.toLowerCase()} tasks`,
        system_prompt: `You are an AI agent specialized in ${workType.toLowerCase()}. Help users with tasks related to ${workType.toLowerCase()}.`,
        configured_mcps: [],
        custom_mcps: [],
        agentpress_tools: {},
        is_default: false,
      });

      toast.success('Your first agent has been created!');

      // Navigate to the agent builder with the new agent
      // Add a query parameter to trigger the custom service popup
      router.push(`/agents/new/${newAgent.agent_id}?onboarding=true`);
    } catch (error) {
      console.error('Failed to create agent:', error);
      toast.error('Failed to create your first agent. Please try again.');

      // Fallback: navigate to agents page
      router.push('/agents');
    }
  };

  return (
    <>
      {currentStep === 1 && (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-background relative">
          {/* Progress Indicator */}
          <div className="absolute top-8 left-8">
            <ProgressIndicator currentStep={1} totalSteps={2} />
          </div>

          {/* Main Content Container */}
          <div className="flex flex-col items-center justify-center text-center max-w-2xl mx-auto">
            {/* Thumbnails Image */}
            <div className="w-full mb-2">
              <Image
                src="/Thumbnails.png"
                alt="Atlas Thumbnails"
                width={800}
                height={400}
                className="w-full h-auto rounded-lg"
                priority
              />
            </div>

            {/* Welcome Content */}
            <div className="space-y-6">
              {/* Welcome Header */}
              <div className="space-y-4">
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                  WELCOME TO <span className="text-primary">ATLAS</span>
                </h1>
                <p className="text-xl md:text-2xl text-muted-foreground font-medium">
                  Atlas is your go-to operations agent
                </p>
              </div>

              {/* Call to Action */}
              <div className="space-y-6">
                <p className="text-xl md:text-2xl font-medium">
                  ready to <span className="text-primary font-semibold">20x</span> your operations efficiency?
                </p>

                <Button
                  onClick={handleNextStep}
                  size="lg"
                  className="px-8 py-3 text-lg font-medium rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95 disabled:hover:scale-100 disabled:hover:shadow-none"
                >
                  let's go
                </Button>
              </div>
            </div>
          </div>

          {/* Background decoration */}
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute -top-40 -right-32 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
            <div className="absolute -bottom-40 -left-32 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
          </div>
        </div>
      )}
      {currentStep === 2 && (
        <WorkTypeStep onNext={handleComplete} />
      )}
    </>
  );
}

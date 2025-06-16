'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WelcomeStep } from './_components/welcome-step';
import { WorkTypeStep } from './_components/work-type-step';
import { useCreateAgent } from '@/hooks/react-query/agents/use-agents';
import { toast } from 'sonner';

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const router = useRouter();
  const createAgentMutation = useCreateAgent();

  const handleNextStep = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleComplete = async () => {
    try {
      // Create a new agent for the user if they don't have any
      const newAgent = await createAgentMutation.mutateAsync({
        name: 'My First Agent',
        description: 'An agent created during onboarding',
        instructions: 'You are a helpful AI assistant that can help with various tasks.',
        model: 'claude-3-5-sonnet-20241022',
        tools: [],
        mcpConfigurations: []
      });

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
        <WelcomeStep onNext={handleNextStep} />
      )}
      {currentStep === 2 && (
        <WorkTypeStep onNext={handleComplete} />
      )}
    </>
  );
}

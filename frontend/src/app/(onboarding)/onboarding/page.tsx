'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WorkTypeStep } from './_components/work-type-step';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ProgressIndicator } from './_components/progress-indicator';
import Image from 'next/image';
import { useCreateAgent } from '@/hooks/react-query/agents/use-agents';

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const router = useRouter();
  const createAgentMutation = useCreateAgent();

  const handleNextStep = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleComplete = async (workType: string) => {
    try {
      // Create default agent using the same configuration as Composio integration
      const defaultAgentData = {
        name: 'Atlas',
        description: 'Your default Atlas agent with centralized tool configurations',
        system_prompt: 'You are Atlas, a helpful AI assistant with access to various tools and integrations. Provide clear, accurate, and helpful responses to user queries.',
        configured_mcps: [],
        custom_mcps: [],
        agentpress_tools: {
          "sb_shell_tool": {
            "enabled": true,
            "description": "Execute terminal commands, run scripts, manage system processes",
          },
          "sb_file_tool": {
            "enabled": true,
            "description": "Read, write, and manage files and directories",
          },
          "sb_browser_tool": {
            "enabled": true,
            "description": "Browse websites, extract content, interact with web pages",
          },
          "sb_search_tool": {
            "enabled": true,
            "description": "Search the web for information and answers",
          },
          "sb_code_tool": {
            "enabled": true,
            "description": "Execute code in various programming languages",
          },
          "sb_vision_tool": {
            "enabled": true,
            "description": "Analyze and describe images, extract text from images",
          },
          "sb_email_tool": {
            "enabled": true,
            "description": "Send and manage emails",
          },
          "data_providers_tool": {
            "enabled": true,
            "description": "Access external APIs and data sources",
          },
          "clado_tool": {
            "enabled": true,
            "description": "Clado integration for enhanced functionality",
          },
        },
        is_default: true,
        avatar: '🤖',
        avatar_color: '#6366f1',
      };

      await createAgentMutation.mutateAsync(defaultAgentData);

      // Redirect to dashboard after completing onboarding
      router.push('/dashboard');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error('Something went wrong. Please try again.');
      // Fallback: still navigate to dashboard
      router.push('/dashboard');
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
              </div>

              {/* Call to Action */}
              <div className="space-y-6">
                <p className="text-xl md:text-2xl font-medium">
                  ready to <span className="text-primary font-semibold">20x</span> your efficiency?
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

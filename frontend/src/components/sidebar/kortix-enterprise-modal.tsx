import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from '@/components/ui/dialog';
import { useMediaQuery } from '@/hooks/use-media-query';
import Image from 'next/image';
import Cal, { getCalApi } from '@calcom/embed-react';
import { useTheme } from 'next-themes';
import { KortixLogo } from '@/components/sidebar/kortix-logo';

interface KortixProcessModalProps {
  open: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function KortixProcessModal() {
  const [open, setOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark';

  useEffect(() => {
    (async function () {
      // No need for Cal API namespace for direct link embed
    })();
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className="w-full text-xs">
          Learn More
        </Button>
      </DialogTrigger>
      <DialogContent className="p-0 gap-0 border-none max-w-[70vw] rounded-xl overflow-hidden">
        <DialogTitle className="sr-only">
          Atlas: AI Agents for Workflow Automation
        </DialogTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 h-[800px]">
          {/* Info Panel */}
          <div className="p-8 flex flex-col bg-white dark:bg-black relative h-full overflow-y-auto border-r border-gray-200 dark:border-gray-800">
            <div className="relative z-10 flex flex-col h-full">
              <div className="mb-8 mt-0 flex-shrink-0">
                <KortixLogo />
              </div>

              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4 text-foreground flex-shrink-0">
                Atlas: AI Agents for Workflow Automation
              </h2>
              <p className="text-base md:text-lg text-muted-foreground mb-8 max-w-lg flex-shrink-0">
                Atlas deploys AI agents that automate your business workflows, integrate with your tools, and execute tasks 24/7. Boost productivity, reduce manual work, and scale your operations with intelligent automation.
              </p>

              <div className="space-y-8 mb-auto flex-shrink-0">
                <div className="transition-all duration-300 hover:translate-x-1 group">
                  <h3 className="text-base md:text-lg font-medium mb-3 flex items-center">
                    <span className="bg-primary text-primary-foreground w-7 h-7 rounded-full inline-flex items-center justify-center mr-3 text-sm group-hover:shadow-md transition-all duration-300">
                      1
                    </span>
                    <span>Connect</span>
                  </h3>
                  <p className="text-base text-muted-foreground ml-10">
                    Connect Atlas to your business tools, data sources, and workflows.
                  </p>
                </div>

                <div className="transition-all duration-300 hover:translate-x-1 group">
                  <h3 className="text-base md:text-lg font-medium mb-3 flex items-center">
                    <span className="bg-primary text-primary-foreground w-7 h-7 rounded-full inline-flex items-center justify-center mr-3 text-sm group-hover:shadow-md transition-all duration-300">
                      2
                    </span>
                    <span>Automate</span>
                  </h3>
                  <p className="text-base text-muted-foreground ml-10">
                    Deploy AI agents to automate repetitive tasks, manage workflows, and execute actions across your stack.
                  </p>
                </div>

                <div className="transition-all duration-300 hover:translate-x-1 group">
                  <h3 className="text-base md:text-lg font-medium mb-3 flex items-center">
                    <span className="bg-primary text-primary-foreground w-7 h-7 rounded-full inline-flex items-center justify-center mr-3 text-sm group-hover:shadow-md transition-all duration-300">
                      3
                    </span>
                    <span>Scale</span>
                  </h3>
                  <p className="text-base text-muted-foreground ml-10">
                    Scale your automation, monitor results, and continuously improve with Atlas insights and analytics.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-[#171717] h-full overflow-hidden">
            <div className="h-full overflow-auto">
              <iframe
                src="https://cal.com/atlasagents/15min?overlayCalendar=true"
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="Book a meeting with Atlas"
                allow="camera; microphone; fullscreen; speaker; display-capture"
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

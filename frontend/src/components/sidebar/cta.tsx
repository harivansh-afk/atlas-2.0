import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Briefcase, ExternalLink, X } from 'lucide-react';
import { KortixProcessModal } from '@/components/sidebar/kortix-enterprise-modal';
import { useState } from 'react';

export function CTACard() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <div className="relative rounded-xl bg-gradient-to-br from-blue-50 to-blue-200 dark:from-blue-950/40 dark:to-blue-900/40 shadow-sm border border-blue-200/50 dark:border-blue-800/50 p-4 transition-all">
      <button
        className="absolute top-2 right-2 p-1 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-900 dark:text-blue-100 opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
        aria-label="Dismiss enterprise demo"
        onClick={() => setDismissed(true)}
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-foreground">
            Public Beta 🎉
          </span>
          <span className="text-xs text-muted-foreground mt-0.5">
            AI employees for your company
          </span>
        </div>

        <div>
          <KortixProcessModal />
        </div>
      </div>
    </div>
  );
}

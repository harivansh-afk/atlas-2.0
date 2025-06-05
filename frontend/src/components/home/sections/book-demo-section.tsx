'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { SectionBadge } from '@/components/ui/section-badge';
import Cal, { getCalApi } from '@calcom/embed-react';

export function BookDemoSection() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = resolvedTheme === 'dark';

  useEffect(() => {
    setMounted(true);
    (async function () {
      const cal = await getCalApi();
      cal("ui", {"theme": isDarkMode ? "dark" : "light"});
    })();
  }, [isDarkMode]);

  if (!mounted) {
    return null;
  }

  return (
    <section id="book-demo" className="w-full max-w-6xl py-8 sm:py-12 md:py-16 px-4 sm:px-6">
      <SectionBadge>Book a Demo</SectionBadge>
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-center mb-4 sm:mb-6">
        Ready to See <span className="italic font-light">Atlas in Action?!</span>
      </h2>
      <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto text-center mb-8 sm:mb-10 px-2">
        Book a personalized demo to see how Atlas can transform your workflows.
      </p>

      <div className="w-full max-w-4xl mx-auto">
        <Cal
          calLink="atlasagents/15min"
          style={{ width: "100%", height: "100%", overflow: "scroll" }}
          config={{ layout: 'month_view' }}
        />
      </div>
    </section>
  );
}

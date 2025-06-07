import React from "react";
// Link and Button might not be needed here anymore if header constant is removed
// import Link from "next/link";
// import { Button } from "@/components/ui/button";
import { LargeNameFooter } from "@/components/ui/large-name-footer";
// KortixLogo is used by HeroHeader, so keep if HeroHeader is local, or it's imported within HeroHeader
// import { KortixLogo } from "@/components/sidebar/kortix-logo";
import { HeroHeader } from "@/components/layout/hero-header";

// This layout applies only to the routes within the (mainPages) group
export default function MainPagesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Environment variable check can remain if needed for other parts of the layout
  const hasEnvVars = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Removed the header constant and its JSX definition

  // Define footer content with LargeNameFooter
  const footer = <LargeNameFooter />;

  return (
    <div className="flex flex-col min-h-screen">
      <HeroHeader />
      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      {footer && (
        <footer>
          <div className="w-full max-w-screen py-6">
            {footer}
          </div>
        </footer>
      )}
    </div>
  );
}

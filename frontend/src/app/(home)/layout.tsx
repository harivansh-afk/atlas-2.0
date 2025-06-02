import React from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { LargeNameFooter } from "@/components/ui/large-name-footer";
import { KortixLogo } from "@/components/sidebar/kortix-logo";



// This layout applies only to the routes within the (mainPages) group
export default function MainPagesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Check for necessary environment variables
  const hasEnvVars = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Define the header content here - transparent overlay for ethereal background
  const header = (
    <div className="w-full flex items-center text-sm py-4 pl-4 relative z-50">
      <Link href={'/'} className="flex items-center">
        <KortixLogo size={32} />
      </Link>
      {/* Begin button, matching CTA section */}
      <div className="absolute top-0 right-0 mt-4 mr-4">
        <Link href="/auth">
          <Button variant="default" className="px-8 py-3 text-base md:text-lg font-semibold rounded-xl shadow-md">
            Begin
          </Button>
        </Link>
      </div>
    </div>
  );

  // Define footer content with LargeNameFooter
  const footer = <LargeNameFooter />;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Transparent header overlay */}
      <header className="absolute top-0 left-0 right-0 z-50 bg-transparent">
        {header}
      </header>

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

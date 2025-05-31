'use client';

import Link from "next/link";
import { ButtonColorful } from "../ui/button-colorful";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";

// Create a simple Icons component with Twitter
const Icons = {
  twitter: ({ className }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
    >
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
  ),
  instagram: ({ className }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      width="24"
      height="24"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <circle cx="17.5" cy="6.5" r="1" />
    </svg>
  ),
};

export function LargeNameFooter() {
  // Use a Twitter link for sharing thoughts
  const twitterLink = "https://x.com/atlasagents_ai";
  const instagramLink = "https://www.instagram.com/atlasagents.ai";

  return (
    <footer className="py-12 px-4 md:px-6 bg-background text-foreground border-t">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
          {/* Contact/Share Button */}
          <div className="">
            <div className="mt-2">
              <Link href={twitterLink} target="_blank" rel="noopener noreferrer">
                <ButtonColorful>
                  <span className="flex items-center gap-2">
                    Share Your Thoughts On
                    <Icons.twitter className="w-5 h-5" aria-label="X (Twitter)" />
                  </span>
                </ButtonColorful>
              </Link>
              <div className="mt-4 flex">
                <ThemeToggle />
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-8 md:gap-12 w-full md:w-auto">
            <div>
              <h3 className="font-semibold mb-4" style={{ color: 'var(--footer-heading)' }}>Socials</h3>
              <div className="flex flex-row gap-4">
                <Link href={twitterLink} target="_blank" rel="noopener noreferrer" className="flex items-center footer-link">
                  <Icons.twitter className="w-6 h-6" aria-label="X (Twitter)" />
                  <span className="sr-only">X (Twitter)</span>
                </Link>
                <Link href={instagramLink} target="_blank" rel="noopener noreferrer" className="flex items-center footer-link">
                  <Icons.instagram className="w-6 h-6" aria-label="Instagram" />
                  <span className="sr-only">Instagram</span>
                </Link>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4" style={{ color: 'var(--footer-heading)' }}>Legal</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/legal" className="footer-link">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/legal" className="footer-link">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Large App Name */}
        <div className="w-full flex mt-12 items-center justify-center overflow-hidden">
          <h1 className="text-center text-[18vw] md:text-[15vw] font-bold italic text-neutral-700 select-none leading-none">
            Atlas...
          </h1>
        </div>
      </div>
    </footer>
  );
}

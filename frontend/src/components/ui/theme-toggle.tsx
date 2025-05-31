"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, type MouseEvent } from "react";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  // Use the hook from next-themes
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [_, setCoords] = useState<{ x: number; y: number } | null>(null);

  // Add useEffect to ensure we only render on the client
  const [isMounted, setIsMounted] = useState(false);

  // This useEffect will only run on the client, after hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Function to toggle the theme
  const toggleTheme = (event: MouseEvent<HTMLDivElement>) => {
    const x = event.clientX;
    const y = event.clientY;
    setCoords({ x, y });

    // Check for View Transitions API support
    if (typeof (document as any).startViewTransition !== "function") {
      setTheme(isDark ? "light" : "dark");
      return;
    }

    // Use View Transitions API
    (document as any).startViewTransition?.(() => {
      // Set CSS variables for the animation origin *before* the DOM update
      document.documentElement.style.setProperty("--click-x", `${x}px`);
      document.documentElement.style.setProperty("--click-y", `${y}px`);
      setTheme(isDark ? "light" : "dark");
    });
  };

  // Only render the toggle when mounted on the client
  if (!isMounted) {
    return <div className={cn("flex w-16 h-8 p-1 rounded-full", className)} />;
  }

  return (
    <div
      className={cn(
        "flex w-16 h-8 p-1 rounded-full cursor-pointer transition-all duration-300",
        isDark
          ? "bg-zinc-950 border border-zinc-800"
          : "bg-white border border-zinc-200",
        className
      )}
      onClick={toggleTheme}
      role="button"
      tabIndex={0}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      suppressHydrationWarning
    >
      <div className="flex justify-between items-center w-full">
        <div
          className={cn(
            "flex justify-center items-center w-6 h-6 rounded-full transition-transform duration-300",
            isDark
              ? "transform translate-x-0 bg-zinc-800"
              : "transform translate-x-8 bg-gray-200"
          )}
        >
          {isDark ? (
            <Moon
              className="w-4 h-4 text-white"
              strokeWidth={1.5}
              suppressHydrationWarning
            />
          ) : (
            <Sun
              className="w-4 h-4 text-gray-700"
              strokeWidth={1.5}
              suppressHydrationWarning
            />
          )}
        </div>
        <div
          className={cn(
            "flex justify-center items-center w-6 h-6 rounded-full transition-transform duration-300",
            isDark
              ? "bg-transparent"
              : "transform -translate-x-8"
          )}
        >
          {isDark ? (
            <Sun
              className="w-4 h-4 text-gray-500"
              strokeWidth={1.5}
              suppressHydrationWarning
            />
          ) : (
            <Moon
              className="w-4 h-4 text-black"
              strokeWidth={1.5}
              suppressHydrationWarning
            />
          )}
        </div>
      </div>
    </div>
  );
}

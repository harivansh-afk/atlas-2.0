"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import React from "react";

export interface CTAProps {
  badge?: {
    text: string;
  };
  title: string;
  description?: React.ReactNode;
  action: {
    text: string;
    href: string;
    variant?: "default";
  };
  withGlow?: boolean;
  className?: string;
}

export function CTARectangle({
  badge,
  title,
  description,
  action,
  withGlow = false,
  className = "",
}: CTAProps) {
  return (
    <div
      className={cn(
        "relative w-full flex flex-col items-center justify-center p-8 md:p-12 rounded-2xl border bg-card",
        className
      )}
    >
      {badge && (
        <span className="mb-2 inline-block rounded-full bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {badge.text}
        </span>
      )}
      <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 text-foreground tracking-tight">
        {title}
      </h2>
      {description && (
        <div className="w-full flex flex-col items-center text-center text-base md:text-lg font-normal text-muted-foreground mb-8">
          {description}
        </div>
      )}
      <Button
        asChild
        variant={action.variant || "default"}
        className="mt-2 px-8 py-3 text-base rounded-full font-semibold bg-primary text-primary-foreground shadow-none hover:bg-primary/90 transition"
      >
        <a href={action.href}>{action.text}</a>
      </Button>
    </div>
  );
}

'use client';

import React from "react";
import { Component } from "@/components/ui/orb";

interface AiAvatarOrbProps {
  width?: number;
  height?: number;
  hue?: number;
  hoverIntensity?: number;
  rotateOnHover?: boolean;
  forceHoverState?: boolean;
  isLoading?: boolean;
}

export function AiAvatarOrb({
  width = 32,
  height = 32,
  hue = 240,
  hoverIntensity = 0.3,
  rotateOnHover = true,
  forceHoverState = false,
  isLoading = false
}: AiAvatarOrbProps) {
  return (
    <div
      className="flex items-center justify-center flex-shrink-0 rounded-lg overflow-hidden"
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      <Component
        hue={hue}
        hoverIntensity={hoverIntensity}
        rotateOnHover={rotateOnHover}
        forceHoverState={forceHoverState || isLoading}
      />
    </div>
  );
}

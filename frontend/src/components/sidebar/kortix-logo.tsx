'use client';

import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

interface KortixLogoProps {
  size?: number;
}
export function KortixLogo({ size = 32 }: KortixLogoProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  // After mount, we can access the theme
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      className="relative flex h-8 w-8 items-center justify-center flex-shrink-0 cursor-pointer"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <Image
        src="/favicon.png"
        alt="Atlas Static Logo"
        width={size}
        height={size}
        className={`absolute rounded-lg pointer-events-none transition-opacity duration-500 ease-in-out ${
          isHovering ? 'opacity-0' : 'opacity-100'
        }`}
      />
      <Image
        src="/hero_gif.gif"
        alt="Atlas Animated Logo"
        width={size}
        height={size}
        className={`absolute rounded-lg pointer-events-none transition-opacity duration-500 ease-in-out ${
          isHovering ? 'opacity-100' : 'opacity-0'
        }`}
        unoptimized={true}
      />
    </div>
  );
}

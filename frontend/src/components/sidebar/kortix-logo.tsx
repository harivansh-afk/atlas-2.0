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

  // After mount, we can access the theme
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex h-8 w-8 items-center justify-center flex-shrink-0 pointer-events-none">
      <Image
        src="/favicon.png"
        alt="Atlas"
        width={size}
        height={size}
        className="rounded-lg pointer-events-none"
      />
    </div>
  );
}

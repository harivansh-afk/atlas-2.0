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
  const [imageSrc, setImageSrc] = useState('/hero_gif.gif');

  // After mount, we can access the theme
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Reset imageSrc when the theme changes, for example, or other dependencies.
    // This is to ensure that if the gif was previously error-ed out,
    // and then the component re-renders for another reason (e.g. theme change, size change),
    // it attempts to load the gif again.
    setImageSrc('/hero_gif.gif');
  }, [theme, size]); // React to changes in theme or size

  return (
    <div className="flex h-8 w-8 items-center justify-center flex-shrink-0 pointer-events-none">
      <Image
        src={imageSrc}
        alt="Atlas"
        width={size}
        height={size}
        className="rounded-lg pointer-events-none"
        onError={() => {
          setImageSrc('/favicon.png');
        }}
      />
    </div>
  );
}

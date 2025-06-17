'use client';

import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface HeroGifWithFallbackProps {
  width?: number;
  height?: number;
  className?: string;
  alt?: string;
  priority?: boolean;
  unoptimized?: boolean;
  fill?: boolean;
}

export function HeroGifWithFallback({
  width = 80,
  height = 80,
  className,
  alt = "Hero Animation",
  priority = false,
  unoptimized = true,
  fill = false
}: HeroGifWithFallbackProps) {
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    setHasError(true);
  };

  if (fill) {
    return (
      <div className="relative w-full h-full">
        {!hasError ? (
          <Image
            src="/hero_gif.gif"
            alt={alt}
            fill
            className={cn("object-contain", className)}
            unoptimized={unoptimized}
            priority={priority}
            onError={handleError}
          />
        ) : (
          <Image
            src="/favicon.png"
            alt="Atlas Logo"
            fill
            className={cn("object-contain", className)}
            priority={priority}
          />
        )}
      </div>
    );
  }

  return (
    <>
      {!hasError ? (
        <Image
          src="/hero_gif.gif"
          alt={alt}
          width={width}
          height={height}
          className={className}
          unoptimized={unoptimized}
          priority={priority}
          onError={handleError}
        />
      ) : (
        <Image
          src="/favicon.png"
          alt="Atlas Logo"
          width={width}
          height={height}
          className={className}
          priority={priority}
        />
      )}
    </>
  );
}

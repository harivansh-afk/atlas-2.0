// import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    domains: ['randomuser.me', 'framerusercontent.com', 'cdn.prod.website-files.com', 'media.licdn.com', 'images.squarespace-cdn.com'],
  },
  webpack: (config) => {
    // This rule prevents issues with pdf.js and canvas
    config.externals = [...(config.externals || []), { canvas: 'canvas' }];

    // Ensure node native modules are ignored
    config.resolve.fallback = {
      ...config.resolve.fallback,
      canvas: false,
    };

    return config;
  },
};

// Temporarily disable Sentry to fix Vercel build
// if (process.env.NEXT_PUBLIC_VERCEL_ENV === 'production') {
//   nextConfig = withSentryConfig(nextConfig, {
//     org: 'Atlas-ai',
//     project: 'Atlas-nextjs',
//     silent: !process.env.CI,
//     widenClientFileUpload: true,
//     tunnelRoute: '/monitoring',
//     disableLogger: true,
//     automaticVercelMonitors: true,
//   });
// }

export default nextConfig;

import React from 'react';
import { SectionBadge } from '@/components/ui/section-badge';
import { Card } from '@/components/ui/card';
import Image from 'next/image';
import { cn } from '@/lib/utils';

// TweetCard component for standardized tweet displays
const TweetCard = ({
  quote,
  name,
  title,
  profileImage,
  className
}: {
  quote: string;
  name: string;
  title: string;
  profileImage: string;
  className?: string;
}) => {
  return (
    <Card className={cn("p-6 rounded-2xl border-0 bg-black text-white dark:bg-black", className)}>
      <p className="text-md md:text-lg mb-6">
        {quote}
      </p>
      <div className="flex items-center">
        <div className="mr-4">
          <div className="w-12 h-12 rounded-full overflow-hidden">
            <Image
              src={profileImage}
              alt={name}
              width={48}
              height={48}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        <div>
          <p className="font-semibold">{name}</p>
          <p className="text-sm text-gray-300">{title}</p>
        </div>
        <div className="ml-auto">
          <div className="w-8 h-8 flex items-center justify-center">
            {/* X.com logo (formerly Twitter) */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </div>
        </div>
      </div>
    </Card>
  );
};

// MetricCard component for standardized metric displays
const MetricCard = ({
  title,
  subtitle,
  description,
  logoSrc,
  logoAlt,
  className,
  bgColor,
  isThinkr = false,
  invertLogo = true
}: {
  title: string;
  subtitle?: string;
  description?: string;
  logoSrc: string;
  logoAlt: string;
  className?: string;
  bgColor?: string;
  isThinkr?: boolean;
  invertLogo?: boolean;
}) => {
  // Determine the appropriate styling based on the logo and flags
  const isCollectiveLogo = logoSrc.includes('collective');
  const isPhiaLogo = logoSrc.includes('phia');

  // Use white background for ThinkAI, Phia, and Collective in light mode
  let cardBgColor = 'bg-neutral-800 dark:bg-neutral-800';
  if (isThinkr || isCollectiveLogo) {
    cardBgColor = 'bg-white dark:bg-white';
  } else if (bgColor) {
    cardBgColor = bgColor;
  }

  // Set text colors based on background
  const isLightBg = isThinkr || isCollectiveLogo || isPhiaLogo;
  const textColor = isLightBg ? 'text-black dark:text-black' : 'text-white dark:text-white';
  const subtextColor = isLightBg ? 'text-gray-600 dark:text-gray-600' : 'text-gray-400 dark:text-gray-400';

  // Only invert the logo if specified and needed (ThinkAI logo on white bg)
  const logoInvert = (isThinkr && invertLogo && !isPhiaLogo) ? 'invert' : '';

  return (
    <Card className={cn("p-6 rounded-2xl border-0", cardBgColor, textColor, className)}>
      <div className="flex flex-col h-full justify-between">
        <div>
          <h3 className="text-2xl md:text-3xl font-bold mb-1">{title}</h3>
          {subtitle && <h4 className="text-xl md:text-2xl font-bold mb-2">{subtitle}</h4>}
          {description && <p className="text-sm" style={{ color: subtextColor }}>{description}</p>}
        </div>
        <div className="mt-auto pt-3">
          <div className="h-6">
            <Image
              src={logoSrc}
              alt={logoAlt}
              width={120}
              height={24}
              className={`h-6 w-auto object-contain opacity-80 ${logoInvert}`}
            />
          </div>
        </div>
      </div>
    </Card>
  );
};

export default function TestimonialsSection() {
  return (
    <section id="testimonials" className="w-full max-w-6xl py-12 md:py-16 mx-auto">
      <SectionBadge>Customers</SectionBadge>
      <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-center mb-6">
        Our Customers Save Up to <br /> <span className="italic font-light">20 Hours Per Week Per Employee</span>
        <br />With Atlas
      </h2>
      <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto text-center mb-10">
        Atlas Agents helps some of the best global businesses save time and increase efficiency.
      </p>

      {/* First row - ThinkAI: Aditya + 50 Hours + 20X */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* First testimonial - Aditya Behera */}
        <TweetCard
          quote="Atlas helped us 20x our productivity with our internal tasks across all our tools."
          name="Aditya Behera"
          title="Co-founder, CTO"
          profileImage="https://media.licdn.com/dms/image/v2/D4E03AQFHr57y_-j2Pg/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1723036080263?e=1754524800&v=beta&t=XDMUz47OCdw6LhAU6AG5Hlf0CC6pLnf5R7WRdTRWAFc"
        />

        {/* First metric card - 50 Hours Saved */}
        <MetricCard
          title="50 Hours"
          subtitle="Saved"
          description="per week"
          logoSrc="https://cdn.prod.website-files.com/679aad5af65da94e21f9992c/679c096939826730a9072c26_logo-transparent-png.png"
          logoAlt="ThinkAI Logo"
          isThinkr={true}
        />

        {/* 20X Increase Efficiency */}
        <MetricCard
          title="20X"
          description="Increase Efficiency"
          logoSrc="https://cdn.prod.website-files.com/679aad5af65da94e21f9992c/679c096939826730a9072c26_logo-transparent-png.png"
          logoAlt="ThinkAI Logo"
          isThinkr={true}
        />
      </div>

      {/* Second row - Collective: $20k + 60 Hours + Tram Tran */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Second metric card - $20k Raised */}
        <MetricCard
          title="$20k Raised"
          description="from Atlas outbound"
          logoSrc="/collective.png"
          logoAlt="Collective Logo"
          bgColor="bg-neutral-200"
        />

        {/* 60 Hours Saved */}
        <MetricCard
          title="60 Hours"
          description="Saved"
          logoSrc="/collective.png"
          logoAlt="Collective Logo"
          bgColor="bg-neutral-200"
        />

        {/* Third testimonial - Tram Tran */}
        <TweetCard
          quote="60 Hours Saved & $20k Raised: How Collective Esports used Atlas to save their national tournament in 12 days"
          name="Tram Tran"
          title="Co-Founder, CEO"
          profileImage="https://images.squarespace-cdn.com/content/v1/622648e95c84313853870272/47e216b1-c2b2-4629-84ad-f861570d02bd/2022+Tram+Headshot.jpg"
        />
      </div>

      {/* Third row - Phia themed row (same style as first row) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Case Study 1 - Andrew Somers */}
        <TweetCard
          quote="50 Hours/Week Recovered: How thinktAI Automates Operations with Atlas Agents"
          name="Andrew Somers"
          title="Co-founder, CEO"
          profileImage="https://media.licdn.com/dms/image/v2/D4E03AQHbfNd5y86ykg/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1704315845243?e=2147483647&v=beta&t=4X_5gv25adIIRZ7umPkxrqAw3SAJvqyQlE5u9hNkNyc"
        />

        {/* Phia related metric cards - using the same pattern as first row */}
        <MetricCard
          title="30 Hours"
          subtitle="Saved"
          description="per agent"
          logoSrc="/phia.png"
          logoAlt="Phia Logo"
          isThinkr={true}
          invertLogo={false}
        />

        <MetricCard
          title="15X"
          description="Increase Efficiency"
          logoSrc="/phia.png"
          logoAlt="Phia Logo"
          isThinkr={true}
          invertLogo={false}
        />
      </div>

      {/* No bottom row */}
    </section>
  );
}

'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Clock, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { caseStudies, caseStudyCategories, CaseStudy } from '@/lib/cases';

interface CaseStudyCardProps {
  caseStudy: CaseStudy;
  className?: string;
}

const CaseStudyCard = ({ caseStudy, className }: CaseStudyCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card
      className={cn(
        "group relative overflow-hidden rounded-xl sm:rounded-2xl border-0 cursor-pointer transition-all duration-300 hover:scale-105 h-[350px] sm:h-[400px]",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => window.open(caseStudy.replayUrl, '_blank')}
    >
      {/* Violet background */}
      <div className="absolute inset-0 w-full h-full">
        <Image
          src="/violet.png"
          alt="Background pattern"
          fill
          className="object-cover"
          priority={false}
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
        />
      </div>

      {/* Content overlay */}
      <div className="relative z-20 p-4 sm:p-6 h-full flex flex-col justify-between text-white">
        {/* Header with icon and title */}
        <div>
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-white/80 rounded-sm" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold line-clamp-1">{caseStudy.title}</h3>
          </div>

          <p className="text-white/90 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2 sm:line-clamp-3">
            {caseStudy.description}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 sm:gap-2 mb-3 sm:mb-4">
            {caseStudy.tags.slice(0, 2).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="bg-white/10 text-white/90 border-white/20 hover:bg-white/20 text-xs px-2 py-1"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        {/* Metrics and action */}
        <div>
          <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-3 sm:mb-4">
            {caseStudy.metrics.timeSaved && (
              <div className="flex items-center gap-1 sm:gap-2">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-white/80" />
                <div>
                  <div className="text-xs sm:text-sm font-medium">{caseStudy.metrics.timeSaved}</div>
                  <div className="text-xs text-white/70">saved</div>
                </div>
              </div>
            )}
            {caseStudy.metrics.efficiency && (
              <div className="flex items-center gap-1 sm:gap-2">
                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-white/80" />
                <div>
                  <div className="text-xs sm:text-sm font-medium">{caseStudy.metrics.efficiency}</div>
                  <div className="text-xs text-white/70">efficiency</div>
                </div>
              </div>
            )}
          </div>

          {/* Watch replay button */}
          <div className={cn(
            "flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium transition-all duration-300",
            isHovered ? "translate-x-2 opacity-100" : "translate-x-0 opacity-70"
          )}>
            <Play className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Watch replay</span>
            <div className="ml-1 text-base sm:text-lg">→</div>
          </div>
        </div>
      </div>

      {/* Hover overlay */}
      <div className={cn(
        "absolute inset-0 bg-black/20 transition-opacity duration-300 z-10",
        isHovered ? "opacity-100" : "opacity-0"
      )} />
    </Card>
  );
};

export default function CasesPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredCaseStudies = useMemo(() => {
    if (selectedCategory === 'all') return caseStudies;
    return caseStudies.filter(cs =>
      cs.tags.some(tag => tag.toLowerCase().includes(selectedCategory))
    );
  }, [selectedCategory]);

    return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Content */}
      <div className="w-full">
        <section className="w-full min-h-screen flex items-start justify-center py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-7xl">
            {/* Header */}
            <div className="text-center mb-6 sm:mb-8 md:mb-12">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4 sm:mb-6 md:mb-8">
                Case Studies
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-6 sm:mb-8 md:mb-12 px-4">
                See how Atlas Agents help teams save hours and increase efficiency across different industries
              </p>
            </div>

            {/* Category filters */}
            <div className="flex flex-wrap justify-center gap-2 mb-6 sm:mb-8 px-2">
              {caseStudyCategories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className="rounded-full transition-all text-xs sm:text-sm px-3 sm:px-4 py-2"
                >
                  {category.label}
                </Button>
              ))}
            </div>

            {/* Case studies grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredCaseStudies.map((caseStudy) => (
                <CaseStudyCard
                  key={caseStudy.id}
                  caseStudy={caseStudy}
                />
              ))}
            </div>

            {/* Empty state */}
            {filteredCaseStudies.length === 0 && (
              <div className="text-center py-8 sm:py-12 px-4">
                <p className="text-muted-foreground text-base sm:text-lg">
                  No case studies found for the selected category.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import Features from "@/components/features-11";
import Link from "next/link";
import HeroSectionFive from "@/components/hero-section-five";
import { SectionBadge } from '@/components/ui/section-badge';
import IntegrationsSection from "@/components/integrations-2";
import TestimonialsSection from "@/components/testimonials";
import FAQSection from "@/components/faq";
import Image from "next/image";
import { Card } from "@/components/ui/card";

export default async function Home() {

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <HeroSectionFive />

      <main className="flex-1 w-full mx-auto px-4 flex flex-col gap-12 md:gap-16 items-center">{/* Content sections start here */}

        {/* Features Section (Bento Grid) */}
        <section id="features">
          <Features />
        </section>

        {/* Use Cases Section */}
        <section id="use-cases" className="w-full max-w-6xl py-12 md:py-16">
          <SectionBadge>Use Cases</SectionBadge>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-center mb-6">
            AI Agents for <span className="italic font-light">Every Use Case</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto text-center mb-10">
            See how Atlas transforms your workflows with specialized AI agents that handle everything from internal operations to external research—automatically and intelligently.
          </p>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Left Column: Internal Execution */}
            <div className="space-y-6">
              {/* Internal Execution Image Card */}
              <div className="relative overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm">
                <div className="aspect-[4/3]">
                  <Image
                    src="https://framerusercontent.com/images/eX14jaVylyq5lXwB6Fz9uumyM.webp?scale-down-to=1024"
                    alt="Internal Execution Demo"
                    className="w-full h-full object-cover"
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-bold mb-4">Internal Execution</h3>
                <p className="text-muted-foreground mb-6">
                  Hours lost digging through docs and chats — we surface what matters and get it done.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-1 shrink-0" />
                  <div>
                    <span className="text-md text-muted-foreground">Sync Product Management Tasks to Get Work Done</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-1 shrink-0" />
                  <div>
                    <span className="text-md text-muted-foreground">Sift Through Customer Support & Elevate High Priorities</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-1 shrink-0" />
                  <div>
                    <span className="text-md text-muted-foreground">Meetings Summaries to Action Items & Progress</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-1 shrink-0" />
                  <div>
                    <span className="text-md text-muted-foreground">Build Sales Materials & Updating CRMs</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: External Research */}
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold mb-4">External Research</h3>
                <p className="text-muted-foreground mb-6">
                  We find your prospects, pull insights, and fire off tailored messages — no tabs, no time wasted.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-1 shrink-0" />
                  <div>
                    <span className="text-md text-muted-foreground">Outbound Research for Personalized Messages</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-1 shrink-0" />
                  <div>
                    <span className="text-md text-muted-foreground">Most Up-to-Date Market & Competitor Analysis & Sourcing</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-1 shrink-0" />
                  <div>
                    <span className="text-md text-muted-foreground">Find Contacts & Build Distribution Lists</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-1 shrink-0" />
                  <div>
                    <span className="text-md text-muted-foreground">Automatic Lead Qualification & Filtering</span>
                  </div>
                </div>
              </div>

              {/* External Research Image Card */}
              <div className="relative overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm">
                <div className="aspect-[4/3]">
                  <Image
                    src="https://framerusercontent.com/images/a9T3OzH5SP0FlLLqfv12ZJV3do.webp?scale-down-to=1024"
                    alt="External Research Demo"
                    className="w-full h-full object-cover"
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Integrations Section */}
        <IntegrationsSection />

        {/* Testimonials Section */}
        <TestimonialsSection />

        {/* FAQ Section */}
        <FAQSection />

        {/* CTA Card Section */}
        <section className="w-full flex justify-center items-end my-12 mb-24 px-6 md:px-8">
          <div className="w-full max-w-6xl">
            <SectionBadge>Try Atlas</SectionBadge>
            <Card className="py-8 md:py-12 px-6 md:px-12 rounded-2xl relative overflow-hidden bg-transparent border-0">
              <div className="absolute inset-0 w-full h-full">
                <Image
                  src="/violet.png"
                  alt="Background pattern"
                  fill
                  className="object-cover !relative"
                  priority
                  unoptimized
                />
              </div>
              <div className="relative z-20 flex flex-col items-center">
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-center mb-6 text-white mix-blend-difference">
                  Ready to Save <span className="italic font-light">20 Hours Per Week ?</span>
                </h2>
                <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto text-center mb-10 mix-blend-difference">
                  Don't waste any more time with manual execution,<br />
                  try Atlas today.
                </p>
                <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:*:w-auto">
                <Button
                  asChild
                  size="lg"
                  className="px-8 py-3 text-base md:text-lg font-semibold rounded-xl button-prominent-shadow bg-white text-black dark:bg-black dark:text-white hover:bg-white/90 dark:hover:bg-black/90"
                >
                  <Link href="/auth">
                    <span className="text-nowrap">Get Started</span>
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  className="px-8 py-3 text-base md:text-lg font-semibold rounded-xl button-prominent-shadow bg-black text-white dark:bg-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90"
                >
                  <Link href="#link">
                    <span className="text-nowrap">Book a Demo</span>
                  </Link>
                </Button>
              </div>
            </div>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}

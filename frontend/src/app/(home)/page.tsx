import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import FeaturesSection from "@/components/features-8";
import InteractiveFolder from "@/components/ui/interactive-folder";
import Link from "next/link";
import { Component as EtherealShadow } from "@/components/ui/ethereal-shadow";

export default async function Home() {

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Full Viewport Hero Section - With Ethereal Shadow */}
      <section id="hero" className="relative w-full h-screen overflow-hidden">
        <EtherealShadow
          color="rgba(0, 0, 0, 0.8)"
          animation={{ scale: 100, speed: 90 }}
          noise={{ opacity: 1, scale: 1.2 }}
          sizing="fill"
          className="absolute inset-0"
        />
      </section>

      <main className="flex-1 w-full mx-auto px-4 flex flex-col gap-12 md:gap-16 items-center">{/* Content sections start here */}

        {/* Target Audience Section - moved above bento grid */}
        <section className="w-full max-w-5xl py-12 md:py-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-center mb-6">
            Build a multi-agentic AI Team <span className="italic font-light">in Minutes.</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto text-center mb-10">
            From lean startups to scaling teams, Atlas Agents gives you AI workers that eliminate busywork, reduce chaos, and move fast across your stack—so your people don't have to.
          </p>
          <div className="max-w-xl mx-auto space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-primary mt-1 shrink-0" />
              <div>
                <span className="font-semibold">No More Context-Switching</span><br />
                <span className="text-md text-muted-foreground">One prompt taps Slack, Notion, your CRM, and more—then executes. No copy-pasting. No bouncing tabs.</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-primary mt-1 shrink-0" />
              <div>
                <span className="font-semibold">10+ Hours Saved Weekly</span><br />
                <span className="text-md text-muted-foreground">AI agents prospect, triage, summarize, and update while your team focuses on high-leverage work.</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-primary mt-1 shrink-0" />
              <div>
                <span className="font-semibold">Workflows, Done Automatically</span><br />
                <span className="text-md text-muted-foreground">Spin up agents that handle complex, multi-step processes—what used to take a whole afternoon now takes seconds.</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-primary mt-1 shrink-0" />
              <div>
                <span className="font-semibold">Enterprise-Grade Security</span><br />
                <span className="text-md text-muted-foreground">SOC 2-ready. Role-based access. Full audit trails. Designed for trust from day one.</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-primary mt-1 shrink-0" />
              <div>
                <span className="font-semibold">Built to Scale with You</span><br />
                <span className="text-md text-muted-foreground">Start with one department. Expand to hundreds—no retraining, no retooling, just more agents doing more work.</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section (Bento Grid) */}
        <section id="features">
          <FeaturesSection />
        </section>

        {/* How It Works Section */}
        <section className="w-full max-w-6xl py-8 md:py-14 flex flex-col items-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-center mb-2">
            How Atlas Works <span className="italic font-light">Behind the Scenes</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto text-center mb-8">
            Atlas is powered by a smart Orchestrator Agent that runs on a secure Linux foundation. This agent connects all your tools—like Slack, Notion, files, and the web—so you can get real work done simply by asking. Every action is secure, compliant, and designed for your peace of mind.
          </p>
          <div className="flex flex-col lg:flex-row items-stretch gap-6 md:gap-8 w-full">
            {/* Left: Features Only */}
            <div className="flex-1 flex items-center justify-center min-w-0">
              <div className="flex flex-col gap-4 border border-border rounded-2xl bg-background/80 p-4 md:p-8 w-full h-full min-h-[320px] md:min-h-[380px] max-w-xl mx-auto justify-center">
                <div className="p-0 flex items-start gap-3">
                  <CheckCircle className="mt-1 shrink-0 text-foreground" size={22} strokeWidth={2.2} />
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Orchestrator Agent</h3>
                    <p className="text-muted-foreground">The brain of Atlas. It receives your requests and coordinates all the work, using advanced AI to choose the right tools for every job.</p>
                  </div>
                </div>
                <div className="p-0 flex items-start gap-3">
                  <CheckCircle className="mt-1 shrink-0 text-foreground" size={22} strokeWidth={2.2} />
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Modular Tools</h3>
                    <p className="text-muted-foreground">Atlas connects to a suite of tools: file management, web browsing, secure shell access, data search, and more. Each tool is specialized and works together seamlessly.</p>
                  </div>
                </div>
                <div className="p-0 flex items-start gap-3">
                  <CheckCircle className="mt-1 shrink-0 text-foreground" size={22} strokeWidth={2.2} />
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Secure & Compliant</h3>
                    <p className="text-muted-foreground">Every step is protected by enterprise security and SOC2 compliance. All actions are sandboxed and fully auditable.</p>
                  </div>
                </div>
                <div className="p-0 flex items-start gap-3">
                  <CheckCircle className="mt-1 shrink-0 text-foreground" size={22} strokeWidth={2.2} />
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Runs on Linux</h3>
                    <p className="text-muted-foreground">All automation and orchestration happens directly on a Linux kernel, ensuring speed, reliability, and flexibility for any workflow.</p>
                  </div>
                </div>
              </div>
            </div>
            {/* Right: Folder Animation */}
            <div className="flex-1 flex flex-col items-center justify-center border border-border rounded-2xl bg-background/80 shadow-sm p-4 md:p-8 min-h-[320px] md:min-h-[380px] max-w-xl w-full mx-auto">
              <InteractiveFolder
                color="#00d8ff"
                scale={1.3}
                items={[
                  <div key="worker1" className="flex flex-col items-center justify-center h-full w-full">
                    <span className="text-2xl">🧑‍💻</span>
                    <span className="text-muted-foreground text-xs text-center mt-1 max-w-[70px] whitespace-nowrap overflow-hidden text-ellipsis">Worker 1</span>
                  </div>,
                  <div key="worker2" className="flex flex-col items-center justify-center h-full w-full">
                    <span className="text-2xl">🤖</span>
                    <span className="text-muted-foreground text-xs text-center mt-1 max-w-[70px] whitespace-nowrap overflow-hidden text-ellipsis">Worker 2</span>
                  </div>,
                  <div key="worker3" className="flex flex-col items-center justify-center h-full w-full">
                    <span className="text-2xl">🛠️</span>
                    <span className="text-muted-foreground text-xs text-center mt-1 max-w-[70px] whitespace-nowrap overflow-hidden text-ellipsis">Worker 3</span>
                  </div>,
                ]}
              />
              <div className="text-center mt-4">
                <span className="italic text-muted-foreground text-base">Agents...</span>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Card Section - uses Card component, flush with footer, flat bottom edge */}
        <section className="w-full flex justify-center items-end my-12 mb-24 px-6 md:px-8">
          <div className="w-full max-w-6xl py-8 md:py-12 px-6 md:px-12 flex flex-col items-center">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
              Ready to Run Your Workflows on Autopilot?
            </h2>
            <p className="text-center text-muted-foreground mb-6 text-base md:text-lg font-normal max-w-3xl">
              Atlas connects all your tools and docs, then deploys AI agents to execute your workflows—no prompts, no context-switching, no busywork. Start in minutes and let agents handle the details, so you can focus on what matters.
            </p>
            <Button asChild variant="default" className="px-8 py-3 text-base md:text-lg font-semibold rounded-xl shadow-md">
              <Link href="/auth">Begin</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}

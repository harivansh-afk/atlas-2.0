import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Globe, Bot, Zap, Workflow, Plus, Lock, FileText, Scale } from 'lucide-react'
import Image from 'next/image'
import { SectionBadge } from '@/components/ui/section-badge'

export default function Features() {
    return (
        <section className="py-8 sm:py-12 md:py-16">
            <div className="mx-auto max-w-5xl px-4 sm:px-6">
                <SectionBadge>Features</SectionBadge>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-center mb-4 sm:mb-6">
                    AI Agents For Your <span className="italic font-light">Internal Ops</span>
                </h2>
                <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto text-center mb-8 sm:mb-10 px-2">
                    Use Atlas to execute on tasks from product management to GTM to customer support and more — fully autonomously
                </p>
                <div className="mx-auto grid gap-4 sm:gap-2 grid-cols-1 lg:grid-cols-15">
                    <Card className="group overflow-hidden shadow-zinc-950/5 lg:col-span-9 border border-border rounded-xl sm:rounded-2xl lg:rounded-none lg:rounded-tl-xl bg-background/80">
                        <div className="p-6 sm:p-8">
                            <h3 className="text-lg sm:text-xl md:text-2xl font-medium">Connect all your apps</h3>
                            <p className="text-muted-foreground mt-2 text-sm">Seamlessly integrate your favorite tools and services with our powerful connection system.</p>
                        </div>

                        <div className="relative mt-4 px-4 sm:px-6 pb-6">
                            <div className="absolute inset-x-0 bottom-6 h-32 sm:h-48 bg-gradient-to-t from-background to-transparent z-10"></div>
                            <div className="relative w-full overflow-hidden rounded-xl sm:rounded-2xl border">
                                <div className="aspect-[4/3]">
                                    <Image
                                        src="/mcp-dark.png"
                                        className="hidden dark:block w-full h-full object-cover object-top"
                                        alt="Connect apps illustration dark"
                                        fill
                                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 60vw"
                                        priority
                                    />
                                    <Image
                                        src="/mcp-light.png"
                                        className="block dark:hidden w-full h-full object-cover object-top"
                                        alt="Connect apps illustration light"
                                        fill
                                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 60vw"
                                        priority
                                    />
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="group overflow-hidden shadow-zinc-950/5 lg:col-span-6 border border-border rounded-xl sm:rounded-2xl lg:rounded-none lg:rounded-tr-xl bg-background/80">
                        <div className="p-6 sm:p-8">
                            <h3 className="text-lg sm:text-xl md:text-2xl font-medium">Build your agents</h3>
                            <p className="text-muted-foreground mt-2 text-sm">Create powerful AI agents tailored to your specific needs and workflows.</p>
                        </div>

                        <div className="relative mt-4 px-4 sm:px-6 pb-6">
                            <div className="absolute inset-x-0 bottom-6 h-32 sm:h-48 bg-gradient-to-t from-background/90 to-transparent z-10"></div>
                            <div className="relative w-full overflow-hidden rounded-xl sm:rounded-2xl border">
                                <div className="aspect-[3/4]">
                                    <Image
                                        src="/agent-builder-dark.png"
                                        className="hidden dark:block w-full h-full object-cover object-top"
                                        alt="Agent builder illustration dark"
                                        fill
                                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 40vw"
                                        priority
                                    />
                                    <Image
                                        src="/agent-builder-light.png"
                                        className="block dark:hidden w-full h-full object-cover object-top"
                                        alt="Agent builder illustration light"
                                        fill
                                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 40vw"
                                        priority
                                    />
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="group shadow-zinc-950/5 lg:col-span-6 border border-border rounded-xl sm:rounded-2xl lg:rounded-none bg-background/80">
                        <div className="p-6 sm:p-8">
                            <h3 className="text-lg sm:text-xl md:text-2xl font-medium">Start knocking out tasks</h3>
                            <p className="text-muted-foreground mt-2 text-sm">Personalized agents with the click of a button.</p>
                        </div>

                        <div className="px-4 sm:px-6 pb-8 sm:pb-12">
                            <div className="flex items-center justify-center gap-2">
                                <div className="inset-shadow-sm dark:inset-shadow-white/5 bg-muted/35 flex aspect-square size-12 sm:size-16 items-center justify-center rounded-[7px] border p-2 sm:p-3 shadow-lg ring dark:shadow-white/5 dark:ring-black">
                                    <span className="text-base sm:text-lg font-semibold">⌘</span>
                                </div>
                                <div className="inset-shadow-sm dark:inset-shadow-white/5 bg-muted/35 flex aspect-square size-12 sm:size-16 items-center justify-center rounded-[7px] border p-2 sm:p-3 shadow-lg ring dark:shadow-white/5 dark:ring-black">
                                    <span className="text-base sm:text-lg font-semibold">B</span>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="group relative shadow-zinc-950/5 lg:col-span-9 border border-border rounded-xl sm:rounded-2xl lg:rounded-none bg-background/80">
                        <div className="p-6 sm:p-8">
                            <h3 className="text-lg sm:text-xl md:text-2xl font-medium">140+ integrations supported</h3>
                            <p className="text-muted-foreground mt-2 text-sm">On board all of your internal tools with one click.</p>
                        </div>

                        <div className="px-4 sm:px-6 pb-8 sm:pb-12">
                            <div className="flex gap-2 sm:gap-4 lg:gap-6 items-center justify-center flex-wrap">
                                <div className="rounded-lg bg-muted/50 flex aspect-square size-12 sm:size-14 lg:size-16 items-center justify-center border p-2 sm:p-3 lg:p-4 hover:scale-105 transition-transform">
                                    <img
                                        className="m-auto size-6 sm:size-7 lg:size-8 invert dark:invert-0"
                                        src="https://oxymor-ns.tailus.io/logos/linear.svg"
                                        alt="Linear logo"
                                        width="32"
                                        height="32"
                                    />
                                </div>
                                <div className="rounded-lg bg-muted/50 flex aspect-square size-12 sm:size-14 lg:size-16 items-center justify-center border p-2 sm:p-3 lg:p-4 hover:scale-105 transition-transform">
                                    <img
                                        className="m-auto size-6 sm:size-7 lg:size-8"
                                        src="https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png"
                                        alt="Notion logo"
                                        width="32"
                                        height="32"
                                    />
                                </div>
                                <div className="rounded-lg bg-muted/50 flex aspect-square size-12 sm:size-14 lg:size-16 items-center justify-center border p-2 sm:p-3 lg:p-4 hover:scale-105 transition-transform">
                                    <img
                                        className="m-auto size-6 sm:size-7 lg:size-8 dark:invert"
                                        src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg"
                                        alt="GitHub logo"
                                        width="32"
                                        height="32"
                                    />
                                </div>
                                <div className="rounded-lg bg-muted/50 flex aspect-square size-12 sm:size-14 lg:size-16 items-center justify-center border p-2 sm:p-3 lg:p-4 hover:scale-105 transition-transform">
                                    <img
                                        className="m-auto size-6 sm:size-7 lg:size-8"
                                        src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/slack/slack-original.svg"
                                        alt="Slack logo"
                                        width="32"
                                        height="32"
                                    />
                                </div>
                                <div className="rounded-lg bg-muted/50 flex aspect-square size-12 sm:size-14 lg:size-16 items-center justify-center border p-2 sm:p-3 lg:p-4 hover:scale-105 transition-transform">
                                    <img
                                        className="m-auto size-6 sm:size-7 lg:size-8"
                                        src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg"
                                        alt="Google logo"
                                        width="32"
                                        height="32"
                                    />
                                </div>
                                <div className="rounded-lg bg-muted/50 flex aspect-square size-12 sm:size-14 lg:size-16 items-center justify-center border p-2 sm:p-3 lg:p-4 hover:scale-105 transition-transform">
                                    <Plus className="m-auto size-6 sm:size-7 lg:size-8 text-foreground" />
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="group overflow-hidden shadow-zinc-950/5 lg:col-span-5 border border-border rounded-xl sm:rounded-2xl lg:rounded-none lg:rounded-bl-xl bg-background/80">
                        <div className="p-6 sm:p-8">
                            <h3 className="text-lg sm:text-xl font-medium">SOC2 Security</h3>
                            <p className="text-muted-foreground mt-2 text-sm">Industry-leading encryption ensures your data is secure.</p>
                        </div>
                        <div className="px-4 sm:px-6 pb-8 sm:pb-12">
                            <div className="flex items-center justify-center">
                                <div className="rounded-lg bg-muted/50 flex aspect-square size-12 sm:size-16 items-center justify-center border p-3 sm:p-4">
                                    <Lock className="size-6 sm:size-8 text-foreground" />
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="group overflow-hidden shadow-zinc-950/5 lg:col-span-5 border border-border rounded-xl sm:rounded-2xl lg:rounded-none bg-background/80">
                        <div className="p-6 sm:p-8">
                            <h3 className="text-lg sm:text-xl font-medium">Run Thousands of Tasks</h3>
                            <p className="text-muted-foreground mt-2 text-sm">Boost efficiency and operations by 20x in hours.</p>
                        </div>
                        <div className="px-4 sm:px-6 pb-8 sm:pb-12">
                            <div className="flex items-center justify-center">
                                <div className="rounded-lg bg-muted/50 flex aspect-square size-12 sm:size-16 items-center justify-center border p-3 sm:p-4">
                                    <FileText className="size-6 sm:size-8 text-foreground" />
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="group overflow-hidden shadow-zinc-950/5 lg:col-span-5 border border-border rounded-xl sm:rounded-2xl lg:rounded-none lg:rounded-br-xl bg-background/80">
                        <div className="p-6 sm:p-8">
                            <h3 className="text-lg sm:text-xl font-medium">Scale Without Headcount</h3>
                            <p className="text-muted-foreground mt-2 text-sm">Just build more agents as your needs grow.</p>
                        </div>
                        <div className="px-4 sm:px-6 pb-8 sm:pb-12">
                            <div className="flex items-center justify-center">
                                <div className="rounded-lg bg-muted/50 flex aspect-square size-12 sm:size-16 items-center justify-center border p-3 sm:p-4">
                                    <Scale className="size-6 sm:size-8 text-foreground" />
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </section>
    )
}

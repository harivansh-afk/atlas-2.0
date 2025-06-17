import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Highlight } from '@/components/ui/hero-highlight'
import { HeroGifWithFallback } from '@/components/ui/hero-gif-with-fallback'

export default function HeroSectionFive() {
    return (
        <section className="py-16 md:py-20 lg:py-24 bg-background text-foreground">
            <div className="relative z-10 mx-auto w-full max-w-3xl px-6 lg:px-0">
                <div className="relative text-center">
                    <div className="mb-2 inline-flex items-center justify-center">
                        <HeroGifWithFallback
                            alt="Hero Animation"
                            width={80}
                            height={80}
                            className="rounded-[1.5rem] prominent-shadow"
                        />
                    </div>
                    <h1 className="mx-auto mt-2 max-w-2xl text-balance text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl text-neutral-900 dark:text-white">Automate Your Internal Ops <Highlight className="text-neutral-900 dark:text-white">At Scale</Highlight></h1>
                    <p className="text-muted-foreground mx-auto mb-6 mt-5 text-balance text-lg md:text-xl max-w-xl">Custom 10x AI Agents for all your tasks</p>

                    <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:*:w-auto">
                        <Button
                            asChild
                            variant="default"
                            size="lg"
                            className="px-8 py-3 text-base md:text-lg font-semibold rounded-xl button-prominent-shadow"
                        >
                            <Link href="/auth">
                                <span className="text-nowrap">Get Started</span>
                            </Link>
                        </Button>
                        <Button
                            asChild
                            variant="outline"
                            size="lg"
                            className="px-8 py-3 text-base md:text-lg font-semibold rounded-xl button-prominent-shadow hover:bg-neutral-100 dark:hover:bg-neutral-800"
                        >
                            <Link href="/cases">
                                <span className="text-nowrap">View Cases</span>
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="relative mx-auto mt-8 overflow-hidden rounded-3xl md:mt-12 max-w-5xl">
                    <div className="dark:hidden rounded-xl md:rounded-2xl overflow-hidden ring-1 ring-black/10 extra-prominent-shadow">
                        <Image
                            src="/hero-ui-light.png"
                            alt="App screen light mode"
                            width={2880}
                            height={1842}
                            className="object-contain w-full h-auto"
                            priority
                        />
                    </div>
                    <div className="hidden dark:block rounded-xl md:rounded-2xl overflow-hidden ring-1 ring-neutral-700/50 extra-prominent-shadow">
                        <Image
                            src="/hero-ui.png"
                            alt="App screen dark mode"
                            width={2880}
                            height={1842}
                            className="object-contain w-full h-auto"
                            priority
                        />
                    </div>
                    <img
                        src="https://images.unsplash.com/photo-1547623641-d2c56c03e2a7?q=80&w=3087&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                        alt="Decorative background"
                        className="absolute inset-0 size-full object-cover -z-10 opacity-10 dark:opacity-5"
                    />
                </div>

                <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 md:mt-16">
                    <p className="text-muted-foreground text-center text-sm sm:text-base w-full sm:w-auto mb-2 sm:mb-0">Trusted by teams at :</p>
                    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4 sm:gap-x-8">
                        <img
                            className="h-8 w-auto object-contain opacity-90 transition hover:opacity-100 filter grayscale brightness-0 dark:filter dark:grayscale dark:brightness-0 dark:invert"
                            src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/1280px-Amazon_logo.svg.png"
                            alt="Amazon Logo"
                        />
                        <img
                            className="h-10 w-auto object-contain opacity-90 transition hover:opacity-100 filter grayscale brightness-0 dark:filter dark:grayscale dark:brightness-0 dark:invert"
                            src="https://cdn.prod.website-files.com/679aad5af65da94e21f9992c/679c096939826730a9072c26_logo-transparent-png.png"
                            alt="Thnkr Logo"
                        />
                        <img
                            className="h-10 w-auto object-contain opacity-90 transition hover:opacity-100 filter grayscale brightness-0 dark:filter dark:grayscale dark:brightness-0 dark:invert"
                            src="https://onethingdigital.com/wp-content/uploads/2023/01/OTD_Logo-Dark.png"
                            alt="One Thing Digital Logo"
                        />
                        <img
                            className="h-10 w-auto object-contain opacity-90 transition hover:opacity-100 filter grayscale brightness-0 dark:filter dark:grayscale dark:brightness-0 dark:invert"
                            src="/phia.png"
                            alt="Phia Logo"
                        />
                        <img
                            className="h-12 w-auto object-contain opacity-90 transition hover:opacity-100 filter grayscale brightness-0 dark:filter dark:grayscale dark:brightness-0 dark:invert"
                            src="/collective.png"
                            alt="Esports Collective Logo"
                        />
                        <img
                            className="h-14 w-auto object-contain opacity-90 transition hover:opacity-100 dark:invert"
                            src="/leap-labs.png"
                            alt="Leap Labs Logo"
                        />
                    </div>
                </div>
            </div>
        </section>
    )
}

'use client'
import Link from 'next/link'
import { KortixLogo } from '@/components/sidebar/kortix-logo'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import React from 'react'
import { cn } from '@/lib/utils'

const menuItems = [
    { name: 'Features', href: '#features' },
    { name: 'Use Cases', href: '#use-cases' },
    { name: 'Integrations', href: '#integrations' },
    { name: 'Customers', href: '#testimonials' },
    { name: 'FAQ', href: '#faq' },
]

export const HeroHeader = () => {
    const [menuState, setMenuState] = React.useState(false)
    const [isScrolled, setIsScrolled] = React.useState(false)

    React.useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50)
        }
        window.addEventListener('scroll', handleScroll)
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setMenuState(false);
            }
        }
        window.addEventListener('resize', handleResize);
        handleResize();

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleResize);
        }
    }, [])
    return (
        <header className="fixed top-0 left-0 right-0 z-50 pt-4">
            <nav
                className="w-full px-2">
                <div className={cn(
                    'mx-auto max-w-6xl transition-all duration-300',
                    isScrolled || menuState
                        ? 'bg-background/80 dark:bg-neutral-900/80 max-w-5xl rounded-2xl border border-border/50 backdrop-blur-lg shadow-lg p-2 lg:p-3'
                        : 'bg-transparent max-w-6xl p-3 lg:p-4',
                )}>
                    <div className="relative flex flex-wrap items-center justify-between gap-6 lg:gap-0">
                        <div className="relative flex w-full items-center justify-between lg:w-auto">
                            <Link
                                href="/"
                                aria-label="home"
                                className="flex items-center space-x-2">
                                <KortixLogo size={32} />
                            </Link>

                            <button
                                onClick={() => setMenuState(!menuState)}
                                aria-label={menuState == true ? 'Close Menu' : 'Open Menu'}
                                className="relative z-20 -mr-2 block cursor-pointer p-2.5 lg:hidden text-foreground hover:text-accent-foreground">
                                {!menuState ? <Menu className="m-auto size-6" /> : <X className="m-auto size-6" />}
                            </button>
                        </div>

                        <div className="absolute inset-x-0 top-1/2 hidden -translate-y-1/2 transform items-center justify-center lg:flex">
                            <ul className="flex gap-x-6 xl:gap-x-8 text-sm font-medium">
                                {menuItems.map((item, index) => (
                                    <li key={index}>
                                        <Link
                                            href={item.href}
                                            className="text-muted-foreground hover:text-foreground block duration-150">
                                            <span>{item.name}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className={cn(
                            'w-full lg:w-fit lg:flex lg:items-center lg:justify-end',
                            menuState ? 'block animate-accordion-down mt-4 lg:mt-0' : 'hidden'
                        )}>
                            <div className={cn(
                                'bg-transparent rounded-3xl lg:bg-transparent',
                                menuState ? 'border border-border p-6 shadow-2xl shadow-zinc-900/10 dark:shadow-zinc-900/20 lg:border-transparent lg:p-0 lg:shadow-none' : ''
                            )}>
                                <div className="lg:hidden mb-6">
                                    <ul className="space-y-5 text-base font-medium">
                                        {menuItems.map((item, index) => (
                                            <li key={index}>
                                                <Link
                                                    href={item.href}
                                                    onClick={() => setMenuState(false)}
                                                    className="text-muted-foreground hover:text-foreground block duration-150">
                                                    <span>{item.name}</span>
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className={cn(
                                     "flex w-full flex-col space-y-3 sm:flex-row sm:justify-center sm:gap-3 sm:space-y-0 lg:w-fit",
                                     menuState && "pt-6 border-t border-border"
                                )}>
                                    <Button
                                        asChild
                                        className={cn(
                                            "w-full sm:w-auto button-prominent-shadow px-8 py-3 text-base md:text-lg font-semibold rounded-xl",
                                            isScrolled && !menuState ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-primary text-primary-foreground hover:bg-primary/90"
                                        )}
                                    >
                                        <Link href="/auth" className="inline-flex items-center justify-center">
                                            Begin
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
        </header>
    )
}

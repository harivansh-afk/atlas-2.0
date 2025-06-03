"use client"

import { SectionBadge } from '@/components/ui/section-badge'
import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

const faqData = [
    {
        question: "What is Atlas?",
        answer: "Atlas is an AI agent platform that connects to all your internal tools to help you get work done faster."
    },
    {
        question: "Do you offer a free plan?",
        answer: "Yes! Currently we offer a basic plan for early users and companies."
    },
    {
        question: "How does Atlas work?",
        answer: "After connecting to all your internal tools, we can search through them and execute on different tasks that you need to do between all the tools. This allows you to prompt our agents to get work done."
    },
    {
        question: "What support does Atlas provide?",
        answer: "We provide tailored, personalized support to all our customers via discord support channels directly with the founders."
    }
]

export default function FAQSection() {
    const [openItems, setOpenItems] = useState<number[]>([])

    const toggleItem = (index: number) => {
        setOpenItems(prev =>
            prev.includes(index)
                ? prev.filter(i => i !== index)
                : [...prev, index]
        )
    }

    return (
        <section id="faq">
            <div className="bg-background py-24 md:py-32">
                <div className="mx-auto max-w-4xl px-6">
                    <SectionBadge>FAQ</SectionBadge>
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-center mb-6">
                        Here are the answers to <span className="italic font-light">Your Questions</span>
                    </h2>
                    <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto text-center mb-16">
                        After reading this section, if you still have questions, feel free to reach out however you want.
                    </p>

                    <div className="space-y-4">
                        {faqData.map((item, index) => (
                            <div
                                key={index}
                                className="bg-muted/20 border border-border rounded-xl overflow-hidden"
                            >
                                <button
                                    onClick={() => toggleItem(index)}
                                    className="w-full p-6 text-left flex items-center justify-between hover:bg-muted/30 transition-colors"
                                >
                                    <h3 className="text-lg font-semibold">{item.question}</h3>
                                    {openItems.includes(index) ? (
                                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                                    ) : (
                                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                    )}
                                </button>
                                <div className={cn(
                                    "overflow-hidden transition-all duration-300 ease-in-out",
                                    openItems.includes(index) ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                                )}>
                                    <div className="px-6 pb-6 pt-0">
                                        <p className="text-muted-foreground leading-relaxed">
                                            {item.answer}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}

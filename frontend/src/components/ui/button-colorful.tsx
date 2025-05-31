import { Button, buttonVariants } from "@/components/ui/button";
import type { VariantProps } from 'class-variance-authority';
import { cn } from "@/lib/utils";
import { ArrowUpRight, Loader2 } from "lucide-react";
import * as React from 'react';

interface ButtonColorfulProps extends React.ComponentProps<typeof Button>, VariantProps<typeof buttonVariants> {
    label?: string;
    pending?: boolean;
    pendingText?: string;
}

export function ButtonColorful({
    className,
    label = "Join Waitlist",
    pending = false,
    pendingText = "Processing...",
    children,
    ...props
}: ButtonColorfulProps) {
    const content = pending ? (
        <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {pendingText}
        </>
    ) : (
        children ?? (
            <>
                {label}
            </>
        )
    );

    return (
        <Button
            className={cn(
                "relative h-10 px-4 overflow-hidden",
                "bg-zinc-100 hover:bg-zinc-50",
                "rounded-xl",
                "transition-all duration-200",
                "group disabled:opacity-70",
                className
            )}
            disabled={pending}
            {...props}
        >
            {/* Gradient background effect */}
            <div
                className={cn(
                    "absolute inset-0",
                    "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500",
                    "opacity-40 group-hover:opacity-80",
                    pending ? "opacity-40" : "group-hover:opacity-80",
                    "blur transition-opacity duration-500"
                )}
            />

            {/* Content */}
            <div className="relative flex items-center justify-center gap-2 text-zinc-900">
                {content}
            </div>
        </Button>
    );
}

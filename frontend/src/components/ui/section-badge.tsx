import { cn } from "@/lib/utils"

interface SectionBadgeProps {
    children: React.ReactNode
    className?: string
}

export function SectionBadge({ children, className }: SectionBadgeProps) {
    return (
        <div className="flex justify-center mb-8">
            <div className={cn(
                "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium",
                "bg-muted/50 text-muted-foreground border border-border/50",
                className
            )}>
                {children}
            </div>
        </div>
    )
}

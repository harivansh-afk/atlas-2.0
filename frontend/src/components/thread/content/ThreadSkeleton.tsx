import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import AnimatedLoadingSkeleton from '@/components/ui/animated-loading-skeleton';

interface ThreadSkeletonProps {
    isSidePanelOpen?: boolean;
    showHeader?: boolean;
    messageCount?: number;
}

export function ThreadSkeleton({
    isSidePanelOpen = false,
    showHeader = true,
    messageCount = 3,
}: ThreadSkeletonProps) {
    return (
        <div className="flex h-screen">
            <div
                className={`flex flex-col flex-1 overflow-hidden transition-all duration-200 ease-in-out`}
            >
                {/* Skeleton Header */}
                {showHeader && (
                    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                        <div className="flex h-14 items-center gap-4 px-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-6 w-6 rounded-full" />
                                    <Skeleton className="h-5 w-40" />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-8 w-8 rounded-full" />
                                <Skeleton className="h-8 w-8 rounded-full" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Animated Loading Content */}
                <div className="flex-1 overflow-y-auto flex items-center justify-center px-6 py-4 pb-[5.5rem]">
                    <AnimatedLoadingSkeleton variant="chat" />
                </div>
            </div>

            {/* Skeleton Side Panel (closed state) */}
            {isSidePanelOpen && (
                <div className="hidden sm:block">
                    <div className="h-screen w-[450px] border-l">
                        <div className="p-4">
                            <Skeleton className="h-8 w-32 mb-4" />
                            <Skeleton className="h-20 w-full rounded-md mb-4" />
                            <Skeleton className="h-40 w-full rounded-md" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

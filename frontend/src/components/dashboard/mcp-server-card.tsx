'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, Plus, Zap, Check } from 'lucide-react';
import { ComposioApp } from '@/types/composio';

interface MCPServerCardProps {
  app: ComposioApp;
  isConnected: boolean;
  isConnecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onViewTools?: () => void;
  isLoadingTools?: boolean;
}

export function MCPServerCard({
  app,
  isConnected,
  isConnecting,
  onConnect,
  onDisconnect,
  onViewTools,
  isLoadingTools = false
}: MCPServerCardProps) {
  return (
    <motion.div
      whileHover={{
        transition: { duration: 0.2, ease: "easeOut" }
      }}
      className="flex-shrink-0"
    >
      <Card
        className="w-44 h-14 cursor-pointer transition-all duration-200 hover:shadow-lg bg-muted/50 dark:bg-muted/30 border border-border"
        onClick={
          isConnected && onViewTools
            ? onViewTools
            : (!isConnected && !isConnecting ? onConnect : undefined)
        }
      >
        <CardContent className="px-3 h-full flex items-center justify-between">
          {/* Left: Icon + Text */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* App Icon - Icons fill the entire container */}
            <div className="w-7 h-7 flex-shrink-0 flex items-center justify-center bg-background border border-border rounded-md">
              {app.icon && app.icon.startsWith('http') ? (
                <img
                  src={app.icon}
                  alt={app.name}
                  className="w-7 h-7 object-contain rounded-md"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : null}

              {/* Fallback icon - Fill entire container */}
              <div
                className="w-7 h-7 flex items-center justify-center text-muted-foreground"
                style={{ display: app.icon && app.icon.startsWith('http') ? 'none' : 'flex' }}
              >
                {app.icon && !app.icon.startsWith('http') ? (
                  <span className="text-lg">{app.icon}</span>
                ) : (
                  <Zap className="h-6 w-6" />
                )}
              </div>
            </div>

            {/* App Text - Properly centered */}
            <div className="min-w-0 flex-1">
              <div className="font-medium text-sm text-foreground truncate leading-tight">
                {app.name}
              </div>
            </div>
          </div>

          {/* Right: Status/Actions - Properly centered */}
          <div className="flex items-center flex-shrink-0 ml-2">
            {isConnected ? (
              /* Connected state: Green check that becomes trash on hover, or loading spinner */
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDisconnect();
                }}
                className="h-7 w-7 p-0 rounded-full text-green-500 hover:text-destructive hover:bg-destructive/10 group"
                disabled={isLoadingTools}
              >
                {isLoadingTools ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Check className="h-4 w-4 group-hover:hidden" />
                    <Trash2 className="h-4 w-4 hidden group-hover:block" />
                  </>
                )}
              </Button>
            ) : (
              /* Connect button with plus icon and circular border */
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onConnect();
                }}
                disabled={isConnecting}
                className="h-7 w-7 p-0 rounded-full border-2 hover:border-primary/60 hover:bg-primary/5"
              >
                {isConnecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Loader2, CheckCircle2, Circle, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface MCPTool {
  name: string;
  description?: string;
  category?: string;
}

interface MCPToolSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  appKey: string;
  appName: string;
  appIcon?: string;
  tools: MCPTool[];
  onConfirm: (selectedTools: string[]) => void;
  isLoading?: boolean;
}

export function MCPToolSelectionModal({
  isOpen,
  onClose,
  appKey,
  appName,
  appIcon,
  tools,
  onConfirm,
  isLoading = false,
}: MCPToolSelectionModalProps) {
  const [selectedTools, setSelectedTools] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTools, setFilteredTools] = useState<MCPTool[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);

  // Initialize with all tools selected by default
  useEffect(() => {
    if (tools.length > 0) {
      setSelectedTools(new Set(tools.map(tool => tool.name)));
    }
  }, [tools]);

  // Filter tools based on search query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredTools(tools);
    } else {
      const filtered = tools.filter(tool =>
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredTools(filtered);
    }
  }, [tools, searchQuery]);

  const handleToolToggle = (toolName: string) => {
    setSelectedTools(prev => {
      const newSet = new Set(prev);
      if (newSet.has(toolName)) {
        newSet.delete(toolName);
      } else {
        newSet.add(toolName);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    setSelectedTools(new Set(filteredTools.map(tool => tool.name)));
  };

  const handleDeselectAll = () => {
    setSelectedTools(new Set());
  };

  const handleConfirm = async () => {
    if (selectedTools.size === 0) {
      toast.error("No tools selected", {
        description: "Please select at least one tool to continue.",
      });
      return;
    }

    setIsConnecting(true);
    try {
      await onConfirm(Array.from(selectedTools));
    } finally {
      setIsConnecting(false);
    }
  };

  const selectedCount = selectedTools.size;
  const filteredSelectedCount = filteredTools.filter(tool => selectedTools.has(tool.name)).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-muted border rounded-lg flex items-center justify-center overflow-hidden">
              {appIcon && appIcon.startsWith('http') ? (
                <img
                  src={appIcon}
                  alt={appName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-lg">
                  {appIcon || <Zap className="h-5 w-5 text-muted-foreground" />}
                </div>
              )}
              {/* Fallback icon (hidden by default) */}
              <div className="hidden">
                <Zap className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
            <div>
              <div className="text-lg font-semibold">Configure {appName}</div>
              <div className="text-sm text-muted-foreground font-normal">
                Select tools to enable for this integration
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 space-y-4">
          {/* Search and Controls */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  disabled={filteredSelectedCount === filteredTools.length}
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeselectAll}
                  disabled={filteredSelectedCount === 0}
                >
                  Deselect All
                </Button>
              </div>
            </div>
          </div>

          {/* Tools List */}
          <ScrollArea className="flex-1 border rounded-lg h-[400px]">
            <div className="p-4 space-y-2">
              {filteredTools.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? 'No tools match your search' : 'No tools available'}
                </div>
              ) : (
                <AnimatePresence>
                  {filteredTools.map((tool, index) => {
                    const isSelected = selectedTools.has(tool.name);
                    const isInitiateTool = tool.name.toLowerCase().includes('initiate');

                    return (
                      <motion.div
                        key={tool.name}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2, delay: index * 0.02 }}
                      >
                        <div
                          className={`cursor-pointer transition-all duration-200 p-3 rounded-lg border ${
                            isSelected
                              ? 'bg-muted border-foreground/20'
                              : 'hover:bg-muted/50 border-transparent'
                          }`}
                          onClick={() => handleToolToggle(tool.name)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                              {isSelected ? (
                                <CheckCircle2 className="h-4 w-4 text-foreground" />
                              ) : (
                                <Circle className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-sm text-foreground">
                                  {tool.name}
                                </h4>
                                {isInitiateTool && (
                                  <Badge variant="outline" className="text-xs">
                                    Auth
                                  </Badge>
                                )}
                                {tool.category && (
                                  <Badge variant="secondary" className="text-xs">
                                    {tool.category}
                                  </Badge>
                                )}
                              </div>
                              {tool.description && (
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                  {tool.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isConnecting}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isConnecting || selectedTools.size === 0}
            className="min-w-[120px]"
          >
            {isConnecting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Connecting...
              </>
            ) : (
              `Connect ${selectedCount} tools`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

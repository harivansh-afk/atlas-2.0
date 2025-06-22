'use client';

import React, { useState, useEffect } from 'react';
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
import { Search, Loader2, CheckCircle2, Circle } from 'lucide-react';
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
  tools: MCPTool[];
  onConfirm: (selectedTools: string[]) => void;
  isLoading?: boolean;
}

export function MCPToolSelectionModal({
  isOpen,
  onClose,
  appKey,
  appName,
  tools,
  onConfirm,
  isLoading = false,
}: MCPToolSelectionModalProps) {
  const [selectedTools, setSelectedTools] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTools, setFilteredTools] = useState<MCPTool[]>([]);

  // Initialize with all tools selected by default
  useEffect(() => {
    if (tools.length > 0) {
      setSelectedTools(new Set(tools.map(tool => tool.name)));
    }
  }, [tools]);

  // Filter tools based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTools(tools);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredTools(
        tools.filter(tool =>
          tool.name.toLowerCase().includes(query) ||
          tool.description?.toLowerCase().includes(query)
        )
      );
    }
  }, [tools, searchQuery]);

  const handleToolToggle = (toolName: string) => {
    const newSelected = new Set(selectedTools);
    if (newSelected.has(toolName)) {
      newSelected.delete(toolName);
    } else {
      newSelected.add(toolName);
    }
    setSelectedTools(newSelected);
  };

  const handleSelectAll = () => {
    setSelectedTools(new Set(filteredTools.map(tool => tool.name)));
  };

  const handleDeselectAll = () => {
    setSelectedTools(new Set());
  };

  const handleConfirm = () => {
    const selectedToolNames = Array.from(selectedTools);
    
    if (selectedToolNames.length === 0) {
      toast.error('Please select at least one tool to continue');
      return;
    }

    onConfirm(selectedToolNames);
  };

  const selectedCount = selectedTools.size;
  const totalCount = tools.length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
              <span className="text-sm font-semibold text-indigo-600">
                {appName.charAt(0).toUpperCase()}
              </span>
            </div>
            Select {appName} Tools
          </DialogTitle>
          <DialogDescription>
            Choose which tools you want to enable for {appName}. All tools are selected by default.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 min-h-0">
          {/* Search and Stats */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Badge variant="secondary" className="whitespace-nowrap">
              {selectedCount} of {totalCount} selected
            </Badge>
          </div>

          {/* Select All/None Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              disabled={selectedCount === filteredTools.length}
            >
              Select All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeselectAll}
              disabled={selectedCount === 0}
            >
              Deselect All
            </Button>
          </div>

          {/* Tools List */}
          <ScrollArea className="flex-1 border rounded-lg">
            <div className="p-4 space-y-3">
              {filteredTools.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchQuery ? 'No tools match your search' : 'No tools available'}
                </div>
              ) : (
                filteredTools.map((tool) => {
                  const isSelected = selectedTools.has(tool.name);
                  const isInitiateTool = tool.name.toLowerCase().includes('initiate');
                  
                  return (
                    <div
                      key={tool.name}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        isSelected 
                          ? 'bg-indigo-50 border-indigo-200' 
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => handleToolToggle(tool.name)}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {isSelected ? (
                          <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm text-gray-900 truncate">
                            {tool.name}
                          </h4>
                          {isInitiateTool && (
                            <Badge variant="secondary" className="text-xs">
                              Auth Required
                            </Badge>
                          )}
                        </div>
                        {tool.description && (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {tool.description}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="flex items-center justify-between">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={isLoading || selectedCount === 0}
            className="min-w-[120px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              `Continue with ${selectedCount} tools`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

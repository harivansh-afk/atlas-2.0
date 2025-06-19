import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle2, Zap, Globe, Code, ChevronRight, Sparkles, Database, Wifi, Server, Play } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

interface CustomMCPDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (config: CustomMCPConfiguration) => void;
}

interface CustomMCPConfiguration {
  name: string;
  type: 'http' | 'sse';
  config: any;
  enabledTools: string[];
}

interface MCPTool {
  name: string;
  description: string;
  inputSchema?: any;
}

export const CustomMCPDialog: React.FC<CustomMCPDialogProps> = ({
  open,
  onOpenChange,
  onSave
}) => {
  const [step, setStep] = useState<'setup' | 'tools'>('setup');
  const [serverType, setServerType] = useState<'http' | 'sse'>('sse');
  const [configText, setConfigText] = useState('');
  const [serverName, setServerName] = useState('');
  const [manualServerName, setManualServerName] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [discoveredTools, setDiscoveredTools] = useState<MCPTool[]>([]);
  const [selectedTools, setSelectedTools] = useState<Set<string>>(new Set());
  const [processedConfig, setProcessedConfig] = useState<any>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [hasVideoBeenPlayed, setHasVideoBeenPlayed] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const validateAndDiscoverTools = async () => {
    setIsValidating(true);
    setValidationError(null);
    setDiscoveredTools([]);

    try {
      let parsedConfig: any;

      if (serverType === 'sse' || serverType === 'http') {
        const url = configText.trim();
        if (!url) {
          throw new Error('Please enter the connection URL.');
        }
        if (!manualServerName.trim()) {
          throw new Error('Please enter a name for this connection.');
        }

        parsedConfig = { url };
        setServerName(manualServerName.trim());
      }

      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('You must be logged in to discover tools');
      }

      const response = await fetch(`${API_URL}/mcp/discover-custom-tools`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          type: serverType,
          config: parsedConfig
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to connect to the service. Please check your configuration.');
      }

      const data = await response.json();

      if (!data.tools || data.tools.length === 0) {
        throw new Error('No tools found. Please check your configuration.');
      }

      if (data.serverName) {
        setServerName(data.serverName);
      }

      if (data.processedConfig) {
        setProcessedConfig(data.processedConfig);
      }

      setDiscoveredTools(data.tools);
      setSelectedTools(new Set(data.tools.map((tool: MCPTool) => tool.name)));
      setStep('tools');

    } catch (error: any) {
      setValidationError(error.message);
    } finally {
      setIsValidating(false);
    }
  };

  const handleSave = () => {
    if (discoveredTools.length === 0 || selectedTools.size === 0) {
      setValidationError('Please select at least one tool to continue.');
      return;
    }

    if (!serverName.trim()) {
      setValidationError('Please provide a name for this connection.');
      return;
    }

    try {
      let configToSave: any = { url: configText.trim() };

      onSave({
        name: serverName,
        type: serverType,
        config: configToSave,
        enabledTools: Array.from(selectedTools)
      });

      setConfigText('');
      setManualServerName('');
      setDiscoveredTools([]);
      setSelectedTools(new Set());
      setServerName('');
      setProcessedConfig(null);
      setValidationError(null);
      setStep('setup');
      onOpenChange(false);
    } catch (error) {
      setValidationError('Invalid configuration format.');
    }
  };

  const handleToolToggle = (toolName: string) => {
    const newTools = new Set(selectedTools);
    if (newTools.has(toolName)) {
      newTools.delete(toolName);
    } else {
      newTools.add(toolName);
    }
    setSelectedTools(newTools);
  };

  const handleBack = () => {
    setStep('setup');
    setValidationError(null);
  };

  const handleReset = () => {
    setConfigText('');
    setManualServerName('');
    setDiscoveredTools([]);
    setSelectedTools(new Set());
    setServerName('');
    setProcessedConfig(null);
    setValidationError(null);
    setStep('setup');
    setIsVideoPlaying(false);
    setHasVideoBeenPlayed(false);
  };

  const exampleConfigs = {
    http: `https://server.example.com/mcp`,
    sse: `https://mcp.composio.dev/partner/composio/gmail/sse?customerId=YOUR_CUSTOMER_ID`
  };

  const handleVideoPlay = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
        setIsVideoPlaying(false);
      } else {
        setIsVideoPlaying(true);
        setHasVideoBeenPlayed(true);
        // Small delay to ensure state updates before playing
        setTimeout(() => {
          videoRef.current?.play();
        }, 50);
      }
    }
  };

  const handleVideoPlayEvent = () => {
    setIsVideoPlaying(true);
  };

  const handleVideoPauseEvent = () => {
    setIsVideoPlaying(false);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) handleReset();
    }}>
      <DialogContent className="max-w-7xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <DialogTitle>Connect New Service</DialogTitle>
          </div>
          <DialogDescription>
            {step === 'setup'
              ? 'Connect to external services to expand your capabilities with new tools and integrations.'
              : 'Choose which tools you\'d like to enable from this service connection.'
            }
          </DialogDescription>
          <div className="flex items-center gap-2 pt-2">
            <div className={cn(
              "flex items-center gap-2 text-sm font-medium",
              step === 'setup' ? "text-primary" : "text-muted-foreground"
            )}>
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs",
                step === 'setup' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                1
              </div>
              Setup Connection
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <div className={cn(
              "flex items-center gap-2 text-sm font-medium",
              step === 'tools' ? "text-primary" : "text-muted-foreground"
            )}>
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs",
                step === 'tools' ? "bg-primary text-primary-foreground" : "bg-muted-foreground/20 text-muted-foreground"
              )}>
                2
              </div>
              Select Tools
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="grid grid-cols-2 gap-6 flex-1 overflow-hidden">
            {/* Left Column - Form Content */}
            <div className="flex flex-col h-full">
              <div className="flex-1 min-h-0 overflow-y-auto">
                {step === 'setup' ? (
                  <div className="space-y-6 p-1 flex-1">
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <Label className="text-base font-medium">How would you like to connect?</Label>
                        <RadioGroup
                          value={serverType}
                          onValueChange={(value: 'http' | 'sse') => setServerType(value)}
                          className="grid grid-cols-1 gap-3"
                        >
                          <div className={cn(
                            "flex items-start space-x-3 p-4 rounded-lg border cursor-pointer transition-all hover:bg-muted/50",
                            serverType === 'http' ? "border-primary bg-primary/5" : "border-border"
                          )}>
                            <RadioGroupItem value="http" id="http" className="mt-1" />
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <Server className="h-4 w-4 text-primary" />
                                <Label htmlFor="http" className="text-base font-medium cursor-pointer">
                                  Streamable HTTP
                                </Label>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Standard streamable HTTP connection
                              </p>
                            </div>
                          </div>
                          <div className={cn(
                            "flex items-start space-x-3 p-4 rounded-lg border cursor-pointer transition-all hover:bg-muted/50",
                            serverType === 'sse' ? "border-primary bg-primary/5" : "border-border"
                          )}>
                            <RadioGroupItem value="sse" id="sse" className="mt-1" />
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <Wifi className="h-4 w-4 text-primary" />
                                <Label htmlFor="sse" className="text-base font-medium cursor-pointer">
                                  SSE (Server-Sent Events)
                                </Label>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Real-time connection using Server-Sent Events for streaming updates
                              </p>
                            </div>
                          </div>
                        </RadioGroup>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="serverName" className="text-base font-medium">
                          Connection Name
                        </Label>
                        <input
                          id="serverName"
                          type="text"
                          placeholder="e.g., Gmail, Slack, Customer Support Tools"
                          value={manualServerName}
                          onChange={(e) => setManualServerName(e.target.value)}
                          className="w-full px-4 py-3 border border-input bg-background rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                        />
                        <p className="text-sm text-muted-foreground">
                          Give this connection a memorable name
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-4">
                          <Label htmlFor="config" className="text-base font-medium">
                            Connection URL
                          </Label>
                          <Button
                            onClick={() => window.open('https://mcp.composio.dev', '_blank')}
                            className="px-4 py-2 text-sm font-medium transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95 disabled:hover:scale-100 disabled:hover:shadow-none w-fit bg-white text-black border border-gray-300 hover:bg-gray-50"
                          >
                            get connection URL
                          </Button>
                        </div>
                        <Input
                            id="config"
                            type="url"
                            placeholder={exampleConfigs[serverType]}
                            value={configText}
                            onChange={(e) => setConfigText(e.target.value)}
                            className="w-full px-4 py-3 border border-input bg-muted rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent font-mono"
                          />
                        <p className="text-sm text-muted-foreground">
                          Paste the complete connection URL provided by your service
                        </p>
                      </div>
                    </div>

                    {validationError && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{validationError}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6 p-1 flex-1 flex flex-col">
                    <Alert className="border-green-200 bg-green-50 text-green-800">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <div className="ml-2">
                        <h3 className="font-medium text-green-900 mb-1">
                          Connection Successful!
                        </h3>
                        <p className="text-sm text-green-700">
                          Found {discoveredTools.length} available tools from <strong>{serverName}</strong>
                        </p>
                      </div>
                    </Alert>

                    <div className="space-y-4 flex-1 flex flex-col">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-base font-medium">Available Tools</h3>
                          <p className="text-sm text-muted-foreground">
                            Select the tools you want to enable
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (selectedTools.size === discoveredTools.length) {
                              setSelectedTools(new Set());
                            } else {
                              setSelectedTools(new Set(discoveredTools.map(t => t.name)));
                            }
                          }}
                        >
                          {selectedTools.size === discoveredTools.length ? 'Deselect All' : 'Select All'}
                        </Button>
                      </div>

                      <div className="flex-1 min-h-0">
                        <ScrollArea className="h-full max-h-[300px] border border-border rounded-lg">
                          <div className="space-y-3 p-4">
                            {discoveredTools.map((tool) => (
                              <div
                                key={tool.name}
                                className={cn(
                                  "flex items-start space-x-3 p-4 rounded-lg border transition-all cursor-pointer hover:bg-muted/50",
                                  selectedTools.has(tool.name)
                                    ? "border-primary bg-primary/5"
                                    : "border-border"
                                )}
                                onClick={() => handleToolToggle(tool.name)}
                              >
                                <Checkbox
                                  id={tool.name}
                                  checked={selectedTools.has(tool.name)}
                                  onCheckedChange={() => handleToolToggle(tool.name)}
                                  className="mt-1"
                                />
                                <div className="flex-1 space-y-2 min-w-0">
                                  <Label
                                    htmlFor={tool.name}
                                    className="text-base font-medium cursor-pointer block"
                                  >
                                    {tool.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                  </Label>
                                  {tool.description && (
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                      {tool.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    </div>

                    {validationError && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{validationError}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </div>

              {/* Footer buttons - Left column only */}
              <div className="pt-4 border-t flex-shrink-0">
                {step === 'tools' ? (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleBack}>
                      Back
                    </Button>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={selectedTools.size === 0}
                    >
                      Add Connection ({selectedTools.size} tools)
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={validateAndDiscoverTools}
                      disabled={!configText.trim() || !manualServerName.trim() || isValidating}
                    >
                      {isValidating ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Discovering tools...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-5 w-5" />
                          Connect
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>

                                                {/* Right Column - Video Only */}
            <div className="bg-black rounded-lg overflow-hidden relative h-full min-h-[400px]">
              {/* Fixed aspect ratio container */}
              <div className="relative w-full h-full">
                                {/* Thumbnail image - only shows initially before video has been played */}
                {!hasVideoBeenPlayed && (
                  <div
                    className="absolute inset-0 bg-contain bg-center bg-no-repeat flex items-center justify-center"
                    style={{ backgroundImage: 'url(/tutorial.png)' }}
                  />
                )}

                {/* Video element - hidden initially, always visible after first play */}
                <video
                  ref={videoRef}
                  className={`w-full h-full object-cover transition-opacity duration-300 ${hasVideoBeenPlayed ? 'opacity-100' : 'opacity-0'}`}
                  controls={hasVideoBeenPlayed}
                  preload="metadata"
                  playsInline
                  onPlay={handleVideoPlayEvent}
                  onPause={handleVideoPauseEvent}
                  onEnded={() => setIsVideoPlaying(false)}
                >
                  <source src="/how_to.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>

                {/* Play button overlay - only shows initially before video has been played */}
                {!hasVideoBeenPlayed && (
                  <div className="absolute inset-0 flex items-center justify-center cursor-pointer z-20" onClick={handleVideoPlay}>
                    <div className="p-6 bg-white bg-opacity-90 rounded-full shadow-lg hover:bg-opacity-100 transition-all duration-200 hover:scale-110">
                      <Play className="h-12 w-12 text-gray-800 fill-current" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

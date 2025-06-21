/**
 * Composio Tool Selection Test Component
 *
 * Simple UI for testing the complete Composio MCP tool discovery and selection flow
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, CheckCircle, XCircle, Search, Settings, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

interface Tool {
  name: string;
  description?: string;
  inputSchema?: any;
}

interface TestStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
  data?: any;
}

export const ComposioToolSelectionTest: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [steps, setSteps] = useState<TestStep[]>([
    { id: 'create', name: 'Create Gmail Connection', status: 'pending' },
    { id: 'discover', name: 'Discover Available Tools', status: 'pending' },
    { id: 'select', name: 'Select Tools', status: 'pending' },
    { id: 'update', name: 'Update Tool Selection', status: 'pending' },
    { id: 'initiate', name: 'Initiate Authentication', status: 'pending' },
    { id: 'verify', name: 'Verify in Database', status: 'pending' },
  ]);

  const [discoveredTools, setDiscoveredTools] = useState<Tool[]>([]);
  const [selectedTools, setSelectedTools] = useState<Set<string>>(new Set());
  const [mcpUrl, setMcpUrl] = useState<string>('');
  const [redirectUrl, setRedirectUrl] = useState<string>('');

  const updateStep = (stepId: string, status: TestStep['status'], message?: string, data?: any) => {
    setSteps(prev => prev.map(step =>
      step.id === stepId ? { ...step, status, message, data } : step
    ));
  };

  const getStepIcon = (status: TestStep['status']) => {
    switch (status) {
      case 'pending':
        return <div className="w-4 h-4 rounded-full border-2 border-muted-foreground" />;
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const runCompleteTest = async () => {
    setIsRunning(true);
    setCurrentStep('create');

    // Define API_URL at the top so it's available in all try blocks
    const API_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || '').replace(/\/api$/, '');

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast.error('Please sign in to run tests');
        return;
      }

      // Step 1: Create Gmail Connection
      updateStep('create', 'running');
      try {
        const createResponse = await fetch(`${API_URL}/api/composio-mcp/create-connection`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ app_key: 'gmail' })
        });

        if (!createResponse.ok) {
          throw new Error('Failed to create connection');
        }

        const createData = await createResponse.json();
        setMcpUrl(createData.mcp_url || '');
        updateStep('create', 'success', `Connection created: ${createData.qualified_name}`, createData);
        toast.success('Gmail connection created!');
      } catch (error) {
        updateStep('create', 'error', `Failed: ${error}`);
        toast.error('Failed to create connection');
        return;
      }

      // Step 2: Discover Tools
      setCurrentStep('discover');
      updateStep('discover', 'running');
      try {
        const discoverResponse = await fetch(`${API_URL}/api/composio-mcp/discover-tools`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ app_key: 'gmail' })
        });

        if (!discoverResponse.ok) {
          throw new Error('Failed to discover tools');
        }

        const discoverData = await discoverResponse.json();
        const tools = discoverData.tools || [];
        setDiscoveredTools(tools);

        // Auto-select first 3 tools for testing
        const autoSelected = new Set<string>(tools.slice(0, 3).map((t: Tool) => t.name));
        setSelectedTools(autoSelected);

        updateStep('discover', 'success', `Discovered ${tools.length} tools`, { tools, count: tools.length });
        toast.success(`Discovered ${tools.length} tools!`);
      } catch (error) {
        updateStep('discover', 'error', `Failed: ${error}`);
        toast.error('Failed to discover tools');
        return;
      }

      // Step 3: Select Tools (UI step - already done above)
      setCurrentStep('select');
      updateStep('select', 'success', `Selected ${selectedTools.size} tools: ${Array.from(selectedTools).join(', ')}`);

      // Step 4: Update Tool Selection
      setCurrentStep('update');
      updateStep('update', 'running');
      try {
        const updateResponse = await fetch(`${API_URL}/api/composio-mcp/update-tools`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            app_key: 'gmail',
            selected_tools: Array.from(selectedTools)
          })
        });

        if (!updateResponse.ok) {
          throw new Error('Failed to update tools');
        }

        const updateData = await updateResponse.json();
        updateStep('update', 'success', `Updated ${updateData.enabled_tools?.length || 0} enabled tools`, updateData);
        toast.success('Tool selection updated!');
      } catch (error) {
        updateStep('update', 'error', `Failed: ${error}`);
        toast.error('Failed to update tool selection');
        return;
      }

      // Step 5: Initiate Authentication
      setCurrentStep('initiate');
      updateStep('initiate', 'running');
      try {
        const initiateResponse = await fetch(`${API_URL}/api/composio-mcp/initiate-auth`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ app_key: 'gmail' })
        });

        if (!initiateResponse.ok) {
          throw new Error('Failed to initiate authentication');
        }

        const initiateData = await initiateResponse.json();
        if (initiateData.success && initiateData.redirect_url) {
          setRedirectUrl(initiateData.redirect_url);
          updateStep('initiate', 'success', `Auth URL generated: ${initiateData.redirect_url}`, initiateData);
          toast.success('Authentication URL generated! Click to open in new tab.');
        } else {
          throw new Error(initiateData.error || 'No redirect URL received');
        }
      } catch (error) {
        updateStep('initiate', 'error', `Failed: ${error}`);
        toast.error('Failed to initiate authentication');
        return;
      }

      // Step 6: Verify in Database
      setCurrentStep('verify');
      updateStep('verify', 'running');
      try {
        const { data: defaultAgent, error } = await supabase
          .from('agents')
          .select('agent_id, name, custom_mcps, is_default')
          .eq('is_default', true)
          .single();

        if (error) {
          throw new Error(`Database query failed: ${error.message}`);
        }

        const customMcps = defaultAgent?.custom_mcps || [];
        const gmailMcp = customMcps.find((mcp: any) =>
          mcp.type === 'http' && mcp.name?.toLowerCase() === 'gmail'
        );

        if (gmailMcp && gmailMcp.enabledTools) {
          updateStep('verify', 'success', `Verified: ${gmailMcp.enabledTools.length} tools enabled in database`, {
            agent_id: defaultAgent.agent_id,
            enabled_tools: gmailMcp.enabledTools,
            mcp_config: gmailMcp
          });
          toast.success('Database verification successful!');
        } else {
          updateStep('verify', 'error', 'Gmail MCP not found in default agent or no enabled tools');
          toast.error('Database verification failed');
        }
      } catch (error) {
        updateStep('verify', 'error', `Failed: ${error}`);
        toast.error('Database verification failed');
      }

    } catch (error) {
      toast.error(`Test failed: ${error}`);
    } finally {
      setIsRunning(false);
      setCurrentStep(null);
    }
  };

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Complete 1-Click Authentication Test</h3>
          <p className="text-sm text-muted-foreground">
            Test the complete flow: Create connection → Discover tools → Select tools → Update selection → Initiate auth → Get redirect URL
          </p>
        </div>
        <Button
          onClick={runCompleteTest}
          disabled={isRunning}
          className="flex items-center gap-2"
        >
          {isRunning ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Zap className="h-4 w-4" />
          )}
          {isRunning ? 'Running Test...' : 'Run Complete Test'}
        </Button>
      </div>

      {/* Test Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Test Progress</CardTitle>
          <CardDescription>
            Follow the complete 1-click authentication flow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {steps.map((step) => (
              <div key={step.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="flex items-center gap-3 flex-1">
                  {getStepIcon(step.status)}
                  <div>
                    <p className="font-medium">{step.name}</p>
                    {step.message && (
                      <p className="text-sm text-muted-foreground">{step.message}</p>
                    )}
                  </div>
                </div>
                <Badge variant={
                  step.status === 'success' ? 'default' :
                  step.status === 'error' ? 'destructive' :
                  step.status === 'running' ? 'secondary' : 'outline'
                }>
                  {step.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tool Selection */}
      {discoveredTools.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Discovered Tools ({discoveredTools.length})</CardTitle>
            <CardDescription>
              Select which tools to enable for the Gmail MCP connection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64 border rounded-lg p-4">
              <div className="space-y-3">
                {discoveredTools.map((tool) => (
                  <div
                    key={tool.name}
                    className="flex items-start space-x-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50"
                    onClick={() => handleToolToggle(tool.name)}
                  >
                    <Checkbox
                      checked={selectedTools.has(tool.name)}
                      onCheckedChange={() => handleToolToggle(tool.name)}
                      className="mt-1"
                    />
                    <div className="flex-1 space-y-1">
                      <p className="font-medium">{tool.name}</p>
                      {tool.description && (
                        <p className="text-sm text-muted-foreground">{tool.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm">
                <strong>Selected:</strong> {selectedTools.size} tools
                {selectedTools.size > 0 && (
                  <span className="ml-2 text-muted-foreground">
                    ({Array.from(selectedTools).join(', ')})
                  </span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Summary */}
      {steps.some(s => s.status === 'success' && s.data) && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>
              Summary of the test execution and database state
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mcpUrl && (
                <div>
                  <p className="text-sm font-medium">MCP URL:</p>
                  <code className="text-xs bg-muted p-2 rounded block break-all">{mcpUrl}</code>
                </div>
              )}

              {redirectUrl && (
                <div>
                  <p className="text-sm font-medium">Authentication URL:</p>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-xs bg-muted p-2 rounded block break-all flex-1">{redirectUrl}</code>
                    <Button
                      size="sm"
                      onClick={() => window.open(redirectUrl, '_blank')}
                      className="shrink-0"
                    >
                      Open Auth
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Click "Open Auth" to complete the authentication in a new tab
                  </p>
                </div>
              )}

              {steps.find(s => s.id === 'verify' && s.data) && (
                <div>
                  <p className="text-sm font-medium">Database Verification:</p>
                  <div className="text-sm space-y-1 mt-1">
                    <p>Agent ID: <code>{steps.find(s => s.id === 'verify')?.data?.agent_id}</code></p>
                    <p>Enabled Tools: <code>{steps.find(s => s.id === 'verify')?.data?.enabled_tools?.join(', ')}</code></p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

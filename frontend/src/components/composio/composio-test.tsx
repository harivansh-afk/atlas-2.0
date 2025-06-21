/**
 * Composio MCP Integration Test Component
 *
 * This component provides a simple interface to test the Composio MCP backend
 * integration and verify that all API endpoints are working correctly.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, RefreshCw, Zap } from 'lucide-react';
import { ComposioMCPService } from '@/lib/composio-api';
import { ComposioApp, ComposioConnection, ComposioHealthResponse } from '@/types/composio';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message?: string;
  data?: any;
}

export const ComposioTest: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [supportedApps, setSupportedApps] = useState<ComposioApp[]>([]);
  const [userConnections, setUserConnections] = useState<ComposioConnection[]>([]);
  const [healthStatus, setHealthStatus] = useState<ComposioHealthResponse | null>(null);

  const tests: TestResult[] = [
    { name: 'Health Check', status: 'pending' },
    { name: 'Get Supported Apps', status: 'pending' },
    { name: 'Check Default Agent Exists', status: 'pending' },
    { name: 'Create Test Connection (Gmail)', status: 'pending' },
    { name: 'Discover Available Tools', status: 'pending' },
    { name: 'Select and Update Tools', status: 'pending' },
    { name: 'Verify Tool Selection in Default Agent', status: 'pending' },
    { name: 'Keep Connection for Supabase Inspection', status: 'pending' },
  ];

  const [currentTests, setCurrentTests] = useState<TestResult[]>(tests);
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  const updateTestResult = (index: number, status: TestResult['status'], message?: string, data?: any) => {
    setCurrentTests(prev => prev.map((test, i) =>
      i === index ? { ...test, status, message, data } : test
    ));
  };

  const runTests = async () => {
    setIsRunning(true);
    setCurrentTests(tests.map(test => ({ ...test, status: 'pending' })));

    try {
      // Debug: Check authentication
      console.log('🔐 Checking authentication...');
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Current session:', session ? 'Authenticated' : 'Not authenticated');
      console.log('User ID:', session?.user?.id);

      if (!session) {
        toast.error('Not authenticated - please sign in first');
        return;
      }
      // Test 1: Health Check
      console.log('🔍 Running health check...');
      try {
        const health = await ComposioMCPService.healthCheck();
        setHealthStatus(health);
        updateTestResult(0, 'success', `Service: ${health.service} v${health.version}`, health);
        toast.success('Health check passed!');
      } catch (error) {
        updateTestResult(0, 'error', `Health check failed: ${error}`);
        toast.error('Health check failed');
      }

      // Test 2: Get Supported Apps
      console.log('📱 Fetching supported apps...');
      try {
        const apps = await ComposioMCPService.getSupportedApps();
        setSupportedApps(apps);
        updateTestResult(1, 'success', `Found ${apps.length} supported apps`, apps);
        toast.success(`Loaded ${apps.length} supported apps`);
      } catch (error) {
        updateTestResult(1, 'error', `Failed to fetch apps: ${error}`);
        toast.error('Failed to fetch supported apps');
      }

      // Test 3: Check Default Agent Exists
      console.log('🤖 Checking default agent...');
      try {
        const { data: defaultAgent, error } = await supabase
          .from('agents')
          .select('agent_id, name, custom_mcps, is_default')
          .eq('is_default', true)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          throw error;
        }

        if (defaultAgent) {
          updateTestResult(2, 'success', `Default agent found: ${defaultAgent.name} (${defaultAgent.custom_mcps?.length || 0} custom MCPs)`, defaultAgent);
          toast.success('Default agent exists');
        } else {
          updateTestResult(2, 'success', 'No default agent found - will be created during connection creation');
          toast.info('Default agent will be auto-created');
        }
      } catch (error) {
        updateTestResult(2, 'error', `Failed to check default agent: ${error}`);
        toast.error('Failed to check default agent');
      }

      // Test 4: Create Test Connection (Gmail) - Now stores in default agent
      console.log('➕ Creating test connection for Gmail (will store as HTTP MCP in default agent)...');
      let testConnection: ComposioConnection | null = null;
      try {
        testConnection = await ComposioMCPService.createConnection('gmail');
        console.log('Created connection details:', testConnection);
        updateTestResult(3, 'success', `Created connection: ${testConnection.qualified_name} (MCP URL: ${testConnection.mcp_url})`, testConnection);
        toast.success('Test connection created and stored in default agent!');
      } catch (error) {
        console.error('Create connection error details:', error);
        updateTestResult(3, 'error', `Failed to create connection: ${error}`);
        toast.error('Failed to create test connection');
      }

      // Test 5: Discover Available Tools
      console.log('🔍 Discovering available tools from Gmail MCP...');
      let discoveredTools: any[] = [];
      try {
        const API_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || '').replace(/\/api$/, '');
        const response = await fetch(`${API_URL}/api/composio-mcp/discover-tools`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            app_key: 'gmail'
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to discover tools');
        }

        const data = await response.json();
        discoveredTools = data.tools || [];

        if (data.success && discoveredTools.length > 0) {
          updateTestResult(4, 'success', `Discovered ${discoveredTools.length} tools from Gmail MCP`, {
            tools: discoveredTools,
            mcp_url: data.mcp_url
          });
          toast.success(`Discovered ${discoveredTools.length} Gmail tools!`);
          console.log('📋 Discovered tools:', discoveredTools);
        } else {
          updateTestResult(4, 'error', `No tools discovered. Response: ${JSON.stringify(data)}`);
          toast.error('No tools discovered from Gmail MCP');
        }
      } catch (error) {
        updateTestResult(4, 'error', `Tool discovery failed: ${error}`);
        toast.error('Tool discovery failed');
      }

      // Test 6: Select and Update Tools
      console.log('⚙️ Selecting and updating tools for Gmail MCP...');
      try {
        if (discoveredTools.length === 0) {
          updateTestResult(5, 'error', 'No tools available for selection');
          toast.error('No tools available for selection');
        } else {
          // Select first 3 tools or all tools if less than 3
          const selectedTools = discoveredTools.slice(0, 3).map(tool => tool.name);

          const API_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || '').replace(/\/api$/, '');
          const response = await fetch(`${API_URL}/api/composio-mcp/update-tools`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              app_key: 'gmail',
              selected_tools: selectedTools
            })
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update tools');
          }

          const data = await response.json();

          if (data.success) {
            updateTestResult(5, 'success', `Updated ${data.enabled_tools.length} enabled tools: ${data.enabled_tools.join(', ')}`, {
              enabled_tools: data.enabled_tools,
              selected_from: discoveredTools.length
            });
            toast.success(`Updated ${data.enabled_tools.length} enabled tools!`);
            console.log('📋 Enabled tools:', data.enabled_tools);
          } else {
            updateTestResult(5, 'error', `Tool update failed: ${data.error || 'Unknown error'}`);
            toast.error('Tool update failed');
          }
        }
      } catch (error) {
        updateTestResult(5, 'error', `Tool update failed: ${error}`);
        toast.error('Tool update failed');
      }

      // Test 7: Verify Tool Selection in Default Agent
      console.log('✅ Verifying tool selection was stored in default agent...');
      try {
        // Add a small delay to allow for database consistency
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Check default agent's custom_mcps for the Gmail HTTP MCP with enabledTools
        const { data: defaultAgent, error } = await supabase
          .from('agents')
          .select('agent_id, name, custom_mcps, is_default')
          .eq('is_default', true)
          .single();

        if (error) {
          throw new Error(`Failed to fetch default agent: ${error.message}`);
        }

        if (!defaultAgent) {
          throw new Error('Default agent not found after tool selection');
        }

        const customMcps = defaultAgent.custom_mcps || [];
        const gmailMcp = customMcps.find((mcp: any) =>
          mcp.type === 'http' && mcp.name?.toLowerCase() === 'gmail'
        );

        if (gmailMcp) {
          const enabledTools = gmailMcp.enabledTools || [];
          updateTestResult(6, 'success', `Gmail MCP verified with ${enabledTools.length} enabled tools: ${enabledTools.join(', ')}`, {
            agent_id: defaultAgent.agent_id,
            mcp_config: gmailMcp,
            enabled_tools: enabledTools,
            total_mcps: customMcps.length
          });
          toast.success(`Tool selection verified! ${enabledTools.length} tools enabled`);
          console.log('📋 Gmail MCP with tools:', gmailMcp);
        } else {
          updateTestResult(6, 'error', `Gmail HTTP MCP not found in default agent. Found ${customMcps.length} custom MCPs: ${customMcps.map((m: any) => `${m.name}(${m.type})`).join(', ')}`);
          toast.error('Gmail MCP not found in default agent');
          console.log('Available custom MCPs:', customMcps);
        }
      } catch (error) {
        updateTestResult(6, 'error', `Verification failed: ${error}`);
        toast.error('Tool selection verification failed');
      }

      // Test 8: Keep Connection for Supabase Inspection
      console.log('📋 Keeping test connection for Supabase inspection...');
      try {
        // Get final state of default agent
        const { data: finalAgent } = await supabase
          .from('agents')
          .select('agent_id, name, custom_mcps, is_default, created_at')
          .eq('is_default', true)
          .single();

        if (finalAgent) {
          const customMcps = finalAgent.custom_mcps || [];
          const gmailMcp = customMcps.find((mcp: any) =>
            mcp.type === 'http' && mcp.name?.toLowerCase() === 'gmail'
          );

          const enabledTools = gmailMcp?.enabledTools || [];

          updateTestResult(7, 'success', `✅ Check Supabase agents table for agent_id: ${finalAgent.agent_id}. Gmail MCP: ${gmailMcp ? 'Found' : 'Missing'} with ${enabledTools.length} enabled tools`, {
            agent_id: finalAgent.agent_id,
            agent_name: finalAgent.name,
            total_custom_mcps: customMcps.length,
            gmail_mcp_url: gmailMcp?.config?.url,
            gmail_enabled_tools: enabledTools,
            inspection_query: `SELECT agent_id, name, custom_mcps, is_default FROM agents WHERE agent_id = '${finalAgent.agent_id}';`
          });
          toast.success('Complete tool discovery & selection test finished!');
          console.log('📋 Final agent state for Supabase inspection:', finalAgent);
          console.log('📋 Gmail MCP with enabled tools:', gmailMcp);
          console.log('📋 Run this query in Supabase SQL editor:', `SELECT agent_id, name, custom_mcps, is_default FROM agents WHERE agent_id = '${finalAgent.agent_id}';`);
        } else {
          updateTestResult(7, 'error', 'Default agent not found in final state');
          toast.error('Default agent missing in final state');
        }
      } catch (error) {
        updateTestResult(7, 'error', `Final inspection failed: ${error}`);
        toast.error('Failed to prepare final inspection');
      }

      // COMMENTED OUT: Delete Test Connection
      // Uncomment this section when you want to clean up test connections
      /*
      console.log('🗑️ Cleaning up test connection...');
      try {
        const deleted = await ComposioMCPService.deleteConnection('gmail');
        if (deleted) {
          updateTestResult(5, 'success', 'Test connection deleted successfully');
          toast.success('Test connection cleaned up');
        } else {
          updateTestResult(5, 'error', 'Failed to delete test connection');
          toast.error('Failed to clean up test connection');
        }
      } catch (error) {
        updateTestResult(5, 'error', `Cleanup failed: ${error}`);
        toast.error('Failed to clean up test connection');
      }
      */

    } catch (error) {
      console.error('Test suite failed:', error);
      toast.error('Test suite failed');
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'success':
        return 'default';
      case 'error':
        return 'destructive';
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Default Agent MCP Storage Test</h2>
          <p className="text-muted-foreground">
            Test the new default agent architecture: Composio MCPs stored as HTTP custom MCPs in default agent
          </p>
        </div>
        <Button
          onClick={runTests}
          disabled={isRunning}
          className="flex items-center gap-2"
        >
          {isRunning ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Zap className="h-4 w-4" />
          )}
          {isRunning ? 'Running Tests...' : 'Run Tests'}
        </Button>
      </div>

      {/* Health Status */}
      {healthStatus && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Composio MCP Service is healthy: {healthStatus.service} v{healthStatus.version}
          </AlertDescription>
        </Alert>
      )}

      {/* Test Results */}
      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
          <CardDescription>
            Backend API endpoint testing results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {currentTests.map((test, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(test.status)}
                  <span className="font-medium">{test.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {test.message && (
                    <span className="text-sm text-muted-foreground">{test.message}</span>
                  )}
                  <Badge variant={getStatusColor(test.status)}>
                    {test.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Supported Apps */}
      {supportedApps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Supported Apps ({supportedApps.length})</CardTitle>
            <CardDescription>
              Apps available for Composio MCP integration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {supportedApps.map((app) => (
                <div key={app.key} className="flex items-center gap-2 p-2 border rounded">
                  <span className="text-lg">{app.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{app.name}</p>
                    <p className="text-xs text-muted-foreground">{app.category}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Default Agent Status */}
      <Card>
        <CardHeader>
          <CardTitle>Default Agent MCP Storage</CardTitle>
          <CardDescription>
            Composio MCPs are now stored as HTTP custom MCPs in your default agent
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>New Architecture:</strong> Composio MCPs are stored as HTTP custom MCPs in your default agent's custom_mcps column.
                This enables centralized MCP management and sharing across agents.
              </AlertDescription>
            </Alert>

            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">How to Verify in Supabase:</h4>
              <ol className="text-sm space-y-1 list-decimal list-inside">
                <li>Go to Supabase SQL Editor</li>
                <li>Run: <code className="bg-background px-1 rounded">SELECT agent_id, name, custom_mcps, is_default FROM agents WHERE is_default = true;</code></li>
                <li>Look for Gmail entry in custom_mcps with type: "http"</li>
                <li>The config.url should contain the Composio MCP URL</li>
              </ol>
            </div>

            {currentTests.length > 0 && currentTests[7]?.data && (
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Test Results Summary:</h4>
                <div className="text-sm space-y-1">
                  <p><strong>Agent ID:</strong> <code>{currentTests[7].data.agent_id}</code></p>
                  <p><strong>Agent Name:</strong> {currentTests[7].data.agent_name}</p>
                  <p><strong>Total Custom MCPs:</strong> {currentTests[7].data.total_custom_mcps}</p>
                  {currentTests[7].data.gmail_mcp_url && (
                    <p><strong>Gmail MCP URL:</strong> <code className="text-xs break-all">{currentTests[7].data.gmail_mcp_url}</code></p>
                  )}
                  {currentTests[7].data.gmail_enabled_tools && (
                    <p><strong>Enabled Tools:</strong> <code>{currentTests[7].data.gmail_enabled_tools.join(', ')}</code></p>
                  )}
                </div>
              </div>
            )}

            {/* Tool Discovery Results */}
            {currentTests.length > 0 && currentTests[4]?.data?.tools && (
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Discovered Tools ({currentTests[4].data.tools.length}):</h4>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {currentTests[4].data.tools.slice(0, 10).map((tool: any, index: number) => (
                    <div key={index} className="text-sm p-2 bg-muted rounded">
                      <p><strong>{tool.name}</strong></p>
                      {tool.description && <p className="text-muted-foreground text-xs">{tool.description}</p>}
                    </div>
                  ))}
                  {currentTests[4].data.tools.length > 10 && (
                    <p className="text-xs text-muted-foreground">... and {currentTests[4].data.tools.length - 10} more tools</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Composio MCP Integration Test Page
 *
 * This page provides a comprehensive testing interface for the Composio MCP
 * integration, including connection management and agent configuration testing.
 */

'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ComposioTest } from '@/components/composio/composio-test';
import { ComposioConnectionManager } from '@/components/composio/composio-connection-manager';
import { ComposioAgentSelector } from '@/components/composio/composio-agent-selector';
import { ComposioToolSelectionTest } from '@/components/composio/composio-tool-selection-test';
import { ComposioManualTest } from '@/components/composio/composio-manual-test';

export default function TestComposioPage() {
  // Mock agent configuration for testing
  const [mockAgentConfig, setMockAgentConfig] = useState([
    { qualified_name: 'smithery/github', enabled: true },
    { qualified_name: 'composio/gmail', enabled: false },
  ]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Default Agent MCP Storage Test</h1>
        <p className="text-muted-foreground">
          Test the new architecture: Composio MCPs stored as HTTP custom MCPs in default agent for centralized management
        </p>
      </div>

      <Tabs defaultValue="tools" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="tools">Tool Selection</TabsTrigger>
          <TabsTrigger value="manual">Manual Tests</TabsTrigger>
          <TabsTrigger value="backend">Backend Tests</TabsTrigger>
          <TabsTrigger value="connections">Connection Manager</TabsTrigger>
          <TabsTrigger value="agent">Agent Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="backend" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Default Agent Storage Tests</CardTitle>
              <CardDescription>
                Test Composio MCP creation and storage as HTTP custom MCPs in default agent
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ComposioTest />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tool Discovery & Selection Test</CardTitle>
              <CardDescription>
                Interactive test for the complete tool discovery and selection flow
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ComposioToolSelectionTest />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manual Endpoint Testing</CardTitle>
              <CardDescription>
                Test individual Composio MCP endpoints manually with custom requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ComposioManualTest />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="connections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Global Connection Management</CardTitle>
              <CardDescription>
                Manage your global Composio connections that can be shared across all agents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ComposioConnectionManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent Configuration Test</CardTitle>
              <CardDescription>
                Test how agents can select and use global Composio connections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ComposioAgentSelector
                agentId="test-agent"
                currentMcpConfig={mockAgentConfig}
                onConfigChange={(newConfig) => {
                  console.log('Agent config updated:', newConfig);
                  setMockAgentConfig(newConfig);
                }}
              />

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Current Agent Configuration:</h4>
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(mockAgentConfig, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

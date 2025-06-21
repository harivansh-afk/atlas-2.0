/**
 * Manual Composio Endpoint Testing Component
 *
 * Simple UI for manually testing individual Composio MCP endpoints
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Play, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

interface EndpointTest {
  id: string;
  name: string;
  method: string;
  path: string;
  description: string;
  defaultBody?: string;
}

const endpoints: EndpointTest[] = [
  {
    id: 'create',
    name: 'Create Connection',
    method: 'POST',
    path: '/composio-mcp/create-connection',
    description: 'Create a new Composio MCP connection',
    defaultBody: JSON.stringify({ app_key: 'gmail' }, null, 2)
  },
  {
    id: 'discover',
    name: 'Discover Tools',
    method: 'POST',
    path: '/composio-mcp/discover-tools',
    description: 'Discover available tools from a Composio MCP connection',
    defaultBody: JSON.stringify({ app_key: 'gmail' }, null, 2)
  },
  {
    id: 'update',
    name: 'Update Tools',
    method: 'POST',
    path: '/composio-mcp/update-tools',
    description: 'Update selected tools for a Composio MCP connection',
    defaultBody: JSON.stringify({
      app_key: 'gmail',
      selected_tools: ['gmail_send_email', 'gmail_read_email', 'gmail_search_email']
    }, null, 2)
  },
  {
    id: 'initiate',
    name: 'Initiate Auth',
    method: 'POST',
    path: '/composio-mcp/initiate-auth',
    description: 'Initiate authentication and get redirect URL for a Composio MCP connection',
    defaultBody: JSON.stringify({ app_key: 'gmail' }, null, 2)
  },
  {
    id: 'list',
    name: 'List Connections',
    method: 'GET',
    path: '/composio-mcp/list-user-connections',
    description: 'List all user Composio MCP connections'
  },
  {
    id: 'apps',
    name: 'Supported Apps',
    method: 'GET',
    path: '/composio-mcp/supported-apps',
    description: 'Get list of supported Composio apps'
  },
  {
    id: 'health',
    name: 'Health Check',
    method: 'GET',
    path: '/composio-mcp/health',
    description: 'Check Composio MCP service health'
  }
];

export const ComposioManualTest: React.FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointTest>(endpoints[0]);
  const [requestBody, setRequestBody] = useState<string>(endpoints[0].defaultBody || '');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [responseTime, setResponseTime] = useState<number>(0);

  const handleEndpointChange = (endpoint: EndpointTest) => {
    setSelectedEndpoint(endpoint);
    setRequestBody(endpoint.defaultBody || '');
    setResponse(null);
    setResponseTime(0);
  };

  const executeRequest = async () => {
    setIsLoading(true);
    setResponse(null);
    const startTime = Date.now();

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast.error('Please sign in to test endpoints');
        return;
      }

      const API_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || '').replace(/\/api$/, '');
      const url = `${API_URL}/api${selectedEndpoint.path}`;
      const options: RequestInit = {
        method: selectedEndpoint.method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      };

      // Add body for POST requests
      if (selectedEndpoint.method === 'POST' && requestBody.trim()) {
        try {
          options.body = requestBody;
          JSON.parse(requestBody); // Validate JSON
        } catch (error) {
          toast.error('Invalid JSON in request body');
          return;
        }
      }

      const response = await fetch(url, options);
      const endTime = Date.now();
      setResponseTime(endTime - startTime);

      const data = await response.json();

      setResponse({
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data: data
      });

      if (response.ok) {
        toast.success(`${selectedEndpoint.name} successful (${endTime - startTime}ms)`);
      } else {
        toast.error(`${selectedEndpoint.name} failed: ${response.status}`);
      }

    } catch (error) {
      const endTime = Date.now();
      setResponseTime(endTime - startTime);
      setResponse({
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 'Network Error'
      });
      toast.error(`Request failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const copyResponse = () => {
    if (response) {
      navigator.clipboard.writeText(JSON.stringify(response, null, 2));
      toast.success('Response copied to clipboard');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Manual Endpoint Testing</h3>
        <p className="text-sm text-muted-foreground">
          Test individual Composio MCP endpoints manually
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Request</CardTitle>
            <CardDescription>
              Configure and execute API requests
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Endpoint Selection */}
            <div>
              <Label>Endpoint</Label>
              <div className="grid grid-cols-1 gap-2 mt-2">
                {endpoints.map((endpoint) => (
                  <button
                    key={endpoint.id}
                    onClick={() => handleEndpointChange(endpoint)}
                    className={`p-3 text-left border rounded-lg transition-colors ${
                      selectedEndpoint.id === endpoint.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {endpoint.method}
                          </Badge>
                          <span className="font-medium">{endpoint.name}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {endpoint.description}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Request Details */}
            <div>
              <Label>URL</Label>
              <Input
                value={`${(process.env.NEXT_PUBLIC_BACKEND_URL || '').replace(/\/api$/, '')}/api${selectedEndpoint.path}`}
                readOnly
                className="mt-1 font-mono text-sm"
              />
            </div>

            {/* Request Body (for POST requests) */}
            {selectedEndpoint.method === 'POST' && (
              <div>
                <Label>Request Body (JSON)</Label>
                <Textarea
                  value={requestBody}
                  onChange={(e) => setRequestBody(e.target.value)}
                  placeholder="Enter JSON request body..."
                  className="mt-1 font-mono text-sm"
                  rows={8}
                />
              </div>
            )}

            {/* Execute Button */}
            <Button
              onClick={executeRequest}
              disabled={isLoading}
              className="w-full flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {isLoading ? 'Executing...' : `Execute ${selectedEndpoint.method} Request`}
            </Button>
          </CardContent>
        </Card>

        {/* Response Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Response
              {response && (
                <div className="flex items-center gap-2">
                  <Badge variant={response.status >= 200 && response.status < 300 ? 'default' : 'destructive'}>
                    {response.status} {response.statusText}
                  </Badge>
                  <Badge variant="outline">
                    {responseTime}ms
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyResponse}
                    className="h-8 w-8 p-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardTitle>
            <CardDescription>
              API response data and metadata
            </CardDescription>
          </CardHeader>
          <CardContent>
            {response ? (
              <div className="space-y-4">
                <Textarea
                  value={JSON.stringify(response, null, 2)}
                  readOnly
                  className="font-mono text-sm"
                  rows={20}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-40 text-muted-foreground">
                Execute a request to see the response
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

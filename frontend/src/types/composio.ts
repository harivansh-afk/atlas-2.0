/**
 * TypeScript types for Composio MCP integration
 *
 * These types define the structure for Composio MCP API requests, responses,
 * and data models used across the frontend application.
 */

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface CreateComposioConnectionRequest {
  app_key: string;
}

export interface CreateComposioConnectionResponse {
  success: boolean;
  app_key: string;
  qualified_name?: string;
  mcp_url?: string;
  auth_url?: string;
  session_uuid?: string;
  error?: string;
  message: string;
}

export interface ListUserConnectionsResponse {
  success: boolean;
  connections: ComposioConnection[];
  total: number;
}

export interface DeleteConnectionResponse {
  success: boolean;
  message: string;
}

export interface GetSupportedAppsResponse {
  success: boolean;
  apps: ComposioApp[];
  total: number;
  message: string;
}

export interface ComposioHealthResponse {
  status: string;
  service: string;
  version: string;
}

// ============================================================================
// Data Models
// ============================================================================

export interface ComposioApp {
  key: string;
  name: string;
  description: string;
  icon: string;
  category: ComposioAppCategory;
  tool_count?: number;
  usage_count?: number;
  popular?: boolean;
  requires_auth?: boolean;
  rate_limit?: number;
  timeout?: number;
}

export interface ComposioConnection {
  id: string;
  user_id: string;
  qualified_name: string;
  app_key: string;
  app_name: string;
  mcp_url?: string;
  auth_url?: string;
  session_uuid?: string;
  status: ComposioConnectionStatus;
  created_at: string;
  updated_at: string;
  expires_at?: string;
  scope?: string;
}

// ============================================================================
// Enums and Constants
// ============================================================================

export type ComposioAppCategory =
  | 'popular'
  | 'communication'
  | 'development'
  | 'productivity'
  | 'ai'
  | 'analytics'
  | 'marketing'
  | 'crm'
  | 'finance'
  | 'storage'
  | 'scheduling'
  | 'media'
  | 'education'
  | 'design'
  | 'social'
  | 'gaming'
  | 'voice'
  | 'email'
  | 'automation'
  | 'support'
  | 'security'
  | 'monitoring'
  | 'utilities'
  | 'business'
  | 'sales'
  | 'other';

export type ComposioConnectionStatus =
  | 'pending'
  | 'connected'
  | 'error'
  | 'expired'
  | 'disconnected';

export const COMPOSIO_APP_CATEGORIES: Record<ComposioAppCategory, { name: string; icon: string }> = {
  popular: { name: 'Popular', icon: '⭐' },
  communication: { name: 'Communication', icon: '💬' },
  development: { name: 'Development', icon: '🔧' },
  productivity: { name: 'Productivity', icon: '📝' },
  ai: { name: 'AI & ML', icon: '🤖' },
  analytics: { name: 'Analytics & Data', icon: '📊' },
  marketing: { name: 'Marketing', icon: '📢' },
  crm: { name: 'CRM', icon: '👥' },
  finance: { name: 'Finance', icon: '💰' },
  storage: { name: 'File Storage', icon: '📁' },
  scheduling: { name: 'Scheduling', icon: '📅' },
  media: { name: 'Media', icon: '🎬' },
  education: { name: 'Education', icon: '🎓' },
  design: { name: 'Design', icon: '🎨' },
  social: { name: 'Social', icon: '📱' },
  gaming: { name: 'Gaming', icon: '🎮' },
  voice: { name: 'Voice', icon: '🎤' },
  email: { name: 'Email', icon: '📧' },
  automation: { name: 'Automation', icon: '⚡' },
  support: { name: 'Support', icon: '🎧' },
  security: { name: 'Security', icon: '🔒' },
  monitoring: { name: 'Monitoring', icon: '📈' },
  utilities: { name: 'Utilities', icon: '🔨' },
  business: { name: 'Business', icon: '🏢' },
  sales: { name: 'Sales', icon: '🎯' },
  other: { name: 'Other', icon: '🧩' },
};

// ============================================================================
// UI State Types
// ============================================================================

export interface ComposioUIState {
  selectedApp?: ComposioApp;
  isConnecting: boolean;
  connectionError?: string;
  showAuthDialog: boolean;
  authUrl?: string;
}

export interface ComposioFilterState {
  category?: ComposioAppCategory;
  searchQuery: string;
  showConnectedOnly: boolean;
}

// ============================================================================
// Hook Return Types
// ============================================================================

export interface UseComposioConnectionsReturn {
  connections: ComposioConnection[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseCreateComposioConnectionReturn {
  createConnection: (appKey: string) => Promise<ComposioConnection>;
  isCreating: boolean;
  error: Error | null;
}

export interface UseComposioAppsReturn {
  apps: ComposioApp[];
  isLoading: boolean;
  error: Error | null;
  getAppsByCategory: (category: ComposioAppCategory) => ComposioApp[];
  searchApps: (query: string) => ComposioApp[];
}

// ============================================================================
// Component Props Types
// ============================================================================

export interface ComposioAppSelectorProps {
  onAppSelect: (app: ComposioApp) => void;
  selectedApps?: string[];
  disabled?: boolean;
  showCategories?: boolean;
  maxSelections?: number;
}

export interface ComposioConnectionStatusProps {
  connection: ComposioConnection;
  onReconnect?: () => void;
  onDisconnect?: () => void;
  showActions?: boolean;
}

export interface ComposioAuthFlowProps {
  app: ComposioApp;
  authUrl: string;
  onSuccess: (connection: ComposioConnection) => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

export interface ComposioConnectionManagerProps {
  connections: ComposioConnection[];
  onConnect: (appKey: string) => void;
  onDisconnect: (appKey: string) => void;
  showAddButton?: boolean;
  compact?: boolean;
}

// ============================================================================
// Error Types
// ============================================================================

export class ComposioAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public errorCode?: string
  ) {
    super(message);
    this.name = 'ComposioAPIError';
  }
}

export interface ComposioErrorResponse {
  success: false;
  error: string;
  message: string;
  statusCode?: number;
  errorCode?: string;
}

export interface InitiateAuthRequest {
  app_key: string;
}

export interface InitiateAuthResponse {
  success: boolean;
  app_key: string;
  tool_name: string;
  redirect_url?: string;
  connection_id?: string;
  instruction?: string;
  message: string;
  error?: string;
}

// ============================================================================
// Utility Types
// ============================================================================

export type ComposioAppKey = string;
export type ComposioQualifiedName = `composio/${string}`;

// Helper type for form validation
export interface ComposioConnectionForm {
  appKey: string;
  autoConnect?: boolean;
  redirectUrl?: string;
}

// Type for integration with existing agent MCP configuration
export interface AgentComposioConfig {
  qualified_name: ComposioQualifiedName;
  app_key: ComposioAppKey;
  enabled: boolean;
  config?: Record<string, any>;
}

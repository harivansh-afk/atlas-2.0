-- Migration: Add MCP OAuth tokens table
-- Description: Stores OAuth tokens for MCP servers per user

-- Create table for storing MCP OAuth tokens
CREATE TABLE IF NOT EXISTS public.mcp_oauth_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    qualified_name TEXT NOT NULL, -- MCP server qualified name (e.g., "exa", "@smithery-ai/github")
    access_token TEXT, -- Encrypted OAuth access token
    refresh_token TEXT, -- Encrypted OAuth refresh token
    expires_at TIMESTAMPTZ, -- Token expiration time
    scope TEXT, -- OAuth scope
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Unique constraint to prevent duplicate tokens per user per server
    UNIQUE(user_id, qualified_name)
);

-- Enable RLS on the table
ALTER TABLE public.mcp_oauth_tokens ENABLE ROW LEVEL SECURITY;

-- Create RLS policy to allow users to only access their own tokens
CREATE POLICY "Users can only access their own MCP OAuth tokens" ON public.mcp_oauth_tokens
    FOR ALL USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_mcp_oauth_tokens_updated_at
    BEFORE UPDATE ON public.mcp_oauth_tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add index for faster lookups
CREATE INDEX idx_mcp_oauth_tokens_user_qualified_name ON public.mcp_oauth_tokens(user_id, qualified_name);

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mcp_oauth_tokens TO authenticated;

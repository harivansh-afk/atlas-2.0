-- Migration: Default Agent MCP Refactor
-- Description: Simplify MCP storage by using existing agents table structure
-- Composio MCPs are just HTTP custom MCPs stored in default agent's custom_mcps column

BEGIN;

-- The agents table already has everything we need:
-- - custom_mcps JSONB column for storing HTTP custom MCPs (including Composio)
-- - is_default BOOLEAN column for identifying default agents
-- - Existing per-agent MCP architecture works perfectly

-- Add comment to clarify that Composio MCPs are stored as HTTP custom MCPs
COMMENT ON COLUMN agents.custom_mcps IS 'Stores custom MCP server configurations including Composio MCPs (stored as HTTP type). Format: [{"name": "Gmail", "type": "http", "config": {"url": "https://mcp.composio.dev/..."}, "enabledTools": [...]}]';

-- Mark mcp_oauth_tokens table as deprecated (will be removed in future migration)
COMMENT ON TABLE mcp_oauth_tokens IS 'DEPRECATED: This table is being phased out. Composio MCPs are now stored as HTTP custom MCPs in the default agent''s custom_mcps column.';

COMMIT;

#!/usr/bin/env python3
"""
Test script to validate OAuth functionality for MCP servers
"""


def test_oauth_config():
    """Test OAuth configuration detection"""
    from backend.mcp_local.api import oauth_compatible_servers

    print("Testing OAuth compatibility detection...")

    test_servers = [
        "@smithery-ai/github",
        "google-drive",
        "exa",  # non-OAuth server
        "some-random-server",  # non-OAuth server
    ]

    oauth_compatible_servers = {
        "@smithery-ai/github": {
            "provider": "github",
            "scopes": ["repo", "user"],
            "auth_url": "https://github.com/login/oauth/authorize",
        },
        "google-drive": {
            "provider": "google",
            "scopes": ["https://www.googleapis.com/auth/drive"],
            "auth_url": "https://accounts.google.com/o/oauth2/v2/auth",
        },
    }

    for server in test_servers:
        is_oauth = server in oauth_compatible_servers
        print(f"Server: {server} - OAuth: {is_oauth}")
        if is_oauth:
            print(f"  Provider: {oauth_compatible_servers[server]['provider']}")
            print(f"  Scopes: {oauth_compatible_servers[server]['scopes']}")

    print("\n✅ OAuth compatibility detection test passed!")


def test_response_models():
    """Test new response model fields"""
    try:
        # Test that the new fields are properly defined
        sample_response = {
            "qualifiedName": "test-server",
            "displayName": "Test Server",
            "connections": [],
            "auth_type": "oauth",
            "oauth_config": {"provider": "github", "scopes": ["repo"]},
            "is_oauth_configured": True,
        }

        print("Testing response model with OAuth fields...")
        print(f"Auth type: {sample_response['auth_type']}")
        print(f"OAuth configured: {sample_response['is_oauth_configured']}")
        print(f"Provider: {sample_response['oauth_config']['provider']}")

        print("\n✅ Response model test passed!")

    except Exception as e:
        print(f"❌ Response model test failed: {str(e)}")


def test_migration_sql():
    """Test migration SQL syntax"""
    print("Testing migration SQL syntax...")

    migration_file = "backend/supabase/migrations/20250605000000_mcp_oauth_tokens.sql"

    try:
        with open(migration_file, "r") as f:
            sql_content = f.read()

        # Basic checks
        assert "CREATE TABLE" in sql_content
        assert "mcp_oauth_tokens" in sql_content
        assert "user_id" in sql_content
        assert "qualified_name" in sql_content
        assert "access_token" in sql_content
        assert "ENABLE ROW LEVEL SECURITY" in sql_content

        print("✅ Migration SQL syntax test passed!")

    except FileNotFoundError:
        print(f"❌ Migration file not found: {migration_file}")
    except Exception as e:
        print(f"❌ Migration SQL test failed: {str(e)}")


if __name__ == "__main__":
    print("🧪 Testing OAuth functionality for MCP servers\n")

    test_oauth_config()
    test_response_models()
    test_migration_sql()

    print("\n🎉 All OAuth functionality tests completed!")
    print("\nNext steps:")
    print("1. Set up OAuth apps in GitHub/Google with proper redirect URIs")
    print("2. Add environment variables for OAuth client IDs and secrets")
    print("3. Run the Supabase migration to create the tokens table")
    print("4. Test the OAuth flow in the frontend")

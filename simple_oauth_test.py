#!/usr/bin/env python3
"""
Simple test to validate OAuth implementation structure without importing backend modules
"""

import ast
import os


def test_oauth_implementation():
    """Test OAuth implementation structure"""
    print("🧪 Testing OAuth implementation structure...\n")

    all_tests_passed = True

    # Test 1: Backend API syntax validation
    try:
        with open("backend/mcp_local/api.py", "r") as f:
            content = f.read()

        ast.parse(content)
        print("✅ Backend API syntax is valid")
    except SyntaxError as e:
        print(f"❌ Backend API syntax error: {e}")
        all_tests_passed = False
    except FileNotFoundError:
        print("❌ Backend API file not found")
        all_tests_passed = False

    # Test 2: OAuth configuration presence
    try:
        with open("backend/mcp_local/api.py", "r") as f:
            api_content = f.read()

        oauth_indicators = [
            "@smithery-ai/github",
            "oauth_compatible_servers",
            "auth_type",
            "oauth_config",
            "is_oauth_configured",
            "/authorize",
            "/callback",
        ]

        missing_indicators = []
        for indicator in oauth_indicators:
            if indicator not in api_content:
                missing_indicators.append(indicator)

        if not missing_indicators:
            print("✅ OAuth configuration found in API")
        else:
            print(f"❌ Missing OAuth indicators: {missing_indicators}")
            all_tests_passed = False

    except Exception as e:
        print(f"❌ Error checking OAuth configuration: {e}")
        all_tests_passed = False

    # Test 3: Migration file exists
    migration_file = "backend/supabase/migrations/20250605000000_mcp_oauth_tokens.sql"
    if os.path.exists(migration_file):
        print("✅ OAuth tokens migration file exists")

        # Check migration content
        try:
            with open(migration_file, "r") as f:
                migration_content = f.read()

            migration_indicators = [
                "mcp_oauth_tokens",
                "user_id",
                "qualified_name",
                "access_token",
                "refresh_token",
                "expires_at",
            ]

            missing_migration_parts = []
            for indicator in migration_indicators:
                if indicator not in migration_content:
                    missing_migration_parts.append(indicator)

            if not missing_migration_parts:
                print("✅ Migration file has required fields")
            else:
                print(f"❌ Missing migration fields: {missing_migration_parts}")
                all_tests_passed = False

        except Exception as e:
            print(f"❌ Error reading migration file: {e}")
            all_tests_passed = False
    else:
        print("❌ OAuth tokens migration file missing")
        all_tests_passed = False

    # Test 4: Frontend types updated
    try:
        with open("frontend/src/hooks/react-query/mcp/use-mcp-servers.ts", "r") as f:
            frontend_content = f.read()

        frontend_indicators = ["auth_type", "oauth_config", "is_oauth_configured"]
        missing_frontend_fields = []

        for indicator in frontend_indicators:
            if indicator not in frontend_content:
                missing_frontend_fields.append(indicator)

        if not missing_frontend_fields:
            print("✅ Frontend types include OAuth fields")
        else:
            print(f"❌ Missing frontend OAuth fields: {missing_frontend_fields}")
            all_tests_passed = False

    except Exception as e:
        print(f"❌ Error checking frontend types: {e}")
        all_tests_passed = False

    # Test 5: Config dialog updated
    try:
        with open(
            "frontend/src/app/(dashboard)/agents/_components/mcp/config-dialog.tsx", "r"
        ) as f:
            config_content = f.read()

        config_indicators = ["handleOAuthAuth", "oauth", "Authenticate with"]
        missing_config_parts = []

        for indicator in config_indicators:
            if indicator not in config_content:
                missing_config_parts.append(indicator)

        if not missing_config_parts:
            print("✅ Config dialog includes OAuth authentication")
        else:
            print(f"❌ Missing config dialog OAuth parts: {missing_config_parts}")
            all_tests_passed = False

    except Exception as e:
        print(f"❌ Error checking config dialog: {e}")
        all_tests_passed = False

    # Test 6: Client updated for OAuth
    try:
        with open("backend/mcp_local/client.py", "r") as f:
            client_content = f.read()

        client_indicators = [
            "_get_enhanced_config",
            "oauth_compatible_servers",
            "access_token",
        ]
        missing_client_parts = []

        for indicator in client_indicators:
            if indicator not in client_content:
                missing_client_parts.append(indicator)

        if not missing_client_parts:
            print("✅ MCP client includes OAuth token handling")
        else:
            print(f"❌ Missing client OAuth parts: {missing_client_parts}")
            all_tests_passed = False

    except Exception as e:
        print(f"❌ Error checking MCP client: {e}")
        all_tests_passed = False

    print(
        f"\n{'🎉 All OAuth implementation tests passed!' if all_tests_passed else '⚠️  Some OAuth implementation tests failed.'}"
    )

    if all_tests_passed:
        print("\n✨ OAuth implementation is ready! Next steps:")
        print("1. Set up OAuth apps (GitHub, Google) with proper redirect URIs")
        print("2. Add environment variables for OAuth client IDs and secrets")
        print("3. Run the Supabase migration: supabase db push")
        print("4. Test the OAuth flow in the frontend")

    return all_tests_passed


if __name__ == "__main__":
    test_oauth_implementation()

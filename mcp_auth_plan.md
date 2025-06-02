You can directly integrate OAuth 2.0/OIDC-compliant MCP services with Auth0, providing a smoother authentication experience than manual key entry. However, not all MCP services support this. Here's a detailed breakdown of how to implement this based on your existing codebase:

1. Identifying OAuth-Compatible Services:

First, you need to identify which MCP servers in Smithery support OAuth 2.0/OIDC. Your mcp-auth.md file mentions that Auth0 is compatible, which is great for your main user authentication, but you need to check the Smithery registry for each MCP server's authentication capabilities.

2. Server-Side Changes (Backend):

Modified get_mcp_server_details Route: Enhance the /api/mcp/servers/{qualified_name} endpoint to include an auth_type field in the response. This will indicate whether the server uses api_key, oauth, or another method. If it's oauth, you'll also include the necessary OAuth details (authorization URL, scopes) from Smithery.

# backend/mcp_local/api.py

@router.get("/mcp/servers/{qualified_name:path}", response_model=MCPServerDetailResponse)

# ... (existing code)

            # ... after getting server_data ...
            auth_type = server_data.get("auth_type", "api_key") # Default to api_key if not specified

            if auth_type == "oauth":
                # Include OAuth details from Smithery (if available)
                oauth_config = server_data.get("oauth_config", {})  # Get OAuth config from Smithery
                server_info["auth_type"] = "oauth"
                server_info["oauth_config"] = oauth_config
            else:
                server_info["auth_type"] = "api_key" # Explicitly set for clarity
            # ... existing code ...

New /api/mcp/servers/{qualified_name}/authorize Route: Create a new endpoint specifically for initiating the OAuth flow. This endpoint will redirect the user to Auth0's authorization URL with the appropriate parameters (client ID, redirect URI, scope).

from starlette.responses import RedirectResponse

@router.get("/mcp/servers/{qualified_name}/authorize")
async def authorize_mcp_server(qualified_name: str, user_id: str = Depends(get_current_user_id_from_jwt)): # 1. Fetch Server Details (using existing method)
details = await get_mcp_server_details(qualified_name, user_id) # We'll use this for next steps

    if details.auth_type != "oauth":
        raise HTTPException(400, "This server does not support OAuth authorization.")

    # 2. Construct Auth0 Authorization URL
    auth0_url = f"https://{YOUR_AUTH0_DOMAIN}/authorize"
    params = {
        "audience": details.oauth_config.get("audience"), # For Auth0 Resource Server
        "scope": details.oauth_config.get("scope"),
        "response_type": "code",
        "client_id": YOUR_AUTH0_CLIENT_ID,
        "redirect_uri": f"{YOUR_BACKEND_URL}/api/mcp/servers/{qualified_name}/callback",  # New callback route
        "state": qualified_name  # Pass server name for context in callback
    }

    # 3. Redirect to Auth0
    redirect_url = f"{auth0_url}?{urllib.parse.urlencode(params)}"
    return RedirectResponse(url=redirect_url)

@router.get("/mcp/servers/{qualified_name}/callback")
async def authorize_mcp_server_callback(request: Request, qualified_name: str, state: str, user_id: str = Depends(get_current_user_id_from_jwt)):
if state != qualified_name: # Check CSRF protection measure
raise HTTPException(status_code=400, detail="Invalid state parameter")

    # 1. Get Authorization Code
    code = request.query_params.get("code")
    if not code:
        raise HTTPException(status_code=400, detail="Missing authorization code")

    # 2. Exchange Code for Tokens (using Auth0 SDK or API)
    token_data = exchange_code_for_tokens(code, qualified_name)  # Use Auth0 library

    # 3. Store Tokens in Supabase (Securely)
    store_mcp_tokens(user_id, qualified_name, token_data)

    # 4. Redirect to Frontend Success Page (or show success message)
    return {"message": "Successfully authorized MCP server", "qualified_name": qualified_name}

def exchange_code_for_tokens(code: str, qualified_name: str) -> Dict[str, Any]:
"""Exchange the authorization code for access/refresh tokens using the Auth0 SDK or API.""" # Use Auth0 Python SDK to get tokens - your existing implementation # ... your logic ...

def store_mcp_tokens(user_id: str, qualified_name: str, token_data: Dict[str, Any]):
"""Store the access/refresh tokens securely in Supabase.

    Ensure data is encrypted or protected according to security best practices.
    Use a separate table like 'user_mcp_tokens' linked to auth.users.
    """
    # ... your logic ...

IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
Python
IGNORE_WHEN_COPYING_END

3. Frontend Changes:

McpServerCard Component: Add an "Authenticate Now" button conditionally if the auth_type is oauth. This button will call the new /api/mcp/servers/{qualified_name}/authorize endpoint.

// frontend/src/app/(dashboard)/agents/\_components/mcp/mcp-server-card.tsx
// ... other imports
import { useAuth } from '@/components/AuthProvider'; // For access token

// ... other code ...
const handleAuthClick = async (server: MCPServer) => {
if (!session?.access_token) {
// Redirect to auth if not logged in
toast.error('Authentication required');
router.push('/auth?returnUrl=/agents');
return;
}
try {
// Redirect to your auth route or directly to Auth0
const response = await fetch(`${API_URL}/mcp/servers/${server.qualifiedName}/authorize`, {
headers: {
Authorization: `Bearer ${session?.access_token}` // Current user's token
}
});

            if (!response.ok) {
                const error_data = await response.json()
                toast.error(error_data?.detail || error_data?.message || 'Authentication failed.');
                return;
            }

            const { redirect_url } = await response.json();
            // Redirect user to the authorization URL
            if (redirect_url) {
                window.location.href = redirect_url; // Full page redirect for OAuth
            } else {
                 toast.success("Successfully authorized MCP server");
            }
        } catch (error) {
            console.error('Error during authorization:', error);
            toast.error('Authentication failed');
        }
    };

// ... existing code ...
{/_ Auth Button for OAuth-compatible Servers _/}
{server.auth_type === 'oauth' && (
<Button
variant="outline"
size="sm"
className="mt-2"
onClick={() => handleAuthClick(server)} >
Authenticate Now
</Button>
)}

                        {/* Existing Key Input Area (conditionally render if not OAuth or OAuth not set up) */}
                        {(server.auth_type !== 'oauth') && (
                          // Existing code for key input
                           <> {/* ... */} </>
                        )}

// ... rest of code ...
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
Tsx
IGNORE_WHEN_COPYING_END

Handle Redirect: After successful authorization in Auth0, the user will be redirected back to the /api/mcp/servers/{qualified_name}/callback route you defined. This route should handle exchanging the authorization code for tokens and store them securely in Supabase.

Retrieve Tokens: When initializing an MCP tool or executing tool calls, retrieve the user's stored tokens for the respective MCP server (if available) and include them in the server configuration passed to the Smithery URL.

4. Security Considerations:

Secure Storage: Encrypt sensitive data like API keys and tokens when storing them in Supabase.

Input Validation: Validate user input for API keys to prevent injection or other security risks.

Token Refreshing: Implement token refreshing logic in your backend to handle expired tokens gracefully.

Example Flow (Google Drive):

The user clicks "Add Server" and selects Google Drive (if it supports OAuth).

The McpServerCard displays "Authenticate Now" because auth_type is oauth.

Clicking the button calls /api/mcp/servers/google-drive/authorize.

The backend redirects to Auth0's authorization URL for Google Drive.

The user authenticates with Google in Auth0.

Auth0 redirects to your callback URL (/api/mcp/servers/google-drive/callback).

Your backend exchanges the code for tokens and stores them in Supabase.

When using Google Drive MCP tools, the backend retrieves the tokens and passes them to the Smithery URL for Google Drive.

This approach allows for a significantly improved user experience when integrating with OAuth-compatible MCP services, making the process much closer to the desired "one-click" authentication. Remember to handle errors and edge cases gracefully, providing informative feedback to the user at each stage.

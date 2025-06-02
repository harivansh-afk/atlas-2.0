# OAuth MCP Setup Guide

This guide will help you complete the OAuth setup for MCP (Model Context Protocol) servers in your application.

## 🎯 Overview

The OAuth implementation allows users to authenticate with MCP servers like GitHub and Google Drive using OAuth 2.0 instead of manually entering API keys. This provides a more secure and user-friendly experience.

## ✅ Implementation Status

All code changes have been completed:

- ✅ Database schema for storing OAuth tokens
- ✅ Backend API endpoints for OAuth flow
- ✅ Frontend UI components with OAuth buttons
- ✅ MCP client integration for automatic token injection
- ✅ Error handling and user feedback

## 🚀 Setup Instructions

### 1. Run Database Migration

Apply the Supabase migration to create the OAuth tokens table:

```bash
cd backend
supabase db push
```

This creates the `mcp_oauth_tokens` table with proper RLS policies.

### 2. Set Up OAuth Applications

#### GitHub OAuth App

1. Go to [GitHub Settings > Developer settings > OAuth Apps](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the details:
   - **Application name**: `Your App Name - MCP Integration`
   - **Homepage URL**: `https://yourdomain.com`
   - **Authorization callback URL**: `https://yourdomain.com/api/mcp/servers/@smithery-ai/github/callback`
4. Save the app and note the `Client ID` and `Client Secret`

#### Google OAuth App (for Google Drive)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google Drive API
4. Go to "Credentials" and create "OAuth 2.0 Client IDs"
5. Configure:
   - **Application type**: Web application
   - **Authorized redirect URIs**: `https://yourdomain.com/api/mcp/servers/google-drive/callback`
6. Save and note the `Client ID` and `Client Secret`

### 3. Environment Variables

Add these environment variables to your backend `.env` file:

```bash
# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Google OAuth (for Google Drive)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# URLs (adjust for your deployment)
BACKEND_URL=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com
```

### 4. Update OAuth Server Configuration

In `backend/mcp_local/api.py`, update the `oauth_compatible_servers` configuration with your actual client IDs:

```python
oauth_compatible_servers = {
    "@smithery-ai/github": {
        "provider": "github",
        "client_id": os.getenv("GITHUB_CLIENT_ID"),
        "scopes": ["repo", "user"],
        "auth_url": "https://github.com/login/oauth/authorize",
    },
    "google-drive": {
        "provider": "google",
        "client_id": os.getenv("GOOGLE_CLIENT_ID"),
        "scopes": ["https://www.googleapis.com/auth/drive"],
        "auth_url": "https://accounts.google.com/o/oauth2/v2/auth",
    },
}
```

### 5. Test the Implementation

1. **Start your backend server**:

   ```bash
   cd backend
   python -m uvicorn main:app --reload
   ```

2. **Start your frontend**:

   ```bash
   cd frontend
   npm run dev
   ```

3. **Test OAuth Flow**:
   - Navigate to the Agents page
   - Try to configure an OAuth-compatible MCP server (like @smithery-ai/github)
   - You should see an "Authenticate with GitHub" button instead of manual key input
   - Click the button to test the OAuth flow

## 🔧 How It Works

### 1. OAuth Detection

When a user views an MCP server's configuration:

- Backend checks if the server supports OAuth
- Frontend displays appropriate UI (OAuth button vs manual key input)

### 2. OAuth Authorization

When user clicks "Authenticate with [Provider]":

- Frontend redirects to backend `/authorize` endpoint
- Backend redirects to OAuth provider (GitHub/Google)
- User authorizes the application

### 3. OAuth Callback

After user authorization:

- Provider redirects to backend `/callback` endpoint
- Backend exchanges authorization code for access/refresh tokens
- Tokens are securely stored in Supabase
- User is redirected back to frontend with success status

### 4. Token Usage

When connecting to MCP servers:

- Backend automatically retrieves stored OAuth tokens
- Tokens are injected into MCP server configuration
- No manual key entry required

## 🔐 Security Features

- **Encrypted Storage**: OAuth tokens are stored securely in Supabase
- **Row Level Security**: Users can only access their own tokens
- **CSRF Protection**: State parameter prevents CSRF attacks
- **Token Expiration**: Automatic handling of expired tokens
- **Scope Limitation**: Minimal required scopes for each provider

## 🐛 Troubleshooting

### "OAuth server not found" Error

- Check that the server's `qualifiedName` matches exactly in `oauth_compatible_servers`
- Verify environment variables are set correctly

### "Client ID not configured" Error

- Ensure `GITHUB_CLIENT_ID` or `GOOGLE_CLIENT_ID` environment variables are set
- Restart backend server after adding environment variables

### Redirect URI Mismatch

- Verify OAuth app redirect URIs match your deployed backend URL
- For local development, use `http://localhost:8000` instead of `https://yourdomain.com`

### Database Permission Errors

- Ensure Supabase migration was applied: `supabase db push`
- Check that RLS policies are properly configured

## 🎉 Adding More OAuth Providers

To add support for additional OAuth providers:

1. **Add to oauth_compatible_servers** in `backend/mcp_local/api.py`
2. **Add environment variables** for client ID/secret
3. **Update frontend types** if needed
4. **Add provider-specific configuration** in callback handler

Example for adding Slack:

```python
"slack": {
    "provider": "slack",
    "client_id": os.getenv("SLACK_CLIENT_ID"),
    "scopes": ["channels:read", "chat:write"],
    "auth_url": "https://slack.com/oauth/v2/authorize",
},
```

## 📋 Checklist

- [ ] Database migration applied
- [ ] OAuth apps created (GitHub, Google)
- [ ] Environment variables configured
- [ ] Backend server running
- [ ] Frontend server running
- [ ] OAuth flow tested
- [ ] Error handling verified
- [ ] Production deployment configured

Your OAuth MCP integration is now ready! Users can seamlessly authenticate with supported MCP servers without managing API keys manually.

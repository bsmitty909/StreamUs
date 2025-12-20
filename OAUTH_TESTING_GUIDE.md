# OAuth Testing Guide - StreamUs

## 🎯 How to Test OAuth Integration

The OAuth backend services are now implemented and running. To test them, you need to:

1. Get OAuth credentials from each platform
2. Configure them in your `.env` file
3. Test the OAuth flow in the browser

## 📝 Step-by-Step Setup

### 1. YouTube OAuth Setup

**Get Credentials**:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **YouTube Data API v3**
4. Go to **Credentials** → **Create Credentials** → **OAuth client ID**
5. Application type: **Web application**
6. Authorized redirect URIs: `http://localhost:3000/oauth/youtube/callback`
7. Copy **Client ID** and **Client Secret**

**Add to `.env`**:
```bash
YOUTUBE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=your-client-secret-here
YOUTUBE_REDIRECT_URI=http://localhost:3000/oauth/youtube/callback
```

### 2. Twitch OAuth Setup

**Get Credentials**:
1. Go to [Twitch Dev Console](https://dev.twitch.tv/console/apps)
2. Click **Register Your Application**
3. Name: StreamUs (or your choice)
4. OAuth Redirect URLs: `http://localhost:3000/oauth/twitch/callback`
5. Category: Broadcasting Suite
6. Copy **Client ID** and create **Client Secret**

**Add to `.env`**:
```bash
TWITCH_CLIENT_ID=your-twitch-client-id
TWITCH_CLIENT_SECRET=your-twitch-client-secret
TWITCH_REDIRECT_URI=http://localhost:3000/oauth/twitch/callback
```

### 3. Facebook OAuth Setup

**Get Credentials**:
1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create a new app → Business type
3. Add **Facebook Login** product
4. Settings → Basic: Copy **App ID** and **App Secret**
5. Facebook Login Settings → Valid OAuth Redirect URIs: `http://localhost:3000/oauth/facebook/callback`
6. Add required permissions: `pages_read_engagement`, `pages_manage_posts`, `publish_video`

**Add to `.env`**:
```bash
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
FACEBOOK_REDIRECT_URI=http://localhost:3000/oauth/facebook/callback
```

## 🧪 Testing the OAuth Flow

### Method 1: Direct Browser Test (Current)

**Step 1: Login to StreamUs**
```
http://localhost:3001/auth/login
```
Login with your account.

**Step 2: Initiate OAuth**
While logged in, visit one of these URLs:
```
http://localhost:3000/oauth/youtube
http://localhost:3000/oauth/twitch
http://localhost:3000/oauth/facebook
```

**Step 3: Grant Permissions**
- You'll be redirected to the platform's OAuth page
- Click "Allow" or "Authorize"
- You'll be redirected back to StreamUs

**Step 4: Verify Connection**
Check if connection was saved:
```
GET http://localhost:3000/oauth/connections
```
(Must be authenticated - include JWT token in Authorization header)

### Method 2: Using Postman/Insomnia

**1. Login and Get Token**:
```http
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "email": "your@email.com",
  "password": "your-password"
}
```
Copy the `access_token` from response.

**2. Initiate OAuth** (in browser with token):
```
http://localhost:3000/oauth/youtube
```
Include cookie or Authorization header with JWT token.

**3. Check Connections**:
```http
GET http://localhost:3000/oauth/connections
Authorization: Bearer YOUR_JWT_TOKEN
```

### Method 3: Test with Frontend UI (After UI is built)

Once the frontend OAuth components are created:
1. Go to Settings → Connected Accounts
2. Click "Connect YouTube" button
3. Authorize in popup
4. See connected status

## 🔍 Verifying OAuth Works

### Check Database:
```sql
SELECT * FROM oauth_connections;
```

You should see records with:
- `userId` - Your user ID
- `provider` - youtube/twitch/facebook
- `displayName` - Your channel/account name
- `accessToken` - OAuth access token (encrypted)
- `refreshToken` - For token refresh

### Check Logs:
Backend logs will show:
```
[OAuthModule] dependencies initialized
[RouterExplorer] Mapped {/oauth/youtube, GET} route
[RouterExplorer] Mapped {/oauth/youtube/callback, GET} route
...
```

### Test RTMP Config Retrieval:
After connecting, you can get RTMP config:
```typescript
// In backend service
const rtmpConfig = await youtubeOAuthService.getRtmpConfig(userId);
// Returns: { rtmpUrl: 'rtmp://...', streamKey: '...' }
```

## ⚠️ Important Notes

### OAuth Credentials Not Set Warning:
The warning messages you see are normal until you add credentials:
```
[YouTubeOAuthService] YouTube OAuth credentials not configured
[TwitchOAuthService] Twitch OAuth credentials not configured
[FacebookOAuthService] Facebook OAuth credentials not configured
```

This just means the `.env` variables aren't set yet. The services still work.

### Localhost vs Production:
- Current setup uses `localhost:3000` callbacks
- For production, update redirect URIs to your domain
- Re-configure OAuth apps with production URLs

### Token Security:
- Access tokens are stored in database
- Use HTTPS in production
- Consider encrypting tokens at rest
- Tokens auto-refresh before expiry

## 🚀 Quick Test Script

Create a test file `test-oauth.sh`:
```bash
#!/bin/bash

# Test YouTube OAuth flow
echo "Testing YouTube OAuth..."
curl -X GET http://localhost:3000/oauth/youtube \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -L

# Check connections
echo "Checking connections..."
curl -X GET http://localhost:3000/oauth/connections \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📊 Expected OAuth Flow

```
User clicks "Connect YouTube"
    ↓
Frontend redirects to: /oauth/youtube
    ↓
Backend generates OAuth URL with googleapis
    ↓
User redirected to Google OAuth consent page
    ↓
User clicks "Allow"
    ↓
Google redirects to: /oauth/youtube/callback?code=xxx&state=userId
    ↓
Backend exchanges code for tokens
    ↓
Backend fetches user's YouTube channel info
    ↓
Backend saves connection to database
    ↓
User redirected back to StreamUs with success message
    ↓
Connection now appears in Connected Accounts
```

## 🎨 Next: Frontend UI Components

To make OAuth user-friendly, create:

1. **Settings → Connections Page**:
   ```tsx
   /settings/connections
   ```
   Show connected accounts with connect/disconnect buttons

2. **OAuth Buttons**:
   - "Connect YouTube" → Redirects to `/oauth/youtube`
   - "Connect Twitch" → Redirects to `/oauth/twitch`
   - "Connect Facebook" → Redirects to `/oauth/facebook`

3. **Destinations Integration**:
   - Show "Use YouTube Account" button if connected
   - Auto-fill RTMP URL and stream key
   - One-click add destination from OAuth

## ✅ Testing Checklist

- [ ] Add OAuth credentials to `.env`
- [ ] Restart backend to load new env vars
- [ ] Login to StreamUs
- [ ] Visit `/oauth/youtube` (redirects to Google)
- [ ] Grant permissions
- [ ] See callback success
- [ ] Check `/oauth/connections` shows YouTube
- [ ] Repeat for Twitch and Facebook
- [ ] Test token refresh (wait for expiry or force)
- [ ] Test disconnect functionality

Once this works, build the frontend UI to make it user-friendly!

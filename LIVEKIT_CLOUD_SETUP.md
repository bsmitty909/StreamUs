# LiveKit Cloud Setup Guide

This guide will help you set up LiveKit Cloud to fix the WebRTC connectivity issues with Docker.

## Why LiveKit Cloud?

- ✅ Eliminates all Docker WebRTC networking issues
- ✅ Free tier for development (50GB/month egress)
- ✅ Production-ready infrastructure
- ✅ No local server configuration needed
- ✅ Works reliably across all networks

## Setup Steps (5 minutes)

### 1. Create LiveKit Cloud Account

1. Visit https://cloud.livekit.io
2. Click "Sign Up" or "Get Started"
3. Create account with your email
4. Verify your email address

### 2. Create a New Project

1. Once logged in, click "New Project"
2. Give it a name (e.g., "StreamUs Dev")
3. Select a region closest to you

### 3. Get Your Credentials

On your project dashboard, you'll find:
- **WebSocket URL**: `wss://your-project-xxx.livekit.cloud`
- **API Key**: `APIxxxxxxxxxxxx`
- **API Secret**: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 4. Update StreamUs Configuration

Create a `.env` file in the project root with:

```bash
# LiveKit Cloud Configuration
LIVEKIT_URL=wss://your-project-xxx.livekit.cloud
LIVEKIT_API_KEY=APIxxxxxxxxxxxx
LIVEKIT_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Frontend
NEXT_PUBLIC_LIVEKIT_URL=wss://your-project-xxx.livekit.cloud

# Backend (existing)
JWT_SECRET=your-jwt-secret-min-32-characters
JWT_REFRESH_SECRET=your-refresh-secret-min-32-characters
```

### 5. Restart Services

```bash
# Stop Docker LiveKit (not needed anymore)
docker stop streamus-livekit

# Restart backend to pick up new env vars
# (The running backend should auto-reload)

# Refresh frontend browser
# Press Cmd+Shift+R (Mac) or Ctrl+Shift+F5 (Windows)
```

### 6. Test Streaming

1. Go to http://localhost:3001
2. Login or register
3. Create a stream
4. Click on the stream card
5. Allow camera/microphone permissions
6. Your video should now appear!

## Troubleshooting

**If video still doesn't work**:
1. Check browser console for errors
2. Verify the WebSocket URL starts with `wss://` (not `ws://`)
3. Ensure API credentials are copied correctly (no extra spaces)
4. Try in Incognito/Private browsing mode
5. Check LiveKit Cloud dashboard for connection logs

**Browser Permissions**:
- Chrome/Edge: Click camera icon in address bar
- Firefox: Click lock icon → Permissions
- Safari: Safari menu → Settings for This Website

## Next Steps After LiveKit Works

Once streaming is working, you can continue with Week 3-4 features:
- RTMP output for YouTube/Twitch
- Recording functionality
- Custom branding and overlays
- Advanced layouts

## Cost Information

- Free tier: 50GB egress/month (sufficient for development)
- Egress = outbound video data
- For reference: ~1 hour of 720p streaming = ~1-2GB
- Free tier = 25-50 hours of development streaming per month

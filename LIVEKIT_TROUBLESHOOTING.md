# LiveKit WebRTC Connection Issues - Troubleshooting

## Current Issue

WebRTC peer connections are failing with `ConnectionError: could not establish pc connection`. This is caused by Docker network isolation preventing proper ICE candidate exchange.

## Root Cause

LiveKit in Docker advertises its Docker container IP (`172.x.x.x`) to the browser, but the browser cannot reach it. WebRTC requires direct peer-to-peer connections.

## Solutions

### Option 1: Run LiveKit Locally (Recommended for Development)

Stop the Docker LiveKit and run it natively:

```bash
# Stop Docker LiveKit
docker stop streamus-livekit

# Install LiveKit Server locally (Mac)
brew install livekit-server

# Run locally with the same config
livekit-server --config infrastructure/livekit/livekit.yaml
```

### Option 2: Use LiveKit Cloud (Easiest)

1. Create free account at https://cloud.livekit.io
2. Get your API key and secret
3. Update `.env`:
```
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-secret
```

### Option 3: Configure Docker with Host IP (Current Attempt)

The [`docker-compose.yml`](docker-compose.yml) has been updated with UDP port mapping, but may still have issues depending on your network configuration.

**Check if ports are accessible**:
```bash
# Test UDP port
nc -uz localhost 50000

# Check LiveKit HTTP
curl http://localhost:7880
```

**If still failing**, you may need to:
1. Disable firewall for local development
2. Check macOS firewall settings for Docker
3. Use a TURN server for NAT traversal

## Temporary Workaround

For immediate testing, you can disable video and test with audio only by modifying the stream room page to set `video={false}`.

## Current Configuration

- LiveKit: Bridge network with UDP ports 50000-50200
- Frontend: Connects to ws://localhost:7880
- Backend: Connects to http://localhost:7880

## Next Steps

If WebRTC continues to fail:
1. Try Option 1 (local LiveKit) for development
2. Use LiveKit Cloud (Option 2) for production-like testing
3. Check macOS firewall/security settings
4. Review browser console for specific ICE failure details

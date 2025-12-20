# How to Access RTMP Streaming Features

## 🎯 Quick Start Guide

The RTMP destinations feature is accessible through your streams. Here's how to use it:

## Step-by-Step Instructions

### 1. Log in to StreamUs
- Go to http://localhost:3001
- Sign in with your credentials

### 2. Access Your Dashboard
- After login, you'll see your streams dashboard
- URL: http://localhost:3001/dashboard

### 3. Find the Destinations Feature

**Option A: From Dashboard**
1. Look at your stream cards on the dashboard
2. Each stream card now has a footer with two links:
   - **"📡 Destinations"** ← Click this to manage RTMP destinations
   - **"▶ Join Stream"** - Join the video room

**Option B: From Stream Room**
1. Join any stream by clicking "▶ Join Stream" or the stream card
2. In the stream room, you'll see:
   - A **"📡 Destinations"** button in the top bar
   - A **side panel** on the right with Stream Health Monitor
   - **Quick Actions** panel with "Manage Destinations" button

**Option C: Direct URL**
- Replace `STREAM_ID` with your actual stream ID:
- http://localhost:3001/stream/STREAM_ID/destinations

### 4. Add RTMP Destinations

Once on the destinations page:

1. Click **"+ Add Destination"** button
2. Choose a platform:
   - **YouTube Live** - Pre-filled RTMP URL
   - **Facebook Live** - Pre-filled RTMP URL
   - **Twitch** - Pre-filled RTMP URL
   - **Custom RTMP** - Enter any RTMP server

3. Enter your stream key (from YouTube/Twitch/Facebook)
4. Click **"Add Destination"**

### 5. Start Streaming to RTMP

1. Your destination appears in the list with status indicator
2. Click the **"Start"** button on a destination
3. Watch the status change to "🟢 Streaming"
4. The stream room will show health monitoring

### 6. Upload Brand Logo

**From Dashboard:**
1. Click **"Branding"** in the top navigation
2. Or go to: http://localhost:3001/settings/branding

**From Stream Room:**
1. Look at the side panel (right side)
2. Click **"Upload Logo"** in Quick Actions

**Upload Process:**
1. Select an image file (PNG recommended)
2. Adjust position, opacity, and scale with sliders
3. See live preview
4. Click **"Upload Logo"**

## 📍 Where to Find Features

### Main Navigation
```
Dashboard (/)
├── Branding (settings/branding)  ← Logo upload
└── Stream Cards
    └── 📡 Destinations  ← RTMP management
```

### Stream Room
```
Stream Page (/stream/[id])
├── Top Bar: 📡 Destinations button
└── Side Panel (right):
    ├── Stream Health Monitor (auto-refresh)
    └── Quick Actions
        ├── Manage Destinations
        └── Upload Logo
```

## 🎨 Features Available

### RTMP Destinations Page
- ✅ Add YouTube/Facebook/Twitch/Custom RTMP
- ✅ View all destinations for a stream
- ✅ Start/Stop streaming per destination
- ✅ Real-time status indicators
- ✅ Delete destinations
- ✅ Platform-specific setup guides

### Branding Page
- ✅ Upload logo files (PNG, JPG, GIF, SVG)
- ✅ Live preview with adjustments
- ✅ Configure position (top-left, top-right, etc.)
- ✅ Adjust opacity (0-100%)
- ✅ Adjust scale (5-50% of stream size)
- ✅ Gallery of all your logos
- ✅ Delete logos

### Stream Health Monitor
- ✅ Real-time connection status
- ✅ Auto-refresh every 5 seconds
- ✅ Stream duration tracking
- ✅ Active/Pending/Error counts
- ✅ Error message display

## 💡 Example Workflow

1. **Login** → http://localhost:3001
2. **Create a Stream** from dashboard
3. **Click "📡 Destinations"** on the stream card
4. **Add YouTube destination** with your stream key
5. **Go to stream room** (click stream card or "Join Stream")
6. **Click "Start"** on the YouTube destination
7. **Monitor health** in the side panel
8. **Upload logo** via Quick Actions or Branding menu

## 🔍 Troubleshooting

**Can't see "📡 Destinations" link?**
- Refresh the dashboard page
- Make sure you have at least one stream created
- Look at the bottom of each stream card

**Can't find Branding menu?**
- Look in the top navigation bar next to "Streams"
- Or directly navigate to: http://localhost:3001/settings/branding

**Features not working?**
- Backend must be running: http://localhost:3000
- Frontend must be running: http://localhost:3001
- Check browser console for errors (F12)

## 🎬 Quick Access URLs

After login, you can directly access:

- **Branding Settings**: http://localhost:3001/settings/branding
- **Stream Destinations**: http://localhost:3001/stream/YOUR_STREAM_ID/destinations
- **Dashboard**: http://localhost:3001/dashboard

Replace `YOUR_STREAM_ID` with the actual ID from your stream (shown in the URL when you click on a stream).

## 📝 Getting Stream ID

1. Go to dashboard
2. Click on any stream
3. Look at the URL bar
4. Copy the ID from: `/stream/STREAM_ID_HERE`

Example: If URL is `/stream/abc123-def456`, the ID is `abc123-def456`

Then go to: `/stream/abc123-def456/destinations`

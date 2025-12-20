# Live Comments Feature Guide

## Overview

The live comments system aggregates comments from YouTube, Twitch, and Facebook Live streams in real-time, displays them as overlays during the stream, and provides moderation tools for streamers.

## Architecture

### Backend Components

#### 1. Database Entity
- **File**: [`packages/backend/src/database/entities/comment.entity.ts`](packages/backend/src/database/entities/comment.entity.ts)
- **Features**:
  - Comment sources (YouTube, Twitch, Facebook)
  - Comment statuses (Pending, Approved, Rejected, Flagged)
  - Indexed for fast queries by stream and status
  - Stores metadata for platform-specific features

#### 2. Comments Service
- **File**: [`packages/backend/src/comments/comments.service.ts`](packages/backend/src/comments/comments.service.ts)
- **Responsibilities**:
  - CRUD operations for comments
  - Duplicate detection (prevents re-saving same external comment)
  - Bulk moderation operations
  - Query filtering by status

#### 3. Comments Controller
- **File**: [`packages/backend/src/comments/comments.controller.ts`](packages/backend/src/comments/comments.controller.ts)
- **Endpoints**:
  - `GET /streams/:streamId/comments` - Get comments with filtering
  - `PATCH /streams/:streamId/comments/:commentId/status` - Update comment status
  - `POST /streams/:streamId/comments/bulk-update` - Bulk approve/reject
  - `DELETE /streams/:streamId/comments/:commentId` - Delete comment

#### 4. WebSocket Gateway
- **File**: [`packages/backend/src/comments/comments.gateway.ts`](packages/backend/src/comments/comments.gateway.ts)
- **Namespace**: `/comments`
- **Events**:
  - Client → Server:
    - `joinStream` - Subscribe to stream's comments
    - `leaveStream` - Unsubscribe from stream
    - `moderateComment` - Moderate a comment in real-time
  - Server → Client:
    - `newComment` - New comment received
    - `commentModerated` - Comment status changed
    - `commentDeleted` - Comment removed

#### 5. Platform Comment Services

##### YouTube Comments Service
- **File**: [`packages/backend/src/comments/youtube-comments.service.ts`](packages/backend/src/comments/youtube-comments.service.ts)
- **API**: YouTube Live Chat API
- **Poll Interval**: 5 seconds
- **Features**:
  - Fetches up to 200 messages per poll
  - Tracks moderators and chat owners
  - Auto-deduplication

##### Twitch Comments Service
- **File**: [`packages/backend/src/comments/twitch-comments.service.ts`](packages/backend/src/comments/twitch-comments.service.ts)
- **API**: Twitch Helix API
- **Poll Interval**: 3 seconds
- **Features**:
  - Fetches up to 100 messages per poll
  - Includes user badges and colors
  - Supports emotes in metadata

##### Facebook Comments Service
- **File**: [`packages/backend/src/comments/facebook-comments.service.ts`](packages/backend/src/comments/facebook-comments.service.ts)
- **API**: Facebook Graph API
- **Poll Interval**: 5 seconds
- **Features**:
  - Fetches live video comments
  - Tracks comment threads (parent/child)
  - Includes user profile pictures

### Frontend Components

#### 1. Live Comment Feed
- **File**: [`packages/frontend-web/src/components/comments/LiveCommentFeed.tsx`](packages/frontend-web/src/components/comments/LiveCommentFeed.tsx)
- **Purpose**: Display approved comments as overlays during the stream
- **Features**:
  - Configurable position (4 corners)
  - Auto-disappear after duration
  - Max visible comments limit
  - Platform badges (YouTube/Twitch/Facebook)
  - Author avatars
  - Slide-in animations

#### 2. Comment Moderation Panel
- **File**: [`packages/frontend-web/src/components/comments/CommentModerationPanel.tsx`](packages/frontend-web/src/components/comments/CommentModerationPanel.tsx)
- **Purpose**: Real-time comment moderation interface
- **Features**:
  - Filter by status (All, Pending, Approved, Rejected, Flagged)
  - Approve/Reject/Flag/Delete individual comments
  - Bulk approve all pending
  - Real-time updates via WebSocket
  - Author info and platform badges

## Usage

### Starting Comment Polling

To start collecting comments from a platform:

```typescript
// In your backend stream service
import { YoutubeCommentsService } from './comments/youtube-comments.service';

@Injectable()
export class StreamsService {
  constructor(
    private readonly youtubeCommentsService: YoutubeCommentsService,
  ) {}

  async startStream(streamId: string, userId: string, liveChatId: string) {
    // Start YouTube comment polling
    await this.youtubeCommentsService.startPolling(
      streamId,
      userId,
      liveChatId
    );
  }

  async stopStream(streamId: string) {
    // Stop YouTube comment polling
    this.youtubeCommentsService.stopPolling(streamId);
  }
}
```

### Frontend Integration

The live comments are already integrated into the stream page at [`packages/frontend-web/src/app/stream/[id]/page.tsx`](packages/frontend-web/src/app/stream/[id]/page.tsx):

```tsx
<LiveCommentFeed
  streamId={streamId}
  maxVisible={3}
  displayDuration={5000}
  position="bottom-left"
  showAuthorImage={true}
  showSource={true}
/>

<CommentModerationPanel streamId={streamId} />
```

### Customization

#### Comment Feed Settings

```typescript
<LiveCommentFeed
  streamId="your-stream-id"
  maxVisible={5}              // Show up to 5 comments
  displayDuration={7000}       // Show each for 7 seconds
  position="top-right"         // Position in top-right corner
  showAuthorImage={false}      // Hide author images
  showSource={false}           // Hide platform badges
/>
```

#### Moderation Settings

Comments start with `PENDING` status by default. Configure auto-approval in the database or service layer:

```typescript
// Auto-approve all comments (not recommended for production)
const comment = await this.commentsService.createComment({
  ...commentData,
  status: CommentStatus.APPROVED, // Skip moderation
});
```

## API Reference

### REST Endpoints

#### Get Comments
```http
GET /streams/:streamId/comments?status=pending&limit=50&offset=0
Authorization: Bearer <jwt-token>
```

Response:
```json
[
  {
    "id": "uuid",
    "streamId": "stream-uuid",
    "source": "youtube",
    "externalId": "external-comment-id",
    "authorName": "John Doe",
    "authorImage": "https://...",
    "text": "Great stream!",
    "status": "pending",
    "timestamp": "2025-12-19T23:00:00Z",
    "metadata": {}
  }
]
```

#### Update Comment Status
```http
PATCH /streams/:streamId/comments/:commentId/status
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "status": "approved"
}
```

#### Bulk Update
```http
POST /streams/:streamId/comments/bulk-update
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "commentIds": ["uuid1", "uuid2"],
  "status": "approved"
}
```

#### Delete Comment
```http
DELETE /streams/:streamId/comments/:commentId
Authorization: Bearer <jwt-token>
```

### WebSocket Events

#### Connect
```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000/comments', {
  transports: ['websocket'],
  withCredentials: true,
});
```

#### Join Stream
```typescript
socket.emit('joinStream', { streamId: 'your-stream-id' });
```

#### Listen for New Comments
```typescript
socket.on('newComment', (comment) => {
  console.log('New comment:', comment);
});
```

#### Moderate Comment
```typescript
socket.emit('moderateComment', {
  commentId: 'comment-uuid',
  status: 'approved'
});
```

## Configuration

### Environment Variables

Add to your `.env` file:

```bash
# Required for Twitch comments
TWITCH_CLIENT_ID=your_twitch_client_id

# Frontend URL for CORS
FRONTEND_URL=http://localhost:3001
```

### Database Migration

The comments table is automatically created via TypeORM synchronization. In production, use migrations:

```bash
cd packages/backend
npm run typeorm migration:generate -- -n AddCommentsTable
npm run typeorm migration:run
```

## Platform-Specific Setup

### YouTube Live Chat

1. **Get Live Chat ID**:
   - Use YouTube Data API to get the `activeLiveChatId` from your broadcast
   - This is returned when you create a live broadcast

2. **Required Scopes**:
   - `https://www.googleapis.com/auth/youtube.readonly`
   - `https://www.googleapis.com/auth/youtube.force-ssl`

3. **Start Polling**:
```typescript
await youtubeCommentsService.startPolling(
  streamId,
  userId,
  liveChatId // From YouTube broadcast
);
```

### Twitch Chat

1. **Get Broadcaster ID**:
   - Use Twitch API to get your channel's broadcaster ID
   - Store in stream metadata

2. **Required Scopes**:
   - `chat:read`
   - `user:read:email`

3. **Start Polling**:
```typescript
await twitchCommentsService.startPolling(
  streamId,
  userId,
  broadcasterId // Your Twitch channel ID
);
```

### Facebook Live

1. **Get Video ID**:
   - Facebook returns a video ID when you create a live broadcast
   - Use Graph API v18.0+

2. **Required Permissions**:
   - `publish_video`
   - `pages_read_engagement`

3. **Start Polling**:
```typescript
await facebookCommentsService.startPolling(
  streamId,
  userId,
  videoId // From Facebook live video
);
```

## Moderation Workflow

### Automatic Moderation (Future Enhancement)

```typescript
// Add to comments.service.ts
private async autoModerate(text: string): Promise<CommentStatus> {
  // Profanity filter
  if (this.containsProfanity(text)) {
    return CommentStatus.FLAGGED;
  }
  
  // Auto-approve based on settings
  if (this.moderationSettings.autoApprove) {
    return CommentStatus.APPROVED;
  }
  
  return CommentStatus.PENDING;
}
```

### Manual Moderation

1. **Open Moderation Panel**: Click "Show Moderation" button on stream page
2. **Review Comments**: Comments appear in real-time
3. **Take Action**:
   - **Approve**: Comment appears on stream overlay
   - **Reject**: Comment hidden from overlay
   - **Flag**: Marks for later review
   - **Delete**: Permanently removes comment

### Bulk Operations

Use "Approve All Pending" to quickly approve multiple comments at once.

## Performance Considerations

### Polling Intervals
- **YouTube**: 5 seconds (API rate limits: 10,000 units/day)
- **Twitch**: 3 seconds (faster chat velocity)
- **Facebook**: 5 seconds (Graph API rate limits)

### Database Indexing
Comments are indexed on:
- `(streamId, timestamp)` - Fast chronological queries
- `(streamId, status)` - Fast status filtering
- `(externalId, source)` - Duplicate prevention

### WebSocket Scalability
- Uses Socket.IO rooms for efficient broadcasting
- Only streams with active viewers consume resources
- Auto-cleanup when clients disconnect

## Troubleshooting

### Comments Not Appearing

1. **Check OAuth Connection**:
```bash
# Verify user has connected the platform
curl http://localhost:3000/oauth/connections \
  -H "Authorization: Bearer YOUR_JWT"
```

2. **Check Polling Status**:
```typescript
// Add logging to see if polling is active
this.logger.log(`Polling active for stream ${streamId}`);
```

3. **Verify WebSocket Connection**:
```javascript
// In browser console
socket.on('connect', () => console.log('Connected'));
socket.on('disconnect', () => console.log('Disconnected'));
```

### API Rate Limits

- **YouTube**: 10,000 units/day (1 unit per list request)
- **Twitch**: 800 requests/minute
- **Facebook**: 200 calls/hour per user

Implement exponential backoff if rate limited:
```typescript
private retryDelay = 1000;

try {
  await this.fetchComments();
  this.retryDelay = 1000; // Reset on success
} catch (error) {
  if (error.status === 429) {
    this.retryDelay *= 2; // Exponential backoff
    await new Promise(resolve => setTimeout(resolve, this.retryDelay));
  }
}
```

### Database Performance

For high-volume streams, consider:
1. **Archive Old Comments**: Delete comments after stream ends
2. **Pagination**: Limit queries to recent comments
3. **Caching**: Cache frequently accessed data in Redis

## Security

### Access Control
- All comment endpoints require JWT authentication
- Users can only moderate their own stream's comments
- WebSocket connections validate stream ownership

### Input Validation
- Comment text sanitized to prevent XSS
- Author names limited to 100 characters
- External IDs validated for format

### Rate Limiting
Implement in production:
```typescript
@UseGuards(ThrottlerGuard)
@Throttle({ default: { limit: 60, ttl: 60000 } })
export class CommentsController {
  // ... endpoints
}
```

## Next Steps

### Phase 1: Enhancement (Complete ✓)
- [x] Database entity and migrations
- [x] Platform polling services
- [x] WebSocket real-time streaming
- [x] Frontend display component
- [x] Moderation panel

### Phase 2: Advanced Features
- [ ] Profanity filter integration
- [ ] Comment analytics (sentiment analysis)
- [ ] Moderator roles and permissions
- [ ] Comment highlight/pin feature
- [ ] Custom comment styling/themes
- [ ] Comment reply system
- [ ] Banned words/phrases filter
- [ ] User ban system
- [ ] Comment rate limiting per user
- [ ] Emoji/reaction support

### Phase 3: Integration
- [ ] Export comments to CSV
- [ ] Comment replay for recordings
- [ ] Search and filter history
- [ ] Comment metrics dashboard
- [ ] Webhook notifications for flagged comments

## Testing

### Unit Tests
```bash
cd packages/backend
npm test -- comments.service.spec.ts
```

### Integration Tests
```bash
# Test WebSocket connection
cd packages/backend
npm run test:e2e -- comments.e2e-spec.ts
```

### Manual Testing

1. **Create a Stream**:
```bash
curl -X POST http://localhost:3000/streams \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Stream","description":"Testing comments"}'
```

2. **Simulate Comment**:
```bash
# Manually insert test comment
curl -X POST http://localhost:3000/streams/STREAM_ID/comments \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "youtube",
    "externalId": "test-123",
    "authorName": "Test User",
    "text": "This is a test comment",
    "timestamp": "2025-12-19T23:00:00Z"
  }'
```

3. **Verify WebSocket**:
   - Open stream page in browser
   - Open DevTools console
   - Check for "Connected to comments WebSocket" message
   - Approve a comment and verify it appears in overlay

## Database Schema

```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "streamId" UUID NOT NULL REFERENCES streams(id) ON DELETE CASCADE,
  source comments_source_enum NOT NULL,
  "externalId" VARCHAR NOT NULL,
  "authorName" VARCHAR NOT NULL,
  "authorImage" VARCHAR,
  text TEXT NOT NULL,
  status comments_status_enum NOT NULL DEFAULT 'pending',
  timestamp TIMESTAMP NOT NULL,
  metadata JSONB,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_comments_stream_timestamp ON comments("streamId", timestamp);
CREATE INDEX idx_comments_stream_status ON comments("streamId", status);
CREATE INDEX idx_comments_external ON comments("externalId", source);

CREATE TYPE comments_source_enum AS ENUM ('youtube', 'twitch', 'facebook');
CREATE TYPE comments_status_enum AS ENUM ('pending', 'approved', 'rejected', 'flagged');
```

## Production Deployment

### Scaling Considerations

1. **Horizontal Scaling**:
   - Use Redis adapter for Socket.IO clustering
   - Share polling state across instances
   - Implement distributed locks

2. **Performance Optimization**:
   - Cache comment counts in Redis
   - Use database read replicas for queries
   - Implement comment pagination

3. **Monitoring**:
   - Track polling failures per platform
   - Monitor WebSocket connection count
   - Alert on high comment velocity

### Example: Redis Socket.IO Adapter

```typescript
// In main.ts or gateway
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();

await Promise.all([pubClient.connect(), subClient.connect()]);

io.adapter(createAdapter(pubClient, subClient));
```

## Support

For issues or questions:
1. Check backend logs for polling errors
2. Verify OAuth tokens are valid and not expired
3. Ensure platform APIs are accessible (check network/firewall)
4. Review WebSocket connection in browser DevTools

---

**Implementation Status**: ✅ Complete
**Last Updated**: 2025-12-19
**Version**: 1.0.0

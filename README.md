# StreamUs - Live Streaming Platform

A StreamYard alternative featuring easy-to-use live streaming and recording with multistreaming, guest management, branding, audience engagement, and mobile support.

## 🎯 Features

- **Multi-Guest Video** - Support for up to 10 on-screen guests
- **Multistreaming** - Stream to YouTube, Facebook, Twitch, and custom RTMP destinations simultaneously
- **Professional Branding** - Logos, overlays, backgrounds, and scene templates
- **Audience Engagement** - Display live comments from multiple platforms with moderation
- **High-Quality Recording** - 4K recording on paid plans with local and cloud options
- **Pre-recorded Content** - Play pre-recorded videos within live streams
- **Mobile Optimized** - iOS and Android apps with hardware encoding
- **Low CPU Usage** - Optimized for performance with minimal computing power

## 🏗️ Architecture

### Tech Stack

- **Backend**: NestJS (Node.js/TypeScript)
- **Frontend**: Next.js 14+ with React 18+
- **Mobile**: React Native for iOS and Android
- **Database**: PostgreSQL with TypeORM
- **Cache**: Redis
- **Media Server**: LiveKit SFU for WebRTC
- **Media Processing**: FFmpeg for RTMP and recording
- **Storage**: AWS S3 or MinIO
- **Queue**: BullMQ

### Monorepo Structure

```
/StreamUs
├── packages/
│   ├── backend/         # NestJS API server
│   ├── frontend-web/    # Next.js web application
│   ├── mobile/          # React Native app
│   └── shared/          # Shared types and utilities
├── infrastructure/      # Docker configs
├── plans/              # Architecture documentation
└── docs/               # User documentation
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8+
- Docker Desktop
- FFmpeg (optional for local dev)

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd StreamUs
```

2. Install dependencies
```bash
pnpm install
```

3. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start infrastructure services
```bash
docker-compose up -d
```

5. Run database migrations
```bash
pnpm --filter backend migrate:dev
```

6. Start development servers
```bash
pnpm dev
```

This will start:
- Backend API: http://localhost:3000
- Frontend: http://localhost:3001
- LiveKit: ws://localhost:7880

## 📦 Package Commands

### Root Commands
- `pnpm dev` - Start all packages in development mode
- `pnpm build` - Build all packages
- `pnpm test` - Run tests in all packages
- `pnpm lint` - Lint all packages
- `pnpm format` - Format code with Prettier

### Package-Specific Commands
- `pnpm --filter backend <command>` - Run command in backend
- `pnpm --filter frontend-web <command>` - Run command in frontend
- `pnpm --filter mobile <command>` - Run command in mobile app

## 🐳 Docker Services

- **postgres**: PostgreSQL 16 database
- **redis**: Redis 7 for caching and queues
- **livekit**: LiveKit SFU for WebRTC
- **minio** (optional): S3-compatible object storage

## 📚 Documentation

- [Architecture Overview](plans/architecture-overview.md)
- [Technical Decisions](plans/technical-decisions.md)
- [Feature Specifications](plans/feature-specifications.md)
- [Implementation Guide](plans/implementation-guide.md)

## 🔧 Development

### Project Structure

Each package follows its own conventions:

**Backend** (NestJS):
- Modular architecture with feature modules
- TypeORM for database
- JWT authentication
- WebSocket support via Socket.io

**Frontend** (Next.js):
- App Router with React Server Components
- Tailwind CSS + Shadcn UI
- LiveKit React components
- Canvas-based video composition

**Mobile** (React Native):
- Shared code between iOS/Android
- Hardware video encoding
- Native LiveKit SDK integration

### Adding a New Package

1. Create directory in `packages/`
2. Add package.json with name `@streamus/<package-name>`
3. Update root scripts if needed

## 🧪 Testing

- Unit tests: `pnpm test`
- E2E tests: `pnpm test:e2e`
- Integration tests: `pnpm test:integration`

## 🚢 Deployment

### Development
```bash
docker-compose up
```

### Production
```bash
# Build all packages
pnpm build

# Deploy with Kubernetes
kubectl apply -f infrastructure/k8s/
```

## 🔐 Security

- HTTPS/TLS everywhere
- JWT with refresh token rotation
- Encrypted RTMP keys at rest
- RBAC for API routes
- Rate limiting and DDoS protection
- GDPR compliant

## 📄 License

[Add your license here]

## 🤝 Contributing

[Add contributing guidelines]

## 📞 Support

[Add support information]

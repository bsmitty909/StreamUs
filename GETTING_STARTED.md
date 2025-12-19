# Getting Started with StreamUs Development

## Initial Setup Complete! 🎉

The foundation of the StreamUs monorepo has been created. Here's what has been set up:

### ✅ Completed

1. **Monorepo Structure** - pnpm workspaces configured
2. **Docker Environment** - PostgreSQL, Redis, LiveKit, MinIO ready
3. **Configuration Files** - Environment variables, LiveKit config
4. **Project Documentation** - Architecture plans and specifications

### 📁 Project Structure

```
StreamUs/
├── package.json              # Root package config
├── pnpm-workspace.yaml       # Workspace configuration  
├── docker-compose.yml        # Development services
├── .env.example              # Environment template
├── .gitignore                # Git ignore rules
├── README.md                 # Project overview
├── GETTING_STARTED.md        # This file
├── infrastructure/
│   └── livekit/
│       └── livekit.yaml      # LiveKit SFU config
└── plans/                    # Architecture documentation
    ├── architecture-overview.md
    ├── technical-decisions.md
    ├── feature-specifications.md
    └── implementation-guide.md
```

### 🚀 Next Steps

To continue development, you need to:

#### 1. Set up environment variables
```bash
cp .env.example .env
# Edit .env if you need to change default values
```

#### 2. Start infrastructure services
```bash
docker-compose up -d
```

This starts:
- **PostgreSQL** on port 5432
- **Redis** on port 6379
- **LiveKit** on ports 7880-7882
- **MinIO** on ports 9000 (API) and 9001 (Console)

#### 3. Verify services are running
```bash
docker-compose ps
```

All services should show "Up" status.

#### 4. Access MinIO Console (Optional)
- URL: http://localhost:9001
- Username: `streamus`
- Password: `streamus_dev_password`

Create a bucket named `streamus` for object storage.

#### 5. Create the packages

Next, you'll need to initialize the three main packages:

**Backend (NestJS)**:
```bash
mkdir -p packages/backend
cd packages/backend
# Initialize NestJS project
```

**Frontend (Next.js)**:
```bash
mkdir -p packages/frontend-web
cd packages/frontend-web
# Initialize Next.js project
```

**Mobile (React Native)**:
```bash
mkdir -p packages/mobile
cd packages/mobile
# Initialize React Native project
```

**Shared (Common types)**:
```bash
mkdir -p packages/shared
cd packages/shared
# Create shared TypeScript package
```

### 📚 Available Documentation

Review these planning documents to understand the architecture:

- **[Architecture Overview](plans/architecture-overview.md)** - System design and technology stack
- **[Technical Decisions](plans/technical-decisions.md)** - Rationale for technology choices
- **[Feature Specifications](plans/feature-specifications.md)** - Detailed feature breakdown
- **[Implementation Guide](plans/implementation-guide.md)** - Development phases and approach

### 🔧 Development Workflow

Once packages are created:

```bash
# Install all dependencies
pnpm install

# Start all services in development mode
pnpm dev

# Run tests
pnpm test

# Build all packages
pnpm build

# Format code
pnpm format

# Lint code
pnpm lint
```

### 🐳 Docker Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f [service-name]

# Restart a service
docker-compose restart [service-name]

# Remove volumes (clean slate)
docker-compose down -v
```

### 🔑 Default Credentials (Development Only)

**PostgreSQL:**
- Host: localhost:5432
- Database: streamus
- User: streamus
- Password: streamus_dev_password

**Redis:**
- Host: localhost:6379
- No password

**LiveKit:**
- URL: ws://localhost:7880
- API Key: devkey
- API Secret: devsecret

**MinIO:**
- Endpoint: http://localhost:9000
- Access Key: streamus
- Secret Key: streamus_dev_password

⚠️ **Security Note**: These are development credentials only. Never use these in production!

### 🎯 Implementation Phases

The project is organized into 8 phases:

1. **Foundation** ⏳ - Core infrastructure (IN PROGRESS)
2. **Basic Streaming** - WebRTC and guest management
3. **Layouts & Branding** - Visual composition
4. **Multistreaming** - Multiple RTMP outputs
5. **Engagement** - Live comments
6. **Recording** - 4K recording and playback
7. **Mobile Apps** - iOS and Android
8. **Scale & Monetization** - Subscriptions and scaling

### 📞 Need Help?

- Check the [README.md](README.md) for general information
- Review the architecture docs in `plans/`
- Ensure Docker services are running
- Verify environment variables are set correctly

### 🚦 Status Check

Run these commands to verify your setup:

```bash
# Check Node version (should be 20+)
node --version

# Check pnpm version (should be 8+)
pnpm --version

# Check Docker services
docker-compose ps

# Test PostgreSQL connection
docker-compose exec postgres psql -U streamus -d streamus -c "SELECT version();"

# Test Redis connection
docker-compose exec redis redis-cli ping
```

Happy coding! 🎥✨

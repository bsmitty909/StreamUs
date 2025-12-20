#!/bin/bash

set -e

echo "🚀 StreamUs Deployment Script"
echo "================================"

# Load environment variables
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    exit 1
fi

source .env

# Check required variables
if [ -z "$DEPLOY_SSH_HOST" ] || [ -z "$DEPLOY_SSH_USER" ] || [ -z "$DEPLOY_SSH_PASSWORD" ] || [ -z "$DEPLOY_REMOTE_PATH" ]; then
    echo "❌ Error: Missing deployment credentials in .env"
    echo "Required: DEPLOY_SSH_HOST, DEPLOY_SSH_USER, DEPLOY_SSH_PASSWORD, DEPLOY_REMOTE_PATH"
    exit 1
fi

echo "📦 Building packages..."

# Build shared package
echo "  → Building @streamus/shared..."
cd packages/shared && npm run build && cd ../..

# Build backend
echo "  → Building backend..."
cd packages/backend && npm run build && cd ../..

# Build frontend
echo "  → Building frontend..."
cd packages/frontend-web && npm run build && cd ../..

echo "✅ Build complete!"

# Check if sshpass is installed
if ! command -v sshpass &> /dev/null; then
    echo ""
    echo "⚠️  sshpass is not installed. Installing via Homebrew..."
    brew install hudochenkov/sshpass/sshpass
fi

echo ""
echo "📤 Deploying to $DEPLOY_SSH_USER@$DEPLOY_SSH_HOST:$DEPLOY_REMOTE_PATH..."

# Create deployment archive
echo "  → Creating deployment archive..."
tar -czf deploy.tar.gz \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='dist' \
    --exclude='.next' \
    --exclude='*.log' \
    --exclude='.env' \
    packages/ \
    docker-compose.yml \
    package.json \
    pnpm-workspace.yaml \
    .env.example

# Copy archive to server
echo "  → Uploading archive to server..."
sshpass -p "$DEPLOY_SSH_PASSWORD" scp -o StrictHostKeyChecking=no deploy.tar.gz "$DEPLOY_SSH_USER@$DEPLOY_SSH_HOST:$DEPLOY_REMOTE_PATH/"

# Extract and setup on server
echo "  → Extracting and setting up on server..."
sshpass -p "$DEPLOY_SSH_PASSWORD" ssh -o StrictHostKeyChecking=no "$DEPLOY_SSH_USER@$DEPLOY_SSH_HOST" << 'ENDSSH'
cd /home/streamusadmin/streamus.dreamhosters.com
echo "Extracting archive..."
tar -xzf deploy.tar.gz
rm deploy.tar.gz

echo "Creating .env from example if not exists..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "⚠️  Please configure .env file with production credentials"
fi

echo "Installing dependencies..."
npm install

echo "Setting up packages..."
cd packages/shared && npm install && npm run build && cd ../..
cd packages/backend && npm install && npm run build && cd ../..
cd packages/frontend-web && npm install && npm run build && cd ../..

echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Configure .env file: nano .env"
echo "2. Start Docker services: docker-compose up -d"
echo "3. Start backend: cd packages/backend && npm run start:prod &"
echo "4. Start frontend: cd packages/frontend-web && npm run start &"
ENDSSH

# Cleanup local archive
rm deploy.tar.gz

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "Server: $DEPLOY_SSH_USER@$DEPLOY_SSH_HOST"
echo "Path: $DEPLOY_REMOTE_PATH"
echo ""
echo "To access the server:"
echo "  ssh $DEPLOY_SSH_USER@$DEPLOY_SSH_HOST"
echo ""
echo "To view logs:"
echo "  ssh $DEPLOY_SSH_USER@$DEPLOY_SSH_HOST"
echo "  cd $DEPLOY_REMOTE_PATH"
echo "  tail -f nohup.out"

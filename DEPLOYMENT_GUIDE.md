# StreamUs Deployment Guide

## Prerequisites

- SSH access to your server
- Node.js 18+ installed on server
- PostgreSQL database available
- Domain configured and pointing to server

## Quick Deployment

### Automated Deployment (Using deploy.sh)

1. **Configure Deployment Credentials**

Edit your [``.env``](.env) file (already configured):
```bash
DEPLOY_SSH_HOST=ds15000.dreamservers.com
DEPLOY_SSH_USER=streamusadmin
DEPLOY_SSH_PASSWORD=8lOZ2WBPm4gC
DEPLOY_REMOTE_PATH=/home/streamusadmin/streamus.dreamhosters.com
```

2. **Run Deployment Script**

```bash
./deploy.sh
```

The script will:
- Build all packages (shared, backend, frontend)
- Create deployment archive
- Upload to server via SCP
- Extract and install dependencies on server
- Build production bundles

3. **Configure Production Environment**

SSH into your server:
```bash
ssh streamusadmin@ds15000.dreamservers.com
cd /home/streamusadmin/streamus.dreamhosters.com
```

Edit the `.env` file with production values:
```bash
nano .env
```

Update these critical values:
```bash
# Database - use your production PostgreSQL
DATABASE_HOST=your-db-host
DATABASE_PORT=5432
DATABASE_USER=your-db-user
DATABASE_PASSWORD=your-db-password
DATABASE_NAME=streamus_production

# JWT - Generate secure secrets
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)

# LiveKit Cloud
LIVEKIT_URL=wss://your-project-xxx.livekit.cloud
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret

# Frontend URLs
NEXT_PUBLIC_API_URL=https://streamus.dreamhosters.com/api
NEXT_PUBLIC_LIVEKIT_URL=wss://your-project-xxx.livekit.cloud
FRONTEND_URL=https://streamus.dreamhosters.com

# OAuth Callbacks - Update redirect URIs
YOUTUBE_REDIRECT_URI=https://streamus.dreamhosters.com/api/oauth/youtube/callback
TWITCH_REDIRECT_URI=https://streamus.dreamhosters.com/api/oauth/twitch/callback
FACEBOOK_REDIRECT_URI=https://streamus.dreamhosters.com/api/oauth/facebook/callback

# Production mode
NODE_ENV=production
```

4. **Start Services**

```bash
# Start backend (port 3000)
cd packages/backend
nohup npm run start:prod > backend.log 2>&1 &

# Start frontend (port 3001)
cd ../frontend-web
nohup npm run start > frontend.log 2>&1 &
```

5. **Configure Reverse Proxy**

Create Nginx configuration (`/etc/nginx/sites-available/streamus`):
```nginx
server {
    listen 80;
    server_name streamus.dreamhosters.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        rewrite ^/api/(.*) /$1 break;
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket for comments
    location /comments/ {
        proxy_pass http://localhost:3000/comments/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/streamus /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Manual Deployment

### Step 1: Build Locally

```bash
# Build shared package
cd packages/shared
npm run build

# Build backend
cd ../backend
npm run build

# Build frontend
cd ../frontend-web
npm run build
```

### Step 2: Transfer Files

```bash
# From project root
rsync -avz --exclude='node_modules' --exclude='.git' \
    . streamusadmin@ds15000.dreamservers.com:/home/streamusadmin/streamus.dreamhosters.com/
```

### Step 3: Server Setup

SSH into server and run:
```bash
ssh streamusadmin@ds15000.dreamservers.com
cd /home/streamusadmin/streamus.dreamhosters.com

# Install dependencies
npm install
cd packages/shared && npm install && npm run build && cd ../..
cd packages/backend && npm install && npm run build && cd ../..
cd packages/frontend-web && npm install && npm run build && cd ../..
```

## Database Setup

### Create Database

```bash
# On server, connect to PostgreSQL
psql -U postgres

CREATE DATABASE streamus_production;
CREATE USER streamus_prod WITH ENCRYPTED PASSWORD 'secure-password';
GRANT ALL PRIVILEGES ON DATABASE streamus_production TO streamus_prod;
\q
```

### Run Migrations

```bash
cd /home/streamusadmin/streamus.dreamhosters.com/packages/backend

# TypeORM will auto-sync in development
# For production, use migrations:
npm run typeorm migration:generate -- -n InitialSchema
npm run typeorm migration:run
```

## Process Management

### Using PM2 (Recommended)

Install PM2:
```bash
npm install -g pm2
```

Create PM2 ecosystem file (`ecosystem.config.js`):
```javascript
module.exports = {
  apps: [
    {
      name: 'streamus-backend',
      cwd: '/home/streamusadmin/streamus.dreamhosters.com/packages/backend',
      script: 'dist/main.js',
      env: {
        NODE_ENV: 'production',
      },
      instances: 1,
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '1G',
    },
    {
      name: 'streamus-frontend',
      cwd: '/home/streamusadmin/streamus.dreamhosters.com/packages/frontend-web',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      instances: 1,
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '1G',
    },
  ],
};
```

Start services:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Using systemd

Create service files:

**Backend** (`/etc/systemd/system/streamus-backend.service`):
```ini
[Unit]
Description=StreamUs Backend API
After=network.target postgresql.service

[Service]
Type=simple
User=streamusadmin
WorkingDirectory=/home/streamusadmin/streamus.dreamhosters.com/packages/backend
ExecStart=/usr/bin/node dist/main.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

**Frontend** (`/etc/systemd/system/streamus-frontend.service`):
```ini
[Unit]
Description=StreamUs Frontend
After=network.target

[Service]
Type=simple
User=streamusadmin
WorkingDirectory=/home/streamusadmin/streamus.dreamhosters.com/packages/frontend-web
ExecStart=/usr/bin/npm run start
Restart=on-failure
Environment=NODE_ENV=production
Environment=PORT=3001

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable streamus-backend streamus-frontend
sudo systemctl start streamus-backend streamus-frontend
```

## SSL/HTTPS Setup

### Using Let's Encrypt

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d streamus.dreamhosters.com

# Auto-renewal
sudo certbot renew --dry-run
```

Update Nginx config to use HTTPS (certbot does this automatically).

## Monitoring

### View Logs

```bash
# Backend logs
tail -f /home/streamusadmin/streamus.dreamhosters.com/packages/backend/backend.log

# Frontend logs  
tail -f /home/streamusadmin/streamus.dreamhosters.com/packages/frontend-web/frontend.log

# PM2 logs
pm2 logs

# Systemd logs
sudo journalctl -u streamus-backend -f
sudo journalctl -u streamus-frontend -f
```

### Health Checks

```bash
# Check backend
curl https://streamus.dreamhosters.com/api/

# Check frontend
curl https://streamus.dreamhosters.com/

# Check WebSocket
wscat -c wss://streamus.dreamhosters.com/comments
```

## Troubleshooting

### Services Won't Start

1. Check logs for errors
2. Verify .env configuration
3. Ensure database is accessible
4. Check port availability:
```bash
lsof -i:3000  # Backend
lsof -i:3001  # Frontend
```

### Database Connection Issues

```bash
# Test connection
psql -h DATABASE_HOST -U DATABASE_USER -d DATABASE_NAME

# Check firewall
sudo ufw status
```

### OAuth Redirect Issues

1. Update OAuth app settings in each platform
2. Ensure redirect URIs match exactly (including protocol)
3. Verify FRONTEND_URL in .env

### WebSocket Connection Failed

1. Check Nginx WebSocket proxy configuration
2. Verify firewall allows WebSocket traffic
3. Ensure CORS settings allow frontend origin

## Updating/Redeploying

```bash
# Run deployment script again
./deploy.sh

# Or manually:
ssh streamusadmin@ds15000.dreamservers.com
cd /home/streamusadmin/streamus.dreamhosters.com
git pull  # if using git
pm2 restart all  # or systemctl restart services
```

## Backup

### Database Backup

```bash
# Create backup
pg_dump -U streamus_prod streamus_production > backup_$(date +%Y%m%d).sql

# Restore backup
psql -U streamus_prod streamus_production < backup_20251219.sql
```

### File Backup

```bash
# Backup uploads/brand assets
tar -czf uploads_backup.tar.gz /path/to/uploads

# Backup configuration
cp .env .env.backup
```

## Security Checklist

- [ ] Change all default passwords
- [ ] Use strong JWT secrets (32+ characters)
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Configure firewall (allow only 80, 443, SSH)
- [ ] Set up rate limiting
- [ ] Enable CORS only for your domain
- [ ] Use environment variables for all secrets
- [ ] Regularly update dependencies
- [ ] Enable database backups
- [ ] Set up monitoring/alerts

## Performance Optimization

### Enable Caching

Install and configure Redis:
```bash
sudo apt-get install redis-server
sudo systemctl enable redis-server
```

### Database Optimization

```sql
-- Add indexes for frequent queries
CREATE INDEX idx_streams_user_status ON streams(userId, status);
CREATE INDEX idx_comments_stream_timestamp ON comments(streamId, timestamp);
```

### CDN for Static Assets

Consider using a CDN for:
- Frontend static files
- User-uploaded brand assets
- Recorded videos

## Support

**Deployment Issues**: Check [`deploy.sh`](deploy.sh) script logs
**Application Issues**: Review [`LIVE_COMMENTS_GUIDE.md`](LIVE_COMMENTS_GUIDE.md)
**Architecture Questions**: See [`plans/`](plans/) directory

---

**Last Updated**: 2025-12-19
**Server**: streamusadmin@ds15000.dreamservers.com
**Deploy Path**: /home/streamusadmin/streamus.dreamhosters.com

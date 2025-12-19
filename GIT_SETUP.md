# Pushing StreamUs to GitHub

This guide walks you through pushing your StreamUs project to a GitHub repository.

## 🚀 Quick Setup (5 minutes)

### Step 1: Initialize Git Repository

```bash
cd /Users/brandonsmith/Documents/StreamUs

# Initialize git
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: StreamUs platform foundation

- Monorepo with backend (NestJS), frontend (Next.js), shared types
- Docker infrastructure (PostgreSQL, Redis, LiveKit, MinIO)
- TypeORM database entities
- Complete architecture documentation
- Phase 1 foundation complete"
```

### Step 2: Push to Your GitHub Repository

Your repository is already created at: https://github.com/bsmitty909/StreamUs

Run these commands to push your code:

```bash
cd /Users/brandonsmith/Documents/StreamUs

# Add GitHub remote
git remote add origin https://github.com/bsmitty909/StreamUs.git

# Push code
git branch -M main
git push -u origin main
```

If the repository already has content and you want to force push:

```bash
# Force push (WARNING: This will overwrite remote content)
git push -u origin main --force
```

Or if you want to merge with existing content:

```bash
# Pull and merge first
git pull origin main --allow-unrelated-histories

# Then push
git push -u origin main
```

### Step 3: Verify Upload

```bash
# Check remote is set
git remote -v

# Should show:
# origin  https://github.com/bsmitty909/StreamUs.git (fetch)
# origin  https://github.com/bsmitty909/StreamUs.git (push)

# View repository in browser
open https://github.com/bsmitty909/StreamUs
```

## 📋 What Will Be Pushed

### Included Files ✅
- All source code (`packages/`)
- Configuration files (`package.json`, `tsconfig.json`, etc.)
- Docker setup (`docker-compose.yml`, `infrastructure/`)
- Documentation (`README.md`, `plans/`, guides)
- Environment template (`.env.example`)

### Excluded Files 🚫 (via .gitignore)
- `node_modules/` - Dependencies (reinstalled via npm install)
- `.env` - Your local environment variables (sensitive!)
- `dist/`, `build/`, `.next/` - Build outputs
- Docker volumes and temp files
- IDE-specific files

## 🔐 Security Checklist

Before pushing, verify these secrets are NOT in the repository:

```bash
# Check for accidentally committed secrets
grep -r "streamus_dev_password" --exclude-dir=node_modules .

# Should ONLY appear in:
# - .env (which is gitignored)
# - .env.example (template with placeholder values)
# - Documentation files (as examples)

# Check .env is gitignored
git check-ignore .env
# Should output: .env
```

⚠️ **Important**: The [`.env.example`](.env.example) file contains placeholder passwords that are safe to commit. Your actual [`.env`](.env) file with real credentials is gitignored and will NOT be pushed.

## 🌿 Branching Strategy (Recommended)

```bash
# Create development branch
git checkout -b develop

# Create feature branches from develop
git checkout -b feature/authentication
git checkout -b feature/webrtc-integration
git checkout -b feature/multistreaming

# Merge features into develop, then develop into main for releases
```

## 👥 Collaborating

### Clone on Another Machine

```bash
git clone https://github.com/YOUR_USERNAME/StreamUs.git
cd StreamUs

# Copy environment template
cp .env.example .env
# Edit .env with your local settings

# Install dependencies
npm install -g pnpm
cd packages/shared && npm install && npm run build
cd ../backend && npm install --legacy-peer-deps
cd ../frontend-web && npm install --legacy-peer-deps

# Start Docker
docker-compose up -d

# Start development servers
cd packages/backend && npm run start:dev &
cd packages/frontend-web && npm run dev &
```

### Add Collaborators

1. Go to: https://github.com/YOUR_USERNAME/StreamUs/settings/access
2. Click "Invite a collaborator"
3. Enter their GitHub username
4. Select permission level (Write for developers)

## 🔄 Daily Git Workflow

```bash
# Pull latest changes
git pull origin main

# Create feature branch
git checkout -b feature/your-feature-name

# Make your changes...
# Test locally...

# Stage changes
git add .

# Commit with descriptive message
git commit -m "Add user authentication with JWT tokens

- Implement bcrypt password hashing
- Create login and register endpoints
- Add JWT strategy with refresh tokens
- Unit tests for auth service"

# Push feature branch
git push origin feature/your-feature-name

# Create Pull Request on GitHub
# After review and approval, merge to main
```

## 📦 Recommended GitHub Repository Settings

### 1. Branch Protection

Go to Settings → Branches → Add rule for `main`:
- ☑ Require pull request reviews before merging
- ☑ Require status checks to pass (once CI/CD is set up)
- ☑ Include administrators

### 2. GitHub Actions Secrets

For CI/CD, add these secrets (Settings → Secrets → Actions):
- `DATABASE_URL` - Production database connection
- `JWT_SECRET` - Production JWT secret
- `LIVEKIT_API_KEY` - Production LiveKit key
- `LIVEKIT_API_SECRET` - Production LiveKit secret
- `AWS_ACCESS_KEY` - For S3 storage
- `AWS_SECRET_KEY` - For S3 storage

### 3. Topics/Tags

Add repository topics for discoverability:
- live-streaming
- webrtc
- video-conferencing
- multistreaming
- typescript
- nestjs
- nextjs
- react
- livekit

## 🚨 Important Reminders

1. **Never commit `.env`** - It's gitignored, but double-check
2. **Use `.env.example`** - Update it when you add new environment variables
3. **Keep secrets secret** - Use GitHub Secrets for CI/CD
4. **Commit message quality** - Write descriptive, meaningful commit messages
5. **Test before pushing** - Ensure app runs without errors locally

## 📝 Commit Message Convention

Use this format for consistency:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples**:

```bash
feat(backend): Add JWT authentication system

- Implement bcrypt password hashing
- Create auth module with login/register endpoints
- Add JWT strategy with refresh token rotation
- Include unit tests for auth service

Closes #1

---

fix(frontend): Fix video grid layout on mobile devices

The grid was overflowing on screens < 768px.
Now uses responsive Tailwind classes.

---

docs: Update setup instructions with MinIO configuration

Added step-by-step MinIO bucket creation for local development.

---

chore(deps): Update dependencies to latest versions

Updated Next.js, NestJS, and LiveKit SDKs for security patches.
```

## 🎯 Repository Structure Preview

Once pushed, your GitHub repo will look like:

```
StreamUs/
├── 📁 .github/              (future: CI/CD workflows)
├── 📁 infrastructure/       Docker and Kubernetes configs
├── 📁 packages/
│   ├── 📁 backend/          NestJS API
│   ├── 📁 frontend-web/     Next.js app
│   ├── 📁 mobile/           React Native (future)
│   └── 📁 shared/           TypeScript types
├── 📁 plans/                Architecture documentation
├── 📄 README.md             Project overview
├── 📄 package.json          Root workspace config
├── 📄 docker-compose.yml    Development environment
├── 📄 .env.example          Environment template
└── 📄 .gitignore            Git exclusions
```

## 🔗 Useful Git Commands

```bash
# Check status
git status

# View commit history
git log --oneline --graph

# Undo last commit (keep changes)
git reset --soft HEAD~1

# View changes
git diff

# Switch branches
git checkout branch-name

# Delete local branch
git branch -d branch-name

# Update from remote
git fetch origin
git pull origin main

# View remotes
git remote -v

# Rename branch
git branch -m old-name new-name
```

## 📞 GitHub Support Resources

- **Documentation**: https://docs.github.com/
- **GitHub CLI Docs**: https://cli.github.com/manual/
- **Git Basics**: https://git-scm.com/book/en/v2

## ✅ Verification Checklist

Before pushing to GitHub:

- [ ] Git repository initialized
- [ ] All files added and committed
- [ ] `.env` file is NOT in the staging area (`git status` shouldn't show it)
- [ ] `.env.example` contains no real secrets
- [ ] GitHub repository created
- [ ] Remote origin added
- [ ] Code pushed successfully
- [ ] Repository visible on GitHub
- [ ] README.md displays correctly on GitHub
- [ ] .gitignore working (node_modules not uploaded)

## 🎓 Next Steps After Pushing

1. **Add README badges** - Build status, license, version
2. **Set up GitHub Actions** - CI/CD pipeline
3. **Create Issues** - Track features and bugs
4. **Add Project Board** - Kanban for task management
5. **Write CONTRIBUTING.md** - Guidelines for contributors
6. **Add LICENSE** - Choose appropriate license (MIT, Apache, etc.)

---

**Ready to push?** Run the commands in Step 1 and 2 above! 🚀

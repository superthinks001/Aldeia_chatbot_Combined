# Aldeia Chatbot - Production Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [SSL Certificate Setup](#ssl-certificate-setup)
4. [Docker Deployment](#docker-deployment)
5. [CI/CD Pipeline Setup](#cicd-pipeline-setup)
6. [Monitoring and Logging](#monitoring-and-logging)
7. [Backup and Recovery](#backup-and-recovery)
8. [Troubleshooting](#troubleshooting)
9. [Security Best Practices](#security-best-practices)

---

## Prerequisites

### Server Requirements
- **OS**: Ubuntu 20.04 LTS or later (recommended) / Debian 11+ / RHEL 8+
- **CPU**: Minimum 4 cores (8 cores recommended for production)
- **RAM**: Minimum 8GB (16GB+ recommended)
- **Storage**: Minimum 50GB SSD (100GB+ recommended)
- **Network**: Static IP address with ports 80, 443 open

### Software Requirements
- Docker Engine 24.0+ ([installation guide](https://docs.docker.com/engine/install/))
- Docker Compose 2.0+ ([installation guide](https://docs.docker.com/compose/install/))
- Git 2.0+
- curl, openssl, vim/nano

### Domain Configuration
Ensure you have DNS A records pointing to your server:
- `api.aldeia.com` → Server IP
- `chat.aldeia.com` → Server IP
- `rebuild.aldeia.com` → Server IP (optional)

### Third-Party Services
1. **Supabase** (PostgreSQL Database)
   - Create project at [supabase.com](https://supabase.com)
   - Note: URL, anon key, service role key, database URL

2. **Stripe** (Billing)
   - Account at [stripe.com](https://stripe.com)
   - Get: Secret key, publishable key, webhook secret

3. **Google Cloud** (Translation API)
   - Project with Translation API enabled
   - API key with Translation API access

4. **Sentry** (Error Monitoring - Optional)
   - Project at [sentry.io](https://sentry.io)
   - Copy DSN for backend monitoring

---

## Environment Configuration

### Step 1: Clone Repository

```bash
# SSH to your production server
ssh user@your-server-ip

# Clone repository
git clone https://github.com/your-org/aldeia-chatbot.git
cd aldeia-chatbot
```

### Step 2: Create Production Environment File

```bash
# Copy template
cp .env.production .env

# Edit with your credentials
nano .env
```

### Step 3: Configure Required Secrets

**CRITICAL: Generate secure secrets for production**

```bash
# Generate JWT secrets (64 characters minimum)
openssl rand -base64 64

# Generate session secret
openssl rand -base64 32

# Generate Redis password
openssl rand -base64 32

# Generate ChromaDB token
openssl rand -base64 32
```

**Update `.env` with these generated secrets:**

```bash
# === AUTHENTICATION ===
JWT_SECRET=<generated-64-char-secret>
JWT_REFRESH_SECRET=<generated-64-char-secret-different>
SESSION_SECRET=<generated-32-char-secret>

# === REDIS ===
REDIS_PASSWORD=<generated-redis-password>

# === CHROMADB ===
CHROMA_AUTH_TOKEN=<generated-chroma-token>

# === STRIPE (Use LIVE keys for production) ===
STRIPE_SECRET_KEY=sk_live_<your-live-secret-key>
STRIPE_PUBLISHABLE_KEY=pk_live_<your-live-publishable-key>
STRIPE_WEBHOOK_SECRET=whsec_<your-webhook-secret>

# === SUPABASE ===
SUPABASE_URL=https://<your-project-id>.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
DATABASE_URL=postgresql://postgres:<password>@db.<project-id>.supabase.co:5432/postgres

# === GOOGLE TRANSLATE ===
GOOGLE_TRANSLATE_API_KEY=<your-google-cloud-api-key>

# === SENTRY (Optional) ===
SENTRY_DSN=https://<key>@sentry.io/<project-id>
```

**Validate environment file:**
```bash
# Check all required variables are set
grep -E '^[A-Z_]+=.*REPLACE.*' .env && echo "⚠️ Warning: Found placeholder values!" || echo "✅ All placeholders replaced"
```

---

## SSL Certificate Setup

### Option A: Let's Encrypt (Recommended for Production)

**1. Initial Certificate Generation**

```bash
# Create SSL directory
mkdir -p nginx/ssl

# Start nginx temporarily for ACME challenge
docker-compose -f docker-compose.production.yml up -d nginx

# Generate certificates
docker run --rm \
  -v $(pwd)/nginx/ssl:/etc/letsencrypt \
  -v $(pwd)/nginx/certbot-webroot:/var/www/certbot \
  certbot/certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email \
  -d api.aldeia.com \
  -d chat.aldeia.com \
  -d rebuild.aldeia.com

# Copy certificates to expected location
cp nginx/ssl/live/api.aldeia.com/fullchain.pem nginx/ssl/cert.pem
cp nginx/ssl/live/api.aldeia.com/privkey.pem nginx/ssl/key.pem

# Restart nginx
docker-compose -f docker-compose.production.yml restart nginx
```

**2. Auto-Renewal Setup**

```bash
# Enable certbot service in docker-compose.production.yml
# Uncomment the certbot service section

# Add cron job for renewal
echo "0 0,12 * * * cd ~/aldeia-chatbot && docker-compose -f docker-compose.production.yml restart certbot" | crontab -
```

### Option B: Self-Signed Certificate (Testing Only)

```bash
# Generate self-signed certificate (valid 365 days)
mkdir -p nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=aldeia.com"

# Warning: Browsers will show security warnings for self-signed certs
```

---

## Docker Deployment

### Step 1: Validate Configuration

```bash
# Validate docker-compose file
docker-compose -f docker-compose.production.yml config

# Check if ports are available
sudo lsof -i :80 -i :443 -i :3001 -i :3002 -i :6379 -i :8000
```

### Step 2: Pull and Build Images

```bash
# Pull base images
docker-compose -f docker-compose.production.yml pull

# Build application images
docker-compose -f docker-compose.production.yml build --no-cache
```

### Step 3: Start Services

```bash
# Start all services in detached mode
docker-compose -f docker-compose.production.yml up -d

# Check service health
docker-compose -f docker-compose.production.yml ps

# View logs
docker-compose -f docker-compose.production.yml logs -f
```

### Step 4: Run Database Migrations

```bash
# Apply database migrations
docker-compose -f docker-compose.production.yml exec backend npm run migrate

# Verify tables created
docker-compose -f docker-compose.production.yml exec backend node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT tablename FROM pg_tables WHERE schemaname = \\'public\\'', (err, res) => {
  console.log('Tables:', res.rows.map(r => r.tablename));
  pool.end();
});
"
```

### Step 5: Verify Deployment

```bash
# Test backend health
curl -f https://api.aldeia.com/api/health

# Test frontend
curl -f https://chat.aldeia.com/

# Test authentication
curl -X POST https://api.aldeia.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234!","name":"Test User","county":"LA"}'

# View service logs
docker-compose -f docker-compose.production.yml logs backend --tail=100
docker-compose -f docker-compose.production.yml logs nginx --tail=50
```

### Step 6: Monitor Resource Usage

```bash
# View resource usage
docker stats

# Check disk space
df -h

# Check service status
docker-compose -f docker-compose.production.yml ps
```

---

## CI/CD Pipeline Setup

### GitHub Actions Configuration

**1. Add GitHub Secrets**

Go to: `GitHub Repository → Settings → Secrets and variables → Actions`

Add these secrets:

```
SSH_PRIVATE_KEY - SSH private key for server deployment
SERVER_HOST - Production server IP/hostname
SERVER_USER - SSH username (e.g., ubuntu)

SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL

JWT_SECRET
JWT_REFRESH_SECRET
SESSION_SECRET

REDIS_PASSWORD
CHROMA_AUTH_TOKEN

STRIPE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET

GOOGLE_TRANSLATE_API_KEY
SENTRY_DSN
```

**2. Generate SSH Key for Deployment**

```bash
# On your local machine
ssh-keygen -t ed25519 -C "github-actions@aldeia" -f ~/.ssh/github_actions

# Copy public key to server
ssh-copy-id -i ~/.ssh/github_actions.pub user@your-server-ip

# Add private key to GitHub Secrets
cat ~/.ssh/github_actions
# Copy entire output including "-----BEGIN OPENSSH PRIVATE KEY-----"
```

**3. Test CI Pipeline**

```bash
# Push to a feature branch to trigger CI
git checkout -b test-ci
git commit --allow-empty -m "Test CI pipeline"
git push origin test-ci

# Create pull request and verify CI checks pass
```

**4. Deploy to Production**

```bash
# Merge to main branch to trigger deployment
git checkout main
git merge test-ci
git push origin main

# Monitor deployment in GitHub Actions tab
```

### Manual Deployment

If you prefer manual deployment without CI/CD:

```bash
# SSH to server
ssh user@your-server-ip
cd ~/aldeia-chatbot

# Pull latest changes
git pull origin main

# Rebuild and restart services
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml build --no-cache
docker-compose -f docker-compose.production.yml up -d

# Run migrations
docker-compose -f docker-compose.production.yml exec backend npm run migrate

# Verify deployment
docker-compose -f docker-compose.production.yml ps
```

---

## Monitoring and Logging

### View Logs

```bash
# View all logs
docker-compose -f docker-compose.production.yml logs -f

# View specific service logs
docker-compose -f docker-compose.production.yml logs -f backend
docker-compose -f docker-compose.production.yml logs -f nginx
docker-compose -f docker-compose.production.yml logs -f redis
docker-compose -f docker-compose.production.yml logs -f chromadb

# View last 100 lines
docker-compose -f docker-compose.production.yml logs --tail=100 backend
```

### Log Files Location

```
./logs/backend/       - Backend application logs
./nginx/logs/         - Nginx access and error logs
Docker logs:          - Docker daemon logs (/var/lib/docker/containers)
```

---

## Backup and Recovery

### Automated Backups

**1. Database Backup**

```bash
# Create backup script
mkdir -p ~/aldeia-chatbot/scripts
cat > ~/aldeia-chatbot/scripts/backup-database.sh << 'SCRIPT'
#!/bin/bash
BACKUP_DIR="/home/ubuntu/backups/postgres"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup using pg_dump via Docker
docker-compose -f ~/aldeia-chatbot/docker-compose.production.yml exec -T backend \
  pg_dump $DATABASE_URL > $BACKUP_DIR/aldeia_$TIMESTAMP.sql

# Compress backup
gzip $BACKUP_DIR/aldeia_$TIMESTAMP.sql

# Delete backups older than 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: aldeia_$TIMESTAMP.sql.gz"
SCRIPT

chmod +x ~/aldeia-chatbot/scripts/backup-database.sh
```

**2. Scheduled Backups (Cron)**

```bash
# Add to crontab
crontab -e

# Add this line for daily database backup at 2 AM
0 2 * * * /home/ubuntu/aldeia-chatbot/scripts/backup-database.sh >> /var/log/aldeia-backup.log 2>&1
```

### Restore from Backup

**Database Restore:**

```bash
# List backups
ls -lh ~/backups/postgres/

# Restore specific backup
gunzip -c ~/backups/postgres/aldeia_20250106_020000.sql.gz | \
  docker-compose -f docker-compose.production.yml exec -T backend \
  psql $DATABASE_URL
```

---

## Troubleshooting

### Common Issues

#### 1. Services Won't Start

```bash
# Check logs for errors
docker-compose -f docker-compose.production.yml logs

# Check port conflicts
sudo lsof -i :80 -i :443 -i :3001

# Restart services
docker-compose -f docker-compose.production.yml restart
```

#### 2. Database Connection Errors

```bash
# Test database connection
docker-compose -f docker-compose.production.yml exec backend node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT NOW()', (err, res) => {
  if (err) console.error('Error:', err);
  else console.log('Connected! Time:', res.rows[0].now);
  pool.end();
});
"

# Check DATABASE_URL format
echo $DATABASE_URL
# Should be: postgresql://postgres:password@host:5432/database
```

#### 3. SSL Certificate Issues

```bash
# Check certificate validity
openssl x509 -in nginx/ssl/cert.pem -text -noout

# Test SSL connection
openssl s_client -connect api.aldeia.com:443 -servername api.aldeia.com
```

#### 4. Nginx 502 Bad Gateway

```bash
# Check if backend is running
docker-compose -f docker-compose.production.yml ps backend

# Check backend logs
docker-compose -f docker-compose.production.yml logs backend

# Restart backend
docker-compose -f docker-compose.production.yml restart backend

# Wait for health check
curl http://localhost:3001/api/health
```

---

## Security Best Practices

### 1. Firewall Configuration

```bash
# Install UFW (Ubuntu)
sudo apt-get install ufw

# Default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### 2. Regular Security Updates

```bash
# Update system packages (Ubuntu)
sudo apt-get update
sudo apt-get upgrade -y

# Update Docker images
docker-compose -f docker-compose.production.yml pull
docker-compose -f docker-compose.production.yml up -d
```

### 3. Secret Rotation

Rotate secrets every 90 days:

```bash
# Generate new secrets
openssl rand -base64 64  # New JWT_SECRET
openssl rand -base64 64  # New JWT_REFRESH_SECRET
openssl rand -base64 32  # New SESSION_SECRET

# Update .env with new secrets
nano .env

# Restart services
docker-compose -f docker-compose.production.yml restart backend

# Update GitHub Secrets for CI/CD
```

---

## Deployment Checklist

Use this checklist for production deployment:

- [ ] Server meets minimum requirements (4 CPU, 8GB RAM, 50GB storage)
- [ ] DNS records configured for all domains
- [ ] SSL certificates generated (Let's Encrypt or self-signed)
- [ ] `.env` file created with all production secrets
- [ ] All placeholder values replaced in `.env`
- [ ] Firewall configured (ports 80, 443 open)
- [ ] Docker and Docker Compose installed
- [ ] Repository cloned to server
- [ ] Docker images built successfully
- [ ] Services started: `docker-compose up -d`
- [ ] Database migrations applied
- [ ] Health checks passing for all services
- [ ] Backend accessible: https://api.aldeia.com/api/health
- [ ] Frontend accessible: https://chat.aldeia.com
- [ ] User registration working
- [ ] Authentication flow tested
- [ ] Backup scripts configured
- [ ] Cron jobs set up for automated backups
- [ ] GitHub Actions secrets configured
- [ ] CI/CD pipeline tested
- [ ] SSL auto-renewal configured
- [ ] Security updates scheduled
- [ ] Documentation reviewed

---

**Last Updated**: 2025-01-06  
**Version**: 1.0.0 - Phase 7 Production Deployment

# Aldeia Chatbot - Rollback Procedure

**Version**: 1.0.0
**Last Updated**: January 6, 2025
**Criticality**: HIGH - Emergency Use Only

---

## 🚨 When to Use This Procedure

Use this rollback procedure if you encounter:

- **Critical bugs** in production that cannot be hotfixed immediately
- **Database corruption** or data integrity issues
- **Service outages** that cannot be resolved through restart
- **Security vulnerabilities** discovered post-deployment
- **Performance degradation** causing service disruption
- **Failed deployment** that cannot be recovered

---

## ⚡ Quick Rollback (Emergency)

If you need to rollback immediately without reading the full procedure:

```bash
# EMERGENCY ROLLBACK - Run these commands in order

# 1. Stop all services
docker-compose -f docker-compose.production.yml down

# 2. Checkout previous stable version
git checkout <previous-stable-tag>  # e.g., pre-merge-backup-20250106

# 3. Rebuild and restart
docker-compose -f docker-compose.production.yml build --no-cache
docker-compose -f docker-compose.production.yml up -d

# 4. Verify services
./validate-deployment.sh

# 5. Monitor logs
docker-compose -f docker-compose.production.yml logs -f
```

---

## 📋 Complete Rollback Procedure

### Step 1: Assess the Situation

**Before rolling back, determine**:

1. **Severity**: Is this a critical issue requiring immediate rollback?
2. **Impact**: How many users are affected?
3. **Root Cause**: Can you identify what went wrong?
4. **Alternatives**: Can you hotfix instead of rolling back?

**Decision Matrix**:

| Issue Type | Severity | Action |
|------------|----------|--------|
| Critical security vulnerability | HIGH | Immediate rollback |
| Service completely down | HIGH | Immediate rollback |
| Database corruption | HIGH | Immediate rollback |
| Performance degradation (>50%) | HIGH | Rollback within 1 hour |
| Minor bugs affecting <10% users | MEDIUM | Consider hotfix first |
| UI issues with no data impact | LOW | Hotfix in next release |

### Step 2: Notify Stakeholders

```bash
# Send notification to team
echo "🚨 ROLLBACK IN PROGRESS: $(date)" >> /var/log/aldeia-rollback.log

# Log rollback decision
cat >> /var/log/aldeia-rollback.log << EOF
Rollback initiated by: $(whoami)
Reason: [DESCRIBE REASON]
Affected services: [LIST SERVICES]
Expected downtime: [ESTIMATE]
EOF
```

### Step 3: Create Backup of Current State

```bash
# Before rolling back, backup the current state for forensics

# 1. Export current docker-compose state
docker-compose -f docker-compose.production.yml ps > rollback-backup-$(date +%Y%m%d-%H%M%S)-services.txt

# 2. Backup current environment
cp .env .env.rollback-backup-$(date +%Y%m%d-%H%M%S)

# 3. Export current database state
docker-compose -f docker-compose.production.yml exec -T backend \
  pg_dump $DATABASE_URL > rollback-backup-$(date +%Y%m%d-%H%M%S)-database.sql

# 4. Backup current logs
tar -czf rollback-logs-$(date +%Y%m%d-%H%M%S).tar.gz logs/

# 5. Note current git commit
git rev-parse HEAD > rollback-previous-commit.txt
```

### Step 4: Stop Current Deployment

```bash
# 1. Gracefully stop all services
docker-compose -f docker-compose.production.yml down

# 2. Verify all containers stopped
docker ps | grep aldeia

# 3. Wait for connections to drain (30 seconds)
sleep 30

# 4. Force stop if any containers remain
docker stop $(docker ps -q --filter "name=aldeia") 2>/dev/null || true
```

### Step 5: Identify Rollback Target

**Option A: Rollback to Previous Git Tag**

```bash
# List recent tags
git tag -l --sort=-creatordate | head -10

# Example tags:
# v1.0.0
# pre-merge-backup-20250106-143022
# phase-6-complete
# phase-5-complete

# Choose the most recent stable tag
ROLLBACK_TAG="pre-merge-backup-20250106-143022"
```

**Option B: Rollback to Specific Commit**

```bash
# View recent commits
git log --oneline -10

# Choose a stable commit
ROLLBACK_COMMIT="abc123def"
```

**Option C: Rollback to Previous Phase**

```bash
# If you know which phase was stable
ROLLBACK_TAG="phase-6-complete"  # Before Phase 7/8 deployment
```

### Step 6: Checkout Previous Version

```bash
# Stash any local changes
git stash

# Checkout the rollback target
git checkout $ROLLBACK_TAG
# OR
git checkout $ROLLBACK_COMMIT

# Verify you're on the right version
git log -1
git status
```

### Step 7: Restore Environment Configuration

```bash
# Check if .env needs to be restored
if [ -f ".env.rollback-backup-$(date +%Y%m%d)-"* ]; then
    echo "Found backup .env file"
    # Use existing .env or restore from backup
fi

# Verify critical environment variables
grep -q "JWT_SECRET=" .env || echo "⚠️ WARNING: JWT_SECRET missing"
grep -q "DATABASE_URL=" .env || echo "⚠️ WARNING: DATABASE_URL missing"
```

### Step 8: Database Rollback (If Needed)

**⚠️ CRITICAL: Only rollback database if necessary**

**Option A: Down Migrations (Recommended if available)**

```bash
# Run down migrations to undo recent schema changes
docker-compose -f docker-compose.production.yml exec backend npm run migrate:down

# Verify migration status
docker-compose -f docker-compose.production.yml exec backend npm run migrate:status
```

**Option B: Restore Database from Backup**

```bash
# ⚠️ WARNING: This will overwrite current database

# 1. Find most recent backup
ls -lt ~/backups/postgres/ | head -5

# 2. Restore from backup
gunzip -c ~/backups/postgres/aldeia_20250106_020000.sql.gz | \
  docker-compose -f docker-compose.production.yml exec -T backend \
  psql $DATABASE_URL

# 3. Verify restoration
docker-compose -f docker-compose.production.yml exec backend node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT COUNT(*) FROM users', (err, res) => {
  console.log('Users count:', res.rows[0].count);
  pool.end();
});
"
```

**Option C: No Database Rollback**

If your rollback doesn't require database changes (e.g., just code changes), skip this step.

### Step 9: Rebuild Docker Images

```bash
# Pull base images for the rollback version
docker-compose -f docker-compose.production.yml pull

# Build images from the rollback version code
docker-compose -f docker-compose.production.yml build --no-cache

# Verify images built
docker images | grep aldeia
```

### Step 10: Start Services

```bash
# Start all services
docker-compose -f docker-compose.production.yml up -d

# Wait for services to start
echo "Waiting for services to start..."
sleep 30

# Check service status
docker-compose -f docker-compose.production.yml ps
```

### Step 11: Verify Rollback

```bash
# Run validation script
./validate-deployment.sh

# Expected results:
# - All services running
# - Health checks passing
# - Authentication working
# - Database connectivity confirmed
```

### Step 12: Smoke Testing

```bash
# Test critical user flows

# 1. Health check
curl -f https://api.aldeia.com/api/health

# 2. User registration
curl -X POST https://api.aldeia.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"rollback-test@example.com","password":"Test1234!","name":"Rollback Test","county":"LA"}'

# 3. User login
curl -X POST https://api.aldeia.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"rollback-test@example.com","password":"Test1234!"}'

# 4. Frontend accessibility
curl -f https://chat.aldeia.com/
```

### Step 13: Monitor Post-Rollback

```bash
# Monitor logs for errors
docker-compose -f docker-compose.production.yml logs -f

# Check error rates (if Sentry configured)
# View Sentry dashboard

# Monitor resource usage
docker stats

# Check for any anomalies
watch -n 5 'docker-compose -f docker-compose.production.yml ps'
```

### Step 14: Document Rollback

```bash
# Create rollback report
cat > ROLLBACK_REPORT_$(date +%Y%m%d-%H%M%S).md << EOF
# Rollback Report

## Rollback Details
- **Date**: $(date)
- **Performed by**: $(whoami)
- **Rolled back from**: [Current version/commit]
- **Rolled back to**: $ROLLBACK_TAG

## Reason for Rollback
[Describe the issue that required rollback]

## Impact
- **Duration**: [How long was the issue present]
- **Users affected**: [Estimate]
- **Data loss**: [Any data lost? If yes, what]

## Rollback Steps Performed
1. Stopped services
2. Checked out previous version: $ROLLBACK_TAG
3. Rebuilt Docker images
4. [Database rollback: YES/NO]
5. Started services
6. Verified deployment

## Verification Results
- Validation script: [PASS/FAIL]
- Health checks: [PASS/FAIL]
- Smoke tests: [PASS/FAIL]

## Next Steps
1. [Root cause analysis]
2. [Fix implementation plan]
3. [Testing plan before next deployment]

## Lessons Learned
[What went wrong and how to prevent it]
EOF
```

### Step 15: Communicate Status

```bash
# Notify team that rollback is complete

echo "✅ ROLLBACK COMPLETE: $(date)" >> /var/log/aldeia-rollback.log
echo "Services restored to: $ROLLBACK_TAG" >> /var/log/aldeia-rollback.log

# Send notification to team (via Slack, email, etc.)
# Update status page if you have one
```

---

## 🔧 Partial Rollback Scenarios

### Scenario 1: Rollback Only Backend

```bash
# If only backend needs rollback

# Stop backend
docker-compose -f docker-compose.production.yml stop backend

# Checkout previous backend code
git checkout $ROLLBACK_TAG -- apps/backend/

# Rebuild and restart backend only
docker-compose -f docker-compose.production.yml build backend
docker-compose -f docker-compose.production.yml up -d backend

# Verify
curl -f https://api.aldeia.com/api/health
```

### Scenario 2: Rollback Only Frontend

```bash
# If only frontend needs rollback

# Stop frontend
docker-compose -f docker-compose.production.yml stop chatbot-frontend

# Checkout previous frontend code
git checkout $ROLLBACK_TAG -- apps/chatbot-frontend/

# Rebuild and restart frontend only
docker-compose -f docker-compose.production.yml build chatbot-frontend
docker-compose -f docker-compose.production.yml up -d chatbot-frontend

# Verify
curl -f https://chat.aldeia.com/
```

### Scenario 3: Rollback Only Configuration

```bash
# If only configuration needs rollback

# Stop services
docker-compose -f docker-compose.production.yml down

# Restore previous .env
cp .env.rollback-backup-YYYYMMDD-HHMMSS .env

# Restart with previous configuration
docker-compose -f docker-compose.production.yml up -d

# Verify
./validate-deployment.sh
```

---

## 🛡️ Rollback Prevention

To minimize the need for rollbacks:

### Pre-Deployment Checks

```bash
# Always run these before deploying

# 1. Run all tests
npm test

# 2. Run validation script in staging
./validate-deployment.sh

# 3. Check for breaking changes
git diff <previous-tag>..HEAD

# 4. Review database migrations
ls -la migrations/

# 5. Backup current state
./backup-before-deployment.sh
```

### Deployment Best Practices

1. **Blue-Green Deployment**: Deploy to a separate environment first
2. **Canary Deployment**: Roll out to small percentage of users first
3. **Feature Flags**: Use feature flags to disable problematic features
4. **Automated Tests**: Ensure high test coverage
5. **Staging Environment**: Always test in staging first
6. **Database Migrations**: Test migrations separately first
7. **Rollback Plan**: Always have a rollback plan before deploying

---

## 📞 Emergency Contacts

**If rollback fails or you need assistance**:

- **Technical Lead**: [Contact info]
- **DevOps Team**: [Contact info]
- **Database Admin**: [Contact info]
- **On-Call Engineer**: [Contact info]

---

## 📊 Post-Rollback Checklist

After rollback is complete:

- [ ] All services running and healthy
- [ ] Health checks passing
- [ ] Authentication working
- [ ] Database accessible
- [ ] Logs showing no errors
- [ ] Resource usage normal
- [ ] Smoke tests passed
- [ ] Monitoring alerts cleared
- [ ] Rollback documented
- [ ] Team notified
- [ ] Root cause analysis scheduled
- [ ] Fix plan created
- [ ] Lessons learned documented

---

## 🔄 Forward Recovery (Alternative to Rollback)

Sometimes forward recovery is better than rollback:

```bash
# If you can fix the issue with a hotfix

# 1. Create hotfix branch
git checkout -b hotfix/critical-fix

# 2. Make the fix
# [Edit files]

# 3. Test the fix
npm test

# 4. Build and deploy hotfix
docker-compose -f docker-compose.production.yml build --no-cache
docker-compose -f docker-compose.production.yml up -d

# 5. Verify
./validate-deployment.sh
```

---

**Remember**: Rollback is a last resort. Always consider if the issue can be resolved through:
1. Service restart
2. Configuration change
3. Hotfix deployment
4. Feature flag disable
5. Traffic routing

---

**Document Version**: 1.0.0
**Last Tested**: [Date]
**Next Review**: [Date]

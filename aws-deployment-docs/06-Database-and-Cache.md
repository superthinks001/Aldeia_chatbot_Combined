# Database and Cache Configuration
## RDS PostgreSQL and ElastiCache Redis for Aldeia Chatbot

**Document Version:** 1.0
**Date:** 2025-11-09

---

## Overview

This document covers configuration for:
1. **RDS PostgreSQL** - Primary application database
2. **ElastiCache Redis** - Session cache and rate limiting
3. **Backup and Recovery** strategies
4. **Performance optimization** guidelines

---

## RDS PostgreSQL Configuration

### Staging Environment

**Instance Specifications:**
```
Instance Class: db.t3.small
vCPU: 2
RAM: 2 GB
Storage: 50 GB GP3 SSD
IOPS: 3000 (baseline)
Throughput: 125 MB/s
Deployment: Single-AZ
Cost: ~$34/month
```

**Configuration Parameters:**
- **Engine:** PostgreSQL 15.4
- **DB Name:** aldeia_staging
- **Master Username:** aldeia_admin
- **Port:** 5432
- **Backup Retention:** 7 days
- **Backup Window:** 03:00-04:00 UTC
- **Maintenance Window:** Sun 04:00-05:00 UTC
- **Multi-AZ:** Disabled (cost savings)
- **Public Access:** No
- **Encryption at Rest:** Yes (AES-256)
- **Enhanced Monitoring:** Disabled
- **Performance Insights:** Disabled

### Production Environment

**Instance Specifications:**
```
Instance Class: db.t3.large
vCPU: 2
RAM: 8 GB
Storage: 100 GB GP3 SSD (auto-scaling to 500 GB)
IOPS: 3000-12000 (auto-scaling)
Throughput: 125-500 MB/s
Deployment: Multi-AZ (automatic failover)
Cost: ~$236/month
```

**Configuration Parameters:**
- **Engine:** PostgreSQL 15.4
- **DB Name:** aldeia_production
- **Master Username:** aldeia_admin
- **Port:** 5432
- **Backup Retention:** 30 days
- **Backup Window:** 03:00-04:00 UTC
- **Maintenance Window:** Sun 04:00-05:00 UTC
- **Multi-AZ:** Enabled (standby in different AZ)
- **Public Access:** No
- **Encryption at Rest:** Yes (AWS KMS)
- **Enhanced Monitoring:** Enabled (60-second intervals)
- **Performance Insights:** Enabled (7-day retention)
- **Deletion Protection:** Enabled

### RDS Subnet Groups

**Staging:**
```
Name: aldeia-staging-db-subnet-group
Description: Subnet group for staging database
Subnets:
  - aldeia-staging-private-db-1a (10.0.20.0/24)
  - aldeia-staging-private-db-1b (10.0.21.0/24)
```

**Production:**
```
Name: aldeia-prod-db-subnet-group
Description: Subnet group for production database
Subnets:
  - aldeia-prod-private-db-1a (10.1.20.0/24)
  - aldeia-prod-private-db-1b (10.1.21.0/24)
```

### RDS Parameter Groups

**Custom Parameters for Production:**
```
Parameter Group: aldeia-postgres15-prod

Key Parameters:
  shared_buffers: {DBInstanceClassMemory/4} (2GB for db.t3.large)
  max_connections: 200
  work_mem: 8MB
  maintenance_work_mem: 256MB
  effective_cache_size: {DBInstanceClassMemory*3/4} (6GB)
  random_page_cost: 1.1 (for SSD)
  log_min_duration_statement: 1000 (log queries > 1 second)
  log_connections: on
  log_disconnections: on
  log_lock_waits: on
  log_temp_files: 0
  shared_preload_libraries: pg_stat_statements
```

### Database Schema

**Existing Tables (from project):**
```sql
-- Users and authentication
users
conversations
messages
analytics

-- Billing and subscriptions
subscriptions
usage_tracking

-- Documents and embeddings
documents
document_embeddings

-- Permissions (RBAC)
permissions
role_permissions
user_roles
```

### Connection String Format

**Staging:**
```
postgresql://aldeia_admin:PASSWORD@aldeia-staging-db.xxxxx.us-east-1.rds.amazonaws.com:5432/aldeia_staging
```

**Production:**
```
postgresql://aldeia_admin:PASSWORD@aldeia-prod-db.xxxxx.us-east-1.rds.amazonaws.com:5432/aldeia_production
```

### RDS Security Best Practices

1. **Encryption:**
   - At rest: Enabled via AWS KMS
   - In transit: Force SSL connections

2. **Access Control:**
   - Security group: Only allow port 5432 from application security group
   - No public access
   - IAM database authentication (optional)

3. **Monitoring:**
   - Enhanced monitoring for CPU, memory, disk I/O
   - Performance Insights for query analysis
   - CloudWatch alarms for critical metrics

4. **Backup Strategy:**
   - Automated daily backups
   - Manual snapshots before major deployments
   - Cross-region snapshot copy for disaster recovery

---

## ElastiCache Redis Configuration

### Staging Environment

**Cluster Specifications:**
```
Engine: Redis 7.0
Node Type: cache.t3.micro
Memory: 0.5 GB
Nodes: 1 (single node)
Multi-AZ: Disabled
Cost: ~$12/month
```

**Configuration:**
- **Cluster Name:** aldeia-staging-redis
- **Port:** 6379
- **Parameter Group:** default.redis7
- **Auth Token:** Enabled (strong password)
- **Encryption in Transit:** Enabled
- **Encryption at Rest:** Enabled
- **Automatic Backups:** 7-day retention
- **Snapshot Window:** 03:00-05:00 UTC
- **Maintenance Window:** Sun 05:00-06:00 UTC

### Production Environment

**Cluster Specifications:**
```
Engine: Redis 7.0
Node Type: cache.t3.small
Memory: 1.37 GB per node
Nodes: 2 (primary + replica)
Multi-AZ: Enabled (automatic failover)
Cost: ~$50/month
```

**Configuration:**
- **Replication Group:** aldeia-prod-redis
- **Primary Node:** us-east-1a
- **Replica Node:** us-east-1b
- **Automatic Failover:** Enabled
- **Auth Token:** Enabled
- **Encryption in Transit:** TLS 1.2+
- **Encryption at Rest:** AES-256
- **Automatic Backups:** 14-day retention
- **Snapshot Window:** 03:00-05:00 UTC

### Redis Subnet Groups

**Staging:**
```
Name: aldeia-staging-redis-subnet-group
Subnets:
  - aldeia-staging-private-db-1a
  - aldeia-staging-private-db-1b
```

**Production:**
```
Name: aldeia-prod-redis-subnet-group
Subnets:
  - aldeia-prod-private-db-1a
  - aldeia-prod-private-db-1b
```

### Redis Configuration Parameters

**Custom Parameter Group:**
```
Parameter Group: aldeia-redis7-prod

Parameters:
  maxmemory-policy: allkeys-lru
  timeout: 300
  tcp-keepalive: 300
  maxmemory-samples: 5
  notify-keyspace-events: Ex (for expiration events)
```

### Redis Use Cases in Aldeia

**1. Session Management:**
```
Key Pattern: session:{sessionId}
TTL: 24 hours
Data: User session data, JWT tokens
```

**2. Rate Limiting:**
```
Key Pattern: ratelimit:{ip}:{endpoint}
TTL: 15 minutes
Data: Request counter
```

**3. Cache:**
```
Key Pattern: cache:{resource}:{id}
TTL: 1 hour
Data: Frequently accessed data (user profiles, documents)
```

**4. Real-time Chat:**
```
Key Pattern: chat:{conversationId}
Data Structure: List (message queue)
```

### Connection String Format

**Staging:**
```
redis://aldeia-staging-redis.xxxxx.cache.amazonaws.com:6379
Password: (from Secrets Manager)
```

**Production (with Auth):**
```
redis://aldeia-prod-redis.xxxxx.cache.amazonaws.com:6379
Password: (from Secrets Manager)
TLS: Required
```

---

## Backup and Recovery

### Automated Backups

**RDS Automated Backups:**
- **Staging:** Daily, 7-day retention
- **Production:** Daily, 30-day retention
- **Backup Window:** 03:00-04:00 UTC (low-traffic period)
- **Point-in-Time Recovery:** Enabled (5-minute granularity)

**ElastiCache Snapshots:**
- **Staging:** Daily, 7-day retention
- **Production:** Daily, 14-day retention
- **Snapshot Window:** 03:00-05:00 UTC

### Manual Snapshots

**Before Major Deployments:**
```bash
# RDS Snapshot
aws rds create-db-snapshot \
  --db-instance-identifier aldeia-prod-db \
  --db-snapshot-identifier aldeia-prod-pre-deploy-$(date +%Y%m%d-%H%M)

# ElastiCache Snapshot
aws elasticache create-snapshot \
  --replication-group-id aldeia-prod-redis \
  --snapshot-name aldeia-prod-redis-pre-deploy-$(date +%Y%m%d-%H%M)
```

### Disaster Recovery Plan

**RTO (Recovery Time Objective):** 1 hour
**RPO (Recovery Point Objective):** 5 minutes

**Recovery Steps:**

**1. RDS Recovery:**
```bash
# Option A: Point-in-Time Restore
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier aldeia-prod-db \
  --target-db-instance-identifier aldeia-prod-db-restored \
  --restore-time 2025-01-09T10:00:00Z

# Option B: Restore from Snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier aldeia-prod-db-restored \
  --db-snapshot-identifier aldeia-prod-snapshot-20250109
```

**2. ElastiCache Recovery:**
```bash
aws elasticache create-replication-group \
  --replication-group-id aldeia-prod-redis-restored \
  --replication-group-description "Restored cluster" \
  --snapshot-name aldeia-prod-redis-snapshot-20250109 \
  --cache-node-type cache.t3.small \
  --num-cache-clusters 2 \
  --automatic-failover-enabled
```

### Cross-Region Backup (Optional)

**For Disaster Recovery:**
```bash
# Copy RDS snapshot to another region
aws rds copy-db-snapshot \
  --source-db-snapshot-identifier arn:aws:rds:us-east-1:123456789:snapshot:aldeia-prod-snapshot \
  --target-db-snapshot-identifier aldeia-prod-snapshot-dr \
  --region us-west-2

# Cost: Storage in secondary region + data transfer
```

---

## Performance Optimization

### RDS Performance Tuning

**1. Connection Pooling (Application Side):**
```javascript
// Backend configuration (apps/backend/src/database/client.ts)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum connections
  min: 5,  // Minimum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});
```

**2. Query Optimization:**
- Use indexes on frequently queried columns
- Analyze slow queries via Performance Insights
- Use prepared statements
- Implement pagination for large result sets

**3. Read Replica (Production, Optional):**
```
Purpose: Offload read-heavy queries
Instance: db.t3.medium
Use Cases:
  - Analytics queries
  - Report generation
  - Search functionality
Cost: Additional ~$56/month
```

### Redis Performance Tuning

**1. Memory Management:**
```
Monitor memory usage:
  - Warning threshold: 75%
  - Critical threshold: 85%
  - Action: Scale up node type

Eviction policy: allkeys-lru
  - Automatically removes least recently used keys
```

**2. Connection Pooling:**
```javascript
// Backend Redis configuration
const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: 6379,
  password: process.env.REDIS_PASSWORD,
  tls: { rejectUnauthorized: false },
  retryStrategy: (times) => Math.min(times * 50, 2000),
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  enableOfflineQueue: false
});
```

**3. Key Expiration:**
```
Set TTL on all keys to prevent memory bloat:
  - Sessions: 24 hours
  - Cache: 1 hour
  - Rate limits: 15 minutes
```

---

## Monitoring and Alerts

### RDS CloudWatch Metrics

**Key Metrics to Monitor:**
```
CPUUtilization - Alert if > 75% for 5 minutes
FreeableMemory - Alert if < 512 MB
FreeStorageSpace - Alert if < 5 GB
DatabaseConnections - Alert if > 180 (of 200 max)
ReadLatency - Alert if > 10ms
WriteLatency - Alert if > 10ms
ReadIOPS - Monitor for scaling decisions
WriteIOPS - Monitor for scaling decisions
```

### ElastiCache CloudWatch Metrics

**Key Metrics to Monitor:**
```
CPUUtilization - Alert if > 70% for 5 minutes
NetworkBytesIn/Out - Monitor for traffic patterns
EngineCPUUtilization - Redis-specific CPU
Evictions - Alert if > 0 (memory pressure)
CacheHitRate - Monitor (aim for > 90%)
CurrConnections - Monitor for connection leaks
SwapUsage - Alert if > 50 MB
```

### Recommended Alarms

**RDS Alarms:**
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name aldeia-prod-db-cpu-high \
  --alarm-description "RDS CPU utilization high" \
  --metric-name CPUUtilization \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --threshold 75 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --dimensions Name=DBInstanceIdentifier,Value=aldeia-prod-db \
  --alarm-actions arn:aws:sns:us-east-1:123456789:aldeia-prod-alarms
```

**Redis Alarms:**
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name aldeia-prod-redis-memory-high \
  --alarm-description "Redis memory utilization high" \
  --metric-name DatabaseMemoryUsagePercentage \
  --namespace AWS/ElastiCache \
  --statistic Average \
  --period 300 \
  --threshold 85 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --dimensions Name=CacheClusterId,Value=aldeia-prod-redis-001 \
  --alarm-actions arn:aws:sns:us-east-1:123456789:aldeia-prod-alarms
```

---

## Migration from Supabase to RDS

### Pre-Migration Checklist

- [ ] Provision RDS instance
- [ ] Create database and user
- [ ] Run migrations on RDS
- [ ] Create manual Supabase backup
- [ ] Test application connectivity to RDS
- [ ] Plan maintenance window

### Migration Steps

**1. Export from Supabase:**
```bash
# Using pg_dump
pg_dump "postgresql://postgres:password@db.project.supabase.co:5432/postgres" \
  --no-owner --no-acl --format=plain > supabase_backup.sql
```

**2. Import to RDS:**
```bash
# Using psql
psql "postgresql://aldeia_admin:password@aldeia-prod-db.xxxxx.us-east-1.rds.amazonaws.com:5432/aldeia_production" \
  < supabase_backup.sql
```

**3. Verify Data:**
```sql
-- Compare row counts
SELECT schemaname, tablename, n_live_tup as row_count
FROM pg_stat_user_tables
ORDER BY tablename;
```

**4. Update Application:**
```bash
# Update DATABASE_URL in Secrets Manager
aws secretsmanager update-secret \
  --secret-id production/database/credentials \
  --secret-string '{"DATABASE_URL":"postgresql://aldeia_admin:PASSWORD@aldeia-prod-db.xxxxx.us-east-1.rds.amazonaws.com:5432/aldeia_production"}'

# Restart application
aws ecs update-service --cluster aldeia-prod-cluster --service aldeia-prod-backend --force-new-deployment
```

---

## Cost Optimization Strategies

### RDS Cost Optimization

**1. Reserved Instances (1-Year):**
```
db.t3.small:  $28/mo → $18/mo (36% savings)
db.t3.large:  $225/mo → $145/mo (36% savings)
Annual Savings: ~$960 for production
```

**2. Right-Sizing:**
- Monitor CPU and memory utilization
- Start with smaller instances, scale up if needed
- Consider Aurora Serverless for variable workloads

**3. Storage Optimization:**
- Use GP3 instead of GP2 (same cost, better performance)
- Enable storage auto-scaling
- Cleanup old data and unused indexes

### Redis Cost Optimization

**1. Reserved Nodes (1-Year):**
```
cache.t3.small: $25/mo → $16/mo (36% savings)
```

**2. Memory Optimization:**
- Set appropriate TTLs on all keys
- Use memory-efficient data structures
- Monitor and remove unused keys

---

## Summary and Next Steps

### Deployment Order

1. Create RDS subnet groups
2. Create RDS security groups
3. Provision RDS instances
4. Run database migrations
5. Create ElastiCache subnet groups
6. Create Redis security groups
7. Provision ElastiCache clusters
8. Test connectivity from application tier
9. Configure monitoring and alarms
10. Set up automated backups

### Configuration Files to Update

**Backend .env:**
```bash
DATABASE_URL=postgresql://user:pass@host:5432/dbname
REDIS_URL=redis://host:6379
REDIS_PASSWORD=strongpassword
```

### Validation Checklist

- [ ] RDS accepting connections from application security group
- [ ] Database migrations completed successfully
- [ ] Redis auth working correctly
- [ ] Backup retention configured
- [ ] CloudWatch alarms created and tested
- [ ] Performance Insights enabled (production)
- [ ] Connection pooling configured in application
- [ ] Encryption at rest and in transit verified

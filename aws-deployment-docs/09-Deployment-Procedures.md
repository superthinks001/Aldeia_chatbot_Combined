# Deployment Procedures
## Step-by-Step Guide for AWS Infrastructure Deployment

**Document Version:** 1.0
**Date:** 2025-11-09

---

## Deployment Timeline

**Total Time:** 4 weeks (20 business days)

| Phase | Duration | Focus |
|-------|----------|-------|
| Phase 1 | Week 1 | Foundation (AWS setup, networking, core infrastructure) |
| Phase 2 | Week 2 | Application deployment (compute, secrets, migrations) |
| Phase 3 | Week 3 | Testing & validation (load testing, monitoring, backups) |
| Phase 4 | Week 4 | Production deployment & go-live |

---

## Phase 1: Foundation (Week 1)

### Day 1-2: AWS Account Setup

**Tasks:**
- [ ] Create AWS account (if needed)
- [ ] Enable MFA on root account
- [ ] Create IAM admin user with MFA
- [ ] Configure AWS CLI locally
- [ ] Set up billing alerts
- [ ] Request service limit increases (if needed)

**Commands:**
```bash
# Configure AWS CLI
aws configure
# Enter: Access Key ID, Secret Access Key, Region (us-east-1), Output (json)

# Verify configuration
aws sts get-caller-identity

# Create billing alarms
aws cloudwatch put-metric-alarm \
  --alarm-name billing-alert-200 \
  --alarm-description "Alert when charges exceed $200" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 21600 \
  --threshold 200 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1
```

**Verification:**
- [ ] Can login to AWS console as IAM user
- [ ] AWS CLI returns account information
- [ ] Billing alerts configured

---

### Day 3-4: Networking (Staging VPC)

**Tasks:**
- [ ] Create staging VPC (10.0.0.0/16)
- [ ] Create 6 subnets (2 public, 4 private)
- [ ] Create Internet Gateway
- [ ] Create NAT Gateway
- [ ] Configure route tables
- [ ] Create security groups

**CLI Reference:** See document 10 (AWS CLI Commands)

**Verification:**
```bash
# List VPCs
aws ec2 describe-vpcs --filters "Name=tag:Name,Values=aldeia-staging-vpc"

# List subnets
aws ec2 describe-subnets --filters "Name=vpc-id,Values=vpc-xxxxx"

# Verify Internet Gateway attached
aws ec2 describe-internet-gateways --filters "Name=attachment.vpc-id,Values=vpc-xxxxx"

# Verify NAT Gateway available
aws ec2 describe-nat-gateways --filter "Name=vpc-id,Values=vpc-xxxxx"
```

---

### Day 5-7: Core Infrastructure (Staging)

**Tasks:**
- [ ] Provision RDS PostgreSQL (db.t3.small)
- [ ] Provision ElastiCache Redis (cache.t3.micro)
- [ ] Create Application Load Balancer
- [ ] Request ACM certificate for *.staging.aldeia.com
- [ ] Configure Route 53 hosted zone
- [ ] Add DNS validation records for ACM

**RDS Creation:**
```bash
# Generate password
DB_PASSWORD=$(openssl rand -base64 32)
echo "Save this password: $DB_PASSWORD"

# Create DB subnet group
aws rds create-db-subnet-group \
  --db-subnet-group-name aldeia-staging-db-subnet-group \
  --db-subnet-group-description "Staging DB subnet group" \
  --subnet-ids subnet-db1a-xxxxx subnet-db1b-xxxxx

# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier aldeia-staging-db \
  --db-instance-class db.t3.small \
  --engine postgres \
  --engine-version 15.4 \
  --master-username aldeia_admin \
  --master-user-password "$DB_PASSWORD" \
  --allocated-storage 50 \
  --storage-type gp3 \
  --db-subnet-group-name aldeia-staging-db-subnet-group \
  --vpc-security-group-ids sg-db-xxxxx \
  --backup-retention-period 7 \
  --db-name aldeia_staging \
  --no-publicly-accessible

# Wait for available status (10-15 minutes)
aws rds wait db-instance-available --db-instance-identifier aldeia-staging-db
```

**ElastiCache Creation:**
```bash
# Generate auth token
REDIS_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/")

# Create cache subnet group
aws elasticache create-cache-subnet-group \
  --cache-subnet-group-name aldeia-staging-redis-subnet-group \
  --cache-subnet-group-description "Staging Redis subnet group" \
  --subnet-ids subnet-db1a-xxxxx subnet-db1b-xxxxx

# Create Redis cluster
aws elasticache create-cache-cluster \
  --cache-cluster-id aldeia-staging-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --engine-version 7.0 \
  --num-cache-nodes 1 \
  --cache-subnet-group-name aldeia-staging-redis-subnet-group \
  --security-group-ids sg-redis-xxxxx \
  --auth-token "$REDIS_PASSWORD" \
  --transit-encryption-enabled
```

**ACM Certificate:**
```bash
# Request certificate
aws acm request-certificate \
  --domain-name "*.staging.aldeia.com" \
  --validation-method DNS \
  --tags Key=Environment,Value=staging

# Get validation records
aws acm describe-certificate --certificate-arn arn:aws:acm:us-east-1:123456789:certificate/xxxxx

# Add CNAME records to Route 53 for validation
```

**Verification:**
- [ ] RDS status: available
- [ ] ElastiCache status: available
- [ ] ALB status: active
- [ ] ACM certificate status: issued
- [ ] Can resolve *.staging.aldeia.com

---

## Phase 2: Application Deployment (Week 2)

### Day 8-10: Container Setup (Staging)

**Option A: EC2 Deployment**

**Tasks:**
- [ ] Launch EC2 instance (t3.medium)
- [ ] Install Docker & Docker Compose
- [ ] Configure CloudWatch agent
- [ ] Clone repository
- [ ] Configure environment variables

**Commands:**
```bash
# Launch EC2 instance with user data
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \  # Ubuntu 22.04
  --instance-type t3.medium \
  --key-name your-key-pair \
  --security-group-ids sg-app-xxxxx \
  --subnet-id subnet-app1a-xxxxx \
  --iam-instance-profile Name=EC2-AldeiaRole \
  --user-data file://ec2-user-data.sh \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=aldeia-staging-app}]'
```

**Option B: ECS Fargate Deployment**

**Tasks:**
- [ ] Create ECR repositories
- [ ] Build and push Docker images
- [ ] Create ECS cluster
- [ ] Create task definitions
- [ ] Create ECS services

**Commands:**
```bash
# Create ECR repositories
aws ecr create-repository --repository-name aldeia/backend
aws ecr create-repository --repository-name aldeia/frontend

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com

# Build and push backend
cd apps/backend
docker build -t 123456789.dkr.ecr.us-east-1.amazonaws.com/aldeia/backend:latest .
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/aldeia/backend:latest

# Create ECS cluster
aws ecs create-cluster --cluster-name aldeia-staging-cluster

# Register task definition
aws ecs register-task-definition --cli-input-json file://backend-task-def.json

# Create service
aws ecs create-service \
  --cluster aldeia-staging-cluster \
  --service-name aldeia-staging-backend \
  --task-definition aldeia-staging-backend:1 \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-app1a-xxxxx,subnet-app1b-xxxxx],securityGroups=[sg-app-xxxxx],assignPublicIp=DISABLED}" \
  --load-balancers targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=backend,containerPort=3001
```

---

### Day 11-12: Secrets & Configuration

**Tasks:**
- [ ] Generate all secrets
- [ ] Store secrets in Secrets Manager
- [ ] Create IAM roles
- [ ] Configure application environment variables

**Commands:**
```bash
# Generate secrets
JWT_SECRET=$(openssl rand -base64 64)
JWT_REFRESH_SECRET=$(openssl rand -base64 64)
CHROMA_AUTH_TOKEN=$(openssl rand -base64 32)

# Create database credentials secret
aws secretsmanager create-secret \
  --name staging/database/credentials \
  --secret-string "{
    \"username\":\"aldeia_admin\",
    \"password\":\"$DB_PASSWORD\",
    \"host\":\"aldeia-staging-db.xxxxx.us-east-1.rds.amazonaws.com\",
    \"port\":5432,
    \"dbname\":\"aldeia_staging\",
    \"DATABASE_URL\":\"postgresql://aldeia_admin:$DB_PASSWORD@aldeia-staging-db.xxxxx.us-east-1.rds.amazonaws.com:5432/aldeia_staging\"
  }"

# Create JWT secrets
aws secretsmanager create-secret \
  --name staging/jwt/secrets \
  --secret-string "{
    \"JWT_SECRET\":\"$JWT_SECRET\",
    \"JWT_REFRESH_SECRET\":\"$JWT_REFRESH_SECRET\"
  }"

# Similar for other secrets...
```

**Verification:**
- [ ] All secrets created in Secrets Manager
- [ ] IAM roles have access to secrets
- [ ] Application can retrieve secrets

---

### Day 13-14: Database Migrations

**Tasks:**
- [ ] Test RDS connectivity
- [ ] Run database migrations
- [ ] Seed initial data (if needed)
- [ ] Verify schema

**Commands:**
```bash
# Test connectivity from EC2/ECS
psql "postgresql://aldeia_admin:PASSWORD@aldeia-staging-db.xxxxx.us-east-1.rds.amazonaws.com:5432/aldeia_staging" -c "SELECT version();"

# Run migrations (from application)
cd apps/backend
npm run migrate

# Verify tables created
psql "postgresql://..." -c "\dt"
```

**Verification:**
- [ ] All migrations successful
- [ ] Tables created correctly
- [ ] Can insert/query data

---

## Phase 3: Testing & Validation (Week 3)

### Day 15-17: Application Testing

**Tasks:**
- [ ] Verify health check endpoints
- [ ] Test user registration
- [ ] Test authentication flow
- [ ] Test chat functionality
- [ ] Test WebSocket connections
- [ ] Verify logging to CloudWatch

**Manual Testing:**
```bash
# Health check
curl -f https://api.staging.aldeia.com/api/health

# User registration
curl -X POST https://api.staging.aldeia.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"Test1234!",
    "name":"Test User",
    "county":"LA"
  }'

# Login
curl -X POST https://api.staging.aldeia.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"Test1234!"
  }'

# Chat message (with token)
curl -X POST https://api.staging.aldeia.com/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "message":"Hello, I need help with fire recovery",
    "conversationId":"123"
  }'
```

**Load Testing:**
```bash
# Install Apache Bench
sudo apt-get install apache2-utils

# Test with 100 concurrent users
ab -n 1000 -c 100 -H "Authorization: Bearer TOKEN" https://api.staging.aldeia.com/api/health

# Or use k6
k6 run loadtest.js
```

---

### Day 18-19: Monitoring Setup

**Tasks:**
- [ ] Create CloudWatch Log groups
- [ ] Configure log retention
- [ ] Create CloudWatch alarms
- [ ] Set up SNS topics
- [ ] Create dashboards
- [ ] Test alarm notifications

**Verification:**
- [ ] Logs flowing to CloudWatch
- [ ] Alarms trigger correctly
- [ ] Email notifications received
- [ ] Dashboards showing metrics

---

### Day 20-21: Backup & Security

**Tasks:**
- [ ] Configure AWS Backup plans
- [ ] Test RDS backup/restore
- [ ] Test ElastiCache snapshot
- [ ] Review security group rules
- [ ] Enable VPC Flow Logs
- [ ] Enable GuardDuty (production only)

**RDS Backup Test:**
```bash
# Create manual snapshot
aws rds create-db-snapshot \
  --db-instance-identifier aldeia-staging-db \
  --db-snapshot-identifier aldeia-staging-test-snapshot

# Restore from snapshot (to test recovery)
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier aldeia-staging-db-test \
  --db-snapshot-identifier aldeia-staging-test-snapshot

# Delete test instance after verification
aws rds delete-db-instance \
  --db-instance-identifier aldeia-staging-db-test \
  --skip-final-snapshot
```

---

## Phase 4: Production Deployment (Week 4)

### Day 22-23: Production Networking

**Tasks:**
- [ ] Create production VPC (10.1.0.0/16)
- [ ] Create subnets (same structure as staging)
- [ ] Create 2x NAT Gateways (Multi-AZ)
- [ ] Configure route tables
- [ ] Create security groups
- [ ] Request ACM certificate for *.aldeia.com

**Note:** Follow same steps as staging but with production specifications

---

### Day 24-26: Production Infrastructure

**Tasks:**
- [ ] Provision RDS (db.t3.large, Multi-AZ)
- [ ] Provision ElastiCache (cache.t3.small, Multi-AZ)
- [ ] Create Application Load Balancer
- [ ] Configure WAF
- [ ] Create production secrets
- [ ] Deploy application (2+ instances/tasks)

**Production-Specific Configurations:**

**Enable Multi-AZ RDS:**
```bash
aws rds create-db-instance \
  --db-instance-identifier aldeia-prod-db \
  --db-instance-class db.t3.large \
  --engine postgres \
  --multi-az \
  --backup-retention-period 30 \
  --storage-encrypted \
  --enable-performance-insights \
  ... # other parameters
```

**Enable WAF:**
```bash
# Create Web ACL
aws wafv2 create-web-acl \
  --name aldeia-prod-waf \
  --scope REGIONAL \
  --default-action Allow={} \
  --rules file://waf-rules.json

# Associate with ALB
aws wafv2 associate-web-acl \
  --web-acl-arn arn:aws:wafv2:us-east-1:123456789:regional/webacl/aldeia-prod-waf/xxxxx \
  --resource-arn arn:aws:elasticloadbalancing:us-east-1:123456789:loadbalancer/app/aldeia-prod-alb/xxxxx
```

---

### Day 27-28: Production Testing

**Tasks:**
- [ ] Run database migrations
- [ ] Configure production monitoring
- [ ] Load testing (1000+ concurrent users)
- [ ] Test failover scenarios
- [ ] Verify backup automation
- [ ] Security scan

**Failover Test:**
```bash
# Test RDS Multi-AZ failover
aws rds reboot-db-instance \
  --db-instance-identifier aldeia-prod-db \
  --force-failover

# Monitor failover (should complete in ~2 minutes)
aws rds describe-db-instances --db-instance-identifier aldeia-prod-db
```

---

### Day 29-30: Go-Live

**Tasks:**
- [ ] Final security review
- [ ] Update DNS to production
- [ ] Monitor for 24 hours
- [ ] Document runbooks
- [ ] Train team

**DNS Cutover:**
```bash
# Update Route 53 records
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234567890ABC \
  --change-batch file://dns-update.json

# Monitor ALB metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApplicationELB \
  --metric-name RequestCount \
  --dimensions Name=LoadBalancer,Value=app/aldeia-prod-alb/xxxxx \
  --start-time 2025-01-09T00:00:00Z \
  --end-time 2025-01-09T23:59:59Z \
  --period 300 \
  --statistics Sum
```

**Go-Live Checklist:**
- [ ] All services healthy
- [ ] Monitoring dashboards green
- [ ] No alarms triggered
- [ ] Load testing passed
- [ ] Backup verified
- [ ] Team notified
- [ ] Incident response plan ready

---

## Rollback Procedures

### Application Rollback (ECS)

```bash
# List task definitions
aws ecs list-task-definitions --family-prefix aldeia-prod-backend

# Update service to previous version
aws ecs update-service \
  --cluster aldeia-prod-cluster \
  --service aldeia-prod-backend \
  --task-definition aldeia-prod-backend:PREVIOUS_VERSION
```

### Database Rollback

```bash
# Point-in-time restore
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier aldeia-prod-db \
  --target-db-instance-identifier aldeia-prod-db-rollback \
  --restore-time 2025-01-09T10:00:00Z

# After verification, update application to use new endpoint
```

---

## Post-Deployment Tasks

### Week 1 After Launch
- [ ] Monitor logs daily
- [ ] Review all alarms
- [ ] Check costs vs budget
- [ ] Gather user feedback
- [ ] Document any issues

### Week 2-4 After Launch
- [ ] Performance tuning
- [ ] Cost optimization
- [ ] Security hardening
- [ ] Process improvements

### Monthly
- [ ] Review costs
- [ ] Update dependencies
- [ ] Security patches
- [ ] Backup testing
- [ ] Disaster recovery drill

---

## Summary

**Deployment Phases:**
1. ✅ Foundation - AWS setup, networking, core infrastructure
2. ✅ Application - Container deployment, secrets, migrations
3. ✅ Testing - Load testing, monitoring, backups
4. ✅ Production - Full deployment, go-live, monitoring

**Next Steps:**
1. Review and approve deployment plan
2. Gather all prerequisites
3. Schedule deployment windows
4. Begin Phase 1

**Total Estimated Time:** 4 weeks
**Estimated Cost:** ~$770-1,186/month (both environments)

# AWS Infrastructure Checklist
## Complete Resource List for Aldeia Chatbot Platform

**Document Version:** 1.0
**Date:** 2025-11-09

---

## 1. AWS Account Setup

### Prerequisites
- ~~[x] AWS Account created~~
- [ ] Root account MFA enabled
- ~~[x] IAM admin user created (DO NOT use root account)~~
- [ ] Billing alerts configured ($50, $200, $500 thresholds)
- ~~[x] AWS CLI installed and configured locally~~
- [ ] AWS Organizations set up (optional, for multi-account strategy)

### IAM Setup
- [ ] Admin user with MFA enabled
- [ ] Service roles for EC2, RDS, ECS created
- [ ] Least privilege policies defined
- [ ] IAM role for GitHub Actions (OIDC authentication)
- [ ] IAM role for EC2 instances (EC2-RoleForSSM)

---

## 2. Networking Infrastructure (VPC)

### Non-Production VPC
- ~~[x] **VPC:** Create VPC `aldeia-staging-vpc` - 10.0.0.0/16~~
- ~~[x] **Subnets:**~~
  - ~~[x] Public Subnet 1: 10.0.1.0/24 (us-east-1a)~~
  - ~~[x] Public Subnet 2: 10.0.2.0/24 (us-east-1b)~~
  - ~~[x] Private Subnet 1: 10.0.10.0/24 (us-east-1a) - Application layer~~
  - ~~[x] Private Subnet 2: 10.0.11.0/24 (us-east-1b) - Application layer~~
  - ~~[x] Private Subnet 3: 10.0.20.0/24 (us-east-1a) - Database layer~~
  - ~~[x] Private Subnet 4: 10.0.21.0/24 (us-east-1b) - Database layer~~
- ~~[x] **Internet Gateway:** Create and attach to VPC~~
- ~~[x] **NAT Gateway:** 1x NAT Gateway in Public Subnet 1 (~$32/mo)~~
- ~~[x] **Route Tables:**~~
  - ~~[x] Public route table (0.0.0.0/0 → IGW)~~
  - ~~[x] Private route table (0.0.0.0/0 → NAT Gateway)~~

### Production VPC
- [ ] **VPC:** Create VPC `aldeia-prod-vpc` - 10.1.0.0/16
- [ ] **Subnets:**
  - [ ] Public Subnet 1: 10.1.1.0/24 (us-east-1a)
  - [ ] Public Subnet 2: 10.1.2.0/24 (us-east-1b)
  - [ ] Private Subnet 1: 10.1.10.0/24 (us-east-1a)
  - [ ] Private Subnet 2: 10.1.11.0/24 (us-east-1b)
  - [ ] Private Subnet 3: 10.1.20.0/24 (us-east-1a)
  - [ ] Private Subnet 4: 10.1.21.0/24 (us-east-1b)
- [ ] **NAT Gateways:** 2x NAT Gateways (one per AZ for HA) (~$64/mo)
- [ ] **Route Tables:** Same as staging

### Security Groups
- [ ] **ALB Security Group** (sg-alb)
  - Inbound: 80/tcp (0.0.0.0/0), 443/tcp (0.0.0.0/0)
  - Outbound: All traffic
- [ ] **Application Security Group** (sg-app)
  - Inbound: 3001/tcp (from ALB SG), 3002/tcp (from ALB SG), 22/tcp (from Bastion SG)
  - Outbound: All traffic
- [ ] **Database Security Group** (sg-db)
  - Inbound: 5432/tcp (from Application SG)
  - Outbound: All traffic
- [ ] **Redis Security Group** (sg-redis)
  - Inbound: 6379/tcp (from Application SG)
  - Outbound: All traffic
- [ ] **Bastion Security Group** (sg-bastion) - Optional
  - Inbound: 22/tcp (your IP only)
  - Outbound: All traffic

---

## 3. Compute Resources

### Option A: EC2 with Docker

**Non-Production:**
- [ ] **EC2 Instance:** 1x t3.medium (2 vCPU, 4GB RAM) - ~$30/mo
  - AMI: Ubuntu 22.04 LTS
  - Subnet: Private Subnet 1
  - Security Group: sg-app
  - IAM Role: EC2-RoleForSSM (for Systems Manager)
  - Storage: 50GB GP3 EBS (~$4/mo)
  - User Data: Install Docker, Docker Compose, CloudWatch agent

**Production:**
- [ ] **Auto Scaling Group:** 2-4 instances of t3.large (2 vCPU, 8GB RAM) - ~$120-240/mo
  - Launch Template with Ubuntu 22.04 LTS
  - Storage: 100GB GP3 EBS per instance (~$8/mo each)
  - Desired: 2, Min: 2, Max: 4
  - Health check grace period: 300s
  - Scaling policies: CPU > 70% (scale up), CPU < 30% (scale down)

### Option B: ECS Fargate (Recommended)

**Non-Production:**
- [ ] **ECS Cluster:** aldeia-staging-cluster
- [ ] **Task Definitions:**
  - [ ] Backend task definition (0.5 vCPU, 1GB RAM) - ~$15/mo
  - [ ] Frontend task definition (0.25 vCPU, 0.5GB RAM) - ~$7/mo
  - [ ] ChromaDB task definition (1 vCPU, 2GB RAM) - ~$30/mo
- [ ] **ECS Services:**
  - [ ] Backend service (1 task, with ALB target group)
  - [ ] Frontend service (1 task, with ALB target group)
  - [ ] ChromaDB service (1 task, internal)

**Production:**
- [ ] **ECS Cluster:** aldeia-prod-cluster
- [ ] **Task Definitions:**
  - [ ] Backend task definition (1 vCPU, 2GB RAM)
  - [ ] Frontend task definition (0.5 vCPU, 1GB RAM)
  - [ ] ChromaDB task definition (2 vCPU, 4GB RAM)
- [ ] **ECS Services:**
  - [ ] Backend service (2-4 tasks, auto-scaling) - ~$60-120/mo
  - [ ] Frontend service (2 tasks) - ~$30/mo
  - [ ] ChromaDB service (2 tasks) - ~$120/mo

---

## 4. Database (RDS PostgreSQL)

### Non-Production
- [ ] **RDS Instance:** db.t3.small (2 vCPU, 2GB RAM) - ~$28/mo
  - Engine: PostgreSQL 15
  - Storage: 50GB GP3 (~$5.75/mo)
  - Single-AZ deployment
  - Subnet Group: Private subnets 3 & 4
  - Security Group: sg-db
  - Automated backups: 7-day retention
  - Backup window: 03:00-04:00 UTC
  - Maintenance window: Sun 04:00-05:00 UTC
  - **DB Name:** aldeia_staging
  - **Master User:** aldeia_admin
  - **Password:** (generate secure password)

### Production
- [ ] **RDS Instance:** db.t3.large (2 vCPU, 8GB RAM) - ~$112/mo
  - Engine: PostgreSQL 15
  - Storage: 100GB GP3 with autoscaling to 500GB (~$11.50/mo)
  - **Multi-AZ deployment** (automatic failover)
  - Read Replica: 1x db.t3.medium (~$56/mo) - Optional
  - Enhanced monitoring: Enabled (60s granularity)
  - Performance Insights: Enabled (7-day retention)
  - Automated backups: 30-day retention
  - Snapshot: Daily automated + manual snapshots
  - **DB Name:** aldeia_production
  - **Master User:** aldeia_admin
  - **Password:** (generate secure password)

### RDS Configuration
- [ ] DB Subnet Group created for each environment
- [ ] Parameter groups customized (if needed)
- [ ] Option groups configured (if needed)
- [ ] Manual snapshot before each major deployment
- [ ] Cross-region snapshot copy for DR (optional, +cost)

---

## 5. Cache (ElastiCache Redis)

### Non-Production
- [ ] **ElastiCache Cluster:** cache.t3.micro (0.5GB RAM) - ~$12/mo
  - Engine: Redis 7.x
  - Node type: cache.t3.micro
  - Number of nodes: 1
  - Subnet Group: Private subnets 3 & 4
  - Security Group: sg-redis
  - Auth token enabled: Yes (generate token)
  - Automatic backups: 7-day retention

### Production
- [ ] **ElastiCache Cluster:** cache.t3.small (1.37GB RAM) - ~$25/mo
  - Multi-AZ with automatic failover
  - Number of nodes: 2 (primary + replica)
  - Auth token enabled: Yes
  - Automatic backups: 14-day retention
  - Snapshot window: 03:00-05:00 UTC
  - Maintenance window: Sun 05:00-06:00 UTC

### ElastiCache Configuration
- [ ] Cache Subnet Group created for each environment
- [ ] Parameter groups customized (if needed)
- [ ] Redis AUTH enabled with strong password
- [ ] Encryption at rest enabled
- [ ] Encryption in transit enabled

---

## 6. Load Balancing (Application Load Balancer)

### Non-Production
- [ ] **Application Load Balancer:** aldeia-staging-alb - ~$16/mo
  - Scheme: Internet-facing
  - Subnets: Public Subnet 1 & 2
  - Security Group: sg-alb
  - **Target Groups:**
    - [ ] TG-backend-staging (port 3001, health check: /api/health)
    - [ ] TG-frontend-staging (port 3002, health check: /health)
  - **Listeners:**
    - [ ] HTTP:80 → Redirect to HTTPS:443
    - [ ] HTTPS:443 → Forward to target groups based on path
  - **Routing Rules:**
    - `/api/*` → TG-backend-staging
    - `/socket.io/*` → TG-backend-staging (WebSocket support)
    - `/*` → TG-frontend-staging

### Production
- [ ] **Application Load Balancer:** aldeia-prod-alb - ~$16/mo + data transfer
  - Same configuration as staging
  - Enable access logs to S3
  - Enable WAF (Web Application Firewall) - ~$5/mo + rules
  - **Target Groups:**
    - [ ] TG-backend-prod (connection draining: 300s)
    - [ ] TG-frontend-prod (connection draining: 300s)
  - Sticky sessions enabled (for WebSocket)

---

## 7. SSL/TLS Certificates (AWS Certificate Manager)

- [ ] **ACM Certificate - Non-Production:**
  - Domain: `*.staging.aldeia.com` (wildcard)
  - Validation: DNS validation
  - Auto-renewal: Enabled (automatic)
  - **Cost:** FREE

- [ ] **ACM Certificate - Production:**
  - Domain: `*.aldeia.com` (wildcard)
  - Alternative names: `aldeia.com`, `www.aldeia.com`
  - Validation: DNS validation
  - Auto-renewal: Enabled (automatic)
  - **Cost:** FREE

### DNS Records Required
- [ ] CNAME records for ACM validation
- [ ] A records pointing to ALB:
  - `api.staging.aldeia.com` → staging ALB
  - `chat.staging.aldeia.com` → staging ALB
  - `api.aldeia.com` → production ALB
  - `chat.aldeia.com` → production ALB

---

## 8. DNS (Route 53)

- [ ] **Hosted Zone:** aldeia.com - $0.50/mo
  - [ ] NS records configured at domain registrar
  - [ ] SOA record auto-created

**DNS Records - Non-Production:**
- [ ] `api.staging.aldeia.com` → ALIAS → staging-alb.us-east-1.elb.amazonaws.com
- [ ] `chat.staging.aldeia.com` → ALIAS → staging-alb.us-east-1.elb.amazonaws.com

**DNS Records - Production:**
- [ ] `api.aldeia.com` → ALIAS → prod-alb.us-east-1.elb.amazonaws.com
- [ ] `chat.aldeia.com` → ALIAS → prod-alb.us-east-1.elb.amazonaws.com
- [ ] `aldeia.com` → ALIAS → prod-alb.us-east-1.elb.amazonaws.com
- [ ] Health checks for production endpoints (optional, $0.50/check/mo)

---

## 9. Storage (S3)

### Application Storage
- [ ] **S3 Bucket:** aldeia-staging-backups
  - Versioning: Enabled
  - Encryption: AES-256 (SSE-S3)
  - Lifecycle: Delete after 30 days
  - **Cost:** ~$1-5/mo depending on usage

- [ ] **S3 Bucket:** aldeia-prod-backups
  - Versioning: Enabled
  - Lifecycle: Transition to Glacier after 90 days, delete after 365 days
  - Replication: Cross-region replication (optional, for DR)
  - **Cost:** ~$5-20/mo depending on usage

### ALB Access Logs
- [ ] **S3 Bucket:** aldeia-alb-logs
  - Lifecycle: Delete after 90 days
  - **Cost:** ~$1-3/mo

### Application Artifacts
- [ ] **S3 Bucket:** aldeia-app-artifacts
  - Store Docker images (if not using ECR)
  - Store deployment scripts
  - **Cost:** ~$1-5/mo

---

## 10. Container Registry (ECR) - If using ECS

- [ ] **ECR Repository:** aldeia/backend - ~$0.10/GB/mo
- [ ] **ECR Repository:** aldeia/frontend - ~$0.10/GB/mo
- [ ] **ECR Repository:** aldeia/chromadb - ~$0.10/GB/mo
- [ ] Lifecycle policies: Keep last 10 images, delete untagged after 7 days
- [ ] Image scanning: Enabled (basic scanning is free)
- [ ] Cross-region replication (optional, for DR)

---

## 11. Secrets Management (AWS Secrets Manager)

### Non-Production Secrets
- [ ] `staging/database/credentials` - ~$0.40/mo
- [ ] `staging/jwt/secrets` - ~$0.40/mo
- [ ] `staging/redis/credentials` - ~$0.40/mo
- [ ] `staging/api-keys` - ~$0.40/mo

### Production Secrets
- [ ] `production/database/credentials` - ~$0.40/mo
- [ ] `production/jwt/secrets` - ~$0.40/mo
- [ ] `production/redis/credentials` - ~$0.40/mo
- [ ] `production/api-keys` - ~$0.40/mo

**Total Secrets Manager Cost:** ~$6.40/mo

### Secret Rotation
- [ ] Rotation schedule configured for database passwords (90 days)
- [ ] Rotation schedule configured for JWT secrets (90 days)
- [ ] Rotation Lambda functions created (if needed)

---

## 12. Monitoring & Logging (CloudWatch)

### CloudWatch Logs
- [ ] **Log Groups:**
  - [ ] `/aws/ecs/aldeia-staging/backend` (ECS option)
  - [ ] `/aws/ecs/aldeia-staging/frontend`
  - [ ] `/aws/ec2/aldeia-staging` (EC2 option)
  - [ ] `/aws/rds/instance/aldeia-staging-db/postgresql`
  - [ ] `/aws/elasticache/aldeia-staging-redis`
  - Same for production with `/production/` prefix
- [ ] Retention: 7 days (staging), 30 days (production)

### CloudWatch Metrics & Alarms
- [ ] CPU Utilization Alarm (>80% for 5 min)
- [ ] Memory Utilization Alarm (>85% for 5 min)
- [ ] ALB 5xx Errors (>10 in 5 min)
- [ ] RDS CPU Utilization (>75% for 5 min)
- [ ] RDS Free Storage (<5GB)
- [ ] ElastiCache CPU (>70% for 5 min)
- [ ] ECS Task Count (production: <2 healthy tasks)

### CloudWatch Dashboards
- [ ] Staging Dashboard: Key metrics for all services
- [ ] Production Dashboard: Comprehensive monitoring

### SNS Topics for Alarms
- [ ] Topic: aldeia-staging-alarms (email subscription)
- [ ] Topic: aldeia-prod-alarms (email + PagerDuty)

---

## 13. Backup & Disaster Recovery

### Automated Backups
- [ ] RDS Automated Backups: Configured
- [ ] ElastiCache Snapshots: Configured
- [ ] EBS Snapshots via AWS Backup

### AWS Backup Service
- [ ] **Backup Plan:** aldeia-staging-backup
  - Frequency: Daily at 3 AM UTC
  - Retention: 7 days
  - Resources: RDS, ElastiCache, EBS volumes

- [ ] **Backup Plan:** aldeia-prod-backup
  - Frequency: Daily at 3 AM UTC
  - Retention: 30 days
  - Cross-region copy: Enabled (us-west-2)

### Disaster Recovery Plan
- [ ] Multi-AZ deployment (production)
- [ ] Cross-region snapshots (optional, +cost)
- [ ] RTO (Recovery Time Objective): 1 hour
- [ ] RPO (Recovery Point Objective): 1 hour

---

## 14. Security & Compliance

### AWS WAF (Production Only)
- [ ] Web ACL attached to ALB - $5/mo + $1/rule/mo
- [ ] Managed Rules: AWS Core Rule Set - $10/mo
- [ ] Managed Rules: Known Bad Inputs - $10/mo
- [ ] Rate-based rule: 2000 requests/5min per IP

### AWS Shield Standard
- [ ] Automatically enabled (FREE) - DDoS protection

### GuardDuty (Production)
- [ ] Enable GuardDuty in production account
- [ ] Configure findings notifications

### Bastion Host (Optional)
- [ ] EC2 Instance: t3.nano in Public Subnet - ~$3.80/mo
- [ ] Elastic IP attached
- [ ] Security Group: SSH from your IP only
- [ ] Alternative: Use AWS Systems Manager Session Manager (FREE)

---

## 15. CI/CD Pipeline

### GitHub Actions (Recommended)
- [ ] Configure GitHub Actions with AWS credentials
- [ ] Use OIDC for secure authentication
- [ ] IAM Role: GitHubActionsRole with deployment permissions
- [ ] Workflow files for staging and production

### AWS CodePipeline (Alternative)
- [ ] CodePipeline: aldeia-staging-pipeline - $1/pipeline/mo
- [ ] CodePipeline: aldeia-prod-pipeline - $1/pipeline/mo
- [ ] CodeBuild project configured
- [ ] Manual approval stage for production

---

## 16. Third-Party Services (External to AWS)

- [ ] **Stripe:**
  - Test keys (staging)
  - Live keys (production)
  - Webhook endpoints configured

- [ ] **Anthropic API (Claude):**
  - API key obtained
  - Usage monitoring configured
  - Spending limits set

- [ ] **Google Cloud (Translation API):**
  - API key obtained
  - Billing alerts configured

- [ ] **Sentry (Error Monitoring):**
  - Project created for staging
  - Project created for production
  - DSN configured

- [ ] **Supabase (if not using RDS):**
  - Project for staging
  - Project for production

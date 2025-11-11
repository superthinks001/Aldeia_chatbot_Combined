# AWS Cost Analysis
## Detailed Cost Breakdown for Aldeia Chatbot Platform

**Document Version:** 1.0
**Date:** 2025-11-09

---

## Executive Cost Summary

| Environment | Monthly Cost Range | Annual Cost Range |
|-------------|-------------------|-------------------|
| **Non-Production (Staging)** | $148 - $224 | $1,776 - $2,688 |
| **Production** | $622 - $962 | $7,464 - $11,544 |
| **Both Environments** | $770 - $1,186 | $9,240 - $14,232 |

**Note:** Costs vary based on traffic volume, data transfer, and resource utilization. Third-party services (Stripe, Anthropic, Sentry) not included.

---

## Non-Production (Staging) Environment

### Detailed Monthly Costs

| Service | Specification | Unit Cost | Quantity | Monthly Cost |
|---------|--------------|-----------|----------|--------------|
| **Compute (Option A: EC2)** | t3.medium | $30.37/mo | 1 | $30.37 |
| **Compute (Option B: ECS Fargate)** | Various tasks | - | - | $52.00 |
| - Backend | 0.5 vCPU, 1GB RAM | ~$15/mo | 1 | $15.00 |
| - Frontend | 0.25 vCPU, 0.5GB RAM | ~$7/mo | 1 | $7.00 |
| - ChromaDB | 1 vCPU, 2GB RAM | ~$30/mo | 1 | $30.00 |
| **RDS PostgreSQL** | db.t3.small | $28.47/mo | 1 | $28.47 |
| **RDS Storage** | 50GB GP3 | $0.115/GB | 50 | $5.75 |
| **ElastiCache Redis** | cache.t3.micro | $12.41/mo | 1 | $12.41 |
| **Application Load Balancer** | ALB + LCU | $16.20/mo | 1 | $16.20 |
| **NAT Gateway** | 1 NAT + data | $32.85/mo | 1 | $35.00 |
| **Data Transfer (NAT)** | GB processed | $0.045/GB | ~50GB | $2.25 |
| **EBS Volumes** | 50GB GP3 | $0.08/GB | 50 | $4.00 |
| **S3 Storage** | Backups, logs | Variable | - | $3-8 |
| **ECR (if using ECS)** | Image storage | $0.10/GB | ~5GB | $0.50 |
| **Secrets Manager** | 4 secrets | $0.40/secret | 4 | $1.60 |
| **CloudWatch Logs** | Log ingestion | $0.50/GB | ~5GB | $2.50 |
| **CloudWatch Metrics** | Custom metrics | $0.30/metric | 10 | $3.00 |
| **CloudWatch Alarms** | Alarms | $0.10/alarm | 5 | $0.50 |
| **Route 53** | Hosted zone + queries | $0.50/zone | 1 | $1.00 |
| **Data Transfer Out** | To internet | $0.09/GB | ~50GB | $4.50 |
| **AWS Backup** | Snapshots | $0.05/GB | ~50GB | $2.50 |
| | | | **TOTAL (EC2)** | **$148-178** |
| | | | **TOTAL (ECS Fargate)** | **$170-224** |

### Cost Optimization Tips for Staging

1. **Use EC2 Savings Plans** - Save 30-40% on compute with 1-year commitment
2. **Stop instances during non-business hours** - Save ~50% on compute costs
3. **Use smaller RDS instance** - db.t3.micro sufficient for light staging use
4. **Reduce backup retention** - 3-7 days is adequate for staging
5. **Lower CloudWatch log retention** - 3-7 days instead of 30
6. **Use Supabase free tier** - Eliminate RDS costs entirely for staging

**Potential Savings:** Reduce staging costs to ~$80-100/month with optimizations

---

## Production Environment

### Detailed Monthly Costs

| Service | Specification | Unit Cost | Quantity | Monthly Cost |
|---------|--------------|-----------|----------|--------------|
| **Compute (Option A: Auto Scaling EC2)** | | | | |
| - EC2 Instances | t3.large | $60.74/mo | 2-4 | $121-243 |
| - EBS Volumes | 100GB GP3 each | $8/mo | 2-4 | $16-32 |
| **Compute (Option B: ECS Fargate)** | | | | |
| - Backend | 1 vCPU, 2GB RAM | $30/mo | 2-4 | $60-120 |
| - Frontend | 0.5 vCPU, 1GB RAM | $15/mo | 2 | $30 |
| - ChromaDB | 2 vCPU, 4GB RAM | $60/mo | 2 | $120 |
| **RDS PostgreSQL** | db.t3.large Multi-AZ | $224.94/mo | 1 | $224.94 |
| **RDS Storage** | 100GB GP3 | $0.115/GB | 100 | $11.50 |
| **RDS Read Replica** | db.t3.medium (optional) | $56.23/mo | 1 | $56.23 |
| **ElastiCache Redis** | cache.t3.small Multi-AZ | $24.82/mo | 2 | $49.64 |
| **Application Load Balancer** | ALB + high LCU | $16.20/mo | 1 | $25-40 |
| **NAT Gateways** | 2 NAT + data | $32.85/mo | 2 | $70-90 |
| **Data Transfer (NAT)** | GB processed | $0.045/GB | ~500GB | $22.50 |
| **EBS Volumes (if EC2)** | 100GB GP3 | $8/mo | 2-4 | $16-32 |
| **S3 Storage** | Backups, logs, artifacts | Variable | - | $10-30 |
| **ECR** | Docker images | $0.10/GB | ~20GB | $2.00 |
| **Secrets Manager** | 4 secrets | $0.40/secret | 4 | $1.60 |
| **CloudWatch Logs** | Log ingestion + storage | $0.50/GB | ~50GB | $25.00 |
| **CloudWatch Metrics** | Custom metrics | $0.30/metric | 30 | $9.00 |
| **CloudWatch Alarms** | Alarms | $0.10/alarm | 15 | $1.50 |
| **CloudWatch Dashboards** | Custom dashboards | $3/dashboard | 2 | $6.00 |
| **Route 53** | Hosted zone + queries | $0.50/zone | 1 | $2.00 |
| **Route 53 Health Checks** | Endpoint monitoring | $0.50/check | 3 | $1.50 |
| **AWS WAF** | Web ACL | $5/mo | 1 | $5.00 |
| **AWS WAF Rules** | Managed rule groups | $10/group | 2 | $20.00 |
| **AWS WAF Requests** | Per million requests | $0.60/million | ~5M | $3.00 |
| **Data Transfer Out** | To internet | $0.09/GB | ~500GB | $45.00 |
| **AWS Backup** | Snapshots with retention | $0.05/GB | ~200GB | $10.00 |
| **GuardDuty** | Threat detection | Variable | - | $5-15 |
| **SNS** | Notifications | $0.50/million | - | $0.50 |
| | | | **TOTAL (EC2)** | **$622-850** |
| | | | **TOTAL (ECS Fargate)** | **$680-962** |

### Cost Breakdown by Category (Production)

| Category | Monthly Cost | Percentage |
|----------|-------------|------------|
| **Compute** | $137-363 | 22-38% |
| **Database** | $236-292 | 30-38% |
| **Networking** | $95-155 | 15-16% |
| **Storage** | $23-62 | 4-6% |
| **Security & Monitoring** | $60-85 | 10% |
| **Other Services** | $20-35 | 3-4% |
| **TOTAL** | **$622-962** | **100%** |

### Production Cost Optimization Strategies

1. **Reserved Instances / Savings Plans**
   - Commit to 1-year: Save 30-40%
   - Commit to 3-year: Save 50-60%
   - Estimated savings: $200-350/month

2. **Right-Sizing**
   - Monitor actual CPU/memory usage
   - Downsize over-provisioned resources
   - Estimated savings: $50-100/month

3. **Compute Savings Plans**
   - Apply to EC2, Fargate, Lambda
   - Flexible across instance types
   - Estimated savings: $100-200/month

4. **S3 Lifecycle Policies**
   - Move old backups to Glacier
   - Delete obsolete data
   - Estimated savings: $10-20/month

5. **CloudWatch Log Management**
   - Reduce retention periods
   - Filter verbose logs
   - Estimated savings: $10-20/month

6. **NAT Gateway Optimization**
   - Use VPC endpoints for AWS services
   - Reduce inter-AZ data transfer
   - Estimated savings: $20-40/month

**Total Potential Savings:** $390-730/month (35-50% reduction)
**Optimized Production Cost:** $390-625/month

---

## Annual Cost Projections

### Year 1 Costs (No Optimization)

| Environment | Setup Costs | Monthly Costs | Annual Total |
|-------------|-------------|---------------|--------------|
| **Staging** | $500 | $148-224/mo | $2,276-3,188 |
| **Production** | $1,000 | $622-962/mo | $8,464-12,544 |
| **Total Year 1** | **$1,500** | - | **$10,740-15,732** |

### Year 1 Costs (With Optimization)

| Environment | Setup Costs | Monthly Costs | Annual Total |
|-------------|-------------|---------------|--------------|
| **Staging** | $500 | $80-120/mo | $1,460-1,940 |
| **Production** | $1,000 | $390-625/mo | $5,680-8,500 |
| **Total Year 1** | **$1,500** | - | **$7,140-10,440** |

**Potential Year 1 Savings:** $3,600-5,292 (25-34% reduction)

---

## Cost Comparison: AWS vs Alternatives

### AWS (Current Plan)
- **Staging:** $148-224/month
- **Production:** $622-962/month
- **Total:** $770-1,186/month

### Alternative: Cloud Platforms

#### Option A: DigitalOcean
- **Staging:** $60-100/month (Droplets + Managed Postgres + Spaces)
- **Production:** $300-500/month (Load Balancer + Multiple Droplets + Managed DB)
- **Total:** $360-600/month
- **Pros:** Simpler, cheaper
- **Cons:** Less scalable, fewer services, no managed container orchestration

#### Option B: Google Cloud Platform
- **Staging:** $140-220/month (similar to AWS)
- **Production:** $600-950/month (similar to AWS)
- **Total:** $740-1,170/month
- **Pros:** Similar features to AWS, better Kubernetes support
- **Cons:** Similar pricing, less extensive service catalog

#### Option C: Hybrid (AWS + Supabase + Render)
- **Staging:** $100-150/month
  - Render.com: $25-50/month (web services)
  - Supabase: $25/month (database)
  - AWS: $50-75/month (minimal AWS services)
- **Production:** $400-600/month
  - Render.com: $150-250/month (pro plan + scaling)
  - Supabase: $100/month (pro plan)
  - AWS: $150-250/month (ALB, Route53, S3, CloudFront)
- **Total:** $500-750/month
- **Pros:** Cost-effective, managed services, simpler
- **Cons:** Vendor lock-in to multiple providers, less control

**Recommendation:** Start with AWS for full control and scalability. Consider hybrid approach if cost becomes prohibitive.

---

## Data Transfer Cost Estimates

### Assumptions
- Average request size: 50KB
- Average response size: 100KB
- Monthly active users: 10,000 (production)
- Requests per user per month: 100

### Calculations

**Production Environment:**
- Total requests/month: 10,000 users × 100 requests = 1,000,000 requests
- Inbound data: 1M × 50KB = 50GB (FREE)
- Outbound data: 1M × 100KB = 100GB
- First 10GB: FREE
- Next 90GB: 90GB × $0.09/GB = $8.10/month

**Bandwidth Cost Growth:**

| Monthly Users | Requests/Month | Outbound Data | Monthly Cost |
|---------------|----------------|---------------|--------------|
| 1,000 | 100,000 | 10GB | $0 |
| 5,000 | 500,000 | 50GB | $3.60 |
| 10,000 | 1,000,000 | 100GB | $8.10 |
| 50,000 | 5,000,000 | 500GB | $44.10 |
| 100,000 | 10,000,000 | 1TB | $92.16 |

**Cost Optimization:**
- Use CloudFront CDN for static assets (first 1TB/month: $0.085/GB = $85/TB vs $92.16/TB)
- Enable compression (reduce data transfer by 60-80%)
- Cache aggressively at browser and CDN level

---

## Reserved Instances & Savings Plans Calculator

### Production EC2 Reserved Instances (1-Year Commitment)

| Instance Type | On-Demand | 1-Year RI | Monthly Savings | Annual Savings |
|---------------|-----------|-----------|-----------------|----------------|
| 2x t3.large | $121/mo | $78/mo | $43/mo | $516/year |
| 4x t3.large | $243/mo | $157/mo | $86/mo | $1,032/year |

### Production RDS Reserved Instances (1-Year Commitment)

| Instance Type | On-Demand | 1-Year RI | Monthly Savings | Annual Savings |
|---------------|-----------|-----------|-----------------|----------------|
| db.t3.large Multi-AZ | $225/mo | $145/mo | $80/mo | $960/year |

### Combined Savings (1-Year Commitment)

| Resource | Monthly Savings | Annual Savings |
|----------|-----------------|----------------|
| 2x EC2 t3.large | $43 | $516 |
| 1x RDS db.t3.large | $80 | $960 |
| ElastiCache (if RI available) | $10 | $120 |
| **Total** | **$133** | **$1,596** |

**ROI:** 21% cost reduction with 1-year commitment

---

## Budget Alerts Configuration

### Recommended Budget Alerts

**Staging Environment:**
- Alert 1: 50% of budget ($112)
- Alert 2: 80% of budget ($179)
- Alert 3: 100% of budget ($224)
- Alert 4: 120% of budget ($269) - Critical

**Production Environment:**
- Alert 1: 50% of budget ($481)
- Alert 2: 75% of budget ($722)
- Alert 3: 90% of budget ($866)
- Alert 4: 100% of budget ($962)
- Alert 5: 120% of budget ($1,154) - Critical

### Cost Anomaly Detection
- Enable AWS Cost Anomaly Detection
- Set threshold: $50 increase from baseline
- Notifications: Email + Slack

---

## Monthly Cost Monitoring Checklist

- [ ] Review AWS Cost Explorer dashboard
- [ ] Check for any cost anomalies
- [ ] Verify Reserved Instance utilization >80%
- [ ] Review S3 storage growth trends
- [ ] Check data transfer costs
- [ ] Identify unused or idle resources
- [ ] Review CloudWatch log ingestion
- [ ] Verify no resources running in wrong regions
- [ ] Check for unattached EBS volumes
- [ ] Review Elastic IP addresses (charged if not attached)

---

## Quarterly Cost Review

- [ ] Analyze cost trends over past 3 months
- [ ] Right-size over/under-provisioned resources
- [ ] Review and renew Reserved Instances expiring soon
- [ ] Evaluate new AWS services that could reduce costs
- [ ] Review third-party service costs (Stripe, Anthropic, Sentry)
- [ ] Update cost projections for next quarter
- [ ] Benchmark against similar applications

---

## Cost Attribution & Tagging Strategy

### Required Tags for All Resources

| Tag Key | Tag Value | Purpose |
|---------|-----------|---------|
| `Environment` | staging / production | Environment separation |
| `Project` | aldeia-chatbot | Project identification |
| `CostCenter` | engineering | Billing attribution |
| `Owner` | team-name | Ownership tracking |
| `ManagedBy` | terraform / manual | Management method |
| `Application` | backend / frontend / database | Component identification |

### Cost Allocation Tags
- Enable cost allocation tags in AWS Billing Console
- Generate monthly cost reports by tag
- Use AWS Cost Categories for grouping

---

## Summary & Recommendations

### Immediate Actions
1. Set up AWS Budget alerts for both environments
2. Enable AWS Cost Anomaly Detection
3. Tag all resources with required tags
4. Configure billing reports

### Short-term (1-3 months)
1. Monitor actual usage vs estimates
2. Right-size resources based on real metrics
3. Evaluate Reserved Instance purchases

### Long-term (6-12 months)
1. Purchase 1-year Reserved Instances for stable workloads
2. Implement aggressive cost optimization strategies
3. Consider Compute Savings Plans for flexibility
4. Evaluate hybrid cloud or alternative providers if costs exceed budget

### Target Costs After Optimization
- **Staging:** $80-120/month (50% reduction)
- **Production:** $390-625/month (35% reduction)
- **Total:** $470-745/month (39% reduction)

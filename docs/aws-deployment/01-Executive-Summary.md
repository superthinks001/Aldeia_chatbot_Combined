# AWS Deployment Plan - Executive Summary
## Aldeia Chatbot Platform

**Document Version:** 1.0
**Date:** 2025-11-09
**Project:** Aldeia Disaster Recovery Chatbot

---

## Overview

This deployment plan provides a comprehensive guide for deploying the Aldeia Chatbot platform on AWS infrastructure with both non-production (staging) and production environments.

### Current Project Architecture

- **Backend:** Express.js (Node.js) - Port 3001
- **Frontend:** React SPA - Port 3002
- **Database:** PostgreSQL (currently using Supabase)
- **Cache:** Redis
- **Vector DB:** ChromaDB
- **Reverse Proxy:** Nginx (SSL termination)

---

## Infrastructure Summary

### Non-Production Environment
- **Purpose:** Staging/testing environment
- **Estimated Cost:** $148-224/month
- **Key Resources:**
  - 1x t3.medium EC2 or ECS Fargate tasks
  - db.t3.small RDS PostgreSQL (Single-AZ)
  - cache.t3.micro ElastiCache Redis
  - Application Load Balancer
  - 1 NAT Gateway

### Production Environment
- **Purpose:** Live production environment
- **Estimated Cost:** $622-962/month
- **Key Resources:**
  - 2-4x t3.large EC2 or ECS Fargate tasks (Auto Scaling)
  - db.t3.large RDS PostgreSQL (Multi-AZ)
  - cache.t3.small ElastiCache Redis (Multi-AZ)
  - Application Load Balancer with WAF
  - 2 NAT Gateways (Multi-AZ)

---

## Deployment Timeline

### Phase 1: Foundation (Week 1)
- AWS account setup and IAM configuration
- Networking infrastructure (VPC, subnets, security groups)
- Core infrastructure provisioning (RDS, ElastiCache, ALB)

### Phase 2: Application Deployment (Week 2)
- Container/compute setup (EC2 or ECS)
- Secrets management configuration
- Database migrations and data migration

### Phase 3: Testing & Validation (Week 3)
- Application testing and load testing
- Monitoring and alerting setup
- Backup and security configuration

### Phase 4: Production Deployment (Week 4)
- Production infrastructure provisioning
- Production application deployment
- Go-live and monitoring

---

## Key Decisions Required

### 1. Compute Strategy
- **Option A:** EC2 with Docker (simpler, matches current setup)
- **Option B:** ECS Fargate (fully managed, better scaling)
- **Recommendation:** ECS Fargate for production, EC2 for staging

### 2. Database Strategy
- **Option A:** Keep Supabase (~$25/month, no migration)
- **Option B:** Migrate to RDS (~$140-250/month, full control)
- **Recommendation:** RDS for production, Supabase for staging

### 3. Deployment Automation
- **Option A:** GitHub Actions (free, already configured)
- **Option B:** AWS CodePipeline (AWS integrated, ~$2/month)
- **Recommendation:** GitHub Actions

### 4. Monitoring Strategy
- **Option A:** CloudWatch only (included, basic)
- **Option B:** CloudWatch + Sentry (~$26/month, better error tracking)
- **Option C:** CloudWatch + DataDog/New Relic ($100+/month, enterprise)
- **Recommendation:** CloudWatch + Sentry for production

---

## Prerequisites Checklist

### AWS Account
- [ ] AWS account created or available
- [ ] Root account MFA enabled
- [ ] IAM admin user created with MFA
- [ ] AWS CLI installed and configured
- [ ] Billing alerts configured

### Domain & DNS
- [ ] Domain name confirmed (aldeia.com or alternative)
- [ ] Domain registrar access available
- [ ] DNS management access

### Third-Party Services
- [ ] Stripe account (test + live keys)
- [ ] Anthropic API account and key
- [ ] Google Cloud account with Translation API enabled
- [ ] Sentry account (optional, for error monitoring)

### Budget Approval
- [ ] Staging environment: $150-225/month
- [ ] Production environment: $600-960/month
- [ ] Initial setup costs: ~$500 (one-time)

---

## Document Structure

This deployment plan is organized into the following documents:

1. **Executive Summary** (this document)
2. **Infrastructure Checklist** - Complete list of AWS resources
3. **Cost Analysis** - Detailed cost breakdown
4. **Network Architecture** - VPC, subnets, security groups
5. **Compute Resources** - EC2 vs ECS Fargate options
6. **Database & Cache** - RDS and ElastiCache configuration
7. **Security & Secrets** - IAM, Secrets Manager, WAF
8. **Monitoring & Logging** - CloudWatch, alarms, dashboards
9. **Deployment Procedures** - Step-by-step deployment guide
10. **AWS CLI Commands** - Ready-to-execute commands

---

## Success Criteria

### Staging Environment
- All services healthy and passing health checks
- Application accessible via HTTPS
- User authentication working end-to-end
- Chat functionality operational
- Automated backups configured

### Production Environment
- Multi-AZ deployment for database and cache
- Auto-scaling configured and tested
- Load testing completed (1000+ concurrent users)
- WAF enabled and configured
- 24-hour monitoring period completed successfully
- Disaster recovery plan documented and tested

---

## Next Steps

1. Review all decision points and make selections
2. Obtain budget approval
3. Gather all API keys and credentials
4. Confirm domain ownership and DNS access
5. Begin Phase 1: AWS account and network setup

---

## Support & Questions

For questions or issues during deployment:
- Refer to the detailed deployment procedures document
- Review the AWS CLI commands document
- Consult the troubleshooting section in the deployment guide

**Project Location:** C:\Shared\Projects\SuperThinks\aldeia-combined

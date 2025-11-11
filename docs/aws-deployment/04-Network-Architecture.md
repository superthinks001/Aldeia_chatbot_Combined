# AWS Network Architecture
## VPC Design and Network Configuration for Aldeia Chatbot

**Document Version:** 1.0
**Date:** 2025-11-09

---

## Network Architecture Overview

The Aldeia Chatbot platform uses a **multi-tier VPC architecture** with public and private subnets across multiple availability zones for high availability and security isolation.

### Key Design Principles

1. **Multi-AZ Deployment** - Resources distributed across 2 availability zones
2. **Network Isolation** - Separate VPCs for staging and production
3. **Security Layers** - Public, application, and database tiers with strict security groups
4. **High Availability** - Redundant NAT Gateways and Multi-AZ RDS/ElastiCache
5. **Internet Access** - ALB in public subnets, applications in private subnets with NAT

---

## VPC Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         INTERNET                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │   Route 53 (DNS)     │
              │  api.aldeia.com      │
              │  chat.aldeia.com     │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │  ACM Certificate     │
              │  *.aldeia.com        │
              └──────────┬───────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────────┐
│                VPC: aldeia-prod-vpc (10.1.0.0/16)              │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │              PUBLIC SUBNETS (DMZ)                        │  │
│  │  ┌──────────────────────┐  ┌──────────────────────┐    │  │
│  │  │  AZ-1a: 10.1.1.0/24  │  │  AZ-1b: 10.1.2.0/24  │    │  │
│  │  │                       │  │                       │    │  │
│  │  │  ┌────────────────┐  │  │  ┌────────────────┐  │    │  │
│  │  │  │  NAT Gateway   │  │  │  │  NAT Gateway   │  │    │  │
│  │  │  │  + Elastic IP  │  │  │  │  + Elastic IP  │  │    │  │
│  │  │  └────────────────┘  │  │  └────────────────┘  │    │  │
│  │  │                       │  │                       │    │  │
│  │  │  ┌─────────────────────────────────────────┐    │    │  │
│  │  │  │   Application Load Balancer (ALB)       │    │    │  │
│  │  │  │   - HTTPS:443 → Backend/Frontend        │    │    │  │
│  │  │  │   - HTTP:80 → HTTPS redirect            │    │    │  │
│  │  │  │   - WAF Enabled (Production)            │    │    │  │
│  │  │  │   - SSL Termination                     │    │    │  │
│  │  │  └─────────────────────────────────────────┘    │    │  │
│  │  └──────────────────────┘  └──────────────────────┘    │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │           PRIVATE SUBNETS (Application Layer)           │  │
│  │  ┌──────────────────────┐  ┌──────────────────────┐    │  │
│  │  │  AZ-1a: 10.1.10.0/24 │  │  AZ-1b: 10.1.11.0/24 │    │  │
│  │  │                       │  │                       │    │  │
│  │  │ ┌──────────────────┐ │  │ ┌──────────────────┐ │    │  │
│  │  │ │  Backend         │ │  │ │  Backend         │ │    │  │
│  │  │ │  (ECS/EC2)       │ │  │ │  (ECS/EC2)       │ │    │  │
│  │  │ │  Port: 3001      │ │  │ │  Port: 3001      │ │    │  │
│  │  │ └──────────────────┘ │  │ └──────────────────┘ │    │  │
│  │  │                       │  │                       │    │  │
│  │  │ ┌──────────────────┐ │  │ ┌──────────────────┐ │    │  │
│  │  │ │  Frontend        │ │  │ │  Frontend        │ │    │  │
│  │  │ │  (ECS/EC2)       │ │  │ │  (ECS/EC2)       │ │    │  │
│  │  │ │  Port: 3002      │ │  │ │  Port: 3002      │ │    │  │
│  │  │ └──────────────────┘ │  │ └──────────────────┘ │    │  │
│  │  │                       │  │                       │    │  │
│  │  │ ┌──────────────────┐ │  │ ┌──────────────────┐ │    │  │
│  │  │ │  ChromaDB        │ │  │ │  ChromaDB        │ │    │  │
│  │  │ │  (ECS/EC2)       │ │  │ │  (ECS/EC2)       │ │    │  │
│  │  │ │  Port: 8000      │ │  │ │  Port: 8000      │ │    │  │
│  │  │ └──────────────────┘ │  │ └──────────────────┘ │    │  │
│  │  └──────────────────────┘  └──────────────────────┘    │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │           PRIVATE SUBNETS (Database Layer)              │  │
│  │  ┌──────────────────────┐  ┌──────────────────────┐    │  │
│  │  │  AZ-1a: 10.1.20.0/24 │  │  AZ-1b: 10.1.21.0/24 │    │  │
│  │  │                       │  │                       │    │  │
│  │  │ ┌──────────────────┐ │  │ ┌──────────────────┐ │    │  │
│  │  │ │  RDS PostgreSQL  │ │  │ │  RDS Standby     │ │    │  │
│  │  │ │  (Primary)       │◄┼──┼─┤  (Multi-AZ)      │ │    │  │
│  │  │ │  db.t3.large     │ │  │ │  Automatic       │ │    │  │
│  │  │ │  Port: 5432      │ │  │ │  Failover        │ │    │  │
│  │  │ └──────────────────┘ │  │ └──────────────────┘ │    │  │
│  │  │                       │  │                       │    │  │
│  │  │ ┌──────────────────┐ │  │ ┌──────────────────┐ │    │  │
│  │  │ │  ElastiCache     │ │  │ │  ElastiCache     │ │    │  │
│  │  │ │  Redis (Primary) │◄┼──┼─┤  (Replica)       │ │    │  │
│  │  │ │  cache.t3.small  │ │  │ │  Port: 6379      │ │    │  │
│  │  │ │  Port: 6379      │ │  │ │                   │ │    │  │
│  │  │ └──────────────────┘ │  │ └──────────────────┘ │    │  │
│  │  └──────────────────────┘  └──────────────────────┘    │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## VPC Configuration Details

### Production VPC

| Parameter | Value |
|-----------|-------|
| **VPC Name** | aldeia-prod-vpc |
| **CIDR Block** | 10.1.0.0/16 |
| **DNS Hostnames** | Enabled |
| **DNS Resolution** | Enabled |
| **Tenancy** | Default |
| **Region** | us-east-1 |
| **Availability Zones** | us-east-1a, us-east-1b |

### Staging VPC

| Parameter | Value |
|-----------|-------|
| **VPC Name** | aldeia-staging-vpc |
| **CIDR Block** | 10.0.0.0/16 |
| **DNS Hostnames** | Enabled |
| **DNS Resolution** | Enabled |
| **Tenancy** | Default |
| **Region** | us-east-1 |
| **Availability Zones** | us-east-1a, us-east-1b |

---

## Subnet Design

### Production Subnets

| Subnet Name | CIDR | AZ | Type | Purpose |
|-------------|------|-----|------|---------|
| aldeia-prod-public-1a | 10.1.1.0/24 | us-east-1a | Public | ALB, NAT Gateway |
| aldeia-prod-public-1b | 10.1.2.0/24 | us-east-1b | Public | ALB, NAT Gateway |
| aldeia-prod-private-app-1a | 10.1.10.0/24 | us-east-1a | Private | Application servers |
| aldeia-prod-private-app-1b | 10.1.11.0/24 | us-east-1b | Private | Application servers |
| aldeia-prod-private-db-1a | 10.1.20.0/24 | us-east-1a | Private | RDS, ElastiCache |
| aldeia-prod-private-db-1b | 10.1.21.0/24 | us-east-1b | Private | RDS, ElastiCache |

### Staging Subnets

| Subnet Name | CIDR | AZ | Type | Purpose |
|-------------|------|-----|------|---------|
| aldeia-staging-public-1a | 10.0.1.0/24 | us-east-1a | Public | ALB, NAT Gateway |
| aldeia-staging-public-1b | 10.0.2.0/24 | us-east-1b | Public | ALB |
| aldeia-staging-private-app-1a | 10.0.10.0/24 | us-east-1a | Private | Application servers |
| aldeia-staging-private-app-1b | 10.0.11.0/24 | us-east-1b | Private | Application servers |
| aldeia-staging-private-db-1a | 10.0.20.0/24 | us-east-1a | Private | RDS, ElastiCache |
| aldeia-staging-private-db-1b | 10.0.21.0/24 | us-east-1b | Private | RDS, ElastiCache |

### Subnet Sizing

Each subnet uses /24 CIDR block:
- **Total IPs:** 256
- **Usable IPs:** 251 (AWS reserves 5 IPs)
- **Reserved by AWS:**
  - .0 - Network address
  - .1 - VPC router
  - .2 - DNS server
  - .3 - Future use
  - .255 - Broadcast address

---

## Internet Gateway & NAT Gateway

### Internet Gateway (IGW)

**Production:**
- **Name:** aldeia-prod-igw
- **Attached to:** aldeia-prod-vpc
- **Purpose:** Enables internet access for resources in public subnets

**Staging:**
- **Name:** aldeia-staging-igw
- **Attached to:** aldeia-staging-vpc

### NAT Gateway Configuration

**Production (High Availability):**
- **NAT Gateway 1:**
  - Name: aldeia-prod-nat-1a
  - Subnet: aldeia-prod-public-1a
  - Elastic IP: Auto-assigned
  - Serves: Private subnets in us-east-1a

- **NAT Gateway 2:**
  - Name: aldeia-prod-nat-1b
  - Subnet: aldeia-prod-public-1b
  - Elastic IP: Auto-assigned
  - Serves: Private subnets in us-east-1b

**Staging (Cost-Optimized):**
- **NAT Gateway 1:**
  - Name: aldeia-staging-nat-1a
  - Subnet: aldeia-staging-public-1a
  - Elastic IP: Auto-assigned
  - Serves: All private subnets

**NAT Gateway Costs:**
- Hourly charge: $0.045/hour = $32.85/month per NAT
- Data processing: $0.045/GB
- Production (2 NAT): ~$70-90/month
- Staging (1 NAT): ~$35-45/month

---

## Route Tables

### Public Route Table

**Routes:**
| Destination | Target | Purpose |
|-------------|--------|---------|
| 10.1.0.0/16 (or 10.0.0.0/16) | local | VPC internal traffic |
| 0.0.0.0/0 | igw-xxxxx | Internet access |

**Associated Subnets:**
- All public subnets

### Private Route Table (AZ-1a)

**Production Routes:**
| Destination | Target | Purpose |
|-------------|--------|---------|
| 10.1.0.0/16 | local | VPC internal traffic |
| 0.0.0.0/0 | nat-1a-xxxxx | Internet access via NAT in AZ-1a |

**Associated Subnets:**
- aldeia-prod-private-app-1a
- aldeia-prod-private-db-1a

### Private Route Table (AZ-1b)

**Production Routes:**
| Destination | Target | Purpose |
|-------------|--------|---------|
| 10.1.0.0/16 | local | VPC internal traffic |
| 0.0.0.0/0 | nat-1b-xxxxx | Internet access via NAT in AZ-1b |

**Associated Subnets:**
- aldeia-prod-private-app-1b
- aldeia-prod-private-db-1b

**Staging:** Single private route table pointing to single NAT Gateway

---

## Security Groups

### 1. ALB Security Group (sg-alb)

**Purpose:** Allow HTTP/HTTPS traffic from internet to ALB

| Type | Protocol | Port | Source | Description |
|------|----------|------|--------|-------------|
| Inbound | TCP | 80 | 0.0.0.0/0 | HTTP from internet |
| Inbound | TCP | 443 | 0.0.0.0/0 | HTTPS from internet |
| Outbound | All | All | 0.0.0.0/0 | All outbound traffic |

### 2. Application Security Group (sg-app)

**Purpose:** Allow traffic from ALB to application servers

| Type | Protocol | Port | Source | Description |
|------|----------|------|--------|-------------|
| Inbound | TCP | 3001 | sg-alb | Backend API from ALB |
| Inbound | TCP | 3002 | sg-alb | Frontend from ALB |
| Inbound | TCP | 8000 | sg-app | ChromaDB internal |
| Inbound | TCP | 22 | sg-bastion | SSH from bastion (optional) |
| Outbound | All | All | 0.0.0.0/0 | All outbound traffic |

### 3. Database Security Group (sg-db)

**Purpose:** Allow database connections from application tier only

| Type | Protocol | Port | Source | Description |
|------|----------|------|--------|-------------|
| Inbound | TCP | 5432 | sg-app | PostgreSQL from app servers |
| Outbound | TCP | 5432 | sg-db | Replication (Multi-AZ) |

### 4. Redis Security Group (sg-redis)

**Purpose:** Allow Redis connections from application tier only

| Type | Protocol | Port | Source | Description |
|------|----------|------|--------|-------------|
| Inbound | TCP | 6379 | sg-app | Redis from app servers |
| Outbound | TCP | 6379 | sg-redis | Replication (Multi-AZ) |

### 5. Bastion Security Group (sg-bastion) - Optional

**Purpose:** Secure SSH access point

| Type | Protocol | Port | Source | Description |
|------|----------|------|--------|-------------|
| Inbound | TCP | 22 | YOUR_IP/32 | SSH from your IP only |
| Outbound | TCP | 22 | sg-app | SSH to app servers |

**Note:** Consider using AWS Systems Manager Session Manager instead of bastion for better security (no open SSH ports).

---

## Network ACLs (NACLs)

**Default NACL Configuration:**
- Allow all inbound traffic
- Allow all outbound traffic

**Production Recommended NACLs (Optional):**

### Public Subnet NACL

| Rule # | Type | Protocol | Port | Source/Dest | Allow/Deny |
|--------|------|----------|------|-------------|------------|
| 100 | Inbound | TCP | 80 | 0.0.0.0/0 | Allow |
| 110 | Inbound | TCP | 443 | 0.0.0.0/0 | Allow |
| 120 | Inbound | TCP | 1024-65535 | 0.0.0.0/0 | Allow (ephemeral) |
| * | Inbound | All | All | 0.0.0.0/0 | Deny |
| 100 | Outbound | All | All | 0.0.0.0/0 | Allow |

### Private Subnet NACL

| Rule # | Type | Protocol | Port | Source/Dest | Allow/Deny |
|--------|------|----------|------|-------------|------------|
| 100 | Inbound | All | All | 10.1.0.0/16 | Allow (VPC traffic) |
| 110 | Inbound | TCP | 1024-65535 | 0.0.0.0/0 | Allow (ephemeral) |
| * | Inbound | All | All | 0.0.0.0/0 | Deny |
| 100 | Outbound | All | All | 0.0.0.0/0 | Allow |

---

## VPC Endpoints (Cost Optimization)

### Recommended VPC Endpoints

VPC Endpoints allow private connections to AWS services without NAT Gateway data charges.

**Gateway Endpoints (FREE):**
- **S3 Endpoint**
  - Type: Gateway
  - Service: com.amazonaws.us-east-1.s3
  - Route Tables: All private route tables
  - **Savings:** Eliminate NAT charges for S3 traffic

- **DynamoDB Endpoint** (if used)
  - Type: Gateway
  - Service: com.amazonaws.us-east-1.dynamodb
  - Route Tables: All private route tables

**Interface Endpoints (~$7.30/mo each):**
- **ECR Endpoints** (if using ECS)
  - com.amazonaws.us-east-1.ecr.api
  - com.amazonaws.us-east-1.ecr.dkr
  - **Benefit:** Faster Docker pulls, reduced NAT costs

- **CloudWatch Logs Endpoint**
  - com.amazonaws.us-east-1.logs
  - **Benefit:** Reduced NAT costs for logging

- **Secrets Manager Endpoint**
  - com.amazonaws.us-east-1.secretsmanager
  - **Benefit:** Secure secret retrieval without internet

**Cost-Benefit Analysis:**
- Interface endpoint: $7.30/mo + $0.01/GB
- NAT Gateway data: $0.045/GB
- **Breakeven:** 162 GB/month
- **Recommendation:** Use for high-traffic services (ECR, CloudWatch)

---

## Network Flow Patterns

### 1. User Request Flow (HTTPS)

```
User Browser
    ↓ HTTPS (443)
Route 53 DNS Resolution
    ↓
Application Load Balancer (Public Subnet)
    ↓ HTTP (3001/3002)
Backend/Frontend (Private Subnet)
    ↓ TCP (5432/6379)
RDS/Redis (Private DB Subnet)
```

### 2. Application to External API Flow

```
Backend (Private Subnet)
    ↓
NAT Gateway (Public Subnet)
    ↓
Internet Gateway
    ↓
External API (Stripe, Anthropic, Google)
```

### 3. CloudWatch Logging Flow

**Without VPC Endpoint:**
```
Application → NAT Gateway → Internet Gateway → CloudWatch Logs
(Charged: $0.045/GB data processing)
```

**With VPC Endpoint:**
```
Application → VPC Endpoint → CloudWatch Logs
(Charged: $0.01/GB data processing)
```

---

## DNS Configuration

### VPC DNS Settings

**Enabled Settings:**
- **enableDnsHostnames:** true
- **enableDnsSupport:** true

**Benefits:**
- Instances receive public DNS hostnames
- Route 53 Resolver available at 10.x.0.2
- Private hosted zones support

### Route 53 Private Hosted Zone (Optional)

**Use Case:** Internal service discovery

**Example:**
- **Zone:** aldeia.internal
- **Records:**
  - backend.aldeia.internal → Internal ALB or service discovery
  - redis.aldeia.internal → ElastiCache endpoint
  - postgres.aldeia.internal → RDS endpoint

**Cost:** $0.50/month per hosted zone + $0.40/million queries

---

## Network Performance Optimization

### 1. Enhanced Networking

**Enable for EC2 instances:**
- Elastic Network Adapter (ENA)
- Up to 25 Gbps network performance
- Lower latency, higher PPS (packets per second)
- **Cost:** FREE

### 2. Placement Groups (Optional)

**Cluster Placement Group:**
- Low-latency network performance
- Single AZ only
- **Use case:** High-throughput applications
- **Tradeoff:** Reduced availability

### 3. VPC Peering (Future Expansion)

**Use Case:** Connect staging and production VPCs for testing

**Configuration:**
- aldeia-staging-vpc ↔ aldeia-prod-vpc
- Non-overlapping CIDR blocks
- **Cost:** Data transfer charges apply

---

## Network Security Best Practices

### 1. Principle of Least Privilege
- Security groups allow only required ports
- Source restricted to specific security groups, not 0.0.0.0/0
- Database tier isolated from internet

### 2. Defense in Depth
- Multiple layers: NACLs + Security Groups + WAF
- Public subnets: Only ALB and NAT Gateways
- Private subnets: All application and database resources

### 3. Encryption in Transit
- TLS 1.2+ for all external connections
- ALB → Backend: HTTP (internal, can upgrade to HTTPS)
- App → RDS: SSL/TLS enforced
- App → Redis: TLS encryption enabled

### 4. Network Monitoring
- VPC Flow Logs enabled
- CloudWatch Logs destination
- Analyze traffic patterns and detect anomalies

---

## VPC Flow Logs Configuration

### Production Flow Logs

**Configuration:**
- **Log Destination:** CloudWatch Logs
- **Log Group:** /aws/vpc/aldeia-prod-flowlogs
- **Traffic Type:** ALL (accept + reject)
- **Retention:** 30 days
- **IAM Role:** VPCFlowLogsRole

**Cost:** ~$0.50/GB ingested + $0.03/GB stored

**Use Cases:**
- Troubleshoot connectivity issues
- Security analysis
- Compliance auditing

### Staging Flow Logs

**Configuration:**
- **Traffic Type:** REJECT only (cost optimization)
- **Retention:** 7 days

---

## Network Troubleshooting

### Common Issues and Solutions

**Issue 1: Application cannot reach internet**
- Check route table has 0.0.0.0/0 → NAT Gateway
- Verify NAT Gateway is in "available" state
- Check security group outbound rules allow all traffic

**Issue 2: Cannot connect to RDS**
- Verify application and RDS in same VPC
- Check security group allows port 5432 from application SG
- Verify RDS is in private subnet with correct route table
- Check NACL rules (if custom NACLs used)

**Issue 3: High NAT Gateway costs**
- Implement VPC endpoints for S3 and ECR
- Review CloudWatch Logs data transfer
- Check for unnecessary internet-bound traffic
- Consider caching frequently accessed external data

**Issue 4: ALB health checks failing**
- Verify security group allows traffic from ALB to app on correct port
- Check application is listening on correct port
- Verify health check path returns 200 OK
- Check route table allows return traffic

---

## Network Diagram: Traffic Flow with Security Layers

```
                    INTERNET
                       │
                       ▼
        ┌──────────────────────────┐
        │  AWS Shield (DDoS)       │ <- Layer 1: DDoS Protection
        └────────────┬─────────────┘
                     │
        ┌────────────▼─────────────┐
        │  AWS WAF (Production)    │ <- Layer 2: Application Firewall
        └────────────┬─────────────┘
                     │
        ┌────────────▼─────────────┐
        │  Application Load        │ <- Layer 3: Load Balancing
        │  Balancer (Public)       │    + SSL Termination
        │  Security Group: sg-alb  │
        └────────────┬─────────────┘
                     │
        ┌────────────▼─────────────┐
        │  Backend/Frontend        │ <- Layer 4: Application
        │  (Private Subnets)       │    + Business Logic
        │  Security Group: sg-app  │
        └─────┬──────────────┬─────┘
              │              │
     ┌────────▼────┐   ┌────▼────────┐
     │  RDS        │   │  Redis      │ <- Layer 5: Data
     │  (Private)  │   │  (Private)  │    + Persistence
     │  SG: sg-db  │   │  SG: sg-redis│
     └─────────────┘   └─────────────┘
```

---

## Summary & Recommendations

### Implemented Security Controls
1. ✅ Multi-tier subnet isolation (public/private/database)
2. ✅ Security groups with least privilege
3. ✅ No direct internet access for application/database tiers
4. ✅ ALB for SSL termination and centralized ingress
5. ✅ Multi-AZ deployment for high availability
6. ✅ Redundant NAT Gateways (production)

### Recommended Enhancements
1. Enable VPC Flow Logs for security monitoring
2. Implement VPC Endpoints for S3 and ECR (cost savings)
3. Configure Route 53 private hosted zone for internal DNS
4. Enable AWS Network Firewall for advanced threat protection (optional)
5. Implement Transit Gateway if connecting multiple VPCs (future)

### Next Steps
1. Review and approve network architecture
2. Proceed to compute resources deployment
3. Configure security groups as specified
4. Enable monitoring and logging

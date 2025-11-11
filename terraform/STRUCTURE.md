# Terraform Folder Structure

Complete file structure for Aldeia AWS Infrastructure in Ohio (us-east-2)

```
terraform/
│
├── README.md                          # Main documentation
├── QUICK-START.md                     # 5-minute deployment guide
├── STRUCTURE.md                       # This file
├── .gitignore                         # Git ignore rules
│
├── environments/                      # Environment-specific configs
│   │
│   ├── staging/                       # Staging environment
│   │   ├── main.tf                   # Main configuration (uses modules)
│   │   ├── variables.tf              # Variable definitions
│   │   ├── outputs.tf                # Output definitions
│   │   └── terraform.tfvars          # Actual values for staging
│   │
│   └── production/                    # Production environment
│       ├── main.tf                   # Main configuration (uses modules)
│       ├── variables.tf              # Variable definitions
│       ├── outputs.tf                # Output definitions
│       └── terraform.tfvars          # Actual values for production
│
└── modules/                           # Reusable Terraform modules
    │
    ├── vpc/                           # VPC module
    │   ├── main.tf                   # VPC, subnets, IGW, NAT, routes
    │   ├── variables.tf              # Input variables
    │   └── outputs.tf                # Output values
    │
    ├── security-groups/               # Security groups module
    │   ├── main.tf                   # ALB, app, DB, Redis SGs
    │   ├── variables.tf              # Input variables
    │   └── outputs.tf                # Security group IDs
    │
    └── alb/                           # Application Load Balancer module
        ├── main.tf                   # ALB, target groups, listeners
        ├── variables.tf              # Input variables
        └── outputs.tf                # ALB DNS, ARNs
```

## File Count

- **Total files:** 20
- **Terraform files (.tf):** 15
- **Variables files (.tfvars):** 2
- **Documentation (.md):** 3

## Module Breakdown

### VPC Module (`modules/vpc/`)
**Creates:**
- VPC with DNS support
- 2 Public subnets (us-east-2a, us-east-2b)
- 2 Private app subnets
- 2 Private DB subnets
- Internet Gateway
- NAT Gateway(s) - 1 for staging, 2 for production
- Public route table (routes to IGW)
- Private route table(s) (routes to NAT)
- VPC Flow Logs (optional)

**Lines of code:** ~180

### Security Groups Module (`modules/security-groups/`)
**Creates:**
- ALB security group
  - Ingress: 80, 443 from 0.0.0.0/0
  - Egress: All traffic
- Application security group
  - Ingress: 3001, 3002, 8000 from ALB/self
  - Egress: All traffic
- Database security group
  - Ingress: 5432 from app SG
  - Egress: 5432 to self (replication)
- Redis security group
  - Ingress: 6379 from app SG
  - Egress: 6379 to self (replication)

**Lines of code:** ~140

### ALB Module (`modules/alb/`)
**Creates:**
- Application Load Balancer
  - Internet-facing
  - Cross-zone load balancing
  - HTTP/2 enabled
- Target Group: Backend (port 3001)
  - Health check: /api/health
  - Deregistration delay: 300s
- Target Group: Frontend (port 3002)
  - Health check: /health
  - Deregistration delay: 300s
- HTTP Listener (port 80)
  - Redirects to HTTPS
- HTTPS Listener (port 443)
  - Requires ACM certificate
  - Routes /api/* to backend
  - Routes /socket.io/* to backend
  - Routes /* to frontend

**Lines of code:** ~120

## Environment Configurations

### Staging (`environments/staging/`)

**Purpose:** Cost-optimized development/testing environment

**Configuration:**
- VPC CIDR: 10.0.0.0/16
- Availability Zones: us-east-2a, us-east-2b
- NAT Gateways: 1 (single for cost savings)
- Flow Logs: Disabled
- ALB Deletion Protection: Disabled
- ALB Access Logs: Disabled

**Estimated Cost:** $48/month

**Use Cases:**
- Development testing
- Integration testing
- QA testing
- Demo environment

### Production (`environments/production/`)

**Purpose:** High-availability production environment

**Configuration:**
- VPC CIDR: 10.1.0.0/16
- Availability Zones: us-east-2a, us-east-2b
- NAT Gateways: 2 (one per AZ for HA)
- Flow Logs: Optional (recommended)
- ALB Deletion Protection: Enabled
- ALB Access Logs: Optional (recommended)

**Estimated Cost:** $89/month

**Use Cases:**
- Live production traffic
- Customer-facing services
- 24/7 availability required

## Resource Naming Convention

All resources follow this pattern:

```
{project}-{environment}-{resource-type}-{identifier}

Examples:
- aldeia-staging-vpc
- aldeia-staging-public-us-east-2a (subnet)
- aldeia-staging-sg-alb (security group)
- aldeia-staging-alb (load balancer)
- aldeia-prod-vpc
- aldeia-prod-nat-1 (NAT gateway)
```

## Tagging Strategy

All resources are tagged with:

```hcl
{
  Environment = "staging" | "production"
  Project     = "aldeia"
  ManagedBy   = "Terraform"
  Owner       = "DevOps Team"
  Tier        = "Networking" | "Security" | "LoadBalancer"
}
```

Additional production tags:
```hcl
{
  CostCenter = "Production"
  Compliance = "Required"
}
```

## Deployment Workflow

```
1. Clone repository
   ↓
2. Configure AWS CLI (us-east-2)
   ↓
3. cd terraform/environments/staging
   ↓
4. terraform init
   ↓
5. terraform plan (review)
   ↓
6. terraform apply
   ↓
7. Save outputs
   ↓
8. Deploy RDS, ElastiCache (using outputs)
   ↓
9. Deploy application (ECS/EC2)
   ↓
10. Test staging
   ↓
11. Repeat for production
```

## Dependencies

### Module Dependencies
```
environments/staging/main.tf
    ↓
    ├── modules/vpc
    ├── modules/security-groups (depends on VPC)
    └── modules/alb (depends on VPC, security-groups)
```

### Resource Dependencies
```
VPC
 ├── Internet Gateway
 ├── Subnets
 │    ├── Public Subnets
 │    │    └── NAT Gateway(s)
 │    ├── Private App Subnets
 │    └── Private DB Subnets
 ├── Route Tables
 └── Security Groups
      └── ALB
           ├── Target Groups
           └── Listeners
```

## Outputs Flow

```
Terraform Apply
    ↓
Outputs Generated
    ├── VPC ID → Use for RDS, ElastiCache
    ├── Subnet IDs → Use for resource placement
    ├── Security Group IDs → Use for resource security
    ├── ALB DNS → Use for Route 53 records
    └── Target Group ARNs → Use for ECS service registration
```

## State Files

### Local State (Default)
```
terraform/environments/staging/
    └── terraform.tfstate (DO NOT COMMIT)

terraform/environments/production/
    └── terraform.tfstate (DO NOT COMMIT)
```

### Remote State (Recommended)
```
S3 Bucket: aldeia-terraform-state
    ├── staging/networking/terraform.tfstate
    └── production/networking/terraform.tfstate

DynamoDB Table: terraform-state-lock
    └── Prevents concurrent modifications
```

## Version Control

### Files to Commit ✅
- All .tf files
- README.md files
- .gitignore

### Files to IGNORE ❌
- terraform.tfstate*
- .terraform/
- .terraform.lock.hcl
- *.tfplan
- terraform.tfvars (if contains sensitive data)

## Maintenance

### Regular Tasks
- [ ] Weekly: Review and apply security patches
- [ ] Monthly: Review costs and optimize
- [ ] Quarterly: Update Terraform version
- [ ] Quarterly: Review and update modules

### Updates
```bash
# Update provider versions
terraform init -upgrade

# Format code
terraform fmt -recursive

# Validate configuration
terraform validate
```

## Expansion

To add more infrastructure:

```
terraform/
├── modules/
│   ├── rds/              # Add RDS module
│   ├── elasticache/      # Add ElastiCache module
│   ├── ecs/              # Add ECS module
│   └── route53/          # Add Route 53 module
```

Then update environment main.tf:
```hcl
module "rds" {
  source = "../../modules/rds"
  vpc_id = module.vpc.vpc_id
  subnet_ids = module.vpc.private_db_subnet_ids
  security_group_id = module.security_groups.db_security_group_id
}
```

## Total Lines of Code

| Component | Lines |
|-----------|-------|
| VPC Module | ~180 |
| Security Groups Module | ~140 |
| ALB Module | ~120 |
| Staging Environment | ~80 |
| Production Environment | ~90 |
| Documentation | ~500 |
| **Total** | **~1,110** |

## Estimated Deployment Time

- Initial setup: 5 minutes
- Staging deployment: 5-7 minutes
- Production deployment: 8-10 minutes
- Total: ~20-25 minutes

---

**Ready to deploy?**

```bash
cd terraform/environments/staging
terraform init && terraform apply
```

🚀 **Happy Infrastructure as Code!**

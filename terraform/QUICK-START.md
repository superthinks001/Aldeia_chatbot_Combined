# Terraform Quick Start Guide

Get your Aldeia infrastructure deployed in Ohio (us-east-2) in 5 steps!

## Prerequisites

```bash
# 1. Install Terraform
terraform --version  # Should be >= 1.5.0

# 2. Configure AWS CLI
aws configure
# Region: us-east-2 (Ohio)

# 3. Verify AWS access
aws sts get-caller-identity
```

## Deploy Staging Environment (5 Minutes)

```bash
# Navigate to staging directory
cd terraform/environments/staging

# Initialize Terraform
terraform init

# Review the plan
terraform plan

# Apply (creates VPC, subnets, NAT, security groups, ALB)
terraform apply

# Save outputs
terraform output > staging-outputs.txt
```

**That's it!** Your staging networking infrastructure is ready.

## What Was Created?

### VPC & Networking
- ✅ VPC (10.0.0.0/16)
- ✅ 2 Public subnets (for ALB, NAT)
- ✅ 2 Private app subnets (for ECS/EC2)
- ✅ 2 Private DB subnets (for RDS, ElastiCache)
- ✅ Internet Gateway
- ✅ 1 NAT Gateway (cost-optimized for staging)
- ✅ Route tables configured

### Security Groups
- ✅ ALB security group (ports 80, 443)
- ✅ Application security group (ports 3001, 3002, 8000)
- ✅ Database security group (port 5432)
- ✅ Redis security group (port 6379)

### Load Balancer
- ✅ Application Load Balancer (internet-facing)
- ✅ Target groups (backend, frontend)
- ✅ HTTP listener (redirects to HTTPS)
- ⚠️ HTTPS listener (requires ACM certificate)

## Important Outputs

After deployment, note these values (needed for next steps):

```bash
# View all outputs
terraform output

# Specific outputs
terraform output vpc_id
terraform output private_app_subnet_ids
terraform output alb_dns_name
terraform output app_security_group_id
terraform output db_security_group_id
```

## Next Steps

### 1. Test ALB

```bash
# Get ALB DNS name
ALB_DNS=$(terraform output -raw alb_dns_name)

# Test (should get HTTP → HTTPS redirect)
curl -I http://$ALB_DNS
```

### 2. Request SSL Certificate (Optional)

```bash
# Request certificate from ACM
aws acm request-certificate \
  --domain-name "*.staging.aldeia.com" \
  --validation-method DNS \
  --region us-east-2

# Get certificate ARN
aws acm list-certificates --region us-east-2

# Update terraform.tfvars with certificate ARN
# Then run: terraform apply
```

### 3. Create RDS Database

Use the outputs for RDS configuration:
- `vpc_id` - VPC to deploy in
- `private_db_subnet_ids` - Subnets for DB subnet group
- `db_security_group_id` - Security group for RDS

### 4. Create ElastiCache

Use the outputs for ElastiCache:
- `private_db_subnet_ids` - Subnets for cache subnet group
- `redis_security_group_id` - Security group for Redis

### 5. Deploy Application

Use these outputs for ECS/EC2:
- `private_app_subnet_ids` - Subnets for application
- `app_security_group_id` - Security group for app
- `backend_target_group_arn` - Backend target group
- `frontend_target_group_arn` - Frontend target group

## Deploy Production (After Staging Works)

```bash
cd ../production

# Update terraform.tfvars with production values
# Especially: acm_certificate_arn, alb_access_logs_bucket

# Initialize and deploy
terraform init
terraform plan
terraform apply
```

**Production deploys 2 NAT Gateways for high availability!**

## Modify Configuration

Edit `terraform.tfvars` to customize:

```hcl
# Example: Change VPC CIDR
vpc_cidr = "10.2.0.0/16"

# Example: Add more subnets
availability_zones = ["us-east-2a", "us-east-2b", "us-east-2c"]
```

Then apply changes:
```bash
terraform plan
terraform apply
```

## Destroy Infrastructure

**Warning:** This will delete everything!

```bash
# Preview what will be destroyed
terraform plan -destroy

# Destroy
terraform destroy
```

## Troubleshooting

### Error: "No valid credential sources"
```bash
aws configure
# Re-enter your credentials
```

### Error: "Error creating NAT Gateway"
```bash
# NAT Gateway needs time to provision
# Wait 2-3 minutes and try again
terraform apply
```

### Error: "subnet cidr block already in use"
```bash
# Check for existing VPCs
aws ec2 describe-vpcs --region us-east-2

# Change CIDR in terraform.tfvars
```

### View detailed logs
```bash
TF_LOG=DEBUG terraform apply
```

## Cost Estimate

### Staging (per month)
- VPC: FREE
- NAT Gateway: $32
- ALB: $16
- **Total: ~$48/month**

### Production (per month)
- VPC: FREE
- NAT Gateways (2x): $64
- ALB: $25
- **Total: ~$89/month**

## State Management

### Local State (Current Setup)
- State stored in `terraform.tfstate`
- ⚠️ Don't commit to git
- ✅ Backup regularly

### Remote State (Recommended for Production)

```bash
# Create S3 bucket for state
aws s3 mb s3://aldeia-terraform-state --region us-east-2

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket aldeia-terraform-state \
  --versioning-configuration Status=Enabled

# Create DynamoDB table for locking
aws dynamodb create-table \
  --table-name terraform-state-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-2

# Uncomment backend block in main.tf
# Run: terraform init -migrate-state
```

## Common Commands

```bash
# Initialize
terraform init

# Format code
terraform fmt -recursive

# Validate configuration
terraform validate

# Plan changes
terraform plan

# Apply changes
terraform apply

# Show current state
terraform show

# List resources
terraform state list

# Get specific output
terraform output vpc_id

# Destroy everything
terraform destroy

# Target specific resource
terraform apply -target=module.vpc

# Import existing resource
terraform import module.vpc.aws_vpc.main vpc-xxxxx
```

## Support

For issues:
1. Check the main README.md
2. Review Terraform docs: https://registry.terraform.io/providers/hashicorp/aws/latest/docs
3. Check AWS service quotas
4. Review CloudWatch logs

## Security Notes

1. ✅ All resources use private subnets (except ALB)
2. ✅ Security groups use least privilege
3. ✅ No resources have public IPs (except NAT)
4. ✅ All traffic encrypted in transit
5. ⚠️ Enable VPC Flow Logs for production
6. ⚠️ Use remote state with encryption

---

**Ready to deploy?** Start with staging:

```bash
cd terraform/environments/staging
terraform init
terraform apply
```

Happy deploying! 🚀

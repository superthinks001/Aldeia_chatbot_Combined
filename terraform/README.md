# Terraform Infrastructure for Aldeia Chatbot

This directory contains Terraform configurations for deploying AWS infrastructure in **Ohio (us-east-2)** region.

## Structure

```
terraform/
├── environments/
│   ├── staging/          # Staging environment configuration
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   └── terraform.tfvars
│   └── production/       # Production environment configuration
│       ├── main.tf
│       ├── variables.tf
│       ├── outputs.tf
│       └── terraform.tfvars
├── modules/
│   ├── vpc/              # VPC module (subnets, IGW, NAT, routes)
│   ├── security-groups/  # Security groups module
│   └── alb/              # Application Load Balancer module
└── README.md
```

## Prerequisites

1. **Install Terraform**
   ```bash
   # macOS
   brew install terraform

   # Windows
   choco install terraform

   # Linux
   wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
   unzip terraform_1.6.0_linux_amd64.zip
   sudo mv terraform /usr/local/bin/
   ```

2. **Configure AWS CLI**
   ```bash
   aws configure
   # Enter: Access Key, Secret Key, Region (us-east-2), Output (json)
   ```

3. **Verify Setup**
   ```bash
   terraform version
   aws sts get-caller-identity
   ```

## Usage

### Initialize Terraform

```bash
# Navigate to environment directory
cd environments/staging

# Initialize Terraform
terraform init
```

### Plan Infrastructure

```bash
# Preview changes
terraform plan

# Save plan to file
terraform plan -out=tfplan
```

### Apply Infrastructure

```bash
# Apply changes
terraform apply

# Or apply saved plan
terraform apply tfplan
```

### Destroy Infrastructure

```bash
# Destroy all resources (use carefully!)
terraform destroy
```

## Deployment Steps

### 1. Deploy Staging Environment

```bash
cd environments/staging

# Initialize
terraform init

# Review plan
terraform plan

# Apply (creates VPC, subnets, NAT, security groups, ALB)
terraform apply

# Save outputs
terraform output > outputs.txt
```

### 2. Deploy Production Environment

```bash
cd environments/production

# Initialize
terraform init

# Review plan
terraform plan

# Apply
terraform apply
```

## Outputs

After applying, Terraform will output important values:

- VPC ID
- Subnet IDs (public, private app, private db)
- Security Group IDs
- NAT Gateway IDs
- ALB DNS name and ARN
- Route Table IDs

**Save these outputs** - you'll need them for:
- RDS deployment
- ElastiCache deployment
- ECS/EC2 configuration
- Route 53 DNS records

## Module Details

### VPC Module (`modules/vpc`)
Creates:
- VPC with specified CIDR block
- 2 public subnets (for ALB, NAT)
- 2 private app subnets (for ECS/EC2)
- 2 private DB subnets (for RDS, ElastiCache)
- Internet Gateway
- NAT Gateway(s)
- Route tables with associations

### Security Groups Module (`modules/security-groups`)
Creates:
- ALB security group (ports 80, 443)
- Application security group (ports 3001, 3002, 8000)
- Database security group (port 5432)
- Redis security group (port 6379)

### ALB Module (`modules/alb`)
Creates:
- Application Load Balancer
- Target groups (backend, frontend)
- HTTP listener (redirect to HTTPS)
- HTTPS listener (requires ACM certificate)

## Environment Differences

### Staging
- Single NAT Gateway (cost optimization)
- Smaller CIDR blocks
- Less redundancy

### Production
- Dual NAT Gateways (high availability)
- Larger CIDR blocks
- Multi-AZ configuration
- WAF enabled (optional)

## Cost Estimates

### Staging
- VPC: FREE
- NAT Gateway: ~$32/month
- ALB: ~$16/month
- **Total:** ~$48/month

### Production
- VPC: FREE
- NAT Gateways (2x): ~$64/month
- ALB: ~$25/month
- **Total:** ~$89/month

## Customization

Edit `terraform.tfvars` in each environment to customize:

```hcl
# environments/staging/terraform.tfvars
environment     = "staging"
vpc_cidr        = "10.0.0.0/16"
enable_nat_gateway = true
single_nat_gateway = true  # Cost optimization
enable_dns_hostnames = true
```

## State Management

### Local State (Default)
State files stored locally in `terraform.tfstate`

**Important:**
- Do NOT commit `terraform.tfstate` to git
- Backup state files regularly

### Remote State (Recommended for Production)

Configure S3 backend:

```hcl
# backend.tf
terraform {
  backend "s3" {
    bucket         = "aldeia-terraform-state"
    key            = "production/networking/terraform.tfstate"
    region         = "us-east-2"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }
}
```

Create S3 bucket and DynamoDB table:
```bash
# Create S3 bucket
aws s3 mb s3://aldeia-terraform-state --region us-east-2
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
```

## Best Practices

1. **Always run `terraform plan` before `apply`**
2. **Use workspaces for multiple environments** (optional)
3. **Enable versioning on state files**
4. **Use remote state for production**
5. **Tag all resources consistently**
6. **Review security group rules carefully**
7. **Use variables for reusability**
8. **Document changes in git commits**

## Troubleshooting

### Issue: "Error creating NAT Gateway"
**Solution:** Ensure Elastic IP allocation succeeded first

### Issue: "Error creating subnet: cidr block already exists"
**Solution:** Check for existing VPCs with same CIDR, or change CIDR block

### Issue: "Error: InvalidGroup.NotFound"
**Solution:** Security group may have dependencies, destroy in correct order

### Issue: Terraform state is locked
**Solution:**
```bash
# If using DynamoDB locking
terraform force-unlock <LOCK_ID>
```

## Import Existing Resources

If you have existing AWS resources:

```bash
# Import VPC
terraform import module.vpc.aws_vpc.main vpc-xxxxx

# Import subnet
terraform import module.vpc.aws_subnet.public[0] subnet-xxxxx
```

## Updating Infrastructure

```bash
# Pull latest changes
git pull

# Review changes
terraform plan

# Apply updates
terraform apply
```

## Cleanup

To remove all infrastructure:

```bash
cd environments/staging
terraform destroy -auto-approve

cd environments/production
terraform destroy -auto-approve
```

**Warning:** This will delete all networking resources. Ensure no other resources depend on them first.

## Next Steps

After networking is deployed:

1. Note all output values
2. Deploy RDS using subnet IDs from outputs
3. Deploy ElastiCache using subnet IDs
4. Deploy ECS/EC2 using subnet and SG IDs
5. Configure Route 53 to point to ALB DNS

## Support

For issues:
- Check AWS CloudWatch logs
- Review Terraform documentation: https://registry.terraform.io/providers/hashicorp/aws/latest/docs
- Check AWS service quotas
- Review security group rules

## Version

- **Terraform Version:** >= 1.5.0
- **AWS Provider Version:** >= 5.0
- **Region:** us-east-2 (Ohio)

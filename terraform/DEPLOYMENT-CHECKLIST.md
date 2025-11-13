# Terraform Deployment Checklist

Use this checklist to ensure successful deployment of AWS infrastructure.

---

## Pre-Deployment Checklist

### Prerequisites
- [ ] Terraform installed (version >= 1.5.0)
  ```bash
  terraform --version
  ```
- [ ] AWS CLI installed and configured
  ```bash
  aws --version
  aws configure
  ```
- [ ] AWS credentials configured for us-east-2 (Ohio)
  ```bash
  aws sts get-caller-identity
  ```
- [ ] Git repository cloned
  ```bash
  cd C:\Shared\Projects\SuperThinks\aldeia-combined\terraform
  ```

### IAM Permissions Required
- [ ] EC2 (VPC, Subnets, Security Groups, NAT Gateway)
- [ ] ElasticLoadBalancingV2 (ALB, Target Groups, Listeners)
- [ ] IAM (for service roles)
- [ ] CloudWatch (for Flow Logs - optional)

### Documentation Review
- [ ] Read `README.md`
- [ ] Read `QUICK-START.md`
- [ ] Review `STRUCTURE.md`

---

## Staging Deployment

### Step 1: Initialize Terraform
```bash
cd environments/staging
terraform init
```

**Verify:**
- [ ] `.terraform/` directory created
- [ ] Provider plugins downloaded
- [ ] No errors in output

### Step 2: Review Configuration

**Check files:**
- [ ] `main.tf` - Module configurations
- [ ] `variables.tf` - Variable definitions
- [ ] `terraform.tfvars` - Actual values
- [ ] `outputs.tf` - Output definitions

**Verify values in `terraform.tfvars`:**
- [ ] `aws_region = "us-east-2"`
- [ ] `vpc_cidr = "10.0.0.0/16"`
- [ ] `availability_zones` correct
- [ ] `single_nat_gateway = true` (cost optimization)

### Step 3: Plan Deployment
```bash
terraform plan -out=staging.tfplan
```

**Review plan output:**
- [ ] Will create ~25-30 resources
- [ ] VPC, subnets, IGW, NAT, route tables
- [ ] 4 security groups
- [ ] ALB, 2 target groups, listeners
- [ ] No unexpected deletions or modifications

### Step 4: Apply Configuration
```bash
terraform apply staging.tfplan
```

**Monitor progress:**
- [ ] VPC created (fast - ~5 seconds)
- [ ] Subnets created (fast)
- [ ] Internet Gateway created (fast)
- [ ] NAT Gateway created (**slow - 2-3 minutes**)
- [ ] Route tables created (fast)
- [ ] Security groups created (fast)
- [ ] ALB created (slow - 2-3 minutes)
- [ ] Target groups created (fast)
- [ ] Listeners created (fast)

**Expected time:** 5-7 minutes

### Step 5: Save Outputs
```bash
terraform output > staging-outputs.txt
cat staging-outputs.txt
```

**Verify outputs exist:**
- [ ] `vpc_id`
- [ ] `public_subnet_ids`
- [ ] `private_app_subnet_ids`
- [ ] `private_db_subnet_ids`
- [ ] `alb_dns_name`
- [ ] `alb_security_group_id`
- [ ] `app_security_group_id`
- [ ] `db_security_group_id`
- [ ] `redis_security_group_id`
- [ ] `nat_gateway_ids`
- [ ] `backend_target_group_arn`
- [ ] `frontend_target_group_arn`

### Step 6: Verify Deployment

**Check VPC:**
```bash
vpc_id=$(terraform output -raw vpc_id)
aws ec2 describe-vpcs --vpc-ids $vpc_id --region us-east-2
```
- [ ] VPC exists
- [ ] DNS hostnames enabled
- [ ] DNS support enabled

**Check Subnets:**
```bash
aws ec2 describe-subnets --filters "Name=vpc-id,Values=$vpc_id" --region us-east-2
```
- [ ] 6 subnets total
- [ ] 2 public subnets
- [ ] 2 private app subnets
- [ ] 2 private DB subnets
- [ ] Correct CIDR blocks

**Check NAT Gateway:**
```bash
aws ec2 describe-nat-gateways --filter "Name=vpc-id,Values=$vpc_id" --region us-east-2
```
- [ ] 1 NAT Gateway (staging)
- [ ] Status: available
- [ ] Elastic IP attached

**Check ALB:**
```bash
alb_dns=$(terraform output -raw alb_dns_name)
curl -I http://$alb_dns
```
- [ ] HTTP request returns redirect (301)
- [ ] ALB is active
- [ ] DNS resolves

**Check Security Groups:**
```bash
aws ec2 describe-security-groups --filters "Name=vpc-id,Values=$vpc_id" --region us-east-2
```
- [ ] 4 security groups created
- [ ] ALB SG allows 80, 443 from internet
- [ ] App SG allows 3001, 3002 from ALB
- [ ] DB SG allows 5432 from App
- [ ] Redis SG allows 6379 from App

---

## Production Deployment

### Step 1: Review Differences

**Production vs Staging:**
- [ ] Different VPC CIDR (10.1.0.0/16 vs 10.0.0.0/16)
- [ ] Dual NAT Gateways (HA vs single)
- [ ] Deletion protection enabled on ALB
- [ ] Flow logs enabled (optional)
- [ ] Access logs enabled (optional)

### Step 2: Update Configuration

**Edit `production/terraform.tfvars`:**
- [ ] Set `acm_certificate_arn` (if ready)
- [ ] Set `alb_access_logs_bucket` (if using)
- [ ] Review all values

**Optional: Request ACM Certificate:**
```bash
aws acm request-certificate \
  --domain-name "*.aldeia.com" \
  --validation-method DNS \
  --region us-east-2
```
- [ ] Certificate requested
- [ ] DNS validation records added
- [ ] Certificate issued
- [ ] ARN added to `terraform.tfvars`

### Step 3: Deploy Production
```bash
cd ../production
terraform init
terraform plan -out=production.tfplan
terraform apply production.tfplan
```

**Expected time:** 8-10 minutes (dual NAT takes longer)

### Step 4: Save Production Outputs
```bash
terraform output > production-outputs.txt
```

### Step 5: Verify Production

**Check High Availability:**
```bash
vpc_id=$(terraform output -raw vpc_id)
aws ec2 describe-nat-gateways --filter "Name=vpc-id,Values=$vpc_id" --region us-east-2
```
- [ ] 2 NAT Gateways (one per AZ)
- [ ] Both in "available" state
- [ ] Each in different subnet

**Check ALB:**
```bash
alb_arn=$(terraform output -raw alb_arn)
aws elbv2 describe-load-balancers --load-balancer-arns $alb_arn --region us-east-2
```
- [ ] Deletion protection enabled
- [ ] Cross-zone load balancing enabled
- [ ] HTTP/2 enabled

---

## Post-Deployment

### Documentation
- [ ] Save `staging-outputs.txt`
- [ ] Save `production-outputs.txt`
- [ ] Document VPC IDs
- [ ] Document subnet IDs
- [ ] Document security group IDs

### Create DNS Records (if using Route 53)
```bash
# Staging
aws route53 change-resource-record-sets \
  --hosted-zone-id Z123456 \
  --change-batch file://staging-dns.json

# Production
aws route53 change-resource-record-sets \
  --hosted-zone-id Z123456 \
  --change-batch file://production-dns.json
```
- [ ] Staging DNS records created
- [ ] Production DNS records created
- [ ] DNS propagation verified

### Next Steps with Outputs

**For RDS Deployment:**
```bash
# Use these values
vpc_id=$(terraform output -raw vpc_id)
db_subnet_ids=$(terraform output -json private_db_subnet_ids)
db_sg_id=$(terraform output -raw db_security_group_id)
```

**For ElastiCache Deployment:**
```bash
# Use these values
redis_subnet_ids=$(terraform output -json private_db_subnet_ids)
redis_sg_id=$(terraform output -raw redis_security_group_id)
```

**For ECS/EC2 Deployment:**
```bash
# Use these values
app_subnet_ids=$(terraform output -json private_app_subnet_ids)
app_sg_id=$(terraform output -raw app_security_group_id)
backend_tg_arn=$(terraform output -raw backend_target_group_arn)
frontend_tg_arn=$(terraform output -raw frontend_target_group_arn)
```

---

## Cost Verification

### Check Current Costs
```bash
# View current month costs
aws ce get-cost-and-usage \
  --time-period Start=2025-11-01,End=2025-11-30 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --region us-east-1
```

### Set Budget Alerts
```bash
# Create budget for staging (max $100/month)
aws budgets create-budget \
  --account-id YOUR_ACCOUNT_ID \
  --budget file://staging-budget.json

# Create budget for production (max $500/month)
aws budgets create-budget \
  --account-id YOUR_ACCOUNT_ID \
  --budget file://production-budget.json
```
- [ ] Staging budget alert configured
- [ ] Production budget alert configured

---

## Monitoring Setup

### Enable VPC Flow Logs (Production)
```bash
# Create CloudWatch log group
aws logs create-log-group \
  --log-group-name /aws/vpc/aldeia-production-flowlogs \
  --region us-east-2

# Update terraform.tfvars
# enable_flow_logs = true
# terraform apply
```
- [ ] CloudWatch log group created
- [ ] Flow logs enabled
- [ ] Logs flowing to CloudWatch

### Enable ALB Access Logs (Production)
```bash
# Create S3 bucket
aws s3 mb s3://aldeia-prod-alb-logs --region us-east-2

# Configure bucket policy for ALB
aws s3api put-bucket-policy \
  --bucket aldeia-prod-alb-logs \
  --policy file://alb-logs-policy.json

# Update terraform.tfvars
# enable_alb_access_logs = true
# alb_access_logs_bucket = "aldeia-prod-alb-logs"
# terraform apply
```
- [ ] S3 bucket created
- [ ] Bucket policy configured
- [ ] ALB access logs enabled

---

## Troubleshooting

### Common Issues

**Issue: Terraform init fails**
```bash
# Solution: Clear cache and reinitialize
rm -rf .terraform .terraform.lock.hcl
terraform init
```
- [ ] Issue resolved

**Issue: NAT Gateway creation timeout**
```bash
# Solution: NAT takes 2-3 minutes, wait and retry
terraform apply
```
- [ ] Issue resolved

**Issue: ALB health checks failing**
```bash
# Solution: Check security group rules
aws ec2 describe-security-group-rules \
  --filters "Name=group-id,Values=$app_sg_id" \
  --region us-east-2
```
- [ ] Issue resolved

**Issue: Insufficient permissions**
```bash
# Solution: Add required IAM policies
# Check AWS documentation for required permissions
```
- [ ] Issue resolved

---

## State Management

### Backup State Files
```bash
# Backup staging state
cp environments/staging/terraform.tfstate \
   backups/staging-terraform.tfstate.$(date +%Y%m%d)

# Backup production state
cp environments/production/terraform.tfstate \
   backups/production-terraform.tfstate.$(date +%Y%m%d)
```
- [ ] Staging state backed up
- [ ] Production state backed up

### Optional: Migrate to Remote State
```bash
# Create S3 bucket
aws s3 mb s3://aldeia-terraform-state --region us-east-2

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket aldeia-terraform-state \
  --versioning-configuration Status=Enabled

# Create DynamoDB table
aws dynamodb create-table \
  --table-name terraform-state-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-2

# Uncomment backend block in main.tf
# terraform init -migrate-state
```
- [ ] S3 bucket created
- [ ] Versioning enabled
- [ ] DynamoDB table created
- [ ] State migrated

---

## Final Verification

### Staging Environment
- [ ] VPC operational
- [ ] All subnets created
- [ ] NAT Gateway working
- [ ] ALB responding
- [ ] Security groups configured
- [ ] Outputs documented
- [ ] Cost under $50/month

### Production Environment
- [ ] VPC operational
- [ ] High availability configured (dual NAT)
- [ ] ALB with deletion protection
- [ ] Security groups configured
- [ ] Monitoring enabled
- [ ] Outputs documented
- [ ] Cost under $100/month

### Documentation Complete
- [ ] All outputs saved
- [ ] Network diagram updated
- [ ] DNS records documented
- [ ] Security groups documented
- [ ] State files backed up

---

## Sign-Off

**Staging Deployment:**
- [ ] Completed by: _______________
- [ ] Date: _______________
- [ ] Verified by: _______________

**Production Deployment:**
- [ ] Completed by: _______________
- [ ] Date: _______________
- [ ] Verified by: _______________

---

## Next Steps

After successful networking deployment:

1. [ ] Deploy RDS database using outputs
2. [ ] Deploy ElastiCache Redis using outputs
3. [ ] Deploy ECS/EC2 application using outputs
4. [ ] Configure Route 53 DNS records
5. [ ] Set up monitoring and alarms
6. [ ] Run end-to-end tests

---

**Deployment Status:** ⬜ Not Started | 🟨 In Progress | ✅ Complete

Good luck with your deployment! 🚀

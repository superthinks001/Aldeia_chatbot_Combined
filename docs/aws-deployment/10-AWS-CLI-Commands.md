# AWS CLI Commands Reference
## Complete Command Reference for Aldeia Chatbot Deployment

**Document Version:** 1.0
**Date:** 2025-11-09

---

## Prerequisites

### Install AWS CLI

```bash
# macOS
brew install awscli

# Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Windows
msiexec.exe /i https://awscli.amazonaws.com/AWSCLIV2.msi

# Verify installation
aws --version
```

### Configure AWS CLI

```bash
# Configure with access keys
aws configure
# Enter: Access Key ID, Secret Access Key, Region (us-east-1), Output (json)

# Or configure with profile
aws configure --profile aldeia-staging
aws configure --profile aldeia-prod

# Verify configuration
aws sts get-caller-identity
```

---

## VPC and Networking Commands

### Create VPC

**Staging VPC:**
```bash
# Create VPC
VPC_ID=$(aws ec2 create-vpc \
  --cidr-block 10.0.0.0/16 \
  --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=aldeia-staging-vpc},{Key=Environment,Value=staging}]' \
  --query 'Vpc.VpcId' \
  --output text)

echo "VPC ID: $VPC_ID"

# Enable DNS hostnames
aws ec2 modify-vpc-attribute --vpc-id $VPC_ID --enable-dns-hostnames

# Enable DNS support
aws ec2 modify-vpc-attribute --vpc-id $VPC_ID --enable-dns-support
```

**Production VPC:**
```bash
VPC_ID=$(aws ec2 create-vpc \
  --cidr-block 10.1.0.0/16 \
  --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=aldeia-prod-vpc},{Key=Environment,Value=production}]' \
  --query 'Vpc.VpcId' \
  --output text)
```

### Create Subnets

**Public Subnets:**
```bash
# Public Subnet 1a
PUBLIC_SUBNET_1A=$(aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.1.0/24 \
  --availability-zone us-east-1a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=aldeia-staging-public-1a}]' \
  --query 'Subnet.SubnetId' \
  --output text)

# Public Subnet 1b
PUBLIC_SUBNET_1B=$(aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.2.0/24 \
  --availability-zone us-east-1b \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=aldeia-staging-public-1b}]' \
  --query 'Subnet.SubnetId' \
  --output text)

# Enable auto-assign public IP
aws ec2 modify-subnet-attribute --subnet-id $PUBLIC_SUBNET_1A --map-public-ip-on-launch
aws ec2 modify-subnet-attribute --subnet-id $PUBLIC_SUBNET_1B --map-public-ip-on-launch
```

**Private Subnets (Application Layer):**
```bash
# Private App Subnet 1a
PRIVATE_APP_SUBNET_1A=$(aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.10.0/24 \
  --availability-zone us-east-1a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=aldeia-staging-private-app-1a}]' \
  --query 'Subnet.SubnetId' \
  --output text)

# Private App Subnet 1b
PRIVATE_APP_SUBNET_1B=$(aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.11.0/24 \
  --availability-zone us-east-1b \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=aldeia-staging-private-app-1b}]' \
  --query 'Subnet.SubnetId' \
  --output text)
```

**Private Subnets (Database Layer):**
```bash
# Private DB Subnet 1a
PRIVATE_DB_SUBNET_1A=$(aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.20.0/24 \
  --availability-zone us-east-1a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=aldeia-staging-private-db-1a}]' \
  --query 'Subnet.SubnetId' \
  --output text)

# Private DB Subnet 1b
PRIVATE_DB_SUBNET_1B=$(aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.21.0/24 \
  --availability-zone us-east-1b \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=aldeia-staging-private-db-1b}]' \
  --query 'Subnet.SubnetId' \
  --output text)
```

### Create Internet Gateway

```bash
# Create IGW
IGW_ID=$(aws ec2 create-internet-gateway \
  --tag-specifications 'ResourceType=internet-gateway,Tags=[{Key=Name,Value=aldeia-staging-igw}]' \
  --query 'InternetGateway.InternetGatewayId' \
  --output text)

# Attach to VPC
aws ec2 attach-internet-gateway --vpc-id $VPC_ID --internet-gateway-id $IGW_ID
```

### Create NAT Gateway

```bash
# Allocate Elastic IP
EIP_ALLOC_ID=$(aws ec2 allocate-address \
  --domain vpc \
  --tag-specifications 'ResourceType=elastic-ip,Tags=[{Key=Name,Value=aldeia-staging-nat-eip}]' \
  --query 'AllocationId' \
  --output text)

# Create NAT Gateway
NAT_GW_ID=$(aws ec2 create-nat-gateway \
  --subnet-id $PUBLIC_SUBNET_1A \
  --allocation-id $EIP_ALLOC_ID \
  --tag-specifications 'ResourceType=natgateway,Tags=[{Key=Name,Value=aldeia-staging-nat}]' \
  --query 'NatGateway.NatGatewayId' \
  --output text)

# Wait for NAT Gateway to be available (takes 2-5 minutes)
aws ec2 wait nat-gateway-available --nat-gateway-ids $NAT_GW_ID
```

### Create Route Tables

**Public Route Table:**
```bash
# Create public route table
PUBLIC_RT_ID=$(aws ec2 create-route-table \
  --vpc-id $VPC_ID \
  --tag-specifications 'ResourceType=route-table,Tags=[{Key=Name,Value=aldeia-staging-public-rt}]' \
  --query 'RouteTable.RouteTableId' \
  --output text)

# Add route to Internet Gateway
aws ec2 create-route \
  --route-table-id $PUBLIC_RT_ID \
  --destination-cidr-block 0.0.0.0/0 \
  --gateway-id $IGW_ID

# Associate with public subnets
aws ec2 associate-route-table --subnet-id $PUBLIC_SUBNET_1A --route-table-id $PUBLIC_RT_ID
aws ec2 associate-route-table --subnet-id $PUBLIC_SUBNET_1B --route-table-id $PUBLIC_RT_ID
```

**Private Route Table:**
```bash
# Create private route table
PRIVATE_RT_ID=$(aws ec2 create-route-table \
  --vpc-id $VPC_ID \
  --tag-specifications 'ResourceType=route-table,Tags=[{Key=Name,Value=aldeia-staging-private-rt}]' \
  --query 'RouteTable.RouteTableId' \
  --output text)

# Add route to NAT Gateway
aws ec2 create-route \
  --route-table-id $PRIVATE_RT_ID \
  --destination-cidr-block 0.0.0.0/0 \
  --nat-gateway-id $NAT_GW_ID

# Associate with private subnets
aws ec2 associate-route-table --subnet-id $PRIVATE_APP_SUBNET_1A --route-table-id $PRIVATE_RT_ID
aws ec2 associate-route-table --subnet-id $PRIVATE_APP_SUBNET_1B --route-table-id $PRIVATE_RT_ID
aws ec2 associate-route-table --subnet-id $PRIVATE_DB_SUBNET_1A --route-table-id $PRIVATE_RT_ID
aws ec2 associate-route-table --subnet-id $PRIVATE_DB_SUBNET_1B --route-table-id $PRIVATE_RT_ID
```

### Create Security Groups

**ALB Security Group:**
```bash
SG_ALB_ID=$(aws ec2 create-security-group \
  --group-name aldeia-staging-sg-alb \
  --description "Security group for ALB" \
  --vpc-id $VPC_ID \
  --query 'GroupId' \
  --output text)

# Allow HTTP and HTTPS from internet
aws ec2 authorize-security-group-ingress --group-id $SG_ALB_ID --protocol tcp --port 80 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $SG_ALB_ID --protocol tcp --port 443 --cidr 0.0.0.0/0
```

**Application Security Group:**
```bash
SG_APP_ID=$(aws ec2 create-security-group \
  --group-name aldeia-staging-sg-app \
  --description "Security group for application servers" \
  --vpc-id $VPC_ID \
  --query 'GroupId' \
  --output text)

# Allow traffic from ALB
aws ec2 authorize-security-group-ingress --group-id $SG_APP_ID --protocol tcp --port 3001 --source-group $SG_ALB_ID
aws ec2 authorize-security-group-ingress --group-id $SG_APP_ID --protocol tcp --port 3002 --source-group $SG_ALB_ID

# Allow internal communication (for ChromaDB)
aws ec2 authorize-security-group-ingress --group-id $SG_APP_ID --protocol tcp --port 8000 --source-group $SG_APP_ID
```

**Database Security Group:**
```bash
SG_DB_ID=$(aws ec2 create-security-group \
  --group-name aldeia-staging-sg-db \
  --description "Security group for RDS" \
  --vpc-id $VPC_ID \
  --query 'GroupId' \
  --output text)

# Allow PostgreSQL from application
aws ec2 authorize-security-group-ingress --group-id $SG_DB_ID --protocol tcp --port 5432 --source-group $SG_APP_ID
```

**Redis Security Group:**
```bash
SG_REDIS_ID=$(aws ec2 create-security-group \
  --group-name aldeia-staging-sg-redis \
  --description "Security group for ElastiCache Redis" \
  --vpc-id $VPC_ID \
  --query 'GroupId' \
  --output text)

# Allow Redis from application
aws ec2 authorize-security-group-ingress --group-id $SG_REDIS_ID --protocol tcp --port 6379 --source-group $SG_APP_ID
```

---

## RDS PostgreSQL Commands

### Create DB Subnet Group

```bash
aws rds create-db-subnet-group \
  --db-subnet-group-name aldeia-staging-db-subnet-group \
  --db-subnet-group-description "Subnet group for Aldeia staging database" \
  --subnet-ids $PRIVATE_DB_SUBNET_1A $PRIVATE_DB_SUBNET_1B \
  --tags Key=Environment,Value=staging Key=Project,Value=aldeia
```

### Create RDS Instance (Staging)

```bash
# Generate secure password
DB_PASSWORD=$(openssl rand -base64 32)
echo "Database Password: $DB_PASSWORD" > db-credentials.txt
echo "IMPORTANT: Save this password securely!"

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
  --storage-encrypted \
  --db-subnet-group-name aldeia-staging-db-subnet-group \
  --vpc-security-group-ids $SG_DB_ID \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00" \
  --preferred-maintenance-window "sun:04:00-sun:05:00" \
  --no-publicly-accessible \
  --db-name aldeia_staging \
  --tags Key=Environment,Value=staging Key=Project,Value=aldeia

# Wait for instance to be available (10-15 minutes)
echo "Waiting for RDS instance to become available..."
aws rds wait db-instance-available --db-instance-identifier aldeia-staging-db

# Get endpoint
DB_ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier aldeia-staging-db \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text)

echo "Database Endpoint: $DB_ENDPOINT"
```

### Create RDS Instance (Production with Multi-AZ)

```bash
DB_PASSWORD=$(openssl rand -base64 32)

aws rds create-db-instance \
  --db-instance-identifier aldeia-prod-db \
  --db-instance-class db.t3.large \
  --engine postgres \
  --engine-version 15.4 \
  --master-username aldeia_admin \
  --master-user-password "$DB_PASSWORD" \
  --allocated-storage 100 \
  --max-allocated-storage 500 \
  --storage-type gp3 \
  --iops 3000 \
  --storage-encrypted \
  --kms-key-id alias/aws/rds \
  --multi-az \
  --db-subnet-group-name aldeia-prod-db-subnet-group \
  --vpc-security-group-ids $SG_DB_ID \
  --backup-retention-period 30 \
  --preferred-backup-window "03:00-04:00" \
  --preferred-maintenance-window "sun:04:00-sun:05:00" \
  --enable-performance-insights \
  --performance-insights-retention-period 7 \
  --enable-cloudwatch-logs-exports '["postgresql","upgrade"]' \
  --no-publicly-accessible \
  --db-name aldeia_production \
  --deletion-protection \
  --tags Key=Environment,Value=production Key=Project,Value=aldeia
```

---

## ElastiCache Redis Commands

### Create Cache Subnet Group

```bash
aws elasticache create-cache-subnet-group \
  --cache-subnet-group-name aldeia-staging-redis-subnet-group \
  --cache-subnet-group-description "Subnet group for Aldeia staging Redis" \
  --subnet-ids $PRIVATE_DB_SUBNET_1A $PRIVATE_DB_SUBNET_1B
```

### Create Redis Cluster (Staging)

```bash
# Generate auth token (must be 16-128 alphanumeric characters)
REDIS_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
echo "Redis Password: $REDIS_PASSWORD" > redis-credentials.txt

# Create Redis cluster
aws elasticache create-cache-cluster \
  --cache-cluster-id aldeia-staging-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --engine-version 7.0 \
  --num-cache-nodes 1 \
  --cache-subnet-group-name aldeia-staging-redis-subnet-group \
  --security-group-ids $SG_REDIS_ID \
  --auth-token "$REDIS_PASSWORD" \
  --transit-encryption-enabled \
  --at-rest-encryption-enabled \
  --snapshot-retention-limit 7 \
  --snapshot-window "03:00-05:00" \
  --preferred-maintenance-window "sun:05:00-sun:06:00" \
  --tags Key=Environment,Value=staging Key=Project,Value=aldeia

# Wait for cluster to be available
aws elasticache wait cache-cluster-available --cache-cluster-id aldeia-staging-redis

# Get endpoint
REDIS_ENDPOINT=$(aws elasticache describe-cache-clusters \
  --cache-cluster-id aldeia-staging-redis \
  --show-cache-node-info \
  --query 'CacheClusters[0].CacheNodes[0].Endpoint.Address' \
  --output text)

echo "Redis Endpoint: $REDIS_ENDPOINT"
```

### Create Redis Replication Group (Production Multi-AZ)

```bash
REDIS_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)

aws elasticache create-replication-group \
  --replication-group-id aldeia-prod-redis \
  --replication-group-description "Production Redis for Aldeia" \
  --cache-node-type cache.t3.small \
  --engine redis \
  --engine-version 7.0 \
  --num-cache-clusters 2 \
  --cache-subnet-group-name aldeia-prod-redis-subnet-group \
  --security-group-ids $SG_REDIS_ID \
  --auth-token "$REDIS_PASSWORD" \
  --transit-encryption-enabled \
  --at-rest-encryption-enabled \
  --automatic-failover-enabled \
  --multi-az-enabled \
  --snapshot-retention-limit 14 \
  --snapshot-window "03:00-05:00" \
  --preferred-maintenance-window "sun:05:00-sun:06:00" \
  --tags Key=Environment,Value=production Key=Project,Value=aldeia
```

---

## Secrets Manager Commands

### Create Secrets

**Database Credentials:**
```bash
aws secretsmanager create-secret \
  --name staging/database/credentials \
  --description "Database credentials for staging" \
  --secret-string "{
    \"username\":\"aldeia_admin\",
    \"password\":\"$DB_PASSWORD\",
    \"engine\":\"postgres\",
    \"host\":\"$DB_ENDPOINT\",
    \"port\":5432,
    \"dbname\":\"aldeia_staging\",
    \"DATABASE_URL\":\"postgresql://aldeia_admin:$DB_PASSWORD@$DB_ENDPOINT:5432/aldeia_staging\"
  }"
```

**JWT Secrets:**
```bash
JWT_SECRET=$(openssl rand -base64 64)
JWT_REFRESH_SECRET=$(openssl rand -base64 64)

aws secretsmanager create-secret \
  --name staging/jwt/secrets \
  --description "JWT secrets for staging" \
  --secret-string "{
    \"JWT_SECRET\":\"$JWT_SECRET\",
    \"JWT_REFRESH_SECRET\":\"$JWT_REFRESH_SECRET\",
    \"JWT_EXPIRATION\":\"24h\",
    \"JWT_REFRESH_EXPIRATION\":\"30d\"
  }"
```

**Redis/Chroma Credentials:**
```bash
CHROMA_AUTH_TOKEN=$(openssl rand -base64 32)

aws secretsmanager create-secret \
  --name staging/redis/credentials \
  --description "Redis and Chroma credentials for staging" \
  --secret-string "{
    \"REDIS_PASSWORD\":\"$REDIS_PASSWORD\",
    \"REDIS_URL\":\"redis://$REDIS_ENDPOINT:6379\",
    \"CHROMA_AUTH_TOKEN\":\"$CHROMA_AUTH_TOKEN\"
  }"
```

### Retrieve Secrets

```bash
# Get secret value
aws secretsmanager get-secret-value \
  --secret-id staging/database/credentials \
  --query SecretString \
  --output text

# Get specific key from secret
aws secretsmanager get-secret-value \
  --secret-id staging/database/credentials \
  --query SecretString \
  --output text | jq -r '.DATABASE_URL'
```

---

## Application Load Balancer Commands

### Create ALB

```bash
# Create ALB
ALB_ARN=$(aws elbv2 create-load-balancer \
  --name aldeia-staging-alb \
  --subnets $PUBLIC_SUBNET_1A $PUBLIC_SUBNET_1B \
  --security-groups $SG_ALB_ID \
  --scheme internet-facing \
  --type application \
  --ip-address-type ipv4 \
  --tags Key=Environment,Value=staging Key=Project,Value=aldeia \
  --query 'LoadBalancers[0].LoadBalancerArn' \
  --output text)

# Get ALB DNS name
ALB_DNS=$(aws elbv2 describe-load-balancers \
  --load-balancer-arns $ALB_ARN \
  --query 'LoadBalancers[0].DNSName' \
  --output text)

echo "ALB DNS: $ALB_DNS"
```

### Create Target Groups

**Backend Target Group:**
```bash
TG_BACKEND_ARN=$(aws elbv2 create-target-group \
  --name aldeia-staging-backend-tg \
  --protocol HTTP \
  --port 3001 \
  --vpc-id $VPC_ID \
  --target-type ip \
  --health-check-enabled \
  --health-check-protocol HTTP \
  --health-check-path /api/health \
  --health-check-interval-seconds 30 \
  --health-check-timeout-seconds 5 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3 \
  --query 'TargetGroups[0].TargetGroupArn' \
  --output text)
```

**Frontend Target Group:**
```bash
TG_FRONTEND_ARN=$(aws elbv2 create-target-group \
  --name aldeia-staging-frontend-tg \
  --protocol HTTP \
  --port 3002 \
  --vpc-id $VPC_ID \
  --target-type ip \
  --health-check-enabled \
  --health-check-protocol HTTP \
  --health-check-path /health \
  --query 'TargetGroups[0].TargetGroupArn' \
  --output text)
```

### Create Listeners

**HTTP Listener (redirect to HTTPS):**
```bash
aws elbv2 create-listener \
  --load-balancer-arn $ALB_ARN \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=redirect,RedirectConfig="{Protocol=HTTPS,Port=443,StatusCode=HTTP_301}"
```

**HTTPS Listener (after ACM certificate is issued):**
```bash
aws elbv2 create-listener \
  --load-balancer-arn $ALB_ARN \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=$CERT_ARN \
  --default-actions Type=forward,TargetGroupArn=$TG_FRONTEND_ARN
```

**Add Rules for Backend:**
```bash
aws elbv2 create-rule \
  --listener-arn $LISTENER_ARN \
  --priority 10 \
  --conditions Field=path-pattern,Values='/api/*' \
  --actions Type=forward,TargetGroupArn=$TG_BACKEND_ARN
```

---

## Complete Deployment Script

Save this as `deploy-staging.sh`:

```bash
#!/bin/bash
set -e

echo "=== Aldeia Staging Deployment ==="

# Variables
REGION="us-east-1"
ENVIRONMENT="staging"

# Create VPC
echo "Creating VPC..."
VPC_ID=$(aws ec2 create-vpc --cidr-block 10.0.0.0/16 --query 'Vpc.VpcId' --output text)
aws ec2 create-tags --resources $VPC_ID --tags Key=Name,Value=aldeia-staging-vpc
aws ec2 modify-vpc-attribute --vpc-id $VPC_ID --enable-dns-hostnames
echo "VPC created: $VPC_ID"

# ... (include all commands from above)

echo "=== Deployment Complete ==="
echo "VPC ID: $VPC_ID"
echo "ALB DNS: $ALB_DNS"
echo "DB Endpoint: $DB_ENDPOINT"
echo "Redis Endpoint: $REDIS_ENDPOINT"
```

---

## Cleanup Commands

**Delete all resources (use carefully!):**

```bash
# Delete ECS services and cluster
aws ecs delete-service --cluster aldeia-staging-cluster --service aldeia-staging-backend --force
aws ecs delete-cluster --cluster aldeia-staging-cluster

# Delete ALB
aws elbv2 delete-load-balancer --load-balancer-arn $ALB_ARN

# Delete Target Groups
aws elbv2 delete-target-group --target-group-arn $TG_BACKEND_ARN
aws elbv2 delete-target-group --target-group-arn $TG_FRONTEND_ARN

# Delete RDS
aws rds delete-db-instance --db-instance-identifier aldeia-staging-db --skip-final-snapshot

# Delete ElastiCache
aws elasticache delete-cache-cluster --cache-cluster-id aldeia-staging-redis

# Delete NAT Gateway
aws ec2 delete-nat-gateway --nat-gateway-id $NAT_GW_ID

# Release Elastic IP
aws ec2 release-address --allocation-id $EIP_ALLOC_ID

# Delete VPC (after all resources deleted)
aws ec2 delete-vpc --vpc-id $VPC_ID
```

---

## Summary

This document contains all AWS CLI commands needed to deploy the Aldeia Chatbot infrastructure. Use these commands in conjunction with the deployment procedures document (09) for a complete deployment.

**Key Command Categories:**
- VPC and Networking
- RDS PostgreSQL
- ElastiCache Redis
- Secrets Manager
- Application Load Balancer
- ECS Fargate (if using)
- Monitoring and Alarms

**Next Steps:**
1. Review all commands
2. Customize variables (VPC CIDR, instance sizes, etc.)
3. Execute commands in order
4. Verify each step before proceeding

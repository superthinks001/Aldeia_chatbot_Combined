# AWS Compute Resources
## EC2 vs ECS Fargate Deployment Options for Aldeia Chatbot

**Document Version:** 1.0
**Date:** 2025-11-09

---

## Overview

This document compares two compute deployment strategies for the Aldeia Chatbot platform:
- **Option A:** EC2 with Docker Compose
- **Option B:** ECS Fargate (Serverless Containers)

---

## Decision Matrix

| Factor | EC2 with Docker | ECS Fargate | Winner |
|--------|-----------------|-------------|---------|
| **Ease of Setup** | ⭐⭐⭐⭐ Simpler, matches current | ⭐⭐⭐ More setup required | EC2 |
| **Operational Overhead** | ⭐⭐ Manual updates, scaling | ⭐⭐⭐⭐⭐ Fully managed | Fargate |
| **Scalability** | ⭐⭐⭐ Manual scaling | ⭐⭐⭐⭐⭐ Automatic | Fargate |
| **Cost (Low Traffic)** | ⭐⭐⭐⭐ Lower | ⭐⭐⭐ Higher | EC2 |
| **Cost (High Traffic)** | ⭐⭐⭐ Higher | ⭐⭐⭐⭐ Lower | Fargate |
| **High Availability** | ⭐⭐⭐ Requires ASG | ⭐⭐⭐⭐⭐ Built-in | Fargate |
| **Container Orchestration** | ⭐⭐ Docker Compose | ⭐⭐⭐⭐⭐ ECS native | Fargate |
| **CI/CD Integration** | ⭐⭐⭐ Good | ⭐⭐⭐⭐⭐ Excellent | Fargate |
| **Learning Curve** | ⭐⭐⭐⭐⭐ Minimal | ⭐⭐⭐ Moderate | EC2 |
| **Control & Customization** | ⭐⭐⭐⭐⭐ Full control | ⭐⭐⭐ Limited | EC2 |

---

## Recommendation

**Staging Environment:** EC2 with Docker Compose
- Simpler setup, lower cost
- Matches current development workflow
- Easier to troubleshoot

**Production Environment:** ECS Fargate
- Better scalability and availability
- Lower operational overhead
- Superior for high-traffic scenarios

---

## Option A: EC2 with Docker Compose

### Architecture

```
┌─────────────────────────────────────────────────────┐
│         Application Load Balancer                   │
│         (Public Subnets)                            │
└──────────────────┬──────────────────────────────────┘
                   │
    ┌──────────────┴──────────────┐
    │                              │
    ▼                              ▼
┌───────────────┐          ┌───────────────┐
│  EC2 Instance │          │  EC2 Instance │
│  (Private)    │          │  (Private)    │
│               │          │               │
│ ┌───────────┐ │          │ ┌───────────┐ │
│ │ Backend   │ │          │ │ Backend   │ │
│ │ Container │ │          │ │ Container │ │
│ │ :3001     │ │          │ │ :3001     │ │
│ └───────────┘ │          │ └───────────┘ │
│               │          │               │
│ ┌───────────┐ │          │ ┌───────────┐ │
│ │ Frontend  │ │          │ │ Frontend  │ │
│ │ Container │ │          │ │ Container │ │
│ │ :3002     │ │          │ │ :3002     │ │
│ └───────────┘ │          │ └───────────┘ │
│               │          │               │
│ ┌───────────┐ │          │ ┌───────────┐ │
│ │ ChromaDB  │ │          │ │ ChromaDB  │ │
│ │ Container │ │          │ │ Container │ │
│ │ :8000     │ │          │ │ :8000     │ │
│ └───────────┘ │          │ └───────────┘ │
└───────────────┘          └───────────────┘
```

### Staging Configuration

**Instance Specification:**
- **Instance Type:** t3.medium
- **vCPU:** 2
- **RAM:** 4 GB
- **Storage:** 50GB GP3 EBS
- **AMI:** Ubuntu 22.04 LTS
- **Cost:** ~$30/month

**Software Stack:**
- Docker Engine 24+
- Docker Compose 2.0+
- CloudWatch Agent
- AWS Systems Manager Agent

**Deployment Method:**
1. Clone repository to EC2
2. Configure `.env` from Secrets Manager
3. Run `docker-compose -f docker-compose.production.yml up -d`

### Production Configuration

**Auto Scaling Group:**
- **Instance Type:** t3.large
- **vCPU:** 2
- **RAM:** 8 GB
- **Storage:** 100GB GP3 EBS each
- **Desired Capacity:** 2
- **Minimum:** 2
- **Maximum:** 4
- **Cost:** $120-240/month

**Scaling Policies:**
- Scale up: CPU > 70% for 5 minutes
- Scale down: CPU < 30% for 10 minutes
- Cooldown period: 300 seconds

### EC2 User Data Script

```bash
#!/bin/bash
# Update system
apt-get update && apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install CloudWatch Agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
dpkg -i -E ./amazon-cloudwatch-agent.deb

# Install AWS CLI
apt-get install -y awscli

# Install git
apt-get install -y git

# Clone repository (use deploy key or IAM role)
cd /home/ubuntu
git clone https://github.com/your-org/aldeia-chatbot.git

# Create .env from Secrets Manager
cd aldeia-chatbot
aws secretsmanager get-secret-value --secret-id production/env-file --query SecretString --output text > .env

# Start application
docker-compose -f docker-compose.production.yml up -d

# Configure CloudWatch Agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
{
  "metrics": {
    "namespace": "Aldeia/EC2",
    "metrics_collected": {
      "cpu": {
        "measurement": [{"name": "cpu_usage_idle", "rename": "CPU_IDLE", "unit": "Percent"}],
        "metrics_collection_interval": 60
      },
      "mem": {
        "measurement": [{"name": "mem_used_percent", "rename": "MEMORY_USED", "unit": "Percent"}],
        "metrics_collection_interval": 60
      },
      "disk": {
        "measurement": [{"name": "used_percent", "rename": "DISK_USED", "unit": "Percent"}],
        "metrics_collection_interval": 60,
        "resources": ["*"]
      }
    }
  },
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/home/ubuntu/aldeia-chatbot/logs/**/*.log",
            "log_group_name": "/aws/ec2/aldeia-production",
            "log_stream_name": "{instance_id}"
          }
        ]
      }
    }
  }
}
EOF

# Start CloudWatch Agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config \
  -m ec2 \
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json \
  -s
```

### EC2 IAM Role Permissions

**Role Name:** EC2-AldeiaRole

**Managed Policies:**
- AmazonSSMManagedInstanceCore (for Systems Manager)
- CloudWatchAgentServerPolicy

**Custom Policy:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": [
        "arn:aws:secretsmanager:us-east-1:*:secret:production/*",
        "arn:aws:secretsmanager:us-east-1:*:secret:staging/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::aldeia-app-artifacts/*"
    }
  ]
}
```

### Advantages of EC2 Approach

✅ **Simple migration** - Matches current Docker Compose setup
✅ **Lower cost** for low-traffic staging environment
✅ **Full control** over instance configuration
✅ **Direct SSH access** for debugging (via Systems Manager)
✅ **Familiar workflow** for development team
✅ **Resource efficiency** - All containers share same instance

### Disadvantages of EC2 Approach

❌ **Manual scaling** - Requires Auto Scaling Group configuration
❌ **Higher operational overhead** - OS updates, security patches
❌ **Less resilient** - Instance failure affects all containers
❌ **Deployment complexity** - Need to coordinate updates across instances
❌ **Resource waste** - Pay for instance even if containers underutilized

---

## Option B: ECS Fargate

### Architecture

```
┌─────────────────────────────────────────────────────┐
│         Application Load Balancer                   │
│         (Public Subnets)                            │
└──────────────────┬──────────────────────────────────┘
                   │
    ┌──────────────┴───────────────────────┐
    │                                       │
    ▼                                       ▼
┌───────────────────────────┐   ┌───────────────────────────┐
│   ECS Fargate Service     │   │   ECS Fargate Service     │
│   (Backend)               │   │   (Frontend)              │
│                           │   │                           │
│  Task 1         Task 2    │   │  Task 1         Task 2    │
│  ┌──────────┐  ┌────────┐ │   │  ┌──────────┐  ┌────────┐ │
│  │ Backend  │  │Backend │ │   │  │ Frontend │  │Frontend│ │
│  │ :3001    │  │:3001   │ │   │  │ :3002    │  │:3002   │ │
│  └──────────┘  └────────┘ │   │  └──────────┘  └────────┘ │
└───────────────────────────┘   └───────────────────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │  ECS Fargate Service │
        │  (ChromaDB)          │
        │                      │
        │  Task 1    Task 2    │
        │  ┌──────┐  ┌──────┐  │
        │  │Chroma│  │Chroma│  │
        │  │:8000 │  │:8000 │  │
        │  └──────┘  └──────┘  │
        └──────────────────────┘
```

### ECS Components

**1. ECS Cluster**
- Name: aldeia-prod-cluster
- Launch Type: Fargate
- Container Insights: Enabled (monitoring)

**2. Task Definitions**
- Defines container configuration
- CPU/memory allocation
- Environment variables
- Logging configuration

**3. ECS Services**
- Manages desired number of tasks
- Integrates with ALB
- Auto-scaling policies
- Health checks

### Staging Configuration

**ECS Cluster:** aldeia-staging-cluster

**Backend Task Definition:**
```json
{
  "family": "aldeia-staging-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "123456789.dkr.ecr.us-east-1.amazonaws.com/aldeia/backend:latest",
      "portMappings": [
        {
          "containerPort": 3001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "NODE_ENV", "value": "staging"},
        {"name": "PORT", "value": "3001"}
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789:secret:staging/database/credentials"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789:secret:staging/jwt/secrets:JWT_SECRET::"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/aldeia-staging-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3001/api/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3
      }
    }
  ]
}
```

**Frontend Task Definition:**
```json
{
  "family": "aldeia-staging-frontend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "frontend",
      "image": "123456789.dkr.ecr.us-east-1.amazonaws.com/aldeia/frontend:latest",
      "portMappings": [
        {
          "containerPort": 3002,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "NODE_ENV", "value": "staging"},
        {"name": "BACKEND_URL", "value": "https://api.staging.aldeia.com"}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/aldeia-staging-frontend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

**ChromaDB Task Definition:**
```json
{
  "family": "aldeia-staging-chromadb",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "containerDefinitions": [
    {
      "name": "chromadb",
      "image": "chromadb/chroma:latest",
      "portMappings": [
        {
          "containerPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "IS_PERSISTENT", "value": "TRUE"},
        {"name": "ANONYMIZED_TELEMETRY", "value": "FALSE"}
      ],
      "secrets": [
        {
          "name": "CHROMA_SERVER_AUTH_CREDENTIALS",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789:secret:staging/redis/credentials:CHROMA_AUTH_TOKEN::"
        }
      ],
      "mountPoints": [
        {
          "sourceVolume": "chromadb-data",
          "containerPath": "/chroma/chroma"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/aldeia-staging-chromadb",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ],
  "volumes": [
    {
      "name": "chromadb-data",
      "efsVolumeConfiguration": {
        "fileSystemId": "fs-12345678",
        "transitEncryption": "ENABLED"
      }
    }
  ]
}
```

**ECS Services - Staging:**

| Service | Tasks | CPU | Memory | Cost/Month |
|---------|-------|-----|--------|------------|
| Backend | 1 | 0.5 vCPU | 1 GB | ~$15 |
| Frontend | 1 | 0.25 vCPU | 0.5 GB | ~$7 |
| ChromaDB | 1 | 1 vCPU | 2 GB | ~$30 |
| **Total** | **3** | | | **~$52** |

### Production Configuration

**ECS Cluster:** aldeia-prod-cluster

**ECS Services - Production:**

| Service | Min Tasks | Desired | Max Tasks | CPU/Task | Memory/Task | Cost/Month |
|---------|-----------|---------|-----------|----------|-------------|------------|
| Backend | 2 | 2 | 4 | 1 vCPU | 2 GB | $60-120 |
| Frontend | 2 | 2 | 4 | 0.5 vCPU | 1 GB | $30-60 |
| ChromaDB | 2 | 2 | 2 | 2 vCPU | 4 GB | $120 |
| **Total** | **6** | **6** | **10** | | | **$210-300** |

**Auto-Scaling Configuration:**

```json
{
  "ServiceName": "aldeia-prod-backend",
  "ScalableTargetAction": {
    "MinCapacity": 2,
    "MaxCapacity": 4
  },
  "TargetTrackingScalingPolicies": [
    {
      "PolicyName": "cpu-scaling-policy",
      "TargetTrackingScalingPolicyConfiguration": {
        "TargetValue": 70.0,
        "PredefinedMetricSpecification": {
          "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
        },
        "ScaleInCooldown": 300,
        "ScaleOutCooldown": 60
      }
    },
    {
      "PolicyName": "memory-scaling-policy",
      "TargetTrackingScalingPolicyConfiguration": {
        "TargetValue": 80.0,
        "PredefinedMetricSpecification": {
          "PredefinedMetricType": "ECSServiceAverageMemoryUtilization"
        },
        "ScaleInCooldown": 300,
        "ScaleOutCooldown": 60
      }
    },
    {
      "PolicyName": "alb-request-count-scaling",
      "TargetTrackingScalingPolicyConfiguration": {
        "TargetValue": 1000.0,
        "PredefinedMetricSpecification": {
          "PredefinedMetricType": "ALBRequestCountPerTarget"
        },
        "ScaleInCooldown": 300,
        "ScaleOutCooldown": 60
      }
    }
  ]
}
```

### ECS Task IAM Role

**Task Execution Role:** Permissions for ECS agent

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:us-east-1:*:log-group:/ecs/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:us-east-1:*:secret:production/*"
    }
  ]
}
```

**Task Role:** Permissions for application

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::aldeia-prod-backups/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ses:SendEmail",
        "ses:SendRawEmail"
      ],
      "Resource": "*"
    }
  ]
}
```

### Advantages of ECS Fargate

✅ **Serverless** - No EC2 management, OS patches, or security updates
✅ **Auto-scaling** - Scales containers independently based on load
✅ **Pay per use** - Only pay for CPU/memory used by tasks
✅ **High availability** - Tasks spread across AZs automatically
✅ **Easy deployments** - Update task definition, deploy new version
✅ **Better isolation** - Each task runs in its own kernel
✅ **CI/CD friendly** - Excellent integration with deployment pipelines
✅ **Built-in monitoring** - Container Insights provides detailed metrics

### Disadvantages of ECS Fargate

❌ **Higher cost** for low-traffic environments
❌ **Learning curve** - ECS concepts (tasks, services, clusters)
❌ **Cold start** - New tasks take 30-60 seconds to start
❌ **Limited control** - Can't SSH into Fargate tasks
❌ **Storage limitations** - Ephemeral storage, need EFS for persistence

---

## Container Registry (ECR)

### ECR Repositories

**Required Repositories:**
1. `aldeia/backend`
2. `aldeia/frontend`
3. `aldeia/chromadb` (optional, can use Docker Hub)

**Configuration:**
- **Image scanning:** Enabled (scan on push)
- **Lifecycle policy:** Keep last 10 images, delete untagged after 7 days
- **Encryption:** AES-256
- **Cost:** $0.10/GB/month

**Lifecycle Policy Example:**
```json
{
  "rules": [
    {
      "rulePriority": 1,
      "description": "Keep last 10 images",
      "selection": {
        "tagStatus": "tagged",
        "tagPrefixList": ["v"],
        "countType": "imageCountMoreThan",
        "countNumber": 10
      },
      "action": {
        "type": "expire"
      }
    },
    {
      "rulePriority": 2,
      "description": "Delete untagged images after 7 days",
      "selection": {
        "tagStatus": "untagged",
        "countType": "sinceImagePushed",
        "countUnit": "days",
        "countNumber": 7
      },
      "action": {
        "type": "expire"
      }
    }
  ]
}
```

### CI/CD: Build and Push to ECR

**GitHub Actions Workflow:**
```yaml
name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          role-to-assume: arn:aws:iam::123456789:role/GitHubActionsRole
          aws-region: us-east-1

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1

      - name: Build and push backend image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          cd apps/backend
          docker build -t $ECR_REGISTRY/aldeia/backend:$IMAGE_TAG .
          docker push $ECR_REGISTRY/aldeia/backend:$IMAGE_TAG

      - name: Build and push frontend image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          cd apps/chatbot-frontend
          docker build -t $ECR_REGISTRY/aldeia/frontend:$IMAGE_TAG .
          docker push $ECR_REGISTRY/aldeia/frontend:$IMAGE_TAG

      - name: Deploy to ECS
        run: |
          aws ecs update-service --cluster aldeia-prod-cluster --service aldeia-prod-backend --force-new-deployment
          aws ecs update-service --cluster aldeia-prod-cluster --service aldeia-prod-frontend --force-new-deployment
```

---

## Deployment Comparison

| Aspect | EC2 Deployment | ECS Fargate Deployment |
|--------|----------------|------------------------|
| **Deployment Time** | 10-15 minutes | 20-30 minutes (first time) |
| **Update Process** | SSH, pull, restart | Update task, deploy |
| **Rollback** | Manual git revert | Previous task definition |
| **Blue-Green Deploy** | Complex | Native support |
| **Zero Downtime** | Requires coordination | Built-in |
| **Health Monitoring** | Docker healthchecks | ECS + ALB health checks |

---

## Summary & Recommendations

### For Staging Environment
**Recommendation:** EC2 with Docker Compose

**Rationale:**
- Lower cost (~$30/mo vs ~$52/mo)
- Simpler for development/testing
- Matches current workflow
- Easier debugging

### For Production Environment
**Recommendation:** ECS Fargate

**Rationale:**
- Better scalability
- Lower operational overhead
- High availability built-in
- Superior for production workloads
- Better CI/CD integration

### Hybrid Approach (Best of Both)
- **Staging:** EC2 t3.medium with Docker Compose
- **Production:** ECS Fargate with auto-scaling
- **Total Cost:** ~$240-270/month (compute only)
- **Best Balance:** Cost efficiency + production reliability

### Next Steps
1. Decide on compute strategy for each environment
2. Build and push Docker images to ECR (if using Fargate)
3. Create ECS task definitions (if using Fargate)
4. Configure Auto Scaling Groups (if using EC2)
5. Set up deployment pipeline

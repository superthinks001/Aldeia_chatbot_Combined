# Security and Secrets Management
## IAM, Secrets Manager, WAF, and Security Best Practices

**Document Version:** 1.0
**Date:** 2025-11-09

---

## AWS Secrets Manager

### Secret Organization

**Staging Secrets:**
- `staging/database/credentials` - RDS credentials
- `staging/jwt/secrets` - JWT_SECRET, JWT_REFRESH_SECRET
- `staging/redis/credentials` - REDIS_PASSWORD, CHROMA_AUTH_TOKEN
- `staging/api-keys` - Third-party API keys (Stripe test, etc.)

**Production Secrets:**
- `production/database/credentials`
- `production/jwt/secrets`
- `production/redis/credentials`
- `production/api-keys` - Live API keys

### Creating Secrets

```bash
# Generate secure secrets
JWT_SECRET=$(openssl rand -base64 64)
JWT_REFRESH_SECRET=$(openssl rand -base64 64)
REDIS_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/")
CHROMA_AUTH_TOKEN=$(openssl rand -base64 32)

# Create database credentials secret
aws secretsmanager create-secret \
  --name production/database/credentials \
  --secret-string "{
    \"username\":\"aldeia_admin\",
    \"password\":\"$DB_PASSWORD\",
    \"engine\":\"postgres\",
    \"host\":\"aldeia-prod-db.xxxxx.us-east-1.rds.amazonaws.com\",
    \"port\":5432,
    \"dbname\":\"aldeia_production\",
    \"DATABASE_URL\":\"postgresql://aldeia_admin:$DB_PASSWORD@aldeia-prod-db.xxxxx.us-east-1.rds.amazonaws.com:5432/aldeia_production\"
  }"

# Create JWT secrets
aws secretsmanager create-secret \
  --name production/jwt/secrets \
  --secret-string "{
    \"JWT_SECRET\":\"$JWT_SECRET\",
    \"JWT_REFRESH_SECRET\":\"$JWT_REFRESH_SECRET\",
    \"JWT_EXPIRATION\":\"24h\",
    \"JWT_REFRESH_EXPIRATION\":\"30d\"
  }"

# Create Redis/Chroma credentials
aws secretsmanager create-secret \
  --name production/redis/credentials \
  --secret-string "{
    \"REDIS_PASSWORD\":\"$REDIS_PASSWORD\",
    \"REDIS_URL\":\"redis://aldeia-prod-redis.xxxxx.cache.amazonaws.com:6379\",
    \"CHROMA_AUTH_TOKEN\":\"$CHROMA_AUTH_TOKEN\"
  }"

# Create API keys
aws secretsmanager create-secret \
  --name production/api-keys \
  --secret-string "{
    \"STRIPE_SECRET_KEY\":\"sk_live_xxxxx\",
    \"STRIPE_PUBLISHABLE_KEY\":\"pk_live_xxxxx\",
    \"STRIPE_WEBHOOK_SECRET\":\"whsec_xxxxx\",
    \"GOOGLE_TRANSLATE_API_KEY\":\"xxxxx\",
    \"ANTHROPIC_API_KEY\":\"sk-ant-xxxxx\",
    \"SENTRY_DSN\":\"https://xxxxx@sentry.io/xxxxx\"
  }"
```

### Accessing Secrets from Applications

**ECS Task Definition:**
```json
{
  "secrets": [
    {
      "name": "DATABASE_URL",
      "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789:secret:production/database/credentials:DATABASE_URL::"
    },
    {
      "name": "JWT_SECRET",
      "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789:secret:production/jwt/secrets:JWT_SECRET::"
    }
  ]
}
```

**EC2 User Data:**
```bash
# Retrieve and write .env file
aws secretsmanager get-secret-value \
  --secret-id production/database/credentials \
  --query SecretString \
  --output text | jq -r 'to_entries|map("\(.key)=\(.value|tostring)")|.[]' > /app/.env
```

### Secret Rotation

**Rotation Schedule:**
- Database passwords: Every 90 days
- JWT secrets: Every 90 days
- API keys: As recommended by provider

**Rotation Lambda Function:**
```python
# Lambda function for RDS password rotation
import boto3
import json

def lambda_handler(event, context):
    secret_arn = event['SecretId']
    token = event['ClientRequestToken']
    step = event['Step']

    if step == "createSecret":
        # Generate new password
        new_password = generate_password()
        # Store in pending secret version

    elif step == "setSecret":
        # Update RDS password
        rds.modify_db_instance(
            DBInstanceIdentifier='aldeia-prod-db',
            MasterUserPassword=new_password
        )

    elif step == "testSecret":
        # Test connection with new password

    elif step == "finishSecret":
        # Mark new version as current
```

---

## IAM Roles and Policies

### ECS Task Execution Role

**Role Name:** ecsTaskExecutionRole

**Managed Policies:**
- AmazonECSTaskExecutionRolePolicy

**Custom Inline Policy:**
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
        "kms:Decrypt"
      ],
      "Resource": "arn:aws:kms:us-east-1:*:key/*",
      "Condition": {
        "StringEquals": {
          "kms:ViaService": "secretsmanager.us-east-1.amazonaws.com"
        }
      }
    }
  ]
}
```

### ECS Task Role

**Role Name:** aldeiaBackendTaskRole

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::aldeia-*-backups/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:us-east-1:*:log-group:/ecs/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudwatch:PutMetricData"
      ],
      "Resource": "*"
    }
  ]
}
```

### GitHub Actions Role (OIDC)

**Role Name:** GitHubActionsDeployRole

**Trust Policy:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::123456789:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:your-org/aldeia-chatbot:*"
        }
      }
    }
  ]
}
```

**Permissions Policy:**
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
        "ecr:BatchGetImage",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecs:UpdateService",
        "ecs:DescribeServices"
      ],
      "Resource": [
        "arn:aws:ecs:us-east-1:*:service/aldeia-*-cluster/*"
      ]
    }
  ]
}
```

---

## AWS WAF Configuration (Production Only)

### Web ACL Setup

**Web ACL Name:** aldeia-prod-waf

**Associated Resources:**
- Application Load Balancer: aldeia-prod-alb

**Managed Rule Groups:**

1. **AWS Core Rule Set** ($10/month)
   - Protection against common web exploits
   - OWASP Top 10 vulnerabilities

2. **Known Bad Inputs** ($10/month)
   - Protection against malicious request patterns
   - Invalid or malformed requests

3. **SQL Injection Protection**
   - Part of Core Rule Set
   - Protects database layer

4. **XSS Protection**
   - Part of Core Rule Set
   - Prevents cross-site scripting

**Custom Rules:**

**Rate Limiting Rule:**
```json
{
  "Name": "RateLimitRule",
  "Priority": 1,
  "Statement": {
    "RateBasedStatement": {
      "Limit": 2000,
      "AggregateKeyType": "IP"
    }
  },
  "Action": {
    "Block": {
      "CustomResponse": {
        "ResponseCode": 429
      }
    }
  },
  "VisibilityConfig": {
    "SampledRequestsEnabled": true,
    "CloudWatchMetricsEnabled": true,
    "MetricName": "RateLimitRule"
  }
}
```

**Geo-Blocking Rule (Optional):**
```json
{
  "Name": "GeoBlockRule",
  "Priority": 2,
  "Statement": {
    "NotStatement": {
      "Statement": {
        "GeoMatchStatement": {
          "CountryCodes": ["US", "CA"]
        }
      }
    }
  },
  "Action": {
    "Block": {}
  }
}
```

### WAF Logging

**Log Destination:** S3 bucket or CloudWatch Logs

```bash
# Enable WAF logging to S3
aws wafv2 put-logging-configuration \
  --logging-configuration \
    ResourceArn=arn:aws:wafv2:us-east-1:123456789:regional/webacl/aldeia-prod-waf/xxxxx,\
    LogDestinationConfigs=arn:aws:s3:::aldeia-waf-logs,\
    RedactedFields=[]
```

---

## Security Best Practices

### 1. Encryption

**At Rest:**
- RDS: AWS KMS encryption
- ElastiCache: AES-256 encryption
- S3: SSE-S3 or SSE-KMS
- EBS volumes: Encrypted with AWS managed keys

**In Transit:**
- ALB: TLS 1.2+ only
- RDS: SSL/TLS enforced
- Redis: TLS encryption enabled
- All API calls: HTTPS only

### 2. Network Security

**Defense in Depth:**
```
Layer 1: AWS Shield (DDoS)
Layer 2: AWS WAF (Application firewall)
Layer 3: Security Groups (Stateful firewall)
Layer 4: NACLs (Stateless firewall)
Layer 5: Application-level auth (JWT)
```

**Security Group Rules:**
- Minimum required ports only
- Source restricted to security groups, not 0.0.0.0/0
- No direct internet access for application/database tiers

### 3. Access Control

**Principle of Least Privilege:**
- IAM roles with minimal required permissions
- No long-lived access keys (use OIDC for CI/CD)
- MFA required for console access
- Separate roles for different environments

### 4. Monitoring and Auditing

**AWS CloudTrail:**
```bash
# Enable CloudTrail for audit logging
aws cloudtrail create-trail \
  --name aldeia-audit-trail \
  --s3-bucket-name aldeia-cloudtrail-logs \
  --include-global-service-events \
  --is-multi-region-trail
```

**GuardDuty (Production):**
```bash
# Enable threat detection
aws guardduty create-detector \
  --enable \
  --finding-publishing-frequency FIFTEEN_MINUTES
```

**AWS Config:**
```bash
# Enable configuration compliance checking
aws configservice put-configuration-recorder \
  --configuration-recorder name=aldeia-config-recorder,roleARN=arn:aws:iam::123456789:role/config-role \
  --recording-group allSupported=true,includeGlobalResourceTypes=true
```

### 5. Vulnerability Management

**Container Scanning:**
- ECR image scanning on push
- Snyk or Trivy in CI/CD pipeline
- Regular base image updates

**Dependency Scanning:**
- npm audit in CI/CD
- Dependabot for automated PRs
- OWASP Dependency-Check

### 6. Incident Response

**Security Incident Playbook:**

1. **Detection:**
   - GuardDuty findings
   - CloudWatch alarms
   - WAF blocked requests

2. **Isolation:**
   - Modify security groups to block traffic
   - Terminate compromised instances
   - Rotate credentials

3. **Investigation:**
   - Review CloudTrail logs
   - Analyze VPC Flow Logs
   - Check application logs

4. **Remediation:**
   - Patch vulnerabilities
   - Update security rules
   - Deploy fixes

5. **Recovery:**
   - Restore from backups if needed
   - Verify system integrity
   - Resume normal operations

6. **Post-Mortem:**
   - Document incident
   - Update procedures
   - Implement preventive measures

---

## Compliance and Certifications

### HIPAA Compliance (If Required)

**Requirements:**
- Enable encryption at rest and in transit
- Use AWS KMS with customer managed keys
- Enable CloudTrail logging
- Sign AWS BAA (Business Associate Agreement)
- Implement access controls and auditing

### SOC 2 Compliance

**Requirements:**
- Security monitoring and logging
- Access control policies
- Incident response procedures
- Regular vulnerability assessments
- Data backup and recovery procedures

### GDPR Compliance

**Requirements:**
- Data encryption
- Right to erasure (data deletion)
- Data portability
- Audit trails
- Data processing agreements

---

## Security Checklist

### Pre-Deployment
- [ ] All secrets stored in Secrets Manager
- [ ] IAM roles created with least privilege
- [ ] Security groups configured with minimum required rules
- [ ] Encryption enabled for all data stores
- [ ] SSL/TLS certificates provisioned
- [ ] WAF configured (production)

### Post-Deployment
- [ ] CloudTrail enabled for audit logging
- [ ] GuardDuty enabled for threat detection
- [ ] Config enabled for compliance monitoring
- [ ] VPC Flow Logs enabled
- [ ] Security alarms configured
- [ ] Vulnerability scanning enabled

### Ongoing
- [ ] Monthly security reviews
- [ ] Quarterly penetration testing
- [ ] Regular credential rotation
- [ ] Dependency updates
- [ ] Security patch management
- [ ] Incident response drills

---

## Summary

**Security Layers Implemented:**
1. ✅ Network isolation (VPC, subnets, security groups)
2. ✅ Application firewall (WAF with managed rules)
3. ✅ Secrets management (Secrets Manager with rotation)
4. ✅ Encryption (at rest and in transit)
5. ✅ Access control (IAM with least privilege)
6. ✅ Monitoring (CloudTrail, GuardDuty, Config)
7. ✅ DDoS protection (AWS Shield)

**Next Steps:**
1. Create all IAM roles and policies
2. Store secrets in Secrets Manager
3. Configure WAF for production
4. Enable security monitoring services
5. Document security procedures
6. Train team on security best practices

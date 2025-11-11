# Monitoring and Logging
## CloudWatch, Alarms, Dashboards, and Observability

**Document Version:** 1.0
**Date:** 2025-11-09

---

## CloudWatch Logs

### Log Groups

**Application Logs:**
```
/ecs/aldeia-staging-backend
/ecs/aldeia-staging-frontend
/ecs/aldeia-staging-chromadb
/ecs/aldeia-prod-backend
/ecs/aldeia-prod-frontend
/ecs/aldeia-prod-chromadb
```

**Infrastructure Logs:**
```
/aws/rds/instance/aldeia-staging-db/postgresql
/aws/rds/instance/aldeia-prod-db/postgresql
/aws/elasticache/aldeia-staging-redis
/aws/elasticache/aldeia-prod-redis
/aws/lambda/aldeia-rotation-function
```

**Access Logs:**
```
/aws/alb/aldeia-staging-alb
/aws/alb/aldeia-prod-alb
/aws/waf/aldeia-prod-waf
```

### Log Retention

| Environment | Retention Period | Cost/Month |
|-------------|------------------|------------|
| Staging | 7 days | ~$2-5 |
| Production | 30 days | ~$15-30 |

### Log Insights Queries

**Find errors in last hour:**
```sql
fields @timestamp, @message
| filter @message like /ERROR/
| sort @timestamp desc
| limit 100
```

**API response times:**
```sql
fields @timestamp, request_duration
| filter request_path like /api/
| stats avg(request_duration), max(request_duration), count() by request_path
```

**Failed authentication attempts:**
```sql
fields @timestamp, user_email, ip_address
| filter event_type = "auth_failed"
| stats count() by ip_address
| sort count desc
```

---

## CloudWatch Metrics

### Application Metrics

**Backend Metrics:**
```javascript
// Custom metric publishing from application
const cloudwatch = new CloudWatch();

await cloudwatch.putMetricData({
  Namespace: 'Aldeia/Application',
  MetricData: [
    {
      MetricName: 'ChatRequestCount',
      Value: 1,
      Unit: 'Count',
      Timestamp: new Date(),
      Dimensions: [
        { Name: 'Environment', Value: 'production' },
        { Name: 'Service', Value: 'backend' }
      ]
    }
  ]
}).promise();
```

**Key Application Metrics:**
- Chat requests per minute
- Average response time
- Authentication success/failure rate
- Active WebSocket connections
- Document search queries
- Billing API calls
- Translation API calls

### Infrastructure Metrics

**ECS/EC2 Metrics:**
- CPUUtilization
- MemoryUtilization
- NetworkIn/NetworkOut
- Task/Instance count

**RDS Metrics:**
- CPUUtilization
- DatabaseConnections
- FreeableMemory
- FreeStorageSpace
- ReadLatency
- WriteLatency
- ReadIOPS
- WriteIOPS

**ElastiCache Metrics:**
- CPUUtilization
- EngineCPUUtilization
- NetworkBytesIn/Out
- CacheHits
- CacheMisses
- Evictions
- CurrConnections

**ALB Metrics:**
- RequestCount
- TargetResponseTime
- HTTPCode_Target_2XX_Count
- HTTPCode_Target_4XX_Count
- HTTPCode_Target_5XX_Count
- HealthyHostCount
- UnHealthyHostCount

---

## CloudWatch Alarms

### Critical Alarms (Production)

**1. ALB 5xx Errors:**
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name aldeia-prod-alb-5xx-errors \
  --alarm-description "High rate of 5xx errors" \
  --metric-name HTTPCode_Target_5XX_Count \
  --namespace AWS/ApplicationELB \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --dimensions Name=LoadBalancer,Value=app/aldeia-prod-alb/xxxxx \
  --alarm-actions arn:aws:sns:us-east-1:123456789:aldeia-prod-critical \
  --treat-missing-data notBreaching
```

**2. RDS CPU High:**
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name aldeia-prod-db-cpu-high \
  --alarm-description "Database CPU > 75%" \
  --metric-name CPUUtilization \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --threshold 75 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --dimensions Name=DBInstanceIdentifier,Value=aldeia-prod-db \
  --alarm-actions arn:aws:sns:us-east-1:123456789:aldeia-prod-warnings
```

**3. RDS Low Storage:**
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name aldeia-prod-db-low-storage \
  --alarm-description "Database storage < 5GB" \
  --metric-name FreeStorageSpace \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --threshold 5000000000 \
  --comparison-operator LessThanThreshold \
  --evaluation-periods 1 \
  --dimensions Name=DBInstanceIdentifier,Value=aldeia-prod-db \
  --alarm-actions arn:aws:sns:us-east-1:123456789:aldeia-prod-critical
```

**4. ECS Task Count Low:**
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name aldeia-prod-backend-task-count-low \
  --alarm-description "Backend tasks < 2" \
  --metric-name RunningTaskCount \
  --namespace ECS/ContainerInsights \
  --statistic Average \
  --period 60 \
  --threshold 2 \
  --comparison-operator LessThanThreshold \
  --evaluation-periods 2 \
  --dimensions Name=ServiceName,Value=aldeia-prod-backend Name=ClusterName,Value=aldeia-prod-cluster \
  --alarm-actions arn:aws:sns:us-east-1:123456789:aldeia-prod-critical
```

**5. Redis Memory High:**
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name aldeia-prod-redis-memory-high \
  --alarm-description "Redis memory > 85%" \
  --metric-name DatabaseMemoryUsagePercentage \
  --namespace AWS/ElastiCache \
  --statistic Average \
  --period 300 \
  --threshold 85 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --dimensions Name=ReplicationGroupId,Value=aldeia-prod-redis \
  --alarm-actions arn:aws:sns:us-east-1:123456789:aldeia-prod-warnings
```

### Warning Alarms

**API Response Time:**
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name aldeia-prod-api-response-time-high \
  --metric-name TargetResponseTime \
  --namespace AWS/ApplicationELB \
  --statistic Average \
  --period 300 \
  --threshold 1.0 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --dimensions Name=LoadBalancer,Value=app/aldeia-prod-alb/xxxxx Name=TargetGroup,Value=targetgroup/aldeia-prod-backend/xxxxx \
  --alarm-actions arn:aws:sns:us-east-1:123456789:aldeia-prod-warnings
```

---

## SNS Topics for Notifications

### Topic Configuration

**Critical Alerts:**
```bash
aws sns create-topic --name aldeia-prod-critical

# Subscribe email
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:123456789:aldeia-prod-critical \
  --protocol email \
  --notification-endpoint ops-team@aldeia.com
```

**Warning Alerts:**
```bash
aws sns create-topic --name aldeia-prod-warnings

aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:123456789:aldeia-prod-warnings \
  --protocol email \
  --notification-endpoint devops@aldeia.com
```

### Integration with Slack (Optional)

```bash
# Use AWS Chatbot for Slack integration
aws chatbot create-slack-channel-configuration \
  --configuration-name aldeia-prod-slack \
  --iam-role-arn arn:aws:iam::123456789:role/ChatbotRole \
  --slack-team-id T123456 \
  --slack-channel-id C123456 \
  --sns-topic-arns arn:aws:sns:us-east-1:123456789:aldeia-prod-critical arn:aws:sns:us-east-1:123456789:aldeia-prod-warnings
```

---

## CloudWatch Dashboards

### Production Dashboard

**Dashboard Name:** Aldeia-Production-Overview

**Widgets:**

```json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "title": "ALB Request Count",
        "metrics": [
          ["AWS/ApplicationELB", "RequestCount", {"stat": "Sum", "period": 300}]
        ],
        "region": "us-east-1"
      }
    },
    {
      "type": "metric",
      "properties": {
        "title": "Backend CPU Utilization",
        "metrics": [
          ["ECS/ContainerInsights", "CpuUtilized", {"stat": "Average"}]
        ]
      }
    },
    {
      "type": "metric",
      "properties": {
        "title": "RDS Connections",
        "metrics": [
          ["AWS/RDS", "DatabaseConnections", {"stat": "Average"}]
        ]
      }
    },
    {
      "type": "metric",
      "properties": {
        "title": "Redis Cache Hit Rate",
        "metrics": [
          ["AWS/ElastiCache", "CacheHitRate", {"stat": "Average"}]
        ]
      }
    },
    {
      "type": "log",
      "properties": {
        "title": "Recent Errors",
        "query": "SOURCE '/ecs/aldeia-prod-backend' | fields @timestamp, @message | filter @message like /ERROR/ | sort @timestamp desc | limit 20",
        "region": "us-east-1"
      }
    }
  ]
}
```

### Create Dashboard via CLI

```bash
aws cloudwatch put-dashboard \
  --dashboard-name Aldeia-Production-Overview \
  --dashboard-body file://dashboard-config.json
```

---

## Application Performance Monitoring (APM)

### Option 1: CloudWatch Container Insights

**Enable for ECS:**
```bash
aws ecs put-account-setting \
  --name containerInsights \
  --value enabled
```

**Benefits:**
- CPU, memory, network metrics per container
- Task-level metrics
- Automatic dashboards
- Cost: ~$0.30/GB ingested

### Option 2: Sentry Integration

**Backend Configuration:**
```javascript
// apps/backend/src/index.ts
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express({ app }),
  ],
});

// Error handler
app.use(Sentry.Handlers.errorHandler());
```

**Benefits:**
- Error tracking and grouping
- Stack traces with source maps
- Performance monitoring
- Release tracking
- Cost: $26/month (Team plan, 50K errors/mo)

### Option 3: X-Ray (Advanced)

**Enable tracing in ECS:**
```json
{
  "containerDefinitions": [
    {
      "name": "xray-daemon",
      "image": "amazon/aws-xray-daemon",
      "cpu": 32,
      "memoryReservation": 256,
      "portMappings": [
        {
          "containerPort": 2000,
          "protocol": "udp"
        }
      ]
    }
  ]
}
```

**Benefits:**
- Distributed tracing
- Service map visualization
- Latency analysis
- Cost: $5/million traces + $0.50/million retrieved

---

## Log Aggregation Strategy

### Log Levels

```javascript
// Use Winston with proper log levels
const logger = winston.createLogger({
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
  },
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new CloudWatchTransport({
      logGroupName: '/ecs/aldeia-prod-backend',
      logStreamName: process.env.HOSTNAME,
      awsRegion: 'us-east-1',
    }),
  ],
});
```

### Structured Logging

```javascript
// Good: Structured logging
logger.info('User authenticated', {
  userId: user.id,
  email: user.email,
  ip: req.ip,
  timestamp: Date.now(),
  action: 'login'
});

// Bad: Unstructured logging
logger.info(`User ${user.email} logged in from ${req.ip}`);
```

---

## Monitoring Checklist

### Pre-Deployment
- [ ] CloudWatch Logs groups created
- [ ] Log retention policies configured
- [ ] CloudWatch alarms created
- [ ] SNS topics configured
- [ ] Dashboards created
- [ ] Container Insights enabled (ECS)

### Post-Deployment
- [ ] Verify logs are flowing to CloudWatch
- [ ] Test alarm notifications
- [ ] Review dashboards
- [ ] Set up on-call rotation
- [ ] Document runbooks

### Ongoing
- [ ] Weekly dashboard review
- [ ] Monthly alarm threshold tuning
- [ ] Quarterly cost optimization
- [ ] Review and archive old logs

---

## Troubleshooting Guide

### High ALB 5xx Errors

**Investigation Steps:**
1. Check backend task health in ECS console
2. Review backend application logs for errors
3. Check RDS connections and CPU
4. Verify Redis connectivity
5. Check for deployment in progress

**Resolution:**
- Rollback to previous version if deployment-related
- Scale up backend tasks if resource constrained
- Fix application bugs causing errors

### High RDS CPU

**Investigation Steps:**
1. Check Performance Insights for slow queries
2. Review RDS connections count
3. Check for missing indexes
4. Look for long-running transactions

**Resolution:**
- Optimize slow queries
- Add indexes
- Implement connection pooling
- Scale up RDS instance

### Memory Pressure

**Investigation Steps:**
1. Check ECS task memory utilization
2. Look for memory leaks in application logs
3. Review container memory limits

**Resolution:**
- Increase task memory allocation
- Fix memory leaks in code
- Implement proper cleanup

---

## Summary

**Monitoring Coverage:**
- ✅ Application logs centralized in CloudWatch
- ✅ Infrastructure metrics monitored
- ✅ Critical alarms configured
- ✅ Dashboards for quick overview
- ✅ Error tracking with Sentry
- ✅ Notifications via SNS/Email/Slack

**Next Steps:**
1. Create all log groups and set retention
2. Configure CloudWatch alarms
3. Set up SNS topics and subscriptions
4. Create dashboards
5. Enable Container Insights
6. Integrate Sentry (optional)
7. Test alarm notifications

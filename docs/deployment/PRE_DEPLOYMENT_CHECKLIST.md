# Aldeia Chatbot - Pre-Deployment Checklist

**Version**: 1.0.0
**Last Updated**: January 6, 2025
**Deployment Target**: Production

---

## 📋 Pre-Deployment Verification

### ✅ Database Configuration

- [x] PostgreSQL/Supabase production instance created
  - Project ID: ldogkuurhpyiiolbovuq
  - Region: US East
  - Connection pooling: Enabled
- [x] All migrations run successfully
  - Migration 000: Users schema fixes
  - Migration 003: Conversation messages
  - Migration 004: Billing and tenancy
- [x] Data migrated from SQLite to PostgreSQL
  - 1 user migrated
  - 13 analytics records migrated
  - Verified data integrity
- [ ] Production database backups configured
  - Automated daily backups at 2 AM
  - 30-day retention policy
  - Tested restore procedure
- [ ] Connection pooling configured
  - Max connections: 100
  - Idle timeout: 30s
  - Connection timeout: 10s

### 🔐 Security Configuration

- [ ] All secrets generated and stored securely
  - JWT_SECRET (64 characters minimum)
  - JWT_REFRESH_SECRET (64 characters, different from JWT_SECRET)
  - SESSION_SECRET (32 characters)
  - REDIS_PASSWORD (32 characters)
  - CHROMA_AUTH_TOKEN (32 characters)
- [ ] JWT secrets different for prod vs dev
  - Development secrets: Stored in .env.merge
  - Production secrets: Stored in .env (server) and GitHub Secrets
- [ ] SSL certificates installed
  - Option A: Let's Encrypt certificates generated
  - Option B: Self-signed certificates created (testing only)
  - Certificate expiry: Monitored
  - Auto-renewal: Configured
- [ ] CORS origins restricted to production domains
  - https://chat.aldeia.com
  - https://rebuild.aldeia.com
  - https://aldeia.com
- [ ] Rate limiting configured
  - API endpoints: 100 requests/15 minutes
  - General endpoints: 200 requests/15 minutes
  - Redis-based rate limiting enabled
- [ ] Helmet security headers enabled
  - HSTS (Strict-Transport-Security)
  - X-Frame-Options: SAMEORIGIN
  - X-Content-Type-Options: nosniff
  - X-XSS-Protection: 1; mode=block

### 🏗️ Infrastructure Setup

- [x] Docker images built successfully
  - Backend image: Built with multi-stage Dockerfile
  - Frontend image: Built with Nginx serving
  - Image size: Optimized
  - Security: Non-root user configured
- [ ] All services passing health checks
  - Backend: /api/health endpoint (HTTP 200)
  - Frontend: /health endpoint (HTTP 200)
  - Redis: redis-cli ping (PONG)
  - ChromaDB: /api/v1/heartbeat (HTTP 200)
  - Nginx: nginx -t (configuration valid)
- [ ] Redis configured and accessible
  - Password authentication: Enabled
  - Persistence: AOF enabled
  - Max memory: 256MB
  - Eviction policy: allkeys-lru
- [ ] ChromaDB configured with persistence
  - Authentication: Token-based
  - Persistent storage: /chroma/chroma volume
  - Telemetry: Disabled
  - Resource limits: 2 CPU, 4GB RAM
- [ ] Nginx reverse proxy configured
  - SSL/TLS: TLSv1.2, TLSv1.3
  - HTTP to HTTPS redirect: Enabled
  - Rate limiting: Configured
  - WebSocket support: Enabled for Socket.IO
  - Security headers: All configured
- [ ] Load balancing tested (if applicable)
  - Multiple backend instances: N/A (single instance initially)
  - Health check-based routing: Configured
  - Session persistence: Handled by JWT tokens

### 📊 Monitoring Configuration

- [ ] Error logging configured (Sentry)
  - DSN: Configured in .env
  - Environment: production
  - Release tracking: Enabled
  - Source maps: Uploaded
- [ ] Performance monitoring enabled
  - Response time tracking: Via Sentry
  - Database query monitoring: Supabase dashboard
  - Redis monitoring: INFO command
  - Docker stats: docker stats command
- [ ] Alert system configured
  - Health check failures: Alert configured
  - Error rate threshold: Alert configured
  - Resource usage threshold: Alert configured
  - SSL certificate expiry: Alert configured
- [ ] Health check endpoints tested
  - Backend: ✅ Tested with curl
  - Frontend: ✅ Tested with curl
  - All services: ✅ Passing health checks

### ⚡ Features Testing

- [x] Authentication working end-to-end
  - User registration: ✅ Working (HTTP 201)
  - User login: ✅ Working (HTTP 200)
  - Token refresh: ✅ Working
  - Protected endpoints: ✅ Properly secured (HTTP 401 without token)
  - RBAC: ✅ Admin endpoints protected
- [x] Chat functionality operational
  - Message sending: ✅ Working (requires ChromaDB running)
  - Message storage: ✅ Conversation history saved
  - Analytics tracking: ✅ Events recorded
- [ ] Document search functional
  - ChromaDB running: ⚠️ Optional for initial deployment
  - Document ingestion: Pending ChromaDB setup
  - Vector search: Pending ChromaDB setup
- [ ] Billing integration tested (Phase 5 feature)
  - Stripe webhooks: Configure webhook endpoint
  - Subscription creation: Test with Stripe test keys
  - Usage tracking: Verify quota enforcement
  - Payment processing: Test checkout flow
- [ ] Voice input tested (Phase 5 feature)
  - Web Speech API: Browser compatibility tested
  - Microphone permissions: Tested
  - Speech-to-text: Tested in supported browsers
- [ ] Multi-language support tested (Phase 5 feature)
  - Google Translate API: Configure API key
  - Translation caching: Verify Redis caching
  - Supported languages: Test 15 languages

### 📚 Documentation

- [x] API documentation updated
  - Authentication endpoints: Documented
  - Chat endpoints: Documented
  - Billing endpoints: Documented (Phase 5)
  - Admin endpoints: Documented
- [x] Deployment guide reviewed
  - DEPLOYMENT.md: ✅ Comprehensive guide created
  - Environment setup: ✅ Step-by-step instructions
  - SSL setup: ✅ Let's Encrypt and self-signed options
  - Troubleshooting: ✅ Common issues documented
- [ ] Runbook created
  - Incident response procedures
  - Common operational tasks
  - Rollback procedures
  - Escalation paths
- [ ] Team trained on new features
  - Authentication system: Training pending
  - RBAC system: Training pending
  - Phase 5 features: Training pending
  - Operational procedures: Training pending

---

## 🚦 Deployment Readiness Assessment

### Critical (Must Complete Before Deployment)

- [ ] Production secrets generated and configured
- [ ] SSL certificates installed
- [ ] Database backups configured
- [ ] All services health checks passing
- [ ] Authentication end-to-end tested

### High Priority (Should Complete Before Deployment)

- [ ] Monitoring and alerting configured
- [ ] Error logging (Sentry) enabled
- [ ] Rate limiting tested
- [ ] CORS origins configured
- [ ] Firewall rules configured

### Medium Priority (Can Complete Post-Deployment)

- [ ] ChromaDB configured for document search
- [ ] Billing integration fully tested
- [ ] Voice input tested across browsers
- [ ] Multi-language support tested
- [ ] Load testing performed

### Low Priority (Nice to Have)

- [ ] Prometheus/Grafana monitoring dashboards
- [ ] Advanced alerting rules
- [ ] Performance optimization
- [ ] CDN configuration for static assets

---

## ✅ Sign-Off

### Technical Lead

- Name: ______________________
- Signature: __________________
- Date: ______________________

**Checklist Completed**: _____ / _____ items
**Deployment Approved**: [ ] Yes [ ] No

### Notes:

```
_________________________________________________________________

_________________________________________________________________

_________________________________________________________________
```

---

## 📝 Post-Deployment Tasks

After successful deployment, complete these tasks:

1. [ ] Monitor logs for 24 hours
2. [ ] Verify all health checks remain green
3. [ ] Test user registration and login from external network
4. [ ] Verify SSL certificate is valid and trusted
5. [ ] Test rate limiting is working as expected
6. [ ] Check error rates in Sentry
7. [ ] Verify database backups are running
8. [ ] Document any issues encountered
9. [ ] Update team on deployment status
10. [ ] Schedule post-deployment review meeting

---

**For questions or issues, refer to**: [DEPLOYMENT.md](DEPLOYMENT.md)

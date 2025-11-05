# Intelligent Merge Strategy - Aldeia Chatbot

## Date: $(date +%Y-%m-%d)
## Created by: [Your Name]

---

## 🎯 Merge Overview

We are intelligently combining:
- **Source 1**: GitHub Repository (Working monorepo with 3 apps)
- **Source 2**: Project Knowledge (Enhanced features & production-ready code)

**Goal**: Create production-ready AI chatbot with enterprise features

---

## 📦 Components to KEEP from GitHub

### 1. Monorepo Structure ✅
- **Why**: Well-organized, working workspace setup
- **Location**: Root `package.json` with workspaces
- **Action**: PRESERVE as-is

### 2. Rebuild Platform ✅
- **Why**: Unique feature not in Project Knowledge
- **Location**: `apps/rebuild-platform/`
- **Action**: KEEP entirely, only add authentication

### 3. Shared Packages ✅
- **Why**: Good abstraction, reusable code
- **Location**: `packages/shared-types`, `packages/ui-components`, `packages/utils`
- **Action**: KEEP structure, may enhance with new types

### 4. Port Configuration ✅
- **Why**: Already working, less disruption
- **Ports**: 3001 (backend), 3002 (chatbot), 3000 (rebuild)
- **Action**: KEEP and adjust Project Knowledge code to match

### 5. Frontend React 19 ✅
- **Why**: Newer than Project Knowledge's React 18
- **Location**: `apps/chatbot-frontend/`
- **Action**: KEEP version, add new features

### 6. Document Ingestion ✅
- **Why**: Working implementation
- **Location**: `apps/backend/src/document_ingest.ts`
- **Action**: KEEP but fix ChromaDB errors

### 7. Docker Compose Development Setup ✅
- **Why**: Working development environment
- **Location**: `docker-compose.yml`
- **Action**: KEEP for dev, create new production version

---

## 🚀 Components to ADD from Project Knowledge

### Phase 2: Authentication & Security
- [ ] JWT authentication service
- [ ] RBAC (Role-Based Access Control)
- [ ] User sessions management
- [ ] Password hashing (bcrypt)
- [ ] Refresh token system
- [ ] Authentication middleware
- [ ] Authorization middleware

**Files to Create:**
- `apps/backend/src/services/auth/auth.service.ts`
- `apps/backend/src/services/auth/rbac.service.ts`
- `apps/backend/src/middleware/auth/authenticate.ts`
- `apps/backend/src/middleware/auth/authorize.ts`
- `apps/backend/src/routes/auth.ts`

### Phase 2: Database Migration
- [ ] PostgreSQL/Supabase integration
- [ ] Database migration scripts
- [ ] Data migration from SQLite
- [ ] New database models

**Files to Create:**
- `apps/backend/src/config/database.ts` (replace)
- `apps/backend/src/database/migrations/`
- `apps/backend/src/database/migrate.ts`
- `apps/backend/src/database/migrate-data.ts`

### Phase 3: SaaS Features
- [ ] Stripe billing integration
- [ ] Multi-tenant architecture
- [ ] Usage tracking
- [ ] Subscription management
- [ ] API key management

**Files to Create:**
- `apps/backend/src/services/billing/`
- `apps/backend/src/services/tenant/`
- `apps/backend/src/services/usage/`
- `apps/backend/src/routes/billing.ts`
- `apps/backend/src/middleware/tenant.ts`

### Phase 4: Advanced Features
- [ ] Multilingual support
- [ ] Voice input/output
- [ ] WebSocket real-time
- [ ] Translation service
- [ ] Enhanced context management

**Files to Create:**
- `apps/backend/src/services/translation/`
- `apps/backend/src/services/voice/`
- `apps/chatbot-frontend/src/contexts/I18nContext.tsx`
- `apps/chatbot-frontend/src/components/voice/`

### Production Infrastructure
- [ ] Production Docker configuration
- [ ] Nginx reverse proxy setup
- [ ] Redis caching layer
- [ ] Monitoring & logging (Sentry)
- [ ] Health check endpoints
- [ ] CI/CD pipeline

**Files to Create:**
- `docker-compose.production.yml`
- `nginx/nginx.conf`
- `.github/workflows/deploy.yml`
- `.env.production.template`

---

## 🔄 Components to ENHANCE (Merge Both)

### 1. Backend API Routes
- **Keep**: GitHub's chat routes structure
- **Add**: Authentication requirements
- **Add**: RBAC permissions
- **Enhance**: Error handling from Project Knowledge

### 2. Chat Widget
- **Keep**: GitHub's React component structure
- **Add**: Authentication context
- **Add**: Voice input components
- **Add**: Language selector
- **Enhance**: Real-time features

### 3. Environment Configuration
- **Keep**: GitHub's basic .env structure
- **Add**: All new variables from Project Knowledge
- **Create**: Separate production config

---

## 📝 Merge Order (Critical!)

Execute in this exact order to avoid dependency issues:

1. **Database Layer** (Days 3-4)
   - Set up PostgreSQL/Supabase
   - Create migration scripts
   - Migrate existing data
   - Update database config

2. **Authentication Core** (Days 5-6)
   - Add JWT service
   - Add RBAC service
   - Add middleware
   - Create auth routes

3. **Frontend Auth Integration** (Day 7)
   - Add auth context
   - Update API calls
   - Add login/register UI

4. **Enhanced Backend Services** (Days 8-9)
   - Add translation service
   - Add voice service
   - Add billing service
   - Add tenant management

5. **Frontend Advanced Features** (Day 10)
   - Add voice components
   - Add language selector
   - Add WebSocket integration

6. **Production Configuration** (Days 11-12)
   - Create production Docker setup
   - Configure Nginx
   - Set up monitoring
   - Create CI/CD pipeline

7. **Testing & Validation** (Day 13)
   - Run all tests
   - Integration testing
   - Security audit
   - Performance testing

8. **Deployment** (Days 14-15)
   - Deploy to staging
   - Validation
   - Deploy to production
   - Monitor

---

## ⚠️ Potential Conflicts to Watch

### 1. Database Connection
- **Conflict**: SQLite vs PostgreSQL
- **Resolution**: Create database adapter layer, support both temporarily

### 2. Port Configuration  
- **Conflict**: GitHub uses 3001, PK examples show 4000
- **Resolution**: Keep GitHub ports (3001), adjust PK code

### 3. Authentication State
- **Conflict**: Session vs JWT
- **Resolution**: Completely replace with JWT

### 4. Environment Variables
- **Conflict**: Different variable names
- **Resolution**: Create comprehensive .env merging both

### 5. React Versions
- **Conflict**: React 19 (GitHub) vs React 18 (PK)
- **Resolution**: Keep React 19, test PK components

---

## 🧪 Testing Strategy

After each phase:
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing of new features
- [ ] No breaking changes to existing features
- [ ] Performance benchmarks maintained

---

## 📊 Success Criteria

Merge is complete when:
- [ ] All GitHub features still work
- [ ] All Project Knowledge features integrated
- [ ] Authentication working end-to-end
- [ ] Database migrated successfully
- [ ] All tests passing
- [ ] Docker production build successful
- [ ] Documentation complete
- [ ] Code reviewed and approved

---

## 🔐 Security Checklist

- [ ] All secrets in environment variables
- [ ] JWT secrets generated and secure
- [ ] Database credentials not in code
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] SQL injection protection
- [ ] XSS protection
- [ ] CSRF protection

---

## 📚 Documentation to Create

- [x] This merge strategy document
- [ ] API documentation updates
- [ ] Database schema documentation
- [ ] Authentication flow diagrams
- [ ] Deployment guide
- [ ] Migration guide for users
- [ ] Troubleshooting guide

---

## 🎯 Next Steps

1. Review this strategy with team
2. Get approval to proceed
3. Begin Phase 2: Database Migration
4. Update this document as we discover new insights

---

**Last Updated**: $(date)
**Status**: Phase 1 - Strategy Planning

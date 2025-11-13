# Phase 5: Enhanced Features Implementation Plan

**Status**: 🚀 Ready to Start
**Phase**: Phase 5 of 8
**Estimated Duration**: 3-5 days
**Prerequisites**: Phase 4 Complete ✅

---

## Overview

Phase 5 adds advanced features to the Aldeia Fire Recovery Assistant, including multilingual support, voice capabilities, real-time communication, billing, multi-tenancy, and enhanced usage tracking.

---

## Infrastructure Status

### ✅ Existing Infrastructure
- **Language Support (Database)**:
  - Users table has `language` column (default: 'en')
  - Conversations table has `language` column
  - ConversationsService supports language parameter
- **Authentication & RBAC**: Fully implemented in Phase 3
- **PostgreSQL Database**: Supabase with full schema
- **Analytics Service**: Basic analytics tracking in place

### ❌ Missing Infrastructure
- **i18n Framework**: No translation system
- **Voice/Speech APIs**: No Web Speech API or third-party integration
- **WebSocket Server**: No real-time communication
- **Stripe Integration**: No billing/subscription system
- **Multi-tenancy**: No organization/tenant structure
- **Usage Metering**: Basic analytics but no usage limits/quotas

---

## Feature 1: Multilingual Support 🌍

**Priority**: HIGH
**Complexity**: MEDIUM
**Duration**: 1 day

### Implementation Plan

#### Backend Tasks
1. **Translation Service** (NEW)
   - Create `apps/backend/src/services/translation.service.ts`
   - Integrate with translation API (Google Translate, AWS Translate, or DeepL)
   - Add translation caching in database
   - Support language detection

2. **Update Chat Routes**
   - Add language parameter to chat requests
   - Translate bot responses based on user language
   - Store translations for frequently asked questions

3. **Database Updates**
   - Create `translations` table for caching
   - Update users to track preferred language

#### Frontend Tasks
1. **i18n Setup**
   - Install `react-i18next` and `i18next`
   - Create language files (`/locales/en.json`, `/locales/es.json`, `/locales/pt.json`)
   - Add language switcher component

2. **Update UI Components**
   - Wrap all text strings in translation functions
   - Add language selector in user profile
   - Persist language preference

#### Supported Languages
- English (en) - Primary
- Spanish (es) - California has large Spanish-speaking population
- Portuguese (pt) - For Brazilian community

#### Dependencies
```json
{
  "backend": [
    "@google-cloud/translate",
    "node-cache"
  ],
  "frontend": [
    "react-i18next",
    "i18next",
    "i18next-browser-languagedetector"
  ]
}
```

---

## Feature 2: Voice Input/Output 🎤🔊

**Priority**: MEDIUM
**Complexity**: MEDIUM
**Duration**: 1 day

### Implementation Plan

#### Frontend Tasks (Primary)
1. **Web Speech API Integration**
   - Implement Speech Recognition for voice input
   - Implement Speech Synthesis for voice output
   - Add microphone button to chat input
   - Add speaker button to bot messages
   - Handle browser compatibility

2. **Voice UI Components**
   - Create `VoiceInput.tsx` component
   - Create `VoiceOutput.tsx` component
   - Add visual feedback (waveform, listening indicator)
   - Add voice settings (speed, pitch, voice selection)

3. **Voice Controls**
   - Start/stop recording
   - Cancel voice input
   - Replay bot response
   - Auto-play toggle

#### Backend Tasks
1. **Audio Processing** (Optional)
   - Add endpoint for audio transcription (if using third-party service)
   - Store voice interaction metadata in analytics

#### Browser Support
- Chrome/Edge: ✅ Full support
- Safari: ⚠️ Partial support
- Firefox: ⚠️ Limited support

#### Dependencies
```json
{
  "frontend": [
    "react-speech-recognition",
    "react-speech-kit"
  ]
}
```

---

## Feature 3: WebSocket Real-Time Communication 📡

**Priority**: MEDIUM
**Complexity**: HIGH
**Duration**: 1.5 days

### Implementation Plan

#### Backend Tasks
1. **WebSocket Server Setup**
   - Install Socket.IO server
   - Create `apps/backend/src/websocket/socket.server.ts`
   - Add authentication middleware for WebSocket connections
   - Create room management for conversations

2. **Real-Time Features**
   - Typing indicators
   - Live message updates
   - Presence system (user online/offline)
   - Message read receipts
   - Admin broadcasting

3. **Update Chat Routes**
   - Emit events when messages are created
   - Emit events for conversation updates
   - Handle connection/disconnection events

#### Frontend Tasks
1. **Socket.IO Client**
   - Install Socket.IO client
   - Create `apps/chatbot-frontend/src/services/socket.service.ts`
   - Add connection management with auto-reconnect
   - Add authentication token to Socket.IO handshake

2. **Real-Time UI Updates**
   - Update ChatWidget to use WebSocket
   - Add typing indicator component
   - Add online status indicator
   - Show real-time message delivery status

#### Dependencies
```json
{
  "backend": [
    "socket.io",
    "socket.io-redis" // For horizontal scaling
  ],
  "frontend": [
    "socket.io-client"
  ]
}
```

#### Architecture
```
Client (Browser) <--WebSocket--> Socket.IO Server <---> Redis Adapter <---> PostgreSQL
                                       |
                                   Auth Middleware
                                       |
                                  JWT Verification
```

---

## Feature 4: Stripe Billing Integration 💳

**Priority**: MEDIUM
**Complexity**: HIGH
**Duration**: 2 days

### Implementation Plan

#### Backend Tasks
1. **Stripe Service**
   - Create `apps/backend/src/services/billing/stripe.service.ts`
   - Set up Stripe webhooks endpoint
   - Handle subscription lifecycle events
   - Implement payment methods management

2. **Database Schema**
   - Create `subscriptions` table
   - Create `payment_methods` table
   - Create `invoices` table
   - Add `stripe_customer_id` to users table

3. **Subscription Tiers**
   - **Free Tier**: 10 messages/day, basic features
   - **Pro Tier**: $9.99/month, 100 messages/day, voice, priority support
   - **Enterprise Tier**: $49.99/month, unlimited, custom features

4. **Usage Enforcement**
   - Add middleware to check subscription status
   - Rate limit based on tier
   - Block access when limits exceeded

#### Frontend Tasks
1. **Billing UI**
   - Create `BillingDashboard.tsx`
   - Create `SubscriptionPlans.tsx`
   - Create `PaymentMethods.tsx`
   - Integrate Stripe Elements for card input

2. **Upgrade Prompts**
   - Show upgrade modal when limits hit
   - Display usage meter
   - Add "Upgrade" call-to-action buttons

#### Database Migration
```sql
-- Migration: 004_add_billing_tables.sql

CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  tier VARCHAR(50) NOT NULL, -- 'free', 'pro', 'enterprise'
  status VARCHAR(50) NOT NULL, -- 'active', 'canceled', 'past_due'
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS usage_quotas (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  messages_used INTEGER DEFAULT 0,
  messages_limit INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Dependencies
```json
{
  "backend": [
    "stripe",
    "express-validator"
  ],
  "frontend": [
    "@stripe/stripe-js",
    "@stripe/react-stripe-js"
  ]
}
```

---

## Feature 5: Multi-Tenant Features 🏢

**Priority**: LOW
**Complexity**: HIGH
**Duration**: 1.5 days

### Implementation Plan

#### Backend Tasks
1. **Organization Schema**
   - Create `organizations` table
   - Create `organization_members` table
   - Add `organization_id` to relevant tables
   - Implement organization-level RBAC

2. **Tenant Isolation**
   - Add organization filter to all queries
   - Create organization middleware
   - Implement data isolation policies

3. **Organization Management**
   - Create organization CRUD endpoints
   - Add member invitation system
   - Implement organization settings

#### Frontend Tasks
1. **Organization UI**
   - Create `OrganizationDashboard.tsx`
   - Create `OrganizationSettings.tsx`
   - Create `TeamMembers.tsx`
   - Add organization switcher

#### Database Migration
```sql
-- Migration: 005_add_multi_tenancy.sql

CREATE TABLE IF NOT EXISTS organizations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  settings JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS organization_members (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL, -- 'owner', 'admin', 'member'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(organization_id, user_id)
);

-- Add organization_id to existing tables
ALTER TABLE conversations ADD COLUMN organization_id INTEGER REFERENCES organizations(id);
ALTER TABLE analytics_events ADD COLUMN organization_id INTEGER REFERENCES organizations(id);
```

---

## Feature 6: Enhanced Usage Tracking 📊

**Priority**: HIGH
**Complexity**: LOW
**Duration**: 0.5 days

### Implementation Plan

#### Backend Tasks
1. **Usage Metrics Service**
   - Create `apps/backend/src/services/usage-metrics.service.ts`
   - Track messages, voice interactions, API calls
   - Calculate costs and usage patterns
   - Generate usage reports

2. **Quota Management**
   - Implement quota checking middleware
   - Add quota reset cron job
   - Send usage alerts (80%, 100%)

3. **Analytics Dashboard**
   - Add usage endpoints for admins
   - Add personal usage endpoint for users
   - Export usage data (CSV, JSON)

#### Frontend Tasks
1. **Usage Dashboard**
   - Create `UsageDashboard.tsx`
   - Display message count, quota remaining
   - Show usage graphs (daily, weekly, monthly)
   - Add export functionality

#### Database Updates
```sql
-- Add to analytics_events table
ALTER TABLE analytics_events ADD COLUMN resource_type VARCHAR(50); -- 'message', 'voice', 'document_search'
ALTER TABLE analytics_events ADD COLUMN cost_credits DECIMAL(10,4) DEFAULT 0; -- Track internal cost
```

---

## Implementation Priority

Based on impact and complexity:

### Phase 5A (High Priority - Week 1)
1. ✅ **Multilingual Support** (Day 1-2)
   - High impact for California's diverse population
   - Moderate complexity
   - Foundation for international expansion

2. ✅ **Enhanced Usage Tracking** (Day 2-3)
   - Required for billing
   - Low complexity
   - High business value

### Phase 5B (Medium Priority - Week 2)
3. ✅ **Voice Input/Output** (Day 3-4)
   - Accessibility improvement
   - Moderate complexity
   - Differentiating feature

4. ✅ **WebSocket Real-Time** (Day 4-5)
   - Better UX
   - High complexity
   - Technical debt reduction

### Phase 5C (Optional - Future)
5. ⏸️ **Stripe Billing** (Week 3)
   - High complexity
   - Requires legal/business setup
   - Can defer until product-market fit

6. ⏸️ **Multi-Tenant Features** (Week 3-4)
   - Only needed for B2B
   - High complexity
   - Can defer for MVP

---

## Recommended Approach

### Option 1: Full Phase 5 Implementation
- Implement all 6 features
- Duration: 3-5 days
- Best for: Production-ready enterprise product

### Option 2: Phase 5A Only (Recommended)
- Implement Multilingual + Usage Tracking
- Duration: 1.5-2 days
- Best for: MVP with international support

### Option 3: Progressive Enhancement
- Start with Phase 5A
- Add Phase 5B based on user feedback
- Defer Phase 5C until revenue generation

---

## Dependencies Installation

### For Full Phase 5 Implementation:

**Backend:**
```bash
cd apps/backend
npm install --save @google-cloud/translate node-cache socket.io socket.io-redis stripe express-validator
```

**Frontend:**
```bash
cd apps/chatbot-frontend
npm install --save react-i18next i18next i18next-browser-languagedetector react-speech-recognition react-speech-kit socket.io-client @stripe/stripe-js @stripe/react-stripe-js
```

---

## Testing Requirements

### Phase 5A Tests
- [ ] Translation service unit tests
- [ ] Language switching E2E tests
- [ ] Usage tracking accuracy tests
- [ ] Quota enforcement tests

### Phase 5B Tests
- [ ] Voice input/output browser tests
- [ ] WebSocket connection tests
- [ ] Real-time message delivery tests
- [ ] Connection resilience tests

### Phase 5C Tests
- [ ] Stripe webhook tests
- [ ] Subscription lifecycle tests
- [ ] Multi-tenant isolation tests
- [ ] Payment flow E2E tests

---

## Risk Assessment

### High Risk
- **WebSocket Implementation**: Complex infrastructure, scaling challenges
- **Stripe Integration**: PCI compliance, legal requirements
- **Multi-Tenancy**: Data isolation critical for security

### Medium Risk
- **Translation Service**: API costs, quality issues
- **Voice Features**: Browser compatibility issues

### Low Risk
- **Usage Tracking**: Well-understood patterns
- **i18n Frontend**: Mature libraries

---

## Next Steps

1. **Review this plan** with stakeholders
2. **Choose implementation scope** (Option 1, 2, or 3)
3. **Set up development environment** (API keys, Stripe account)
4. **Create feature branch**: `feature/phase5-enhanced-features`
5. **Begin with Phase 5A** (Multilingual + Usage Tracking)

---

**Created**: November 6, 2025
**Author**: Claude Code
**Status**: Ready for Implementation

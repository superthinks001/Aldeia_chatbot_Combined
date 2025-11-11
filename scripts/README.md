# Aldeia Scripts Directory

This directory contains all automation scripts for the Aldeia Combined Platform.

## Directory Structure

```
scripts/
├── setup/           # Initial setup and migration scripts
├── testing/         # Test execution and verification scripts
├── deployment/      # Production deployment scripts
└── quality/         # Code quality and linting scripts
```

## Setup Scripts (`setup/`)

### `setup.sh`
**Purpose:** Initial project setup
**Usage:** `./scripts/setup/setup.sh`
**Description:** Runs the complete setup process including Node.js verification, migration script execution, environment configuration, and dependency installation.

### `migration-script.sh`
**Purpose:** Migrate files from old project structure to combined structure
**Usage:** `./scripts/setup/migration-script.sh [source_directory]`
**Description:** Copies files from the original Aldeia project to the new monorepo structure. Can be run interactively or with a source directory argument.

**Note:** This script is primarily for historical reference. Most files have already been migrated.

---

## Testing Scripts (`testing/`)

### Quick Checks

#### `health-check.sh`
**Purpose:** Quick service health verification
**Usage:** `./scripts/testing/health-check.sh`
**Description:** Checks if all services (backend, frontend, Redis, ChromaDB) are running and responding correctly. Runs in ~10 seconds.

#### `quick-test.sh`
**Purpose:** Quick validation suite (7 core tests)
**Usage:** `./scripts/testing/quick-test.sh`
**Description:** Runs essential API tests including authentication, chat, documents, and health checks. Completes in ~1 minute.

### Comprehensive Testing

#### `run-all-tests.sh`
**Purpose:** Complete automated test suite
**Usage:** `./scripts/testing/run-all-tests.sh`
**Description:** Executes all automated tests including API endpoints, authentication, WebSocket, rate limiting, and security. Takes ~5-10 minutes.

**Test Categories:**
- Authentication tests
- Chat API tests
- Document management tests
- Security tests
- Rate limiting tests
- WebSocket functionality

#### `comprehensive-test.sh`
**Purpose:** Extended testing with additional scenarios
**Usage:** `./scripts/testing/comprehensive-test.sh`
**Description:** Runs comprehensive tests with edge cases and stress testing.

### Feature-Specific Tests

#### `test-auth.sh`
**Purpose:** Backend authentication testing
**Usage:** `./scripts/testing/test-auth.sh`
**Description:** Tests authentication endpoints including registration, login, token validation, and RBAC.

#### `test-auth-chat.sh`
**Purpose:** Authentication and chat integration
**Usage:** `./scripts/testing/test-auth-chat.sh`
**Description:** Tests integration between authentication system and chat functionality.

#### `test-integration.sh`
**Purpose:** Service integration testing
**Usage:** `./scripts/testing/test-integration.sh`
**Description:** Tests integration between backend, frontend, Redis, and ChromaDB services.

#### `test-rbac-fix.sh`
**Purpose:** Role-Based Access Control verification
**Usage:** `./scripts/testing/test-rbac-fix.sh`
**Description:** Tests RBAC implementation and permission enforcement.

### Phase Verification Scripts

#### `verify-phase1.sh`
**Purpose:** Phase 1 completion verification
**Usage:** `./scripts/testing/verify-phase1.sh`
**Description:** Verifies that Phase 1 requirements are met.

#### `verify-phase2.sh`
**Purpose:** Phase 2 completion verification
**Usage:** `./scripts/testing/verify-phase2.sh`
**Description:** Verifies that Phase 2 requirements are met.

#### `verify-phase3.sh`
**Purpose:** Phase 3 completion verification
**Usage:** `./scripts/testing/verify-phase3.sh`
**Description:** Verifies that Phase 3 (authentication) is complete.

#### `test-phase5-features.sh`
**Purpose:** Phase 5 feature validation
**Usage:** `./scripts/testing/test-phase5-features.sh`
**Description:** Tests features implemented in Phase 5.

#### `test-phase6-simple.sh`
**Purpose:** Phase 6 simple tests
**Usage:** `./scripts/testing/test-phase6-simple.sh`
**Description:** Simple validation tests for Phase 6 features.

---

## Deployment Scripts (`deployment/`)

### `deploy-production.sh`
**Purpose:** Production deployment workflow
**Usage:** `./scripts/deployment/deploy-production.sh`
**Description:** Executes the complete production deployment process including:
- Pre-deployment checks
- Environment validation
- Database migrations
- Service deployment
- Health verification
- Rollback on failure

**⚠️ CRITICAL:** Only run in production environment with proper backups.

### `validate-deployment.sh`
**Purpose:** Post-deployment validation
**Usage:** `./scripts/deployment/validate-deployment.sh`
**Description:** Validates that a deployment was successful by checking:
- All services are running
- Database connectivity
- API endpoints responding
- Authentication working
- Integration tests passing

**When to use:** After any deployment to verify system health.

### `deploy.sh`
**Purpose:** Generic deployment script
**Usage:** `./scripts/deployment/deploy.sh`
**Description:** General-purpose deployment script for various environments.

---

## Quality Scripts (`quality/`)

### `code-quality-check.sh`
**Purpose:** Code quality validation and linting
**Usage:** `./scripts/quality/code-quality-check.sh`
**Description:** Runs comprehensive code quality checks including:
- ESLint for JavaScript/TypeScript
- TypeScript type checking
- Code formatting validation
- Security vulnerability scanning
- Best practices enforcement

**Lines of code:** 617 lines
**Time to run:** ~2-5 minutes

---

## Common Usage Patterns

### After Pulling Code
```bash
./scripts/testing/health-check.sh
./scripts/testing/quick-test.sh
```

### Before Committing Code
```bash
./scripts/quality/code-quality-check.sh
./scripts/testing/run-all-tests.sh
```

### After Deployment
```bash
./scripts/deployment/validate-deployment.sh
./scripts/testing/comprehensive-test.sh
```

### New Developer Setup
```bash
./scripts/setup/setup.sh
```

---

## Script Requirements

All scripts require:
- **Bash shell** (bash 4.0+)
- **curl** (for API testing)
- **jq** (for JSON parsing in some scripts)
- **Node.js** v18+ (for running the application)
- **Docker** (for containerized services)

### Installing Requirements

**macOS:**
```bash
brew install bash curl jq
```

**Ubuntu/Debian:**
```bash
sudo apt-get install bash curl jq
```

**Windows:**
Use Git Bash or WSL with the above Ubuntu commands.

---

## Exit Codes

All scripts follow standard exit code conventions:
- **0** = Success
- **1** = General error
- **2** = Missing dependencies
- **3** = Service not running
- **4** = Test failures

---

## Troubleshooting

### Permission Denied
```bash
chmod +x scripts/**/*.sh
```

### Scripts Not Found
Make sure you're running scripts from the project root:
```bash
cd /path/to/aldeia-combined
./scripts/testing/health-check.sh
```

### Services Not Running
Start services first:
```bash
docker-compose up -d
# Or
npm run dev
```

---

## Contributing

When adding new scripts:
1. Place in appropriate subdirectory
2. Add shebang line: `#!/bin/bash`
3. Include usage comment at top
4. Follow existing naming conventions
5. Update this README
6. Test on multiple platforms
7. Document exit codes

---

## Script Statistics

| Category | Scripts | Total Lines | Purpose |
|----------|---------|-------------|---------|
| Setup | 2 | 178 | Initial configuration |
| Testing | 13 | 1,760 | Quality assurance |
| Deployment | 3 | 1,032 | Production deployment |
| Quality | 1 | 617 | Code quality checks |
| **Total** | **19** | **3,587** | **Complete automation** |

---

## Related Documentation

- **Main README:** `../README.md`
- **Quick Start Guide:** `../QUICK_START.md`
- **Testing Guide:** `../docs/guides/TESTING_GUIDE.md`
- **Deployment Guide:** `../docs/guides/DEPLOYMENT.md`
- **Rollback Procedures:** `../docs/guides/ROLLBACK_PROCEDURE.md`

---

**Last Updated:** 2025-01-11
**Maintained By:** Aldeia Development Team

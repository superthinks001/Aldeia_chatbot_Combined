#!/bin/bash

echo "🔍 Verifying Phase 1 Completion..."
echo ""

# Check 1: Backup tag exists
echo "✓ Checking backup tag..."
if git tag -l | grep -q "pre-merge-backup"; then
  echo "  ✅ Backup tag found: $(git tag -l 'pre-merge-backup*')"
else
  echo "  ❌ No backup tag found!"
  exit 1
fi

# Check 2: On integration branch
echo "✓ Checking branch..."
BRANCH=$(git branch --show-current)
if [[ $BRANCH == "integration/project-knowledge-merge-v2" ]]; then
  echo "  ✅ On correct branch: $BRANCH"
else
  echo "  ❌ Not on integration branch! Currently on: $BRANCH"
  exit 1
fi

# Check 3: Merge docs exist
echo "✓ Checking documentation..."
if [ -d "merge-docs" ]; then
  echo "  ✅ merge-docs directory exists"
  echo "     Files: $(ls merge-docs | wc -l) documents created"
else
  echo "  ❌ merge-docs directory not found!"
  exit 1
fi

# Check 4: .env.merge exists
echo "✓ Checking environment config..."
if [ -f ".env.merge" ]; then
  echo "  ✅ .env.merge exists"
  if grep -q "REPLACE_ME" .env.merge; then
    echo "  ⚠️  WARNING: Remember to replace placeholder values in .env.merge!"
  fi
else
  echo "  ❌ .env.merge not found!"
  exit 1
fi

# Check 5: Dependencies installed
echo "✓ Checking new dependencies..."
cd apps/backend
if grep -q "jsonwebtoken" package.json && grep -q "@supabase/supabase-js" package.json; then
  echo "  ✅ New dependencies installed"
else
  echo "  ❌ Dependencies not installed!"
  exit 1
fi
cd ../..

# Check 6: Tracker exists
echo "✓ Checking phase tracker..."
if [ -f "merge-docs/PHASE_TRACKER.md" ]; then
  echo "  ✅ Phase tracker exists"
else
  echo "  ❌ Phase tracker not found!"
  exit 1
fi

echo ""
echo "🎉 Phase 1 Complete! All checks passed!"
echo ""
echo "📝 Next Steps:"
echo "   1. Edit .env.merge with your actual credentials"
echo "   2. Create Supabase account if you haven't"
echo "   3. Review merge-docs/MERGE_STRATEGY.md"
echo "   4. Ready to start Phase 2: Database Migration"
echo ""
echo "🚀 To start Phase 2, run:"
echo "   Ask: 'Help me start Phase 2: Database Migration'"

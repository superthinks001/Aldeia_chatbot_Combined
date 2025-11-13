#!/bin/bash

echo "🚀 Setting up Aldeia Combined Platform..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v18 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | sed 's/v//')
REQUIRED_MAJOR=18

# Extract major version number
NODE_MAJOR=$(echo $NODE_VERSION | cut -d. -f1)

if [ "$NODE_MAJOR" -lt "$REQUIRED_MAJOR" ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please install Node.js v18 or higher."
    exit 1
fi

echo "✅ Node.js version $NODE_VERSION is compatible"

# Get script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_ROOT"

# Run migration script if it exists
MIGRATION_SCRIPT="$SCRIPT_DIR/migration-script.sh"
if [ -f "$MIGRATION_SCRIPT" ]; then
    echo "📦 Running migration script..."
    chmod +x "$MIGRATION_SCRIPT"
    "$MIGRATION_SCRIPT"
else
    echo "⚠️  Migration script not found. Make sure to copy your files manually."
fi

# Set up environment
if [ ! -f ".env" ]; then
    echo "🔧 Setting up environment configuration..."
    cp .env.example .env
    echo "✅ Created .env file from template"
else
    echo "✅ .env file already exists"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Create data directory if it doesn't exist
mkdir -p data/documents

echo ""
echo "🎉 Setup complete! You can now:"
echo "   • Run 'npm run dev' to start all applications"
echo "   • Run individual apps with 'npm run backend:dev', 'npm run frontend:dev', or 'npm run rebuild:dev'"
echo "   • Edit .env file to configure your environment"
echo ""
echo "📖 For more information, see the README.md file"
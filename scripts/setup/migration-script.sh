#!/bin/bash

# Migration script for copying files from old project structure to combined structure
# Usage: ./migration-script.sh [source_dir]
#
# This script is designed to migrate files from the original Aldeia project structure
# to the new aldeia-combined monorepo structure.
#
# Default behavior (no arguments):
#   - Prompts for source directory interactively
#
# With argument:
#   ./migration-script.sh /path/to/old/project
#
# NOTE: This script is primarily for historical reference.
# Most files have already been migrated to the aldeia-combined structure.

set -e  # Exit on error

# Get the script's directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "==================================="
echo "Aldeia Migration Script"
echo "==================================="
echo "Project root: $PROJECT_ROOT"
echo ""

# Determine source directory
if [ -n "$1" ]; then
    SOURCE_DIR="$1"
else
    echo "This script copies files from the old Aldeia project structure."
    echo "Please enter the path to the old project directory:"
    read -r SOURCE_DIR
fi

# Validate source directory
if [ ! -d "$SOURCE_DIR" ]; then
    echo "ERROR: Source directory does not exist: $SOURCE_DIR"
    exit 1
fi

echo "Source directory: $SOURCE_DIR"
echo ""
echo "This will copy files from the source to the current project structure."
read -p "Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Migration cancelled."
    exit 0
fi

cd "$PROJECT_ROOT"

# Create target directories if they don't exist
mkdir -p apps data/documents

echo ""
echo "Starting migration..."

# Copy backend (if exists)
if [ -d "$SOURCE_DIR/backend" ]; then
    echo "- Copying backend..."
    cp -r "$SOURCE_DIR/backend" "./apps/" 2>/dev/null || echo "  (backend already exists, skipped)"
else
    echo "- Backend not found in source, skipping"
fi

# Copy frontend (if exists)
if [ -d "$SOURCE_DIR/frontend" ]; then
    echo "- Copying frontend to chatbot-frontend..."
    cp -r "$SOURCE_DIR/frontend" "./apps/chatbot-frontend" 2>/dev/null || echo "  (frontend already exists, skipped)"
else
    echo "- Frontend not found in source, skipping"
fi

# Copy database (if exists)
if [ -f "$SOURCE_DIR/aldeia.db" ]; then
    echo "- Copying database..."
    cp "$SOURCE_DIR/aldeia.db" "./data/" 2>/dev/null || echo "  (database already exists, skipped)"
else
    echo "- Database not found in source, skipping"
fi

# Copy documents from frontend/public (if exists)
if [ -d "$SOURCE_DIR/frontend/public" ]; then
    echo "- Copying documents..."
    cp -r "$SOURCE_DIR/frontend/public/"* "./data/documents/" 2>/dev/null || echo "  (documents already exist, skipped)"
else
    echo "- Documents not found in source, skipping"
fi

# Copy docker-compose (if exists)
if [ -f "$SOURCE_DIR/docker-compose.yml" ]; then
    echo "- Copying docker-compose.yml..."
    cp "$SOURCE_DIR/docker-compose.yml" "./" 2>/dev/null || echo "  (docker-compose.yml already exists, skipped)"
else
    echo "- docker-compose.yml not found in source, skipping"
fi

# Copy rebuild platform (if a different path was specified)
if [ -n "$2" ] && [ -d "$2" ]; then
    echo "- Copying rebuild platform from: $2"
    mkdir -p "./apps/rebuild-platform"
    cp -r "$2/"* "./apps/rebuild-platform/" 2>/dev/null || echo "  (rebuild platform already exists, skipped)"
fi

echo ""
echo "==================================="
echo "Migration completed!"
echo "==================================="
echo ""
echo "NOTE: This migration script is for reference."
echo "The aldeia-combined project already contains the migrated files."
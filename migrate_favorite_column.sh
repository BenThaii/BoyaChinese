#!/bin/bash

# Migration script to add is_favorite column to production database
# Run this on the production server

set -e  # Exit on any error

echo "=========================================="
echo "Database Migration: Add Favorite Column"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Get database credentials
print_info "This script will add the is_favorite column to the vocabulary_entries table"
echo ""

# Check if we're in the right directory
if [ ! -f "packages/backend/database/add_favorite_column.sql" ]; then
    print_error "Migration file not found. Please run this script from the app root directory."
    exit 1
fi

print_info "Running database migration..."

# Run the migration
sudo mysql < packages/backend/database/add_favorite_column.sql

if [ $? -eq 0 ]; then
    print_success "Migration completed successfully!"
    echo ""
    print_info "Verifying migration..."
    
    # Verify the column was added
    sudo mysql -e "USE chinese_learning_app; DESCRIBE vocabulary_entries;" | grep "is_favorite"
    
    if [ $? -eq 0 ]; then
        print_success "Column 'is_favorite' verified in database"
    else
        print_error "Column verification failed"
        exit 1
    fi
else
    print_error "Migration failed"
    exit 1
fi

echo ""
print_success "Database migration complete!"
echo ""
print_info "You can now use the favorite feature in the application"
echo ""

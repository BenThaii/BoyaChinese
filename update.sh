#!/bin/bash

# Chinese Learning App - Update Script
# Run this script to update your production server with the latest code

set -e  # Exit on any error

echo "=========================================="
echo "Chinese Learning App Update Script"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    print_error "Please do not run this script as root. Run as a regular user with sudo privileges."
    exit 1
fi

# Detect application directory
APP_DIR="/var/www/chinese-learning-app"
if [ ! -d "$APP_DIR" ]; then
    print_error "Application directory not found at $APP_DIR"
    print_info "Please run deploy.sh first to set up the application"
    exit 1
fi

cd $APP_DIR

print_info "Starting update process..."
echo ""

# Step 1: Pull latest code
print_info "Pulling latest code from git..."
git pull origin main
print_success "Code updated"

# Step 2: Install/update dependencies
print_info "Installing dependencies..."
npm install
print_success "Dependencies updated"

# Step 3: Build application
print_info "Building application..."
npm run build
print_success "Application built"

# Step 4: Run database migrations (if any)
print_info "Checking for database migrations..."
if [ -f "packages/backend/database/add_english_meaning_column.sql" ]; then
    print_info "Running database migration for english_meaning column..."
    
    # Read database credentials from .env
    DB_USER=$(grep DB_USER packages/backend/.env | cut -d '=' -f2)
    DB_PASSWORD=$(grep DB_PASSWORD packages/backend/.env | cut -d '=' -f2)
    DB_NAME=$(grep DB_NAME packages/backend/.env | cut -d '=' -f2)
    
    # Check if column already exists
    COLUMN_EXISTS=$(mysql -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -se "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='pre_generated_sentences' AND COLUMN_NAME='english_meaning'")
    
    if [ "$COLUMN_EXISTS" -eq 0 ]; then
        mysql -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < packages/backend/database/add_english_meaning_column.sql
        print_success "Database migration completed"
    else
        print_success "Database already up to date"
    fi
fi

# Step 5: Restart backend
print_info "Restarting backend..."
pm2 restart chinese-learning-backend
print_success "Backend restarted"

# Step 6: Deploy updated frontend
print_info "Deploying updated frontend..."
sudo cp -r packages/frontend/dist/* /var/www/html/chinese-learning-app/
sudo chown -R www-data:www-data /var/www/html/chinese-learning-app
print_success "Frontend deployed"

# Step 7: Reload Nginx (just in case)
print_info "Reloading Nginx..."
sudo nginx -t && sudo systemctl reload nginx
print_success "Nginx reloaded"

echo ""
echo "=========================================="
print_success "Update completed successfully!"
echo "=========================================="
echo ""
echo "Useful commands:"
echo "  View backend logs:    pm2 logs chinese-learning-backend"
echo "  Check backend status: pm2 status"
echo "  Restart backend:      pm2 restart chinese-learning-backend"
echo ""

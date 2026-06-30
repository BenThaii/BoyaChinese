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

# Get the directory where the script is located (works if run from anywhere)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Detect application directory
APP_DIR="${APP_DIR:-$SCRIPT_DIR}"
if [ ! -d "$APP_DIR" ]; then
    print_error "Application directory not found at $APP_DIR"
    print_info "Please run deploy.sh first to set up the application"
    exit 1
fi

cd $APP_DIR

print_info "Starting update process..."
echo ""

# Step 0: Backup production .env files (safety measure)
print_info "Backing up production environment files..."
BACKUP_DIR="/tmp/boya-backup-$(date +%s)"
mkdir -p $BACKUP_DIR
if [ -f "packages/backend/.env" ]; then
    cp packages/backend/.env "$BACKUP_DIR/.env"
    print_success "Backed up backend .env to $BACKUP_DIR"
fi
if [ -f "packages/frontend/.env" ]; then
    cp packages/frontend/.env "$BACKUP_DIR/frontend.env"
    print_success "Backed up frontend .env to $BACKUP_DIR"
fi

# Step 1: Pull latest code
print_info "Pulling latest code from git..."
git pull origin main
print_success "Code updated"

# Step 1.5: Restore production .env files (git won't touch them since they're in .gitignore, but just to be safe)
if [ -f "$BACKUP_DIR/.env" ]; then
    cp "$BACKUP_DIR/.env" packages/backend/.env
    print_success "Verified backend .env is in place"
fi
if [ -f "$BACKUP_DIR/frontend.env" ]; then
    cp "$BACKUP_DIR/frontend.env" packages/frontend/.env
    print_success "Verified frontend .env is in place"
fi

# Step 2: Install/update dependencies
print_info "Installing dependencies..."
npm install
print_success "Dependencies installed"

# Step 3: Build backend
print_info "Building backend..."
cd packages/backend
npm run build
cd ../..
print_success "Backend built"

# Step 4: Build frontend
print_info "Building frontend..."
cd packages/frontend
rm -rf dist  # Clean old build to ensure fresh files
npm run build
cd ../..
print_success "Frontend built"
print_info "Checking for database migrations..."
if [ -f "packages/backend/database/add_english_meaning_column.sql" ]; then
    print_info "Running database migration for english_meaning column..."
    
    # Read database credentials from .env
    DB_USER=$(grep DB_USER packages/backend/.env | cut -d '=' -f2)
    DB_PASSWORD=$(grep DB_PASSWORD packages/backend/.env | cut -d '=' -f2)
    DB_NAME=$(grep DB_NAME packages/backend/.env | cut -d '=' -f2)
    
    # Build mysql command based on whether password is empty
    if [ -z "$DB_PASSWORD" ]; then
        MYSQL_CMD="mysql -u$DB_USER"
    else
        MYSQL_CMD="mysql -u$DB_USER -p$DB_PASSWORD"
    fi
    
    # Check if column already exists
    COLUMN_EXISTS=$($MYSQL_CMD "$DB_NAME" -se "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='pre_generated_sentences' AND COLUMN_NAME='english_meaning'" 2>/dev/null || echo "0")
    
    if [ "$COLUMN_EXISTS" -eq 0 ]; then
        $MYSQL_CMD "$DB_NAME" < packages/backend/database/add_english_meaning_column.sql
        print_success "Database migration completed"
    else
        print_success "Database already up to date"
    fi
fi

# Step 5: Restart backend
print_info "Restarting backend..."
pm2 restart backend
sleep 3
print_success "Backend restarted"

# Step 6: Deploy updated frontend (Nginx serves from /var/www/chinese-learning-app/packages/frontend/dist/)
print_info "Deploying updated frontend..."
# Frontend is already built, just verify it's there
if [ -f "packages/frontend/dist/index.html" ]; then
    print_success "Frontend built and ready at packages/frontend/dist/"
else
    print_error "Frontend build failed - index.html not found"
    exit 1
fi

# Step 7: Verify Nginx configuration points to correct frontend directory
print_info "Checking Nginx configuration..."
if grep -q "packages/frontend/dist" /etc/nginx/sites-available/chinese-learning-app 2>/dev/null; then
    print_success "Nginx configured correctly"
else
    print_info "Note: Verify Nginx config points to /var/www/chinese-learning-app/packages/frontend/dist/"
fi

# Step 8: Reload Nginx to serve new files
print_info "Reloading Nginx..."
sudo nginx -t && sudo systemctl reload nginx
print_success "Nginx reloaded"

echo ""
echo "=========================================="
print_success "Update completed successfully!"
echo "=========================================="
echo ""
echo "Useful commands:"
echo "  View backend logs:    pm2 logs backend"
echo "  Check backend status: pm2 status"
echo "  Restart backend:      pm2 restart backend"
echo ""

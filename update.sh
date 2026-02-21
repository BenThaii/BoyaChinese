#!/bin/bash

# Chinese Learning App - Quick Update Script
# Run this script on the production server to pull and deploy latest changes

set -e  # Exit on any error

echo "=========================================="
echo "Chinese Learning App - Update Script"
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

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Step 1: Pull latest changes
print_info "Pulling latest changes from GitHub..."
git pull origin main
print_success "Code updated"

# Step 2: Install dependencies (in case package.json changed)
print_info "Installing dependencies..."
npm install
print_success "Dependencies updated"

# Step 3: Build backend
print_info "Building backend..."
npm run build -w @chinese-learning-app/backend
print_success "Backend built"

# Step 4: Build frontend
print_info "Building frontend..."
npm run build -w @chinese-learning-app/frontend
print_success "Frontend built"

# Step 5: Deploy frontend
print_info "Deploying frontend..."
sudo cp -r packages/frontend/dist/* /var/www/html/chinese-learning-app/
sudo chown -R www-data:www-data /var/www/html/chinese-learning-app
print_success "Frontend deployed"

# Step 6: Check and start LibreTranslate if needed
print_info "Checking LibreTranslate status..."
if ! sudo docker ps | grep -q libretranslate; then
    print_info "LibreTranslate not running, starting it..."
    sudo docker-compose up -d
    sleep 5
    print_success "LibreTranslate started"
else
    print_success "LibreTranslate already running"
fi

# Step 7: Restart backend
print_info "Restarting backend..."
pm2 restart chinese-learning-backend
print_success "Backend restarted"

# Step 8: Show status
echo ""
print_info "Checking service status..."
pm2 status
echo ""
sudo docker ps

echo ""
echo "=========================================="
print_success "Update completed successfully!"
echo "=========================================="
echo ""
echo "View logs with: pm2 logs chinese-learning-backend"
echo ""

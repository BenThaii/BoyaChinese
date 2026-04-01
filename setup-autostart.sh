#!/bin/bash

# Setup auto-start for Chinese Learning App using PM2
# This script configures PM2 to start the app on boot

set -e

echo "Setting up auto-start for Chinese Learning App..."

# Auto-detect application directory
if [ -d "/var/www/chinese-learning-app" ]; then
    APP_DIR="/var/www/chinese-learning-app"
elif [ -d "/home/ubuntu/BoyaChinese" ]; then
    APP_DIR="/home/ubuntu/BoyaChinese"
elif [ -d "$HOME/BoyaChinese" ]; then
    APP_DIR="$HOME/BoyaChinese"
else
    APP_DIR="$PWD"
fi

echo "Application directory: $APP_DIR"

# Verify directory exists
if [ ! -d "$APP_DIR" ]; then
    echo "ERROR: Directory $APP_DIR does not exist!"
    exit 1
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "PM2 not found. Installing PM2..."
    sudo npm install -g pm2
    echo "✓ PM2 installed"
else
    echo "✓ PM2 already installed"
fi

# Get the current user
USER_NAME=$(whoami)

# Stop any existing PM2 processes
pm2 delete chinese-learning-backend 2>/dev/null || true
echo "✓ Cleaned up existing PM2 processes"

# Create PM2 ecosystem file if it doesn't exist
if [ ! -f "$APP_DIR/ecosystem.config.js" ]; then
    cat > "$APP_DIR/ecosystem.config.js" << EOF
module.exports = {
  apps: [{
    name: 'chinese-learning-backend',
    cwd: '$APP_DIR/packages/backend',
    script: 'dist/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
EOF
    echo "✓ Created PM2 ecosystem file"
else
    echo "✓ PM2 ecosystem file already exists"
fi

# Start the application with PM2
cd "$APP_DIR"
pm2 start ecosystem.config.js
echo "✓ Application started with PM2"

# Save PM2 process list
pm2 save
echo "✓ PM2 process list saved"

# Setup PM2 to start on boot
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER_NAME --hp $HOME
echo "✓ PM2 startup configured"

echo ""
echo "Setup complete! Checking status..."
echo ""
pm2 list
echo ""
pm2 logs chinese-learning-backend --lines 20 --nostream

echo ""
echo "Useful commands:"
echo "  pm2 list                              # List all processes"
echo "  pm2 logs chinese-learning-backend     # View logs"
echo "  pm2 restart chinese-learning-backend  # Restart app"
echo "  pm2 stop chinese-learning-backend     # Stop app"
echo "  pm2 monit                             # Monitor resources"
echo ""
echo "The application will now start automatically on server boot!"

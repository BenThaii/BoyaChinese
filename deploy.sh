#!/bin/bash

# Chinese Learning App - Automated Deployment Script for Ubuntu 24.04
# Run this script after cloning the repository

set -e  # Exit on any error

echo "=========================================="
echo "Chinese Learning App Deployment Script"
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

# Get configuration from user
echo "Please provide the following information:"
echo ""

read -p "MySQL root password (will be created if MySQL is new): " MYSQL_ROOT_PASSWORD
read -p "MySQL database name [chinese_learning_app]: " DB_NAME
DB_NAME=${DB_NAME:-chinese_learning_app}

read -p "MySQL username [chinese_app]: " DB_USER
DB_USER=${DB_USER:-chinese_app}

read -p "MySQL password for $DB_USER: " DB_PASSWORD

read -p "Google AI API Key: " GOOGLE_AI_KEY

# Auto-detect public IP address
print_info "Detecting server IP address..."
DOMAIN=$(curl -s http://checkip.amazonaws.com)
if [ -z "$DOMAIN" ]; then
    # Fallback to another service if AWS fails
    DOMAIN=$(curl -s https://api.ipify.org)
fi
if [ -z "$DOMAIN" ]; then
    # Last fallback
    DOMAIN=$(hostname -I | awk '{print $1}')
fi
print_success "Detected IP address: $DOMAIN"

read -p "Enable SSL with Let's Encrypt? (y/n) [n]: " ENABLE_SSL
ENABLE_SSL=${ENABLE_SSL:-n}

if [ "$ENABLE_SSL" = "y" ]; then
    read -p "Email for SSL certificate: " SSL_EMAIL
fi

echo ""
print_info "Starting deployment..."
echo ""

# Step 1: Update system
print_info "Updating system packages..."
sudo apt update && sudo apt upgrade -y
print_success "System updated"

# Step 2: Install Node.js
print_info "Installing Node.js 20.x..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
    print_success "Node.js installed"
else
    print_success "Node.js already installed"
fi

# Step 3: Install Docker
print_info "Installing Docker..."
if ! command -v docker &> /dev/null; then
    sudo apt install -y docker.io docker-compose
    sudo systemctl enable docker
    sudo systemctl start docker
    sudo usermod -aG docker $USER
    print_success "Docker installed"
else
    print_success "Docker already installed"
fi

# Step 4: Install MySQL
print_info "Installing MySQL..."
if ! command -v mysql &> /dev/null; then
    sudo apt install -y mysql-server
    sudo systemctl enable mysql
    sudo systemctl start mysql
    print_success "MySQL installed"
else
    print_success "MySQL already installed"
fi

# Step 5: Install Nginx
print_info "Installing Nginx..."
if ! command -v nginx &> /dev/null; then
    sudo apt install -y nginx
    sudo systemctl enable nginx
    sudo systemctl start nginx
    print_success "Nginx installed"
else
    print_success "Nginx already installed"
fi

# Step 6: Install PM2
print_info "Installing PM2..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
    print_success "PM2 installed"
else
    print_success "PM2 already installed"
fi

# Step 7: Configure MySQL
print_info "Configuring MySQL database..."
sudo mysql -e "CREATE DATABASE IF NOT EXISTS $DB_NAME;" 2>/dev/null || true
sudo mysql -e "CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';" 2>/dev/null || true
sudo mysql -e "GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"
print_success "MySQL database configured"

# Step 8: Create application directory
print_info "Setting up application directory..."
APP_DIR="/var/www/chinese-learning-app"
sudo mkdir -p $APP_DIR
sudo chown -R $USER:$USER $APP_DIR

# Copy files to application directory if not already there
if [ "$PWD" != "$APP_DIR" ]; then
    print_info "Copying files to $APP_DIR..."
    sudo cp -r . $APP_DIR/
    cd $APP_DIR
    # Fix ownership after copying
    sudo chown -R $USER:$USER $APP_DIR
fi

print_success "Application directory ready"

# Step 9: Install dependencies
print_info "Installing dependencies..."
npm install
print_success "Dependencies installed"

# Step 10: Configure environment variables
print_info "Configuring environment variables..."

# Backend .env
cat > packages/backend/.env << EOF
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_NAME=$DB_NAME

# Google AI API Key
GOOGLE_AI_API_KEY=$GOOGLE_AI_KEY

# LibreTranslate URL
LIBRETRANSLATE_URL=http://localhost:5000/translate

# Server Port
PORT=3000
EOF

# Frontend .env
PROTOCOL="http"
if [ "$ENABLE_SSL" = "y" ]; then
    PROTOCOL="https"
fi

cat > packages/frontend/.env << EOF
VITE_API_URL=${PROTOCOL}://${DOMAIN}/api
EOF

print_success "Environment variables configured"

# Step 11: Build application
print_info "Building application..."
npm run build
print_success "Application built"

# Step 12: Start LibreTranslate
print_info "Starting LibreTranslate..."
# Create the directory if it doesn't exist and set proper permissions
sudo mkdir -p libretranslate-data
sudo chown -R 1032:1032 libretranslate-data
sudo docker-compose up -d
sleep 5  # Wait for container to start
print_success "LibreTranslate started"

# Step 13: Initialize database
print_info "Initializing database..."
cd packages/backend
timeout 10 node dist/index.js || true
cd ../..
print_success "Database initialized"

# Step 14: Create PM2 ecosystem file
print_info "Creating PM2 configuration..."
cat > ecosystem.config.js << EOF
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

# Start backend with PM2
pm2 delete chinese-learning-backend 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp /home/$USER
print_success "Backend started with PM2"

# Step 15: Deploy frontend
print_info "Deploying frontend..."
sudo mkdir -p /var/www/html/chinese-learning-app
sudo cp -r packages/frontend/dist/* /var/www/html/chinese-learning-app/
sudo chown -R www-data:www-data /var/www/html/chinese-learning-app
print_success "Frontend deployed"

# Step 16: Configure Nginx
print_info "Configuring Nginx..."
sudo tee /etc/nginx/sites-available/chinese-learning-app > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN;

    # Frontend
    location / {
        root /var/www/html/chinese-learning-app;
        try_files \$uri \$uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Audio files
    location /audio {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        root /var/www/html/chinese-learning-app;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/chinese-learning-app /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo rm -f /etc/nginx/sites-available/default
sudo nginx -t
sudo systemctl reload nginx
print_success "Nginx configured"

# Step 17: Configure firewall
print_info "Configuring firewall..."
sudo ufw --force enable
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
print_success "Firewall configured"

# Step 18: Set up SSL (if requested)
if [ "$ENABLE_SSL" = "y" ]; then
    print_info "Setting up SSL certificate..."
    sudo apt install -y certbot python3-certbot-nginx
    sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email $SSL_EMAIL --redirect
    print_success "SSL certificate installed"
fi

# Step 19: Set up log rotation
print_info "Setting up log rotation..."
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
print_success "Log rotation configured"

echo ""
echo "=========================================="
print_success "Deployment completed successfully!"
echo "=========================================="
echo ""
echo "Your application is now running at:"
if [ "$ENABLE_SSL" = "y" ]; then
    echo "  https://$DOMAIN"
else
    echo "  http://$DOMAIN"
fi
echo ""
echo "Useful commands:"
echo "  View backend logs:    pm2 logs chinese-learning-backend"
echo "  Restart backend:      pm2 restart chinese-learning-backend"
echo "  View Docker logs:     sudo docker-compose logs -f"
echo "  Restart LibreTranslate: sudo docker-compose restart"
echo ""
echo "IMPORTANT: You may need to log out and log back in for Docker group changes to take effect."
echo ""

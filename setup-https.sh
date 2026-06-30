#!/bin/bash

# Setup HTTPS with Self-Signed Certificate on EC2
# Run this script once on the EC2 instance to enable HTTPS

set -e

echo "=========================================="
echo "Setting up HTTPS (Self-Signed Certificate)"
echo "=========================================="
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Step 1: Create self-signed certificate
print_info "Generating self-signed SSL certificate..."
CERT_DIR="/etc/nginx/ssl"
sudo mkdir -p $CERT_DIR

# Generate certificate valid for 365 days
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout $CERT_DIR/private.key \
    -out $CERT_DIR/certificate.crt \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=chinese-learning-app"

print_success "Self-signed certificate created"
print_info "Location: $CERT_DIR/certificate.crt and $CERT_DIR/private.key"

# Step 2: Update Nginx configuration
print_info "Updating Nginx configuration..."

# Create new Nginx config with HTTPS
cat > /tmp/nginx-chinese-learning-app.conf << 'EOF'
# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name _;
    
    # Allow Let's Encrypt validation if needed in future
    location /.well-known/acme-challenge/ {
        root /var/www/chinese-learning-app;
    }
    
    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name _;

    # SSL configuration
    ssl_certificate /etc/nginx/ssl/certificate.crt;
    ssl_certificate_key /etc/nginx/ssl/private.key;
    
    # SSL parameters
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Frontend
    location / {
        root /var/www/chinese-learning-app/packages/frontend/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache control
        expires 1h;
        add_header Cache-Control "public, max-age=3600";
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Auth routes
    location /auth/ {
        proxy_pass http://localhost:3000/auth/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Admin routes
    location /admin/ {
        proxy_pass http://localhost:3000/admin/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Other backend routes
    location /phrases/ {
        proxy_pass http://localhost:3000/phrases/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /vocabulary/ {
        proxy_pass http://localhost:3000/vocabulary/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        proxy_pass http://localhost:3000/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
EOF

sudo cp /tmp/nginx-chinese-learning-app.conf /etc/nginx/sites-available/chinese-learning-app
print_success "Nginx configuration updated"

# Step 3: Test Nginx config
print_info "Testing Nginx configuration..."
if sudo nginx -t; then
    print_success "Nginx configuration is valid"
else
    print_error "Nginx configuration has errors"
    exit 1
fi

# Step 4: Reload Nginx
print_info "Reloading Nginx..."
sudo systemctl reload nginx
print_success "Nginx reloaded"

# Step 5: Verify ports are listening
print_info "Verifying ports..."
echo "Checking HTTP (port 80):"
sudo netstat -tlnp | grep :80 || echo "  (May need a moment to start)"

echo "Checking HTTPS (port 443):"
sudo netstat -tlnp | grep :443 || echo "  (May need a moment to start)"

echo ""
echo "=========================================="
print_success "HTTPS Setup Complete!"
echo "=========================================="
echo ""
echo "Your site is now accessible at:"
echo "  HTTP:  http://13.212.235.9"
echo "  HTTPS: https://13.212.235.9"
echo ""
echo "⚠️  Self-Signed Certificate Warning:"
echo "  Browsers will show a security warning because the certificate"
echo "  is not signed by a trusted Certificate Authority."
echo "  This is expected and safe. You can bypass the warning."
echo ""
echo "To upgrade to Let's Encrypt in the future:"
echo "  1. Buy a domain name ($1-5/year)"
echo "  2. Point it to this IP: 13.212.235.9"
echo "  3. Run: sudo certbot certonly --nginx -d yourdomain.com"
echo ""
echo "Useful commands:"
echo "  View SSL cert info:    sudo openssl x509 -in /etc/nginx/ssl/certificate.crt -text"
echo "  Reload Nginx:          sudo systemctl reload nginx"
echo "  View Nginx logs:       sudo tail -f /var/log/nginx/error.log"
echo ""

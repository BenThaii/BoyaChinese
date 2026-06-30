#!/usr/bin/env python3
"""Update Nginx config for HTTPS on EC2"""

config_content = """server {
    listen 80;
    listen [::]:80;
    server_name _;
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name _;

    ssl_certificate /etc/nginx/ssl/certificate.crt;
    ssl_certificate_key /etc/nginx/ssl/private.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    location / {
        root /var/www/chinese-learning-app/packages/frontend/dist;
        try_files $uri $uri/ /index.html;
        expires 1h;
        add_header Cache-Control "public, max-age=3600";
    }

    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /auth/ {
        proxy_pass http://localhost:3000/auth/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /admin/ {
        proxy_pass http://localhost:3000/admin/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /phrases/ {
        proxy_pass http://localhost:3000/phrases/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /vocabulary/ {
        proxy_pass http://localhost:3000/vocabulary/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        proxy_pass http://localhost:3000/health;
    }
}
"""

import subprocess
import sys

try:
    # Write config to temp file and then copy to nginx
    result = subprocess.run(
        ['sudo', 'tee', '/etc/nginx/sites-available/chinese-learning-app'],
        input=config_content.encode(),
        capture_output=True
    )
    
    if result.returncode != 0:
        print(f"Error writing config: {result.stderr.decode()}")
        sys.exit(1)
    
    # Test Nginx
    result = subprocess.run(['sudo', 'nginx', '-t'], capture_output=True)
    if result.returncode != 0:
        print(f"Nginx test failed: {result.stderr.decode()}")
        sys.exit(1)
    
    # Reload Nginx
    result = subprocess.run(['sudo', 'systemctl', 'reload', 'nginx'], capture_output=True)
    if result.returncode != 0:
        print(f"Reload failed: {result.stderr.decode()}")
        sys.exit(1)
    
    print("✓ Nginx configuration updated successfully")
    print("✓ HTTPS is now active!")
    print("")
    print("Your site is now accessible at:")
    print("  HTTP:  http://13.212.235.9 (redirects to HTTPS)")
    print("  HTTPS: https://13.212.235.9")
    print("")
    print("Note: Browsers will show a security warning (self-signed cert is normal)")
    
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)

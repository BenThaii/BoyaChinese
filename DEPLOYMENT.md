# Deployment Guide for Ubuntu 24.04

This guide will help you deploy the Chinese Learning App on an Ubuntu 24.04 server.

## Prerequisites

- Ubuntu 24.04 server with root or sudo access
- Domain name (optional, but recommended)
- At least 2GB RAM
- 20GB disk space

## Step 1: Install Required Software

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Docker and Docker Compose
sudo apt install -y docker.io docker-compose
sudo systemctl enable docker
sudo systemctl start docker

# Add your user to docker group (replace 'youruser' with your username)
sudo usermod -aG docker $USER

# Install MySQL
sudo apt install -y mysql-server
sudo systemctl enable mysql
sudo systemctl start mysql

# Install Nginx (for reverse proxy)
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# Install PM2 (process manager for Node.js)
sudo npm install -g pm2
```

## Step 2: Set Up MySQL Database

```bash
# Secure MySQL installation
sudo mysql_secure_installation

# Create database and user
sudo mysql -u root -p
```

In MySQL console:
```sql
CREATE DATABASE chinese_learning_app;
CREATE USER 'chinese_app'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON chinese_learning_app.* TO 'chinese_app'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## Step 3: Clone and Set Up Application

```bash
# Create application directory
sudo mkdir -p /var/www/chinese-learning-app
sudo chown $USER:$USER /var/www/chinese-learning-app
cd /var/www/chinese-learning-app

# Clone your repository (or upload files via SCP/SFTP)
# git clone <your-repo-url> .

# Or if uploading manually, ensure all files are in /var/www/chinese-learning-app

# Install dependencies
npm install

# Build the application
npm run build
```

## Step 4: Configure Environment Variables

Create backend `.env` file:
```bash
nano packages/backend/.env
```

Add the following:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=chinese_app
DB_PASSWORD=your_secure_password
DB_NAME=chinese_learning_app

# Google AI API Key
GOOGLE_AI_API_KEY=your_google_ai_api_key

# LibreTranslate URL
LIBRETRANSLATE_URL=http://localhost:5000/translate

# Server Port
PORT=3000
```

Create frontend `.env` file:
```bash
nano packages/frontend/.env
```

Add the following:
```env
VITE_API_URL=http://your-domain.com/api
```

## Step 5: Start LibreTranslate with Docker

```bash
# Start LibreTranslate container
cd /var/www/chinese-learning-app
docker-compose up -d

# Verify it's running
docker ps
```

## Step 6: Initialize Database

```bash
# Run database initialization
cd /var/www/chinese-learning-app/packages/backend
npm run build
node dist/index.js
# Press Ctrl+C after you see "Database initialized successfully"
```

## Step 7: Set Up PM2 for Backend

Create PM2 ecosystem file:
```bash
nano /var/www/chinese-learning-app/ecosystem.config.js
```

Add the following:
```javascript
module.exports = {
  apps: [{
    name: 'chinese-learning-backend',
    cwd: '/var/www/chinese-learning-app/packages/backend',
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
```

Start the backend:
```bash
cd /var/www/chinese-learning-app
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Step 8: Build and Serve Frontend

```bash
# Build frontend
cd /var/www/chinese-learning-app/packages/frontend
npm run build

# Copy build to nginx directory
sudo mkdir -p /var/www/html/chinese-learning-app
sudo cp -r dist/* /var/www/html/chinese-learning-app/
```

## Step 9: Configure Nginx

Create Nginx configuration:
```bash
sudo nano /etc/nginx/sites-available/chinese-learning-app
```

Add the following configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain or server IP

    # Frontend
    location / {
        root /var/www/html/chinese-learning-app;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Audio files
    location /audio {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/chinese-learning-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Step 10: Set Up SSL (Optional but Recommended)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is set up automatically
```

## Step 11: Configure Firewall

```bash
# Allow SSH, HTTP, and HTTPS
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## Step 12: Verify Deployment

1. Check backend is running:
```bash
pm2 status
curl http://localhost:3000/health
```

2. Check LibreTranslate is running:
```bash
docker ps
curl http://localhost:5000/languages
```

3. Check Nginx is serving frontend:
```bash
curl http://localhost
```

4. Access your application:
- Open browser and go to: `http://your-domain.com` or `http://your-server-ip`

## Maintenance Commands

### View Backend Logs
```bash
pm2 logs chinese-learning-backend
```

### Restart Backend
```bash
pm2 restart chinese-learning-backend
```

### Update Application
```bash
cd /var/www/chinese-learning-app
git pull  # or upload new files
npm install
npm run build

# Restart backend
pm2 restart chinese-learning-backend

# Rebuild and deploy frontend
cd packages/frontend
npm run build
sudo cp -r dist/* /var/www/html/chinese-learning-app/
```

### View Docker Logs
```bash
docker-compose logs -f libretranslate
```

### Restart LibreTranslate
```bash
cd /var/www/chinese-learning-app
docker-compose restart
```

### Database Backup
```bash
mysqldump -u chinese_app -p chinese_learning_app > backup_$(date +%Y%m%d).sql
```

### Database Restore
```bash
mysql -u chinese_app -p chinese_learning_app < backup_20240221.sql
```

## Troubleshooting

### Backend not starting
```bash
pm2 logs chinese-learning-backend --lines 100
```

### Database connection issues
```bash
# Check MySQL is running
sudo systemctl status mysql

# Test connection
mysql -u chinese_app -p chinese_learning_app
```

### LibreTranslate not working
```bash
# Check container status
docker ps -a

# View logs
docker-compose logs libretranslate

# Restart container
docker-compose restart libretranslate
```

### Nginx issues
```bash
# Check configuration
sudo nginx -t

# View error logs
sudo tail -f /var/log/nginx/error.log
```

## Performance Optimization

### Enable Nginx Caching
Add to nginx configuration:
```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### Enable Gzip Compression
Add to nginx configuration:
```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
```

## Security Recommendations

1. **Change default passwords** for MySQL and any other services
2. **Keep system updated**: `sudo apt update && sudo apt upgrade`
3. **Use SSL/TLS** for production
4. **Restrict MySQL** to localhost only
5. **Set up regular backups** using cron jobs
6. **Monitor logs** regularly for suspicious activity
7. **Use environment variables** for sensitive data (never commit .env files)

## Monitoring

Set up monitoring with PM2:
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

## Support

For issues or questions:
- Check logs: `pm2 logs`, `docker-compose logs`, `sudo tail -f /var/log/nginx/error.log`
- Verify all services are running: `pm2 status`, `docker ps`, `sudo systemctl status nginx mysql`

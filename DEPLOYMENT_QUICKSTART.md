# Production Deployment Quick Start

## For Production Server Administrators

### First-Time Setup (EC2)

```bash
# 1. SSH to the server
ssh -i your-key.ppk ubuntu@ec2-13-212-235-9.ap-southeast-1.compute.amazonaws.com

# 2. Clone the repository (or pull if already cloned)
cd /home/ubuntu
git clone https://github.com/BenThaii/BoyaChinese.git
cd BoyaChinese

# 3. Run the initial deployment script
./deploy.sh
# You'll be prompted for:
# - MySQL root password
# - MySQL database name (default: chinese_learning_app)
# - MySQL username (default: chinese_app)
# - MySQL password for the user
# - Google Translate API Key
# - Google AI API Key
# - Whether to enable SSL
# - Email for SSL certificate (if enabling SSL)
```

### Regular Updates (EC2)

```bash
# Simple - this script preserves all production credentials
cd /var/www/chinese-learning-app
./update.sh

# What this does:
# 1. Backs up production .env files
# 2. Pulls latest code from git
# 3. Restores .env files (credentials preserved!)
# 4. Installs dependencies
# 5. Builds application
# 6. Restarts backend
# 7. Deploys frontend
```

### Check Backend Status

```bash
# View running processes
pm2 status

# View backend logs
pm2 logs chinese-learning-backend

# Restart backend if needed
pm2 restart chinese-learning-backend

# View detailed process info
pm2 show chinese-learning-backend
```

### Check Database Status

```bash
# Connect to database
mysql -u chinese_app -p -h localhost chinese_learning_app

# Quick checks:
# See all tables
SHOW TABLES;

# Check users
SELECT id, username, is_admin FROM users LIMIT 5;

# Check vocabulary count
SELECT COUNT(*) as total_entries FROM vocabulary_entries;
```

### Check Frontend Status

```bash
# Frontend is served by Nginx
sudo systemctl status nginx

# Check Nginx configuration
sudo nginx -t

# Reload Nginx after any changes
sudo systemctl reload nginx

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
```

## What Changed (Recent Fix)

**Problem:** Production .env files (with credentials) were being overwritten during updates

**Solution:** 
- `update.sh` now backs up `.env` before `git pull`
- `update.sh` restores `.env` after `git pull`
- Production credentials are preserved automatically

**Result:** Safe to run `./update.sh` without worrying about losing credentials

## Environment Variable Details

### Production `.packages/backend/.env`
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=chinese_app           # Production username
DB_PASSWORD=<your-password>   # Production password
DB_NAME=chinese_learning_app

GOOGLE_TRANSLATE_API_KEY=<your-key>
GOOGLE_AI_API_KEY=<your-key>

PORT=3000
NODE_ENV=production

JWT_SECRET=<random-secret>
```

### Production `packages/frontend/.env`
```
VITE_API_URL=https://ec2-13-212-235-9.ap-southeast-1.compute.amazonaws.com/api
```

## Common Tasks

### Create Admin User

```bash
# SSH to server
ssh -i your-key.ppk ubuntu@ec2-13-212-235-9.ap-southeast-1.compute.amazonaws.com

# Run the admin setup script
cd /var/www/chinese-learning-app/packages/backend
npm run ts-node scripts/quick-setup-admin.ts
# Follow prompts - admin user will be created
```

### Generate Phrases for a User

```bash
# SSH to server and connect to database
mysql -u chinese_app -p chinese_learning_app

# Check if phrases exist
SELECT COUNT(*) FROM pre_generated_sentences WHERE user_id = 1;

# Or trigger generation via the UI:
# 1. Log in as admin user
# 2. Go to Admin Panel
# 3. Find "Generate Phrases" button
# 4. Select user and click Generate
```

### Backup Database

```bash
# SSH to server
ssh -i your-key.ppk ubuntu@ec2-13-212-235-9.ap-southeast-1.compute.amazonaws.com

# Dump database
cd /var/www/chinese-learning-app
mysqldump -u chinese_app -p chinese_learning_app > backup_$(date +%Y%m%d_%H%M%S).sql

# Download to local machine
# Use WinSCP or similar to download the .sql file
```

### Restore Database from Backup

```bash
# SSH to server
ssh -i your-key.ppk ubuntu@ec2-13-212-235-9.ap-southeast-1.compute.amazonaws.com

# Restore database
cd /var/www/chinese-learning-app
mysql -u chinese_app -p chinese_learning_app < backup_YYYYMMDD_HHMMSS.sql

# Restart backend to reconnect
pm2 restart chinese-learning-backend
```

## Troubleshooting

### Application won't start after update

```bash
# Check backend logs
pm2 logs chinese-learning-backend --lines 100

# Common issues:
# 1. Database credentials wrong
cat packages/backend/.env | grep DB_

# 2. Database not running
sudo systemctl status mysql

# 3. Port 3000 in use
sudo lsof -i :3000
```

### Frontend shows "Cannot connect to API"

```bash
# Check if API URL is correct in frontend .env
cat packages/frontend/.env

# Check if backend is running
pm2 status

# Check if Nginx is forwarding correctly
curl http://localhost:3000/api/health  # Should work
curl https://ec2-13-212-235-9.ap-southeast-1.compute.amazonaws.com/api/health  # Should also work
```

### Database connection failed

```bash
# Verify MySQL is running
sudo systemctl status mysql

# Check database credentials
mysql -u chinese_app -p -h localhost chinese_learning_app

# Check if credentials in .env match actual database user
mysql -u root
SELECT user, host FROM mysql.user;
```

## Useful Links

- **Production URL:** https://ec2-13-212-235-9.ap-southeast-1.compute.amazonaws.com
- **SSH Key Location:** D:\Google Drive\ketoanvamtgt@gmail.com\VAM\00_management\aws_migration\bitrix_gt_keypair\bitrix_gt_keypair.ppk
- **GitHub:** https://github.com/BenThaii/BoyaChinese
- **Admin Panel:** https://ec2-13-212-235-9.ap-southeast-1.compute.amazonaws.com/user1/admin

## Default Credentials

- **Admin Username:** admin
- **Admin Phrase:** Brave-Lion-42-Explores
- **Database User:** chinese_app
- **Database:** chinese_learning_app

## Key Commands Reference

```bash
# Updates (safe - preserves credentials)
./update.sh

# Backend management
pm2 status              # View all processes
pm2 logs <app>         # View logs
pm2 restart <app>      # Restart a process

# Database
mysql -u chinese_app -p -h localhost chinese_learning_app

# Nginx
sudo systemctl status nginx
sudo systemctl reload nginx

# Server monitoring
df -h                   # Disk space
free -h                 # Memory
htop                    # Process viewer (if installed)
```

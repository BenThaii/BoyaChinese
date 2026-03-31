# Deployment Guide for New t3.small Server

## Server Requirements

**Instance Type:** t3.small (or t2.small)
- 2 vCPUs
- 2 GB RAM
- 20-30 GB storage (EBS)
- Ubuntu 24.04 LTS

**Why t3.small is sufficient:**
- Video processing queue handles one job at a time
- 2-minute timeout prevents runaway processes
- Automatic cleanup of temp files
- Only 10 videos stored (managed disk space)
- Short videos (1 minute max)

## Step-by-Step Deployment

### 1. Launch New EC2 Instance

```bash
# Instance settings:
- AMI: Ubuntu 24.04 LTS
- Instance type: t3.small
- Storage: 20 GB gp3
- Security Group: Allow ports 22, 80, 443
```

### 2. Connect to Server

```bash
ssh -i your-key.pem ubuntu@YOUR_SERVER_IP
```

### 3. Clone Repository

```bash
cd ~
git clone https://github.com/BenThaii/BoyaChinese.git
cd BoyaChinese
```

### 4. Run Deployment Script

```bash
chmod +x deploy.sh
./deploy.sh
```

The script will prompt you for:
- MySQL root password
- Database name (default: chinese_learning_app)
- Database username (default: chinese_app)
- Database password
- Google AI API Key
- SSL setup (optional)

### 5. What the Script Does

1. **Updates system packages**
2. **Installs Node.js 20.x**
3. **Installs MySQL**
4. **Installs Nginx**
5. **Installs PM2** (process manager)
6. **Installs FFmpeg** (for video processing)
7. **Creates database and user**
8. **Installs dependencies**
9. **Builds frontend and backend**
10. **Configures environment variables**
11. **Starts backend with PM2**
12. **Deploys frontend to Nginx**
13. **Configures reverse proxy**
14. **Sets up firewall**
15. **Optionally installs SSL certificate**

### 6. Verify Installation

```bash
# Check backend status
pm2 status

# Check backend logs
pm2 logs chinese-learning-backend

# Check Nginx status
sudo systemctl status nginx

# Check FFmpeg
ffmpeg -version

# Test video processing
curl http://localhost:3000/api/video/queue
```

### 7. Access Your Application

```
http://YOUR_SERVER_IP
```

Or with SSL:
```
https://YOUR_DOMAIN
```

## Post-Deployment Configuration

### Update Frontend API URL

If you didn't use the deployment script, manually update:

```bash
# Edit packages/frontend/.env
VITE_API_URL=http://YOUR_SERVER_IP/api
```

Then rebuild:
```bash
cd packages/frontend
npm run build
sudo cp -r dist/* /var/www/html/chinese-learning-app/
```

### Import Existing Database

```bash
# On old server, export database
mysqldump -u root chinese_learning > backup.sql

# Transfer to new server
scp backup.sql ubuntu@NEW_SERVER_IP:~/

# On new server, import
mysql -u chinese_app -p chinese_learning_app < ~/backup.sql
```

### Transfer Processed Videos

```bash
# On old server
cd /path/to/app/packages/backend/uploads
tar -czf processed-videos.tar.gz processed/

# Transfer
scp processed-videos.tar.gz ubuntu@NEW_SERVER_IP:~/

# On new server
cd /var/www/chinese-learning-app/packages/backend/uploads
tar -xzf ~/processed-videos.tar.gz
```

## Monitoring & Maintenance

### View Logs

```bash
# Backend logs
pm2 logs chinese-learning-backend

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### Restart Services

```bash
# Restart backend
pm2 restart chinese-learning-backend

# Restart Nginx
sudo systemctl restart nginx

# Restart MySQL
sudo systemctl restart mysql
```

### Update Application

```bash
cd /var/www/chinese-learning-app
git pull
npm install
npm run build

# Restart backend
pm2 restart chinese-learning-backend

# Update frontend
sudo cp -r packages/frontend/dist/* /var/www/html/chinese-learning-app/
```

### Monitor Resources

```bash
# CPU and memory usage
htop

# Disk usage
df -h

# PM2 monitoring
pm2 monit

# Check video processing queue
curl http://localhost:3000/api/video/queue
```

## Performance Optimization

### For t3.small

1. **Enable swap** (if needed):
```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

2. **Optimize MySQL**:
```bash
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf

# Add these settings:
innodb_buffer_pool_size = 512M
max_connections = 50
```

3. **Enable Nginx caching**:
Already configured in deploy.sh

## Troubleshooting

### Backend won't start

```bash
# Check logs
pm2 logs chinese-learning-backend --lines 100

# Check if port 3000 is in use
sudo lsof -i :3000

# Restart
pm2 restart chinese-learning-backend
```

### Video processing fails

```bash
# Check FFmpeg
ffmpeg -version

# Check disk space
df -h

# Check temp directory
ls -lh /var/www/chinese-learning-app/packages/backend/uploads/temp/

# Check logs
pm2 logs chinese-learning-backend | grep VideoProcessor
```

### Database connection fails

```bash
# Check MySQL status
sudo systemctl status mysql

# Test connection
mysql -u chinese_app -p chinese_learning_app

# Check credentials in .env
cat /var/www/chinese-learning-app/packages/backend/.env
```

### Out of memory

```bash
# Check memory usage
free -h

# Add swap (see Performance Optimization above)

# Reduce PM2 instances
pm2 scale chinese-learning-backend 1
```

## Security Recommendations

1. **Enable firewall**:
```bash
sudo ufw enable
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
```

2. **Set up SSL** (Let's Encrypt):
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

3. **Regular updates**:
```bash
sudo apt update && sudo apt upgrade -y
```

4. **Backup database regularly**:
```bash
# Add to crontab
0 2 * * * mysqldump -u chinese_app -p'PASSWORD' chinese_learning_app > /backup/db_$(date +\%Y\%m\%d).sql
```

## Cost Estimation

**t3.small pricing** (us-east-1):
- On-Demand: ~$0.0208/hour = ~$15/month
- 1-year Reserved: ~$10/month
- 3-year Reserved: ~$6/month

**Additional costs:**
- EBS storage (20 GB): ~$2/month
- Data transfer: Varies by usage

**Total estimated cost:** $12-17/month

## Migration Checklist

- [ ] Launch new t3.small instance
- [ ] Run deploy.sh script
- [ ] Import database from old server
- [ ] Transfer processed videos
- [ ] Update DNS (if using domain)
- [ ] Test all features
- [ ] Monitor for 24 hours
- [ ] Decommission old server

## Support

For issues or questions:
1. Check logs: `pm2 logs chinese-learning-backend`
2. Check system resources: `htop`
3. Check disk space: `df -h`
4. Review this guide's Troubleshooting section

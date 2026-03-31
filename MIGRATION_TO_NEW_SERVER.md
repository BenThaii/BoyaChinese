# Migration to New t3.small Server

## Video Processing Test Results ✅

**Test Status:** PASSED
- Backend started successfully with video processor
- Video processor initialized correctly
- API endpoint `/api/video/queue` is working
- FFmpeg is installed and ready

**Test Output:**
```json
{
  "total": 0,
  "queued": 0,
  "processing": 0,
  "completed": 0,
  "failed": 0
}
```

## Can You Use deploy.sh on New Server?

**YES!** The `deploy.sh` file is perfect for deploying to a new t3.small server. Here's what it does:

### What deploy.sh Handles:
✅ Installs Node.js 20.x
✅ Installs MySQL
✅ Installs Nginx
✅ Installs PM2
✅ Configures database
✅ Sets up environment variables
✅ Builds the application
✅ Deploys frontend to Nginx
✅ Starts backend with PM2
✅ Configures firewall
✅ Optional SSL setup with Let's Encrypt

### Additional Step for Video Processing:

The `deploy.sh` script does NOT install FFmpeg. You'll need to add this step:

**Add to deploy.sh after Step 5 (Install PM2):**

```bash
# Step 5.5: Install FFmpeg
print_info "Installing FFmpeg..."
if ! command -v ffmpeg &> /dev/null; then
    sudo apt install -y ffmpeg
    print_success "FFmpeg installed"
else
    print_success "FFmpeg already installed"
fi
```

Or install manually after deployment:
```bash
sudo apt update
sudo apt install -y ffmpeg
```

## Migration Steps

### 1. Prepare New t3.small Instance

**Launch new EC2 instance:**
- Instance type: t3.small
- OS: Ubuntu 24.04 LTS
- Storage: 20 GB (minimum)
- Security Group: Allow ports 22 (SSH), 80 (HTTP), 443 (HTTPS)

### 2. Transfer Your Code

**Option A: From Git (Recommended)**
```bash
# SSH into new server
ssh -i your-key.pem ubuntu@NEW_SERVER_IP

# Clone repository
git clone https://github.com/your-repo/chinese-learning-app.git
cd chinese-learning-app

# Run deployment
chmod +x deploy.sh
./deploy.sh
```

**Option B: From Current Server**
```bash
# On current server, create archive
cd /path/to/chinese-learning-app
tar -czf chinese-app.tar.gz .

# Transfer to new server
scp -i your-key.pem chinese-app.tar.gz ubuntu@NEW_SERVER_IP:~/

# On new server
ssh -i your-key.pem ubuntu@NEW_SERVER_IP
tar -xzf chinese-app.tar.gz
cd chinese-learning-app
chmod +x deploy.sh
./deploy.sh
```

### 3. Install FFmpeg (After deploy.sh)

```bash
sudo apt update
sudo apt install -y ffmpeg

# Verify installation
ffmpeg -version
ffprobe -version
```

### 4. Migrate Database

**Export from old server:**
```bash
# On old server
mysqldump -u root -p chinese_learning_app > db_backup.sql

# Transfer to new server
scp -i your-key.pem db_backup.sql ubuntu@NEW_SERVER_IP:~/
```

**Import to new server:**
```bash
# On new server (after deploy.sh has created the database)
mysql -u chinese_app -p chinese_learning_app < db_backup.sql
```

### 5. Update DNS/IP

If using a domain name, update your DNS records to point to the new server IP.

### 6. Test Everything

```bash
# Check backend status
pm2 status

# Check backend logs
pm2 logs chinese-learning-backend

# Test API
curl http://NEW_SERVER_IP/api/video/queue

# Test frontend
curl http://NEW_SERVER_IP
```

### 7. Verify Video Processing

```bash
# Check FFmpeg
ffmpeg -version

# Check video directories
ls -la /var/www/chinese-learning-app/packages/backend/uploads/

# Test video endpoint
curl http://NEW_SERVER_IP/api/video/queue
```

## Important Notes

### Environment Variables

Make sure to provide these during `deploy.sh`:
- MySQL root password
- MySQL database name (chinese_learning_app)
- MySQL username (chinese_app)
- MySQL password
- Google AI API Key
- Google Translate API Key (add manually to .env after deployment)

### After Deployment

1. **Add Google Translate API Key:**
```bash
cd /var/www/chinese-learning-app/packages/backend
nano .env
# Add: GOOGLE_TRANSLATE_API_KEY=your_key_here
pm2 restart chinese-learning-backend
```

2. **Set up automatic backups:**
```bash
# Add to crontab
crontab -e

# Add this line (daily backup at 2 AM)
0 2 * * * mysqldump -u chinese_app -p'YOUR_PASSWORD' chinese_learning_app > /home/ubuntu/backups/db_$(date +\%Y\%m\%d).sql
```

3. **Monitor resources:**
```bash
# Install htop
sudo apt install htop

# Check resources
htop
df -h
free -h
```

## Cost Comparison

| Instance | vCPUs | RAM | Monthly Cost |
|----------|-------|-----|--------------|
| t2.small | 1 | 2 GB | ~$17 |
| t3.small | 2 | 2 GB | ~$15 |

**Savings:** $2/month + better performance!

## Rollback Plan

If something goes wrong:

1. **Keep old server running** until new server is fully tested
2. **DNS switch back:** Change DNS to old server IP
3. **Database sync:** Export from new, import to old if needed

## Testing Checklist

After migration, test:
- [ ] Frontend loads at http://NEW_SERVER_IP
- [ ] Login works
- [ ] Flashcards load
- [ ] Vocabulary management works
- [ ] Phrases generation works
- [ ] Video processing endpoint responds
- [ ] Database queries work
- [ ] All API endpoints respond

## Support

If you encounter issues:

1. **Check logs:**
```bash
pm2 logs chinese-learning-backend
sudo tail -f /var/log/nginx/error.log
```

2. **Check services:**
```bash
sudo systemctl status nginx
sudo systemctl status mysql
pm2 status
```

3. **Check disk space:**
```bash
df -h
```

4. **Check memory:**
```bash
free -h
```

## Next Steps After Migration

1. **Set up monitoring** (optional):
   - Install CloudWatch agent
   - Set up alerts for CPU/memory

2. **Optimize MySQL** (if needed):
```bash
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
# Add:
# innodb_buffer_pool_size = 512M
# max_connections = 50
sudo systemctl restart mysql
```

3. **Set up automated updates:**
```bash
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```


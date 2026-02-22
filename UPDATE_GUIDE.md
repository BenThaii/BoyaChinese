# Production Update Guide - Pre-Generated Phrases Feature

## What's New
- New pre-generated phrases feature at `/phrases` route
- Automatic sentence generation every 4 hours
- New database table: `pre_generated_sentences`
- Sentence pronunciation button in modal
- Backend scheduler service

## Option 1: Simple Update (Recommended)

The `update.sh` script handles everything automatically. The new database table will be created automatically on first backend startup.

### Steps:

1. **SSH into your production server**
   ```bash
   ssh your-server
   ```

2. **Navigate to app directory**
   ```bash
   cd /var/www/chinese-learning-app
   ```

3. **Run the update script**
   ```bash
   ./update.sh
   ```

4. **Verify the update**
   ```bash
   pm2 logs chinese-learning-backend --lines 50
   ```
   
   Look for these log messages:
   - `Database tables created successfully`
   - `[Scheduler] Phrase generation scheduler started successfully`
   - `Server is running on port 3000`

5. **Test the new feature**
   - Visit: `http://your-domain/phrases`
   - You should see "No vocabulary groups available" initially
   - The scheduler will generate phrases automatically every 4 hours
   - Or manually trigger generation (see below)

### Manual Trigger (Optional)

To generate phrases immediately instead of waiting for the scheduler:

```bash
# Option A: Using curl
curl -X POST http://localhost:3000/api/phrases/generate

# Option B: From browser console (F12)
fetch('/api/phrases/generate', { method: 'POST' })
  .then(r => r.json())
  .then(console.log)
```

## Option 2: Fresh Setup

If you prefer a clean installation or encounter issues:

1. **Backup your database**
   ```bash
   mysqldump -u root -p chinese_learning_app > backup_$(date +%Y%m%d).sql
   ```

2. **Clone the repository to a new location**
   ```bash
   cd /tmp
   git clone https://github.com/your-repo/chinese-learning-app.git
   cd chinese-learning-app
   ```

3. **Run the deployment script**
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

4. **Restore your data** (if needed)
   ```bash
   mysql -u root -p chinese_learning_app < backup_YYYYMMDD.sql
   ```

## Verification Checklist

After updating, verify these items:

- [ ] Backend is running: `pm2 status`
- [ ] No errors in logs: `pm2 logs chinese-learning-backend --lines 50`
- [ ] Frontend loads: Visit `http://your-domain`
- [ ] Phrases page accessible: Visit `http://your-domain/phrases`
- [ ] Database table exists:
  ```bash
  mysql -u root -p -e "USE chinese_learning_app; SHOW TABLES LIKE 'pre_generated_sentences';"
  ```

## Troubleshooting

### Issue: "No vocabulary groups available"

**Cause**: No vocabulary data in database or scheduler hasn't run yet.

**Solution**: 
1. Check if you have vocabulary entries:
   ```bash
   mysql -u root -p -e "USE chinese_learning_app; SELECT COUNT(*) FROM vocabulary_entries;"
   ```
2. If you have vocabulary, manually trigger generation:
   ```bash
   curl -X POST http://localhost:3000/api/phrases/generate
   ```

### Issue: Backend won't start

**Cause**: Possible dependency or build issue.

**Solution**:
```bash
cd /var/www/chinese-learning-app
npm install
npm run build
pm2 restart chinese-learning-backend
pm2 logs chinese-learning-backend
```

### Issue: Scheduler not running

**Cause**: Backend startup issue.

**Solution**: Check logs for scheduler initialization:
```bash
pm2 logs chinese-learning-backend | grep Scheduler
```

You should see:
```
[Scheduler] Initializing phrase generation scheduler...
[Scheduler] Phrase generation scheduler started successfully
```

## Rollback (If Needed)

If you need to rollback to the previous version:

```bash
cd /var/www/chinese-learning-app
git log --oneline -10  # Find the previous commit hash
git checkout <previous-commit-hash>
./update.sh
```

## Notes

- The new `pre_generated_sentences` table is created automatically
- No manual database migrations required
- The scheduler runs every 4 hours automatically
- Existing features are not affected
- The update is backward compatible

## Support

If you encounter issues:
1. Check PM2 logs: `pm2 logs chinese-learning-backend`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Verify database connection in backend logs

# Update Production Server Guide

## Quick Update (Recommended)

If you already have a production server running, follow these steps:

### 1. Commit and push your changes

On your local machine:

```bash
git add -A
git commit -m "Add English translation feature and fix parsing logs"
git push origin main
```

### 2. SSH into your production server

```bash
ssh your-username@your-server-ip
```

### 3. Run the update script

```bash
cd /var/www/chinese-learning-app
chmod +x update.sh
./update.sh
```

The update script will:
- Pull the latest code from git
- Install/update dependencies
- Build the application
- Run database migrations (add english_meaning column)
- Restart the backend
- Deploy the updated frontend
- Reload Nginx

### 4. Verify the update

Check that the backend is running:
```bash
pm2 status
pm2 logs chinese-learning-backend --lines 50
```

Visit your production URL and verify:
- http://your-domain/phrases - English translations should appear
- http://your-domain/ai-test - English translations should appear

---

## Alternative: Fresh Deployment

If the update script doesn't work or you want a clean start:

### 1. Backup your database (important!)

```bash
mysqldump -u your_db_user -p your_db_name > backup_$(date +%Y%m%d).sql
```

### 2. Remove old installation

```bash
pm2 delete chinese-learning-backend
sudo rm -rf /var/www/chinese-learning-app
sudo rm -rf /var/www/html/chinese-learning-app
```

### 3. Clone fresh code

```bash
cd /var/www
sudo git clone https://github.com/your-username/your-repo.git chinese-learning-app
sudo chown -R $USER:$USER chinese-learning-app
cd chinese-learning-app
```

### 4. Run deployment script

```bash
chmod +x deploy.sh
./deploy.sh
```

Follow the prompts to configure your server.

---

## What's New in This Update

### Features Added:
1. **English Translation** - All sentences now have English translations
2. **Rejection Sampling** - AI generates 45 sentences per batch, filters to 30 valid ones
3. **Parsing Logs** - Detailed logs to verify AI returns exactly 45 sentences per batch
4. **Database Migration** - Added `english_meaning` column to `pre_generated_sentences` table

### Files Changed:
- Backend: Translation service integration, API updates
- Frontend: Display English translations on both pages
- Database: New column for English translations

### Performance:
- Batch translation for efficiency
- Rejection sampling improves sentence quality
- Better error handling and logging

---

## Troubleshooting

### Backend not starting
```bash
pm2 logs chinese-learning-backend
```
Check for errors in the logs.

### Database migration failed
Manually run the migration:
```bash
cd /var/www/chinese-learning-app
mysql -u your_db_user -p your_db_name < packages/backend/database/add_english_meaning_column.sql
```

### Frontend not updating
Clear browser cache or hard refresh (Ctrl+Shift+R)

### Need to regenerate sentences
The old sentences don't have English translations. To regenerate:
```bash
# SSH into server
cd /var/www/chinese-learning-app/packages/backend
npx tsx scripts/clear-sentences.ts
# Then trigger generation via the API or wait for cron job
```

---

## Rollback (if needed)

If something goes wrong:

```bash
cd /var/www/chinese-learning-app
git log --oneline  # Find the previous commit hash
git checkout <previous-commit-hash>
./update.sh
```

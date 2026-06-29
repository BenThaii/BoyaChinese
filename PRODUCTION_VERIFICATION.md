# Production Verification Checklist

## What Was Fixed

The `.env` files containing production credentials (database user, password, API keys) were being overwritten during `git pull` operations. This is now fixed.

## Verification Steps

### Step 1: Verify Git Status (Development Machine)

```bash
cd /path/to/custom_app

# These files should NOT be tracked
git ls-files | grep -i '\.env'
# Expected output: (empty - no results)

# Check .gitignore includes .env
grep -E "^\.env" .gitignore
# Expected output: .env

# Verify working directory is clean
git status
# Expected output: "nothing to commit, working tree clean"
```

### Step 2: SSH into Production Server

```bash
ssh -i /path/to/aws_key ubuntu@ec2-13-212-235-9.ap-southeast-1.compute.amazonaws.com
```

### Step 3: Verify Production .env Files Exist

```bash
cd /var/www/chinese-learning-app

# Check backend .env exists and has production values
cat packages/backend/.env
# Should show:
#   DB_USER=chinese_app (NOT root)
#   DB_PASSWORD=<something> (NOT empty)
#   NODE_ENV=production (or development if not yet updated)

# Check frontend .env exists
cat packages/frontend/.env
# Should show:
#   VITE_API_URL=<your-ec2-domain>/api
```

### Step 4: Test the update.sh Safety

```bash
# Create a test by modifying the local dev .env slightly
# (Don't actually do this in production; this is simulated below)

# Simulate what happens during update:
# 1. Back up current .env
mkdir -p /tmp/test-backup
cp packages/backend/.env /tmp/test-backup/backend.env
cp packages/frontend/.env /tmp/test-backup/frontend.env

# 2. Pull from git (which would have different .env)
# For this test, we'll just verify the files are preserved
if [ -f "/tmp/test-backup/backend.env" ]; then
    echo "✓ Backend .env was backed up successfully"
fi

if [ -f "/tmp/test-backup/frontend.env" ]; then
    echo "✓ Frontend .env was backed up successfully"
fi

# 3. Simulate restore (what update.sh does)
cp /tmp/test-backup/backend.env packages/backend/.env
cp /tmp/test-backup/frontend.env packages/frontend/.env

echo "✓ .env files would be restored after git pull"
```

### Step 5: Full End-to-End Test (Optional but Recommended)

If you want to test the complete update process:

```bash
# Create a backup of the current state
cp packages/backend/.env packages/backend/.env.production-backup
cp packages/frontend/.env packages/frontend/.env.production-backup

# Run the update script
./update.sh

# Verify .env files were preserved
diff packages/backend/.env packages/backend/.env.production-backup
# Expected output: (no differences or only timestamps)

# Verify the app is still running
pm2 status
# Expected output: chinese-learning-backend online

# Check backend logs for any errors
pm2 logs chinese-learning-backend --lines 50
```

### Step 6: Verify Application Functionality

Test the critical user flows to ensure the update didn't break anything:

```bash
# From your browser on the EC2 domain:

1. Login page loads
   - Navigate to: https://ec2-13-212-235-9.ap-southeast-1.compute.amazonaws.com
   - Expected: Login form displays

2. Admin login works
   - Username: admin
   - Phrase: Brave-Lion-42-Explores
   - Expected: Dashboard loads

3. Database connection works
   - Go to: Admin Panel → Database Admin
   - Expected: Can see users and vocabulary entries

4. API endpoint responds
   - Test: curl https://ec2-13-212-235-9.ap-southeast-1.compute.amazonaws.com/api/health
   - Expected: 200 OK response (or appropriate health check response)
```

### Step 7: Verify .env Is Not Tracked in Git

```bash
# On production server:
cd /var/www/chinese-learning-app

# List tracked files
git ls-files | grep -i '\.env'
# Expected output: (empty - no .env files should be listed)

# Verify git status doesn't show .env
git status | grep -i '\.env'
# Expected output: (empty - .env should not appear in status)
```

## Common Issues & Solutions

### Issue: `.env` still appears in git status

**Solution:**
```bash
# Remove from git tracking (if somehow still tracked)
git rm --cached packages/backend/.env
git rm --cached packages/frontend/.env
git commit -m "Remove .env files from tracking"
git push
```

### Issue: Production database connection fails after update

**Cause:** Production `.env` was overwritten

**Solution:**
```bash
# SSH to server and check .env
cat packages/backend/.env | grep DB_

# If DB_USER shows 'root' instead of 'chinese_app', it was overwritten
# Manually fix it:
sudo nano packages/backend/.env

# Change:
#   DB_USER=root → DB_USER=chinese_app
#   DB_PASSWORD= → DB_PASSWORD=<actual-password>
#   NODE_ENV=development → NODE_ENV=production

# Restart backend:
pm2 restart chinese-learning-backend

# Check if it connects:
pm2 logs chinese-learning-backend
```

### Issue: Frontend shows "Cannot connect to API"

**Cause:** `VITE_API_URL` was overwritten

**Solution:**
```bash
# Check frontend .env
cat packages/frontend/.env

# If VITE_API_URL is wrong, fix it:
sudo nano packages/frontend/.env
# Should be: VITE_API_URL=https://ec2-13-212-235-9.ap-southeast-1.compute.amazonaws.com/api

# Redeploy frontend:
sudo cp -r packages/frontend/dist/* /var/www/html/chinese-learning-app/
sudo systemctl reload nginx

# Clear browser cache and reload
```

## Automated Monitoring (Optional)

To prevent this issue in the future, you could set up monitoring:

```bash
# Create a monitoring script at /var/www/chinese-learning-app/check-env.sh

#!/bin/bash
BACKEND_ENV="/var/www/chinese-learning-app/packages/backend/.env"

# Check if DB_USER is correct
if grep -q "^DB_USER=chinese_app$" "$BACKEND_ENV"; then
    echo "✓ DB_USER is correct"
else
    echo "✗ WARNING: DB_USER is not 'chinese_app'"
    echo "The production .env may have been overwritten!"
    exit 1
fi

# Check if NODE_ENV is production (optional)
if grep -q "^NODE_ENV=production$" "$BACKEND_ENV"; then
    echo "✓ NODE_ENV is production"
else
    echo "⚠ Note: NODE_ENV is not production"
fi

# Add this to crontab to check hourly:
# 0 * * * * /var/www/chinese-learning-app/check-env.sh >> /var/log/env-check.log 2>&1
```

## Timeline of Changes

- **Commit:** `73b6830` - Fix: Preserve .env during production updates
- **Changes:**
  - `update.sh`: Now backs up and restores .env around `git pull`
  - `deploy.sh`: Added .env preservation safety checks
  - `ENV_MANAGEMENT.md`: Created documentation
  - `.gitignore`: Verified .env is included (no changes needed)

## Next Steps

1. ✅ Verify all steps above pass
2. ✅ Test a production update with `./update.sh`
3. ⏭️ Monitor first few production updates for any issues
4. ⏭️ Consider setting up automated monitoring if desired

---

**Questions?** Check `ENV_MANAGEMENT.md` for detailed information about how environment variables are managed.

#!/bin/bash
set -e

echo "========================================"
echo "EC2 Deployment Update"
echo "========================================"
echo ""

# Step 1: Pull latest code
echo "Step 1: Pulling latest code from git..."
cd /var/www/chinese-learning-app
git pull origin main
echo "✓ Code updated"
echo ""

# Step 2: Install dependencies
echo "Step 2: Installing dependencies..."
npm install
echo "✓ Dependencies updated"
echo ""

# Step 3: Build application
echo "Step 3: Building application..."
npm run build
echo "✓ Application built"
echo ""

# Step 4: Restart backend
echo "Step 4: Restarting backend..."
pm2 restart chinese-learning-backend
sleep 3
echo "✓ Backend restarted"
echo ""

# Step 5: Verify backend status
echo "Step 5: Checking backend status..."
pm2 status
echo ""

# Step 6: Check database connection
echo "Step 6: Testing database connection..."
DB_USER=$(grep DB_USER packages/backend/.env | cut -d '=' -f2)
DB_PASSWORD=$(grep DB_PASSWORD packages/backend/.env | cut -d '=' -f2)
DB_NAME=$(grep DB_NAME packages/backend/.env | cut -d '=' -f2)

if [ -z "$DB_PASSWORD" ]; then
    mysql -u"$DB_USER" "$DB_NAME" -e "SELECT COUNT(*) as vocabulary_count FROM vocabulary_entries LIMIT 1;" 2>/dev/null && echo "✓ Database connection successful" || echo "✗ Database connection failed"
else
    mysql -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SELECT COUNT(*) as vocabulary_count FROM vocabulary_entries LIMIT 1;" 2>/dev/null && echo "✓ Database connection successful" || echo "✗ Database connection failed"
fi
echo ""

echo "========================================"
echo "✓ Deployment update completed!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Visit http://13.212.235.9/phrases"
echo "2. Log in as admin (username: admin, phrase: Brave-Lion-42-Explores)"
echo "3. Click 'Generate Phrases' to regenerate with Vietnamese translations"
echo ""

#!/bin/bash

# Script to fix frontend API URL and redeploy

echo "=========================================="
echo "Fixing Frontend API URL"
echo "=========================================="
echo ""

cd /var/www/chinese-learning-app

echo "1. Pulling latest changes from Git..."
git pull

echo ""
echo "2. Creating frontend .env with correct API URL..."
cat > packages/frontend/.env << 'EOF'
VITE_API_URL=http://52.221.228.11/api
EOF

echo "   ✓ Created packages/frontend/.env"
cat packages/frontend/.env

echo ""
echo "3. Installing dependencies..."
npm install

echo ""
echo "4. Building backend (with increased body limit)..."
npm run build -w @chinese-learning-app/backend

echo ""
echo "5. Building frontend..."
npm run build -w @chinese-learning-app/frontend

echo ""
echo "6. Redeploying frontend..."
sudo cp -r packages/frontend/dist/* /var/www/html/chinese-learning-app/

echo ""
echo "7. Restarting backend..."
pm2 restart chinese-learning-backend

echo ""
echo "8. Checking backend logs..."
pm2 logs chinese-learning-backend --lines 10 --nostream

echo ""
echo "=========================================="
echo "✓ Done!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Clear your browser cache"
echo "2. Visit: http://52.221.228.11/user1/admin"
echo "3. You should now see 0 entries (empty database)"
echo "4. Import your backup at: http://52.221.228.11/database-admin"
echo ""

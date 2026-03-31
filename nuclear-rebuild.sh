#!/bin/bash

echo "=========================================="
echo "Nuclear Option: Complete Clean Rebuild"
echo "=========================================="
echo ""

cd /var/www/chinese-learning-app

echo "1. Stopping backend..."
pm2 stop chinese-learning-backend

echo ""
echo "2. Deleting ALL build artifacts..."
rm -rf packages/frontend/dist/
rm -rf packages/frontend/node_modules/.vite/
rm -rf packages/frontend/.vite/
rm -rf node_modules/.vite/

echo ""
echo "3. Verifying .env file..."
cat packages/frontend/.env

echo ""
echo "4. Reinstalling dependencies..."
cd packages/frontend
npm install

echo ""
echo "5. Building with clean slate..."
npm run build

echo ""
echo "6. Verifying built files..."
echo "   Checking for NEW API URL (52.221.228.11):"
grep -r "52.221.228.11" dist/ && echo "   ✓ NEW API URL FOUND!" || echo "   ✗ NEW API URL NOT FOUND!"

echo ""
echo "   Checking for OLD API URL (3.1.217.161):"
grep -r "3.1.217.161" dist/ && echo "   ✗ OLD API URL STILL PRESENT!" || echo "   ✓ OLD API URL REMOVED!"

echo ""
echo "7. Deploying to Nginx..."
cd /var/www/chinese-learning-app
sudo rm -rf /var/www/html/chinese-learning-app/*
sudo cp -r packages/frontend/dist/* /var/www/html/chinese-learning-app/

echo ""
echo "8. Restarting services..."
pm2 restart chinese-learning-backend
sudo systemctl reload nginx

echo ""
echo "=========================================="
echo "✓ Complete!"
echo "=========================================="
echo ""
echo "IMPORTANT: Clear browser cache completely!"
echo "1. Press Ctrl+Shift+Delete"
echo "2. Select 'Cached images and files'"
echo "3. Click 'Clear data'"
echo "4. Or open in incognito/private window"
echo ""

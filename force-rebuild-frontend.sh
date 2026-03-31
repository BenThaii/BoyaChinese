#!/bin/bash

echo "=========================================="
echo "Force Clean Rebuild of Frontend"
echo "=========================================="
echo ""

cd /var/www/chinese-learning-app/packages/frontend

echo "1. Cleaning old build..."
rm -rf dist/
rm -rf node_modules/.vite/

echo ""
echo "2. Verifying .env file..."
cat .env

echo ""
echo "3. Building frontend with clean cache..."
npm run build

echo ""
echo "4. Checking built files for API URL..."
echo "   Looking for 52.221.228.11 in built files:"
grep -r "52.221.228.11" dist/ || echo "   WARNING: New API URL not found!"
echo ""
echo "   Looking for old server 3.1.217.161:"
grep -r "3.1.217.161" dist/ && echo "   ERROR: Old API URL still present!" || echo "   ✓ Old API URL not found"

echo ""
echo "5. Deploying to Nginx..."
sudo cp -r dist/* /var/www/html/chinese-learning-app/

echo ""
echo "6. Clearing Nginx cache..."
sudo systemctl reload nginx

echo ""
echo "=========================================="
echo "✓ Done!"
echo "=========================================="
echo ""
echo "Hard refresh your browser: Ctrl+Shift+R or Ctrl+F5"
echo "Or open in incognito/private window"
echo ""

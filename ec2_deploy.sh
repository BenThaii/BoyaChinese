#!/bin/bash
set -e

cd /var/www/chinese-learning-app

echo "=================================================="
echo "Step 1: Pulling latest code from main branch"
echo "=================================================="
git pull origin main

echo ""
echo "=================================================="
echo "Step 2: Building backend TypeScript"
echo "=================================================="
cd packages/backend
npm run build
cd ../..

echo ""
echo "=================================================="
echo "Step 3: Restarting backend with PM2"
echo "=================================================="
pm2 restart backend --no-autorestart

sleep 5

echo ""
echo "=================================================="
echo "Step 4: Checking backend status"
echo "=================================================="
pm2 status backend

echo ""
echo "=================================================="
echo "Step 5: Last 60 backend logs"
echo "=================================================="
pm2 logs backend --lines 60 --nostream

echo ""
echo "=================================================="
echo "Deployment Complete!"
echo "=================================================="
echo ""
echo "Testing phrase generation endpoint..."
echo ""

# Try to check if backend is responding
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/auth/verify 2>/dev/null || echo "000")
echo "Backend health check: HTTP $HEALTH_CHECK"
echo ""
echo "If status is 200 or 401, backend is working."
echo "Go to http://13.212.235.9/phrases and click 'Refresh Phrases' to test."
echo ""

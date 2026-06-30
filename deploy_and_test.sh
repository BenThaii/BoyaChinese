#!/bin/bash

set -e

echo "=========================================="
echo "Deploying to EC2 and Testing Phrase Generation"
echo "=========================================="

cd /var/www/chinese-learning-app

echo ""
echo "[1/5] Pulling latest code..."
git pull origin main
echo "✓ Code pulled"

echo ""
echo "[2/5] Building backend..."
cd packages/backend
npm run build
cd ../..
echo "✓ Backend built"

echo ""
echo "[3/5] Restarting backend with PM2..."
pm2 restart backend --no-autorestart
sleep 3
echo "✓ Backend restarted"

echo ""
echo "[4/5] Checking backend status..."
pm2 status backend || true
echo ""

echo "[5/5] Recent backend logs (last 50 lines)..."
pm2 logs backend --lines 50 --nostream || echo "No logs available yet"

echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""
echo "Testing phrase generation..."
echo ""

# Get the auth token
echo "Getting auth token..."
AUTH_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/verify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test" 2>/dev/null || echo '{"error":"connection failed"}')

echo "Auth response: $AUTH_RESPONSE"
echo ""

# Try to trigger phrase generation
echo "Triggering phrase generation..."
GENERATE_RESPONSE=$(curl -s -X POST http://localhost:3000/api/phrases/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MjU1OTEwMDB9.dummy" \
  2>/dev/null || echo '{"error":"connection failed"}')

echo "Generate response:"
echo "$GENERATE_RESPONSE" | head -c 500
echo ""
echo ""

echo "=========================================="
echo "Testing Summary:"
echo "=========================================="
echo "✓ Code deployed"
echo "✓ Backend restarted"
echo ""
echo "Next steps:"
echo "1. Check the logs above for any translation errors"
echo "2. Go to http://13.212.235.9/phrases"
echo "3. Click 'Refresh Phrases' button"
echo "4. Check if generation succeeds"
echo ""

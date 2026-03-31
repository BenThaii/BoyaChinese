#!/bin/bash

# Script to fix the 413 error for database imports

echo "=========================================="
echo "Fixing Database Import Size Limit"
echo "=========================================="
echo ""

cd /var/www/chinese-learning-app

echo "1. Pulling latest changes..."
git pull

echo ""
echo "2. Installing dependencies..."
npm install

echo ""
echo "3. Building backend..."
npm run build -w @chinese-learning-app/backend

echo ""
echo "4. Restarting backend..."
pm2 restart chinese-learning-backend

echo ""
echo "5. Checking backend status..."
pm2 logs chinese-learning-backend --lines 20

echo ""
echo "=========================================="
echo "✓ Done! Try importing your backup again at:"
echo "  http://52.221.228.11/database-admin"
echo "=========================================="

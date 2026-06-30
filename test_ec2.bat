@echo off
setlocal enabledelayedexpansion

set KEY_PATH=D:\Google Drive\ketoanvamtgt@gmail.com\VAM\00_management\aws_migration\bitrix_gt_keypair\bitrix_gt_keypair.ppk
set HOST=ec2-13-212-235-9.ap-southeast-1.compute.amazonaws.com

echo ========================================
echo Checking current EC2 Git status
echo ========================================
plink -i "%KEY_PATH%" ubuntu@%HOST% -batch "cd /var/www/chinese-learning-app && git log --oneline -5"

echo.
echo ========================================
echo Pulling latest code
echo ========================================
plink -i "%KEY_PATH%" ubuntu@%HOST% -batch "cd /var/www/chinese-learning-app && git pull origin main"

echo.
echo ========================================
echo Building backend
echo ========================================
plink -i "%KEY_PATH%" ubuntu@%HOST% -batch "cd /var/www/chinese-learning-app/packages/backend && npm run build"

echo.
echo ========================================
echo Restarting backend
echo ========================================
plink -i "%KEY_PATH%" ubuntu@%HOST% -batch "pm2 restart backend"

echo.
echo ========================================
echo Waiting 5 seconds...
echo ========================================
timeout /t 5

echo.
echo ========================================
echo Backend status
echo ========================================
plink -i "%KEY_PATH%" ubuntu@%HOST% -batch "pm2 status backend"

echo.
echo ========================================
echo Recent backend logs (last 80 lines)
echo ========================================
plink -i "%KEY_PATH%" ubuntu@%HOST% -batch "pm2 logs backend --lines 80 --nostream"

echo.
echo ========================================
echo TESTING PHRASE GENERATION ENDPOINT
echo ========================================
echo Making test call to /phrases/vocab-groups...
echo.
plink -i "%KEY_PATH%" ubuntu@%HOST% -batch "curl -s http://localhost:3000/api/phrases/vocab-groups -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MjU1OTEwMDB9.dummy' | head -c 300"

echo.
echo ========================================
echo Test complete!
echo ========================================

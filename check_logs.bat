@echo off
setlocal enabledelayedexpansion

set KEY_PATH=D:\Google Drive\ketoanvamtgt@gmail.com\VAM\00_management\aws_migration\bitrix_gt_keypair\bitrix_gt_keypair.ppk
set HOST=ec2-13-212-235-9.ap-southeast-1.compute.amazonaws.com

echo ========================================
echo Backend logs for Translation Service
echo ========================================
plink -i "%KEY_PATH%" ubuntu@%HOST% -batch "pm2 logs backend --lines 150 --nostream" 2>&1 | findstr /C:"Translation" /C:"Error" /C:"[AI" /C:"[Phrase"

echo.
echo ========================================
echo Full recent logs (last 30 lines)
echo ========================================
plink -i "%KEY_PATH%" ubuntu@%HOST% -batch "pm2 logs backend --lines 30 --nostream 2>&1"

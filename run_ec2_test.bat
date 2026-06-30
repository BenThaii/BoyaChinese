@echo off
setlocal enabledelayedexpansion

set KEY_PATH=D:\Google Drive\ketoanvamtgt@gmail.com\VAM\00_management\aws_migration\bitrix_gt_keypair\bitrix_gt_keypair.ppk
set HOST=ec2-13-212-235-9.ap-southeast-1.compute.amazonaws.com

echo Running endpoint tests on EC2...
echo.

plink -i "%KEY_PATH%" ubuntu@%HOST% -batch "cd /var/www/chinese-learning-app && bash test_phrase_gen_ec2.sh"

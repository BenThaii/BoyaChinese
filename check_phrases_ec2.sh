#!/bin/bash

echo "========================================"
echo "Checking Phrases on EC2"
echo "========================================"
echo ""

cd /var/www/chinese-learning-app

# Get credentials from .env
DB_USER=$(grep "^DB_USER=" packages/backend/.env | cut -d '=' -f2)
DB_PASSWORD=$(grep "^DB_PASSWORD=" packages/backend/.env | cut -d '=' -f2)
DB_NAME=$(grep "^DB_NAME=" packages/backend/.env | cut -d '=' -f2)

echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo ""

# Get admin ID
ADMIN_ID=$(mysql -u"$DB_USER" "$DB_NAME" -N -e "SELECT id FROM auth_users WHERE username='admin' LIMIT 1;")
echo "Admin user ID: $ADMIN_ID"
echo ""

# Check phrase counts
echo "Total phrases for admin: $(mysql -u"$DB_USER" "$DB_NAME" -N -e "SELECT COUNT(*) FROM pre_generated_sentences WHERE user_id=$ADMIN_ID;")"
echo "Phrases with Vietnamese: $(mysql -u"$DB_USER" "$DB_NAME" -N -e "SELECT COUNT(*) FROM pre_generated_sentences WHERE user_id=$ADMIN_ID AND modern_vietnamese IS NOT NULL AND modern_vietnamese != '';")"
echo "Phrases with English: $(mysql -u"$DB_USER" "$DB_NAME" -N -e "SELECT COUNT(*) FROM pre_generated_sentences WHERE user_id=$ADMIN_ID AND english_meaning IS NOT NULL AND english_meaning != '';")"
echo "Phrases with Pinyin: $(mysql -u"$DB_USER" "$DB_NAME" -N -e "SELECT COUNT(*) FROM pre_generated_sentences WHERE user_id=$ADMIN_ID AND pinyin IS NOT NULL AND pinyin != '' AND pinyin NOT LIKE '[Mock%';")"
echo ""

echo "Sample phrases:"
mysql -u"$DB_USER" "$DB_NAME" -e "SELECT chinese_text, pinyin, english_meaning, modern_vietnamese FROM pre_generated_sentences WHERE user_id=$ADMIN_ID LIMIT 3\G"

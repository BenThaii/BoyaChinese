#!/bin/bash

# Script to check database connection details on production server

echo "=========================================="
echo "Database Connection Check"
echo "=========================================="
echo ""

# Check .env file
echo "1. Checking .env file:"
if [ -f "/var/www/chinese-learning-app/packages/backend/.env" ]; then
    echo "   DB_HOST: $(grep DB_HOST /var/www/chinese-learning-app/packages/backend/.env | cut -d '=' -f2)"
    echo "   DB_NAME: $(grep DB_NAME /var/www/chinese-learning-app/packages/backend/.env | cut -d '=' -f2)"
    echo "   DB_USER: $(grep DB_USER /var/www/chinese-learning-app/packages/backend/.env | cut -d '=' -f2)"
else
    echo "   .env file not found!"
fi

echo ""
echo "2. Checking if MySQL is running locally:"
if systemctl is-active --quiet mysql; then
    echo "   ✓ MySQL is running on this server"
else
    echo "   ✗ MySQL is not running on this server"
fi

echo ""
echo "3. Checking vocabulary entries count:"
DB_HOST=$(grep DB_HOST /var/www/chinese-learning-app/packages/backend/.env | cut -d '=' -f2)
DB_USER=$(grep DB_USER /var/www/chinese-learning-app/packages/backend/.env | cut -d '=' -f2)
DB_PASSWORD=$(grep DB_PASSWORD /var/www/chinese-learning-app/packages/backend/.env | cut -d '=' -f2)
DB_NAME=$(grep DB_NAME /var/www/chinese-learning-app/packages/backend/.env | cut -d '=' -f2)

if [ -n "$DB_HOST" ] && [ -n "$DB_USER" ] && [ -n "$DB_NAME" ]; then
    COUNT=$(mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -se "SELECT COUNT(*) FROM vocabulary_entries;" 2>/dev/null)
    if [ $? -eq 0 ]; then
        echo "   Total vocabulary entries: $COUNT"
        
        # Get sample entry
        echo ""
        echo "4. Sample vocabulary entry:"
        mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SELECT chinese_character, pinyin, username, chapter FROM vocabulary_entries LIMIT 1;" 2>/dev/null
    else
        echo "   Failed to connect to database"
    fi
else
    echo "   Missing database credentials in .env"
fi

echo ""
echo "5. Checking if database is on old server:"
echo "   If DB_HOST is an IP address (not 'localhost'), you're using a remote database"
echo ""

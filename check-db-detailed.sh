#!/bin/bash

# More detailed database check

echo "=========================================="
echo "Detailed Database Check"
echo "=========================================="
echo ""

cd /var/www/chinese-learning-app/packages/backend

# Source the .env file
export $(grep -v '^#' .env | xargs)

echo "1. Database Configuration:"
echo "   DB_HOST: $DB_HOST"
echo "   DB_NAME: $DB_NAME"
echo "   DB_USER: $DB_USER"
echo ""

echo "2. Checking vocabulary_entries table:"
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "
SELECT 
    COUNT(*) as total_entries,
    COUNT(DISTINCT username) as total_users,
    MIN(chapter) as min_chapter,
    MAX(chapter) as max_chapter
FROM vocabulary_entries;
"

echo ""
echo "3. Entries by user:"
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "
SELECT username, COUNT(*) as entries
FROM vocabulary_entries
GROUP BY username;
"

echo ""
echo "4. Sample entries:"
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "
SELECT chinese_character, pinyin, username, chapter, chapter_label
FROM vocabulary_entries
LIMIT 5;
"

echo ""
echo "5. All tables in database:"
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SHOW TABLES;"

echo ""

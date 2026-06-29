#!/bin/bash

echo "========================================"
echo "Phrase Generation Retry - EC2"
echo "========================================"
echo ""

cd /var/www/chinese-learning-app

# Get credentials
DB_USER=$(grep "^DB_USER=" packages/backend/.env | cut -d '=' -f2)
DB_NAME=$(grep "^DB_NAME=" packages/backend/.env | cut -d '=' -f2)

echo "Checking backend status..."
pm2 status | grep chinese-learning-backend
echo ""

# Get admin ID
ADMIN_ID=$(mysql -u"$DB_USER" "$DB_NAME" -N -e "SELECT id FROM auth_users WHERE username='admin' LIMIT 1;")
echo "Admin ID: $ADMIN_ID"
echo ""

# Check current state
TOTAL=$(mysql -u"$DB_USER" "$DB_NAME" -N -e "SELECT COUNT(*) FROM pre_generated_sentences WHERE user_id=$ADMIN_ID;")
VIETNAMESE=$(mysql -u"$DB_USER" "$DB_NAME" -N -e "SELECT COUNT(*) FROM pre_generated_sentences WHERE user_id=$ADMIN_ID AND modern_vietnamese IS NOT NULL AND modern_vietnamese != '';")
ENGLISH=$(mysql -u"$DB_USER" "$DB_NAME" -N -e "SELECT COUNT(*) FROM pre_generated_sentences WHERE user_id=$ADMIN_ID AND english_meaning IS NOT NULL AND english_meaning != '';")

echo "Current phrase status:"
echo "  Total phrases: $TOTAL"
echo "  With Vietnamese: $VIETNAMESE"
echo "  With English: $ENGLISH"
echo ""

if [ "$VIETNAMESE" -gt 0 ]; then
    echo "✓ Vietnamese translations are already populated!"
    echo ""
    echo "Sample Vietnamese phrases:"
    mysql -u"$DB_USER" "$DB_NAME" -e "
    SELECT 
        chinese_text as Chinese,
        english_meaning as English, 
        modern_vietnamese as Vietnamese
    FROM pre_generated_sentences 
    WHERE user_id=$ADMIN_ID AND modern_vietnamese IS NOT NULL 
    LIMIT 5\G
    "
else
    echo "⚠ No Vietnamese translations yet."
    echo ""
    echo "Recent backend logs:"
    pm2 logs chinese-learning-backend --lines 20 | grep -A2 -B2 "503\|Service Unavailable\|API" | head -30
    echo ""
    echo "Note: The Google Gemini API is currently experiencing high demand (503 errors)."
    echo "The system automatically fell back to mock data for phrases."
    echo ""
    echo "Options to fix this:"
    echo ""
    echo "1. Wait for Google API to recover, then manually trigger regeneration:"
    echo "   - Visit http://13.212.235.9/phrases"
    echo "   - Log in as admin (username: admin)"
    echo "   - Click 'Generate Phrases' button"
    echo ""
    echo "2. Or use alternative AI model by updating admin panel:"
    echo "   - Visit http://13.212.235.9/admin"
    echo "   - Go to 'Database Admin' → 'AI Model Config'"
    echo "   - Change to a different available model"
    echo ""
    echo "3. Or check if API is working by running:"
    echo "   curl -s 'https://generativelanguage.googleapis.com/v1/models/gemini-flash-latest:generateContent' \\"
    echo "     -H 'Content-Type: application/json' \\"
    echo "     -H 'x-goog-api-key: YOUR_API_KEY' \\"
    echo "     -d '{\"contents\": [{\"parts\": [{\"text\": \"test\"}]}]}'"
fi

echo ""
echo "========================================"

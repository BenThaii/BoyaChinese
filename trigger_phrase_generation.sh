#!/bin/bash

echo "========================================"
echo "Triggering Phrase Generation on EC2"
echo "========================================"
echo ""

# Get database credentials
cd /var/www/chinese-learning-app
DB_USER=$(grep DB_USER packages/backend/.env | cut -d '=' -f2)
DB_PASSWORD=$(grep DB_PASSWORD packages/backend/.env | cut -d '=' -f2)
DB_NAME=$(grep DB_NAME packages/backend/.env | cut -d '=' -f2)

# Build MySQL command
if [ -z "$DB_PASSWORD" ]; then
    MYSQL_CMD="mysql -u$DB_USER"
else
    MYSQL_CMD="mysql -u$DB_USER -p$DB_PASSWORD"
fi

echo "Step 1: Checking admin user exists..."
ADMIN_EXISTS=$($MYSQL_CMD "$DB_NAME" -se "SELECT COUNT(*) FROM auth_users WHERE username='admin' AND role='admin'" 2>/dev/null)

if [ "$ADMIN_EXISTS" -eq 0 ]; then
    echo "✗ Admin user not found. Please create admin user first."
    exit 1
fi
echo "✓ Admin user found"
echo ""

echo "Step 2: Getting admin user ID..."
ADMIN_ID=$($MYSQL_CMD "$DB_NAME" -se "SELECT id FROM auth_users WHERE username='admin' AND role='admin' LIMIT 1" 2>/dev/null)
echo "✓ Admin user ID: $ADMIN_ID"
echo ""

echo "Step 3: Checking current phrases in database..."
PHRASE_COUNT=$($MYSQL_CMD "$DB_NAME" -se "SELECT COUNT(*) FROM pre_generated_sentences WHERE user_id=$ADMIN_ID" 2>/dev/null || echo "0")
echo "Current phrases for admin: $PHRASE_COUNT"
echo ""

echo "Step 4: Checking for Vietnamese translations..."
VIETNAMESE_COUNT=$($MYSQL_CMD "$DB_NAME" -se "SELECT COUNT(*) FROM pre_generated_sentences WHERE user_id=$ADMIN_ID AND modern_vietnamese IS NOT NULL AND modern_vietnamese != ''" 2>/dev/null || echo "0")
echo "Phrases with Vietnamese translations: $VIETNAMESE_COUNT"
echo ""

if [ "$VIETNAMESE_COUNT" -gt 0 ]; then
    echo "✓ Vietnamese translations already present!"
    echo ""
    echo "Sample Vietnamese translations:"
    $MYSQL_CMD "$DB_NAME" -se "SELECT chinese_text, modern_vietnamese FROM pre_generated_sentences WHERE user_id=$ADMIN_ID AND modern_vietnamese IS NOT NULL LIMIT 3" 2>/dev/null | while read line; do
        echo "  $line"
    done
else
    echo "⚠ No Vietnamese translations found. Triggering generation..."
    echo ""
    echo "Step 5: Making API call to generate phrases..."
    
    # Get JWT token for admin user
    echo "Generating admin JWT token..."
    JWT_TOKEN=$(node -e "
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
        { userId: $ADMIN_ID, username: 'admin', role: 'admin' },
        'your-super-secret-key-change-in-production-12345',
        { expiresIn: '24h' }
    );
    console.log(token);
    " 2>/dev/null)
    
    if [ -z "\$JWT_TOKEN" ]; then
        echo "✗ Failed to generate JWT token"
        exit 1
    fi
    
    echo "✓ JWT token generated"
    echo ""
    echo "Calling phrase generation endpoint..."
    
    # Call the generation endpoint
    RESPONSE=$(curl -s -X POST http://localhost:3000/api/phrases/generate \
        -H "Authorization: Bearer $JWT_TOKEN" \
        -H "Content-Type: application/json" \
        -w "\n%{http_code}")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)
    
    echo "Response code: $HTTP_CODE"
    echo "Response body: $BODY"
    
    if [ "$HTTP_CODE" -eq 200 ]; then
        echo "✓ Phrase generation completed!"
        sleep 2
        
        echo ""
        echo "Step 6: Checking Vietnamese translations after generation..."
        VIETNAMESE_COUNT=$($MYSQL_CMD "$DB_NAME" -se "SELECT COUNT(*) FROM pre_generated_sentences WHERE user_id=$ADMIN_ID AND modern_vietnamese IS NOT NULL AND modern_vietnamese != ''" 2>/dev/null || echo "0")
        echo "Phrases with Vietnamese translations: $VIETNAMESE_COUNT"
        
        if [ "$VIETNAMESE_COUNT" -gt 0 ]; then
            echo "✓ Vietnamese translations successfully generated!"
            echo ""
            echo "Sample Vietnamese translations:"
            $MYSQL_CMD "$DB_NAME" -se "SELECT chinese_text, modern_vietnamese FROM pre_generated_sentences WHERE user_id=$ADMIN_ID AND modern_vietnamese IS NOT NULL LIMIT 3" 2>/dev/null | while read line; do
                echo "  $line"
            done
        fi
    else
        echo "✗ Phrase generation failed with code $HTTP_CODE"
        exit 1
    fi
fi

echo ""
echo "========================================"
echo "✓ Phrase generation check completed!"
echo "========================================"
echo ""
echo "Next: Visit http://13.212.235.9/phrases to see the Vietnamese translations"

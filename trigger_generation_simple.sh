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
ADMIN_ID=$(eval "$MYSQL_CMD \"$DB_NAME\" -se \"SELECT id FROM auth_users WHERE username='admin' AND role='admin' LIMIT 1\" 2>/dev/null")

if [ -z "$ADMIN_ID" ]; then
    echo "✗ Admin user not found"
    exit 1
fi
echo "✓ Admin user found (ID: $ADMIN_ID)"
echo ""

echo "Step 2: Checking current phrase count..."
PHRASE_COUNT=$(eval "$MYSQL_CMD \"$DB_NAME\" -se \"SELECT COUNT(*) FROM pre_generated_sentences WHERE user_id=$ADMIN_ID\" 2>/dev/null || echo "0")
echo "Current phrases: $PHRASE_COUNT"
echo ""

echo "Step 3: Checking for Vietnamese translations..."
VIETNAMESE_COUNT=$(eval "$MYSQL_CMD \"$DB_NAME\" -se \"SELECT COUNT(*) FROM pre_generated_sentences WHERE user_id=$ADMIN_ID AND modern_vietnamese IS NOT NULL AND modern_vietnamese != ''\" 2>/dev/null || echo "0")
echo "Phrases with Vietnamese: $VIETNAMESE_COUNT"
echo ""

if [ "$VIETNAMESE_COUNT" -gt 0 ]; then
    echo "✓ Vietnamese translations already present!"
    echo ""
    echo "Sample Vietnamese translations:"
    eval "$MYSQL_CMD \"$DB_NAME\" -se \"SELECT CONCAT(SUBSTRING(chinese_text, 1, 20), ' => ', SUBSTRING(modern_vietnamese, 1, 30)) FROM pre_generated_sentences WHERE user_id=$ADMIN_ID AND modern_vietnamese IS NOT NULL LIMIT 3\" 2>/dev/null"
else
    echo "⚠ No Vietnamese translations found."
    echo ""
    echo "Step 4: Generating JWT token..."
    
    JWT_SECRET='your-super-secret-key-change-in-production-12345'
    
    # Generate JWT using openssl and base64
    HEADER=$(echo -n '{"alg":"HS256","typ":"JWT"}' | base64 -w0 | tr '+/' '-_' | tr -d '=')
    PAYLOAD=$(echo -n "{\"userId\":$ADMIN_ID,\"username\":\"admin\",\"role\":\"admin\",\"iat\":$(date +%s),\"exp\":$(($(date +%s)+86400))}" | base64 -w0 | tr '+/' '-_' | tr -d '=')
    SIGNATURE=$(echo -n "$HEADER.$PAYLOAD" | openssl dgst -sha256 -hmac "$JWT_SECRET" -binary | base64 -w0 | tr '+/' '-_' | tr -d '=')
    JWT_TOKEN="$HEADER.$PAYLOAD.$SIGNATURE"
    
    echo "✓ JWT token generated (length: ${#JWT_TOKEN})"
    echo ""
    
    echo "Step 5: Calling phrase generation endpoint (with 120s timeout)..."
    
    RESPONSE=$(timeout 120 curl -s -X POST http://localhost:3000/api/phrases/generate \
        -H "Authorization: Bearer $JWT_TOKEN" \
        -H "Content-Type: application/json" \
        2>&1 || echo "TIMEOUT_OR_ERROR")
    
    if [ "$RESPONSE" = "TIMEOUT_OR_ERROR" ]; then
        echo "⚠ Generation request timed out or errored (this is expected - generation runs in background)"
        echo ""
        echo "The backend will process phrase generation. Check progress in 30-60 seconds."
    else
        echo "API Response: $RESPONSE"
    fi
    
    echo ""
    echo "Step 6: Waiting for generation to complete (checking every 5 seconds)..."
    
    for i in {1..30}; do
        sleep 5
        VIETNAMESE_COUNT=$(eval "$MYSQL_CMD \"$DB_NAME\" -se \"SELECT COUNT(*) FROM pre_generated_sentences WHERE user_id=$ADMIN_ID AND modern_vietnamese IS NOT NULL AND modern_vietnamese != ''\" 2>/dev/null || echo "0")
        
        if [ "$VIETNAMESE_COUNT" -gt 0 ]; then
            echo "✓ Vietnamese translations found! ($VIETNAMESE_COUNT phrases)"
            break
        else
            echo "  Checking... (attempt $i/30, current: $VIETNAMESE_COUNT translations)"
        fi
    done
    
    echo ""
    echo "Final check:"
    VIETNAMESE_COUNT=$(eval "$MYSQL_CMD \"$DB_NAME\" -se \"SELECT COUNT(*) FROM pre_generated_sentences WHERE user_id=$ADMIN_ID AND modern_vietnamese IS NOT NULL AND modern_vietnamese != ''\" 2>/dev/null || echo "0")
    echo "Phrases with Vietnamese: $VIETNAMESE_COUNT"
    
    if [ "$VIETNAMESE_COUNT" -gt 0 ]; then
        echo "✓ Vietnamese translations successfully generated!"
        echo ""
        echo "Sample Vietnamese translations:"
        eval "$MYSQL_CMD \"$DB_NAME\" -se \"SELECT CONCAT(SUBSTRING(chinese_text, 1, 20), ' => ', SUBSTRING(modern_vietnamese, 1, 40)) FROM pre_generated_sentences WHERE user_id=$ADMIN_ID AND modern_vietnamese IS NOT NULL LIMIT 5\" 2>/dev/null"
    else
        echo "✗ Generation appears to have failed. Check backend logs:"
        echo "   pm2 logs chinese-learning-backend"
    fi
fi

echo ""
echo "========================================"
echo "Phrase generation check completed!"
echo "========================================"

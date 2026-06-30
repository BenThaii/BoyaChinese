# Phrase Generation Fix - EC2 Production Issue

## Problem
The `/phrases/generate` endpoint was returning **HTTP 500** on EC2 production, even though it works on local development.

### Root Cause
The **Google Cloud Translation API library** (`@google-cloud/translate`) requires service account credentials to work. On EC2, these credentials weren't configured, causing the translation initialization to fail and crash the entire generation process.

## Solution Implemented

### 1. Robust Error Handling in TranslationService
**File:** `packages/backend/src/services/TranslationService.ts`

- Added `useMockOnly` flag to gracefully fall back when credentials fail
- Wrapped library initialization in try-catch
- All translation calls now have error handling with fallback to mock translations
- Added support for `USE_MOCK_TRANSLATIONS=true` environment variable to force mock mode

### 2. Isolated Translation Failures in AITextGenerator
**File:** `packages/backend/src/services/AITextGenerator.ts`

- English and Vietnamese translations are now independent (parallel with `.catch()` handlers)
- If one language fails, the other still completes
- Placeholder translations like `[English: 小王吃饭]` are used if both fail
- **Translation failures will never cause generation to fail entirely**

### 3. Better Error Logging
**File:** `packages/backend/src/routes/phrases.routes.ts`

- Detailed error messages with stack traces logged to backend
- Error response includes helpful debugging info
- Will help diagnose any future issues

## Testing the Fix

### Step 1: Deploy the code
```bash
cd /var/www/chinese-learning-app
git pull origin main
cd packages/backend && npm run build
cd ../..
pm2 restart backend
```

### Step 2: Trigger phrase generation
1. Go to: `http://13.212.235.9/phrases`
2. Log in as admin:
   - Username: `admin`
   - Phrase: `Brave-Lion-42-Explores`
3. Click **"Refresh Phrases"** button (top-right)
4. Enter password: `BoyaChineseNgoc`
5. Click **Confirm** and wait several minutes

### Expected Results
✅ Generation completes successfully
- Sentences show with Chinese text ✓
- Pinyin shows ✓
- Vietnamese translation shows (may be placeholder like `[Vietnamese: ...]`) ⚠️
- English meaning shows (may be placeholder like `[English: ...]`) ⚠️

❌ If it still fails, check the error message which will now be more detailed

## Permanent Translation Solution (Optional)

To get real translations on EC2, you have two options:

### Option A: Set up Google Cloud Credentials (Recommended for production)
1. Create a Google Cloud service account
2. Download the JSON key file
3. Set environment variable on EC2:
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"
   ```
4. Restart backend: `pm2 restart backend`

### Option B: Force Mock Mode (Quick workaround)
Add to EC2's `.env` file:
```env
USE_MOCK_TRANSLATIONS=true
```
This will immediately use fallback translations without trying to load the library.

## Files Modified

- `packages/backend/src/services/TranslationService.ts` - Added error handling and mock mode flag
- `packages/backend/src/services/AITextGenerator.ts` - Improved translation error isolation
- `packages/backend/src/routes/phrases.routes.ts` - Enhanced error logging

## Verification

After deployment, you can verify the fix worked by:
1. Checking backend logs: `pm2 logs backend --lines 200`
2. Looking for: `[Translation]` log messages showing graceful fallback
3. Generation should complete without 500 errors
4. Sentences should appear on the phrases page (even with placeholder translations)

---

**Last Updated:** 2026-06-29
**Status:** Ready for production deployment

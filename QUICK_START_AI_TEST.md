# Quick Start: AI Test

Follow these steps to populate the database and test Google AI Studio API.

## Step 1: Get Google AI Studio API Key

1. Go to: https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the API key

## Step 2: Configure Backend

1. Open `packages/backend/.env`
2. Add your API key:
```
GOOGLE_AI_API_KEY=your_api_key_here
```
3. Save the file

## Step 3: Start Backend Server

```powershell
cd packages/backend
npm run dev
```

Wait for: `Server running on port 3000`

## Step 4: Populate Database

Open a NEW terminal:

```powershell
cd packages/backend
npm run populate
```

You should see:
```
✓ Successfully populated database with 5 sentences for user1
Total entries for user1: 5
```

## Step 5: Start Frontend

Open a NEW terminal:

```powershell
cd packages/frontend
npm run dev
```

Wait for: `Local: http://localhost:5173/`

## Step 6: Test AI API

1. Open browser: http://localhost:5173/ai-test
2. Keep default settings:
   - Username: user1
   - Chapter Start: 1
   - Chapter End: 3
3. Click "Generate Random Sentence"
4. Wait 2-5 seconds
5. You should see a Chinese sentence generated using your vocabulary!

## Expected Result:

```
Generated Text
Chinese Text: [AI-generated sentence using characters from your 5 sentences]
Pinyin: [Pinyin transcription]
Word Count: [Number of characters]
```

## Troubleshooting:

**Error: "API key not configured"**
- Check that GOOGLE_AI_API_KEY is in .env file
- Restart backend server

**Error: "No vocabulary found"**
- Run: `npm run populate` in packages/backend
- Check that it completed successfully

**Page won't load**
- Make sure frontend is running on port 5173
- Make sure backend is running on port 3000

## What's Next?

Once this works, you can:
- View the 5 sentences at: http://localhost:5173/user1/admin
- Add more vocabulary at: http://localhost:5173/user1/upload
- Generate more sentences with different chapter ranges
- Use the AI API in your mobile app

## Summary of What Was Created:

1. **5 Chinese sentences** (40+ characters each) covering:
   - Daily activities
   - Daily routines
   - Chinese culture
   - Language learning
   - Internet technology

2. **AI Test Page** at http://localhost:5173/ai-test
   - Tests Google AI Studio API
   - Generates sentences from your vocabulary
   - Shows results with pinyin and word count

3. **Populate Script** - `npm run populate`
   - Adds the 5 sentences to user1's vocabulary
   - Can be run multiple times (will add duplicates)

# AI Test Setup Guide

This guide explains how to populate the database with test sentences and test the Google AI Studio API.

## Task 1: Populate Database with 5 Chinese Sentences

I've created 5 Chinese sentences (each 40+ characters) that will be added to user1's vocabulary.

### Sentences Overview:

1. **Daily Activity** (Chapter 1, 42 characters)
   - About going to the park with friends and seeing flowers and birds

2. **Daily Routine** (Chapter 1, 41 characters)
   - Morning routine: waking up, brushing teeth, going to school

3. **Chinese Culture** (Chapter 2, 44 characters)
   - About China's 5000-year history and famous landmarks

4. **Language Learning** (Chapter 2, 43 characters)
   - Advice on learning foreign languages with persistence

5. **Internet Technology** (Chapter 3, 45 characters)
   - How the internet has changed people's lifestyles

### How to Populate:

1. Make sure your backend server is running:
```powershell
cd packages/backend
npm run dev
```

2. In a new terminal, run the populate script:
```powershell
cd packages/backend
npm run populate
```

3. You should see output like:
```
Starting database population...

Adding sentence 1/5...
Chinese: 今天天气非常好，我和朋友们一起去公园散步，看到了很多美丽的花朵和可爱的小鸟。
Length: 42 characters
✓ Created entry with ID: [uuid]

...

✓ Successfully populated database with 5 sentences for user1
Total entries for user1: 5
```

## Task 2: Test Google AI Studio API

I've created a dedicated test page to verify that Google AI Studio API works correctly.

### Setup Google AI Studio API Key:

1. Get your API key from: https://makersuite.google.com/app/apikey

2. Add it to your backend `.env` file:
```
GOOGLE_AI_API_KEY=your_api_key_here
```

3. Restart your backend server

### Access the Test Page:

1. Make sure backend is running on port 3000
2. Make sure frontend is running on port 5173:
```powershell
cd packages/frontend
npm run dev
```

3. Open your browser and go to: http://localhost:5173/ai-test

### Using the Test Page:

The test page allows you to:

1. **Select Username** - Default is "user1" (the user we just populated)

2. **Select Chapter Range** - Default is chapters 1-3 (covers all 5 sentences)

3. **Click "Generate Random Sentence"** - This will:
   - Fetch all vocabulary from the specified chapters
   - Extract unique Chinese characters
   - Send them to Google AI Studio API
   - Generate a new sentence using only those characters
   - Display the result with pinyin and word count

### What You'll See:

**Success Response:**
```
Generated Text
Chinese Text: [AI-generated Chinese sentence]
Pinyin: [Pinyin transcription]
Word Count: [Number of characters]
```

**Error Response:**
If something goes wrong, you'll see an error message explaining what happened:
- "API key not configured" - Add GOOGLE_AI_API_KEY to .env
- "No vocabulary found" - Run the populate script first
- "Failed to generate text" - Check API key or network connection

### Testing Different Scenarios:

1. **Test with all chapters (1-3):**
   - Uses all 5 sentences
   - More characters available for generation

2. **Test with single chapter (1-1):**
   - Uses only sentences from chapter 1
   - Limited character set

3. **Test with different user:**
   - Change username to test with other users' vocabulary
   - Make sure that user has vocabulary entries

### Troubleshooting:

**"No vocabulary found for user"**
- Run the populate script: `npm run populate`
- Check that user1 exists in the database

**"API key not configured"**
- Add GOOGLE_AI_API_KEY to `packages/backend/.env`
- Restart backend server

**"Failed to generate text"**
- Verify API key is valid
- Check internet connection
- Check Google AI Studio API quota/limits

**"Cannot connect to backend"**
- Make sure backend is running on port 3000
- Check that CORS is enabled in backend

## Verification Steps:

1. ✅ Populate database with 5 sentences
2. ✅ Verify sentences in database (check via Vocabulary Management page)
3. ✅ Configure Google AI Studio API key
4. ✅ Access AI Test Page at http://localhost:5173/ai-test
5. ✅ Generate a sentence and verify it uses characters from your vocabulary
6. ✅ Try different chapter ranges to see how it affects generation

## Next Steps:

Once the AI test page works, you can:
- Use the same API in the mobile app for comprehension exercises
- Generate practice sentences on demand
- Create reading comprehension tests
- Build flashcard content automatically

## Files Created:

- `packages/backend/scripts/populate-sentences.ts` - Script to populate database
- `packages/frontend/src/pages/AITestPage.tsx` - Test page for AI API
- `packages/backend/package.json` - Added "populate" script
- `packages/frontend/src/App.tsx` - Added route for AI test page

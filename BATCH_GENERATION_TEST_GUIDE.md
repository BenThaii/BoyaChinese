# Batch Generation Test Guide

This guide will help you test the batch sentence generation with detailed parsing logs to verify that the AI returns exactly 45 sentences per batch (300 words) as requested.

## Prerequisites

1. Backend server must be running (`npm run dev` in `packages/backend`)
2. Database must be set up with vocabulary groups
3. Google AI API key must be configured in `.env`
4. Google Translation API must be enabled and configured

## Quick Test (Automated)

Run the automated test script that will:
1. Clear existing sentences
2. Trigger batch generation
3. Display parsing log with analysis

```bash
cd packages/backend
npm run test-batch
```

This script will show you:
- How many sentences the AI actually returned
- Expected count (45 per batch × 4 batches × 5 groups = 900)
- Target count after rejection sampling (30 per batch = 600)
- Match rate percentage

## Manual Test (Step by Step)

### Step 1: Clear Existing Sentences

```bash
cd packages/backend
npm run clear-sentences
```

### Step 2: Trigger Batch Generation

Option A - Using curl:
```bash
curl -X POST http://localhost:3000/api/phrases/generate
```

Option B - Using the test script:
```bash
npm run test-batch
```

### Step 3: Check Parsing Logs

The detailed parsing log is written to:
```
packages/backend/temp/parsing-log.txt
```

This log contains:
- Total sentences parsed from AI response
- Expected count (45 per batch)
- Target count after rejection (30 per batch)
- Per-group and per-batch breakdown
- Valid vs invalid sentence counts
- Examples of rejected sentences with invalid characters

### Step 4: Check Backend Console Logs

The backend console will show:
- API request details
- Token usage
- Parsing progress for each group and batch
- Rejection sampling results
- Translation progress
- Final summary

## What to Look For

### Success Indicators

✓ **AI returned exactly 45 sentences per batch**
- Log shows: "Total sentence matches found: 900" (45 × 4 × 5)
- Match rate: 100%

✓ **Rejection sampling working correctly**
- Valid sentences identified and selected
- Invalid sentences (with characters outside the list) rejected
- Up to 30 valid sentences stored per batch

✓ **English translations added**
- Each sentence has `english_meaning` field populated
- Translation service logs show successful batch translation

### Potential Issues

⚠️ **AI returned fewer than 45 sentences per batch**
- Check if AI is truncating responses
- Review prompt to ensure it's clear
- Check token limits

⚠️ **High rejection rate**
- Many sentences contain invalid characters
- May need to adjust prompt to emphasize character restrictions
- Consider adding more required grammar words

⚠️ **Translation failures**
- Check Google Translation API configuration
- Verify API is enabled in Google Cloud Console
- Check API key permissions

## Understanding the Logs

### Parsing Log Format

```
===== PARSING RESULTS =====
Total sentence matches found: 900
Expected (45 per batch × 4 batches × 5 groups): 900
Target after rejection (30 per batch): 600

----- Processing Vocab Group 1 -----
  Batch 1: Starting at matchIndex 0
  Batch 1 RESULTS:
    - Candidates parsed: 45
    - Valid sentences: 42
    - Invalid sentences: 3
    - Ended at matchIndex: 45
    ⚠️  Rejected 3 sentences:
      - "我有一本书。" [Invalid: 本]
      - "他去商店。" [Invalid: 商, 店]
      ...
```

### Key Metrics

- **Candidates parsed**: How many sentences were extracted from AI response for this batch
- **Valid sentences**: Sentences using only characters from the available list
- **Invalid sentences**: Sentences containing characters not in the list
- **Selected for storage**: Up to 30 valid sentences stored (may be less if not enough valid ones)

## Troubleshooting

### Backend not responding
```bash
# Check if backend is running
curl http://localhost:3000/health

# Restart backend
cd packages/backend
npm run dev
```

### Database connection issues
```bash
# Check database connection
npm run verify-sentences-table
```

### API key issues
```bash
# Test Google AI API
npm run test-ai

# Test Google Translation API
npm run test-translate
```

## Next Steps After Testing

1. **If AI returns exactly 45 sentences per batch**: Success! The rejection sampling is working as designed.

2. **If AI returns fewer sentences**: May need to adjust the prompt or investigate token limits.

3. **If rejection rate is too high**: Consider:
   - Adding more required grammar words to the available character list
   - Adjusting the prompt to emphasize character restrictions
   - Reviewing which characters are causing rejections

4. **Frontend display**: Once generation is working well, update the phrases page to show English translations alongside Chinese text and pinyin.

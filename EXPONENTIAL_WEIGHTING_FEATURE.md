# Exponential Weighting for Phrase Generation

## Overview
The phrase generation system now uses exponential weighting to prioritize vocabulary from later chapters while ensuring all favorite words are always included.

## Algorithm

### Step 1: Always Include Favorites
All words marked as favorites are automatically included in every batch. This ensures that important vocabulary the user wants to practice is always present in generated phrases.

### Step 2: Exponential Weighting for Non-Favorites
For the remaining slots (300 - number of favorites), words are selected using exponential weighting based on their chapter number:

**Weight Formula:** `weight = e^((chapter - minChapter) / (maxChapter - minChapter))`

This creates an exponential distribution where:
- Words from later chapters have exponentially higher probability of selection
- Words from earlier chapters still have a chance to be selected (not excluded)
- The distribution is normalized to the chapter range

### Example Distribution
For chapters 1-20 with 10 words per chapter:
- Chapters 1-7 (early): ~22% of selections
- Chapters 8-14 (mid): ~35% of selections  
- Chapters 15-20 (late): ~43% of selections

This ensures phrases use more advanced vocabulary while maintaining variety.

## Implementation Details

### Location
`packages/backend/src/services/PhraseGeneratorService.ts` - `generateSentencesForGroup()` method

### Process
1. Query vocabulary with chapter and favorite status
2. Separate favorites from non-favorites
3. For each of 4 batches (300 words each):
   - Add all favorites
   - Calculate exponential weights for non-favorites
   - Create weighted pool (words appear multiple times based on weight)
   - Randomly sample from weighted pool to fill remaining slots

### Weight Calculation
```typescript
const normalizedChapter = (chapter - minChapter) / (maxChapter - minChapter);
const weight = Math.exp(normalizedChapter);
const copies = Math.max(1, Math.round(weight * 10)); // Scale for granularity
```

## Testing

### Test Script
`packages/backend/scripts/test-exponential-weighting.ts`

Run with:
```bash
cd packages/backend
npx tsx scripts/test-exponential-weighting.ts
```

### Test Cases
1. **Mixed chapters with favorites**: Verifies favorites are included and later chapters dominate
2. **Large vocabulary set**: Tests realistic scenario with 200 words across 20 chapters
3. **All favorites**: Edge case where all words are favorites
4. **No favorites**: Edge case with only non-favorite words

### Expected Results
- ✓ All favorites always included
- ✓ Later chapters have higher selection rate
- ✓ Distribution follows exponential pattern
- ✓ Edge cases handled correctly

## Benefits

1. **Prioritizes Advanced Vocabulary**: Phrases use more words from recent chapters
2. **Maintains Variety**: Earlier chapters still contribute, preventing monotony
3. **Respects User Preferences**: Favorites are always included regardless of chapter
4. **Balanced Learning**: Exponential (not linear) weighting provides good balance

## Configuration

The weighting is automatic and requires no configuration. The system:
- Automatically detects chapter range
- Calculates appropriate weights
- Adjusts for any number of favorites

## Database Requirements

The algorithm requires the `is_favorite` column in the `vocabulary_entries` table, which is already present in the schema.

## Performance

- Minimal overhead: Weight calculation is O(n) where n = vocabulary size
- Weighted pool creation is efficient with pre-calculated weights
- No impact on AI generation time (same number of API calls)

## Future Enhancements

Possible improvements:
- Configurable weighting strength (linear, quadratic, exponential)
- Per-group weighting preferences
- Minimum quota for early chapters
- User-adjustable bias slider

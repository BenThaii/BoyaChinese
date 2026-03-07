# Exponential Weighting for Phrase Generation

## Overview
The phrase generation system now uses exponential weighting to prioritize vocabulary from later chapters while ensuring all favorite words are always included.

## Algorithm

### Step 1: Always Include Favorites
All words marked as favorites are automatically included in every batch. This ensures that important vocabulary the user wants to practice is always present in generated phrases.

### Step 2: Smoothed Exponential Weighting for Non-Favorites
For the remaining slots (300 - number of favorites), words are selected using a smoothed exponential weighting based on their chapter number:

**Weight Formula:** `weight = 0.5 × e^(normalized) + 0.5 × linear(normalized)`

Where:
- `normalized = (chapter - minChapter) / (maxChapter - minChapter)` (ranges from 0 to 1)
- Exponential component: `e^(normalized)` (ranges from 1 to e ≈ 2.718)
- Linear component: `1 + normalized × (e - 1)` (ranges from 1 to e ≈ 2.718)
- Final weight is 50% blend of both

This creates a smoother distribution where:
- Words from later chapters have higher probability of selection (but not as extreme as pure exponential)
- Words from earlier chapters have better representation than pure exponential
- The distribution balances advanced vocabulary with variety

### Example Distribution
For chapters 1-20 with 10 words per chapter (smoothed 50%):
- Chapters 1-7 (early): ~21% of selections
- Chapters 8-14 (mid): ~38% of selections  
- Chapters 15-20 (late): ~41% of selections

This ensures phrases use more advanced vocabulary while maintaining good variety across all chapters.

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

// Exponential component
const exponentialWeight = Math.exp(normalizedChapter);

// Linear component (scaled to match exponential range)
const linearWeight = 1 + normalizedChapter * (Math.E - 1);

// Blend 50% exponential + 50% linear for smoother distribution
const weight = 0.5 * exponentialWeight + 0.5 * linearWeight;

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
2. **Maintains Better Variety**: Smoothed weighting gives earlier chapters better representation than pure exponential
3. **Respects User Preferences**: Favorites are always included regardless of chapter
4. **Balanced Learning**: 50% smoothing provides excellent balance between bias and variety
5. **Natural Progression**: Mid-range chapters get appropriate representation

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

# Rejection Sampling for Batch Sentence Generation

## Overview
Implemented rejection sampling to improve sentence quality by filtering out sentences that use characters outside the provided vocabulary list.

## How It Works

### Previous Approach
- Generate 30 sentences per batch
- Accept all sentences, even if they contain invalid characters
- Log warnings but store invalid sentences anyway

### New Approach (Rejection Sampling)
1. **Generate 45 candidate sentences** per batch (50% more)
2. **Validate each sentence** - check if all characters are from the available list
3. **Filter out invalid sentences** - reject any sentence with characters not in the list
4. **Select up to 30 valid sentences** - take the first 30 that pass validation
5. **Store only valid sentences** - database contains only high-quality sentences

## Benefits

### Quality Improvement
- **100% character compliance** - stored sentences only use provided vocabulary
- **No post-processing needed** - validation happens during generation
- **Better learning experience** - students only see sentences with known characters

### Graceful Degradation
- If AI generates many invalid sentences, we still get as many valid ones as possible
- Minimum: 0 valid sentences (worst case, very unlikely)
- Target: 30 valid sentences per batch
- Typical: 25-30 valid sentences per batch (based on AI compliance rate)

### Transparency
- Detailed logging shows:
  - How many candidates were generated
  - How many passed validation
  - Which sentences were rejected and why
  - Final count of stored sentences

## Implementation Details

### Code Changes

#### AITextGenerator.ts
```typescript
// Generate 45 candidates per batch
Generate 45 sentences using ONLY the characters listed above.

// Validation logic
const validSentences = batchCandidates.filter(s => s.invalidCharacters.length === 0);
const invalidSentences = batchCandidates.filter(s => s.invalidCharacters.length > 0);

// Take up to 30 valid sentences
const selectedSentences = validSentences.slice(0, 30);
```

#### Logging Output
```
[AITextGenerator] Batch 1 - Generated: 45, Valid: 42, Invalid: 3
[AITextGenerator] Rejected 3 sentences with invalid characters:
  - "现在十点一刻。" [Invalid: 点, 刻]
  - "他在图书馆看书。" [Invalid: 图, 书, 馆]
  - "我喜欢吃苹果。" [Invalid: 苹, 果]
[AITextGenerator] Warning: Only 28 valid sentences for batch 2 (target: 30)
```

## Performance Impact

### API Costs
- **Before**: 30 sentences × 4 batches × N groups = 120N sentences
- **After**: 45 sentences × 4 batches × N groups = 180N sentences
- **Cost increase**: ~50% more tokens per API call

### Quality vs Cost Trade-off
- 50% more generation cost
- But 100% valid sentences (vs ~85-95% before)
- No need for manual cleanup or regeneration
- Better user experience

## Expected Results

### Typical Scenario (90% AI compliance)
- Generate: 45 candidates
- Valid: ~40 sentences
- Selected: 30 sentences (target met)
- Rejected: ~5 sentences

### Worst Case Scenario (70% AI compliance)
- Generate: 45 candidates
- Valid: ~31 sentences
- Selected: 30 sentences (target met)
- Rejected: ~14 sentences

### Edge Case (50% AI compliance)
- Generate: 45 candidates
- Valid: ~22 sentences
- Selected: 22 sentences (below target)
- Rejected: ~23 sentences
- **Warning logged** for manual review

## Monitoring

### Key Metrics to Watch
1. **Valid sentence rate**: Should be >80%
2. **Batches below target**: Should be <5%
3. **Most common invalid characters**: Helps improve prompts

### When to Investigate
- If valid rate drops below 70%
- If multiple batches have <25 valid sentences
- If same invalid characters appear repeatedly

## Future Improvements

### Potential Enhancements
1. **Adaptive generation**: If first attempt yields <30 valid, generate more
2. **Character frequency analysis**: Prioritize sentences using rare characters
3. **Diversity scoring**: Select 30 most diverse sentences from valid pool
4. **Prompt refinement**: Use rejection patterns to improve AI instructions

### Alternative Approaches
1. **Two-pass generation**: Generate 30, validate, regenerate failures
2. **Incremental generation**: Generate until we have 30 valid
3. **Hybrid approach**: Index-based for problematic character sets

## Testing

### Manual Testing
```bash
# Run batch generation
npm run dev:backend

# Check logs for rejection sampling stats
# Look for lines like:
# "Batch X - Generated: 45, Valid: Y, Invalid: Z"

# Query database to verify sentence quality
SELECT chinese_text, used_characters 
FROM pre_generated_sentences 
WHERE vocab_group_id = 1;
```

### Validation
- All stored sentences should only use characters from the vocab group
- No warnings about invalid characters in stored sentences
- Batch counts may vary (25-30 per batch is acceptable)

## Rollback Plan

If rejection sampling causes issues:

1. **Revert prompt changes**: Change 45 back to 30
2. **Revert parsing logic**: Remove filtering, accept all sentences
3. **Keep logging**: Maintain invalid character detection for monitoring

The changes are isolated to AITextGenerator.ts, making rollback straightforward.

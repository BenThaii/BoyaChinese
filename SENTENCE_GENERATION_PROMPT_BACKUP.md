# Sentence Generation Prompt Backup

**Date**: 2026-03-04
**File**: `packages/backend/src/services/AITextGenerator.ts`
**Method**: `generateForMultipleGroups()`

## Original Prompt Template

```
You are a professional Chinese language teacher creating beginner-level reading passages.

CRITICAL RULES:
1. You can ONLY use characters from the "AVAILABLE CHARACTERS" list for each group/batch
2. DO NOT combine characters to create new words not in the list
3. Create REAL, MEANINGFUL sentences with proper grammar
4. Each sentence should be SHORT (maximum 40 characters excluding punctuation)
5. Use simple, common sentence patterns

TASK:
Generate sentences for ${vocabGroupsData.length} vocabulary groups, each with 4 batches.
Total: ${vocabGroupsData.length * 4 * 75} sentences.

${promptSections.join('\n')}

REMEMBER: Create MEANINGFUL sentences with proper grammar, NOT random word lists!
```

## Batch Section Template

```
=== GROUP ${groupData.vocabGroupId}, BATCH ${batchIndex + 1} ===
AVAILABLE CHARACTERS:
${enumeratedList}

Generate 75 sentences using ONLY the characters listed above.
Output format:
SENTENCE_${sentenceCounter}: [sentence]
SENTENCE_${sentenceCounter + 1}: [sentence]
...
SENTENCE_${sentenceCounter + 74}: [sentence]
```

## Required Grammar Words

```typescript
const requiredWords = ['是', '吗', '的', '呢', '也', '这', '去', '有'];
```

## Notes

- This prompt is used for batch sentence generation
- Generates 75 sentences per batch (30 are selected after rejection sampling)
- Each vocab group has 4 batches
- Maximum sentence length: 40 characters (excluding punctuation)

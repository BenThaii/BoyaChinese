# Bugfix Specification: Placeholder Word Detection in Generated Sentences

## Bug Description

Vocabulary words containing placeholder patterns (e.g., "从。。。到。。。", "太。。。了") are not being detected in AI-generated sentences, even when the sentences correctly use these patterns.

### Example Failures

1. Sentence: "从商店到酒吧" (From shop to bar)
   - Expected: Should detect "从。。。到。。。", "商店", "酒吧"
   - Actual: Only detects "商店", "酒" (missing "从。。。到。。。" and "吧")

2. Sentence: "从书店到商店" (From bookstore to shop)
   - Expected: Should detect "从。。。到。。。", "书店", "商店"
   - Actual: Only detects "书店", "店" (missing "从。。。到。。。" and "商店")

3. Sentence: "从这到那差不多" (From here to there, almost)
   - Expected: Should detect "从。。。到。。。", "这", "那", "差不多"
   - Actual: Only detects "这", "差不多" (missing "从。。。到。。。" and "那")

## Bug Condition C(X)

**Input X**: A generated Chinese sentence and a vocabulary list containing words with placeholder patterns ("。。。")

**Bug Condition C(X)**: 
```
C(X) = (sentence contains a pattern matching a placeholder word) AND 
       (placeholder word is NOT in the detected usedCharacters list)
```

### Concrete Bug Condition Examples

1. `C("从商店到酒吧", ["从。。。到。。。", "商店", "酒吧", ...]) = true`
   - Sentence matches pattern "从。。。到。。。" but it's not detected

2. `C("太冷了", ["太。。。了", "冷", ...]) = true`
   - Sentence matches pattern "太。。。了" but it's not detected

3. `C("我喜欢游泳", ["我", "喜欢", "游泳", ...]) = false`
   - No placeholder patterns involved, normal detection works

## Root Cause Analysis

The current character extraction logic in `AITextGenerator.ts` uses simple string matching with `startsWith()`:

```typescript
for (const char of sortedUniqueChars) {
  if (remainingText.startsWith(char)) {
    // Match found
  }
}
```

This approach fails for placeholder words because:
1. "从。。。到。。。" will never match "从商店到酒吧" using `startsWith()`
2. The "。。。" is a literal string, not a wildcard pattern
3. No regex or pattern matching is implemented

## Impact

- Users cannot see which placeholder vocabulary words are used in generated sentences
- The "Characters Used" table is incomplete and misleading
- Affects all AI-generated sentences on the AI Test Page and potentially other pages

## Affected Code

- File: `packages/backend/src/services/AITextGenerator.ts`
- Functions: 
  - `generateText()` - lines ~283-310
  - `generateText()` truncated section - lines ~329-358
  - `generateMultipleSentences()` - lines ~555-590
  - `generateMultipleSentences()` parsing section - lines ~874-906

All four locations use the same greedy matching logic that doesn't support placeholders.

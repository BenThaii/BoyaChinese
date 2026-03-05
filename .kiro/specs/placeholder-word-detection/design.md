# Design Document: Fix Placeholder Word Detection

## Solution Overview

Implement regex-based pattern matching for vocabulary words containing "。。。" placeholders, while maintaining the existing greedy matching for regular words.

## Key Design Decisions

### 1. Pattern Matching Strategy

Use regex to match placeholder patterns against sentence text:
- Convert "从。。。到。。。" → `/^从[^，。；？！]+到[^，。；？！]+/`
- Match until punctuation marks to capture complete phrases
- Use `[^，。；？！]+` instead of `.+` to stop at sentence boundaries

**Rationale**: Matching until punctuation ensures we capture complete phrases like "从商店到酒吧" without over-matching into the next sentence.

### 2. Two-Pass Matching Algorithm

**Pass 1 - Outer Loop**: Match vocabulary words (including placeholders) against remaining text
**Pass 2 - Inner Loop**: When a placeholder is matched, re-parse the matched text to extract individual vocabulary words within it

Example for "从商店到酒吧":
1. Outer loop matches "从。。。到。。。" → captures "从商店到酒吧"
2. Inner loop re-parses "从商店到酒吧" → finds "商店", "酒吧"
3. Result: ["从。。。到。。。", "商店", "酒吧"]

**Rationale**: This approach ensures both the placeholder pattern AND the individual words within it are detected.

### 3. Helper Function Design

```typescript
function matchesWithPlaceholder(
  vocabWord: string, 
  text: string
): { matches: boolean; length: number; matchedText: string }
```

- Returns match status, consumed length, and matched text
- Handles both regular words (exact match) and placeholder words (regex match)
- Encapsulates all matching logic in one place

## Implementation Plan

### Step 1: Create Helper Function

Add `matchesWithPlaceholder()` function to handle both regular and placeholder matching:

```typescript
const matchesWithPlaceholder = (vocabWord: string, text: string) => {
  if (!vocabWord.includes('。。。')) {
    // Regular word - exact match
    return { 
      matches: text.startsWith(vocabWord), 
      length: vocabWord.length,
      matchedText: text.startsWith(vocabWord) ? text.substring(0, vocabWord.length) : ''
    };
  }
  
  // Placeholder word - regex match
  const escapedWord = vocabWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regexPattern = escapedWord.replace(/。。。/g, '[^，。；？！]+');
  const regex = new RegExp(`^${regexPattern}`);
  const match = text.match(regex);
  
  return { 
    matches: match !== null, 
    length: match ? match[0].length : 0,
    matchedText: match ? match[0] : ''
  };
};
```

### Step 2: Update Outer Loop

Replace `remainingText.startsWith(char)` with `matchesWithPlaceholder(char, remainingText)`:

```typescript
for (const char of sortedUniqueChars) {
  const matchResult = matchesWithPlaceholder(char, remainingText);
  
  if (matchResult.matches) {
    if (!usedCharacters.includes(char)) {
      usedCharacters.push(char);
    }
    
    // Inner loop logic here (Step 3)
    
    remainingText = remainingText.slice(matchResult.length);
    matched = true;
    break;
  }
}
```

### Step 3: Add Inner Loop for Placeholder Matches

When a placeholder is matched, re-parse the matched text:

```typescript
if (char.includes('。。。') && matchResult.matchedText) {
  let innerText = matchResult.matchedText;
  while (innerText.length > 0) {
    let innerMatched = false;
    for (const innerChar of sortedUniqueChars) {
      if (innerChar.includes('。。。')) continue; // Skip placeholders
      
      if (innerText.startsWith(innerChar)) {
        if (!usedCharacters.includes(innerChar)) {
          usedCharacters.push(innerChar);
        }
        innerText = innerText.slice(innerChar.length);
        innerMatched = true;
        break;
      }
    }
    if (!innerMatched) {
      innerText = innerText.slice(1); // Skip unmatched character
    }
  }
}
```

### Step 4: Apply to All Four Locations

Update the matching logic in all four places where character extraction occurs:
1. `generateText()` - main extraction
2. `generateText()` - truncated text extraction  
3. `generateMultipleSentences()` - batch candidate extraction
4. `generateMultipleSentences()` - final sentence parsing

## Testing Strategy

### Unit Tests

Create `test-placeholder-matching.ts` with test cases:

```typescript
const testCases = [
  {
    sentence: '从商店到酒吧',
    vocab: ['从。。。到。。。', '商店', '酒吧', '店', '酒', '吧'],
    expected: ['从。。。到。。。', '商店', '酒吧']
  },
  {
    sentence: '从书店到商店',
    vocab: ['从。。。到。。。', '书店', '商店', '书', '店', '商'],
    expected: ['从。。。到。。。', '书店', '商店']
  },
  {
    sentence: '从这到那差不多',
    vocab: ['从。。。到。。。', '这', '那', '差不多', '差', '不', '多'],
    expected: ['从。。。到。。。', '这', '那', '差不多']
  },
  {
    sentence: '太冷了',
    vocab: ['太。。。了', '冷'],
    expected: ['太。。。了', '冷']
  }
];
```

### Integration Tests

1. Generate 30 sentences using AI Test Page
2. Verify sentences with placeholder patterns show all expected words
3. Check that regular sentences still work correctly

## Edge Cases

1. **Multiple placeholders in one sentence**: "从这到那，从东到西"
   - Should detect "从。。。到。。。" twice? No - only once in usedCharacters
   
2. **Nested patterns**: "太从这到那了" (nonsensical but possible)
   - Outer loop will match longest first, should work correctly

3. **Placeholder at sentence end**: "我从这到那"
   - Regex stops at end of string, should work

4. **Empty placeholder content**: "从到" (invalid Chinese)
   - Regex requires at least one character: `[^，。；？！]+`
   - Won't match, which is correct behavior

## Performance Considerations

- Regex matching is slightly slower than string comparison
- Only applied to words with "。。。", so impact is minimal
- Inner loop only runs for matched placeholders (rare case)
- Overall performance impact: negligible

## Backwards Compatibility

- Regular words without placeholders use exact same logic as before
- No changes to API or data structures
- Existing functionality preserved

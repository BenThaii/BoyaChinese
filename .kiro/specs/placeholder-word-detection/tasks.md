# Implementation Tasks: Fix Placeholder Word Detection

## Task 1: Create Test Script
- [x] 1.1 Create `packages/backend/scripts/test-placeholder-matching.ts`
- [x] 1.2 Add test cases for all placeholder patterns
- [x] 1.3 Implement test runner with pass/fail reporting
- [x] 1.4 Run tests to establish baseline (should fail before fix)

## Task 2: Implement Helper Function
- [x] 2.1 Add `matchesWithPlaceholder()` helper function in `generateText()`
- [x] 2.2 Handle regular words (exact match with `startsWith`)
- [x] 2.3 Handle placeholder words (regex match with punctuation boundary)
- [x] 2.4 Return match status, length, and matched text

## Task 3: Update Outer Loop in `generateText()`
- [x] 3.1 Replace `startsWith()` with `matchesWithPlaceholder()` call
- [x] 3.2 Use returned `matchResult.length` for slicing
- [x] 3.3 Store `matchResult.matchedText` for inner loop

## Task 4: Add Inner Loop in `generateText()`
- [x] 4.1 Check if matched word contains '。。。'
- [x] 4.2 Re-parse `matchResult.matchedText` to find vocabulary words
- [x] 4.3 Skip placeholder words in inner loop to avoid infinite recursion
- [x] 4.4 Add matched words to `usedCharacters` list

## Task 5: Apply to Truncated Section in `generateText()`
- [x] 5.1 Copy helper function to truncated text section
- [x] 5.2 Update outer loop logic
- [x] 5.3 Add inner loop logic
- [x] 5.4 Use `truncatedUsedCharacters` list

## Task 6: Apply to Batch Generation in `generateMultipleSentences()`
- [x] 6.1 Copy helper function to batch candidate section
- [x] 6.2 Update outer loop logic
- [x] 6.3 Add inner loop logic
- [x] 6.4 Track both `usedCharacters` and `invalidCharacters`

## Task 7: Apply to Final Parsing in `generateMultipleSentences()`
- [x] 7.1 Copy helper function to final sentence parsing section
- [x] 7.2 Update outer loop logic
- [x] 7.3 Add inner loop logic
- [x] 7.4 Use sentence-specific `usedCharacters` list

## Task 8: Run Tests and Verify
- [x] 8.1 Run `test-placeholder-matching.ts` script
- [x] 8.2 Verify all test cases pass
- [x] 8.3 Test with AI generation on dev environment
- [x] 8.4 Verify sentences with placeholders show all expected words

## Task 9: Manual Testing
- [ ] 9.1 Generate 30 sentences on AI Test Page
- [ ] 9.2 Find sentences with "从。。。到。。。" pattern
- [ ] 9.3 Verify all words are detected in "Characters Used" table
- [ ] 9.4 Test other placeholder patterns if present

## Task 10: Deploy to Production
- [ ] 10.1 Commit changes with descriptive message
- [ ] 10.2 Push to repository
- [ ] 10.3 SSH to production server
- [ ] 10.4 Run `bash update.sh` to deploy
- [ ] 10.5 Verify fix works in production

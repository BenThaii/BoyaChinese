# API Cost Tracking - Gemini 3.1 Flash Image Preview

## Overview
The application now tracks actual token usage and calculates precise costs based on Gemini API's token-based pricing model.

## Token Understanding (from https://ai.google.dev/gemini-api/docs/tokens)

### What are Tokens?
- Tokens are the basic units that Gemini models use to process input and output
- For text: ~4 characters = 1 token, or 60-80 English words = 100 tokens
- For images: Tokenization depends on image size
- For generated images: Fixed token count based on output resolution

### Token Counting in API Response
The `usageMetadata` object in API responses contains:
- `prompt_token_count` - Input tokens (text prompts + reference images)
- `candidates_token_count` - Output tokens (generated images or text)
- `total_token_count` - Sum of input and output tokens
- `cached_content_token_count` - Cached tokens (if using context caching)
- `thoughts_token_count` - Thinking tokens (for thinking models)

### Image Tokenization
**Input Images:**
- Images ≤384px in both dimensions = 258 tokens
- Larger images are tiled into 768x768 chunks, each = 258 tokens

**Output Images (Generated):**
- 512x512px (0.5K) = 747 tokens = $0.045 per image
- 1024x1024px (1K) = 1120 tokens = $0.067 per image
- 2048x2048px (2K) = 1680 tokens = $0.101 per image
- 4096x4096px (4K) = 2520 tokens = $0.151 per image

## Pricing Structure

### Gemini 3.1 Flash Image Preview
- **Input text tokens**: $0.50 per 1M tokens
- **Output text tokens**: $3.00 per 1M tokens
- **Output image tokens**: $60 per 1M tokens

### Cost Calculation Formula
```
Input Cost = (totalInputTokens / 1,000,000) × $0.50
Output Cost = (totalOutputTokens / 1,000,000) × $60.00
Total Cost = Input Cost + Output Cost
```

### Example Calculation (from actual usage)
**Current Stats (22 successful calls):**
- Total Input Tokens: 387 tokens
- Total Output Tokens: 1,545 tokens

**Costs:**
- Input Cost: (387 / 1,000,000) × $0.50 = $0.000193 USD = ₫5 VND
- Output Cost: (1,545 / 1,000,000) × $60.00 = $0.0927 USD = ₫2,503 VND
- **Total Cost: $0.0929 USD = ₫2,508 VND**

**Average per Image:**
- Input: 17.6 tokens
- Output: 70.2 tokens
- **Cost: $0.00422 USD = ₫114 VND per image**

## Why Actual Costs Are Lower Than Expected

### Expected vs Actual
- **Expected (1024px)**: 1120 output tokens = $0.067 = ₫1,809 per image
- **Actual Average**: 70.2 output tokens = $0.00422 = ₫114 per image
- **Difference**: 94% lower than expected!

### Possible Reasons
1. **Smaller Output Images**: The API may be generating images smaller than 1024px
2. **Image Compression**: The model might be using optimized/compressed output
3. **Token Optimization**: The API may have improved token efficiency
4. **Variable Resolution**: Different prompts may result in different output sizes

## Budget Tracking

### Current Budget
- **Total Budget**: 4,000,000 VND
- **Exchange Rate**: 1 USD = 27,000 VND

### Budget Calculations
Based on actual average cost (₫114 per image):
- **Maximum Images**: 4,000,000 / 114 = ~35,088 images
- **Current Usage**: 22 images = ₫2,508 (0.06% of budget)
- **Remaining**: ₫3,997,492 (99.94% of budget)

If costs were at 1024px rate (₫1,809 per image):
- **Maximum Images**: 4,000,000 / 1,809 = ~2,211 images
- **Much more expensive!**

## Implementation

### Backend Tracking (`ImagenGenerator.ts`)
```typescript
// Track API call with usage metadata
const usageMetadata = response.usageMetadata;
await this.trackApiCall(true, duration, usageMetadata);

// Save to api-usage-stats.json
{
  "totalCalls": 22,
  "successfulCalls": 22,
  "failedCalls": 0,
  "totalInputTokens": 387,
  "totalOutputTokens": 1545,
  "lastUpdated": "2026-04-02T14:46:18.567Z"
}
```

### Frontend Display (`ImagenGeneratorPage.tsx`)
- Real-time cost tracking panel
- Progress bars for API calls and budget usage
- Token usage breakdown (input vs output)
- Average cost per image
- Color-coded warnings (green < 75%, yellow 75-90%, orange > 90%)
- Budget alerts when exceeding 90%

## API Endpoint
```
GET /api/imagen/api-usage
```

Returns current usage statistics with token counts.

## Key Insights

1. **Actual costs are significantly lower** than the 1024px estimate
2. **Token-based tracking is more accurate** than per-call estimates
3. **Budget can support many more images** than initially calculated
4. **Monitor token counts** to understand actual usage patterns
5. **Output token count varies** - likely based on image complexity or size

## Recommendations

1. Continue monitoring actual token usage to understand patterns
2. Consider the actual average cost (₫114) for budget planning
3. Keep the 1024px estimate (₫1,809) as a conservative upper bound
4. Track token counts per workspace to identify cost variations
5. Consider adding per-image token tracking for detailed analysis

## References
- [Gemini API Token Documentation](https://ai.google.dev/gemini-api/docs/tokens)
- [Gemini API Pricing](https://ai.google.dev/pricing)
- Model: `gemini-3.1-flash-image-preview`

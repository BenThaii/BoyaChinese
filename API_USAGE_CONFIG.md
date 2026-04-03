# API Usage Configuration & Statistics

## Overview
All API usage statistics and configuration are stored in a single JSON file that can be easily transferred between environments.

## File Location
```
packages/backend/public/imagen-workspaces/api-usage-stats.json
```

## File Structure

```json
{
  "config": {
    "modelName": "gemini-3.1-flash-image-preview",
    "exchangeRate": {
      "usdToVnd": 27000,
      "currency": "VND"
    },
    "pricing": {
      "inputTextCostPerMillion": 0.50,
      "outputTextCostPerMillion": 3.00,
      "outputImageCostPerMillion": 60.00,
      "currency": "USD"
    },
    "budget": {
      "totalBudgetVnd": 4000000,
      "description": "Total budget for API usage"
    },
    "reference": {
      "image1024px": {
        "tokens": 1120,
        "costUsd": 0.067,
        "description": "Cost for 1024x1024px output image"
      }
    }
  },
  "usage": {
    "totalCalls": 0,
    "successfulCalls": 0,
    "failedCalls": 0,
    "totalInputTokens": 0,
    "totalOutputTokens": 0,
    "lastUpdated": "2026-04-02T00:00:00.000Z"
  }
}
```

## Configuration Fields

### config.modelName
- The Gemini model being used
- Default: `"gemini-3.1-flash-image-preview"`

### config.exchangeRate
- `usdToVnd`: Exchange rate from USD to VND
- `currency`: Target currency for display
- Default: 1 USD = 27,000 VND

### config.pricing
All pricing is per 1 million tokens:
- `inputTextCostPerMillion`: Cost for input text tokens ($0.50)
- `outputTextCostPerMillion`: Cost for output text tokens ($3.00)
- `outputImageCostPerMillion`: Cost for output image tokens ($60.00)
- `currency`: Pricing currency (USD)

### config.budget
- `totalBudgetVnd`: Total budget in VND
- `description`: Budget description
- Default: 4,000,000 VND

### config.reference.image1024px
Reference values for 1024x1024px images:
- `tokens`: Token count (1120)
- `costUsd`: Cost in USD ($0.067)
- `description`: Description

## Usage Fields

### usage.totalCalls
Total number of API calls made (successful + failed)

### usage.successfulCalls
Number of successful API calls

### usage.failedCalls
Number of failed API calls

### usage.totalInputTokens
Cumulative input tokens used across all successful calls

### usage.totalOutputTokens
Cumulative output tokens used across all successful calls

### usage.lastUpdated
ISO timestamp of last update

## How It Works

### Backend (ImagenGenerator.ts)
1. Reads config and usage from the file
2. Tracks each API call with token usage from `usageMetadata`
3. Updates usage statistics
4. Preserves config values across updates
5. Writes back to file

### Frontend (ImagenGeneratorPage.tsx)
1. Fetches stats via `/api/imagen/api-usage` endpoint
2. Uses config values for all calculations:
   - Exchange rate from `config.exchangeRate.usdToVnd`
   - Budget from `config.budget.totalBudgetVnd`
   - Pricing from `config.pricing.*`
3. Calculates costs based on actual token usage
4. Displays real-time statistics

## Transferring to Production

### Method 1: Copy the entire file
```bash
# From local to production
scp packages/backend/public/imagen-workspaces/api-usage-stats.json \
    user@server:/var/www/chinese-learning-app/packages/backend/public/imagen-workspaces/
```

### Method 2: Update only usage data
If you want to keep production config but update usage:
1. Copy only the `usage` section from local
2. Paste into production file's `usage` section
3. Keep production's `config` section unchanged

### Method 3: Reset statistics
To start fresh while keeping config:
```json
{
  "config": { ... keep existing ... },
  "usage": {
    "totalCalls": 0,
    "successfulCalls": 0,
    "failedCalls": 0,
    "totalInputTokens": 0,
    "totalOutputTokens": 0,
    "lastUpdated": "2026-04-02T00:00:00.000Z"
  }
}
```

## Updating Configuration

### Change Exchange Rate
Edit `config.exchangeRate.usdToVnd` in the JSON file. Frontend will automatically use the new rate.

### Change Budget
Edit `config.budget.totalBudgetVnd` in the JSON file. Frontend will recalculate limits.

### Update Pricing
Edit values in `config.pricing` if Gemini pricing changes. All cost calculations will use new rates.

## Benefits

1. **Single Source of Truth**: All config and stats in one file
2. **Easy Transfer**: Copy one file to move between environments
3. **Flexible Configuration**: Update pricing/budget without code changes
4. **Persistent Statistics**: Usage data survives deployments
5. **No Database Required**: Simple JSON file storage
6. **Version Control**: Can track config changes in git

## API Endpoint

```
GET /api/imagen/api-usage
```

Returns the complete JSON structure with both config and usage.

## Example Usage Scenarios

### Scenario 1: Update Exchange Rate
```json
{
  "config": {
    "exchangeRate": {
      "usdToVnd": 28000,  // Changed from 27000
      "currency": "VND"
    },
    ...
  }
}
```
Frontend will immediately use 28,000 VND per USD for all calculations.

### Scenario 2: Increase Budget
```json
{
  "config": {
    "budget": {
      "totalBudgetVnd": 4000000,  // Increased from 4M to 10M
      "description": "Increased budget for Q2"
    },
    ...
  }
}
```
Frontend will show new budget limits and remaining capacity.

### Scenario 3: Track Usage Across Environments
1. Development: Test with local file
2. Copy file to staging: Continue counting from dev numbers
3. Copy to production: Maintain accurate cumulative statistics

## Notes

- File is created automatically if it doesn't exist
- Config values have sensible defaults
- Usage statistics start at 0 if file is missing
- Backend preserves config when updating usage
- Frontend gracefully handles missing config (uses defaults)

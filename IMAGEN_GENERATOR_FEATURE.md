# AI Image Generator Feature (Imagen 4)

## Overview
A comprehensive AI image generation system using Google's Imagen 4 models with workspace management and conversation context.

## Features

### 1. Text Prompt Management
- Global text prompt that can be modified for all subsequent generations
- Prompt is saved with each generated image for reference

### 2. Workspace System
- Each uploaded "prompt photo" creates a dedicated workspace
- Workspace stores:
  - Original prompt photo
  - All generated images from that prompt photo
  - Conversation history with the AI
  - Metadata (timestamps, models used, prompts)

### 3. Multi-Model Fallback
The system tries models in this order until one succeeds:
1. **Imagen 4 Ultra Generate** (`imagen-3.0-generate-001`) - Highest quality
2. **Imagen 4 Fast Generate** (`imagen-3.0-fast-generate-001`) - Faster generation

If a model fails (quota reached, rate limit, etc.), it automatically tries the next model.

### 4. Conversation Context
- Each workspace maintains conversation history
- Users can continue chatting with the AI using the "Continue Conversation" feature
- Follow-up prompts use the conversation context for better results
- All generated images are stored chronologically

### 5. Batch Generation
- Select multiple workspaces
- Generate images for all selected workspaces simultaneously
- Real-time status updates showing which workspaces are generating
- Summary of success/failure counts

### 6. Real-time Status
- Visual indicators when generation is in progress
- Checkboxes to select workspaces for batch operations
- Generated images appear immediately after creation
- Workspace cards show generation count

## API Endpoints

### POST /api/imagen/workspace
Create a new workspace with a prompt photo
- **Body**: FormData with `promptPhoto` file
- **Returns**: `{ success: true, workspaceId: string }`

### POST /api/imagen/generate/:workspaceId
Generate an image for a specific workspace
- **Body**: `{ textPrompt: string, continueConversation: boolean }`
- **Returns**: `{ success: true, imageUrl: string, model: string }`

### GET /api/imagen/workspace/:workspaceId
Get workspace details including all generated images

### GET /api/imagen/workspaces
Get all workspaces

### DELETE /api/imagen/workspace/:workspaceId
Delete a workspace and all its generated images

### POST /api/imagen/batch-generate
Generate images for multiple workspaces
- **Body**: `{ workspaceIds: string[], textPrompt: string, continueConversation: boolean }`
- **Returns**: `{ results: Array<{ workspaceId, success, imageUrl?, error? }> }`

## File Structure

```
packages/backend/
  src/
    services/
      ImagenGenerator.ts          # Core image generation service
    routes/
      imagen.routes.ts            # API routes

packages/frontend/
  src/
    pages/
      ImagenGeneratorPage.tsx     # Main UI

public/
  imagen-workspaces/
    {workspace-id}/
      prompt.jpg                  # Original prompt photo
      generated/
        {image-id}.png            # Generated images
      metadata.json               # Workspace metadata
```

## Usage Flow

1. **Upload Prompt Photos**
   - User uploads one or more photos
   - System creates a workspace for each photo

2. **Set Text Prompt**
   - User enters or modifies the global text prompt
   - This prompt will be used for all selected workspaces

3. **Batch Generate**
   - User selects multiple workspaces (checkboxes)
   - Clicks "Generate for Selected"
   - System generates images for all selected workspaces in parallel

4. **Continue Conversation**
   - User clicks "Continue Conversation" on a workspace
   - Enters follow-up prompts
   - System uses conversation context for better results

5. **View Results**
   - Generated images appear in the workspace card
   - Shows model used, prompt, and timestamp
   - Images are stored permanently in the workspace

## Technical Details

### Model Fallback Logic
```typescript
for (const modelName of models) {
  try {
    // Try to generate with this model
    const result = await model.generateContent(parts);
    return { success: true, ... };
  } catch (error) {
    // If quota/limit error, try next model
    if (isQuotaError(error)) continue;
  }
}
return { success: false, error: 'All models failed' };
```

### Conversation Context
- Stored as array of messages with role ('user' | 'model')
- Includes text prompts and generated image URLs
- Passed to API when `continueConversation: true`
- Enables contextual follow-up generations

### Workspace Persistence
- Metadata saved as JSON file in each workspace directory
- Loaded on server startup
- Survives server restarts

## Environment Variables
- `GOOGLE_AI_API_KEY` - Required for Imagen API access

## Future Enhancements
- Image editing/refinement
- Style presets
- Batch export
- Image comparison view
- Generation history timeline
- Custom model parameters (aspect ratio, quality, etc.)

# Image Duration Control Feature

## Overview
Added the ability to customize how long each uploaded image appears in the final video.

## Feature Details

### User Control
- **Range**: 0.5 seconds to 10 seconds per image
- **Default**: 3 seconds
- **Step**: 0.5 seconds
- **Independent**: Each image can have a different duration

### UI Implementation

When an image is uploaded, a duration slider appears:

```
🖼️ image.jpg (2.1 MB)

Image Display Duration

Duration: 5.0s
[==================>----------]
0.5s        5s        10s
```

### How It Works

**Frontend** (`VideoProcessorPage.tsx`):
1. Added `imageDuration` field to `MediaSettings` interface
2. Default value: 3 seconds for all images
3. Slider updates three states simultaneously:
   - `imageDuration` in settings
   - `mediaDurations` array (for total duration calculation)
   - `trimEnd` (to match the duration)
4. Duration is sent to backend as part of `mediaSettings` JSON

**Backend** (`VideoProcessor.ts`):
1. Reads `imageDuration` from settings: `job.mediaSettings[i]?.imageDuration || 3`
2. Passes custom duration to `convertImageToVideo()` method
3. FFmpeg creates video with exact duration specified

### FFmpeg Command

```bash
ffmpeg -loop 1 -i image.jpg \
  -c:v libx264 \
  -t 5.0 \
  -pix_fmt yuv420p \
  -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2" \
  -y output.mp4
```

The `-t 5.0` parameter sets the duration to 5 seconds.

### Use Cases

1. **Quick transitions**: Set images to 0.5-1s for fast-paced videos
2. **Standard display**: Use 3-5s for normal viewing
3. **Extended viewing**: Set to 8-10s for detailed images or text

### Example Workflow

**Scenario**: Create a video with mixed media

1. Upload 3 images and 2 videos
2. Set image durations:
   - Image 1: 2 seconds (quick intro)
   - Image 2: 5 seconds (main content)
   - Image 3: 3 seconds (outro)
3. Videos use their trim/speed settings
4. Upload audio file
5. Process → Final video with custom image timings

### Duration Calculation

The total duration now accounts for custom image durations:

```
Video 1 (trimmed): 15s
Image 1 (custom):  2s
Video 2 (trimmed): 10s
Image 2 (custom):  5s
Image 3 (custom):  3s
------------------------
Total:            35s
```

If audio is 30s, videos will be trimmed/shuffled to match.

### Technical Details

**State Management**:
- `mediaSettings[i].imageDuration`: User-selected duration
- `mediaDurations[i]`: Used for total duration calculation
- Both updated simultaneously when slider changes

**Default Behavior**:
- If `imageDuration` is not set: defaults to 3 seconds
- Backward compatible: old code without this field still works

**Performance**:
- No impact on processing time
- FFmpeg creates videos with exact duration efficiently

### Benefits

✓ **Flexible timing**: Control exactly how long each image appears  
✓ **Better storytelling**: Match image duration to content importance  
✓ **Professional output**: Fine-tune pacing for polished videos  
✓ **Easy to use**: Simple slider interface  
✓ **Independent control**: Each image can have different duration  

### Future Enhancements (Optional)

- Preset durations (1s, 3s, 5s, 10s buttons)
- Batch apply duration to all images
- Ken Burns effect (pan and zoom) for images
- Transition effects between images

---

**Implementation Date**: 2026-03-31  
**Status**: ✅ Complete and ready for testing

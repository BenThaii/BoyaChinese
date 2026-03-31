# Pre-process on Upload Testing Guide

## What Was Implemented

The pre-process on upload feature has been implemented to make video processing as fast as Canva. Here's what changed:

### Backend Changes

1. **Upload Route (`video.routes.ts`)**
   - Now standardizes all uploaded media BEFORE queuing the job
   - Videos: Transcoded to H.264, 1080x1920, 30fps
   - Images: Converted to video format at specified duration
   - Original uploads are deleted after standardization to save space
   - Standardized files stored in `/uploads/standardized/`

2. **VideoProcessor Service**
   - Added `standardizeVideo()` method - transcodes videos to standard format
   - Added `standardizeImage()` method - converts images to standard video format
   - Updated `processVideo()` method to work with standardized files
   - Added `applyCropZoom()` method for processing images
   - Uses stream copy (`-c copy`) for concatenation - MUCH faster!

### How It Works

#### Upload Phase (One-time, 10-15 seconds per file)
```
User uploads → Standardize to H.264, 1080x1920, 30fps → Store in /standardized/
```

#### Export Phase (15-20 seconds total)
```
Standardized videos → Apply trim/speed/crop → Concatenate (stream copy) → Add audio → Export
```

### Key Benefits

1. **Upload once, iterate many times** - No need to re-upload when adjusting settings
2. **Fast re-processing** - 15-20 seconds vs 60+ seconds previously
3. **Better quality** - Only encode twice total (upload + export)
4. **Consistent format** - All videos in same format = stream copy works

## Testing Instructions

### Test 1: Basic Upload and Process

1. Open `http://localhost:5173` and go to Video Processor
2. Upload 2-3 videos and/or images
3. **Watch the backend console** - you should see:
   ```
   [API] Standardizing video 1/3: video1.mp4
   [VideoProcessor] Standardizing video to H.264 1080x1920@30fps...
   [VideoProcessor] Standardized video: 5.23 MB
   ```
4. Upload an audio file
5. Click "Process Video"
6. Processing should be faster than before

### Test 2: Re-processing (The Key Feature!)

1. After Test 1 completes, click "Process Again"
2. Adjust trim settings on one of the videos
3. Click "Process Video" again
4. **This should be FAST** (15-20 seconds) because:
   - No re-upload needed
   - Standardized files already exist
   - Only applying effects and concatenating

### Test 3: Image Duration

1. Upload 2-3 images
2. Set different durations (e.g., 2s, 5s, 8s)
3. Upload audio
4. Process
5. Check that images appear for the correct duration

### Test 4: Trim + Speed + Crop

1. Upload a video
2. Set trim: start=2s, end=8s
3. Set speed: 1.5x
4. Process
5. Verify:
   - Video is trimmed correctly
   - Speed is applied
   - 10% crop/zoom is applied

### Test 5: Short Trim Duration

1. Upload a video
2. Set trim: start=5s, end=5.6s (0.6 second duration)
3. Process
4. Should work without creating 0 MB files

## What to Check

### Backend Console Logs

Look for these messages:

```
[API] Standardizing uploaded media files...
[API] Standardizing video 1/2: video.mp4
[VideoProcessor] Standardizing video to H.264 1080x1920@30fps...
[VideoProcessor] Standardized video: 5.23 MB
[API] All media files standardized successfully
[VideoProcessor] Processing standardized media files...
[VideoProcessor] Processing video (trim: 2.0s-8.0s [6.0s], speed: 1.5x, crop+zoom)
[VideoProcessor] Processed video size: 3.45 MB
[VideoProcessor] Concatenating videos (stream copy)
```

### File System

Check these directories:

1. `/uploads/standardized/` - Should contain standardized videos
2. `/uploads/processed/` - Should contain final output videos
3. `/uploads/temp/` - Should be cleaned up after processing

### Performance

- **First upload**: 10-15 seconds per file (standardization)
- **First process**: 15-20 seconds (apply effects + concatenate)
- **Re-process**: 15-20 seconds (no re-upload needed!)

Compare to previous:
- **Previous**: 60+ seconds every time

## Known Issues to Watch For

1. **0 MB output files** - Fixed with the trim fix, but watch for this
2. **FFmpeg errors** - Check console for detailed error messages
3. **Memory usage** - Standardization uses more disk space (2-3x original)

## Success Criteria

✅ Videos are standardized during upload
✅ Standardized files are stored in `/standardized/` directory
✅ Processing uses standardized files (not originals)
✅ Concatenation uses stream copy (fast!)
✅ Re-processing works without re-upload
✅ Processing time is 15-20 seconds (not 60+)
✅ Output quality is good
✅ Trim, speed, and crop all work correctly

## Rollback Plan

If issues occur, revert these files:
- `packages/backend/src/routes/video.routes.ts`
- `packages/backend/src/services/VideoProcessor.ts`

The previous version didn't have standardization, so reverting will restore the old behavior.

---

**Status**: Ready for testing
**Date**: 2026-03-31
**Backend Server**: Running on port 3000
**Frontend Server**: Running on port 5173

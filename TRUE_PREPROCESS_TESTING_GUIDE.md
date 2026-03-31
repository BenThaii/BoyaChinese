# True Pre-process on Upload Testing Guide

## What Was Implemented

TRUE pre-process on upload - files are uploaded and standardized IMMEDIATELY when selected, not when "Process Video" is clicked. This is exactly how Canva works!

### Implementation Changes

1. **New Backend Route** (`/api/video/upload`):
   - Accepts media files
   - Standardizes them immediately
   - Returns `uploadSessionId`
   - Stores session data for later processing

2. **Updated Process Route** (`/api/video/process`):
   - Now accepts `uploadSessionId` instead of media files
   - Also supports `reuseJobId` for re-processing
   - Only uploads audio file (small, fast)

3. **Backend Storage**:
   - Added `uploadSessions` Map to store upload session data
   - Keeps last 20 upload sessions
   - Automatically cleans up old sessions

4. **Frontend Changes**:
   - `handleMediaChange` now uploads and standardizes immediately
   - Shows upload progress with percentage
   - "Process Video" button disabled until upload completes
   - Displays "Files ready!" message when standardization done

## How It Works Now

### Phase 1: File Selection (Slow - One Time)
```
User selects files → Upload to server → Standardize → "Files ready!"
Time: 10-15 seconds (happens immediately, not when clicking Process)
```

### Phase 2: Processing (Fast!)
```
User adjusts settings → Clicks "Process Video" → Process only
Time: 15-20 seconds (no upload, no standardization!)
```

### Phase 3: Re-processing (Even Faster!)
```
User clicks "Process Again" → Reuses standardized files → Process
Time: 15-20 seconds (reuses everything!)
```

## Testing Instructions

### Test 1: Upload Phase

1. Open `http://localhost:5173` and go to Video Processor
2. Click "Choose Files" and select 2-3 videos/images
3. **Watch immediately**:
   - Blue progress box appears: "Uploading: 0%"
   - Progress updates: "Uploading: 50%", "Uploading: 100%"
   - Message changes to: "Files ready! You can now adjust settings and process."
4. Check backend logs for:
   ```
   [API] Starting upload session <session-id> with 3 files
   [API] Standardizing video 1/3: video.mp4
   [VideoProcessor] Standardizing video to H.264 1080x1920@30fps...
   [VideoProcessor] Standardized video: 3.85 MB
   [API] Upload session <session-id> completed
   ```
5. **"Process Video" button should be disabled until "Files ready!" appears**

### Test 2: Processing Phase (Fast!)

1. After Test 1 shows "Files ready!"
2. Upload an audio file (optional)
3. Adjust settings if desired (trim, speed, etc.)
4. Click "Process Video"
5. **Time it** - should take ~15-20 seconds
6. Check backend logs for:
   ```
   [API] Processing upload session <session-id>
   [VideoProcessor] Processing standardized media files...
   ```
7. **NO "Standardizing" messages should appear!**

### Test 3: Re-processing (Even Faster!)

1. After Test 2 completes, click "Process Again"
2. Change trim settings
3. Click "Process Video"
4. **Time it** - should still be ~15-20 seconds
5. Check backend logs for:
   ```
   [API] Reusing job <job-id> with new settings
   [VideoProcessor] Reusing standardized files from job <job-id>
   ```

### Test 4: Multiple File Additions

1. Click "Choose Files" and select 1 video
2. Wait for "Files ready!"
3. Click "Choose Files" again and select another video
4. Should upload and standardize the new file
5. Both files should be ready for processing

## What to Look For

### Frontend UI

**During upload:**
```
┌─────────────────────────────────────┐
│ Uploading: 75%                      │
└─────────────────────────────────────┘
```

**After upload:**
```
┌─────────────────────────────────────┐
│ Files ready! You can now adjust     │
│ settings and process.               │
└─────────────────────────────────────┘
```

**Button states:**
- Before upload: "Process Video" button is DISABLED (gray)
- After upload: "Process Video" button is ENABLED (blue)

### Backend Console Logs

**Upload phase:**
```
[API] Starting upload session abc123 with 3 files
[API] Standardizing video 1/3: video.mp4
[VideoProcessor] Standardizing video to H.264 1080x1920@30fps...
[VideoProcessor] FFmpeg command: ffmpeg -i ...
[VideoProcessor] Standardized video: 3.85 MB
[API] Standardizing video 2/3: video2.mp4
...
[API] Upload session abc123 completed - all files standardized
[VideoProcessor] Stored upload session abc123 with 3 files
```

**Processing phase:**
```
[API] Processing upload session abc123
[VideoProcessor] Job xyz789 added to queue
[VideoProcessor] Processing job xyz789
[VideoProcessor] Processing standardized media files...
[VideoProcessor] Processing video (trim: 0.0s-10.0s [10.0s], speed: 1x, crop+zoom)...
[VideoProcessor] Concatenating videos (stream copy)...
[VideoProcessor] Job xyz789 completed successfully
```

**Re-processing phase:**
```
[API] Reusing job xyz789 with new settings
[VideoProcessor] Reusing standardized files from job xyz789
[VideoProcessor] Job def456 added to queue
[VideoProcessor] Processing job def456
...
```

## Performance Comparison

| Phase | Old Flow | New Flow | Improvement |
|-------|----------|----------|-------------|
| File Selection | Instant | 10-15s (upload+standardize) | Slower upfront |
| First Process | 30-35s (upload+standardize+process) | 15-20s (process only) | **50% faster!** |
| Re-process | 30-35s (re-upload+re-standardize+process) | 15-20s (reuse+process) | **50% faster!** |
| **Total for 3 iterations** | **~100s** | **~60s** | **40% faster overall!** |

## Success Criteria

✅ Files upload and standardize immediately when selected
✅ Progress indicator shows upload percentage
✅ "Files ready!" message appears after standardization
✅ "Process Video" button disabled until files ready
✅ Processing takes ~15-20 seconds (no upload/standardization)
✅ Re-processing also takes ~15-20 seconds
✅ Backend logs show upload session creation
✅ Backend logs show NO standardization during processing
✅ Multiple file additions work correctly

## Troubleshooting

### If upload doesn't start immediately:

1. Check browser console for errors
2. Check if `handleMediaChange` is being called
3. Check if `uploadAndStandardizeFiles` is being called

### If "Process Video" button stays disabled:

1. Check if `uploadSessionId` is set
2. Check if upload completed successfully
3. Check browser console for upload errors

### If processing is still slow:

1. Check backend logs - is it using upload session?
2. Look for "Processing upload session" message
3. If you see "Standardizing" during process, something is wrong

### If you see "Upload session not found":

1. Session was cleaned up (only last 20 kept)
2. Or server was restarted
3. Solution: Select files again

## Known Limitations

1. **Sessions are in-memory** - Server restart clears all sessions
2. **Only last 20 sessions** - Older sessions are cleaned up
3. **Audio not pre-uploaded** - Audio is uploaded during processing (small file, fast)

## Future Improvements

1. Persist upload sessions to database
2. Increase session limit to 50
3. Also pre-upload audio files
4. Add progress bar for each file individually
5. Show file thumbnails after upload

---

**Status**: Ready for testing
**Date**: 2026-03-31
**Key Feature**: Upload and standardize happens IMMEDIATELY when files are selected!
**Expected UX**: Like Canva - slow upload once, fast iterations forever

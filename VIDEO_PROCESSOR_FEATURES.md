# Video Processor Features

## Overview
The video processor now supports both videos and images, with intelligent handling of short segments and audio overlay.

## Key Features

### 1. Image Support
- Upload JPG, PNG, or WEBP images alongside videos
- Images are automatically converted to 3-second video clips
- Images maintain 9:16 aspect ratio (phone size)
- Images are scaled and padded to fit 1080x1920 resolution

### 2. Smart Segment Duration Management
When trimming media to match audio length:
- **Minimum Final Segment**: 3 seconds
- If the final segment would be less than 3 seconds:
  - The previous video's last frame is extracted
  - The last frame is extended as a freeze frame to fill the remaining time
  - This ensures smooth viewing without jarring short clips

### 3. Audio Overlay (Optional)
- Upload MP3 or M4A audio files
- Final video matches audio duration exactly
- If media is shorter than audio: shuffles and repeats media
- If media is longer than audio: trims to audio length (respecting 3s minimum rule)
- If no audio: simply concatenates all media

### 4. Processing Logic

#### With Audio
1. Convert all images to 3-second videos
2. Calculate total media duration vs audio duration
3. If media >= audio duration:
   - Use media in order until audio duration is reached
   - If final segment < 3s: extend previous video's last frame instead
4. If media < audio duration:
   - Shuffle and repeat media to fill audio duration
   - Apply same 3s minimum rule for final segment
5. Concatenate all segments
6. Overlay audio on final video

#### Without Audio
1. Convert all images to 3-second videos
2. Concatenate all media in order
3. Output final video

## File Support

### Media Files
- Videos: MP4, MOV
- Images: JPG, PNG, WEBP
- Max file size: 100MB per file
- Max files: 15 media files

### Audio Files
- Formats: MP3, M4A
- Max file size: 100MB
- Max files: 1 audio file

## Technical Details

### FFmpeg Operations
1. **Image to Video**: `-loop 1 -i image.jpg -t 3 -pix_fmt yuv420p -vf scale=1080:1920`
2. **Video Trimming**: `-i video.mp4 -t duration -c copy`
3. **Last Frame Extraction**: `-sseof -1 -i video.mp4 -update 1`
4. **Frame Extension**: Concatenates original video with freeze frame video
5. **Audio Overlay**: `-map 0:v:0 -map 1:a:0 -shortest`

### Processing Queue
- One video processed at a time
- 2-minute timeout per job
- Automatic cleanup of temp files
- Keeps only last 10 processed videos

## Usage Example

### Scenario 1: Video + Images + Audio
- Upload: 2 videos (5s each), 3 images, 1 audio (20s)
- Result: 
  - Videos: 10s total
  - Images: 9s total (3s × 3)
  - Total media: 19s
  - Audio: 20s
  - Final: Shuffles media to extend to 20s

### Scenario 2: Short Final Segment
- Upload: 3 videos (8s, 7s, 6s), 1 audio (18s)
- Processing:
  - Video 1: 8s (total: 8s)
  - Video 2: 7s (total: 15s)
  - Video 3: Would need 3s, but only 3s remains
  - Since 3s >= minimum, Video 3 is trimmed to 3s
  - Final: 18s video with audio

### Scenario 3: Very Short Final Segment
- Upload: 3 videos (8s, 7s, 6s), 1 audio (16.5s)
- Processing:
  - Video 1: 8s (total: 8s)
  - Video 2: 7s (total: 15s)
  - Video 3: Would need 1.5s (< 3s minimum)
  - Instead: Extend Video 2's last frame by 1.5s
  - Final: 16.5s video (8s + 8.5s freeze-extended)

## API Endpoints

### POST /api/video/process
Upload media and audio files for processing.

**Request**: multipart/form-data
- `media`: Array of video/image files
- `audio`: Optional audio file

**Response**:
```json
{
  "success": true,
  "jobId": "uuid",
  "message": "Video processing job queued",
  "queueStatus": {
    "total": 1,
    "queued": 1,
    "processing": 0,
    "completed": 0,
    "failed": 0
  }
}
```

### GET /api/video/status/:jobId
Get processing status.

**Response**:
```json
{
  "jobId": "uuid",
  "status": "completed",
  "createdAt": "2024-03-31T12:00:00.000Z",
  "downloadUrl": "/api/video/download/uuid"
}
```

### GET /api/video/download/:jobId
Download the processed video.

### GET /api/video/queue
Get current queue status.

## Frontend Interface

### Features
- Drag and drop file ordering
- Visual indicators for videos (🎬) and images (🖼️)
- Shows "3s" duration for images
- Real-time job status polling
- Download button when complete
- Reset button to process another video

### URL
http://localhost:5173/video-processor

## Migration Notes

When deploying to production:
1. Ensure FFmpeg is installed: `sudo apt-get install ffmpeg`
2. Verify FFmpeg supports libx264: `ffmpeg -codecs | grep h264`
3. Check disk space for temp files and output videos
4. Monitor processing times and adjust timeout if needed

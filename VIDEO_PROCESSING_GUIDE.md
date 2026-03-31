# Video Processing Feature

## Overview
This feature allows users to upload multiple video segments and an audio file, which are then concatenated and overlaid with the audio to create a final 1-minute video.

## Features
- ✅ Upload multiple video segments (MP4, MOV)
- ✅ Upload audio file (MP3, M4A)
- ✅ Automatic concatenation in upload order
- ✅ Audio overlay
- ✅ Auto-trim to audio length or extend by shuffling videos
- ✅ Queue-based processing (one at a time)
- ✅ Automatic cleanup of old videos (keeps last 10)
- ✅ 2-minute timeout protection
- ✅ Temp file cleanup

## Prerequisites

### Install FFmpeg
The video processing requires FFmpeg to be installed on your server.

**On Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install ffmpeg
```

**On Amazon Linux 2:**
```bash
sudo amazon-linux-extras install epel
sudo yum install ffmpeg
```

**Verify installation:**
```bash
ffmpeg -version
ffprobe -version
```

## API Endpoints

### 1. Process Video
**POST** `/api/video/process`

Upload video segments and audio file for processing.

**Request:**
- Content-Type: `multipart/form-data`
- Fields:
  - `videos`: Multiple video files (max 15)
  - `audio`: Single audio file

**Example using curl:**
```bash
curl -X POST http://localhost:3000/api/video/process \
  -F "videos=@video1.mp4" \
  -F "videos=@video2.mp4" \
  -F "videos=@video3.mp4" \
  -F "audio=@soundtrack.mp3"
```

**Response:**
```json
{
  "success": true,
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
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

### 2. Check Job Status
**GET** `/api/video/status/:jobId`

Check the status of a video processing job.

**Example:**
```bash
curl http://localhost:3000/api/video/status/550e8400-e29b-41d4-a716-446655440000
```

**Response:**
```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "downloadUrl": "/api/video/download/550e8400-e29b-41d4-a716-446655440000"
}
```

**Status values:**
- `queued`: Waiting in queue
- `processing`: Currently being processed
- `completed`: Ready for download
- `failed`: Processing failed

### 3. Download Processed Video
**GET** `/api/video/download/:jobId`

Download the processed video file.

**Example:**
```bash
curl -O http://localhost:3000/api/video/download/550e8400-e29b-41d4-a716-446655440000
```

### 4. Queue Status
**GET** `/api/video/queue`

Get current queue statistics.

**Example:**
```bash
curl http://localhost:3000/api/video/queue
```

**Response:**
```json
{
  "total": 3,
  "queued": 2,
  "processing": 1,
  "completed": 0,
  "failed": 0
}
```

## Processing Logic

### Video Length Adjustment

**If videos are longer than audio:**
- Videos are concatenated in order
- Final video is trimmed to match audio length

**If videos are shorter than audio:**
- Videos are concatenated in order
- Additional videos are added by shuffling the original set
- Process repeats until video length matches audio length

### Example:
- Audio: 60 seconds
- Video 1: 10 seconds
- Video 2: 15 seconds
- Video 3: 20 seconds
- Total: 45 seconds

**Result:** Videos 1, 2, 3 are concatenated, then shuffled versions are added until 60 seconds is reached.

## File Limits

- **Max file size:** 100 MB per file
- **Max video files:** 15 per upload
- **Max audio files:** 1 per upload
- **Supported video formats:** MP4, MOV
- **Supported audio formats:** MP3, M4A
- **Processing timeout:** 2 minutes
- **Stored videos:** Last 10 (older ones auto-deleted)

## Storage Locations

```
packages/backend/uploads/
├── temp/           # Temporary uploaded files (auto-deleted after processing)
├── videos/         # (unused, kept for future use)
└── processed/      # Final processed videos (last 10 kept)
```

## Resource Management

### Safeguards
1. **Queue System:** Only 1 video processed at a time
2. **Timeout:** 2-minute limit per job
3. **Memory:** Automatic cleanup of temp files
4. **Storage:** Auto-delete old videos (keeps last 10)
5. **Error Handling:** Failed jobs don't block the queue

### Monitoring
Check queue status regularly:
```bash
curl http://localhost:3000/api/video/queue
```

Check server logs:
```bash
pm2 logs chinese-learning-backend
```

## Troubleshooting

### FFmpeg not found
```
Error: FFmpeg error: spawn ffmpeg ENOENT
```
**Solution:** Install FFmpeg (see Prerequisites)

### Out of memory
```
Error: JavaScript heap out of memory
```
**Solution:** Upgrade to t3.medium or use smaller video files

### Processing timeout
```
Error: FFmpeg timeout after 120000ms
```
**Solution:** 
- Use shorter videos
- Reduce video quality/resolution
- Upgrade server instance

### Queue stuck
If jobs are stuck in "processing" status:
```bash
# Restart the backend
pm2 restart chinese-learning-backend
```

## Performance Tips

1. **Compress videos before upload** - Use lower resolution (720p is fine for phone videos)
2. **Limit concurrent users** - Queue handles this automatically
3. **Monitor server resources:**
   ```bash
   htop  # Check CPU and memory usage
   df -h # Check disk space
   ```
4. **Clean up manually if needed:**
   ```bash
   rm -rf packages/backend/uploads/temp/*
   rm -rf packages/backend/uploads/processed/*
   ```

## Production Deployment

1. **Install FFmpeg on production server**
2. **Run npm install** to get multer dependency
3. **Deploy using update.sh**
4. **Test the endpoint:**
   ```bash
   curl http://your-server-ip:3000/api/video/queue
   ```

## Future Improvements

- [ ] Add video quality options (720p, 1080p)
- [ ] Support more video formats (AVI, MKV)
- [ ] Add progress tracking (percentage complete)
- [ ] Implement video preview/thumbnail generation
- [ ] Add user authentication for video uploads
- [ ] Store videos in S3 instead of local disk
- [ ] Add video compression options


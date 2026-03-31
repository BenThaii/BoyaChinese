# Pre-process on Upload Implementation Plan

## Overview
Transcode videos to standard format during upload, then apply effects during export for fast iteration.

## Architecture

### Upload Phase
```
User uploads → Standardize to H.264, 1080x1920, 30fps → Store in /standardized/
```

### Export Phase  
```
Standardized videos → Apply trim/speed/crop → Concatenate (stream copy) → Add audio → Export
```

## Implementation Steps

### 1. Backend Changes

#### A. Add Standardization Methods
```typescript
// In VideoProcessor.ts

async standardizeVideo(inputPath: string, outputId: string): Promise<string> {
  const outputPath = path.join(this.standardizedDir, `${outputId}.mp4`);
  
  await this.runFFmpegCommand([
    '-i', inputPath,
    '-vf', 'scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2',
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-crf', '23',
    '-r', '30',
    '-c:a', 'aac',
    '-b:a', '128k',
    '-ar', '44100',
    '-y',
    outputPath
  ], 'Standardizing video');
  
  return outputPath;
}

async standardizeImage(inputPath: string, outputId: string, duration: number): Promise<string> {
  const outputPath = path.join(this.standardizedDir, `${outputId}.mp4`);
  
  await this.runFFmpegCommand([
    '-loop', '1',
    '-i', inputPath,
    '-t', duration.toString(),
    '-vf', 'scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2',
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-crf', '23',
    '-r', '30',
    '-pix_fmt', 'yuv420p',
    '-y',
    outputPath
  ], 'Converting image to video');
  
  return outputPath;
}
```

#### B. Update Upload Route
```typescript
// In video.routes.ts

router.post('/process', upload.fields([...]), async (req, res) => {
  // 1. Standardize all uploaded media FIRST
  const standardizedPaths = [];
  
  for (let i = 0; i < files.media.length; i++) {
    const file = files.media[i];
    const fileId = `${uuidv4()}`;
    
    if (file.mimetype.startsWith('video/')) {
      const standardized = await videoProcessor.standardizeVideo(file.path, fileId);
      standardizedPaths.push(standardized);
    } else if (file.mimetype.startsWith('image/')) {
      const duration = mediaSettings[i]?.imageDuration || 3;
      const standardized = await videoProcessor.standardizeImage(file.path, fileId, duration);
      standardizedPaths.push(standardized);
    }
    
    // Delete original upload
    await fs.unlink(file.path);
  }
  
  // 2. Add job with standardized paths
  const jobId = await videoProcessor.addJob(
    standardizedPaths, // Use standardized paths
    mediaTypes,
    mediaSettings,
    audioFile,
    audioSpeed,
    aiEnhancement
  );
  
  res.json({ success: true, jobId });
});
```

#### C. Update processVideo Method
```typescript
private async processVideo(job: VideoJob): Promise<void> {
  const processedVideos: string[] = [];
  
  try {
    // Step 1: Apply user settings to standardized videos
    // All videos are already H.264, 1080x1920, 30fps
    for (let i = 0; i < job.mediaFiles.length; i++) {
      const processedPath = path.join(this.tempDir, `${job.id}_processed_${i}.mp4`);
      await this.applyAllVideoSettings(job.mediaFiles[i], processedPath, job.mediaSettings[i]);
      processedVideos.push(processedPath);
    }
    
    // Step 2: Concatenate with stream copy (FAST!)
    const concatContent = processedVideos.map(f => `file '${f}'`).join('\n');
    await fs.writeFile(concatListPath, concatContent);
    
    await this.runFFmpegCommand([
      '-f', 'concat',
      '-safe', '0',
      '-i', concatListPath,
      '-c', 'copy', // Stream copy - instant!
      '-y',
      job.outputPath
    ], 'Concatenating videos');
    
    // Step 3: Add audio if provided
    if (job.audioFile) {
      await this.overlayAudio(job.outputPath, job.audioFile, job.audioSpeed);
    }
    
    // Step 4: AI enhancement if requested
    if (job.aiEnhancement) {
      await this.applyAIEnhancement(job.outputPath);
    }
  } finally {
    // Cleanup temp files
    for (const file of processedVideos) {
      await this.safeDelete(file);
    }
  }
}
```

### 2. Frontend Changes

#### A. Show Upload Progress
```typescript
// In VideoProcessorPage.tsx

const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});

const handleUpload = async () => {
  const formData = new FormData();
  
  // Add files
  mediaFiles.forEach(file => formData.append('media', file));
  
  // Upload with progress tracking
  const response = await axios.post(`${API_URL}/video/process`, formData, {
    onUploadProgress: (progressEvent) => {
      const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      setUploadProgress({ overall: percentCompleted });
    }
  });
  
  // Start polling for processing status
  pollJobStatus(response.data.jobId);
};
```

#### B. Update UI
```tsx
{uploading && (
  <div style={{ marginTop: '20px' }}>
    <div>Uploading and standardizing videos...</div>
    <progress value={uploadProgress.overall || 0} max={100} />
    <div>{uploadProgress.overall || 0}%</div>
  </div>
)}
```

## Benefits

### Speed Improvements
- **Upload**: 10-15 seconds (one-time per file)
- **First export**: 15-20 seconds
- **Re-export**: 15-20 seconds (no re-upload!)

### Quality Improvements
- Only encode twice total (upload + export)
- Less generation loss
- Consistent quality across all clips

### User Experience
- Upload once, iterate many times
- Fast adjustments (trim/speed/crop)
- Like professional video editors

## Storage Requirements

### Before
- Original uploads: Deleted after processing
- Processed videos: Last 10 kept

### After
- Standardized videos: Kept until user clears
- Processed videos: Last 10 kept
- **Additional storage**: ~2-3x original file size

### Cleanup Strategy
- Delete standardized videos after 24 hours of inactivity
- Or when user clicks "Clear All"
- Keep last 50 standardized videos max

## Testing Checklist

- [ ] Video standardization works (H.264, 1080x1920, 30fps)
- [ ] Image standardization works (same format)
- [ ] Trim/speed/crop applied correctly during export
- [ ] Concatenation uses stream copy (fast)
- [ ] Audio overlay works
- [ ] AI enhancement works
- [ ] Re-processing works without re-upload
- [ ] Upload progress shows correctly
- [ ] Storage cleanup works

## Rollout Plan

1. **Phase 1**: Implement backend standardization
2. **Phase 2**: Update upload route
3. **Phase 3**: Update processVideo method
4. **Phase 4**: Add frontend progress UI
5. **Phase 5**: Test thoroughly on dev
6. **Phase 6**: Deploy to production

## Estimated Time
- Backend: 2-3 hours
- Frontend: 1 hour
- Testing: 1 hour
- **Total: 4-5 hours**

---

**Status**: Ready for implementation  
**Priority**: High (major UX improvement)  
**Risk**: Medium (significant refactor, needs thorough testing)

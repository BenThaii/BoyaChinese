import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface JobStatus {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  error?: string;
  downloadUrl?: string;
  streamUrl?: string;
}

interface ProcessedVideo {
  id: string;
  filename: string;
  createdAt: string;
  size: number;
  downloadUrl: string;
  streamUrl: string;
}

export default function VideoProcessorPage() {
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [aiEnhancement, setAiEnhancement] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processedVideos, setProcessedVideos] = useState<ProcessedVideo[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<{ url: string; type: 'video' | 'image'; name: string } | null>(null);

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      // Append new files to existing ones instead of replacing
      setMediaFiles(prev => [...prev, ...files]);
      // Clear the input so the same file can be selected again if needed
      e.target.value = '';
    }
  };

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAudioFile(e.target.files[0]);
    }
  };

  const removeMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  const moveMedia = (index: number, direction: 'up' | 'down') => {
    const newFiles = [...mediaFiles];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < newFiles.length) {
      [newFiles[index], newFiles[newIndex]] = [newFiles[newIndex], newFiles[index]];
      setMediaFiles(newFiles);
    }
  };

  const getFileType = (file: File): 'video' | 'image' => {
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('image/')) return 'image';
    return 'video';
  };

  const handleUpload = async () => {
    if (mediaFiles.length === 0) {
      setError('Please select at least one video or image file');
      return;
    }

    setUploading(true);
    setError(null);
    setJobStatus(null);

    try {
      const formData = new FormData();
      
      // Add media in order
      mediaFiles.forEach(file => {
        formData.append('media', file);
      });
      
      // Add audio if provided
      if (audioFile) {
        formData.append('audio', audioFile);
      }

      // Add AI enhancement flag
      formData.append('aiEnhancement', aiEnhancement.toString());

      const response = await axios.post(`${API_URL}/video/process`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const jobId = response.data.jobId;
      
      // Start polling for status
      pollJobStatus(jobId);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Upload failed');
      setUploading(false);
    }
  };

  const pollJobStatus = async (id: string) => {
    try {
      const response = await axios.get(`${API_URL}/video/status/${id}`);
      setJobStatus(response.data);

      if (response.data.status === 'queued' || response.data.status === 'processing') {
        // Poll again in 2 seconds
        setTimeout(() => pollJobStatus(id), 2000);
      } else {
        setUploading(false);
        if (response.data.status === 'completed') {
          loadProcessedVideos(); // Refresh the list when completed
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to get job status');
      setUploading(false);
    }
  };

  const handleDownload = () => {
    if (jobStatus?.downloadUrl) {
      // downloadUrl already includes the full path from API root
      const fullUrl = jobStatus.downloadUrl.startsWith('http') 
        ? jobStatus.downloadUrl 
        : `${API_URL}${jobStatus.downloadUrl}`;
      window.open(fullUrl, '_blank');
    }
  };

  const handleReset = () => {
    setMediaFiles([]);
    setAudioFile(null);
    setAiEnhancement(false);
    setJobStatus(null);
    setError(null);
    setUploading(false);
    loadProcessedVideos(); // Refresh the list
  };

  const loadProcessedVideos = async () => {
    setLoadingVideos(true);
    try {
      const response = await axios.get(`${API_URL}/video/list`);
      setProcessedVideos(response.data.videos);
    } catch (err: any) {
      console.error('Failed to load processed videos:', err);
    } finally {
      setLoadingVideos(false);
    }
  };

  // Load processed videos on mount
  useEffect(() => {
    loadProcessedVideos();
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const handleDownloadVideo = (downloadUrl: string) => {
    const fullUrl = downloadUrl.startsWith('http') 
      ? downloadUrl 
      : `${API_URL}${downloadUrl}`;
    window.open(fullUrl, '_blank');
  };

  const handlePreviewUploadedMedia = (file: File) => {
    const url = URL.createObjectURL(file);
    const type = file.type.startsWith('video/') ? 'video' : 'image';
    setPreviewMedia({ url, type, name: file.name });
  };

  const handlePreviewProcessedVideo = (streamUrl: string, filename: string) => {
    const fullUrl = streamUrl.startsWith('http') 
      ? streamUrl 
      : `${API_URL}${streamUrl}`;
    console.log('[Preview] Opening video preview:', { streamUrl, fullUrl, filename });
    setPreviewMedia({ url: fullUrl, type: 'video', name: filename });
  };

  const closePreview = () => {
    if (previewMedia && previewMedia.url.startsWith('blob:')) {
      URL.revokeObjectURL(previewMedia.url);
    }
    setPreviewMedia(null);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>Video Processor</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        Upload video segments and/or images along with an optional audio file to create a video with audio overlay.
      </p>

      {/* Media Upload Section */}
      <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h3>1. Upload Videos and/or Images</h3>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
          Select video files (MP4, MOV) and/or image files (JPG, PNG, WEBP). Images will be displayed for 3 seconds each. They will be processed in the order shown below. You can upload multiple times to add more files.
        </p>
        
        <input
          type="file"
          accept="video/mp4,video/quicktime,image/jpeg,image/jpg,image/png,image/webp"
          multiple
          onChange={handleMediaChange}
          disabled={uploading}
          style={{ marginBottom: '15px' }}
        />

        {mediaFiles.length > 0 && (
          <div style={{ marginTop: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h4 style={{ margin: 0 }}>Selected Media ({mediaFiles.length}):</h4>
              <button
                onClick={() => setMediaFiles([])}
                disabled={uploading}
                style={{
                  padding: '6px 12px',
                  fontSize: '13px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: uploading ? 'not-allowed' : 'pointer'
                }}
              >
                Clear All
              </button>
            </div>
            {mediaFiles.map((file, index) => {
              const fileType = getFileType(file);
              const icon = fileType === 'video' ? '🎬' : '🖼️';
              return (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '10px',
                    marginBottom: '8px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '4px'
                  }}
                >
                  <span style={{ flex: 1, fontSize: '14px' }}>
                    {index + 1}. {icon} {file.name} ({formatFileSize(file.size)})
                    {fileType === 'image' && <span style={{ color: '#666', marginLeft: '8px' }}>(3s)</span>}
                  </span>
                  <button
                    onClick={() => handlePreviewUploadedMedia(file)}
                    disabled={uploading}
                    style={{ marginRight: '5px', padding: '4px 8px', fontSize: '12px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '3px', cursor: uploading ? 'not-allowed' : 'pointer' }}
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => moveMedia(index, 'up')}
                    disabled={index === 0 || uploading}
                    style={{ marginRight: '5px', padding: '4px 8px', fontSize: '12px', cursor: (index === 0 || uploading) ? 'not-allowed' : 'pointer' }}
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveMedia(index, 'down')}
                    disabled={index === mediaFiles.length - 1 || uploading}
                    style={{ marginRight: '5px', padding: '4px 8px', fontSize: '12px', cursor: (index === mediaFiles.length - 1 || uploading) ? 'not-allowed' : 'pointer' }}
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => removeMedia(index)}
                    disabled={uploading}
                    style={{ padding: '4px 8px', fontSize: '12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '3px', cursor: uploading ? 'not-allowed' : 'pointer' }}
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Audio Upload Section */}
      <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h3>2. Upload Audio File (Optional)</h3>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
          Select an audio file (MP3, M4A) to overlay on the video. If no audio is provided, videos will just be concatenated.
        </p>
        
        <input
          type="file"
          accept="audio/mpeg,audio/mp4"
          onChange={handleAudioChange}
          disabled={uploading}
        />

        {audioFile && (
          <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
            <strong>Selected Audio:</strong> {audioFile.name} ({formatFileSize(audioFile.size)})
          </div>
        )}
      </div>

      {/* AI Enhancement Section */}
      <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h3>3. AI Post-Processing (Optional)</h3>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
          Apply AI enhancement filters to improve video quality: sharpening, subtle noise reduction, and color enhancement.
        </p>
        
        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '14px' }}>
          <input
            type="checkbox"
            checked={aiEnhancement}
            onChange={(e) => setAiEnhancement(e.target.checked)}
            disabled={uploading}
            style={{ marginRight: '10px', width: '18px', height: '18px', cursor: 'pointer' }}
          />
          <span>Enable AI Enhancement (adds sharpening, noise reduction, contrast +5%, saturation +10%)</span>
        </label>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{ padding: '15px', marginBottom: '20px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '4px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Job Status */}
      {jobStatus && (
        <div style={{ marginBottom: '20px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h3>Processing Status</h3>
          <div style={{ marginTop: '10px' }}>
            <p><strong>Job ID:</strong> {jobStatus.jobId}</p>
            <p>
              <strong>Status:</strong>{' '}
              <span style={{
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '14px',
                backgroundColor:
                  jobStatus.status === 'completed' ? '#d4edda' :
                  jobStatus.status === 'failed' ? '#f8d7da' :
                  jobStatus.status === 'processing' ? '#fff3cd' :
                  '#d1ecf1',
                color:
                  jobStatus.status === 'completed' ? '#155724' :
                  jobStatus.status === 'failed' ? '#721c24' :
                  jobStatus.status === 'processing' ? '#856404' :
                  '#0c5460'
              }}>
                {jobStatus.status.toUpperCase()}
              </span>
            </p>
            {jobStatus.error && (
              <p style={{ color: '#721c24' }}><strong>Error:</strong> {jobStatus.error}</p>
            )}
            {jobStatus.status === 'processing' && (
              <p style={{ color: '#856404', fontStyle: 'italic' }}>
                Processing your video... This may take 30-90 seconds.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '10px' }}>
        {!jobStatus || jobStatus.status === 'failed' ? (
          <button
            onClick={handleUpload}
            disabled={uploading || mediaFiles.length === 0}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              backgroundColor: uploading ? '#6c757d' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: uploading || mediaFiles.length === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            {uploading ? 'Processing...' : (audioFile ? 'Process Video' : 'Concatenate Media')}
          </button>
        ) : null}

        {jobStatus?.status === 'completed' && (
          <>
            <button
              onClick={() => jobStatus.streamUrl && handlePreviewProcessedVideo(jobStatus.streamUrl, `video_${jobStatus.jobId}.mp4`)}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                backgroundColor: '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '10px'
              }}
            >
              Preview Video
            </button>
            <button
              onClick={handleDownload}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '10px'
              }}
            >
              Download Video
            </button>
            <button
              onClick={handleReset}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Process Another Video
            </button>
          </>
        )}

        {(jobStatus?.status === 'failed' || error) && (
          <button
            onClick={handleReset}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Reset
          </button>
        )}
      </div>

      {/* Info Section */}
      <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <h4>How it works:</h4>
        <ul style={{ fontSize: '14px', color: '#666', lineHeight: '1.8' }}>
          <li>Upload multiple video segments and/or images (they will be processed in order)</li>
          <li>Images are automatically converted to 3-second video clips</li>
          <li>Optionally upload an audio file (MP3 or M4A) to overlay on the video</li>
          <li>If audio is provided, the final video will match the audio length</li>
          <li>If media is longer than audio, it will be trimmed (ensuring final segment is at least 3s)</li>
          <li>If media is shorter than audio, it will be shuffled and repeated</li>
          <li>If the final segment would be less than 3 seconds, the previous video's last frame is extended instead</li>
          <li>If no audio is provided, media will simply be concatenated together</li>
          <li>AI enhancement applies filters: unsharp (sharpening), noise reduction, contrast boost, and saturation boost</li>
          <li>Processing takes 30-90 seconds depending on media length (longer with AI enhancement)</li>
          <li>Only the last 10 processed videos are kept on the server</li>
        </ul>
      </div>

      {/* Processed Videos History */}
      <div style={{ marginTop: '40px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0 }}>Processed Videos</h3>
          <button
            onClick={loadProcessedVideos}
            disabled={loadingVideos}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loadingVideos ? 'not-allowed' : 'pointer'
            }}
          >
            {loadingVideos ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {processedVideos.length === 0 ? (
          <p style={{ color: '#666', fontStyle: 'italic' }}>No processed videos yet.</p>
        ) : (
          <div style={{ display: 'grid', gap: '10px' }}>
            {processedVideos.map((video) => (
              <div
                key={video.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '15px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '4px',
                  border: '1px solid #dee2e6'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
                    {video.filename}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    Created: {formatDate(video.createdAt)} • Size: {formatFileSize(video.size)}
                  </div>
                </div>
                <button
                  onClick={() => handlePreviewProcessedVideo(video.streamUrl, video.filename)}
                  style={{
                    padding: '8px 16px',
                    fontSize: '14px',
                    backgroundColor: '#17a2b8',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginRight: '10px'
                  }}
                >
                  Preview
                </button>
                <button
                  onClick={() => handleDownloadVideo(video.downloadUrl)}
                  style={{
                    padding: '8px 16px',
                    fontSize: '14px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Download
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewMedia && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={closePreview}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '90%',
              maxHeight: '90%',
              backgroundColor: '#000'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closePreview}
              style={{
                position: 'absolute',
                top: '-40px',
                right: '0',
                padding: '8px 16px',
                fontSize: '18px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                zIndex: 10000
              }}
            >
              ✕ Close
            </button>
            
            <div style={{ marginBottom: '10px', color: 'white', textAlign: 'center', position: 'absolute', top: '-40px', left: '0' }}>
              {previewMedia.name}
            </div>

            {previewMedia.type === 'video' ? (
              <video
                src={previewMedia.url}
                controls
                autoPlay
                style={{
                  maxWidth: '100%',
                  maxHeight: '80vh',
                  display: 'block'
                }}
              />
            ) : (
              <img
                src={previewMedia.url}
                alt="Preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: '80vh',
                  display: 'block'
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

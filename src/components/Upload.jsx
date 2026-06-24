import { useState, useRef } from 'react';
import { UploadCloud, Check, AlertTriangle } from 'lucide-react';
import { addTrack } from '../utils/indexedDb';
import { useAuth } from '../utils/AuthContext';

const Upload = ({ onUploadSuccess, navigateToLibrary }) => {
  const { user } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadState, setUploadState] = useState('idle'); // idle, processing, success, error
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  // Generate a beautiful procedural cover art using canvas and title hash
  const generateCoverArt = (title) => {
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');

    // Hash title to get unique color angles
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
      hash = title.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h1 = Math.abs(hash) % 360;
    const h2 = (h1 + 130) % 360;

    // Draw background gradient
    const grad = ctx.createLinearGradient(0, 0, 300, 300);
    grad.addColorStop(0, `hsl(${h1}, 80%, 45%)`);
    grad.addColorStop(1, `hsl(${h2}, 85%, 25%)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 300, 300);

    // Overlay pattern lines
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 4;
    for (let i = 0; i < 300; i += 30) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(300, 300 - i);
      ctx.stroke();
    }

    // Draw text initial
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 130px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Soft shadow for text
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 4;

    const initial = title.trim().charAt(0).toUpperCase() || 'H';
    ctx.fillText(initial, 150, 150);

    return canvas.toDataURL('image/jpeg', 0.85);
  };

  const formatDuration = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const processFile = (file) => {
    // Check file type
    if (!file.type.startsWith('audio/')) {
      setUploadState('error');
      setErrorMessage('Invalid file format. Please upload standard audio files (MP3, WAV, OGG) only.');
      return;
    }

    setUploadState('processing');
    setProgress(15);
    setUploadedFileName(file.name);

    // Create virtual audio element to measure actual track duration
    const objectUrl = URL.createObjectURL(file);
    const tempAudio = new Audio(objectUrl);

    tempAudio.onloadedmetadata = async () => {
      setProgress(50);

      // Parse file name to extract title/artist
      // Format examples: "Artist - Title.mp3", "Title.mp3"
      let title = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      let artist = 'Local Audio';

      const dashIndex = title.indexOf('-');
      if (dashIndex > -1) {
        artist = title.substring(0, dashIndex).trim();
        title = title.substring(dashIndex + 1).trim();
      }

      const durationStr = formatDuration(tempAudio.duration);
      setProgress(75);

      try {
        // Generate beautiful cover base64
        const coverBase64 = generateCoverArt(title);

        // Save track to IndexedDB
        const trackData = {
          title,
          artist,
          duration: durationStr,
          cover: coverBase64,
          audioBlob: file, // Store the raw Blob
          timestamp: Date.now()
        };

        await addTrack(trackData, user.Id);
        setProgress(100);
        setUploadState('success');

        // Notify parent to reload track lists
        onUploadSuccess();

        // Clean up URL object
        URL.revokeObjectURL(objectUrl);
      } catch (err) {
        console.error(err);
        setUploadState('error');
        setErrorMessage('Failed to index file locally: ' + err.message);
      }
    };

    tempAudio.onerror = () => {
      setUploadState('error');
      setErrorMessage('Could not decode audio file streams.');
      URL.revokeObjectURL(objectUrl);
    };
  };

  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const resetUploadState = () => {
    setUploadState('idle');
    setProgress(0);
    setErrorMessage('');
    setUploadedFileName('');
  };

  return (
    <div className="upload-view">
      <h1 className="header-title" style={{ textAlign: 'left', marginBottom: '16px' }}>Upload</h1>

      {uploadState === 'idle' && (
        <>
          <div
            className={`upload-dropzone ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={triggerFileSelect}
          >
            <div className="upload-dropzone-icon">
              <UploadCloud size={32} />
            </div>
            <div>
              <div className="upload-title">Drop your audio file here</div>
              <div className="upload-subtitle" style={{ marginTop: '4px' }}>
                or click to browse local files
              </div>
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', borderTop: '1px solid var(--glass-border)', width: '100%', paddingTop: '10px' }}>
              Accepts MP3, WAV, OGG
            </div>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept="audio/*"
            onChange={handleFileChange}
          />
        </>
      )}

      {uploadState === 'processing' && (
        <div className="upload-progress-container card-premium">
          <div className="upload-progress-info">
            <span style={{ fontWeight: '600', color: '#fff', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '220px' }}>
              {uploadedFileName}
            </span>
            <span style={{ color: 'var(--text-secondary)' }}>{progress}%</span>
          </div>
          <div className="upload-progress-bar-bg">
            <div
              className="upload-progress-bar-fill"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', textAlign: 'left' }}>
            Processing audio file and saving to local database...
          </div>
        </div>
      )}

      {uploadState === 'success' && (
        <div className="card-premium" style={{ textAlign: 'center', padding: '30px 20px', border: '1px solid var(--accent-green)' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(57,255,20,0.15)',
              color: 'var(--accent-green)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}
          >
            <Check size={24} />
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Track Imported!</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.5' }}>
            "{uploadedFileName}" was successfully saved to your local storage and is ready for playback.
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button
              className="empty-library-btn"
              onClick={navigateToLibrary}
              style={{ padding: '8px 16px' }}
            >
              Go to Library
            </button>
            <button
              className="theme-button"
              onClick={resetUploadState}
              style={{ padding: '8px 16px', border: '1px solid var(--glass-border)' }}
            >
              Upload More
            </button>
          </div>
        </div>
      )}

      {uploadState === 'error' && (
        <div className="card-premium" style={{ textAlign: 'center', padding: '30px 20px', border: '1px solid var(--accent-magenta)' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(255,0,127,0.15)',
              color: 'var(--accent-magenta)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}
          >
            <AlertTriangle size={24} />
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Upload Error</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.5' }}>
            {errorMessage}
          </p>
          <button
            className="empty-library-btn"
            onClick={resetUploadState}
            style={{ padding: '8px 16px', background: 'var(--text-secondary)' }}
          >
            Try Again
          </button>
        </div>
      )}

      <div className="card-premium" style={{ padding: '16px', marginTop: '24px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '8px', textAlign: 'left' }}>
          File Requirements
        </h3>
        <ul style={{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'left', paddingLeft: '16px', lineHeight: '1.6' }}>
          <li>Supports MP3, WAV, OGG, or AAC formats.</li>
          <li>For automatic tags: name your files as <code>Artist Name - Song Name.mp3</code></li>
          <li>Maximum file size depends on your browser storage allowance (usually 100MB+ per file is supported fine).</li>
        </ul>
      </div>
    </div>
  );
};

export default Upload;

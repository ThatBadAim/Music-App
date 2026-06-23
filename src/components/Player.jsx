import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const Player = ({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  isOpen,
  onClose,
  analyserRef
}) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  // Parse simulated lyrics matching index
  const lyricsList = currentTrack?.lyrics || [
    "[Analyzing local sound waves...]",
    "[Decompressing audio packets...]",
    "[Verifying organic human signals...]",
    "This track has high melodic frequency.",
    "Perfect for standard human activity.",
    "My auditory processor is satisfied.",
    "Lobe interaction: Maximum.",
    "Keep digesting the audio fluctuations.",
    "[Rhythm cycle completes successfully]"
  ];

  const currentLyricIdx = Math.min(
    Math.floor((currentTime / (duration || 30)) * lyricsList.length),
    lyricsList.length - 1
  );

  // Side Panel Canvas Audio Visualizer
  useEffect(() => {
    const analyser = analyserRef?.current;
    if (!canvasRef.current || !analyser || !isOpen) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!canvasRef.current) return;
      animationRef.current = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const barCount = 30;
      const barWidth = (width / barCount) - 2;
      let x = 0;

      // Draw center line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      for (let i = 0; i < barCount; i++) {
        // Logarithmic frequency distribution sample
        const sampleIndex = Math.floor((i / barCount) * (bufferLength * 0.6));
        const val = dataArray[sampleIndex] || 0;

        const barHeight = (val / 255) * height * 0.75;
        const hue = 180 + (i / barCount) * 120;
        ctx.fillStyle = `hsla(${hue}, 95%, 60%, ${isPlaying ? 0.85 : 0.35})`;

        const y = (height - barHeight) / 2;

        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, y, barWidth, Math.max(barHeight, 2), 2);
        } else {
          ctx.rect(x, y, barWidth, Math.max(barHeight, 2));
        }
        ctx.fill();

        x += barWidth + 2;
      }
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyserRef, isPlaying, isOpen]);

  // Scroll active lyric line into view
  const lyricRefs = useRef([]);
  useEffect(() => {
    if (lyricRefs.current[currentLyricIdx]) {
      lyricRefs.current[currentLyricIdx].scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [currentLyricIdx]);

  if (!currentTrack) return null;

  return (
    <div className={`side-panel ${isOpen ? '' : 'closed'}`}>
      <div className="lyrics-side-container">
        {/* Header */}
        <div className="lyrics-side-header">
          <span className="lyrics-side-title">Now Playing</span>
          <button className="settings-btn" onClick={onClose} style={{ padding: '4px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Art & Vinyl Info */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '16px' }}>
          <div className={`vinyl-disc-mini ${isPlaying ? 'spinning' : ''}`}>
            {currentTrack.cover ? (
              <img
                src={currentTrack.cover}
                alt=""
                style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <div className="vinyl-disc-mini-center"></div>
            )}
          </div>
          <div style={{ textAlign: 'left', overflow: 'hidden', flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {currentTrack.title}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {currentTrack.artist}
            </div>
          </div>
        </div>

        {/* Visualizer Canvas */}
        <div className="visualizer-side-container">
          <canvas
            ref={canvasRef}
            width={270}
            height={68}
            style={{ width: '100%', height: '100%', borderRadius: '8px' }}
          />
        </div>

        {/* Lyrics Content list */}
        <div className="lyrics-side-content">
          {lyricsList.map((line, idx) => (
            <div
              key={idx}
              ref={el => lyricRefs.current[idx] = el}
              className={`lyric-line-side ${idx === currentLyricIdx ? 'highlighted' : ''}`}
            >
              {line}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Player;

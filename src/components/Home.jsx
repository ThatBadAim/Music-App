import { Play, Disc, Music } from 'lucide-react';

const Home = ({ defaultTracks, userTracks, onPlayTrack, currentTrack, isPlaying }) => {

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="home-view">
      <div className="top-header-actions">
        <div className="header-greet">{getGreeting()}</div>
      </div>

      <h1 className="header-title">Home</h1>

      {/* Featured Synth Loops Section */}
      <h2 style={{ fontSize: '15px', marginBottom: '12px', textAlign: 'left', fontWeight: '700' }}>
        Featured Ambient Loops
      </h2>
      <div className="desktop-grid">
        {defaultTracks.map((track) => {
          const isCurrent = currentTrack && currentTrack.id === track.id;
          return (
            <div
              key={track.id}
              className="category-card"
              onClick={() => onPlayTrack(track)}
            >
              <div className="category-card-art">
                <img src={track.cover} alt={track.title} />
                <div className="play-badge-overlay">
                  <Play size={18} fill="#08080c" />
                </div>
                {isCurrent && isPlaying && (
                  <div
                    className="pulsing-wave-container"
                    style={{ position: 'absolute', bottom: '12px', left: '12px', background: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: '8px' }}
                  >
                    <div className="pulsing-wave-bar"></div>
                    <div className="pulsing-wave-bar"></div>
                    <div className="pulsing-wave-bar"></div>
                  </div>
                )}
              </div>
              <div className="category-card-title">{track.title}</div>
              <div className="category-card-subtitle">{track.artist}</div>
            </div>
          );
        })}
      </div>

      {/* Local Audios Section */}
      <h2 style={{ fontSize: '18px', marginBottom: '12px', textAlign: 'left', fontWeight: '700', marginTop: '16px' }}>
        Recently Added Local Files
      </h2>

      {userTracks.length === 0 ? (
        <div className="card-premium" style={{ padding: '24px', textAlign: 'center', marginBottom: '24px' }}>
          <Music size={32} style={{ margin: '0 auto 12px', color: 'var(--text-muted)' }} />
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            No local audio files uploaded yet.
          </p>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Go to the <strong>Upload</strong> tab to import your own MP3/WAV tracks directly onto this device!
          </p>
        </div>
      ) : (
        <div style={{ marginBottom: '24px' }}>
          {userTracks.slice(0, 5).map((track, idx) => {
            const isCurrent = currentTrack && currentTrack.id === track.id;
            return (
              <div
                key={track.id}
                className={`track-row ${isCurrent ? 'active' : ''}`}
                onClick={() => onPlayTrack(track)}
              >
                <div className="track-row-left">
                  <span className="track-index-num">0{idx + 1}</span>
                  <div className="track-art-small">
                    {track.cover ? (
                      <img src={track.cover} alt="" />
                    ) : (
                      <Disc size={20} className="disc-icon" />
                    )}
                  </div>
                  <div className="track-details">
                    <div className="track-title">{track.title}</div>
                    <div className="track-artist">{track.artist || 'Local Upload'}</div>
                  </div>
                </div>
                <div className="track-row-right">
                  <span className="track-duration">{track.duration || '3:00'}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info Card */}
      <div className="card-premium" style={{ padding: '16px', marginTop: '24px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '4px' }}>
          Local Database Storage
        </h3>
        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
          All uploaded files are saved securely inside your browser's private IndexedDB sandbox. Your files are kept locally on this device and are never sent to external servers.
        </p>
      </div>
    </div>
  );
};

export default Home;

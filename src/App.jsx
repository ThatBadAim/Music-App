import { useState, useEffect, useRef } from 'react';
import { Home as HomeIcon, Search as SearchIcon, ListMusic, UploadCloud as UploadIcon, Settings, Play, Pause, SkipForward, SkipBack, Shuffle, Repeat, Volume2, X, Music, Heart, AlignLeft } from 'lucide-react';
import Home from './components/Home';
import Search from './components/Search';
import Library from './components/Library';
import Upload from './components/Upload';
import Player from './components/Player';
import { getAllTracks, deleteTrack } from './utils/indexedDb';
import { playSynthTrack, stopSynthTrack, setSynthVolume, getMasterAnalyser, getAudioContext } from './utils/humanSynth';

const formatTime = (seconds) => {
  if (isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const DEFAULT_TRACKS = [
  {
    id: 'synth-earth-radio',
    title: 'Lofi Sunset Chillout',
    artist: 'Luna Eclipse',
    album: 'Acoustic Sunset',
    duration: '2:00',
    durationSec: 120,
    cover: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=400',
    lyrics: [
      "Watching the sunset fade away...",
      "Golden rays turning into gray.",
      "Soft acoustic breeze in the air,",
      "Peaceful moments we get to share.",
      "Just let the rhythm ease your mind,",
      "Leave all the busy days behind."
    ]
  },
  {
    id: 'synth-heartbeat',
    title: 'Deep Focus Ambient',
    artist: 'Zen Horizon',
    album: 'Nebula Dreams',
    duration: '2:00',
    durationSec: 120,
    cover: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?q=80&w=400',
    lyrics: [
      "Floating through ambient sky...",
      "Time is slowly drifting by.",
      "In the stillness, we find our space,",
      "Moving at a gentle pace.",
      "Calm frequencies, soft and deep,",
      "Promises we choose to keep."
    ]
  },
  {
    id: 'synth-brainwaves',
    title: 'Late Night Groove',
    artist: 'Pixel Synth',
    album: 'Retro Drive',
    duration: '2:40',
    durationSec: 160,
    cover: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=400',
    lyrics: [
      "Cruising down the neon street...",
      "Synchronizing to the beat.",
      "Midnight synthwave takes control,",
      "Stirring rhythms in your soul.",
      "Driving through the starlit glow,",
      "Moving fast and thinking slow."
    ]
  }
];

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [userTracks, setUserTracks] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);

  const [isShuffle, setIsShuffle] = useState(() => {
    return localStorage.getItem('isShuffle') === 'true';
  });
  const [isRepeat, setIsRepeat] = useState(() => {
    return localStorage.getItem('isRepeat') === 'true';
  });

  const [isPlayerOpen, setIsPlayerOpen] = useState(false); // Side lyrics panel
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [theme, setTheme] = useState('dark');

  // Interactive Features
  const [likedTrackIds, setLikedTrackIds] = useState(() => {
    const saved = localStorage.getItem('likedTrackIds');
    return saved ? JSON.parse(saved) : [];
  });

  const [audioQuality, setAudioQuality] = useState(() => {
    return localStorage.getItem('audioQuality') || 'high';
  });

  const [sleepTimer, setSleepTimer] = useState(null); // Minutes remaining

  // Audio References
  const audioRef = useRef(null);
  const audioSourceRef = useRef(null);
  const synthIntervalRef = useRef(null);
  const analyserRef = useRef(null);

  // Initialize audioRef once
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
  }, []);

  const setupAudioRouting = () => {
    const ctx = getAudioContext();
    const analyser = getMasterAnalyser();
    analyserRef.current = analyser;

    if (!audioSourceRef.current && audioRef.current) {
      try {
        const source = ctx.createMediaElementSource(audioRef.current);
        source.connect(analyser);
        audioSourceRef.current = source;
      } catch (err) {
        console.warn("Media source routing failed:", err);
      }
    }
  };

  const handleTrackEnded = () => {
    if (isRepeat) {
      if (currentTrack) {
        handlePlayTrack(currentTrack);
      }
      return;
    }
    handleNextTrack();
  };

  const handlePlayTrack = (track) => {
    setupAudioRouting();

    if (synthIntervalRef.current) {
      clearInterval(synthIntervalRef.current);
      synthIntervalRef.current = null;
    }

    const isSynth = track.id.toString().startsWith('synth-');

    if (isSynth) {
      if (audioRef.current) audioRef.current.pause();
      playSynthTrack(track.id, volume);
      setCurrentTrack(track);
      setIsPlaying(true);
      setCurrentTime(0);
      setDuration(track.durationSec || 120);

      synthIntervalRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          const limit = track.durationSec || 120;
          if (prev >= limit) {
            if (isRepeat) {
              return 0;
            } else {
              handleTrackEnded();
              return 0;
            }
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      stopSynthTrack();
      const objectUrl = URL.createObjectURL(track.audioBlob);
      if (audioRef.current) {
        audioRef.current.src = objectUrl;
        audioRef.current.play()
          .then(() => {
            setCurrentTrack(track);
            setIsPlaying(true);
          })
          .catch((err) => {
            console.error("Audio playback error:", err);
          });
      }
    }
  };

  const handleTogglePlay = () => {
    if (!currentTrack) return;
    setupAudioRouting();

    const isSynth = currentTrack.id.toString().startsWith('synth-');

    if (isPlaying) {
      if (isSynth) {
        stopSynthTrack();
        if (synthIntervalRef.current) {
          clearInterval(synthIntervalRef.current);
          synthIntervalRef.current = null;
        }
      } else {
        if (audioRef.current) audioRef.current.pause();
      }
      setIsPlaying(false);
    } else {
      if (isSynth) {
        playSynthTrack(currentTrack.id, volume);

        synthIntervalRef.current = setInterval(() => {
          setCurrentTime((prev) => {
            const limit = currentTrack.durationSec || 120;
            if (prev >= limit) {
              if (isRepeat) return 0;
              handleTrackEnded();
              return 0;
            }
            return prev + 1;
          });
        }, 1000);
      } else {
        if (audioRef.current) audioRef.current.play().catch(e => console.error(e));
      }
      setIsPlaying(true);
    }
  };

  const handleNextTrack = () => {
    const queue = [...DEFAULT_TRACKS, ...userTracks];
    if (queue.length === 0) return;

    let nextIndex = 0;
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else if (currentTrack) {
      const idx = queue.findIndex(t => t.id === currentTrack.id);
      nextIndex = (idx + 1) % queue.length;
    }
    handlePlayTrack(queue[nextIndex]);
  };

  const handlePrevTrack = () => {
    const queue = [...DEFAULT_TRACKS, ...userTracks];
    if (queue.length === 0) return;

    if (currentTime > 4) {
      if (currentTrack) {
        handlePlayTrack(currentTrack);
      }
      return;
    }

    let prevIndex = queue.length - 1;
    if (currentTrack) {
      const idx = queue.findIndex(t => t.id === currentTrack.id);
      prevIndex = (idx - 1 + queue.length) % queue.length;
    }
    handlePlayTrack(queue[prevIndex]);
  };

  const handleSeek = (newTime) => {
    if (!currentTrack) return;
    const isSynth = currentTrack.id.toString().startsWith('synth-');

    if (isSynth) {
      setCurrentTime(newTime);
    } else {
      if (audioRef.current) {
        audioRef.current.currentTime = newTime;
      }
      setCurrentTime(newTime);
    }
  };

  const loadUserTracks = async () => {
    try {
      const tracks = await getAllTracks();
      setUserTracks(tracks);
    } catch (e) {
      console.error("Error loading user tracks:", e);
    }
  };

  const handleDeleteTrack = async (id) => {
    if (currentTrack && currentTrack.id === id) {
      stopSynthTrack();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      if (synthIntervalRef.current) {
        clearInterval(synthIntervalRef.current);
      }
      setIsPlaying(false);
      setCurrentTrack(null);
    }

    try {
      await deleteTrack(id);
      loadUserTracks();
      // Clean liked list
      setLikedTrackIds((prev) => prev.filter(tid => tid !== id));
    } catch (e) {
      console.error(e);
    }
  };

  // Toggle Liked status
  const handleToggleLike = (trackId) => {
    setLikedTrackIds((prev) => {
      if (prev.includes(trackId)) {
        return prev.filter(id => id !== trackId);
      } else {
        return [...prev, trackId];
      }
    });
  };

  const getThemeClass = () => {
    if (theme === 'cyberpunk') return 'theme-cyberpunk';
    if (theme === 'galactic-light') return 'theme-galactic-light';
    return '';
  };

  useEffect(() => {
    loadUserTracks();
  }, []);

  // Save interactive settings to localStorage
  useEffect(() => {
    localStorage.setItem('likedTrackIds', JSON.stringify(likedTrackIds));
  }, [likedTrackIds]);

  useEffect(() => {
    localStorage.setItem('audioQuality', audioQuality);
  }, [audioQuality]);

  useEffect(() => {
    localStorage.setItem('isShuffle', isShuffle);
  }, [isShuffle]);

  useEffect(() => {
    localStorage.setItem('isRepeat', isRepeat);
  }, [isRepeat]);

  // Volume synchronization
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
    setSynthVolume(volume);
  }, [volume]);

  // Sleep Timer Countdown Loop
  useEffect(() => {
    if (sleepTimer === null) return;
    if (sleepTimer <= 0) {
      if (isPlaying) handleTogglePlay();
      setSleepTimer(null);
      return;
    }

    const timer = setInterval(() => {
      setSleepTimer((prev) => {
        if (prev && prev <= 1) {
          if (isPlaying) {
            // Safe call toggle play
            if (audioRef.current) audioRef.current.pause();
            stopSynthTrack();
            setIsPlaying(false);
            if (synthIntervalRef.current) {
              clearInterval(synthIntervalRef.current);
            }
          }
          return null;
        }
        return prev ? prev - 1 : null;
      });
    }, 60000); // Decrease every minute

    return () => clearInterval(timer);
  }, [sleepTimer, isPlaying]);

  // Audio element events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (currentTrack && !currentTrack.id.toString().startsWith('synth-')) {
        setCurrentTime(audio.currentTime);
      }
    };

    const handleDurationChange = () => {
      if (currentTrack && !currentTrack.id.toString().startsWith('synth-')) {
        setDuration(audio.duration || 0);
      }
    };

    const handleEnded = () => {
      handleTrackEnded();
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentTrack, isRepeat, isShuffle, userTracks]);

  const isCurrentTrackLiked = currentTrack && likedTrackIds.includes(currentTrack.id);
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`app-container ${getThemeClass()}`}>
      <div className="main-layout">

        {/* Left Sidebar Navigation */}
        <nav className="desktop-sidebar">
          <div className="sidebar-logo">
            <Music size={20} style={{ color: 'var(--accent-green)' }} />
            <span className="sidebar-logo-text">SoundStream</span>
          </div>

          <div className="sidebar-nav-list">
            <button
              className={`sidebar-nav-item ${activeTab === 'home' ? 'active' : ''}`}
              onClick={() => setActiveTab('home')}
            >
              <HomeIcon size={16} />
              <span>Home</span>
            </button>

            <button
              className={`sidebar-nav-item ${activeTab === 'search' ? 'active' : ''}`}
              onClick={() => setActiveTab('search')}
            >
              <SearchIcon size={16} />
              <span>Search</span>
            </button>

            <button
              className={`sidebar-nav-item ${activeTab === 'library' ? 'active' : ''}`}
              onClick={() => setActiveTab('library')}
            >
              <ListMusic size={16} />
              <span>Library</span>
            </button>

            <button
              className={`sidebar-nav-item ${activeTab === 'upload' ? 'active' : ''}`}
              onClick={() => setActiveTab('upload')}
            >
              <UploadIcon size={16} />
              <span>Upload</span>
            </button>
          </div>

          <div className="sidebar-footer">
            <button
              className="sidebar-nav-item"
              onClick={() => setIsSettingsOpen(true)}
            >
              <Settings size={16} />
              <span>Settings</span>
            </button>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="content-viewport">
          {activeTab === 'home' && (
            <Home
              defaultTracks={DEFAULT_TRACKS}
              userTracks={userTracks}
              onPlayTrack={handlePlayTrack}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
            />
          )}

          {activeTab === 'search' && (
            <Search
              defaultTracks={DEFAULT_TRACKS}
              userTracks={userTracks}
              onPlayTrack={handlePlayTrack}
              currentTrack={currentTrack}
            />
          )}

          {activeTab === 'library' && (
            <Library
              userTracks={userTracks}
              onPlayTrack={handlePlayTrack}
              onDeleteTrack={handleDeleteTrack}
              currentTrack={currentTrack}
              likedTrackIds={likedTrackIds}
              onToggleLike={handleToggleLike}
              defaultTracks={DEFAULT_TRACKS}
              navigateToUpload={() => setActiveTab('upload')}
            />
          )}

          {activeTab === 'upload' && (
            <Upload
              onUploadSuccess={loadUserTracks}
              navigateToLibrary={() => setActiveTab('library')}
            />
          )}
        </main>

        {/* Right Sidebar Lyrics Panel */}
        <Player
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          isOpen={isPlayerOpen}
          onClose={() => setIsPlayerOpen(false)}
          analyserRef={analyserRef}
        />
      </div>

      {/* Persistent Bottom Control Player Bar */}
      {currentTrack && (
        <footer className="persistent-player">
          {/* Left Panel */}
          <div className="player-left">
            <div className="player-track-art">
              {currentTrack.cover ? (
                <img src={currentTrack.cover} alt="" />
              ) : (
                <div style={{ background: 'var(--bg-primary)', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Music size={16} />
                </div>
              )}
            </div>
            <div className="player-track-info">
              <div className="player-track-title">{currentTrack.title}</div>
              <div className="player-track-artist">{currentTrack.artist || 'Local Upload'}</div>
            </div>
            <button
              className="settings-btn"
              style={{ marginLeft: '12px' }}
              onClick={() => handleToggleLike(currentTrack.id)}
            >
              <Heart
                size={14}
                fill={isCurrentTrackLiked ? 'var(--accent-green)' : 'none'}
                stroke={isCurrentTrackLiked ? 'var(--accent-green)' : 'var(--text-secondary)'}
              />
            </button>
          </div>

          {/* Center Panel */}
          <div className="player-center">
            <div className="player-controls-row">
              <button
                className={`player-btn-secondary ${isShuffle ? 'active' : ''}`}
                onClick={() => setIsShuffle(!isShuffle)}
                style={{ padding: '4px' }}
              >
                <Shuffle size={14} />
              </button>

              <button className="player-btn-primary" onClick={handlePrevTrack} style={{ padding: '4px' }}>
                <SkipBack size={16} fill="currentColor" />
              </button>

              <button
                className="player-btn-play"
                onClick={handleTogglePlay}
              >
                {isPlaying ? (
                  <Pause size={14} fill="currentColor" stroke="none" />
                ) : (
                  <Play size={14} fill="currentColor" stroke="none" style={{ marginLeft: '1px' }} />
                )}
              </button>

              <button className="player-btn-primary" onClick={handleNextTrack} style={{ padding: '4px' }}>
                <SkipForward size={16} fill="currentColor" />
              </button>

              <button
                className={`player-btn-secondary ${isRepeat ? 'active' : ''}`}
                onClick={() => setIsRepeat(!isRepeat)}
                style={{ padding: '4px' }}
              >
                <Repeat size={14} />
              </button>
            </div>

            <div className="player-timeline-row">
              <span className="timeline-time">{formatTime(currentTime)}</span>

              <div className="progress-slider-wrapper" style={{ flex: 1 }}>
                <div
                  className="progress-slider-fill"
                  style={{ width: `${progressPercent}%` }}
                ></div>
                <div
                  className="progress-slider-thumb"
                  style={{ left: `${progressPercent}%` }}
                ></div>
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  step="0.1"
                  value={currentTime || 0}
                  className="progress-slider-input"
                  onChange={(e) => handleSeek(parseFloat(e.target.value))}
                />
              </div>

              <span className="timeline-time">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right Panel */}
          <div className="player-right">
            <button
              className={`player-btn-secondary ${isPlayerOpen ? 'active' : ''}`}
              onClick={() => setIsPlayerOpen(!isPlayerOpen)}
              title="Lyrics & Visualizer"
              style={{ padding: '4px' }}
            >
              <AlignLeft size={16} />
            </button>

            <div className="player-volume-wrapper">
              <Volume2 size={14} style={{ color: 'var(--text-secondary)' }} />
              <div className="volume-slider-wrapper">
                <div
                  className="volume-slider-fill"
                  style={{ width: `${volume * 100}%` }}
                ></div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  className="volume-slider-input"
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                />
              </div>
            </div>
          </div>
        </footer>
      )}

      {/* Settings Drawer Panel */}
      <div className={`settings-drawer ${isSettingsOpen ? 'open' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700' }}>Settings</h2>
          <button className="settings-btn" onClick={() => setIsSettingsOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* Themes section */}
        <div className="settings-section">
          <div className="settings-section-title">Color Skin Systems</div>
          <div className="theme-options-grid">
            <button
              className={`theme-button ${theme === 'dark' ? 'active' : ''}`}
              onClick={() => setTheme('dark')}
            >
              Classic Dark
            </button>
            <button
              className={`theme-button ${theme === 'cyberpunk' ? 'active' : ''}`}
              onClick={() => setTheme('cyberpunk')}
            >
              Cyberpunk
            </button>
            <button
              className={`theme-button ${theme === 'galactic-light' ? 'active' : ''}`}
              onClick={() => setTheme('galactic-light')}
            >
              Galactic Light
            </button>
          </div>
        </div>

        {/* Audio Quality Section */}
        <div className="settings-section">
          <div className="settings-section-title">Audio Streaming Quality</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[
              { id: 'low', label: 'Low (96 kbps)' },
              { id: 'normal', label: 'Normal (160 kbps)' },
              { id: 'high', label: 'High (320 kbps)' },
              { id: 'lossless', label: 'Lossless (Extreme)' }
            ].map((q) => (
              <button
                key={q.id}
                className={`theme-button ${audioQuality === q.id ? 'active' : ''}`}
                style={{ width: '100%', textAlign: 'left', padding: '8px 12px' }}
                onClick={() => setAudioQuality(q.id)}
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sleep Timer Section */}
        <div className="settings-section">
          <div className="settings-section-title">Sleep Timer</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {[
              { value: null, label: 'Off' },
              { value: 5, label: '5m' },
              { value: 15, label: '15m' },
              { value: 30, label: '30m' },
              { value: 60, label: '60m' }
            ].map((t, idx) => (
              <button
                key={idx}
                className={`theme-button ${sleepTimer === t.value ? 'active' : ''}`}
                style={{ padding: '6px 10px', fontSize: '10px' }}
                onClick={() => setSleepTimer(t.value)}
              >
                {t.label}
              </button>
            ))}
          </div>
          {sleepTimer !== null && (
            <div style={{ fontSize: '11px', color: 'var(--accent-green)', marginTop: '8px', fontWeight: '600' }}>
              Pausing playback in {sleepTimer}m...
            </div>
          )}
        </div>

        {/* Device Metrics */}
        <div className="settings-section">
          <div className="settings-section-title">Device Metrics</div>
          <div className="card-premium" style={{ padding: '12px', fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Track Count:</span>
              <span>{userTracks.length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Liked Songs:</span>
              <span style={{ color: 'var(--accent-green)' }}>{likedTrackIds.length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Local Storage:</span>
              <span>Active</span>
            </div>
          </div>
        </div>

        <div className="settings-section" style={{ marginTop: 'auto', paddingTop: '10px' }}>
          <p style={{ fontSize: '10px', color: 'var(--text-muted)', textAlign: 'center' }}>
            SoundStream v1.1.0<br />
            Standard Desktop Audio Client
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;

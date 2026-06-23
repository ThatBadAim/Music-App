import { useState } from 'react';
import { Trash2, Heart, Music, Plus, Disc, ListMusic } from 'lucide-react';

const Library = ({
  userTracks,
  onPlayTrack,
  onDeleteTrack,
  currentTrack,
  likedTrackIds,
  onToggleLike,
  defaultTracks,
  navigateToUpload
}) => {
  const [viewLikedOnly, setViewLikedOnly] = useState(false);
  const allTracks = [...defaultTracks, ...userTracks];

  // Filter queue based on tab selection
  const displayTracks = viewLikedOnly
    ? allTracks.filter(track => likedTrackIds.includes(track.id))
    : userTracks;

  return (
    <div className="library-view">
      <h1 className="header-title" style={{ textAlign: 'left', marginBottom: '16px' }}>Library</h1>

      {/* Playlist Grid Selection */}
      <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', marginBottom: '24px', paddingBottom: '4px' }}>
        {/* Local Tracks card */}
        <div
          className="card-premium"
          onClick={() => setViewLikedOnly(false)}
          style={{
            flexShrink: 0,
            width: '150px',
            padding: '16px',
            cursor: 'pointer',
            border: !viewLikedOnly ? '1px solid var(--accent-green)' : '1px solid var(--border-subtle)',
            background: !viewLikedOnly ? 'var(--bg-hover)' : 'var(--bg-tertiary)'
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-primary)',
              marginBottom: '16px'
            }}
          >
            <ListMusic size={18} />
          </div>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>Local Tracks</div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {userTracks.length} tracks
          </div>
        </div>

        {/* Liked Songs card */}
        <div
          className="card-premium"
          onClick={() => setViewLikedOnly(true)}
          style={{
            flexShrink: 0,
            width: '150px',
            padding: '16px',
            cursor: 'pointer',
            border: viewLikedOnly ? '1px solid var(--accent-green)' : '1px solid var(--border-subtle)',
            background: viewLikedOnly ? 'var(--bg-hover)' : 'var(--bg-tertiary)'
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: 'rgba(29, 185, 84, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-green)',
              marginBottom: '16px'
            }}
          >
            <Heart size={18} fill="currentColor" stroke="none" />
          </div>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>Liked Songs</div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {likedTrackIds.length} tracks
          </div>
        </div>
      </div>

      {/* Header bar section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '700' }}>
          {viewLikedOnly ? 'Liked Songs' : 'Local Tracks on Device'}
        </h2>
        {!viewLikedOnly && (
          <button
            onClick={navigateToUpload}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Plus size={14} /> Add Music
          </button>
        )}
      </div>

      {/* Tracks Lists */}
      {displayTracks.length === 0 ? (
        <div className="empty-library-state card-premium">
          {viewLikedOnly ? (
            <>
              <Heart size={36} style={{ color: 'var(--text-muted)' }} />
              <div style={{ fontWeight: '700', marginTop: '12px' }}>No Liked Songs Yet</div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                Tap the heart icon on any preloaded loop or uploaded track to save them in your favorites list.
              </p>
            </>
          ) : (
            <>
              <Music size={36} style={{ color: 'var(--text-muted)' }} />
              <div style={{ fontWeight: '700', marginTop: '12px' }}>Your Library is Empty</div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                Import audio files from your computer so you can play them locally on this device.
              </p>
              <button
                className="empty-library-btn"
                onClick={navigateToUpload}
                style={{ background: 'var(--text-secondary)', color: '#000', marginTop: '12px' }}
              >
                Import Local Files
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="library-track-list">
          {displayTracks.map((track, index) => {
            const isCurrent = currentTrack && currentTrack.id === track.id;
            return (
              <div
                key={track.id}
                className={`track-row ${isCurrent ? 'active' : ''}`}
                style={{ paddingRight: '4px' }}
              >
                <div
                  className="track-row-left"
                  onClick={() => onPlayTrack(track)}
                  style={{ cursor: 'pointer' }}
                >
                  <span className="track-index-num">{index + 1}</span>
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
                  <span className="track-duration" style={{ marginRight: '6px' }}>
                    {track.duration || '3:00'}
                  </span>

                  {/* If viewing Liked songs, Heart toggle removes it. If viewing Local songs, trash deletes it from disk */}
                  {viewLikedOnly ? (
                    <button
                      className="track-action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleLike(track.id);
                      }}
                      title="Remove from Liked Songs"
                      style={{ color: 'var(--accent-green)' }}
                    >
                      <Heart size={15} fill="currentColor" stroke="none" />
                    </button>
                  ) : (
                    <button
                      className="track-action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteTrack(track.id);
                      }}
                      title="Delete track from local storage"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Library;

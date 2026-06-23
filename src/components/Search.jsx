import { useState } from 'react';
import { Search as SearchIcon, Disc, Play } from 'lucide-react';

const Search = ({ defaultTracks, userTracks, onPlayTrack, currentTrack }) => {
  const [query, setQuery] = useState('');
  const allTracks = [...defaultTracks, ...userTracks];

  // Simple filter
  const filteredTracks = allTracks.filter(
    (track) =>
      track.title.toLowerCase().includes(query.toLowerCase()) ||
      (track.artist && track.artist.toLowerCase().includes(query.toLowerCase())) ||
      (track.album && track.album.toLowerCase().includes(query.toLowerCase()))
  );

  const genres = [
    { name: 'Lofi & Chill', color: '#2b4c6f', queryText: 'lofi' },
    { name: 'Synthwave', color: '#4b3b6f', queryText: 'synth' },
    { name: 'Ambient', color: '#2f6b52', queryText: 'ambient' },
    { name: 'Local Tracks', color: '#6b5c3b', queryText: 'local' },
    { name: 'Acoustic', color: '#6b3b4b', queryText: 'acoustic' },
    { name: 'Relaxing', color: '#2f5c6b', queryText: 'sunset' },
  ];

  const handleGenreClick = (genreQuery) => {
    setQuery(genreQuery);
  };

  return (
    <div className="search-view">
      <h1 className="header-title" style={{ textAlign: 'left', marginBottom: '16px' }}>Search</h1>

      <div className="search-input-wrapper">
        <SearchIcon className="search-input-icon" size={20} />
        <input
          type="text"
          className="search-input"
          placeholder="Search songs, artists, or albums..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {query.trim().length > 0 ? (
        <div className="search-results" style={{ marginTop: '10px' }}>
          <h2 style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '12px', textAlign: 'left' }}>
            Search Results
          </h2>
          {filteredTracks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <p>No tracks matching "{query}" found.</p>
              <p style={{ fontSize: '12px', marginTop: '6px' }}>Please double check the spelling.</p>
            </div>
          ) : (
            filteredTracks.map((track) => {
              const isCurrent = currentTrack && currentTrack.id === track.id;
              return (
                <div
                  key={track.id}
                  className={`track-row ${isCurrent ? 'active' : ''}`}
                  onClick={() => onPlayTrack(track)}
                >
                  <div className="track-row-left">
                    <div className="track-art-small">
                      {track.cover ? (
                        <img src={track.cover} alt="" />
                      ) : (
                        <Disc size={20} className="disc-icon" />
                      )}
                    </div>
                    <div className="track-details">
                      <div className="track-title">{track.title}</div>
                      <div className="track-artist">{track.artist || 'Local Track'}</div>
                    </div>
                  </div>
                  <div className="track-row-right">
                    <span className="track-duration">{track.duration || '3:00'}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="search-genres-explore" style={{ marginTop: '10px' }}>
          <h2 style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '12px', textAlign: 'left' }}>
            Browse All Genres
          </h2>
          <div className="genre-grid">
            {genres.map((genre) => (
              <div
                key={genre.name}
                className="genre-card"
                style={{ background: genre.color }}
                onClick={() => handleGenreClick(genre.queryText)}
              >
                <span>{genre.name}</span>
                <div className="genre-card-art-dec">
                  <Play size={20} fill="rgba(255, 255, 255, 0.4)" stroke="none" />
                </div>
              </div>
            ))}
          </div>

          <div className="card-premium" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Disc size={20} style={{ color: 'var(--text-secondary)' }} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '13px', fontWeight: '700' }}>Local Player Active</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>You can search through both preloaded ambient tracks and your custom uploads.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Search;

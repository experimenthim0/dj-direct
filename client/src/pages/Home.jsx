import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

function Home({ navigate }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [recentRooms, setRecentRooms] = useState([]);

  useEffect(() => {
    // Load and filter recent rooms (3 hour limit)
    const stored = JSON.parse(localStorage.getItem('dj_direct_recent_rooms') || '[]');
    const now = Date.now();
    const threeHours = 3 * 60 * 60 * 1000;
    
    const validRooms = stored.filter(room => (now - room.timestamp) < threeHours);
    setRecentRooms(validRooms);
    
    // Cleanup storage if needed
    if (validRooms.length !== stored.length) {
      localStorage.setItem('dj_direct_recent_rooms', JSON.stringify(validRooms));
    }
  }, []);

  const createRoom = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      const data = await res.json();
      if (data.shortId) {
        // Save to recent rooms
        const newRecent = [
          { shortId: data.shortId, name: data.name, timestamp: Date.now() },
          ...recentRooms
        ].slice(0, 5); // Keep top 5
        
        localStorage.setItem('dj_direct_recent_rooms', JSON.stringify(newRecent));
        navigate(`/dj/${data.shortId}`);
      }
    } catch (error) {
      console.error('Error creating room:', error);
      alert('Failed to connect to server. Is it running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container animate-in" style={{ paddingTop: '10vh' }}>
      <div className="glass-card" style={{ textAlign: 'center' }}>
        <h1 className="logo">DJ-DIRECT</h1>
        <p style={{ color: 'var(--text-dim)', marginBottom: '30px' }}>
          Create a temporary 3-hour digital bridge for your crowd.
        </p>

        <form onSubmit={createRoom} style={{ marginBottom: '40px' }}>
          <div className="input-group">
            <label>Event / DJ Name</label>
            <input 
              type="text" 
              placeholder="e.g. Wedding Mix 2024" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="neon-btn" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Setting up booth...' : 'Open DJ Booth'}
          </button>
        </form>

        {recentRooms.length > 0 && (
          <div style={{ textAlign: 'left', marginTop: '20px' }}>
            <label style={{ display: 'block', color: 'var(--text-dim)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '10px' }}>
              Recently Opened Booths
            </label>
            {recentRooms.map(room => (
              <div 
                key={room.shortId} 
                className="request-card animate-in" 
                style={{ padding: '12px 16px', cursor: 'pointer', borderColor: 'var(--secondary)' }}
                onClick={() => navigate(`/dj/${room.shortId}`)}
              >
                <div className="request-info">
                  <div className="request-title">{room.name}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--secondary)' }}>ID: {room.shortId}</div>
                </div>
                <div style={{ color: 'var(--secondary)', fontSize: '0.8rem' }}>RESUME</div>
              </div>
            ))}
          </div>
        )}

        <p style={{ marginTop: '40px', fontSize: '0.8rem', color: '#444' }}>
          No login required. Booth auto-deletes after 3 hours.
        </p>

        <hr style={{ margin: '40px 0', border: 'none', height: '1px', background: 'var(--glass-border)' }} />

        <div style={{ textAlign: 'left' }}>
          <h2 style={{ fontSize: '1.2rem', color: 'var(--secondary)', marginBottom: '15px' }}>What is DJ-Direct?</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)', lineHeight: '1.6', marginBottom: '20px' }}>
            DJ-Direct is a high-tech "digital bridge" for traditional DJ setups. It allows guests to send song requests directly to your dashboard via a simple QR code, eliminating the need for a crowded DJ booth.
          </p>

          <h3 style={{ fontSize: '1rem', color: 'var(--primary)', marginBottom: '10px' }}>How it works:</h3>
          <ul style={{ fontSize: '0.9rem', color: 'var(--text-dim)', paddingLeft: '20px', lineHeight: '1.8' }}>
            <li><b>DJ:</b> Create a room and show your unique QR code.</li>
            <li><b>Guest:</b> Scans the QR, searches for any song on YouTube, and hits "Send".</li>
            <li><b>Dashboard:</b> Requests pop up instantly on your screen with a copy-to-clipboard button.</li>
            <li><b>Offline Workflow:</b> You copy the title, find the MP3 in your local library, and play it!</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Home;



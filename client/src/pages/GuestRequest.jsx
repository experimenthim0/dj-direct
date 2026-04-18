import { Search, Send, CheckCircle2, PauseCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../config';

function GuestRequest({ shortId, navigate }) {
  const [room, setRoom] = useState(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(null); // ID of sent song
  const [deviceId, setDeviceId] = useState('');

  useEffect(() => {
    // Persistent Device ID for anti-spam
    let dId = localStorage.getItem('dj_direct_device_id');
    if (!dId) {
      dId = Math.random().toString(36).substring(2, 15);
      localStorage.setItem('dj_direct_device_id', dId);
    }
    setDeviceId(dId);

    // Fetch room details
    fetch(`${API_BASE_URL}/api/rooms/${shortId}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          alert('Booth not found or expired.');
          navigate('/');
        } else {
          setRoom(data.room);
          
          const socket = io(API_BASE_URL);
          socket.emit('join-room', data.room._id);
          
          socket.on('queue-status-updated', ({ requestsEnabled }) => {
            setRoom(prev => ({ ...prev, requestsEnabled }));
          });

          return () => socket.disconnect();
        }
      });
  }, [shortId]);

  const searchSongs = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendRequest = async (song) => {
    // Check local cooldown
    const cooldownKey = `dj_direct_cooldown_${room._id}`;
    const history = JSON.parse(localStorage.getItem(cooldownKey) || '{}');
    const now = Date.now();

    if (history[song.title] && (now - history[song.title]) < 5 * 60 * 1000) {
      const remaining = Math.ceil((5 * 60 * 1000 - (now - history[song.title])) / 1000 / 60);
      alert(`You already requested this song! Please wait ${remaining} more minutes.`);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: room._id,
          title: song.title,
          thumbnail: song.thumbnail,
          deviceId
        })
      });
      const data = await res.json();
      
      if (res.status === 429) {
        alert(data.error);
      } else if (data._id) {
        // Save to cooldown history
        const updatedHistory = { ...history, [song.title]: Date.now() };
        localStorage.setItem(cooldownKey, JSON.stringify(updatedHistory));
        
        setSent(song.id);
        setTimeout(() => setSent(null), 3000);
      }
    } catch (error) {
      console.error('Request error:', error);
    }
  };

  if (!room) return <div className="container">Joining booth...</div>;

  return (
    <div className="container animate-in">
      <header style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 className="logo" style={{ fontSize: '1.5rem', marginBottom: '5px' }}>DJ-DIRECT</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Requesting at <b>{room.name}</b></p>
      </header>

      <form onSubmit={searchSongs} className="input-group" style={{ position: 'relative' }}>
        <input 
          type="text" 
          placeholder={room.requestsEnabled ? "Search song or artist..." : "Queue is paused..."}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ paddingRight: '50px' }}
          disabled={!room.requestsEnabled}
        />
        <button 
          type="submit" 
          style={{ 
            position: 'absolute', 
            right: '8px', 
            top: '8px', 
            background: 'var(--primary)', 
            color: 'white',
            padding: '8px',
            borderRadius: '8px'
          }}
          disabled={loading || !room.requestsEnabled}
        >
          <Search size={18} />
        </button>
      </form>

      {!room.requestsEnabled && (
        <div className="animate-in fade-in zoom-in-95 duration-500 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-6 flex items-center gap-3 text-yellow-500">
          <PauseCircle size={24} />
          <div>
            <p className="font-bold text-sm">Queue is Paused</p>
            <p className="text-xs opacity-80">The DJ has temporarily stopped new requests. Check back in a few!</p>
          </div>
        </div>
      )}

      <div className="results-list">
        {loading && <p style={{ textAlign: 'center', color: 'var(--text-dim)' }}>Searching YouTube...</p>}
        
        {results.map((song) => (
          <div key={song.id} className="request-card animate-in" style={{ padding: '12px' }}>
            <img src={song.thumbnail} alt="" className="thumb" style={{ width: '50px', height: '50px' }} />
            <div className="request-info">
              <div className="request-title" style={{ fontSize: '0.9rem', lineHeight: '1.2' }}>{song.title}</div>
            </div>
            <button 
              className={sent === song.id ? "neon-btn-cyan" : "neon-btn"}
              style={{ padding: '8px 12px', fontSize: '0.8rem' }}
              onClick={() => sendRequest(song)}
              disabled={sent === song.id || !room.requestsEnabled}
            >
              {sent === song.id ? <CheckCircle2 size={16} /> : <Send size={16} />}
            </button>
          </div>
        ))}
      </div>

      <p style={{ textAlign: 'center', marginTop: '30px', color: '#333', fontSize: '0.7rem' }}>
        Village-Safe Mode: Title Only Shared with DJ
      </p>
    </div>
  );
}

export default GuestRequest;

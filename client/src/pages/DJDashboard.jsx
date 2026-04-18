import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import QRCode from 'qrcode';
import { Copy, Trash2, QrCode as QrIcon, Clock, PlusCircle, Pause, Play } from 'lucide-react';

import { API_BASE_URL } from '../config';

function DJDashboard({ shortId, navigate }) {
  const [data, setData] = useState(null);
  const [requests, setRequests] = useState([]);
  const [showQR, setShowQR] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [timeLeft, setTimeLeft] = useState('');
  const [now, setNow] = useState(Date.now());
  
  const socketRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    fetch(`${API_BASE_URL}/api/rooms/${shortId}`)
      .then(res => res.json())
      .then(resData => {
        if (!isMounted) return;

        if (resData.error) {
          alert(resData.error);
          navigate('/');
        } else {
          setData(resData.room);
          setRequests(resData.requests);
          
          socketRef.current = io(API_BASE_URL);
          socketRef.current.emit('join-room', resData.room._id);
          
          socketRef.current.on('new-request', (req) => {
            setRequests(prev => {
              if (prev.some(r => r._id === req._id)) return prev;
              return [req, ...prev];
            });
          });

          socketRef.current.on('request-deleted', (id) => {
            setRequests(prev => prev.filter(r => r._id !== id));
          });
          
          socketRef.current.on('queue-status-updated', ({ requestsEnabled }) => {
            setData(prev => ({ ...prev, requestsEnabled }));
          });
        }
      });

    return () => {
      isMounted = false;
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [shortId, navigate]);

  useEffect(() => {
    if (!data?.expiresAt) return;

    const calculateTime = () => {
      const expiry = new Date(data.expiresAt).getTime();
      const diff = expiry - Date.now();

      if (diff <= 0) {
        setTimeLeft('EXPIRED');
        return;
      }

      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`);
    };

    calculateTime();
    const timer = setInterval(() => {
      setNow(Date.now());
      calculateTime();
    }, 1000);

    return () => clearInterval(timer);
  }, [data?.expiresAt]);

  const guestUrl = `${window.location.origin}/r/${shortId}`;
  useEffect(() => {
    if (guestUrl) {
      QRCode.toDataURL(guestUrl, { width: 300, margin: 2 })
        .then(setQrDataUrl)
        .catch(err => console.error('QR Error:', err));
    }
  }, [guestUrl]);

  const deleteRequest = async (id) => {
    try {
      await fetch(`${API_BASE_URL}/api/requests/${id}`, { method: 'DELETE' });
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const extendSession = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/rooms/${shortId}/extend`, { method: 'PATCH' });
      const resData = await res.json();
      if (resData.expiresAt) {
        setData(prev => ({ ...prev, expiresAt: resData.expiresAt }));
      }
    } catch (error) {
      console.error('Extend error:', error);
    }
  };

  const toggleQueue = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/rooms/${shortId}/toggle-requests`, { method: 'PATCH' });
      const resData = await res.json();
      if (resData.hasOwnProperty('requestsEnabled')) {
        setData(prev => ({ ...prev, requestsEnabled: resData.requestsEnabled }));
      }
    } catch (error) {
      console.error('Toggle error:', error);
    }
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((now - new Date(date)) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ago`;
  };

  if (!data) return <div className="p-8 text-center text-gray-500 animate-pulse">Loading Dashboard...</div>;

  return (
    <>
    <div className="max-w-4xl mx-auto p-4 md:p-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-2">
        <div>
          <p className="logo">DJ-DIRECT</p>
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-wide text-white capitalize">{data.name}</h1>
          <div className="flex items-center gap-4 mt-1">
            <p className="text-gray-400 text-xs font-mono">BOOTH: {shortId}</p>
            <div className={`flex items-center gap-1.5 text-xs font-bold ${timeLeft === 'EXPIRED' ? 'text-red-500' : 'text-cyan-400'}`}>
              <Clock size={14} />
              <span>{timeLeft}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={toggleQueue}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-2 rounded-full transition-all active:scale-95 ${
              data.requestsEnabled 
                ? 'border-yellow-500/80 text-yellow-400 hover:bg-yellow-500/10' 
                : 'border-green-500/80 text-green-400 hover:bg-green-500/10'
            }`}
          >
            {data.requestsEnabled ? <><Pause size={16} /> PAUSE QUEUE</> : <><Play size={16} /> RESUME QUEUE</>}
          </button>
          <button 
            onClick={extendSession}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold border-2 border-pink-500/80 text-pink-400 rounded-full hover:bg-pink-500/10 transition-all active:scale-95"
          >
            <PlusCircle size={16} /> +30M
          </button>
          <button 
            onClick={() => setShowQR(!showQR)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-pink-500 text-white rounded-full hover:bg-pink-400 transition-all active:scale-95"
          >
            <QrIcon size={16} /> {showQR ? 'HIDE' : 'QR CODE'}
          </button>
        </div>
      </header>

      {/* QR Code Card */}
      {showQR && (
        <div className="bg-white rounded-2xl p-8 mb-8 flex flex-col items-center animate-in zoom-in-95 duration-300">
          <p className="text-black font-black mb-4 tracking-widest text-sm">GUESTS: SCAN TO REQUEST</p>
          <div className="bg-white p-3 rounded-xl shadow-2xl border border-gray-100">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="Room QR" className="w-48 h-48" />
            ) : (
              <div className="w-48 h-48 bg-gray-100 animate-pulse" />
            )}
          </div>
          <p className="text-gray-400 mt-4 text-xs font-mono">{guestUrl}</p>
        </div>
      )}

      {/* Main Queue */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
        <h3 className="text-lg font-bold text-gray-200 mb-6 flex items-center gap-2">
          Live Queue <span className="bg-white/10 px-2 py-0.5 rounded text-sm font-mono">{requests.length}</span>
        </h3>
        
        {requests.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-gray-500 italic">No requests yet. Flash the QR code!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <div 
                key={req._id} 
                className="group flex items-center gap-4 p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all animate-in slide-in-from-top-2"
              >
                {/* {req.thumbnail && (
                  <img src={req.thumbnail} alt="" className="w-14 h-14 rounded-lg object-cover shadow-lg" />
                )}
                 */}
                <div className="flex-1 min-w-0">
                  <div className="text-gray-100 font-medium truncate leading-tight mb-1 text-sm">
                    {req.title}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-gray-500 tracking-wider">
                      {getTimeAgo(req.createdAt)}
                    </span>
                    <button 
                      onClick={() => navigator.clipboard.writeText(req.title)}
                      className="flex items-center gap-1 text-[10px] font-bold text-cyan-500/70 hover:text-cyan-400 transition-colors uppercase"
                    >
                      <Copy size={12} /> Copy
                    </button>
                  </div>
                </div>

                <button 
                  onClick={() => deleteRequest(req._id)}
                  className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
</div>
      <footer className=" text-center fixed bottom-1 left-0 right-0 bg-white/5 backdrop-blur-xl border border-white/10  p-1">
        <p className="text-[10px] font-black  text-gray-600">
          DJ-DIRECT Made with ❤️ by <a href="https://nikhim.me">Nikhil Yadav</a>
        </p>
      </footer>
    </>
  );
}

export default DJDashboard;
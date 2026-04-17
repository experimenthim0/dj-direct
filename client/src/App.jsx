import React, { useState, useEffect } from 'react';
import DJDashboard from './pages/DJDashboard';
import GuestRequest from './pages/GuestRequest';
import Home from './pages/Home';

function App() {
  const [route, setRoute] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setRoute(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path) => {
    window.history.pushState({}, '', path);
    setRoute(path);
  };

  // Simple routing logic
  if (route === '/') {
    return <Home navigate={navigate} />;
  }

  if (route.startsWith('/dj/')) {
    const shortId = route.split('/')[2];
    return <DJDashboard shortId={shortId} navigate={navigate} />;
  }

  if (route.startsWith('/r/')) {
    const shortId = route.split('/')[2];
    return <GuestRequest shortId={shortId} navigate={navigate} />;
  }

  return (
    <div className="container" style={{ textAlign: 'center', paddingTop: '100px' }}>
      <h1 className="logo">404</h1>
      <p>Room not found or invalid URL.</p>
      <button className="neon-btn" onClick={() => navigate('/')} style={{ marginTop: '20px' }}>Go Home</button>
    </div>
  );
}

export default App;

import { useState, useEffect } from 'react'

function Home() {
  const [backendStatus, setBackendStatus] = useState('Checking...');

  useEffect(() => {
    fetch('/api/health')
      .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
      })
      .then(data => {
        if (data.status === 'ok') {
          setBackendStatus('Connected ✓');
        } else {
          setBackendStatus('Not connected');
        }
      })
      .catch(error => {
        console.error('Error fetching backend health:', error);
        setBackendStatus('Not connected');
      });
  }, []);

  return (
    <div className="container">
      <h1>MediEase QR</h1>
      <p className="subtitle">Hospital care made simple.</p>
      
      <div className="status-card">
        <h2>Backend connection</h2>
        <p className={`status ${backendStatus === 'Connected ✓' ? 'status-connected' : 'status-disconnected'}`}>
          {backendStatus}
        </p>
      </div>
    </div>
  )
}

export default Home;

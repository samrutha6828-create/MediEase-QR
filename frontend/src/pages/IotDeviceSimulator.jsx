import React, { useState, useEffect } from 'react';

function IotDeviceSimulator() {
  const deviceId = 'IOT-WAITING-001';
  const location = 'Waiting Area';

  const [queue, setQueue] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [buttonState, setButtonState] = useState('[ REQUEST HELP ]');
  const [lastEvent, setLastEvent] = useState('No assistance request yet');
  const [error, setError] = useState('');

  // Fetch queue to select or auto-target active patient
  const fetchQueue = async () => {
    try {
      const res = await fetch('/api/queue');
      if (res.ok) {
        const data = await res.json();
        setQueue(data);
        if (data.length > 0 && !selectedPatientId) {
          setSelectedPatientId(String(data[0].patient.id));
        }
      }
    } catch (err) {
      console.error('Error fetching queue for IoT device:', err);
    }
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRequestHelp = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError('');

    const targetPatientId = selectedPatientId ? parseInt(selectedPatientId, 10) : undefined;

    try {
      const res = await fetch('/api/iot/assistance-button', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId,
          patientId: targetPatientId
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to send assistance signal');
      }

      const alertData = await res.json();
      const timeStr = new Date(alertData.createdAt || Date.now()).toLocaleTimeString();

      setButtonState('ASSISTANCE REQUESTED ✓');
      setLastEvent(`Assistance requested at ${timeStr}`);

      // Re-enable button after 3 seconds
      setTimeout(() => {
        setButtonState('[ REQUEST HELP ]');
        setSubmitting(false);
      }, 3000);
    } catch (err) {
      console.error('IoT Request Help error:', err);
      setError(err.message || 'Error sending request');
      setSubmitting(false);
    }
  };

  return (
    <div className="container iot-simulator-container" style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px' }}>
      <header style={{ marginBottom: '30px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.8rem', color: '#004488', margin: '0 0 5px 0' }}>MediEase QR</h1>
        <p style={{ fontSize: '1.4rem', color: '#555', fontWeight: 'bold', margin: 0 }}>IoT Assistance Device</p>
      </header>

      {error && (
        <p className="validation-error" style={{ marginBottom: '20px' }} role="alert">
          {error}
        </p>
      )}

      {/* Device Status Card */}
      <section className="status-card" style={{ maxWidth: '100%', width: '100%', marginBottom: '30px', boxSizing: 'border-box' }}>
        <h2 style={{ fontSize: '1.5rem', color: '#333', borderBottom: '2px solid #eee', paddingBottom: '10px', marginTop: 0 }}>
          DEVICE STATUS
        </h2>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', margin: '15px 0' }}>
          <span style={{ height: '16px', width: '16px', backgroundColor: '#00aa00', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 8px #00aa00' }}></span>
          <span style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#007700' }}>Connected</span>
        </div>

        <div style={{ textAlign: 'left', background: '#f8f9fa', padding: '15px', borderRadius: '10px', margin: '15px 0' }}>
          <p style={{ margin: '5px 0', fontSize: '1.1rem' }}>
            <strong>Device ID:</strong> <span style={{ fontFamily: 'monospace', color: '#004488', fontWeight: 'bold' }}>{deviceId}</span>
          </p>
          <p style={{ margin: '5px 0', fontSize: '1.1rem' }}>
            <strong>Location:</strong> {location}
          </p>
        </div>

        {/* Patient selector for testing target association */}
        {queue.length > 0 && (
          <div style={{ textAlign: 'left', marginTop: '15px' }}>
            <label htmlFor="patient-select" style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#555', display: 'block', marginBottom: '5px' }}>
              Target Patient Context:
            </label>
            <select
              id="patient-select"
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              style={{ width: '100%', padding: '10px', fontSize: '1rem', borderRadius: '8px', border: '2px solid #ccc' }}
            >
              {queue.map((item) => (
                <option key={item.patient.id} value={item.patient.id}>
                  {item.patient.name} (Token: {item.token} - {item.status.toUpperCase()})
                </option>
              ))}
            </select>
          </div>
        )}
      </section>

      {/* Main Big Hardware Button Simulator */}
      <section style={{ textAlign: 'center', marginBottom: '35px' }}>
        <h2 style={{ fontSize: '1.3rem', color: '#666', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '15px' }}>
          ASSISTANCE BUTTON
        </h2>
        
        <button
          onClick={handleRequestHelp}
          disabled={submitting}
          style={{
            backgroundColor: submitting ? '#2e7d32' : '#d32f2f',
            color: '#ffffff',
            border: '4px solid #9a0007',
            borderRadius: '20px',
            padding: '24px 36px',
            fontSize: '1.8rem',
            fontWeight: '900',
            cursor: submitting ? 'default' : 'pointer',
            boxShadow: submitting ? '0 4px 10px rgba(0,0,0,0.2)' : '0 8px 24px rgba(211, 47, 47, 0.4)',
            width: '100%',
            maxWidth: '400px',
            transition: 'all 0.2s ease',
            lineHeight: '1.2'
          }}
        >
          {buttonState}
        </button>
      </section>

      {/* Last Event Log Panel */}
      <section style={{ background: '#ffffff', border: '2px dashed #cccccc', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
        <h3 style={{ fontSize: '1.1rem', color: '#666', marginTop: 0, textTransform: 'uppercase' }}>LAST EVENT</h3>
        <p style={{ fontSize: '1.3rem', fontWeight: 'bold', color: lastEvent === 'No assistance request yet' ? '#888' : '#d32f2f', margin: 0 }}>
          {lastEvent}
        </p>
      </section>
    </div>
  );
}

export default IotDeviceSimulator;

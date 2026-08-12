import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

function StaffDashboard() {
  const [queue, setQueue] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [summary, setSummary] = useState({ serving: 'None', waiting: 0, served: 0 });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch all dashboard data from backend
  const fetchDashboardData = async () => {
    try {
      // 1. Fetch active queue
      const queueRes = await fetch('/api/queue');
      if (!queueRes.ok) throw new Error('Failed to fetch queue list');
      const queueData = await queueRes.json();
      setQueue(queueData);

      // 2. Fetch active alerts
      const alertsRes = await fetch('/api/alerts');
      if (!alertsRes.ok) throw new Error('Failed to fetch alerts list');
      const alertsData = await alertsRes.json();
      setAlerts(alertsData);

      // 3. Fetch summary stats
      const summaryRes = await fetch('/api/queue/summary');
      if (!summaryRes.ok) throw new Error('Failed to fetch queue summary');
      const summaryData = await summaryRes.json();
      setSummary(summaryData);
    } catch (err) {
      console.error('Error fetching staff data:', err);
      setError('Could not load dashboard data.');
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchDashboardData().finally(() => setLoading(false));

    // Connect to Socket.IO
    const socket = io();

    // Listen for queue updates
    socket.on('queueUpdated', () => {
      console.log('Real-time event: queueUpdated received');
      fetchDashboardData();
    });

    // Listen for new assistance alerts
    socket.on('assistanceRequested', (newAlert) => {
      console.log('Real-time event: assistanceRequested received', newAlert);
      fetchDashboardData();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleCallNext = async () => {
    setError('');
    try {
      const res = await fetch('/api/queue/next', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to call next patient');
      // Refreshed via Socket.IO emit from backend
    } catch (err) {
      console.error(err);
      setError('Error advancing queue.');
    }
  };

  const handleServeCurrent = async () => {
    setError('');
    try {
      const res = await fetch('/api/queue/serve', { method: 'POST' });
      if (res.status === 404) {
        setError('No active current patient to serve.');
        return;
      }
      if (!res.ok) throw new Error('Failed to serve current patient');
      // Refreshed via Socket.IO emit from backend
    } catch (err) {
      console.error(err);
      setError('Error serving patient.');
    }
  };

  const handleResolveAlert = async (alertId) => {
    setError('');
    try {
      const res = await fetch(`/api/alerts/${alertId}/resolve`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to resolve alert');
      // Refreshed via Socket.IO emit from backend
    } catch (err) {
      console.error(err);
      setError('Error resolving assistance request.');
    }
  };

  // Find currently serving patient object details
  const currentlyServingPatient = queue.find(item => item.status === 'current');

  return (
    <div className="staff-dashboard-container">
      {/* Header */}
      <header className="staff-header">
        <h1 className="staff-title">MediEase QR</h1>
        <p className="staff-subtitle">Staff Dashboard</p>
      </header>

      {error && (
        <p className="validation-error staff-error-banner" role="alert">
          {error}
        </p>
      )}

      {/* Currently Serving Section */}
      <section className="staff-card staff-currently-serving-card">
        <h2 className="card-section-title">CURRENTLY SERVING</h2>
        {currentlyServingPatient ? (
          <div className="currently-serving-grid">
            <div className="cs-detail-box token-box">
              <span className="cs-label">TOKEN</span>
              <p className="cs-token-value">{currentlyServingPatient.token}</p>
            </div>
            <div className="cs-detail-box">
              <span className="cs-label">PATIENT</span>
              <p className="cs-value">{currentlyServingPatient.patient.name}</p>
            </div>
            <div className="cs-detail-box">
              <span className="cs-label">DEPARTMENT</span>
              <p className="cs-value">{currentlyServingPatient.doctor.department}</p>
            </div>
          </div>
        ) : (
          <p className="empty-state-text">No patient currently being served.</p>
        )}
      </section>

      {/* Controls Panel */}
      <section className="staff-controls-panel">
        <button className="staff-btn btn-call-next" onClick={handleCallNext}>
          CALL NEXT PATIENT
        </button>
        <button className="staff-btn btn-serve-patient" onClick={handleServeCurrent}>
          SERVE PATIENT
        </button>
      </section>

      {/* Queue Summary Stats */}
      <section className="staff-card staff-summary-card">
        <h2 className="card-section-title">QUEUE SUMMARY</h2>
        <div className="staff-stats-grid">
          <div className="staff-stat-card card-serving">
            <h3 className="stat-label">CURRENTLY SERVING</h3>
            <p className="stat-value">{summary.serving === 'None' ? 'None' : summary.serving}</p>
          </div>
          <div className="staff-stat-card">
            <h3 className="stat-label">WAITING</h3>
            <p className="stat-value">{summary.waiting}</p>
          </div>
          <div className="staff-stat-card">
            <h3 className="stat-label">SERVED</h3>
            <p className="stat-value">{summary.served}</p>
          </div>
        </div>
      </section>

      {/* Assistance Requests Alerts Box */}
      <section className="staff-card staff-alerts-section">
        <h2 className="card-section-title">ASSISTANCE REQUESTS</h2>
        {alerts.length === 0 ? (
          <p className="empty-state-text">No active assistance requests.</p>
        ) : (
          <div className="alerts-list">
            {alerts.map((alert) => (
              <div key={alert.id} className="staff-alert-card">
                <div className="alert-badge">🚨 ASSISTANCE REQUEST</div>
                <div className="alert-body-grid">
                  <div className="alert-field">
                    <span className="alert-label">Device</span>
                    <span className="alert-val">{alert.iotDeviceId}</span>
                  </div>
                  <div className="alert-field">
                    <span className="alert-label">Location</span>
                    <span className="alert-val">Waiting Area</span>
                  </div>
                  <div className="alert-field">
                    <span className="alert-label">Patient</span>
                    <span className="alert-val">{alert.patientName}</span>
                  </div>
                  <div className="alert-field">
                    <span className="alert-label">Token</span>
                    <span className="alert-val">{alert.patientToken || ('A-' + String(alert.patientId).padStart(3, '0'))}</span>
                  </div>
                  <div className="alert-field">
                    <span className="alert-label">Requested at</span>
                    <span className="alert-val">
                      {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                <button className="acknowledge-btn" onClick={() => handleResolveAlert(alert.id)}>
                  ACKNOWLEDGE
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Waiting List Queue Table */}
      <section className="staff-card staff-queue-section">
        <h2 className="card-section-title">WAITING QUEUE</h2>
        {queue.length === 0 ? (
          <p className="empty-state-text">No patients currently in the queue.</p>
        ) : (
          <div className="queue-table-wrapper">
            <table className="staff-queue-table">
              <thead>
                <tr>
                  <th>TOKEN</th>
                  <th>PATIENT</th>
                  <th>DOCTOR</th>
                  <th>DEPARTMENT</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {queue.map((item) => (
                  <tr key={item.id} className={item.status === 'current' ? 'row-serving' : ''}>
                    <td className="table-token">{item.token}</td>
                    <td className="table-patient">{item.patient.name} <span className="patient-age">(Age: {item.patient.age})</span></td>
                    <td>{item.doctor.name}</td>
                    <td>{item.doctor.department}</td>
                    <td>
                      <span className={`status-badge badge-${item.status}`}>
                        {item.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default StaffDashboard;

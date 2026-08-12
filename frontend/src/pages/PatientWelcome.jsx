import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

function PatientWelcome() {
  const [step, setStep] = useState('welcome'); // 'welcome' | 'details' | 'department' | 'doctor' | 'confirm' | 'confirmed' | 'queue' | 'your_turn' | 'served'
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [error, setError] = useState('');
  
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [loading, setLoading] = useState(false);

  // Appt and Queue status
  const [patientId, setPatientId] = useState(null);
  const [appointmentId, setAppointmentId] = useState(null);
  const [token, setToken] = useState('');
  const [queueList, setQueueList] = useState([]);
  const [peopleAhead, setPeopleAhead] = useState(0);
  const [currentlyServing, setCurrentlyServing] = useState('');
  const [assistanceSent, setAssistanceSent] = useState(false);

  // 1. Initial restoration of session from localStorage
  useEffect(() => {
    const savedApptId = localStorage.getItem('mediease_appt_id');
    const savedPatientId = localStorage.getItem('mediease_patient_id');
    if (savedPatientId) {
      setPatientId(parseInt(savedPatientId, 10));
    }
    if (savedApptId) {
      setLoading(true);
      fetch(`/api/appointments/${savedApptId}`)
        .then((res) => {
          if (!res.ok) throw new Error('Appointment not found');
          return res.json();
        })
        .then((data) => {
          setAppointmentId(data.appointmentId);
          if (data.patientId) {
            setPatientId(data.patientId);
            localStorage.setItem('mediease_patient_id', data.patientId);
          }
          setToken(data.token);
          setSelectedDoctor({ name: data.doctorName, department: data.department });
          setSelectedDepartment(data.department);
          
          if (data.appointmentStatus === 'served') {
            setStep('served');
          } else if (data.appointmentStatus === 'current') {
            setStep('your_turn');
          } else {
            setStep('queue');
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error('Session restore failed:', err);
          localStorage.removeItem('mediease_appt_id');
          localStorage.removeItem('mediease_token');
          localStorage.removeItem('mediease_patient_id');
          setStep('welcome');
          setLoading(false);
        });
    }
  }, []);

  // 2. Fetch doctors list for selection
  useEffect(() => {
    fetch('/api/doctors')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load doctors');
        return res.json();
      })
      .then((data) => {
        setDoctors(data);
        const deptSet = new Set(data.map(doc => doc.department));
        setDepartments(Array.from(deptSet));
      })
      .catch((err) => console.error(err));
  }, []);

  // 3. Queue Real-Time Updates (Socket.IO + initial fetch + 5s fallback polling)
  useEffect(() => {
    let intervalId;
    let socket;

    if (step === 'queue' || step === 'your_turn') {
      const fetchQueueStatus = () => {
        fetch('/api/queue')
          .then((res) => res.json())
          .then((queue) => {
            setQueueList(queue);
            
            // Find current serving patient
            const currentItem = queue.find(item => item.status === 'current');
            setCurrentlyServing(currentItem ? currentItem.token : 'No patient currently being served');
            
            // Find our patient's index in the queue
            const ourIndex = queue.findIndex(item => item.token === token);
            if (ourIndex !== -1) {
              setPeopleAhead(ourIndex);
              const ourItem = queue[ourIndex];
              if (ourItem.status === 'current' && step === 'queue') {
                setStep('your_turn');
              }
            } else {
              // If not found in active queue, check if served
              if (appointmentId) {
                fetch(`/api/appointments/${appointmentId}`)
                  .then((res) => res.json())
                  .then((data) => {
                    if (data.appointmentStatus === 'served') {
                      setStep('served');
                    }
                  })
                  .catch((err) => console.error(err));
              }
            }
          })
          .catch((err) => console.error('Error fetching queue:', err));
      };

      // Immediate first fetch
      fetchQueueStatus();

      // Connect Socket.IO for instant real-time queue updates
      socket = io();
      socket.on('queueUpdated', () => {
        console.log('Real-time event received on patient client: queueUpdated');
        fetchQueueStatus();
      });

      // 5-second backup interval polling
      intervalId = setInterval(fetchQueueStatus, 5000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (socket) socket.disconnect();
    };
  }, [step, token, appointmentId]);

  const handleStartBooking = () => {
    setStep('details');
    setError('');
  };

  const handleDetailsSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!phone.trim()) {
      setError('Please enter your phone number.');
      return;
    }
    if (!age.trim() || isNaN(age) || parseInt(age, 10) <= 0) {
      setError('Please enter your age.');
      return;
    }
    setError('');
    setStep('department');
  };

  const handleSelectDepartment = (dept) => {
    setSelectedDepartment(dept);
    setStep('doctor');
  };

  const handleSelectDoctor = (doc) => {
    setSelectedDoctor(doc);
    setStep('confirm');
  };

  const handleConfirmAppointment = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Create Patient
      const patientRes = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, age: parseInt(age, 10) })
      });
      if (!patientRes.ok) throw new Error('Failed to create patient record');
      const patientData = await patientRes.json();

      // 2. Create Appointment
      const todayDate = new Date().toISOString().split('T')[0]; // Local YYYY-MM-DD
      const apptRes = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patientData.id,
          doctorId: selectedDoctor.id,
          date: todayDate
        })
      });
      if (!apptRes.ok) throw new Error('Failed to create appointment');
      const apptData = await apptRes.json();

      // 3. Save to state and localStorage
      setPatientId(patientData.id);
      setAppointmentId(apptData.appointment.id);
      setToken(apptData.token);
      localStorage.setItem('mediease_patient_id', patientData.id);
      localStorage.setItem('mediease_appt_id', apptData.appointment.id);
      localStorage.setItem('mediease_token', apptData.token);

      setStep('confirmed');
    } catch (err) {
      console.error(err);
      setError('Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAssistance = async () => {
    if (!patientId) {
      console.error('Cannot request assistance: Patient ID missing');
      return;
    }
    try {
      const res = await fetch('/api/iot/assistance-button', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: 'WEB-PATIENT', patientId })
      });
      if (res.ok) {
        setAssistanceSent(true);
        setTimeout(() => setAssistanceSent(false), 5000);
      } else {
        console.error('Failed to send assistance alert');
      }
    } catch (err) {
      console.error('Error triggering assistance:', err);
    }
  };

  const handleBookNew = () => {
    localStorage.removeItem('mediease_appt_id');
    localStorage.removeItem('mediease_token');
    localStorage.removeItem('mediease_patient_id');
    setName('');
    setPhone('');
    setAge('');
    setToken('');
    setPatientId(null);
    setAppointmentId(null);
    setSelectedDoctor(null);
    setSelectedDepartment('');
    setStep('welcome');
    setError('');
  };

  const handleBack = () => {
    if (step === 'details') setStep('welcome');
    else if (step === 'department') setStep('details');
    else if (step === 'doctor') setStep('department');
    else if (step === 'confirm') setStep('doctor');
    setError('');
  };

  return (
    <div className="container patient-welcome-container">
      {/* Show Back button for input steps */}
      {['details', 'department', 'doctor', 'confirm'].includes(step) && (
        <button className="back-btn" onClick={handleBack} aria-label="Go back to previous step">
          ← Back
        </button>
      )}

      {loading && <p className="loading-text">Loading...</p>}

      {!loading && (
        <>
          {step === 'welcome' && (
            <>
              <h1 className="main-title">MediEase QR</h1>
              <p className="patient-subtitle">Hospital appointments<br />made simple.</p>
              
              <button className="large-primary-btn" onClick={handleStartBooking}>
                BOOK APPOINTMENT
              </button>
            </>
          )}

          {step === 'details' && (
            <form onSubmit={handleDetailsSubmit} className="patient-form" noValidate>
              <h2 className="step-title">Your Details</h2>
              
              {error && <p className="validation-error" role="alert">{error}</p>}
              
              <div className="input-group">
                <label htmlFor="patient-name">Name</label>
                <input
                  id="patient-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ravi"
                  autoComplete="name"
                />
              </div>

              <div className="input-group">
                <label htmlFor="patient-phone">Phone Number</label>
                <input
                  id="patient-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  autoComplete="tel"
                />
              </div>

              <div className="input-group">
                <label htmlFor="patient-age">Age</label>
                <input
                  id="patient-age"
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g. 67"
                  min="1"
                  max="125"
                />
              </div>

              <button type="submit" className="large-primary-btn" style={{ marginTop: '20px' }}>
                CONTINUE
              </button>
            </form>
          )}

          {step === 'department' && (
            <div className="patient-flow-list">
              <h2 className="step-title">Choose Department</h2>
              
              {departments.map((dept) => (
                <button
                  key={dept}
                  className="large-choice-btn"
                  onClick={() => handleSelectDepartment(dept)}
                >
                  {dept.toUpperCase()}
                </button>
              ))}
            </div>
          )}

          {step === 'doctor' && (
            <div className="patient-flow-list">
              <h2 className="step-title">Choose Doctor</h2>
              <p className="selected-info">Department: {selectedDepartment}</p>
              
              {doctors
                .filter((doc) => doc.department === selectedDepartment)
                .map((doc) => (
                  <button
                    key={doc.id}
                    className="large-choice-btn"
                    onClick={() => handleSelectDoctor(doc)}
                  >
                    {doc.name}
                  </button>
                ))}
            </div>
          )}

          {step === 'confirm' && (
            <div className="patient-flow-list">
              <h2 className="step-title">Confirm Appointment</h2>
              
              {error && <p className="validation-error" role="alert">{error}</p>}

              <div className="confirm-details-card">
                <p className="confirm-label">Doctor</p>
                <p className="confirm-value">{selectedDoctor?.name}</p>

                <p className="confirm-label">Department</p>
                <p className="confirm-value">{selectedDoctor?.department}</p>

                <p className="confirm-label">Date</p>
                <p className="confirm-value">Today</p>
              </div>

              <button className="large-primary-btn" onClick={handleConfirmAppointment}>
                CONFIRM APPOINTMENT
              </button>
            </div>
          )}

          {step === 'confirmed' && (
            <div className="patient-flow-list">
              <h2 className="step-title" style={{ color: '#007700' }}>Appointment Confirmed ✓</h2>
              
              <div className="token-display-box">
                <p className="token-label">Your Token</p>
                <p className="giant-token-text">{token}</p>
                <p className="token-subinfo">{selectedDoctor?.department}</p>
                <p className="token-subinfo">{selectedDoctor?.name}</p>
              </div>

              <button className="large-primary-btn" onClick={() => setStep('queue')}>
                VIEW QUEUE
              </button>
            </div>
          )}

          {step === 'queue' && (
            <div className="patient-flow-list">
              <div className="queue-status-card">
                <p className="queue-title-label">YOUR TOKEN</p>
                <p className="large-token-highlight">{token}</p>
                
                <hr className="divider" />
                
                <p className="queue-label">CURRENTLY SERVING</p>
                <p className="serving-token-value">{currentlyServing}</p>

                <hr className="divider" />

                {peopleAhead === 0 ? (
                  <p className="next-indicator-text">YOU ARE NEXT</p>
                ) : (
                  <>
                    <p className="people-ahead-text">{peopleAhead} PEOPLE AHEAD</p>
                    <p className="wait-time-text">ESTIMATED WAIT: ~{peopleAhead * 10} minutes</p>
                  </>
                )}

                <p className="instruction-text">PLEASE WAIT NEARBY</p>
              </div>

              <div className="assistance-container" style={{ marginTop: '25px', textAlign: 'center' }}>
                <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#555', marginBottom: '8px' }}>
                  NEED HELP?
                </p>
                <button 
                  onClick={handleRequestAssistance}
                  disabled={assistanceSent}
                  style={{
                    backgroundColor: assistanceSent ? '#2e7d32' : '#d32f2f',
                    color: '#ffffff',
                    border: 'none',
                    padding: '16px 28px',
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    borderRadius: '12px',
                    cursor: assistanceSent ? 'default' : 'pointer',
                    boxShadow: '0 4px 12px rgba(211, 47, 47, 0.3)'
                  }}
                >
                  {assistanceSent ? 'REQUEST SENT ✓' : '[ REQUEST ASSISTANCE ]'}
                </button>
              </div>
            </div>
          )}

          {step === 'your_turn' && (
            <div className="patient-flow-list your-turn-container">
              <h1 className="your-turn-title">YOUR TURN!</h1>
              <p className="your-turn-token">{token}</p>
              
              <div className="room-card">
                <p className="room-label">PLEASE GO TO</p>
                <p className="room-number">ROOM 3</p>
              </div>
            </div>
          )}

          {step === 'served' && (
            <div className="patient-flow-list">
              <h2 className="step-title" style={{ color: '#007700' }}>Thank You!</h2>
              <p className="subtitle">You have been served by the doctor.</p>
              
              <button className="large-primary-btn" onClick={handleBookNew}>
                BOOK NEW APPOINTMENT
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default PatientWelcome;

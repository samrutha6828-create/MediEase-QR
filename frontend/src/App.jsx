import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import PatientWelcome from './pages/PatientWelcome';
import HospitalQR from './pages/HospitalQR';
import StaffDashboard from './pages/StaffDashboard';
import IotDeviceSimulator from './pages/IotDeviceSimulator';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/patient" element={<PatientWelcome />} />
        <Route path="/hospital-qr" element={<HospitalQR />} />
        <Route path="/staff" element={<StaffDashboard />} />
        <Route path="/iot" element={<IotDeviceSimulator />} />
      </Routes>
    </Router>
  );
}

export default App;

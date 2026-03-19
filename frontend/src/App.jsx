import { useState, useEffect } from 'react';
import axios from 'axios';
import Login from './components/Login';
import HODDashboard from './components/HODDashboard';
import AdminDashboard from './components/AdminDashboard';
import StudentDashboard from './components/StudentDashboard';

const API_BASE = '/api';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [role, setRole] = useState(localStorage.getItem('role') || '');

  useEffect(() => {
    if (token && role) setUser({ role });
  }, [token, role]);

  const handleLogin = async (email, password) => {
    const { data } = await axios.post(`${API_BASE}/auth/login`, { email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('role', data.role);
    localStorage.setItem('userId', data.userId);
    localStorage.setItem('userEmail', email);
    setToken(data.token);
    setRole(data.role);
    setUser({ role: data.role });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    setToken('');
    setRole('');
    setUser(null);
  };

  const [showLanding, setShowLanding] = useState(true);

  if (!user && showLanding) {
    return (
      <div className="landing-container newsprint-texture">
        <div className="metadata">Vol. 1.0 | Academic Year 2026</div>
        <h1>THE CAMPUS CHRONICLE</h1>
        <p className="drop-cap">A sophisticated Intelligence Dashboard for tracking student achievements, verifying credentials, and predicting success through advanced neural analysis.</p>
        <button className="primary-btn" onClick={() => setShowLanding(false)}>Enter Dashboard</button>
      </div>
    );
  }

  if (!user) return <Login onLogin={handleLogin} onCancel={() => setShowLanding(true)} />;

  return (
    <div className="app newsprint-texture">
      <header className="app-header">
        <div>
          <div className="metadata">Established 2026 | New York Edition</div>
          <h1>STUDENT ACTIVITY DASHBOARD</h1>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="metadata font-mono" style={{ color: 'var(--editorial-red)' }}>LIVE UPDATES ○</div>
          <button className="primary-btn" onClick={logout}>Sign Out</button>
        </div>
      </header>
      
      <div className="news-ticker">
        <div className="ticker-label">BREAKING NEWS</div>
        <div className="ticker-content">
          <span>{role.toUpperCase()} SESSION ACTIVE ○ {new Date().toLocaleTimeString()}</span>
          <span>CAMPUS ACHIEVEMENT INTELLIGENCE SYSTEM v1.0.42 STATUS: OPERATIONAL</span>
          <span>NEW CERTIFICATE UPLOADS DETECTED IN THE REGION</span>
          <span>{role.toUpperCase()} PORTAL IS NOW READY FOR DATA INGESTION</span>
        </div>
      </div>

      <main>
        {role === 'hod' && <HODDashboard token={token} />}
        {role === 'admin' && <AdminDashboard token={token} />}
        {role === 'super_admin' && <HODDashboard token={token} />}
        {role === 'student' && <StudentDashboard token={token} />}
      </main>

      <footer className="edition-marker">
        STUDENT ACTIVITY INTELLIGENCE PORTAL | EDITION v1.0.42 | PRINTED IN THE CLOUD | © 2026 ALL RIGHTS RESERVED
      </footer>
    </div>
  );
}

export default App;

import { useState } from 'react';

function Login({ onLogin, onSwitchToRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await onLogin(email, password);
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password');
    }
  };

  return (
    <div className="login-container newsprint-texture">
      <div className="login-header">
        <div className="metadata">Authentication Required</div>
        <h2>SECURE PORTAL ACCESS</h2>
        <p className="font-serif drop-cap" style={{ marginBottom: '2rem', fontSize: '1rem', color: '#444' }}>Please enter your verified institutional credentials to access the secure tracking systems of the Campus Achievement Intelligence Platform.</p>
      </div>
      <form onSubmit={submit} className="form-group-stack">
        <div className="form-group">
          <label>INSTITUTIONAL EMAIL</label>
          <input 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            type="email" 
            placeholder="student@campus.edu"
            required 
          />
        </div>
        <div className="form-group">
          <label>SECURITY PASSCODE</label>
          <input 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            type="password" 
            placeholder="••••••••"
            required 
          />
        </div>
        {error && <p className="status-msg" style={{ borderColor: 'var(--editorial-red)', color: 'var(--editorial-red)' }}>{error}</p>}
        <button className="primary-btn full-width shadow-none" type="submit" style={{ marginTop: '1rem' }}>Initiate Session</button>
        <p className="font-serif" style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem' }}>
          New student? <a href="#" onClick={(e) => { e.preventDefault(); onSwitchToRegister(); }} style={{ textDecoration: 'underline', fontWeight: 'bold' }}>Enroll in Research</a>
        </p>
      </form>
    </div>
  );
}

export default Login;

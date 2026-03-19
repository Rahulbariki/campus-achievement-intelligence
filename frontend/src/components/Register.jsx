import { useState } from 'react';

function Register({ onRegister, onSwitchToLogin }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    department: '',
    year: '',
    section: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await onRegister(formData);
      setSuccess('Account created successfully! You can now log in.');
      setTimeout(() => onSwitchToLogin(), 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Check your details.');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="login-container newsprint-texture" style={{ maxWidth: '500px' }}>
      <div className="login-header">
        <div className="metadata">Institutional Enrollment</div>
        <h2>ACADEMIC RECORD CREATION</h2>
        <p className="font-serif" style={{ marginBottom: '2rem', fontSize: '1rem', color: '#444' }}>
          New students must register using their official institutional email to participate in the Campus Achievement Intelligence profiling systems.
        </p>
      </div>
      <form onSubmit={submit} className="form-group-stack">
        <div className="form-group">
          <label>FULL FULL NAME</label>
          <input 
            name="name"
            value={formData.name} 
            onChange={handleChange} 
            type="text" 
            placeholder="Johnathan Doe"
            required 
          />
        </div>
        <div className="form-group">
          <label>INSTITUTIONAL EMAIL</label>
          <input 
            name="email"
            value={formData.email} 
            onChange={handleChange} 
            type="email" 
            placeholder="student@srecnandyal.edu.in"
            required 
          />
        </div>
        <div className="form-group">
          <label>SECURITY PASSCODE</label>
          <input 
            name="password"
            value={formData.password} 
            onChange={handleChange} 
            type="password" 
            placeholder="••••••••"
            required 
          />
        </div>
        <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label>DEPARTMENT</label>
            <input 
              name="department"
              value={formData.department} 
              onChange={handleChange} 
              type="text" 
              placeholder="CSE"
              required 
            />
          </div>
          <div className="form-group">
            <label>STUDY YEAR</label>
            <input 
              name="year"
              value={formData.year} 
              onChange={handleChange} 
              type="number" 
              min="1" max="4"
              placeholder="3"
              required 
            />
          </div>
        </div>
        {error && <p className="status-msg" style={{ borderColor: 'var(--editorial-red)', color: 'var(--editorial-red)' }}>{error}</p>}
        {success && <p className="status-msg" style={{ borderColor: 'var(--editorial-green)', color: 'var(--editorial-green)' }}>{success}</p>}
        <button className="primary-btn full-width shadow-none" type="submit" style={{ marginTop: '1rem' }}>Finalize Enrollment</button>
        <p className="font-serif" style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem' }}>
          Already registered? <a href="#" onClick={(e) => { e.preventDefault(); onSwitchToLogin(); }} style={{ textDecoration: 'underline', fontWeight: 'bold' }}>Access Portal</a>
        </p>
      </form>
    </div>
  );
}

export default Register;

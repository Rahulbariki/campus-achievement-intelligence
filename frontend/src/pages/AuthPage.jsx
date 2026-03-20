import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getDashboardPath, roleOptions } from '../config/roles';
import { useAuth } from '../context/AuthContext';

function readError(error, fallback) {
  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string' && detail.trim()) {
    return detail;
  }

  if (Array.isArray(detail) && detail.length > 0) {
    return detail
      .map((item) => item?.msg || item?.message)
      .filter(Boolean)
      .join(', ');
  }

  if (error?.response?.status >= 500) {
    return 'The authentication service is temporarily unavailable. Please try again in a moment.';
  }

  if (error?.message === 'Network Error') {
    return 'Unable to reach the authentication service. Check the backend deployment and try again.';
  }

  return fallback;
}

export default function AuthPage() {
  const navigate = useNavigate();
  const { isAuthenticated, dashboardPath, login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    department: 'CSE-AIML',
    role: 'student',
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate(dashboardPath, { replace: true });
    }
  }, [dashboardPath, isAuthenticated, navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');

    try {
      const user =
        mode === 'login'
          ? await login({ email: form.email, password: form.password })
          : await register(form);
      navigate(getDashboardPath(user.role), { replace: true });
    } catch (requestError) {
      setError(
        readError(
          requestError,
          mode === 'login'
            ? 'Unable to sign in with those credentials.'
            : 'Unable to create that account right now.',
        ),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-shell">
      <section className="auth-aside">
        <p className="eyebrow">Secure Access</p>
        <h1>Choose a role-aware entry point into CAIP.</h1>
        <p>
          Sign in to your workspace or create a starter account for the role you want to
          test across the platform.
        </p>
        <Link className="ghost-button" to="/">
          Back to overview
        </Link>
      </section>

      <section className="auth-card">
        <div className="toggle-row">
          <button
            type="button"
            className={mode === 'login' ? 'toggle-button active' : 'toggle-button'}
            onClick={() => setMode('login')}
          >
            Login
          </button>
          <button
            type="button"
            className={mode === 'register' ? 'toggle-button active' : 'toggle-button'}
            onClick={() => setMode('register')}
          >
            Register
          </button>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          {mode === 'register' ? (
            <label>
              Full Name
              <input name="name" value={form.name} onChange={handleChange} required />
            </label>
          ) : null}

          <label>
            Email
            <input name="email" type="email" value={form.email} onChange={handleChange} required />
          </label>

          <label>
            Password
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </label>

          {mode === 'register' ? (
            <>
              <label>
                Department
                <input name="department" value={form.department} onChange={handleChange} />
              </label>

              <label>
                Role
                <select name="role" value={form.role} onChange={handleChange}>
                  {roleOptions.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </label>
            </>
          ) : null}

          {error ? <p className="feedback error">{error}</p> : null}

          <button className="primary-button" type="submit" disabled={busy}>
            {busy ? 'Working...' : mode === 'login' ? 'Login to Workspace' : 'Create Account'}
          </button>
        </form>
      </section>
    </div>
  );
}

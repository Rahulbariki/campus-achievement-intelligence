import { Link } from 'react-router-dom';
import { roleOptions } from '../config/roles';
import { useAuth } from '../context/AuthContext';

const architecture = [
  'Frontend: React + Vite',
  'Backend: FastAPI + JWT RBAC',
  'Data: MongoDB via pymongo',
  'Storage: Cloudinary for certificates',
  'AI: OCR, press notes, and prediction modules',
];

const valueProps = [
  'Track hackathons, events, workshops, and achievements in one workflow.',
  'Automate certificate review with a Python OCR layer and confidence scoring.',
  'Surface department health through leaderboard and activity intelligence.',
  'Give every role a focused workspace instead of a one-size-fits-none portal.',
];

export default function HomePage() {
  const { isAuthenticated, dashboardPath } = useAuth();

  return (
    <div className="landing-shell">
      <section className="landing-hero">
        <p className="eyebrow">Enterprise Intelligence</p>
        <h1>Campus Achievement Intelligence</h1>
        <p className="landing-copy">
          The central hub for tracking, verifying, and analyzing campus achievements.
          Automated verification, real-time analytics, and AI-driven growth insights.
        </p>

        <div className="cta-row">
          <Link className="primary-button" to={isAuthenticated ? dashboardPath : '/login'}>
            {isAuthenticated ? 'Go to Dashboard' : 'Sign In'}
          </Link>
          <Link className="ghost-button" to="/login">
            Register Portal
          </Link>
        </div>
      </section>

      <section className="feature-band">
        {valueProps.map((item) => (
          <article key={item} className="feature-card">
            <p>{item}</p>
          </article>
        ))}
      </section>

      <section id="architecture" className="architecture-panel">
        <div>
          <p className="eyebrow">System Blueprint</p>
          <h2>One platform, five roles, and a clean API-led flow.</h2>
        </div>
        <ul className="stack-list">
          {architecture.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="roles-panel">
        <p className="eyebrow">Role Coverage</p>
        <div className="role-grid">
          {roleOptions.map((role) => (
            <article key={role.value} className="role-card">
              <strong>{role.label}</strong>
              <span>{role.value.replace('_', ' ')}</span>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

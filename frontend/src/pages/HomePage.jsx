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
      <section className="landing-hero" style={{ border: '1px solid var(--ink)', padding: '2rem', marginBottom: '1rem', background: 'var(--paper)' }}>
        <p className="eyebrow" style={{ color: 'var(--accent)', letterSpacing: '0.15em', marginBottom: '1rem' }}>CAMPUS ACHIEVEMENT INTELLIGENCE PLATFORM</p>
        <h1 style={{ fontSize: 'clamp(4rem, 8vw, 6.5rem)', fontFamily: '"Playfair Display", serif', lineHeight: 0.95, letterSpacing: '-0.02em', marginBottom: '1.5rem', wordBreak: 'keep-all' }}>
          Track achievement, verify proof, and turn campus momentum into visible outcomes.
        </h1>
        <p className="landing-copy" style={{ fontSize: '1.05rem', fontFamily: '"Inter", sans-serif', opacity: 0.8, maxWidth: '900px', marginBottom: '2rem' }}>
          CAIP is a full-stack starter platform for student achievement intelligence with role-based workflows, certificate handling, analytics, and AI-powered storytelling.
        </p>

        <div className="cta-row" style={{ display: 'flex', gap: '1rem' }}>
          <Link className="primary-button" style={{ textTransform: 'uppercase', fontFamily: '"JetBrains Mono", monospace', fontSize: '0.75rem', letterSpacing: '0.1em' }} to={isAuthenticated ? dashboardPath : '/login'}>
            OPEN WORKSPACE
          </Link>
          <a className="ghost-button" style={{ textTransform: 'uppercase', fontFamily: '"JetBrains Mono", monospace', fontSize: '0.75rem', letterSpacing: '0.1em' }} href="#architecture">
            EXPLORE ARCHITECTURE
          </a>
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

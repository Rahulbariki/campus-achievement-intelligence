import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardPath, roleMeta } from '../config/roles';
import { useAuth } from '../context/AuthContext';

const formatNavLabel = (label) => label.toUpperCase();

const getNavItems = (role) => {
  return [
    { href: '/', label: 'MAIN DESK' },
    { href: getDashboardPath(role), label: 'FRONT PAGE' },
    { href: '#overview', label: 'OVERVIEW' },
    { href: '#operations', label: 'OPERATIONS' },
    { href: '#analytics', label: 'ANALYTICS' },
    { href: '#ai-lab', label: 'AI LAB' },
  ];
};

export default function AppShell({ title, subtitle, children }) {
  const { user, role, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    setCurrentDate(
      new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }).format(new Date()).toUpperCase()
    );
  }, []);

  const meta = roleMeta[role] ?? roleMeta.student;

  const toggleSidebar = () => setSidebarOpen(prev => !prev);
  const toggleCollapse = () => setIsCollapsed(prev => !prev);

  return (
    <div className="workspace-shell">
      {/* Mobile Toggle */}
      <button
        type="button"
        className="workspace-menu-button mobile-only"
        onClick={toggleSidebar}
        style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 1000, borderRadius: '50%', width: '3.5rem', height: '3.5rem', display: 'none' }}
      >
        {sidebarOpen ? '✕' : '☰'}
      </button>

      <aside
        id="workspace-sidebar"
        className={`workspace-sidebar ${sidebarOpen ? 'is-open' : ''} ${isCollapsed ? 'is-collapsed' : ''}`}
      >
        <button 
          className="sidebar-toggle desktop-only" 
          onClick={toggleCollapse}
          title={isCollapsed ? "Expand" : "Collapse"}
        >
          {isCollapsed ? '→' : '←'}
        </button>

        <div className="edition-strip" style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.66rem', fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.14em', opacity: 0.8, textTransform: 'uppercase' }}>
          <div>VOL. 1 &nbsp;{currentDate}</div>
          <div>{meta.label} EDITION<br/>CAIP GAZETTE</div>
        </div>

        <div className="brand-lockup">
          <h1>Campus<br/>Achievement<br/>Intelligence<br/>Platform</h1>
          <p className="sidebar-copy" style={{ marginTop: '0.75rem', fontFamily: '"Playfair Display", serif', fontSize: '0.9rem', lineHeight: 1.4, opacity: 0.9 }}>
            {meta.strapline}
          </p>
        </div>

        <div className="user-card" style={{ marginTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '1.5rem' }}>
          <div style={{ wordBreak: 'break-word', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.66rem', fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.14em', opacity: 0.8 }}>DESK CREDENTIALS</span>
            <strong style={{ fontSize: '1rem', fontFamily: '"Playfair Display", serif' }}>{user?.name}</strong>
            <p className="eyebrow" style={{ opacity: 0.8, margin: 0 }}>{meta.label}</p>
            <p className="eyebrow" style={{ opacity: 0.6, margin: 0 }}>{user?.department || 'Founding Editor'}</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {getNavItems(role).map((item, i) => (
            item.href.startsWith('#') ? (
              <a key={i} href={item.href} onClick={(e) => { e.preventDefault(); /* Smooth scroll to section handled differently or just dummy buttons for now */ }}>
                <span>{item.label}</span>
              </a>
            ) : (
              <Link key={i} to={item.href}>
                <span>{item.label}</span>
              </Link>
            )
          ))}
          
          <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
            <button className="ghost-button" onClick={logout} style={{ width: '100%', color: 'white', borderColor: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', fontFamily: '"JetBrains Mono", monospace' }}>
              {isCollapsed ? '⏻' : 'Sign Out'}
            </button>
          </div>
        </nav>
        
        <div className="sidebar-footnote" style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
          <p style={{ fontSize: '0.66rem', fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.14em', opacity: 0.8, marginBottom: '0.5rem', textTransform: 'uppercase' }}>COVERAGE NOTES</p>
          <p style={{ fontFamily: '"Playfair Display", serif', fontSize: '0.85rem', lineHeight: 1.4, opacity: 0.8 }}>
            Structured submission tracking, editorial analytics, and AI-assisted campus recognition in one working edition.
          </p>
        </div>
      </aside>

      <main className="workspace-main">
        <header className="workspace-header" style={{ border: '1px solid var(--ink)', padding: '2rem', marginBottom: '1.5rem', background: 'var(--paper)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <p className="eyebrow" style={{ color: '#d9534f', letterSpacing: '0.15em', marginBottom: '1rem' }}>ROLE WORKSPACE</p>
            <h2 style={{ fontSize: 'clamp(3rem, 6vw, 4.5rem)', lineHeight: 1.1, marginBottom: '0.5rem', letterSpacing: '-0.02em', wordBreak: 'normal', overflowWrap: 'normal', hyphens: 'none' }}>{title}</h2>
            <p className="font-serif" style={{ opacity: 0.8, fontSize: '1.05rem' }}>{subtitle}</p>
          </div>
          <div style={{ border: '1px solid var(--ink)', padding: '0.75rem 1rem', display: 'inline-flex', flexDirection: 'column', gap: '0.25rem', width: 'max-content', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '0.65rem', fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.14em', color: '#d9534f', textTransform: 'uppercase' }}>DESK STATUS</span>
            <span style={{ fontSize: '0.75rem', fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.1em', textTransform: 'uppercase' }}>LIVE EDITION</span>
            <span style={{ fontSize: '0.75rem', fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.1em', opacity: 0.7, textTransform: 'uppercase' }}>FASTAPI / MONGODB / AI</span>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}

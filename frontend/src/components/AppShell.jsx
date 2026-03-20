import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardPath, roleMeta } from '../config/roles';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { href: '#overview', label: 'Overview' },
  { href: '#operations', label: 'Operations' },
  { href: '#analytics', label: 'Analytics' },
  { href: '#ai-lab', label: 'AI Lab' },
];

export default function AppShell({ title, subtitle, children }) {
  const { user, role, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

        <div className="brand-lockup">
          <h1>CAIP</h1>
          <p className="eyebrow">Portal</p>
        </div>

        <div className="user-card" style={{ marginTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem' }}>
          <div style={{ wordBreak: 'break-all' }}>
            <strong>{user?.name}</strong>
            <p className="eyebrow" style={{ opacity: 0.6, marginTop: '0.25rem' }}>{meta.label}</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <Link to={getDashboardPath(role)} className="active">
            <span>Dashboard</span>
          </Link>
          <Link to="/">
            <span>Home</span>
          </Link>
          
          <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
            <button className="ghost-button" onClick={logout} style={{ width: '100%', color: 'white', borderColor: 'rgba(255,255,255,0.2)' }}>
              {isCollapsed ? '⏻' : 'Sign Out'}
            </button>
          </div>
        </nav>
      </aside>

      <main className="workspace-main">
        <header className="workspace-header" style={{ marginBottom: '3rem' }}>
          <div>
            <p className="eyebrow" style={{ color: 'var(--accent)' }}>Campus Achievement Intelligence</p>
            <h2 style={{ fontSize: '2.5rem' }}>{title}</h2>
            <p className="font-serif italic" style={{ opacity: 0.7 }}>{subtitle}</p>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}

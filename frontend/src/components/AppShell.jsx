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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const meta = roleMeta[role] ?? roleMeta.student;
  const editionDate = useMemo(
    () =>
      new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(new Date()),
    [],
  );

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="workspace-shell">
      <button
        type="button"
        className="workspace-menu-button"
        aria-expanded={sidebarOpen}
        aria-controls="workspace-sidebar"
        onClick={() => setSidebarOpen((current) => !current)}
      >
        {sidebarOpen ? 'Close Sections' : 'Open Sections'}
      </button>

      <button
        type="button"
        className={`workspace-sidebar-backdrop ${sidebarOpen ? 'is-visible' : ''}`}
        aria-hidden={!sidebarOpen}
        onClick={closeSidebar}
      />

      <aside
        id="workspace-sidebar"
        className={`workspace-sidebar ${sidebarOpen ? 'is-open' : ''}`}
      >
        <div className="brand-lockup">
          <h1>CAIP</h1>
          <p className="eyebrow">Intelligence Portal</p>
        </div>

        <div className="user-card" style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '4px' }}>
          <strong>{user?.name ?? 'User'}</strong>
          <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>{meta.label}</span>
          <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>{user?.department}</span>
        </div>

        <nav className="sidebar-nav">
          <Link to={getDashboardPath(role)} onClick={closeSidebar}>Dashboard</Link>
          <Link to="/" onClick={closeSidebar}>Home</Link>
          <button className="ghost-button" onClick={logout} style={{ marginTop: 'auto', color: 'white', borderColor: 'rgba(255,255,255,0.2)' }}>
            Sign Out
          </button>
        </nav>
      </aside>

      <main className="workspace-main">
        <header className="workspace-header">
          <div className="workspace-header__copy">
            <h2>{title}</h2>
            <p className="header-copy">{subtitle}</p>
          </div>

          <div className="workspace-header__actions">
            <div className="status-pill">
              <strong>Live System</strong>
            </div>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}

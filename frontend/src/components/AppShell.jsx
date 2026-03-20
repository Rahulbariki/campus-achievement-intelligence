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
        <div className="edition-strip">
          <span>Vol. 1</span>
          <span>{editionDate}</span>
          <span>{meta.label} Edition</span>
        </div>

        <div className="brand-lockup">
          <p className="eyebrow">CAIP Gazette</p>
          <h1>Campus Achievement Intelligence Platform</h1>
          <p className="sidebar-copy">{meta.strapline}</p>
        </div>

        <div className="user-card">
          <p className="eyebrow">Desk Credentials</p>
          <strong>{user?.name ?? 'Analyst'}</strong>
          <span>{meta.label}</span>
          <span>{user?.department ?? 'Campus-wide edition'}</span>
        </div>

        <nav className="sidebar-nav" aria-label="Dashboard sections">
          <Link to={getDashboardPath(role)} onClick={closeSidebar}>
            Main Desk
          </Link>
          <Link to="/" onClick={closeSidebar}>
            Front Page
          </Link>
          {navItems.map((item) => (
            <a key={item.href} href={item.href} onClick={closeSidebar}>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="sidebar-footnote">
          <p className="eyebrow">Coverage Notes</p>
          <p>
            Structured submission tracking, editorial analytics, and AI-assisted campus
            recognition in one working edition.
          </p>
        </div>

        <button className="ghost-button" type="button" onClick={logout}>
          Sign Out
        </button>
      </aside>

      <main className="workspace-main">
        <header className="workspace-header newsprint-texture">
          <div className="workspace-header__copy">
            <p className="eyebrow">Role Workspace</p>
            <h2>{title}</h2>
            <p className="header-copy">{subtitle}</p>
          </div>

          <div className="workspace-header__actions">
            <div className="status-pill">
              <span className="status-pill__label">Desk Status</span>
              <strong>LIVE EDITION</strong>
              <span>FastAPI / MongoDB / AI</span>
            </div>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}

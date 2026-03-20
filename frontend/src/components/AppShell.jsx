import { Link } from 'react-router-dom';
import { getDashboardPath, roleMeta } from '../config/roles';
import { useAuth } from '../context/AuthContext';

export default function AppShell({ title, subtitle, children }) {
  const { user, role, logout } = useAuth();
  const meta = roleMeta[role] ?? roleMeta.student;

  return (
    <div className="workspace-shell">
      <aside className="workspace-sidebar">
        <div className="brand-lockup">
          <p className="eyebrow">CAIP</p>
          <h1>Campus Achievement Intelligence Platform</h1>
          <p className="sidebar-copy">{meta.strapline}</p>
        </div>

        <div className="user-card">
          <p className="eyebrow">Signed In As</p>
          <strong>{user?.name}</strong>
          <span>{meta.label}</span>
          <span>{user?.department ?? 'Campus-wide access'}</span>
        </div>

        <nav className="sidebar-nav">
          <Link to={getDashboardPath(role)}>Dashboard</Link>
          <a href="#operations">Operations</a>
          <a href="#analytics">Analytics</a>
          <a href="#ai-lab">AI Lab</a>
        </nav>

        <button className="ghost-button" type="button" onClick={logout}>
          Sign out
        </button>
      </aside>

      <main className="workspace-main">
        <header className="workspace-header">
          <div>
            <p className="eyebrow">Role Workspace</p>
            <h2>{title}</h2>
            <p className="header-copy">{subtitle}</p>
          </div>
          <div className="status-pill">Mongo + FastAPI + AI ready</div>
        </header>
        {children}
      </main>
    </div>
  );
}

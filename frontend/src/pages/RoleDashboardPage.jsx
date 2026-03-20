import { useAuth } from '../context/AuthContext';
import { roleMeta } from '../config/roles';
import StudentDashboard from '../components/StudentDashboard';
import HODDashboard from '../components/HODDashboard';
import AdminDashboard from '../components/AdminDashboard';
import SuperAdminDashboard from '../components/SuperAdminDashboard';
import AppShell from '../components/AppShell';

export default function RoleDashboardPage() {
  const { role, token } = useAuth();

  const renderDashboard = () => {
    switch (role) {
      case 'student':
        return <StudentDashboard token={token} />;
      case 'hod':
        return <HODDashboard token={token} />;
      case 'admin':
        return <AdminDashboard token={token} />;
      case 'super_admin':
        return (
          <div style={{ display: 'grid', gap: '4rem' }}>
             {/* Super Admin sees everything because HOD is under Super Admin */}
             <SuperAdminDashboard />
             <div style={{ borderTop: '2px dashed var(--line)', paddingTop: '4rem' }}>
                <div className="metadata">HOD PERSPECTIVE</div>
                <HODDashboard token={token} />
             </div>
             <div style={{ borderTop: '2px dashed var(--line)', paddingTop: '4rem' }}>
                <div className="metadata">ADMINISTRATIVE PERSPECTIVE</div>
                <AdminDashboard token={token} />
             </div>
          </div>
        );
      default:
        return (
          <div className="screen-state">
             <div className="screen-state__card">
                <p className="eyebrow">ACCESS GRANTED</p>
                <h2>Redirecting to {role} resources...</h2>
             </div>
          </div>
        );
    }
  };

  return (
    <AppShell
      title={`${roleMeta[role]?.label ?? 'User'} Dashboard`}
      subtitle={roleMeta[role]?.strapline ?? 'Institutional Intelligence Workspace'}
    >
       {renderDashboard()}
    </AppShell>
  );
}

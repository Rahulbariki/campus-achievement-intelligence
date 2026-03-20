import { Navigate, Route, Routes } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import RoleDashboardPage from './pages/RoleDashboardPage';
import ProtectedRoute from './router/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/auth" element={<AuthPage />} />

      <Route element={<ProtectedRoute allowedRoles={['student']} />}>
        <Route path="/dashboard/student" element={<RoleDashboardPage />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['faculty']} />}>
        <Route path="/dashboard/faculty" element={<RoleDashboardPage />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/dashboard/admin" element={<RoleDashboardPage />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['hod']} />}>
        <Route path="/dashboard/hod" element={<RoleDashboardPage />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
        <Route path="/dashboard/super-admin" element={<RoleDashboardPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

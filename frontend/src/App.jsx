import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import HomePage from './pages/HomePage';
import HodDashboardPage from './pages/HodDashboardPage';
import RoleDashboardPage from './pages/RoleDashboardPage';
import StudentDashboardPage from './pages/StudentDashboardPage';
import ProtectedRoute from './router/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth" element={<Navigate to="/login" replace />} />

      <Route element={<ProtectedRoute allowedRoles={['student']} />}>
        <Route path="/dashboard/student" element={<StudentDashboardPage />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['faculty']} />}>
        <Route path="/dashboard/faculty" element={<RoleDashboardPage />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/dashboard/admin" element={<AdminDashboardPage />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['hod']} />}>
        <Route path="/dashboard/hod" element={<HodDashboardPage />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
        <Route path="/dashboard/super-admin" element={<RoleDashboardPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

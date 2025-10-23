import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AuthProvider, useAuth } from './context/AuthContext';
import './styles/sweetalert-custom.css'; // Estilos personalizados para SweetAlert2
import Layout from './components/Layout/Layout';
import HomePage from './pages/HomePage';
import LoginForm from './components/Auth/LoginForm';
import Dashboard from './pages/dashboard/Dashboard';
import RequestPermissionForm from './pages/requests/RequestPermissionForm';
import MyRequests from './pages/requests/MyRequests';
import PendingRequests from './pages/requests/PendingRequests';
import BulkUserUpload from './pages/admin/BulkUserUpload';
import BulkSectorUpload from './pages/admin/BulkSectorUpload';
import UserList from './pages/admin/UserList';
import PermissionTypesManagement from './pages/hr/PermissionTypesManagement';
import BulkPermissionTypeUpload from './pages/hr/BulkPermissionTypeUpload';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import RequestDetail from './pages/requests/RequestDetail';
import ReportsPage from './pages/reports/ReportsPage';
import AllHRRequests from './pages/dashboard/AllHRRequests';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

console.log(import.meta.env);

// Componente para rutas protegidas
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Componente principal de la aplicación después de envolver con AuthProvider
const AppContent = () => {
  const { user } = useAuth();

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} 
          />
          <Route 
            path="/login" 
            element={
              user ? <Navigate to="/" replace /> : <LoginForm />
            } 
          />
          <Route 
            path="/dashboard/*" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/request-permission" 
            element={
              <ProtectedRoute allowedRoles={['EMPLOYEE', 'MANAGER', 'HR']}>
                <RequestPermissionForm />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/requests" 
            element={
              <ProtectedRoute allowedRoles={['EMPLOYEE', 'MANAGER', 'HR']}>
                <MyRequests />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/pending-requests" 
            element={
              <ProtectedRoute allowedRoles={['MANAGER', 'HR']}>
                <PendingRequests />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/request-detail/:id" 
            element={
              <ProtectedRoute allowedRoles={['EMPLOYEE', 'MANAGER', 'HR']}>
                <RequestDetail />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/bulk-user-upload" 
            element={
              <ProtectedRoute allowedRoles={['HR']}>
                <BulkUserUpload />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/bulk-sector-upload" 
            element={
              <ProtectedRoute allowedRoles={['HR']}>
                <BulkSectorUpload />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/user-list" 
            element={
              <ProtectedRoute allowedRoles={['HR']}>
                <UserList />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/permission-types-management" 
            element={
              <ProtectedRoute allowedRoles={['HR']}>
                <PermissionTypesManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/bulk-permission-type-upload" 
            element={
              <ProtectedRoute allowedRoles={['HR']}>
                <BulkPermissionTypeUpload />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/reports" 
            element={
              <ProtectedRoute allowedRoles={['HR']}>
                <ReportsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/hr-all-requests" 
            element={
              <ProtectedRoute allowedRoles={['HR']}>
                <AllHRRequests />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/forgot-password" 
            element={
              user ? <Navigate to="/" replace /> : <ForgotPassword />
            } 
          />
          <Route 
            path="/reset-password" 
            element={
              user ? <Navigate to="/" replace /> : <ResetPassword />
            } 
          />
          {/* Agregar más rutas según sea necesario */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </Layout>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
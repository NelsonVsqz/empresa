import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import HRDashboard from './HRDashboard';
import ManagerDashboard from './ManagerDashboard';

// Componente principal del dashboard que enruta según el rol del usuario
const Dashboard = () => {
  const { user } = useAuth();

  // Si no hay usuario autenticado, redirigir al login
  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <Routes>
      {user.role === 'HR' && (
        <Route path="/hr/*" element={<HRDashboard />} />
      )}
      {user.role === 'MANAGER' && (
        <Route path="/manager/*" element={<ManagerDashboard />} />
      )}
      {/* Si el usuario no es HR o MANAGER, redirigir al home */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default Dashboard;
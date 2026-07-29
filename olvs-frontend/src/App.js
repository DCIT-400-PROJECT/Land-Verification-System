import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import VerifyLand from './pages/VerifyLand';
import LandRecords from './pages/LandRecords';
import LandRecordDetail from './pages/LandRecordDetail';
import CreateRecord from './pages/CreateRecord';
import Transfers from './pages/Transfers';
import AuditLog from './pages/AuditLog';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
      <div className="spin" style={{ width: 32, height: 32, border: '3px solid var(--border)',
        borderTopColor: 'var(--gold)', borderRadius: '50%' }} />
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}

function AdminOnly({ children }) {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Layout>
      <Routes>
        <Route path="/"                     element={<Landing />} />
        <Route path="/login"                element={<Login />} />
        <Route path="/register"             element={<Register />} />
        <Route path="/dashboard"            element={<Protected><Dashboard /></Protected>} />
        <Route path="/verify"               element={<Protected><VerifyLand /></Protected>} />

        {/* Admin routes: static segments defined before the dynamic :id segment */}
        <Route path="/admin/records"        element={<AdminOnly><LandRecords /></AdminOnly>} />
        <Route path="/admin/records/create" element={<AdminOnly><CreateRecord /></AdminOnly>} />
        <Route path="/admin/records/:id"    element={<AdminOnly><LandRecordDetail /></AdminOnly>} />
        <Route path="/admin/transfers"      element={<AdminOnly><Transfers /></AdminOnly>} />
        <Route path="/admin/audit"          element={<AdminOnly><AuditLog /></AdminOnly>} />

        <Route path="*"                     element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

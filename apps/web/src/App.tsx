import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useStore } from './store';
import { authApi } from './services/api';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AuthorDashboard from './pages/AuthorDashboard';
import ManagerKanban from './pages/ManagerKanban';
import TechnicalEditorDashboard from './pages/TechnicalEditorDashboard';
import DocumentManagement from './pages/DocumentManagement';
import CopyEditorDocuments from './pages/CopyEditorDocuments';
import TechnicalEditorDocuments from './pages/TechnicalEditorDocuments';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  const { setUser, isAuthenticated } = useStore();

  useEffect(() => {
    if (isAuthenticated) {
      authApi.me().then(setUser).catch(() => useStore.getState().logout());
    }
  }, []);

  return (
    <BrowserRouter>
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: { background: '#1ABC9C', color: '#fff' },
          success: { iconTheme: { primary: '#fff', secondary: '#1ABC9C' } },
          error: { iconTheme: { primary: '#fff', secondary: '#E74C3C' } },
        }}
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="author" element={<AuthorDashboard />} />
          <Route path="manager" element={<ManagerKanban />} />
          <Route path="manager/documents" element={<DocumentManagement />} />
          <Route path="te" element={<TechnicalEditorDashboard />} />
          <Route path="te/documents" element={<TechnicalEditorDocuments />} />
          <Route path="ce/documents" element={<CopyEditorDocuments />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
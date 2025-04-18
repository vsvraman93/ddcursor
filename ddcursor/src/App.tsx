import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, Alert, Snackbar } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { Login } from './components/auth/Login';
import { Dashboard } from './components/dashboard/Dashboard';
import { DocumentManager } from './components/documents/DocumentManager';
import { QuestionManager } from './components/questions/QuestionManager';
import { WorkspaceManager } from './components/workspace/WorkspaceManager';
import config, { validateConfig } from './config';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const [configError, setConfigError] = useState<string | null>(null);

  useEffect(() => {
    try {
      validateConfig();
    } catch (error) {
      setConfigError((error as Error).message);
    }
  }, []);

  if (configError) {
    return (
      <ThemeProvider theme={theme}>
        <Snackbar open={true} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
          <Alert severity="error" sx={{ width: '100%' }}>
            {configError}
          </Alert>
        </Snackbar>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/documents"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <DocumentManager />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/questions"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <QuestionManager />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/workspaces"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <WorkspaceManager />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <div>Settings Content</div>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <div>Profile Content</div>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App; 
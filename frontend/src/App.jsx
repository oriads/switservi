import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import ChangesList from './pages/ChangesList';
import ChangeForm from './pages/ChangeForm';
import ChangeDetail from './pages/ChangeDetail';
import Evidencias from './pages/Evidencias';
import IBMiJobs from './pages/IBMiJobs';
import UsersManagement from './pages/UsersManagement';
import IBMiConnections from './pages/IBMiConnections';

// Verificar si el usuario está autenticado
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          {/* Login */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Rutas protegidas */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout title="Dashboard">
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/changes"
            element={
              <ProtectedRoute>
                <Layout title="Control de Cambios">
                  <ChangesList />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/changes/new"
            element={
              <ProtectedRoute>
                <Layout title="Nuevo Cambio">
                  <ChangeForm />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/changes/:id"
            element={
              <ProtectedRoute>
                <Layout title="Detalle del Cambio">
                  <ChangeDetail />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/changes/:id/edit"
            element={
              <ProtectedRoute>
                <Layout title="Editar Cambio">
                  <ChangeForm isEdit />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/evidencias"
            element={
              <ProtectedRoute>
                <Layout title="Evidencias">
                  <Evidencias />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/evidencias/:changeId"
            element={
              <ProtectedRoute>
                <Layout title="Evidencias del Cambio">
                  <Evidencias />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/ibmi-jobs"
            element={
              <ProtectedRoute>
                <Layout title="Trabajos IBM i">
                  <IBMiJobs />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <Layout title="Gestión de Usuarios">
                  <UsersManagement />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/ibmi-admin"
            element={
              <ProtectedRoute>
                <Layout title="Conexiones IBM i">
                  <IBMiConnections />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          {/* Redirigir rutas desconocidas */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

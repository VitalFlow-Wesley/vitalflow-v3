import { useAuth, ROLE_LEVELS } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-400">Carregando...</p>
        </div>
      </div>
    );
  }
  if (!user || user === false) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export const GestorRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }
  if (!user || user === false) {
    return <Navigate to="/login" replace />;
  }
  const nivel = ROLE_LEVELS[user.nivel_acesso] || 99;
  if (nivel > 7) {
    return <Navigate to="/" replace />;
  }
  return children;
};

export default ProtectedRoute;

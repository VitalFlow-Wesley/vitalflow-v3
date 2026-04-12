import { Navigate } from "react-router-dom";
import { useAuth, ROLE_LEVELS } from "../contexts/AuthContext";
export default function RoleGuard({ children, minRole="Gestor", redirectTo="/home" }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"#0d1117"}}><p style={{color:"#6b7280"}}>Verificando...</p></div>;
  if (!user) return <Navigate to="/login" replace />;
  if ((ROLE_LEVELS[user.role]??99) > (ROLE_LEVELS[minRole]??99)) return <Navigate to={redirectTo} replace />;
  return children;
}
export function ShowIfRole({ minRole, children }) {
  const { user } = useAuth();
  if (!user) return null;
  if ((ROLE_LEVELS[user.role]??99) > (ROLE_LEVELS[minRole]??99)) return null;
  return children;
}

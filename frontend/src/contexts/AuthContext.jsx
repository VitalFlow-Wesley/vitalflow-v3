import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export const ROLE_LEVELS = {
  CEO: 1,
  Diretor: 2,
  "Ger. Executivo": 3,
  "Ger. Operacional": 4,
  Coordenador: 5,
  Supervisor: 6,
  Gestor: 7,
  Colaborador: 8,
};

export const CAN_ACCESS_GESTAO = (role) => ROLE_LEVELS[role] <= 7;
export const IS_ADMIN = (role) => ROLE_LEVELS[role] <= 1;
export const IS_DIRETOR_OR_ABOVE = (role) => ROLE_LEVELS[role] <= 2;
export const IS_GERENTE_OR_ABOVE = (role) => ROLE_LEVELS[role] <= 4;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        }
      } catch (e) {
        console.error("Erro ao buscar usuário:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const canAccess = (minRole) => {
    if (!user) return false;
    return ROLE_LEVELS[user.role] <= ROLE_LEVELS[minRole];
  };

  const getScopeFilter = () => {
    if (!user) return {};
    if (IS_ADMIN(user.role)) return {};
    if (IS_DIRETOR_OR_ABOVE(user.role)) return { diretoria: user.diretoria };
    if (IS_GERENTE_OR_ABOVE(user.role)) return { gestorId: user.id };
    return { gestorImediatoId: user.id };
  };

  return (
    <AuthContext.Provider value={{ user, loading, canAccess, getScopeFilter, ROLE_LEVELS }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
};

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

export const IS_ADMIN = (role) => ROLE_LEVELS[role] <= 1;
export const IS_DIRETOR_OR_ABOVE = (role) => ROLE_LEVELS[role] <= 2;
export const IS_GERENTE_OR_ABOVE = (role) => ROLE_LEVELS[role] <= 4;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) { setLoading(false); return; }
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        localStorage.removeItem("token");
        setUser(null);
      }
    } catch (e) {
      console.error("Erro ao buscar usuário:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUser(); }, []);

  const login = async (email, password) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.access_token) {
        localStorage.setItem("token", data.access_token);
        await fetchUser();
        return { success: true };
      }
      return { success: false, error: data.detail || "Credenciais inválidas" };
    } catch (e) {
      return { success: false, error: "Erro de conexão" };
    }
  };

  const register = async (userData) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
      const data = await res.json();
      if (res.ok && data.access_token) {
        localStorage.setItem("token", data.access_token);
        await fetchUser();
        return { success: true };
      }
      return { success: false, error: data.detail || "Erro ao cadastrar" };
    } catch (e) {
      return { success: false, error: "Erro de conexão" };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const refreshUser = () => fetchUser();

  const getScopeFilter = () => {
    if (!user) return {};
    if (IS_ADMIN(user.role)) return {};
    if (IS_DIRETOR_OR_ABOVE(user.role)) return { diretoria: user.diretoria };
    if (IS_GERENTE_OR_ABOVE(user.role)) return { gestorId: user.id };
    return { gestorImediatoId: user.id };
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, refreshUser, getScopeFilter, ROLE_LEVELS }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
};

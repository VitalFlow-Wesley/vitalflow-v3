import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || "https://vitalflow.up.railway.app";

// Definição da URL do Backend (Vercel usa a variável ou o fallback do Railway)
const API_URL = process.env.REACT_APP_BACKEND_URL || "https://vitalflow.up.railway.app";

export const ROLE_LEVELS = {
  CEO: 1, Diretor: 2, "Ger. Executivo": 3, "Ger. Operacional": 4,
  Coordenador: 5, Supervisor: 6, Gestor: 7, Colaborador: 8,
};

export const IS_ADMIN = (role) => ROLE_LEVELS[role] <= 1;
export const IS_DIRETOR_OR_ABOVE = (role) => ROLE_LEVELS[role] <= 2;
export const IS_GERENTE_OR_ABOVE = (role) => ROLE_LEVELS[role] <= 4;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      // Usando API_URL dinâmica
      const token = localStorage.getItem("vf_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API_URL}/api/auth/me`, { credentials: "include", headers });
      if (res.ok) {
        const data = await res.json();
        // Backend retorna nivel_acesso, mapeamos para role
        setUser({ ...data, role: data.nivel_acesso || data.role });
      } else {
        setUser(null);
      }
    } catch (e) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUser(); }, []);

  const login = async (email, password) => {
    try {
      // Usando API_URL dinâmica
      localStorage.removeItem('vf_user');
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.access_token) localStorage.setItem("vf_token", data.access_token);
        await fetchUser();
        return { success: true, data };
      }
      return { success: false, error: data.detail || "Credenciais inválidas" };
    } catch (e) {
      return { success: false, error: "Erro de conexão" };
    }
  };

  const register = async (userData) => {
    try {
      // Usando API_URL dinâmica
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(userData),
      });
      const data = await res.json();
      if (res.ok) {
        await fetchUser();
        return { success: true, data };
      }
      return { success: false, error: data.detail || "Erro ao cadastrar" };
    } catch (e) {
      return { success: false, error: "Erro de conexão" };
    }
  };

  const logout = async () => {
    try {
      // Usando API_URL dinâmica
      await fetch(`${API_URL}/api/auth/logout`, { method: "POST", credentials: "include" });
      localStorage.removeItem('vf_user');
    } catch (e) {}
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
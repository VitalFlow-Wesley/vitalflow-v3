import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

const API_URL = (
  process.env.REACT_APP_BACKEND_URL || "https://vitalflow.up.railway.app"
).replace(/\/+$/, "");

export const ROLE_LEVELS = {
  CEO: 1,
  Diretor: 2,
  "Ger. Executivo": 3,
  "Ger. Operacional": 4,
  Coordenador: 5,
  Supervisor: 6,
  Gestor: 7,
  Colaborador: 8,
  USER: 8,
};

export const IS_ADMIN = (role) => ROLE_LEVELS[role] <= 1;
export const IS_DIRETOR_OR_ABOVE = (role) => ROLE_LEVELS[role] <= 2;
export const IS_GERENTE_OR_ABOVE = (role) => ROLE_LEVELS[role] <= 4;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const normalizeUser = (data) => {
    return {
      ...data,
      id: data.id || data._id,
      role: data.nivel_acesso || data.role,
      nivel_acesso: data.nivel_acesso || data.role || "USER",

      is_premium:
        Boolean(data?.is_premium) ||
        String(data?.plan || "").toLowerCase() === "premium" ||
        String(data?.subscription_plan || "").toLowerCase() === "premium",

      plan: String(
        data?.plan ||
          data?.subscription_plan ||
          (data?.is_premium ? "premium" : "free")
      ).toLowerCase(),

      is_b2b:
        Boolean(data?.is_b2b) ||
        String(data?.account_type || "").toLowerCase() === "corporate",
    };
  };

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("vf_token");
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const res = await fetch(`${API_URL}/api/auth/me`, {
        method: "GET",
        credentials: "include",
        headers,
      });

      if (res.ok) {
        const data = await res.json();
        setUser(normalizeUser(data));
      } else {
        setUser(null);
      }
    } catch (e) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.access_token) {
          localStorage.setItem("vf_token", data.access_token);
        }

        const normalized = normalizeUser(data);
        setUser(normalized);

        return { success: true, data: normalized };
      }

      return {
        success: false,
        error: data.detail || "Credenciais inválidas",
      };
    } catch (e) {
      return { success: false, error: "Erro de conexão" };
    }
  };

  const register = async (userData) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(userData),
      });

      const data = await res.json();

      if (res.ok) {
        const normalized = normalizeUser(data);
        setUser(normalized);
        return { success: true, data: normalized };
      }

      return {
        success: false,
        error: data.detail || "Erro ao cadastrar",
      };
    } catch (e) {
      return { success: false, error: "Erro de conexão" };
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (e) {}

    localStorage.removeItem("vf_token");
    localStorage.removeItem("vf_user");
    setUser(null);
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  const getScopeFilter = () => {
    if (!user) return {};

    const nivel = user.nivel_acesso || user.role;

    if (IS_ADMIN(nivel)) return {};
    if (IS_DIRETOR_OR_ABOVE(nivel)) return { diretoria: user.diretoria };
    if (IS_GERENTE_OR_ABOVE(nivel)) return { gestorId: user.id };

    return { gestorImediatoId: user.id };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        register,
        refreshUser,
        getScopeFilter,
        ROLE_LEVELS,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
};
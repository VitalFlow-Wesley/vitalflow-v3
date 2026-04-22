import { createContext, useContext, useState, useEffect, useRef } from "react";

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

  // ✅ FIX: ref para evitar logout acidental durante falhas temporárias de rede
  const userRef = useRef(null);
  const failCountRef = useRef(0);
  const MAX_FAILS_BEFORE_LOGOUT = 3;

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

  // ✅ FIX: tenta usar o refresh_token antes de deslogar
  const tryRefreshToken = async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      return res.ok;
    } catch {
      return false;
    }
  };

  const fetchUser = async ({ silent = false } = {}) => {
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
        const normalized = normalizeUser(data);
        userRef.current = normalized;
        setUser(normalized);
        failCountRef.current = 0; // reseta contador de falhas
        return true;
      }

      // ✅ FIX: se 401, tenta refresh antes de deslogar
      if (res.status === 401) {
        const refreshed = await tryRefreshToken();
        if (refreshed) {
          // tenta buscar o usuário novamente após refresh
          const res2 = await fetch(`${API_URL}/api/auth/me`, {
            method: "GET",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          });

          if (res2.ok) {
            const data2 = await res2.json();
            const normalized = normalizeUser(data2);
            userRef.current = normalized;
            setUser(normalized);
            failCountRef.current = 0;
            return true;
          }
        }

        // ✅ FIX: só desloga após múltiplas falhas consecutivas, não na primeira
        failCountRef.current += 1;
        if (failCountRef.current >= MAX_FAILS_BEFORE_LOGOUT) {
          userRef.current = null;
          setUser(null);
          localStorage.removeItem("vf_token");
        }
        // se silent=true (chamado pelo refreshUser do polling), mantém o user atual
        else if (silent && userRef.current) {
          // não faz nada — mantém o usuário já logado na memória
          return false;
        } else {
          setUser(null);
        }
        return false;
      }

      // outros erros (500, rede, etc.) — em modo silent mantém o user atual
      if (silent && userRef.current) {
        return false;
      }
      setUser(null);
      return false;
    } catch {
      // erro de rede — em modo silent NÃO desloga
      if (silent && userRef.current) {
        return false;
      }
      setUser(null);
      return false;
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
        userRef.current = normalized;
        failCountRef.current = 0;
        setUser(normalized);

        return { success: true, data: normalized };
      }

      return {
        success: false,
        error: data.detail || "Credenciais inválidas",
      };
    } catch {
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
        userRef.current = normalized;
        setUser(normalized);
        return { success: true, data: normalized };
      }

      return {
        success: false,
        error: data.detail || "Erro ao cadastrar",
      };
    } catch {
      return { success: false, error: "Erro de conexão" };
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {}

    localStorage.removeItem("vf_token");
    localStorage.removeItem("vf_user");
    userRef.current = null;
    failCountRef.current = 0;
    setUser(null);
  };

  // ✅ FIX: refreshUser em modo silencioso — não desloga em falhas temporárias
  const refreshUser = async () => {
    await fetchUser({ silent: true });
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

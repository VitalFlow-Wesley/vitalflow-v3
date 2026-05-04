import { Link, useLocation } from "react-router-dom";
import { BarChart3 } from "lucide-react";
import { useAuth, ROLE_LEVELS } from "../contexts/AuthContext";

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const getRoleLevel = (user) => {
  const role = normalize(user?.role);
  const nivelAcesso = normalize(user?.nivel_acesso);

  const mappedRole =
    ROLE_LEVELS?.[role] ??
    ROLE_LEVELS?.[nivelAcesso] ??
    ROLE_LEVELS?.[user?.role] ??
    ROLE_LEVELS?.[user?.nivel_acesso];

  if (typeof mappedRole === "number") return mappedRole;

  const numeric =
    Number(user?.role_level) ||
    Number(user?.nivel) ||
    Number(user?.access_level) ||
    Number(user?.nivelPermissao);

  return Number.isFinite(numeric) && numeric > 0 ? numeric : 99;
};

const isB2BAccount = (user) => {
  const accountType = normalize(
    user?.account_type ||
      user?.accountType ||
      user?.tipo_conta ||
      user?.tipoConta ||
      user?.plan_type ||
      user?.plano_tipo ||
      user?.segmento
  );

  return (
    accountType.includes("b2b") ||
    accountType.includes("empresa") ||
    accountType.includes("corporativo") ||
    Boolean(
      user?.company_id ||
        user?.empresa_id ||
        user?.organization_id ||
        user?.organizacao_id ||
        user?.tenant_id ||
        user?.cnpj
    )
  );
};

const canAccessGestor = (user) => {
  const role = normalize(user?.role || user?.nivel_acesso || user?.cargo);
  const level = getRoleLevel(user);

  const isManagerRole =
    role.includes("gestor") ||
    role.includes("supervisor") ||
    role.includes("admin") ||
    role.includes("owner") ||
    role.includes("empresa") ||
    level <= 7;

  return isB2BAccount(user) && isManagerRole;
};

export default function GestorSidebarLink({ collapsed = false }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!canAccessGestor(user)) return null;

  const active =
    location.pathname === "/gestor" ||
    location.pathname === "/gestor-dashboard" ||
    location.pathname.startsWith("/gestor");

  return (
    <Link
      to="/gestor-dashboard"
      className={
        active
          ? "flex items-center gap-3 rounded-xl bg-cyan-400/10 px-3 py-3 text-cyan-300"
          : "flex items-center gap-3 rounded-xl px-3 py-3 text-zinc-400 transition hover:bg-white/[0.04] hover:text-cyan-300"
      }
      title="Gestor"
    >
      <BarChart3 size={20} />
      {!collapsed && <span className="text-sm font-medium">Gestor</span>}
    </Link>
  );
}

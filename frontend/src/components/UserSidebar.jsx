import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Activity,
  TrendingUp,
  CalendarCheck,
  Smartphone,
  FileText,
  Settings,
  BarChart3,
  ShieldCheck,
} from "lucide-react";
import { useAuth, ROLE_LEVELS } from "../contexts/AuthContext";

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

function getRoleLevel(user) {
  const role = normalize(user?.role);
  const nivelAcesso = normalize(user?.nivel_acesso);

  const mapped =
    ROLE_LEVELS?.[role] ??
    ROLE_LEVELS?.[nivelAcesso] ??
    ROLE_LEVELS?.[user?.role] ??
    ROLE_LEVELS?.[user?.nivel_acesso];

  if (typeof mapped === "number") return mapped;

  const numeric =
    Number(user?.role_level) ||
    Number(user?.nivel) ||
    Number(user?.access_level) ||
    Number(user?.nivelPermissao);

  return Number.isFinite(numeric) && numeric > 0 ? numeric : 99;
}

function isB2BAccount(user) {
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
}

function canShowGestor(user) {
  const role = normalize(user?.role || user?.nivel_acesso || user?.cargo);
  const level = getRoleLevel(user);

  const isManagerRole =
    role.includes("gestor") ||
    role.includes("supervisor") ||
    role.includes("admin") ||
    role.includes("owner") ||
    level <= 7;

  return isB2BAccount(user) && isManagerRole;
}

const baseItems = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Análise", path: "/analise", icon: Activity },
  { label: "Tendências", path: "/tendencias", icon: TrendingUp },
  { label: "Rotinas", path: "/rotinas", icon: CalendarCheck },
  { label: "Dispositivos", path: "/devices", icon: Smartphone },
  { label: "Relatório", path: "/report", icon: FileText },
];

export default function UserSidebar({ collapsed = false }) {
  const location = useLocation();
  const { user } = useAuth();

  const items = canShowGestor(user)
    ? [
        ...baseItems,
        {
          label: "Gestor",
          path: "/gestor-dashboard",
          icon: BarChart3,
          gestorOnly: true,
        },
        { label: "Configurações", path: "/profile", icon: Settings },
      ]
    : [...baseItems, { label: "Configurações", path: "/profile", icon: Settings }];

  return (
    <aside
      className={
        collapsed
          ? "fixed left-0 top-0 z-30 flex h-screen w-20 flex-col border-r border-white/5 bg-[#05070a] px-3 py-5"
          : "fixed left-0 top-0 z-30 flex h-screen w-44 flex-col border-r border-white/5 bg-[#05070a] px-4 py-5"
      }
    >
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
          <ShieldCheck size={24} />
        </div>

        {!collapsed && (
          <div>
            <p className="text-lg font-bold text-white">VitalFlow</p>
            <p className="text-[10px] text-emerald-300">Plano Premium</p>
          </div>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-2">
        {items.map(({ label, path, icon: Icon, gestorOnly }) => {
          const active =
            location.pathname === path ||
            (path !== "/dashboard" && location.pathname.startsWith(path));

          return (
            <Link
              key={label}
              to={path}
              title={label}
              className={
                active
                  ? "flex items-center gap-3 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-3 text-cyan-300"
                  : gestorOnly
                  ? "flex items-center gap-3 rounded-xl border border-emerald-400/10 bg-emerald-400/[0.03] px-3 py-3 text-zinc-300 transition hover:bg-emerald-400/10 hover:text-emerald-300"
                  : "flex items-center gap-3 rounded-xl px-3 py-3 text-zinc-400 transition hover:bg-white/[0.04] hover:text-cyan-300"
              }
            >
              <Icon size={20} />
              {!collapsed && <span className="text-sm font-medium">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="rounded-xl border border-emerald-400/10 bg-emerald-400/[0.03] p-3">
          <div className="flex items-center gap-2 text-emerald-300">
            <ShieldCheck size={16} />
            <span className="text-xs font-bold">Plano Premium</span>
          </div>
          <p className="mt-1 text-xs text-zinc-500">Ativo</p>
        </div>
      )}
    </aside>
  );
}

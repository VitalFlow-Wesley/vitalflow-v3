import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Activity,
  TrendingUp,
  Repeat,
  Smartphone,
  FileText,
  Settings,
  Menu,
  Crown,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Análise", path: "/analise", icon: Activity },
  { label: "Tendências", path: "/tendencias", icon: TrendingUp },
  { label: "Rotinas", path: "/rotinas", icon: Repeat },
  { label: "Dispositivos", path: "/devices", icon: Smartphone },
  { label: "Relatório", path: "/relatorio", icon: FileText },
  { label: "Configurações", path: "/profile", icon: Settings },
];

export default function UserSidebar({ collapsed, onToggle }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <aside
      className={`hidden lg:flex h-[calc(100vh-64px)] shrink-0 flex-col border-r border-white/5 bg-[#050505] transition-all duration-300 ${
        collapsed ? "w-[76px]" : "w-[230px]"
      }`}
    >
      <div className="flex h-full flex-col p-3">
        <div className={`mb-4 flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
          {!collapsed && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-cyan-400">Navegação</p>
              <p className="mt-1 text-sm text-white/55">Área do usuário</p>
            </div>
          )}

          <button
            type="button"
            onClick={onToggle}
            title={collapsed ? "Abrir menu" : "Fechar menu"}
            className="rounded-2xl border border-white/10 bg-[#101214] p-3 text-white/70 transition hover:border-cyan-400/25 hover:bg-white/[0.04] hover:text-cyan-300"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <button
                key={item.label}
                type="button"
                title={collapsed ? item.label : undefined}
                onClick={() => navigate(item.path)}
                className={`group relative flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-all ${
                  collapsed ? "justify-center" : "justify-start"
                } ${
                  active
                    ? "border-cyan-400/25 bg-gradient-to-r from-cyan-500/14 to-violet-500/12 text-white shadow-[inset_3px_0_0_0_#22d3ee]"
                    : "border-transparent text-white/58 hover:border-white/8 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                <Icon className={`h-5 w-5 shrink-0 ${active ? "text-cyan-300" : "text-white/50 group-hover:text-cyan-200"}`} />
                {!collapsed && <span className="text-[15px] font-semibold">{item.label}</span>}

                {collapsed && (
                  <span className="pointer-events-none absolute left-[62px] z-50 whitespace-nowrap rounded-xl border border-white/10 bg-[#101214] px-3 py-2 text-xs font-semibold text-white opacity-0 shadow-2xl transition group-hover:opacity-100">
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto rounded-2xl border border-cyan-400/10 bg-gradient-to-br from-cyan-500/10 to-violet-500/10 p-3">
          <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
            <div className="rounded-2xl bg-cyan-400/10 p-2 text-cyan-300">
              <Crown className="h-4 w-4" />
            </div>
            {!collapsed && (
              <div>
                <p className="text-sm font-semibold text-white">Plano Premium</p>
                <p className="text-xs text-cyan-300">Ativo</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

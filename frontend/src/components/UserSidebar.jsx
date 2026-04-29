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
        collapsed ? "w-[68px]" : "w-[176px]"
      }`}
    >
      <div className="flex h-full flex-col p-2">
        <div className="mb-2 flex items-center justify-start">
          <button
            type="button"
            onClick={onToggle}
            title={collapsed ? "Abrir menu" : "Fechar menu"}
            className="rounded-xl border border-white/10 bg-[#101214] p-2 text-white/70 transition hover:border-cyan-400/25 hover:bg-white/[0.04] hover:text-cyan-300"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <button
                key={item.label}
                type="button"
                title={collapsed ? item.label : undefined}
                onClick={() => navigate(item.path)}
                className={`group relative flex w-full items-center gap-2.5 rounded-xl border px-2 py-2 text-left transition-all ${
                  collapsed ? "justify-center" : "justify-start"
                } ${
                  active
                    ? "border-cyan-400/25 bg-gradient-to-r from-cyan-500/14 to-violet-500/12 text-white shadow-[inset_3px_0_0_0_#22d3ee]"
                    : "border-transparent text-white/58 hover:border-white/8 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    active ? "text-cyan-300" : "text-white/50 group-hover:text-cyan-200"
                  }`}
                />

                {!collapsed && (
                  <span className="text-[13px] font-semibold">{item.label}</span>
                )}

                {collapsed && (
                  <span className="pointer-events-none absolute left-[54px] z-50 whitespace-nowrap rounded-xl border border-white/10 bg-[#101214] px-3 py-2 text-xs font-semibold text-white opacity-0 shadow-2xl transition group-hover:opacity-100">
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

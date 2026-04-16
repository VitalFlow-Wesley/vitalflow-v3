import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const SIDEBAR_ITEMS = [
  { group: "PAINEL", items: [{ label: "Painel do Gestor", path: "/gestor", icon: "grid" }] },
  {
    group: "GESTÃO",
    items: [
      { label: "Gestão de Colaboradores", path: "/gestor/colaboradores", icon: "users" },
      { label: "Setores & Equipes", path: "/gestor/setores", icon: "briefcase" },
      { label: "Hierarquia & Acesso", path: "/gestor/hierarquia", icon: "hierarchy" },
    ],
  },
  { group: "RELATÓRIOS", items: [{ label: "Relatórios de Equipe", path: "/gestor/relatorios", icon: "report" }] },
];

function Icon({ name }) {
  const icons = {
    grid: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
    users: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
    briefcase: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
      </svg>
    ),
    hierarchy: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="5" r="2" />
        <circle cx="5" cy="19" r="2" />
        <circle cx="19" cy="19" r="2" />
        <path d="M12 7v4M12 11l-7 6M12 11l7 6" />
      </svg>
    ),
    report: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  };

  return icons[name] || null;
}

export default function GestaoSidebar() {
  const [expanded, setExpanded] = useState(true);
  const [tooltip, setTooltip] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const isActivePath = (path) =>
    location.pathname === path || (path !== "/gestor" && location.pathname.startsWith(path));

  return (
    <aside
      className="bg-black border-r border-white/5 flex flex-col shrink-0 overflow-hidden transition-all duration-300"
      style={{
        width: expanded ? "250px" : "72px",
        minWidth: expanded ? "250px" : "72px",
      }}
    >
      <div className="px-3 py-4 border-b border-white/5 flex items-center min-h-[72px] justify-between">
        {expanded && (
          <div>
            <div className="text-[11px] uppercase tracking-[0.06em] text-cyan-400 font-bold">
              Área do Gestor
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              visão gerencial
            </div>
          </div>
        )}

        <button
          onClick={() => setExpanded(!expanded)}
          className="w-[30px] h-[30px] rounded-[10px] border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center"
        >
          {expanded ? "‹" : "›"}
        </button>
      </div>

      <div className="p-3 border-b border-white/5">
        <button
          onClick={() => navigate("/")}
          className="w-full flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-slate-400 hover:text-slate-200 transition-all text-xs font-medium px-3 py-2.5"
          style={{ justifyContent: expanded ? "flex-start" : "center" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          {expanded && "Voltar ao Meu Painel"}
        </button>
      </div>

      <nav className="flex-1 px-2.5 py-3 overflow-y-auto overflow-x-hidden">
        {SIDEBAR_ITEMS.map((group) => (
          <div key={group.group} className="mb-5">
            {expanded ? (
              <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-bold px-2 pb-2">
                {group.group}
              </div>
            ) : (
              <div className="h-2" />
            )}

            {group.items.map((item) => {
              const isActive = isActivePath(item.path);

              return (
                <div key={item.path} className="relative mb-2">
                  <button
                    onClick={() => navigate(item.path)}
                    onMouseEnter={() => !expanded && setTooltip(item.label)}
                    onMouseLeave={() => setTooltip(null)}
                    className={`w-full flex items-center gap-2.5 rounded-2xl text-[13px] transition-all px-3 py-3 ${
                      isActive
                        ? "bg-gradient-to-r from-cyan-500 to-purple-600 text-black font-bold shadow-lg shadow-cyan-500/15"
                        : "bg-white/[0.02] border border-white/10 text-slate-300 hover:bg-white/[0.06] hover:text-white"
                    }`}
                    style={{ justifyContent: expanded ? "flex-start" : "center" }}
                  >
                    <span className="shrink-0 flex">
                      <Icon name={item.icon} />
                    </span>
                    {expanded && <span className="truncate text-left">{item.label}</span>}
                  </button>

                  {!expanded && tooltip === item.label && (
                    <div className="absolute left-[70px] top-1/2 -translate-y-1/2 bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white whitespace-nowrap z-[1000] shadow-2xl pointer-events-none">
                      {item.label}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      {user && expanded && (
        <div className="px-4 py-3.5 border-t border-white/5 bg-white/[0.015] flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-xs font-bold text-cyan-400 shrink-0">
            {user.name?.split(" ").map((n) => n[0]).slice(0, 2).join("")}
          </div>

          <div className="overflow-hidden">
            <div className="text-xs text-white font-semibold truncate">
              {user.name}
            </div>
            <div className="text-[11px] text-slate-500">
              {user.role}
            </div>
          </div>
        </div>
      )}

      {user && !expanded && (
        <div className="py-3 border-t border-white/5 flex justify-center">
          <div className="w-9 h-9 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-xs font-bold text-cyan-400">
            {user.name?.split(" ").map((n) => n[0]).slice(0, 2).join("")}
          </div>
        </div>
      )}
    </aside>
  );
}
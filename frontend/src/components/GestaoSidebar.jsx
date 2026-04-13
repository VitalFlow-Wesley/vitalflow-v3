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
    grid: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
    users: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
    briefcase: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>,
    hierarchy: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><path d="M12 7v4M12 11l-7 6M12 11l7 6"/></svg>,
    report: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  };
  return icons[name] || null;
}

export default function GestaoSidebar() {
  const [expanded, setExpanded] = useState(true);
  const [tooltip, setTooltip] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  return (
    <aside style={{ width: expanded ? "250px" : "60px", minWidth: expanded ? "250px" : "60px", background:"#111827", borderRight:"1px solid #1e2d3d", display:"flex", flexDirection:"column", transition:"width 0.25s ease, min-width 0.25s ease", overflow:"hidden", flexShrink:0 }}>
      <div style={{ padding:"16px 12px", borderBottom:"1px solid #1e2d3d", display:"flex", alignItems:"center", justifyContent: expanded ? "space-between" : "center", minHeight:"60px" }}>
        {expanded && (
          <div>
            <div style={{ fontSize:"11px", color:"#0e9f8e", fontWeight:600, letterSpacing:"0.5px", whiteSpace:"nowrap" }}>ÁREA DO GESTOR</div>
            <div style={{ fontSize:"11px", color:"#4b5563", whiteSpace:"nowrap", marginTop:"2px" }}>Visão gerencial · dados agregados</div>
          </div>
        )}
        <button onClick={() => setExpanded(!expanded)} style={{ width:"28px", height:"28px", borderRadius:"6px", border:"1px solid #1e2d3d", background:"transparent", color:"#6b7280", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          {expanded ? "‹" : "›"}
        </button>
      </div>

      <div style={{ padding:"8px 12px", borderBottom:"1px solid #1e2d3d" }}>
        <button onClick={() => navigate("/")} style={{ width:"100%", display:"flex", alignItems:"center", gap:"8px", padding:"8px 10px", borderRadius:"8px", border:"1px solid #1e2d3d", background:"transparent", color:"#6b7280", cursor:"pointer", fontSize:"12px" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          {expanded && "Voltar ao Meu Painel"}
        </button>
      </div>
      <nav style={{ flex:1, padding:"12px 0", overflowY:"auto", overflowX:"hidden" }}>
        {SIDEBAR_ITEMS.map((group) => (
          <div key={group.group} style={{ marginBottom:"8px" }}>
            {expanded && <div style={{ fontSize:"10px", color:"#4b5563", fontWeight:600, letterSpacing:"0.8px", padding:"8px 16px 4px", whiteSpace:"nowrap" }}>{group.group}</div>}
            {!expanded && <div style={{ height:"8px" }} />}
            {group.items.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== "/gestor" && location.pathname.startsWith(item.path));
              return (
                <div key={item.path} style={{ position:"relative" }}>
                  <button
                    onClick={() => navigate(item.path)}
                    onMouseEnter={() => !expanded && setTooltip(item.label)}
                    onMouseLeave={() => setTooltip(null)}
                    style={{ width:"100%", display:"flex", alignItems:"center", gap:"10px", padding: expanded ? "9px 16px" : "9px 0", justifyContent: expanded ? "flex-start" : "center", background: isActive ? "#0a2a22" : "transparent", border:"none", borderLeft: isActive ? "3px solid #0e9f8e" : "3px solid transparent", color: isActive ? "#0e9f8e" : "#9ca3af", cursor:"pointer", fontSize:"13px" }}
                  >
                    <span style={{ flexShrink:0, display:"flex" }}><Icon name={item.icon} /></span>
                    {expanded && <span style={{ whiteSpace:"nowrap", overflow:"hidden" }}>{item.label}</span>}
                  </button>
                  {!expanded && tooltip === item.label && (
                    <div style={{ position:"absolute", left:"66px", top:"50%", transform:"translateY(-50%)", background:"#1f2937", border:"1px solid #374151", borderRadius:"6px", padding:"6px 12px", fontSize:"12px", color:"#fff", whiteSpace:"nowrap", zIndex:1000, pointerEvents:"none" }}>
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
        <div style={{ padding:"12px 16px", borderTop:"1px solid #1e2d3d", display:"flex", alignItems:"center", gap:"10px" }}>
          <div style={{ width:"32px", height:"32px", borderRadius:"50%", background:"#0a2a22", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"12px", fontWeight:600, color:"#0e9f8e", flexShrink:0 }}>
            {user.name?.split(" ").map(n => n[0]).slice(0,2).join("")}
          </div>
          <div style={{ overflow:"hidden" }}>
            <div style={{ fontSize:"12px", color:"#fff", fontWeight:500, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{user.name}</div>
            <div style={{ fontSize:"11px", color:"#4b5563" }}>{user.role}</div>
          </div>
        </div>
      )}
    </aside>
  );
}

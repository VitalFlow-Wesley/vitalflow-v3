const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://vitalflow.up.railway.app";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const CARDS = [
  {
    path: "/gestor/colaboradores",
    icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
    iconBg: "#052e16", iconBorder: "#14532d", accentColor: "#22c55e",
    title: "Colaboradores", badge: "Gestão",
    desc: "Gerencie hierarquia, atribuições e níveis de acesso de toda a equipe.",
  },
  {
    path: "/gestor/setores",
    icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/><line x1="12" y1="12" x2="12" y2="17"/><line x1="9" y1="14.5" x2="15" y2="14.5"/></svg>,
    iconBg: "#1a0d2e", iconBorder: "#4c1d95", accentColor: "#a78bfa",
    title: "Setores & Equipes", badge: "Estrutura",
    desc: "Crie setores, organize equipes e defina responsáveis por divisão organizacional.",
  },
  {
    path: "/gestor/relatorios",
    icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0e9f8e" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    iconBg: "#022c22", iconBorder: "#065f46", accentColor: "#0e9f8e",
    title: "Relatórios", badge: "Análise",
    desc: "Gere e exporte relatórios por setor, equipe ou período com dados anonimizados.",
  },
];

const PERIODS = [
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "6m", label: "6 meses" },
];

const PIE_COLORS = { normal: "#22c55e", atencao: "#fbbf24", critico: "#ef4444" };

export default function GestorLanding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [period, setPeriod] = useState("7d");
  const [sector, setSector] = useState("todos");
  const [metrics, setMetrics] = useState(null);
  const [vscoreHistory, setVscoreHistory] = useState([]);
  const [statusDist, setStatusDist] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [mRes, vRes, sRes] = await Promise.all([
          fetch(`/api/dashboard/gestor/metrics?period=${period}&sector=${sector}`, { credentials: "include" }),
          fetch(`/api/dashboard/gestor/vscore-history?period=${period}&sector=${sector}`, { credentials: "include" }),
          fetch(`/api/setores`, { credentials: "include" }),
        ]);
        if (mRes.ok) setMetrics(await mRes.json());
        if (vRes.ok) {
          const data = await vRes.json();
          setVscoreHistory(data.history || []);
          setStatusDist(data.distribution || []);
        }
        if (sRes.ok) setSectors(await sRes.json());
      } catch (e) {
        console.error("Erro ao buscar dados do gestor:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [period, sector]);

  return (
    <div style={{ padding: "32px", flex: 1, overflowY: "auto" }}>

      {/* Header */}
      <div style={{ marginBottom: "36px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
          <div style={{ width: "4px", height: "28px", background: "#0e9f8e", borderRadius: "2px" }} />
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#fff", margin: 0 }}>Área do Gestor</h1>
        </div>
        <p style={{ fontSize: "13px", color: "#6b7280", marginLeft: "16px" }}>
          Olá, <span style={{ color: "#0e9f8e" }}>{user?.nome || user?.name || "Gestor"}</span>. Visão agregada · dados anonimizados (LGPD)
        </p>
      </div>

      {/* Cards de atalho */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "40px" }}>
        {CARDS.map((card) => (
          <button key={card.path} onClick={() => navigate(card.path)}
            style={{ background: "#111827", border: "1px solid #1e2d3d", borderRadius: "14px", padding: "24px 20px", cursor: "pointer", textAlign: "left", transition: "all 0.2s", position: "relative" }}
            onMouseOver={e => { e.currentTarget.style.borderColor = card.accentColor; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseOut={e => { e.currentTarget.style.borderColor = "#1e2d3d"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <div style={{ position: "absolute", top: "14px", right: "14px", border: `1px solid ${card.accentColor}44`, borderRadius: "20px", padding: "2px 8px", fontSize: "10px", color: card.accentColor, fontWeight: 500 }}>{card.badge}</div>
            <div style={{ width: "52px", height: "52px", background: card.iconBg, border: `1px solid ${card.iconBorder}`, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>{card.icon}</div>
            <div style={{ fontSize: "16px", fontWeight: 600, color: "#fff", marginBottom: "8px" }}>{card.title}</div>
            <div style={{ fontSize: "12px", color: "#6b7280", lineHeight: 1.6, marginBottom: "16px" }}>{card.desc}</div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: card.accentColor, fontWeight: 500 }}>
              Acessar
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </div>
          </button>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <span style={{ fontSize: "12px", color: "#6b7280" }}>Período:</span>
        </div>
        {PERIODS.map(p => (
          <button key={p.value} onClick={() => setPeriod(p.value)}
            style={{ padding: "6px 14px", borderRadius: "20px", fontSize: "12px", cursor: "pointer", border: period === p.value ? "1px solid #0e9f8e" : "1px solid #1e2d3d", background: period === p.value ? "#0e9f8e" : "transparent", color: period === p.value ? "#fff" : "#9ca3af" }}>
            {p.label}
          </button>
        ))}
        <select value={sector} onChange={e => setSector(e.target.value)}
          style={{ background: "#111827", border: "1px solid #1e2d3d", borderRadius: "8px", padding: "6px 12px", color: "#9ca3af", fontSize: "12px", marginLeft: "8px" }}>
          <option value="todos">Todos os Setores</option>
          {sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {/* Métricas */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" }}>
        {[
          { label: "V-Score Time", value: loading ? "—" : (metrics?.vscore_medio ?? "0"), color: "#ef4444", sub: "Média agregada" },
          { label: "Estresse Médio", value: loading ? "—" : (metrics?.estresse_medio ?? "0"), color: "#0e9f8e", sub: null },
          { label: "Colaboradores", value: loading ? "—" : (metrics?.total_colaboradores ?? "0"), color: "#fff", sub: `${metrics?.engajamento ?? 0}% engajados` },
          { label: "Críticos 24h", value: loading ? "—" : (metrics?.criticos_24h ?? "0"), color: "#ef4444", sub: null },
          { label: "Pico Estresse", value: loading ? "—" : (metrics?.pico_estresse ?? "N/A"), color: "#7c3aed", sub: null },
        ].map(m => (
          <div key={m.label} style={{ background: "#111827", border: "1px solid #1e2d3d", borderRadius: "10px", padding: "16px" }}>
            <div style={{ fontSize: "10px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "10px" }}>{m.label}</div>
            <div style={{ fontSize: "28px", fontWeight: 700, color: m.color }}>{m.value}</div>
            {m.sub && <div style={{ fontSize: "11px", color: "#4b5563", marginTop: "4px" }}>{m.sub}</div>}
          </div>
        ))}
      </div>

      {/* Gráficos */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        {/* Tendência V-Score */}
        <div style={{ background: "#111827", border: "1px solid #1e2d3d", borderRadius: "12px", padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0e9f8e" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
            <span style={{ fontSize: "13px", fontWeight: 500, color: "#fff" }}>Tendência V-Score ({PERIODS.find(p => p.value === period)?.label})</span>
          </div>
          {vscoreHistory.length === 0 ? (
            <div style={{ height: "180px", display: "flex", alignItems: "center", justifyContent: "center", color: "#4b5563", fontSize: "13px" }}>Sem dados</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={vscoreHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d" />
                <XAxis dataKey="date" stroke="#4b5563" tick={{ fontSize: 11 }} />
                <YAxis stroke="#4b5563" tick={{ fontSize: 11 }} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: "8px", color: "#fff", fontSize: "12px" }} />
                <Line type="monotone" dataKey="vscore" stroke="#0e9f8e" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Distribuição de Status */}
        <div style={{ background: "#111827", border: "1px solid #1e2d3d", borderRadius: "12px", padding: "20px" }}>
          <div style={{ fontSize: "13px", fontWeight: 500, color: "#fff", marginBottom: "20px" }}>Distribuição de Status</div>
          {statusDist.length === 0 ? (
            <div style={{ height: "180px", display: "flex", alignItems: "center", justifyContent: "center", color: "#4b5563", fontSize: "13px" }}>Sem dados</div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
              <ResponsiveContainer width="50%" height={160}>
                <PieChart>
                  <Pie data={statusDist} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={70}>
                    {statusDist.map((entry, i) => (
                      <Cell key={i} fill={PIE_COLORS[entry.name] || "#374151"} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {statusDist.map((entry, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#9ca3af" }}>
                    <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: PIE_COLORS[entry.name] || "#374151" }} />
                    <span style={{ textTransform: "capitalize" }}>{entry.name}</span>
                    <span style={{ color: "#fff", fontWeight: 500 }}>{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

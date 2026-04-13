import { useState, useEffect, useMemo } from "react";
import { useAuth, IS_ADMIN, IS_DIRETOR_OR_ABOVE, ROLE_LEVELS } from "../contexts/AuthContext";
import { ShowIfRole } from "../components/RoleGuard";
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://vitalflow.up.railway.app";

// Cor e label do V-Score
function vscoreStyle(score) {
  if (score === null || score === undefined || score === "—") return { color: "#6b7280", label: "—" };
  if (score >= 70) return { color: "#22c55e", label: score };
  if (score >= 50) return { color: "#fbbf24", label: score };
  return { color: "#ef4444", label: score };
}

// Badge de cargo com cor por nível
const ROLE_COLORS = {
  CEO: { bg: "#1a0d2e", color: "#a78bfa", border: "#4c1d95" },
  Diretor: { bg: "#0c1f3a", color: "#60a5fa", border: "#1e3a5f" },
  "Ger. Executivo": { bg: "#0d2618", color: "#34d399", border: "#064e3b" },
  "Ger. Operacional": { bg: "#0d2618", color: "#34d399", border: "#064e3b" },
  Coordenador: { bg: "#1a1a0a", color: "#fbbf24", border: "#451a03" },
  Supervisor: { bg: "#1a0a0a", color: "#f87171", border: "#450a0a" },
  Gestor: { bg: "#1a0a0a", color: "#f87171", border: "#450a0a" },
  Colaborador: { bg: "#111827", color: "#6b7280", border: "#1e2d3d" },
};

function RoleBadge({ role }) {
  const s = ROLE_COLORS[role] || ROLE_COLORS.Colaborador;
  return (
    <span style={{
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      borderRadius: "20px", fontSize: "11px", fontWeight: 500,
      padding: "2px 10px", whiteSpace: "nowrap",
    }}>
      {role}
    </span>
  );
}

function Avatar({ name, role }) {
  const initials = name?.split(" ").map(n => n[0]).slice(0, 2).join("") || "?";
  const s = ROLE_COLORS[role] || ROLE_COLORS.Colaborador;
  return (
    <div style={{
      width: "36px", height: "36px", borderRadius: "50%",
      background: s.bg, border: `1px solid ${s.border}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: "12px", fontWeight: 600, color: s.color, flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

const FILTER_ROLES = ["Todos", "CEO", "Diretor", "Gerente", "Coordenador", "Supervisor", "Gestor", "Colaborador"];

export default function GestaoColaboradores() {
  const { user, getScopeFilter } = useAuth();
  const [colaboradores, setColaboradores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("Todos");
  const [showModal, setShowModal] = useState(false);
  const [gestoresDisponiveis, setGestoresDisponiveis] = useState([]);
  const [setoresDisponiveis, setSetoresDisponiveis] = useState([]);

  // Busca colaboradores respeitando o escopo do usuário logado
  useEffect(() => {
    const fetchColabs = async () => {
      try {
        const scope = getScopeFilter();
        const params = new URLSearchParams(scope);
        const res = await fetch(`${BACKEND_URL}/api/colaboradores?${params}`);
        if (res.ok) {
          const data = await res.json();
          setColaboradores(data);
        }
      } catch (e) {
        console.error("Erro ao buscar colaboradores:", e);
      } finally {
        setLoading(false);
      }
    };

    const fetchAuxiliares = async () => {
      try {
        const [gRes, sRes] = await Promise.all([
          fetch(`${BACKEND_URL}/api/colaboradores?minRole=Gestor`),
          fetch(`${BACKEND_URL}/api/setores`),
        ]);
        if (gRes.ok) setGestoresDisponiveis(await gRes.json());
        if (sRes.ok) setSetoresDisponiveis(await sRes.json());
      } catch (e) {}
    };

    fetchColabs();
    fetchAuxiliares();
  }, []);

  // Filtragem local (busca + filtro de cargo)
  const filtered = useMemo(() => {
    return colaboradores.filter((c) => {
      const matchSearch =
        !search ||
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.email?.toLowerCase().includes(search.toLowerCase()) ||
        c.setor?.toLowerCase().includes(search.toLowerCase());

      const matchRole =
        filterRole === "Todos" ||
        c.role === filterRole ||
        (filterRole === "Gerente" && (c.role === "Ger. Executivo" || c.role === "Ger. Operacional"));

      return matchSearch && matchRole;
    });
  }, [colaboradores, search, filterRole]);

  // Métricas do topo
  const metrics = useMemo(() => {
    const total = colaboradores.length;
    const saudavel = colaboradores.filter(c => c.vscore >= 70).length;
    const critico = colaboradores.filter(c => c.vscore !== null && c.vscore < 50).length;
    return { total, saudavel, critico };
  }, [colaboradores]);

  const handleDelete = async (id) => {
    if (!confirm("Remover este colaborador da organização?")) return;
    try {
      await fetch(`${BACKEND_URL}/api/colaboradores/${id}`, { method: "DELETE" });
      setColaboradores(prev => prev.filter(c => c.id !== id));
    } catch (e) {
      alert("Erro ao remover colaborador.");
    }
  };

  return (
    <div style={{ padding: "24px", flex: 1, overflowY: "auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 600, color: "#fff" }}>Gestão de Colaboradores</h1>
          <p style={{ fontSize: "13px", color: "#6b7280", marginTop: "4px" }}>
            Gerencie hierarquia, atribuições e níveis de acesso da sua organização
          </p>
        </div>
        <ShowIfRole minRole="Coordenador">
          <button
            onClick={() => setShowModal(true)}
            style={{
              background: "#0e9f8e", color: "#fff", border: "none",
              padding: "9px 18px", borderRadius: "8px", fontSize: "13px",
              fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px",
            }}
          >
            + Adicionar Colaborador
          </button>
        </ShowIfRole>
      </div>

      {/* Métricas */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "24px" }}>
        {[
          { label: "Total de Colaboradores", value: metrics.total, color: "#0e9f8e", sub: "na sua visão" },
          { label: "V-Score Saudável", value: metrics.saudavel, color: "#22c55e", sub: `${metrics.total ? Math.round(metrics.saudavel / metrics.total * 100) : 0}% da equipe` },
          { label: "V-Score Crítico", value: metrics.critico, color: "#ef4444", sub: "nas últimas 24h" },
        ].map(m => (
          <div key={m.label} style={{ background: "#111827", border: "1px solid #1e2d3d", borderRadius: "10px", padding: "16px" }}>
            <div style={{ fontSize: "11px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>{m.label}</div>
            <div style={{ fontSize: "24px", fontWeight: 600, color: m.color }}>{loading ? "—" : m.value}</div>
            <div style={{ fontSize: "12px", color: "#4b5563", marginTop: "4px" }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Busca */}
      <div style={{
        background: "#111827", border: "1px solid #1e2d3d", borderRadius: "8px",
        padding: "10px 14px", display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px",
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nome, e-mail ou setor..."
          style={{
            background: "transparent", border: "none", color: "#fff",
            fontSize: "13px", outline: "none", width: "100%",
          }}
        />
      </div>

      {/* Filtros rápidos de cargo */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
        {FILTER_ROLES.map(role => (
          <button
            key={role}
            onClick={() => setFilterRole(role)}
            style={{
              padding: "6px 14px", borderRadius: "20px", fontSize: "12px",
              cursor: "pointer", fontWeight: filterRole === role ? 600 : 400,
              background: filterRole === role ? "#0e9f8e" : "transparent",
              color: filterRole === role ? "#fff" : "#9ca3af",
              border: filterRole === role ? "1px solid #0e9f8e" : "1px solid #1e2d3d",
              transition: "all 0.15s",
            }}
          >
            {role}
          </button>
        ))}
      </div>

      {/* Tabela */}
      <div style={{ background: "#111827", border: "1px solid #1e2d3d", borderRadius: "12px", overflow: "hidden" }}>
        {/* Cabeçalho */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "2fr 2fr 1.5fr 1.5fr 1.2fr 90px 90px",
          padding: "10px 20px", borderBottom: "1px solid #1e2d3d", gap: "8px",
        }}>
          {["Colaborador", "E-mail", "Nível", "Setor", "Gestor Imediato", "V-Score", "Ações"].map(h => (
            <div key={h} style={{ fontSize: "11px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 500 }}>
              {h}
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#4b5563" }}>Carregando...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#4b5563" }}>Nenhum colaborador encontrado.</div>
        ) : (
          filtered.map((c) => {
            const vs = vscoreStyle(c.vscore);
            return (
              <div
                key={c.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 2fr 1.5fr 1.5fr 1.2fr 90px 90px",
                  padding: "14px 20px", borderBottom: "1px solid #0d1117",
                  gap: "8px", alignItems: "center",
                  transition: "background 0.15s",
                }}
                onMouseOver={e => e.currentTarget.style.background = "#1a2332"}
                onMouseOut={e => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Avatar name={c.name} role={c.role} />
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 500, color: "#fff" }}>{c.name}</div>
                    <div style={{ fontSize: "11px", color: "#6b7280" }}>{c.cargo || c.role}</div>
                  </div>
                </div>
                <div style={{ fontSize: "12px", color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis" }}>{c.email}</div>
                <div><RoleBadge role={c.role} /></div>
                <div style={{ fontSize: "13px", color: "#9ca3af" }}>{c.setor || "—"}</div>
                <div style={{ fontSize: "13px", color: "#6b7280" }}>{c.gestorImediato || "—"}</div>
                <div style={{ fontSize: "15px", fontWeight: 600, color: vs.color }}>{vs.label}</div>
                <div style={{ display: "flex", gap: "6px" }}>
                  <ShowIfRole minRole="Coordenador">
                    <button
                      title="Editar"
                      style={{
                        width: "28px", height: "28px", borderRadius: "6px",
                        border: "1px solid #1e2d3d", background: "transparent",
                        color: "#6b7280", cursor: "pointer", fontSize: "13px",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >✏️</button>
                    <button
                      title="Transferir"
                      style={{
                        width: "28px", height: "28px", borderRadius: "6px",
                        border: "1px solid #1e2d3d", background: "transparent",
                        color: "#6b7280", cursor: "pointer", fontSize: "13px",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >⇄</button>
                  </ShowIfRole>
                  <ShowIfRole minRole="Diretor">
                    <button
                      title="Remover"
                      onClick={() => handleDelete(c.id)}
                      style={{
                        width: "28px", height: "28px", borderRadius: "6px",
                        border: "1px solid #450a0a", background: "transparent",
                        color: "#f87171", cursor: "pointer", fontSize: "13px",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >✕</button>
                  </ShowIfRole>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Adicionar Colaborador */}
      {showModal && (
        <AddColaboradorModal
          gestores={gestoresDisponiveis}
          setores={setoresDisponiveis}
          onClose={() => setShowModal(false)}
          onSave={(novo) => {
            setColaboradores(prev => [...prev, novo]);
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
}

// ─── Modal de Adicionar ───────────────────────────────────────────────────────

function AddColaboradorModal({ gestores, setores, onClose, onSave }) {
  const [form, setForm] = useState({
    name: "", email: "", role: "", cargo: "", gestorImediatoId: "", setorId: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Gestor selecionado para mostrar a cadeia
  const gestorSelecionado = gestores.find(g => String(g.id) === String(form.gestorImediatoId));

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.role) {
      setError("Nome, e-mail e nível são obrigatórios.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/colaboradores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(await res.text());
      const novo = await res.json();
      onSave(novo);
    } catch (e) {
      setError(e.message || "Erro ao salvar.");
    } finally {
      setLoading(false);
    }
  };

  const inp = {
    width: "100%", background: "#0d1117", border: "1px solid #1e2d3d",
    borderRadius: "8px", padding: "9px 12px", color: "#fff", fontSize: "13px",
    outline: "none", boxSizing: "border-box",
  };
  const lbl = { fontSize: "12px", color: "#9ca3af", marginBottom: "6px", display: "block" };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
    }}>
      <div style={{
        background: "#111827", border: "1px solid #374151", borderRadius: "14px",
        padding: "28px", width: "100%", maxWidth: "540px", maxHeight: "90vh", overflowY: "auto",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#fff" }}>Adicionar Colaborador</h2>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#6b7280", cursor: "pointer", fontSize: "18px" }}>✕</button>
        </div>
        <p style={{ fontSize: "12px", color: "#6b7280", marginBottom: "20px" }}>
          Preencha os dados. O acesso será configurado automaticamente pelo gestor imediato.
        </p>

        {error && (
          <div style={{ background: "#450a0a", border: "1px solid #7f1d1d", borderRadius: "8px", padding: "10px 14px", fontSize: "12px", color: "#f87171", marginBottom: "16px" }}>
            {error}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
          <div>
            <label style={lbl}>Nome completo *</label>
            <input style={inp} placeholder="Ex: Ana Lima" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label style={lbl}>E-mail corporativo *</label>
            <input style={inp} type="email" placeholder="ana@empresa.com.br" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
          <div>
            <label style={lbl}>Nível hierárquico *</label>
            <select style={{ ...inp, color: form.role ? "#fff" : "#6b7280" }} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
              <option value="">Selecionar nível...</option>
              {Object.keys(ROLE_LEVELS).map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Cargo / Função</label>
            <input style={inp} placeholder="Ex: Analista de RH" value={form.cargo} onChange={e => setForm(f => ({ ...f, cargo: e.target.value }))} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
          <div>
            <label style={lbl}>Gestor imediato</label>
            <select style={{ ...inp, color: "#fff" }} value={form.gestorImediatoId} onChange={e => setForm(f => ({ ...f, gestorImediatoId: e.target.value }))}>
              <option value="">— Sem gestor (topo) —</option>
              {gestores.map(g => <option key={g.id} value={g.id}>{g.name} ({g.role})</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Setor</label>
            <select style={{ ...inp, color: "#fff" }} value={form.setorId} onChange={e => setForm(f => ({ ...f, setorId: e.target.value }))}>
              <option value="">Selecionar setor...</option>
              {setores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        {/* Cadeia automática */}
        {gestorSelecionado && (
          <div style={{
            background: "#0a1628", border: "1px solid #1e3a5f", borderRadius: "8px",
            padding: "12px 16px", marginBottom: "16px",
          }}>
            <div style={{ fontSize: "11px", color: "#60a5fa", fontWeight: 500, marginBottom: "6px" }}>
              🔗 Cadeia de acesso gerada automaticamente
            </div>
            <div style={{ fontSize: "12px", color: "#6b7280", lineHeight: 1.8 }}>
              {gestorSelecionado.cadeia?.join(" → ") || gestorSelecionado.name} →{" "}
              <span style={{ color: "#0e9f8e" }}>{form.name || "novo colaborador"}</span>
            </div>
            <div style={{ fontSize: "11px", color: "#4b5563", marginTop: "6px" }}>
              {form.name || "O colaborador"} poderá ver os dados dos colaboradores abaixo dele na hierarquia.
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{
            background: "transparent", border: "1px solid #374151", color: "#9ca3af",
            padding: "9px 18px", borderRadius: "8px", fontSize: "13px", cursor: "pointer",
          }}>
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={loading} style={{
            background: loading ? "#064e3b" : "#0e9f8e", border: "none", color: "#fff",
            padding: "9px 18px", borderRadius: "8px", fontSize: "13px",
            fontWeight: 500, cursor: loading ? "not-allowed" : "pointer",
          }}>
            {loading ? "Salvando..." : "Cadastrar Colaborador"}
          </button>
        </div>
      </div>
    </div>
  );
}

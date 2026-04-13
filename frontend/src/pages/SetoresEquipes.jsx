import { useState, useEffect } from "react";
import { ShowIfRole } from "../components/RoleGuard";
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://vitalflow.up.railway.app";

export default function SetoresEquipes() {
  const [setores, setSetores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalType, setModalType] = useState(null); // "setor" | "equipe"
  const [editTarget, setEditTarget] = useState(null);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/setores?includeEquipes=true&includeVscore=true`, { credentials: "include" })
      .then(r => r.ok ? r.json() : [])
      .then(data => { setSetores(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleDeleteSetor = async (id) => {
    if (!confirm("Excluir este setor? Os colaboradores serão movidos para 'Sem setor'.")) return;
    await fetch(`${BACKEND_URL}/api/setores/${id}`, { method: "DELETE" });
    setSetores(prev => prev.filter(s => s.id !== id));
  };

  const handleDeleteEquipe = async (setorId, equipeId) => {
    if (!confirm("Remover esta equipe? O acompanhamento subirá ao nível hierárquico superior.")) return;
    await fetch(`${BACKEND_URL}/api/equipes/${equipeId}`, { method: "DELETE" });
    setSetores(prev => prev.map(s =>
      s.id === setorId ? { ...s, equipes: s.equipes.filter(e => e.id !== equipeId) } : s
    ));
  };

  const vscoreColor = (v) => {
    if (!v && v !== 0) return "#6b7280";
    if (v >= 70) return "#22c55e";
    if (v >= 50) return "#fbbf24";
    return "#ef4444";
  };

  return (
    <div style={{ padding: "24px", flex: 1, overflowY: "auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 600, color: "#fff" }}>Setores & Equipes</h1>
          <p style={{ fontSize: "13px", color: "#6b7280", marginTop: "4px" }}>
            Gerencie estrutura organizacional, setores e atribuições de equipes
          </p>
        </div>
        <ShowIfRole minRole="Diretor">
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => { setModalType("equipe"); setEditTarget(null); }}
              style={{
                background: "transparent", border: "1px solid #0e9f8e", color: "#0e9f8e",
                padding: "9px 16px", borderRadius: "8px", fontSize: "13px", cursor: "pointer",
              }}
            >
              + Nova Equipe
            </button>
            <button
              onClick={() => { setModalType("setor"); setEditTarget(null); }}
              style={{
                background: "#0e9f8e", border: "none", color: "#fff",
                padding: "9px 16px", borderRadius: "8px", fontSize: "13px",
                fontWeight: 500, cursor: "pointer",
              }}
            >
              + Criar Setor
            </button>
          </div>
        </ShowIfRole>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "64px", color: "#4b5563" }}>Carregando setores...</div>
      ) : setores.length === 0 ? (
        <div style={{
          background: "#111827", border: "1px dashed #1e2d3d", borderRadius: "12px",
          padding: "64px", textAlign: "center",
        }}>
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>🏢</div>
          <div style={{ color: "#6b7280", marginBottom: "16px" }}>Nenhum setor cadastrado ainda.</div>
          <ShowIfRole minRole="Diretor">
            <button
              onClick={() => setModalType("setor")}
              style={{
                background: "#0e9f8e", border: "none", color: "#fff",
                padding: "9px 18px", borderRadius: "8px", fontSize: "13px", cursor: "pointer",
              }}
            >
              + Criar primeiro setor
            </button>
          </ShowIfRole>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {setores.map(setor => (
            <SetorCard
              key={setor.id}
              setor={setor}
              vscoreColor={vscoreColor}
              onDeleteSetor={handleDeleteSetor}
              onDeleteEquipe={handleDeleteEquipe}
              onRenameSetor={(s) => { setEditTarget(s); setModalType("renomear-setor"); }}
              onAddEquipe={(s) => { setEditTarget(s); setModalType("equipe"); }}
              onTransferirEquipe={(e) => { setEditTarget(e); setModalType("transferir"); }}
            />
          ))}
        </div>
      )}

      {/* Modais */}
      {modalType === "setor" && (
        <SetorModal
          onClose={() => setModalType(null)}
          onSave={(novo) => { setSetores(prev => [...prev, { ...novo, equipes: [] }]); setModalType(null); }}
        />
      )}
      {modalType === "equipe" && (
        <EquipeModal
          setores={setores}
          setorPreSelecionado={editTarget}
          onClose={() => setModalType(null)}
          onSave={(setorId, novaEquipe) => {
            setSetores(prev => prev.map(s =>
              s.id === setorId ? { ...s, equipes: [...(s.equipes || []), novaEquipe] } : s
            ));
            setModalType(null);
          }}
        />
      )}
      {modalType === "renomear-setor" && (
        <RenomearModal
          item={editTarget}
          tipo="Setor"
          onClose={() => setModalType(null)}
          onSave={async (id, novoNome) => {
            await fetch(`${BACKEND_URL}/api/setores/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: novoNome }),
            });
            setSetores(prev => prev.map(s => s.id === id ? { ...s, name: novoNome } : s));
            setModalType(null);
          }}
        />
      )}
    </div>
  );
}

// ─── Card de Setor ────────────────────────────────────────────────────────────

function SetorCard({ setor, vscoreColor, onDeleteSetor, onDeleteEquipe, onRenameSetor, onAddEquipe, onTransferirEquipe }) {
  const vscore = setor.vscore_medio;
  const vc = vscoreColor(vscore);

  const SETOR_ICONS = ["🏢", "⚙️", "📊", "🤝", "🔬", "🛡️", "🌐", "📦"];
  const icon = SETOR_ICONS[setor.id % SETOR_ICONS.length] || "🏢";

  return (
    <div style={{ background: "#111827", border: "1px solid #1e2d3d", borderRadius: "12px", overflow: "hidden" }}>
      {/* Cabeçalho do setor */}
      <div style={{
        padding: "16px 20px", borderBottom: "1px solid #1e2d3d",
        display: "flex", alignItems: "center", gap: "12px",
      }}>
        <div style={{
          width: "38px", height: "38px", background: "#0a2a22", borderRadius: "8px",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0,
        }}>
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "16px", fontWeight: 600, color: "#fff" }}>{setor.name}</div>
          <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>
            {setor.equipes?.length || 0} equipes · {setor.totalColaboradores || 0} colaboradores
            {vscore !== null && vscore !== undefined && (
              <span style={{ color: vc, marginLeft: "8px" }}>· V-Score médio: {vscore}</span>
            )}
          </div>
        </div>
        <ShowIfRole minRole="Diretor">
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => onRenameSetor(setor)}
              style={{
                background: "transparent", border: "1px solid #1e2d3d", color: "#9ca3af",
                padding: "6px 14px", borderRadius: "7px", fontSize: "12px", cursor: "pointer",
              }}
            >
              ✏️ Renomear
            </button>
            <button
              onClick={() => onDeleteSetor(setor.id)}
              style={{
                background: "transparent", border: "1px solid #450a0a", color: "#f87171",
                padding: "6px 14px", borderRadius: "7px", fontSize: "12px", cursor: "pointer",
              }}
            >
              🗑️ Excluir
            </button>
          </div>
        </ShowIfRole>
      </div>

      {/* Equipes dentro do setor */}
      <div style={{ padding: "12px 20px", display: "flex", flexDirection: "column", gap: "8px" }}>
        {(setor.equipes || []).map(equipe => (
          <div
            key={equipe.id}
            style={{
              background: "#0d1117", border: "1px solid #1e2d3d", borderRadius: "8px",
              padding: "12px 16px", display: "flex", alignItems: "center", gap: "12px",
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "13px", fontWeight: 500, color: "#fff" }}>{equipe.name}</div>
              <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>
                Responsável: {equipe.lider || "—"} · {equipe.colaboradores || 0} colaboradores
                {equipe.vscore_medio !== undefined && (
                  <span style={{ color: vscoreColor(equipe.vscore_medio), marginLeft: "8px" }}>
                    · V-Score: {equipe.vscore_medio ?? "—"}
                  </span>
                )}
              </div>
            </div>
            <ShowIfRole minRole="Coordenador">
              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  onClick={() => onTransferirEquipe(equipe)}
                  style={{
                    background: "transparent", border: "1px solid #1e2d3d", color: "#9ca3af",
                    padding: "5px 12px", borderRadius: "7px", fontSize: "12px", cursor: "pointer",
                  }}
                >
                  ⇄ Transferir
                </button>
                <button
                  onClick={() => onDeleteEquipe(setor.id, equipe.id)}
                  style={{
                    background: "transparent", border: "1px solid #450a0a", color: "#f87171",
                    padding: "5px 12px", borderRadius: "7px", fontSize: "12px", cursor: "pointer",
                  }}
                >
                  Remover
                </button>
              </div>
            </ShowIfRole>
          </div>
        ))}

        <ShowIfRole minRole="Coordenador">
          <button
            onClick={() => onAddEquipe(setor)}
            style={{
              background: "transparent", border: "1px dashed #1e2d3d", color: "#6b7280",
              borderRadius: "8px", padding: "10px", fontSize: "12px", cursor: "pointer",
              width: "100%", transition: "border-color 0.15s, color 0.15s",
            }}
            onMouseOver={e => { e.target.style.borderColor = "#0e9f8e"; e.target.style.color = "#0e9f8e"; }}
            onMouseOut={e => { e.target.style.borderColor = "#1e2d3d"; e.target.style.color = "#6b7280"; }}
          >
            + Adicionar Equipe a este Setor
          </button>
        </ShowIfRole>
      </div>
    </div>
  );
}

// ─── Modais auxiliares ────────────────────────────────────────────────────────

function SetorModal({ onClose, onSave }) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const res = await fetch(`${BACKEND_URL}/api/setores`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const novo = await res.json();
    onSave(novo);
    setSaving(false);
  };

  return <SimpleModal title="Criar Setor" onClose={onClose} onSave={handleSave} saving={saving}>
    <label style={{ fontSize: "12px", color: "#9ca3af", display: "block", marginBottom: "6px" }}>Nome do setor *</label>
    <input
      autoFocus value={name} onChange={e => setName(e.target.value)}
      placeholder="Ex: Diretoria de Operações"
      style={{ width: "100%", background: "#0d1117", border: "1px solid #1e2d3d", borderRadius: "8px", padding: "9px 12px", color: "#fff", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
    />
  </SimpleModal>;
}

function EquipeModal({ setores, setorPreSelecionado, onClose, onSave }) {
  const [name, setName] = useState("");
  const [setorId, setSetorId] = useState(setorPreSelecionado?.id || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !setorId) return;
    setSaving(true);
    const res = await fetch(`${BACKEND_URL}/api/equipes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, setorId }),
    });
    const nova = await res.json();
    onSave(Number(setorId), nova);
    setSaving(false);
  };

  const inp = { width: "100%", background: "#0d1117", border: "1px solid #1e2d3d", borderRadius: "8px", padding: "9px 12px", color: "#fff", fontSize: "13px", outline: "none", boxSizing: "border-box" };
  const lbl = { fontSize: "12px", color: "#9ca3af", display: "block", marginBottom: "6px" };

  return <SimpleModal title="Criar Equipe" onClose={onClose} onSave={handleSave} saving={saving}>
    <div style={{ marginBottom: "12px" }}>
      <label style={lbl}>Nome da equipe *</label>
      <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Alpha Squad" style={inp} />
    </div>
    <div>
      <label style={lbl}>Setor *</label>
      <select value={setorId} onChange={e => setSetorId(e.target.value)} style={{ ...inp, color: setorId ? "#fff" : "#6b7280" }}>
        <option value="">Selecionar setor...</option>
        {setores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
    </div>
  </SimpleModal>;
}

function RenomearModal({ item, tipo, onClose, onSave }) {
  const [name, setName] = useState(item?.name || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(item.id, name);
    setSaving(false);
  };

  return <SimpleModal title={`Renomear ${tipo}`} onClose={onClose} onSave={handleSave} saving={saving}>
    <label style={{ fontSize: "12px", color: "#9ca3af", display: "block", marginBottom: "6px" }}>Novo nome</label>
    <input
      autoFocus value={name} onChange={e => setName(e.target.value)}
      style={{ width: "100%", background: "#0d1117", border: "1px solid #1e2d3d", borderRadius: "8px", padding: "9px 12px", color: "#fff", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
    />
  </SimpleModal>;
}

function SimpleModal({ title, children, onClose, onSave, saving }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
    }}>
      <div style={{
        background: "#111827", border: "1px solid #374151", borderRadius: "12px",
        padding: "24px", width: "100%", maxWidth: "420px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "15px", fontWeight: 600, color: "#fff" }}>{title}</h2>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#6b7280", cursor: "pointer", fontSize: "18px" }}>✕</button>
        </div>
        {children}
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
          <button onClick={onClose} style={{ background: "transparent", border: "1px solid #374151", color: "#9ca3af", padding: "8px 16px", borderRadius: "8px", fontSize: "13px", cursor: "pointer" }}>
            Cancelar
          </button>
          <button onClick={onSave} disabled={saving} style={{ background: saving ? "#064e3b" : "#0e9f8e", border: "none", color: "#fff", padding: "8px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

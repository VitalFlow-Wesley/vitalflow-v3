import { useState, useEffect } from "react";
import { ShowIfRole } from "../components/RoleGuard";
import {
  Building2,
  Plus,
  Pencil,
  Trash2,
  Users,
  Activity,
  Layers3,
  ArrowLeftRight,
  X,
  FolderTree,
  Shield,
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";

const cardClass =
  "border border-white/10 bg-neutral-900/60 backdrop-blur-xl rounded-2xl";
const inputClass =
  "w-full bg-neutral-800 border border-white/10 rounded-xl px-3 py-3 text-sm text-white outline-none focus:border-cyan-500";
const labelClass = "block text-xs text-neutral-400 font-medium mb-1.5";

export default function SetoresEquipes() {
  const [setores, setSetores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalType, setModalType] = useState(null);
  const [editTarget, setEditTarget] = useState(null);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/setores?includeEquipes=true&includeVscore=true`, {
      credentials: "include",
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        const lista =
          Array.isArray(data)
            ? data
            : Array.isArray(data?.setores)
            ? data.setores
            : Array.isArray(data?.items)
            ? data.items
            : [];

        setSetores(lista);
        setLoading(false);
      })
      .catch(() => {
        setSetores([]);
        setLoading(false);
      });
  }, []);

  const handleDeleteSetor = async (id) => {
    if (!window.confirm("Excluir este setor? Os colaboradores serão movidos para 'Sem setor'.")) return;

    await fetch(`${BACKEND_URL}/api/setores/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    setSetores((prev) => prev.filter((s) => s.id !== id));
  };

  const handleDeleteEquipe = async (setorId, equipeId) => {
    if (!window.confirm("Remover esta equipe? O acompanhamento subirá ao nível hierárquico superior.")) return;

    await fetch(`${BACKEND_URL}/api/equipes/${equipeId}`, {
      method: "DELETE",
      credentials: "include",
    });

    setSetores((prev) =>
      prev.map((s) =>
        s.id === setorId
          ? { ...s, equipes: (s.equipes || []).filter((e) => e.id !== equipeId) }
          : s
      )
    );
  };

  const vscoreColor = (v) => {
    if (!v && v !== 0) return "#6b7280";
    if (v >= 70) return "#34d399";
    if (v >= 50) return "#fbbf24";
    return "#fb7185";
  };

  const listaSetores = Array.isArray(setores) ? setores : [];

  const totalEquipes = listaSetores.reduce(
    (acc, s) => acc + (s.equipes?.length || 0),
    0
  );

  const totalColaboradores = listaSetores.reduce(
    (acc, s) => acc + (s.totalColaboradores || 0),
    0
  );

  return (
    <div className="p-6 md:p-8 flex-1 overflow-y-auto text-white bg-black">
      <div className="mb-8">
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1.5 h-10 rounded-full bg-gradient-to-b from-cyan-400 to-purple-500" />
              <div>
                <h1 className="text-3xl font-black tracking-tighter">
                  Setores & Equipes
                </h1>
                <p className="text-sm text-neutral-400 mt-1">
                  Gerencie estrutura organizacional, setores e atribuições de equipes
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 text-cyan-300 text-xs font-semibold">
              <FolderTree className="w-3.5 h-3.5" />
              Estrutura organizacional VitalFlow
            </div>
          </div>

          <ShowIfRole minRole="Diretor">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => {
                  setModalType("equipe");
                  setEditTarget(null);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-semibold transition-all"
              >
                <Plus className="w-4 h-4" />
                Nova Equipe
              </button>

              <button
                onClick={() => {
                  setModalType("setor");
                  setEditTarget(null);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-black font-bold shadow-lg shadow-cyan-500/10 transition-all"
              >
                <Plus className="w-4 h-4" />
                Criar Setor
              </button>
            </div>
          </ShowIfRole>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <MetricCard
          icon={<Building2 className="w-5 h-5 text-cyan-300" />}
          label="Total de Setores"
          value={loading ? "—" : listaSetores.length}
          valueColor="text-cyan-300"
          sub="estrutura registrada"
        />
        <MetricCard
          icon={<Layers3 className="w-5 h-5 text-purple-300" />}
          label="Total de Equipes"
          value={loading ? "—" : totalEquipes}
          valueColor="text-purple-300"
          sub="equipes vinculadas"
        />
        <MetricCard
          icon={<Users className="w-5 h-5 text-emerald-300" />}
          label="Colaboradores"
          value={loading ? "—" : totalColaboradores}
          valueColor="text-emerald-300"
          sub="distribuídos na estrutura"
        />
      </div>

      {loading ? (
        <div className="text-center py-20 text-neutral-500">Carregando setores...</div>
      ) : listaSetores.length === 0 ? (
        <div className={`${cardClass} p-16 text-center`}>
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 mx-auto flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 text-neutral-500" />
          </div>
          <div className="text-neutral-400 mb-5">Nenhum setor cadastrado ainda.</div>

          <ShowIfRole minRole="Diretor">
            <button
              onClick={() => setModalType("setor")}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-black font-bold transition-all"
            >
              <Plus className="w-4 h-4" />
              Criar primeiro setor
            </button>
          </ShowIfRole>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {listaSetores.map((setor) => (
            <SetorCard
              key={setor.id}
              setor={setor}
              vscoreColor={vscoreColor}
              onDeleteSetor={handleDeleteSetor}
              onDeleteEquipe={handleDeleteEquipe}
              onRenameSetor={(s) => {
                setEditTarget(s);
                setModalType("renomear-setor");
              }}
              onAddEquipe={(s) => {
                setEditTarget(s);
                setModalType("equipe");
              }}
              onTransferirEquipe={(e) => {
                setEditTarget(e);
                setModalType("transferir");
              }}
            />
          ))}
        </div>
      )}

      {modalType === "setor" && (
        <SetorModal
          onClose={() => setModalType(null)}
          onSave={(novo) => {
            setSetores((prev) => [...prev, { ...novo, equipes: [] }]);
            setModalType(null);
          }}
        />
      )}

      {modalType === "equipe" && (
        <EquipeModal
          setores={listaSetores}
          setorPreSelecionado={editTarget}
          onClose={() => setModalType(null)}
          onSave={(setorId, novaEquipe) => {
            setSetores((prev) =>
              prev.map((s) =>
                s.id === setorId
                  ? { ...s, equipes: [...(s.equipes || []), novaEquipe] }
                  : s
              )
            );
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
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: novoNome }),
            });
            setSetores((prev) =>
              prev.map((s) => (s.id === id ? { ...s, name: novoNome } : s))
            );
            setModalType(null);
          }}
        />
      )}
    </div>
  );
}

function MetricCard({ icon, label, value, valueColor, sub }) {
  return (
    <div className="border border-white/10 bg-neutral-900/60 backdrop-blur-xl rounded-2xl p-5">
      <div className="w-11 h-11 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center mb-4">
        {icon}
      </div>
      <div className="text-[11px] text-neutral-500 uppercase tracking-[0.18em] font-bold mb-2">
        {label}
      </div>
      <div className={`text-3xl font-mono font-black ${valueColor}`}>{value}</div>
      <div className="text-xs text-neutral-500 mt-1">{sub}</div>
    </div>
  );
}

function SetorCard({
  setor,
  vscoreColor,
  onDeleteSetor,
  onDeleteEquipe,
  onRenameSetor,
  onAddEquipe,
  onTransferirEquipe,
}) {
  const vscore = setor.vscore_medio;
  const vc = vscoreColor(vscore);

  const SETOR_ICONS = [Building2, Layers3, BriefcaseIcon, Shield, Users, Activity];
  const IconComponent = SETOR_ICONS[setor.id % SETOR_ICONS.length] || Building2;

  return (
    <div className="border border-white/10 bg-neutral-900/60 backdrop-blur-xl rounded-2xl overflow-hidden">
      <div className="px-5 py-5 border-b border-white/10 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
          <IconComponent className="w-6 h-6 text-cyan-300" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-lg font-bold text-white">{setor.name}</div>
          <div className="text-sm text-neutral-500 mt-1">
            {(setor.equipes?.length || 0)} equipes · {setor.totalColaboradores || 0} colaboradores
            {vscore !== null && vscore !== undefined && (
              <span style={{ color: vc }} className="ml-2 font-semibold">
                · V-Score médio: {vscore}
              </span>
            )}
          </div>
        </div>

        <ShowIfRole minRole="Diretor">
          <div className="flex gap-2 flex-wrap justify-end">
            <button
              onClick={() => onRenameSetor(setor)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-neutral-300 text-sm transition-all"
            >
              <Pencil className="w-4 h-4" />
              Renomear
            </button>

            <button
              onClick={() => onDeleteSetor(setor.id)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-sm transition-all"
            >
              <Trash2 className="w-4 h-4" />
              Excluir
            </button>
          </div>
        </ShowIfRole>
      </div>

      <div className="p-5 flex flex-col gap-3">
        {(setor.equipes || []).map((equipe) => (
          <div
            key={equipe.id}
            className="bg-black/20 border border-white/10 rounded-2xl px-4 py-4 flex flex-col lg:flex-row lg:items-center gap-3"
          >
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white">{equipe.name}</div>
              <div className="text-xs text-neutral-500 mt-1 leading-6">
                Responsável: {equipe.lider || "—"} · {equipe.colaboradores || 0} colaboradores
                {equipe.vscore_medio !== undefined && (
                  <span style={{ color: vscoreColor(equipe.vscore_medio) }} className="ml-2 font-semibold">
                    · V-Score: {equipe.vscore_medio ?? "—"}
                  </span>
                )}
              </div>
            </div>

            <ShowIfRole minRole="Coordenador">
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => onTransferirEquipe(equipe)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-neutral-300 text-sm transition-all"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                  Transferir
                </button>

                <button
                  onClick={() => onDeleteEquipe(setor.id, equipe.id)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-sm transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  Remover
                </button>
              </div>
            </ShowIfRole>
          </div>
        ))}

        <ShowIfRole minRole="Coordenador">
          <button
            onClick={() => onAddEquipe(setor)}
            className="w-full rounded-2xl border border-dashed border-white/10 hover:border-cyan-500/40 hover:bg-cyan-500/5 text-neutral-400 hover:text-cyan-300 px-4 py-3 text-sm font-medium transition-all"
          >
            + Adicionar Equipe a este Setor
          </button>
        </ShowIfRole>
      </div>
    </div>
  );
}

function SetorModal({ onClose, onSave }) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);

    const res = await fetch(`${BACKEND_URL}/api/setores`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    const novo = await res.json();
    onSave(novo);
    setSaving(false);
  };

  return (
    <SimpleModal
      title="Criar Setor"
      onClose={onClose}
      onSave={handleSave}
      saving={saving}
    >
      <label className={labelClass}>Nome do setor *</label>
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Ex: Diretoria de Operações"
        className={inputClass}
      />
    </SimpleModal>
  );
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
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, setorId }),
    });

    const nova = await res.json();
    onSave(Number(setorId), nova);
    setSaving(false);
  };

  return (
    <SimpleModal
      title="Criar Equipe"
      onClose={onClose}
      onSave={handleSave}
      saving={saving}
    >
      <div className="mb-4">
        <label className={labelClass}>Nome da equipe *</label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Alpha Squad"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Setor *</label>
        <select
          value={setorId}
          onChange={(e) => setSetorId(e.target.value)}
          className={inputClass}
        >
          <option value="">Selecionar setor...</option>
          {setores.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
    </SimpleModal>
  );
}

function RenomearModal({ item, tipo, onClose, onSave }) {
  const [name, setName] = useState(item?.name || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(item.id, name);
    setSaving(false);
  };

  return (
    <SimpleModal
      title={`Renomear ${tipo}`}
      onClose={onClose}
      onSave={handleSave}
      saving={saving}
    >
      <label className={labelClass}>Novo nome</label>
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        className={inputClass}
      />
    </SimpleModal>
  );
}

function SimpleModal({ title, children, onClose, onSave, saving }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
      <div className="w-full max-w-md border border-white/10 bg-neutral-900/95 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl border border-white/10 bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {children}

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-neutral-300 hover:bg-white/10 transition-all"
          >
            Cancelar
          </button>

          <button
            onClick={onSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-black font-bold transition-all disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function BriefcaseIcon(props) {
  return <BriefcaseSvg {...props} />;
}

function BriefcaseSvg(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M16 20V4a2 2 0 0 0-2-2H10a2 2 0 0 0-2 2v16" />
      <rect x="2" y="7" width="20" height="13" rx="2" />
      <path d="M2 13h20" />
    </svg>
  );
}
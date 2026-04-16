import { useState, useEffect, useMemo } from "react";
import { useAuth, ROLE_LEVELS } from "../contexts/AuthContext";
import {
  Search,
  Plus,
  Pencil,
  ArrowLeftRight,
  Trash2,
  Users,
  Shield,
  TriangleAlert,
  UserRound,
  X,
  Building2,
  GitBranch,
} from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";

const authFetch = (url, options = {}) => {
  const token = localStorage.getItem("vf_token");
  return fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
};

const canManage = (user) =>
  ROLE_LEVELS[user?.role] <= 7 || ROLE_LEVELS[user?.nivel_acesso] <= 7;

const canDelete = (user) =>
  ROLE_LEVELS[user?.role] <= 2 || ROLE_LEVELS[user?.nivel_acesso] <= 2;

function vscoreStyle(score) {
  if (score === null || score === undefined || score === "—") {
    return { color: "#6b7280", label: "—" };
  }
  if (score >= 70) return { color: "#34d399", label: score };
  if (score >= 50) return { color: "#fbbf24", label: score };
  return { color: "#fb7185", label: score };
}

const ROLE_COLORS = {
  CEO: {
    bg: "rgba(139,92,246,0.12)",
    color: "#c4b5fd",
    border: "rgba(139,92,246,0.3)",
  },
  Diretor: {
    bg: "rgba(59,130,246,0.12)",
    color: "#93c5fd",
    border: "rgba(59,130,246,0.3)",
  },
  "Ger. Executivo": {
    bg: "rgba(16,185,129,0.12)",
    color: "#6ee7b7",
    border: "rgba(16,185,129,0.3)",
  },
  "Ger. Operacional": {
    bg: "rgba(16,185,129,0.12)",
    color: "#6ee7b7",
    border: "rgba(16,185,129,0.3)",
  },
  Coordenador: {
    bg: "rgba(251,191,36,0.12)",
    color: "#fcd34d",
    border: "rgba(251,191,36,0.3)",
  },
  Supervisor: {
    bg: "rgba(244,114,182,0.12)",
    color: "#f9a8d4",
    border: "rgba(244,114,182,0.3)",
  },
  Gestor: {
    bg: "rgba(34,211,238,0.12)",
    color: "#67e8f9",
    border: "rgba(34,211,238,0.3)",
  },
  Colaborador: {
    bg: "rgba(255,255,255,0.05)",
    color: "#a3a3a3",
    border: "rgba(255,255,255,0.12)",
  },
  User: {
    bg: "rgba(255,255,255,0.05)",
    color: "#a3a3a3",
    border: "rgba(255,255,255,0.12)",
  },
};

function RoleBadge({ role }) {
  const s = ROLE_COLORS[role] || ROLE_COLORS.Colaborador;
  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold border whitespace-nowrap"
      style={{
        background: s.bg,
        color: s.color,
        borderColor: s.border,
      }}
    >
      {role}
    </span>
  );
}

function Avatar({ name, role }) {
  const initials =
    name
      ?.split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";
  const s = ROLE_COLORS[role] || ROLE_COLORS.Colaborador;

  return (
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border shrink-0"
      style={{
        background: s.bg,
        color: s.color,
        borderColor: s.border,
      }}
    >
      {initials}
    </div>
  );
}

const FILTER_ROLES = [
  "Todos",
  "CEO",
  "Diretor",
  "Gerente",
  "Coordenador",
  "Supervisor",
  "Gestor",
  "Colaborador",
];

const cardClass =
  "border border-white/10 bg-neutral-900/60 backdrop-blur-xl rounded-2xl";
const mutedText = "text-neutral-400";

export default function GestaoColaboradores() {
  const { user, getScopeFilter } = useAuth();
  const [colaboradores, setColaboradores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("Todos");
  const [showModal, setShowModal] = useState(false);
  const [gestoresDisponiveis, setGestoresDisponiveis] = useState([]);
  const [setoresDisponiveis, setSetoresDisponiveis] = useState([]);

  useEffect(() => {
    const fetchColabs = async () => {
      try {
        const scope = getScopeFilter();
        const params = new URLSearchParams(scope);
        const res = await authFetch(
          `${BACKEND_URL}/api/colaboradores?${params}`
        );

        if (res.ok) {
          const data = await res.json();
          setColaboradores(Array.isArray(data) ? data : data.items || data.data || []);
        }
      } catch (e) {
        console.error("Erro ao buscar colaboradores:", e);
        toast.error("Erro ao carregar colaboradores.");
      } finally {
        setLoading(false);
      }
    };

    const fetchAuxiliares = async () => {
  try {
    const [gRes, sRes] = await Promise.all([
      authFetch(`${BACKEND_URL}/api/colaboradores`),
      authFetch(`${BACKEND_URL}/api/dashboard/setores`),
    ]);

    if (gRes.ok) {
      const gData = await gRes.json();

      const listaGestores = Array.isArray(gData)
        ? gData.filter((g) =>
            ["Gestor", "Supervisor", "Coordenador", "Gerente", "Diretor", "CEO"].includes(
              g.nivel_acesso || g.role
            )
          )
        : [];

      setGestoresDisponiveis(listaGestores);
    }

    if (sRes.ok) {
      const sData = await sRes.json();

      const listaSetores = Array.isArray(sData)
        ? sData
        : sData.setores || sData.items || sData.data || [];

      setSetoresDisponiveis(listaSetores);
    }
  } catch (e) {
    console.error("Erro ao buscar auxiliares:", e);
  }
};

    fetchColabs();
    fetchAuxiliares();
  }, [getScopeFilter]);

  const filtered = useMemo(() => {
  return colaboradores.filter((c) => {
    const nome = (c.nome || c.name || "").toLowerCase();
    const email = (c.email || "").toLowerCase();
    const setorTexto = (c.setor || c.setor_nome || c.setorName || "").toLowerCase();
    const nivel = (c.nivel_acesso || c.role || "").trim();

    const termo = search.toLowerCase().trim();

    const matchSearch =
      !termo ||
      nome.includes(termo) ||
      email.includes(termo) ||
      setorTexto.includes(termo);

    const matchRole =
      filterRole === "Todos" ||
      nivel === filterRole;

    return matchSearch && matchRole;
  });
}, [colaboradores, search, filterRole]);

  const metrics = useMemo(() => {
    const total = colaboradores.length;
    const saudavel = colaboradores.filter((c) => c.vscore >= 70).length;
    const critico = colaboradores.filter(
      (c) => c.vscore !== null && c.vscore !== undefined && c.vscore < 50
    ).length;

    return { total, saudavel, critico };
  }, [colaboradores]);

  const handleDelete = async (id) => {
    if (!window.confirm("Remover este colaborador da organização?")) return;

    try {
      const res = await authFetch(`${BACKEND_URL}/api/colaboradores/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Erro ao remover colaborador.");
      }

      setColaboradores((prev) => prev.filter((c) => c.id !== id));
      toast.success("Colaborador removido com sucesso.");
    } catch (e) {
      toast.error("Erro ao remover colaborador.");
    }
  };

  return (
    <div className="p-6 md:p-8 flex-1 overflow-y-auto text-white bg-black">
      <div className="mb-8">
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1.5 h-10 rounded-full bg-gradient-to-b from-cyan-400 to-purple-500" />
              <div>
                <h1 className="text-3xl font-black tracking-tighter">
                  Gestão de Colaboradores
                </h1>
                <p className={`text-sm mt-1 ${mutedText}`}>
                  Gerencie hierarquia, atribuições e níveis de acesso da sua
                  organização
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 text-cyan-300 text-xs font-semibold">
              <GitBranch className="w-3.5 h-3.5" />
              Estrutura organizacional VitalFlow
            </div>
          </div>

          {canManage(user) && (
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-black font-bold shadow-lg shadow-cyan-500/10 transition-all"
            >
              <Plus className="w-4 h-4" />
              Adicionar Colaborador
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <MetricCard
          icon={<Users className="w-5 h-5 text-cyan-300" />}
          label="Total de Colaboradores"
          value={loading ? "—" : metrics.total}
          valueColor="text-cyan-300"
          sub="na sua visão"
        />
        <MetricCard
          icon={<Shield className="w-5 h-5 text-emerald-300" />}
          label="V-Score Saudável"
          value={loading ? "—" : metrics.saudavel}
          valueColor="text-emerald-300"
          sub={`${
            metrics.total
              ? Math.round((metrics.saudavel / metrics.total) * 100)
              : 0
          }% da equipe`}
        />
        <MetricCard
          icon={<TriangleAlert className="w-5 h-5 text-rose-300" />}
          label="V-Score Crítico"
          value={loading ? "—" : metrics.critico}
          valueColor="text-rose-300"
          sub="nas últimas 24h"
        />
      </div>

      <div className={`${cardClass} p-4 mb-4`}>
        <div className="flex items-center gap-3">
          <Search className="w-4 h-4 text-neutral-500 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, e-mail ou setor..."
            className="w-full bg-transparent outline-none text-sm text-white placeholder:text-neutral-500"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {FILTER_ROLES.map((role) => {
          const active = filterRole === role;
          return (
            <button
              key={role}
              onClick={() => setFilterRole(role)}
              className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all ${
                active
                  ? "bg-gradient-to-r from-cyan-500 to-purple-600 text-black border-transparent"
                  : "bg-transparent text-neutral-400 border-white/10 hover:bg-white/5"
              }`}
            >
              {role}
            </button>
          );
        })}
      </div>

      <div className={`${cardClass} overflow-hidden`}>
        <div className="hidden lg:grid grid-cols-[2fr_2fr_1.4fr_1.2fr_1.2fr_90px_110px] gap-4 px-6 py-4 border-b border-white/10">
          {[
            "Colaborador",
            "E-mail",
            "Nível",
            "Setor",
            "Gestor Imediato",
            "V-Score",
            "Ações",
          ].map((h) => (
            <div
              key={h}
              className="text-[11px] text-neutral-500 uppercase tracking-[0.18em] font-bold"
            >
              {h}
            </div>
          ))}
        </div>

        {loading ? (
          <div className="p-14 text-center text-neutral-500">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="p-14 text-center text-neutral-500">
            Nenhum colaborador encontrado.
          </div>
        ) : (
          filtered.map((c) => {
            const vs = vscoreStyle(c.vscore);

            return (
              <div
                key={c.id}
                className="border-b border-white/5 last:border-b-0 px-5 py-4 hover:bg-white/[0.03] transition-colors"
              >
                <div className="hidden lg:grid grid-cols-[2fr_2fr_1.4fr_1.2fr_1.2fr_90px_110px] gap-4 items-center">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={c.name} role={c.role} />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white truncate">
                        {c.name}
                      </div>
                      <div className="text-xs text-neutral-500 truncate">
                        {c.cargo || c.role}
                      </div>
                    </div>
                  </div>

                  <div className="text-sm text-neutral-400 truncate">
                    {c.email}
                  </div>
                  <div>
                    <RoleBadge role={c.role} />
                  </div>
                  <div className="text-sm text-neutral-400">
                    {c.setor || c.setor_nome || c.setorName || "—"}
                  </div>
                  <div className="text-sm text-neutral-500">
                    {c.gestorImediato || c.gestor_imediato || "—"}
                  </div>
                  <div
                    className="text-lg font-mono font-bold"
                    style={{ color: vs.color }}
                  >
                    {vs.label}
                  </div>

                  <div className="flex items-center gap-2">
                    {canManage(user) && (
                      <>
                        <IconActionButton title="Editar">
                          <Pencil className="w-3.5 h-3.5" />
                        </IconActionButton>
                        <IconActionButton title="Transferir">
                          <ArrowLeftRight className="w-3.5 h-3.5" />
                        </IconActionButton>
                      </>
                    )}

                    {canDelete(user) && (
                      <button
                        title="Remover"
                        onClick={() => handleDelete(c.id)}
                        className="w-8 h-8 rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 flex items-center justify-center transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="lg:hidden space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={c.name} role={c.role} />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-white truncate">
                        {c.name}
                      </div>
                      <div className="text-xs text-neutral-500 truncate">
                        {c.email}
                      </div>
                    </div>
                    <div
                      className="text-base font-mono font-bold"
                      style={{ color: vs.color }}
                    >
                      {vs.label}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <RoleBadge role={c.role} />
                    <SmallInfoBadge
                      icon={<Building2 className="w-3 h-3" />}
                      text={c.setor || c.setor_nome || c.setorName || "—"}
                    />
                    <SmallInfoBadge
                      icon={<UserRound className="w-3 h-3" />}
                      text={c.gestorImediato || c.gestor_imediato || "—"}
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    {canManage(user) && (
                      <>
                        <IconActionButton title="Editar">
                          <Pencil className="w-3.5 h-3.5" />
                        </IconActionButton>
                        <IconActionButton title="Transferir">
                          <ArrowLeftRight className="w-3.5 h-3.5" />
                        </IconActionButton>
                      </>
                    )}

                    {canDelete(user) && (
                      <button
                        title="Remover"
                        onClick={() => handleDelete(c.id)}
                        className="w-8 h-8 rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 flex items-center justify-center transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showModal && (
        <AddColaboradorModal
          gestores={gestoresDisponiveis}
          setores={setoresDisponiveis}
          onClose={() => setShowModal(false)}
          onSave={(novo) => {
            setColaboradores((prev) => [...prev, novo]);
            setShowModal(false);
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
      <div className={`text-3xl font-mono font-black ${valueColor}`}>
        {value}
      </div>
      <div className="text-xs text-neutral-500 mt-1">{sub}</div>
    </div>
  );
}

function IconActionButton({ children, title }) {
  return (
    <button
      title={title}
      className="w-8 h-8 rounded-lg border border-white/10 bg-white/5 text-neutral-300 hover:bg-white/10 flex items-center justify-center transition-all"
    >
      {children}
    </button>
  );
}

function SmallInfoBadge({ icon, text }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium border border-white/10 bg-white/5 text-neutral-400">
      {icon}
      {text}
    </span>
  );
}

function AddColaboradorModal({
  gestores = [],
  setores = [],
  onClose,
  onSave,
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "",
    cargo: "",
    gestorImediatoId: "",
    setorId: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const gestoresSafe = Array.isArray(gestores) ? gestores : [];
  const setoresSafe = Array.isArray(setores) ? setores : [];

  const gestorSelecionado = gestoresSafe.find(
    (g) => String(g.id) === String(form.gestorImediatoId)
  );

  const handleSubmit = async () => {
  if (!form.name || !form.email || !form.role) {
    setError("Nome, e-mail e nível são obrigatórios.");
    return;
  }

  setLoading(true);
  setError("");

  try {
    const payload = {
  nome: form.name,
  email: form.email,
  cargo: form.cargo || "",
  nivel_acesso: form.role,
  gestor_imediato_id: form.gestorImediatoId || null,
  setor: form.setor || form.setorId || "Operacional",
};

    const res = await authFetch(`${BACKEND_URL}/api/dashboard/add-employee`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(await res.text());
    }

    const novo = await res.json();
    toast.success("Colaborador cadastrado com sucesso.");
    onSave(novo);
  } catch (e) {
    setError(e.message || "Erro ao salvar.");
  } finally {
    setLoading(false);
  }
};

  const inputClass =
    "w-full bg-neutral-800 border border-white/10 rounded-xl px-3 py-3 text-sm text-white outline-none focus:border-cyan-500";

  return (
    <div className="fixed inset-0 z-[1000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-white/10 bg-neutral-900/95 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-white">
            Adicionar Colaborador
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl border border-white/10 bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-neutral-500 mb-6">
          Preencha os dados. O acesso será configurado automaticamente pelo
          gestor imediato.
        </p>

        {error && (
          <div className="mb-5 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs text-neutral-400 font-medium mb-1.5">
              Nome completo *
            </label>
            <input
              className={inputClass}
              placeholder="Ex: Ana Lima"
              value={form.name}
              onChange={(e) =>
                setForm((f) => ({ ...f, name: e.target.value }))
              }
            />
          </div>

          <div>
            <label className="block text-xs text-neutral-400 font-medium mb-1.5">
              E-mail corporativo *
            </label>
            <input
              className={inputClass}
              type="email"
              placeholder="ana@empresa.com.br"
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs text-neutral-400 font-medium mb-1.5">
              Nível hierárquico *
            </label>
            <select
              className={inputClass}
              value={form.role}
              onChange={(e) =>
                setForm((f) => ({ ...f, role: e.target.value }))
              }
            >
              <option value="">Selecionar nível...</option>
              {Object.keys(ROLE_LEVELS).map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-neutral-400 font-medium mb-1.5">
              Cargo / Função
            </label>
            <input
              className={inputClass}
              placeholder="Ex: Analista de RH"
              value={form.cargo}
              onChange={(e) =>
                setForm((f) => ({ ...f, cargo: e.target.value }))
              }
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-5">
          <div>
            <label className="block text-xs text-neutral-400 font-medium mb-1.5">
              Gestor imediato
            </label>
            <select
              className={inputClass}
              value={form.gestorImediatoId}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  gestorImediatoId: e.target.value,
                }))
              }
            >
              <option value="">— Sem gestor (topo) —</option>
              {gestoresSafe.map((g) => (
                <option key={g.id} value={g.id}>
                  {(g.name || g.nome) ?? "Sem nome"} ({g.role || g.cargo || "—"})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-neutral-400 font-medium mb-1.5">
              Setor
            </label>
            <select
  className={inputClass}
  value={form.setorId}
  onChange={(e) =>
    setForm((f) => ({ ...f, setorId: e.target.value }))
  }
>
  <option value="">Selecionar setor...</option>
  {setoresSafe.map((s, index) => (
    <option
      key={typeof s === "string" ? `${s}-${index}` : s.id || s.nome || index}
      value={typeof s === "string" ? s : s.id || s.nome || ""}
    >
      {typeof s === "string" ? s : s.name || s.nome || "Sem nome"}
    </option>
  ))}
</select>
          </div>
        </div>

        {gestorSelecionado && (
          <div className="mb-5 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4">
            <div className="text-xs text-cyan-300 font-semibold mb-2">
              Cadeia de acesso gerada automaticamente
            </div>
            <div className="text-sm text-neutral-300 leading-7">
              {Array.isArray(gestorSelecionado.cadeia)
                ? gestorSelecionado.cadeia.join(" → ")
                : gestorSelecionado.name || gestorSelecionado.nome}
              {" → "}
              <span className="text-cyan-300 font-semibold">
                {form.name || "novo colaborador"}
              </span>
            </div>
            <div className="text-xs text-neutral-500 mt-2">
              {form.name || "O colaborador"} poderá ver os dados dos
              colaboradores abaixo dele na hierarquia.
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-neutral-300 hover:bg-white/10 transition-all"
          >
            Cancelar
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-black font-bold transition-all disabled:opacity-50"
          >
            {loading ? "Salvando..." : "Cadastrar Colaborador"}
          </button>
        </div>
      </div>
    </div>
  );
}
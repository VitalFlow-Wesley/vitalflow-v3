import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Building2,
  FileText,
  Calendar,
  Activity,
  Shield,
  Sparkles,
  ArrowRight,
  Download,
} from "lucide-react";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";

const PERIODS = [
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "6m", label: "6 meses" },
];

const cardClass =
  "border border-white/10 bg-neutral-900/60 backdrop-blur-xl rounded-2xl";

export default function GestorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [period, setPeriod] = useState("7d");
  const [setor, setSetor] = useState("");
  const [setores, setSetores] = useState([]);
  const [loading, setLoading] = useState(true);

  const [metrics, setMetrics] = useState({
    media_v_score: 0,
    total_colaboradores: 0,
    colaboradores_criticos: 0,
    colaboradores_otimo: 0,
    colaboradores_atencao: 0,
    total_analises: 0,
  });

  const [teamOverview, setTeamOverview] = useState({
    avg_v_score: 0,
    avg_stress_level: 0,
    total_colaboradores: 0,
    engagement_rate: 0,
    lei_14831_alerts: 0,
    trend_7d: [],
    distribution: {
      verde: 0,
      amarelo: 0,
      vermelho: 0,
    },
  });

  useEffect(() => {
    fetchSetores();
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [period, setor]);

  const fetchSetores = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/dashboard/setores`, {
        credentials: "include",
      });

      if (!res.ok) return;

      const data = await res.json();
      setSetores(Array.isArray(data.setores) ? data.setores : []);
    } catch (error) {
      console.error("Erro ao carregar setores:", error);
    }
  };

  const fetchDashboard = async () => {
    setLoading(true);

    try {
      const query = new URLSearchParams();
      query.set("period", period);
      if (setor) query.set("setor", setor);

      const [metricsRes, overviewRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/dashboard/metrics`, {
          credentials: "include",
        }),
        fetch(`${BACKEND_URL}/api/dashboard/team-overview?${query.toString()}`, {
          credentials: "include",
        }),
      ]);

      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setMetrics(metricsData);
      }

      if (overviewRes.ok) {
        const overviewData = await overviewRes.json();
        setTeamOverview(overviewData);
      }
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportPdf = () => {
    const query = new URLSearchParams();
    query.set("period", period);

    window.open(
      `${BACKEND_URL}/api/dashboard/export-pdf?${query.toString()}`,
      "_blank"
    );
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
                  Área do Gestor
                </h1>
                <p className="text-sm text-neutral-400 mt-1">
                  Olá,{" "}
                  <span className="text-cyan-400 font-semibold">
                    {user?.name || user?.nome || "Administrador"}
                  </span>
                  {(user?.role || user?.nivel_acesso) && (
                    <span className="text-neutral-500">
                      {" "}
                      · {user?.role || user?.nivel_acesso}
                    </span>
                  )}
                  <span className="text-neutral-500">
                    {" "}
                    · Visão agregada · dados anonimizados (LGPD)
                  </span>
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 text-cyan-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Ambiente executivo VitalFlow
            </div>
          </div>

          <button
            onClick={exportPdf}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all font-semibold"
          >
            <Download className="w-4 h-4" />
            Exportar PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-8">
        <DashboardShortcutCard
          icon={<Users className="w-6 h-6 text-emerald-300" />}
          badge="Gestão"
          badgeColor="text-emerald-300 border-emerald-500/20 bg-emerald-500/10"
          title="Colaboradores"
          description="Gerencie hierarquia, atribuições e níveis de acesso de toda a equipe."
          action="Acessar"
          actionColor="text-emerald-300"
          onClick={() => navigate("/gestor/colaboradores")}
        />

        <DashboardShortcutCard
          icon={<Building2 className="w-6 h-6 text-purple-300" />}
          badge="Estrutura"
          badgeColor="text-purple-300 border-purple-500/20 bg-purple-500/10"
          title="Setores & Equipes"
          description="Crie setores, organize equipes e defina responsáveis por divisão organizacional."
          action="Acessar"
          actionColor="text-purple-300"
          onClick={() => navigate("/gestor/setores")}
        />

        <DashboardShortcutCard
          icon={<FileText className="w-6 h-6 text-cyan-300" />}
          badge="Análise"
          badgeColor="text-cyan-300 border-cyan-500/20 bg-cyan-500/10"
          title="Relatórios"
          description="Gere e exporte relatórios por setor, equipe ou período com dados anonimizados."
          action="Acessar"
          actionColor="text-cyan-300"
          onClick={() => navigate("/gestor/relatorios")}
        />
      </div>

      <div className={`${cardClass} p-4 mb-6`}>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Calendar className="w-4 h-4 text-neutral-500" />
            <span className="text-xs text-neutral-500">Período:</span>

            {PERIODS.map((p) => {
              const active = period === p.value;

              return (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all ${
                    active
                      ? "bg-gradient-to-r from-cyan-500 to-purple-600 text-black border-transparent"
                      : "bg-transparent text-neutral-400 border-white/10 hover:bg-white/5"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          <select
            value={setor}
            onChange={(e) => setSetor(e.target.value)}
            className="px-4 py-2 rounded-xl bg-neutral-900 border border-white/10 text-sm text-neutral-300 outline-none"
          >
            <option value="">Todos os Setores</option>
            {setores.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {(teamOverview?.lei_14831_alerts ?? 0) > 0 && (
        <div className="mb-6 border border-rose-500/20 bg-rose-500/10 rounded-2xl p-4 flex items-start gap-3">
          <Shield className="w-5 h-5 text-rose-300 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold text-rose-300">
              Atenção à Lei 14.831
            </p>
            <p className="text-xs text-neutral-400 mt-1">
              {teamOverview.lei_14831_alerts} colaborador(es) com necessidade de
              acompanhamento preventivo de saúde mental.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
        <MetricCard
          label="V-Score Time"
          value={loading ? "—" : teamOverview?.avg_v_score ?? metrics?.media_v_score ?? 0}
          sub="Média agregada"
          valueColor="text-cyan-300"
        />

        <MetricCard
          label="Estresse Médio"
          value={loading ? "—" : teamOverview?.avg_stress_level ?? 0}
          sub="Nível médio"
          valueColor="text-purple-300"
        />

        <MetricCard
          label="Colaboradores"
          value={loading ? "—" : teamOverview?.total_colaboradores ?? metrics?.total_colaboradores ?? 0}
          sub={`${loading ? "—" : teamOverview?.engagement_rate ?? 0}% engajados`}
          valueColor="text-white"
        />

        <MetricCard
          label="Críticos"
          value={loading ? "—" : metrics?.colaboradores_criticos ?? 0}
          sub="Análises abaixo de 50"
          valueColor="text-rose-400"
        />

        <MetricCard
          label="Ótimos"
          value={loading ? "—" : metrics?.colaboradores_otimo ?? 0}
          sub="Análises acima de 80"
          valueColor="text-emerald-300"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className={`${cardClass} p-5 xl:col-span-2`}>
          <div className="text-sm text-neutral-400 mb-4">
            Evolução do V-Score
          </div>

          {loading ? (
            <div className="h-48 flex items-center justify-center text-neutral-500">
              Carregando...
            </div>
          ) : !teamOverview?.trend_7d?.length ? (
            <div className="h-48 flex items-center justify-center text-neutral-500">
              Sem dados no período
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {teamOverview.trend_7d.map((item) => (
                <div
                  key={item.date}
                  className="flex items-center justify-between border border-white/10 rounded-xl px-4 py-3"
                >
                  <span className="text-neutral-300">{item.date}</span>
                  <span className="text-cyan-300 font-mono font-bold">
                    {item.avg_v_score}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={`${cardClass} p-5`}>
          <div className="text-sm text-neutral-400 mb-4">
            Distribuição de Status
          </div>

          <div className="flex flex-col gap-3">
            <StatusRow
              label="Verde"
              value={loading ? "—" : teamOverview?.distribution?.verde ?? 0}
              color="bg-emerald-400"
            />
            <StatusRow
              label="Amarelo"
              value={loading ? "—" : teamOverview?.distribution?.amarelo ?? 0}
              color="bg-yellow-400"
            />
            <StatusRow
              label="Vermelho"
              value={loading ? "—" : teamOverview?.distribution?.vermelho ?? 0}
              color="bg-rose-400"
            />
            <StatusRow
              label="Total análises"
              value={loading ? "—" : metrics?.total_analises ?? 0}
              color="bg-cyan-400"
            />
          </div>
        </div>
      </div>

      <div className="mt-8 border border-white/5 bg-neutral-900/40 rounded-2xl p-4 flex items-center gap-3">
        <Activity className="w-4 h-4 text-neutral-500 shrink-0" />
        <p className="text-xs text-neutral-500">
          Dados 100% anonimizados conforme LGPD. Este painel exibe apenas visão
          agregada da organização.
        </p>
      </div>
    </div>
  );
}

function DashboardShortcutCard({
  icon,
  badge,
  badgeColor,
  title,
  description,
  action,
  actionColor,
  onClick,
}) {
  return (
    <div
      onClick={onClick}
      className="border border-white/10 bg-neutral-900/60 backdrop-blur-xl rounded-2xl p-6 cursor-pointer hover:border-cyan-500/20 hover:bg-neutral-900/80 transition-all"
    >
      <div className="flex items-start justify-between mb-6">
        <div className="w-14 h-14 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center">
          {icon}
        </div>

        <span
          className={`text-[10px] px-2.5 py-1 rounded-full border font-semibold ${badgeColor}`}
        >
          {badge}
        </span>
      </div>

      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-neutral-400 leading-7 mb-6">{description}</p>

      <div className={`text-sm font-semibold flex items-center gap-1 ${actionColor}`}>
        {action}
        <ArrowRight className="w-4 h-4" />
      </div>
    </div>
  );
}

function MetricCard({ label, value, sub, valueColor }) {
  return (
    <div className="border border-white/10 bg-neutral-900/60 backdrop-blur-xl rounded-2xl p-5">
      <div className="text-[11px] text-neutral-500 uppercase tracking-[0.18em] font-bold mb-3">
        {label}
      </div>
      <div className={`text-3xl font-mono font-black ${valueColor}`}>
        {value}
      </div>
      <div className="text-xs text-neutral-500 mt-2">{sub}</div>
    </div>
  );
}

function StatusRow({ label, value, color }) {
  return (
    <div className="flex items-center justify-between border border-white/10 rounded-xl px-4 py-3">
      <div className="flex items-center gap-3">
        <span className={`w-3 h-3 rounded-full ${color}`} />
        <span className="text-sm text-neutral-300">{label}</span>
      </div>
      <span className="text-sm font-mono font-bold text-white">{value}</span>
    </div>
  );
}
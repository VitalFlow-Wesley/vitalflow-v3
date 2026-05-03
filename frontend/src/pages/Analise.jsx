import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Brain,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Download,
  HeartPulse,
  Info,
  Moon,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";

const vScoreData = [
  { date: "21/04", score: 78, media: 76, ideal: 88 },
  { date: "22/04", score: 42, media: 76, ideal: 88 },
  { date: "23/04", score: 58, media: 76, ideal: 88 },
  { date: "24/04", score: 49, media: 76, ideal: 88 },
  { date: "25/04", score: 70, media: 76, ideal: 88 },
  { date: "26/04", score: 93, media: 76, ideal: 88 },
  { date: "27/04", score: 96, media: 76, ideal: 88 },
];

const drivers = [
  { label: "HRV", icon: HeartPulse, impact: 88, contribution: "+18%", tone: "positive" },
  { label: "Sono", icon: Moon, impact: 46, contribution: "-12%", tone: "negative" },
  { label: "Stress", icon: Zap, impact: 34, contribution: "-8%", tone: "negative" },
  { label: "Atividade", icon: Activity, impact: 31, contribution: "+6%", tone: "positive" },
  { label: "Recuperação", icon: Target, impact: 52, contribution: "+14%", tone: "positive" },
];

const fallbackCorrelations = [
  {
    icon: Moon,
    type: "sleep_vs_score",
    text: "Sono ruim → queda média de 11 pontos no dia seguinte",
    color: "text-indigo-300",
    confidence: 0.84,
    impact: -11,
    detail:
      "Quando a qualidade do sono fica abaixo do ideal, o V-Score tende a cair no dia seguinte. O sistema cruza sono, recuperação e variação do score.",
  },
  {
    icon: Zap,
    type: "stress_vs_hrv",
    text: "Stress alto → HRV reduz em média 14%",
    color: "text-yellow-300",
    confidence: 0.79,
    impact: -14,
    detail:
      "Picos de stress elevam a carga fisiológica e reduzem a variabilidade cardíaca, indicando menor recuperação autonômica.",
  },
  {
    icon: HeartPulse,
    type: "activity_vs_recovery",
    text: "Atividade leve → melhora de recuperação em 9%",
    color: "text-emerald-300",
    confidence: 0.76,
    impact: 9,
    detail:
      "Dias com movimento leve tendem a favorecer recuperação progressiva, sem gerar sobrecarga cardiovascular relevante.",
  },
  {
    icon: Activity,
    type: "walking_vs_cognitive",
    text: "Dias com caminhada >2km → menor carga cognitiva",
    color: "text-cyan-300",
    confidence: 0.74,
    impact: 7,
    detail:
      "O sistema identificou associação entre caminhada leve e menor carga cognitiva no período analisado.",
  },
];

const correlationIconMap = {
  moon: Moon,
  zap: Zap,
  heart: HeartPulse,
  activity: Activity,
};

const correlationColorMap = {
  moon: "text-indigo-300",
  zap: "text-yellow-300",
  heart: "text-emerald-300",
  activity: "text-cyan-300",
};

const impactMap = [
  ["Cardiovascular", "Sobrecarga moderada", "text-yellow-300", HeartPulse],
  ["Cognitivo", "Alta demanda", "text-orange-300", Brain],
  ["Muscular", "Estável", "text-emerald-300", Activity],
  ["Recuperação autonômica", "Parcial", "text-yellow-300", Zap],
  ["Sistema imune", "Estável", "text-emerald-300", ShieldCheck],
];

const idealWindows = [
  ["08h – 11h", "Melhor foco cognitivo"],
  ["15h – 18h", "Melhor tolerância fisiológica"],
  ["22h – 00h", "Janela ideal de recuperação"],
];

const quality = [
  ["Cobertura biométrica", "Alta", "text-emerald-300"],
  ["Consistência do sinal", "Boa", "text-emerald-300"],
  ["Janela de sono", "Parcial", "text-yellow-300"],
  ["Confiabilidade do modelo", "87%", "text-cyan-300"],
];

const timeline = [
  ["21/04", "Queda relevante", "Stress elevado e HRV abaixo do ideal", "bg-rose-400"],
  ["22/04", "Recuperação parcial", "Melhora de HRV e sono", "bg-cyan-400"],
  ["24/04", "Carga cognitiva elevada", "Aumento de stress mental", "bg-yellow-400"],
  ["26/04", "Estabilização", "Sinais fisiológicos em equilíbrio", "bg-teal-400"],
  ["27/04", "Recuperação ideal", "Melhores indicadores do período", "bg-emerald-400"],
];

const insights = [
  [HeartPulse, "Seu HRV respondeu melhor após dias com atividade leve."],
  [Zap, "Seu stress tem maior impacto no período da tarde."],
  [Moon, "Seu sono foi o principal limitador da recuperação."],
  [TrendingUp, "Sua estabilidade aumentou nas últimas 48h."],
];

const comparisons = [
  ["Vs. média dos últimos 7 dias", "+8%", 74, "positive"],
  ["Vs. média dos últimos 30 dias", "+12%", 82, "positive"],
  ["Vs. sua melhor semana", "-5%", 48, "negative"],
  ["Vs. padrão ideal", "+15%", 66, "positive"],
];

function Card({ children, className = "" }) {
  return (
    <section
      className={`rounded-2xl border border-white/8 bg-[#101214]/85 p-4 shadow-[0_20px_80px_rgba(0,0,0,0.22)] ${className}`}
    >
      {children}
    </section>
  );
}

function SectionTitle({ children, info = true }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <h2 className="font-mono text-[12px] font-extrabold uppercase tracking-[0.34em] text-cyan-300">
        {children}
      </h2>
      {info && <Info className="h-3.5 w-3.5 text-white/38" />}
    </div>
  );
}

function ProgressBar({ value, tone = "positive" }) {
  return (
    <div className="h-2 w-full rounded-full bg-white/10">
      <div
        className={`h-full rounded-full ${
          tone === "negative" ? "bg-rose-400" : "bg-emerald-400"
        }`}
        style={{ width: `${Math.max(0, Math.min(100, value || 0))}%` }}
      />
    </div>
  );
}

function normalizeCorrelation(item) {
  const iconKey = item?.icon || "activity";
  const Icon = correlationIconMap[iconKey] || Activity;
  const color = correlationColorMap[iconKey] || "text-cyan-300";
  const label = item?.label || "Correlação detectada";
  const insight = item?.insight || "padrão fisiológico identificado";

  return {
    icon: Icon,
    color,
    text: `${label} → ${insight}`,
    confidence: item?.confidence,
    impact: item?.impact,
    type: item?.type || `${label}-${insight}`,
    detail:
      item?.detail ||
      "Correlação calculada a partir do cruzamento entre sinais biométricos, comportamento recente e variação do V-Score no período.",
  };
}

function CorrelationsModal({ open, onClose, correlations, status }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/65 px-4 py-6 backdrop-blur-md">
      <div className="flex max-h-[82vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-cyan-300/20 bg-[#080a0c] shadow-[0_30px_120px_rgba(0,0,0,0.70)]">
        <div className="flex items-start justify-between gap-4 border-b border-white/8 px-5 py-4">
          <div className="min-w-0">
            <h3 className="font-mono text-[13px] font-black uppercase tracking-[0.30em] text-cyan-300">
              Todas as correlações
            </h3>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/55">
              Relações entre sono, stress, HRV, atividade e recuperação.
            </p>
            {status === "fallback" && (
              <p className="mt-2 rounded-xl border border-yellow-300/15 bg-yellow-300/8 px-3 py-2 text-xs font-semibold text-yellow-200/90">
                Usando exemplo padrão até o histórico real gerar correlações suficientes.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-2xl border border-white/10 bg-white/[0.04] p-2 text-white/70 transition hover:border-cyan-300/30 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 [scrollbar-width:thin] [scrollbar-color:rgba(103,232,249,.45)_rgba(255,255,255,.06)]">
          <div className="space-y-3">
            {correlations.map((item, index) => {
              const Icon = item.icon;
              const confidenceLabel =
                item.confidence !== undefined
                  ? `${Math.round(Number(item.confidence) * 100)}%`
                  : "Modelo";

              return (
                <div
                  key={item.type || item.text}
                  className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 transition hover:border-cyan-300/20 hover:bg-white/[0.04]"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/25">
                      <Icon className={`h-5 w-5 ${item.color}`} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/35">
                            Correlação {String(index + 1).padStart(2, "0")}
                          </p>
                          <p className="mt-1 text-[15px] font-black leading-6 text-white">
                            {item.text}
                          </p>
                        </div>

                        <span className="w-fit shrink-0 rounded-full border border-cyan-300/20 bg-cyan-300/8 px-3 py-1 text-xs font-black text-cyan-200">
                          {confidenceLabel}
                        </span>
                      </div>

                      <p className="mt-3 text-sm leading-6 text-white/58">
                        {item.detail}
                      </p>

                      {item.impact !== undefined && (
                        <div className="mt-3 flex items-center justify-between rounded-xl border border-white/8 bg-black/20 px-3 py-2">
                          <span className="text-xs font-bold text-white/42">
                            Impacto estimado
                          </span>
                          <span
                            className={`text-sm font-black ${
                              Number(item.impact) < 0 ? "text-rose-300" : "text-emerald-300"
                            }`}
                          >
                            {Number(item.impact) > 0 ? "+" : ""}
                            {item.impact}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="border-t border-white/8 bg-[#080a0c] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-black text-black transition hover:bg-cyan-200"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}


function TimelineModal({ open, onClose }) {
  if (!open) return null;

  const points = [
    { date: "21/04", score: 61, title: "Queda relevante", desc: "Stress elevado e HRV abaixo do ideal", impact: -11, tone: "rose", time: "08:30" },
    { date: "22/04", score: 48, title: "Recuperação parcial", desc: "Melhora de HRV e sono", impact: 8, tone: "cyan", time: "10:15" },
    { date: "24/04", score: 36, title: "Carga cognitiva elevada", desc: "Aumento de stress mental", impact: -14, tone: "yellow", time: "14:45" },
    { date: "26/04", score: 47, title: "Estabilização", desc: "Sinais fisiológicos em equilíbrio", impact: 10, tone: "teal", time: "09:20" },
    { date: "27/04", score: 74, title: "Recuperação ideal", desc: "Melhores indicadores do período", impact: 16, tone: "emerald", time: "11:30" },
  ];

  const toneClass = {
    rose: { text: "text-rose-300", bg: "bg-rose-400", soft: "bg-rose-400/8", border: "border-rose-300/20", fill: "#fb7185" },
    cyan: { text: "text-cyan-300", bg: "bg-cyan-400", soft: "bg-cyan-400/8", border: "border-cyan-300/20", fill: "#22d3ee" },
    yellow: { text: "text-yellow-300", bg: "bg-yellow-400", soft: "bg-yellow-400/8", border: "border-yellow-300/20", fill: "#facc15" },
    teal: { text: "text-teal-300", bg: "bg-teal-400", soft: "bg-teal-400/8", border: "border-teal-300/20", fill: "#2dd4bf" },
    emerald: { text: "text-emerald-300", bg: "bg-emerald-400", soft: "bg-emerald-400/8", border: "border-emerald-300/20", fill: "#34d399" },
  };

  const svgPoints = points.map((point, index) => ({
    ...point,
    x: 12 + index * 21,
    y: 96 - point.score,
  }));

  const linePath = svgPoints
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  const areaPath = `${linePath} L ${svgPoints[svgPoints.length - 1].x} 98 L ${svgPoints[0].x} 98 Z`;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/65 px-4 py-5 backdrop-blur-md">
      <div className="flex max-h-[82vh] w-full max-w-5xl flex-col overflow-hidden rounded-[24px] border border-cyan-300/15 bg-[#07090c] shadow-[0_30px_120px_rgba(0,0,0,0.72)]">
        <div className="flex items-center justify-between gap-4 border-b border-white/8 bg-white/[0.025] px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/18 bg-cyan-300/8 text-cyan-300">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight text-white">
                Linha do Tempo Fisiológica
              </h3>
              <p className="mt-1 text-xs leading-5 text-white/48">
                Evolução primeiro. Eventos abaixo explicando cada ponto da curva.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar linha do tempo"
            className="shrink-0 rounded-2xl border border-white/10 bg-white/[0.04] p-2 text-white/70 transition hover:border-cyan-300/30 hover:bg-white/[0.07] hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5 [scrollbar-width:thin] [scrollbar-color:rgba(103,232,249,.28)_rgba(255,255,255,.05)]">
          <section className="rounded-[22px] border border-white/10 bg-white/[0.025] p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[11px] font-black uppercase tracking-[0.28em] text-cyan-300">
                  Evolução do V-Score
                </p>
                <p className="mt-1 text-xs text-white/42">
                  Curva interpretativa do período
                </p>
              </div>

              <span className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-xs font-black text-white/58">
                7 dias
              </span>
            </div>

            <div className="relative h-[285px] overflow-hidden rounded-[20px] border border-white/8 bg-[#05070a] p-4">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_42%_20%,rgba(34,211,238,0.10),transparent_36%),radial-gradient(circle_at_86%_75%,rgba(52,211,153,0.10),transparent_38%)]" />

              <div className="absolute left-5 right-5 top-12 border-t border-dashed border-emerald-300/18" />
              <div className="absolute left-5 right-5 top-[128px] border-t border-dashed border-yellow-300/18" />
              <div className="absolute left-5 right-5 top-[205px] border-t border-dashed border-rose-300/16" />

              <div className="absolute left-5 top-10 space-y-[67px] text-[11px] font-black uppercase tracking-[0.10em]">
                <p className="text-emerald-300">Recuperação</p>
                <p className="text-yellow-300">Atenção</p>
                <p className="text-rose-300">Queda</p>
              </div>

              <svg viewBox="0 0 100 100" className="absolute left-8 right-5 top-10 h-[175px] w-[calc(100%-52px)] overflow-visible">
                <defs>
                  <linearGradient id="verticalTimelineStroke" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0%" stopColor="#fb7185" />
                    <stop offset="42%" stopColor="#facc15" />
                    <stop offset="72%" stopColor="#22d3ee" />
                    <stop offset="100%" stopColor="#34d399" />
                  </linearGradient>
                  <linearGradient id="verticalTimelineArea" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity="0.20" />
                    <stop offset="55%" stopColor="#22d3ee" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="#fb7185" stopOpacity="0.02" />
                  </linearGradient>
                  <filter id="verticalTimelineGlow">
                    <feGaussianBlur stdDeviation="2.2" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                <path d={areaPath} fill="url(#verticalTimelineArea)" />
                <path
                  d={linePath}
                  fill="none"
                  stroke="url(#verticalTimelineStroke)"
                  strokeWidth="3.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#verticalTimelineGlow)"
                />

                {svgPoints.map((point) => (
                  <g key={`${point.date}-vertical-point`}>
                    <line
                      x1={point.x}
                      y1={point.y}
                      x2={point.x}
                      y2="98"
                      stroke={toneClass[point.tone].fill}
                      strokeOpacity="0.16"
                      strokeWidth="1"
                    />
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r="4.3"
                      fill={toneClass[point.tone].fill}
                      stroke="#05070a"
                      strokeWidth="2"
                    />
                  </g>
                ))}
              </svg>

              <div className="absolute bottom-5 left-8 right-6 grid grid-cols-5 gap-2">
                {points.map((point) => (
                  <div key={`${point.date}-vertical-label`} className="text-center">
                    <div className={`mx-auto mb-1.5 h-2 w-2 rounded-full ${toneClass[point.tone].bg}`} />
                    <p className="text-xs font-black text-white/60">{point.date}</p>
                    <p className="mt-1 line-clamp-2 text-[10px] leading-3 text-white/38">
                      {point.title}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="rounded-2xl border border-rose-300/12 bg-rose-300/7 p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-rose-300">Ponto baixo</p>
                <p className="mt-1 text-xl font-black text-white">36</p>
                <p className="text-xs text-white/42">24/04</p>
              </div>

              <div className="rounded-2xl border border-emerald-300/12 bg-emerald-300/7 p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-emerald-300">Ponto alto</p>
                <p className="mt-1 text-xl font-black text-white">74</p>
                <p className="text-xs text-white/42">27/04</p>
              </div>

              <div className="rounded-2xl border border-cyan-300/12 bg-cyan-300/7 p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-cyan-300">Tendência</p>
                <p className="mt-1 text-xl font-black text-emerald-300">↗</p>
                <p className="text-xs font-bold text-emerald-300">Recuperação</p>
              </div>
            </div>
          </section>

          <section className="mt-4 rounded-[22px] border border-white/10 bg-white/[0.025] p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[11px] font-black uppercase tracking-[0.28em] text-cyan-300">
                  Eventos fisiológicos
                </p>
                <p className="mt-1 text-xs text-white/42">
                  Detalhes dos pontos marcados no gráfico
                </p>
              </div>
            </div>

            <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-5">
              {points.map((point) => {
                const tone = toneClass[point.tone];
                return (
                  <div
                    key={`${point.date}-bottom-event`}
                    className="min-h-[132px] rounded-2xl border border-white/8 bg-black/16 p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${tone.bg}`} />
                        <div>
                          <p className="text-sm font-black text-white/66">{point.date}</p>
                          <p className="text-[11px] text-white/34">{point.time}</p>
                        </div>
                      </div>

                      <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-black ${tone.border} ${tone.soft} ${tone.text}`}>
                        {point.impact > 0 ? "+" : ""}{point.impact}
                      </span>
                    </div>

                    <p className={`mt-3 text-sm font-black leading-5 ${tone.text}`}>{point.title}</p>
                    <p className="mt-2 text-xs leading-5 text-white/50">{point.desc}</p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="mt-4 rounded-[22px] border border-cyan-300/12 bg-cyan-300/5 p-4">
            <p className="font-mono text-[11px] font-black uppercase tracking-[0.20em] text-cyan-200">
              Leitura inteligente
            </p>
            <p className="mt-2 text-sm leading-6 text-white/58">
              O período começou com sobrecarga fisiológica, mas evoluiu para recuperação progressiva.
              <span className="font-bold text-white"> O fechamento do ciclo mostra adaptação e equilíbrio.</span>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function Analise() {
  const [period, setPeriod] = useState("7 dias");
  const [correlations, setCorrelations] = useState(fallbackCorrelations);
  const [correlationsStatus, setCorrelationsStatus] = useState("idle");
  const [showCorrelationsModal, setShowCorrelationsModal] = useState(false);
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const confidence = useMemo(() => 87, []);

  useEffect(() => {
    let active = true;

    async function loadCorrelations() {
      try {
        setCorrelationsStatus("loading");

        const token = localStorage.getItem("vf_token");
        const periodParam = period === "30 dias" ? "30d" : "7d";

        const response = await fetch(
          `${BACKEND_URL}/api/analysis/correlations?period=${periodParam}`,
          {
            credentials: "include",
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }
        );

        if (!response.ok) {
          throw new Error("Falha ao carregar correlações");
        }

        const data = await response.json();
        const dynamicCorrelations = Array.isArray(data?.correlations)
          ? data.correlations.map(normalizeCorrelation)
          : [];

        if (active && dynamicCorrelations.length > 0) {
          setCorrelations(dynamicCorrelations);
          setCorrelationsStatus("success");
        } else if (active) {
          setCorrelations(fallbackCorrelations);
          setCorrelationsStatus("fallback");
        }
      } catch (error) {
        console.warn("Erro ao carregar correlações:", error);

        if (active) {
          setCorrelations(fallbackCorrelations);
          setCorrelationsStatus("fallback");
        }
      }
    }

    loadCorrelations();

    return () => {
      active = false;
    };
  }, [period]);

  return (
    <div className="space-y-4 pb-8">
      <CorrelationsModal
        open={showCorrelationsModal}
        onClose={() => setShowCorrelationsModal(false)}
        correlations={correlations}
        status={correlationsStatus}
      />

      <TimelineModal
        open={showTimelineModal}
        onClose={() => setShowTimelineModal(false)}
      />

      <header className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white md:text-3xl">
            Análise
          </h1>
          <p className="mt-1 text-sm font-medium text-white/50">
            Entenda em profundidade o que está impactando seu estado fisiológico.
          </p>

          <div className="mt-4 inline-flex items-center overflow-hidden rounded-xl border border-white/8 bg-[#101214] text-sm text-white/62">
            <span className="px-4 py-2">Período analisado</span>
            <button className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-5 py-2 font-semibold text-white/86">
              21/04/2024 – 27/04/2024 ({period})
              <CalendarDays className="h-4 w-4 text-white/45" />
            </button>
          </div>
        </div>

        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 text-sm font-semibold text-white/72">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            Análise concluída hoje, 09:41
          </div>
          <button className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/[0.04] px-4 py-2.5 text-sm font-bold text-white/82 transition hover:border-cyan-400/25 hover:text-cyan-200">
            <Download className="h-4 w-4" />
            Exportar análise
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-5">
          <div className="grid gap-5 md:grid-cols-[1fr_170px] md:items-center">
            <div>
              <SectionTitle info={false}>Resumo analítico</SectionTitle>
              <p className="text-base font-semibold leading-relaxed text-white/82">
                Seu organismo apresentou estabilidade com recuperação progressiva nas últimas 48h.
              </p>
              <p className="mt-4 text-sm leading-7 text-white/58">
                Os principais vetores de impacto no período foram carga cardiovascular,
                variação de sono, oscilação de HRV e recuperação cognitiva parcial.
              </p>
            </div>
            <div className="relative mx-auto flex h-36 w-36 items-center justify-center rounded-full border-[10px] border-emerald-400/90 bg-emerald-400/5 shadow-[0_0_35px_rgba(16,185,129,0.15)]">
              <div className="text-center">
                <div className="text-3xl font-black text-white">{confidence}%</div>
                <div className="mt-1 text-xs font-medium leading-tight text-white/55">
                  Confiabilidade
                  <br />
                  da análise
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="xl:col-span-3">
          <SectionTitle>Drivers do V-Score</SectionTitle>
          <div className="space-y-3">
            {drivers.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="grid grid-cols-[105px_1fr_48px] items-center gap-3 text-sm"
                >
                  <div className="flex items-center gap-2 text-white/72">
                    <Icon
                      className={`h-4 w-4 ${
                        item.tone === "negative" ? "text-rose-300" : "text-emerald-300"
                      }`}
                    />
                    {item.label}
                  </div>
                  <ProgressBar value={item.impact} tone={item.tone} />
                  <span
                    className={`text-right font-black ${
                      item.tone === "negative" ? "text-rose-300" : "text-emerald-300"
                    }`}
                  >
                    {item.contribution}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="mt-5 text-xs text-white/50">
            Impacto no V-Score dos últimos 7 dias
          </p>
        </Card>

        <Card className="xl:col-span-4">
          <div className="mb-4 flex items-start justify-between gap-3">
            <SectionTitle>Correlações detectadas</SectionTitle>
            {correlationsStatus === "loading" && (
              <span className="text-[11px] font-bold text-white/38">Atualizando...</span>
            )}
          </div>

          <div className="divide-y divide-white/7">
            {correlations.slice(0, 4).map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.type || item.text}
                  className="flex items-start gap-3 py-2 first:pt-0 last:pb-0"
                >
                  <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${item.color}`} />
                  <p className="text-sm leading-6 text-white/74">{item.text}</p>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setShowCorrelationsModal(true)}
            className="mt-3 w-full text-right text-xs font-black text-cyan-300 transition hover:text-cyan-100"
          >
            Ver todas as correlações →
          </button>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-8">
          <div className="mb-3 flex items-center justify-between gap-3">
            <SectionTitle info={false}>Evolução do V-Score</SectionTitle>
            <button
              onClick={() => setPeriod(period === "7 dias" ? "30 dias" : "7 dias")}
              className="flex items-center gap-2 rounded-xl bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-white/60"
            >
              {period} <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="h-[235px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={vScoreData} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="scoreGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#20f5d0" stopOpacity={0.42} />
                    <stop offset="80%" stopColor="#20f5d0" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "rgba(255,255,255,0.48)", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: "rgba(255,255,255,0.48)", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "#101214",
                    border: "1px solid rgba(255,255,255,.10)",
                    borderRadius: 14,
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#20f5d0"
                  strokeWidth={3}
                  fill="url(#scoreGradient)"
                  dot={{ r: 4, fill: "#20f5d0", stroke: "#07100f", strokeWidth: 2 }}
                />
                <Area
                  type="monotone"
                  dataKey="media"
                  stroke="#eab308"
                  strokeDasharray="6 6"
                  strokeWidth={1.6}
                  fillOpacity={0}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="xl:col-span-4">
          <SectionTitle>Timeline fisiológica</SectionTitle>
          <div className="space-y-0">
            {timeline.map(([date, title, desc, dot], index) => (
              <div key={`${date}-${title}`} className="grid grid-cols-[54px_18px_1fr] gap-3">
                <div className="pt-0.5 text-sm font-semibold text-white/55">{date}</div>
                <div className="relative flex justify-center">
                  <span className={`mt-1.5 h-2.5 w-2.5 rounded-full ${dot} ring-4 ring-white/5`} />
                  {index < timeline.length - 1 && (
                    <span className="absolute top-5 h-full w-px bg-white/14" />
                  )}
                </div>
                <div className="pb-4">
                  <p className="text-sm font-bold text-white/75">{title}</p>
                  <p className="text-xs leading-5 text-white/48">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setShowTimelineModal(true)}
            className="w-full text-right text-xs font-black text-cyan-300 transition hover:text-cyan-100"
          >
            Ver linha do tempo completa →
          </button>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-3">
          <SectionTitle>Mapa de impacto fisiológico</SectionTitle>
          <div className="space-y-3">
            {impactMap.map(([name, status, color, Icon]) => (
              <div key={name} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2 text-white/60">
                  <Icon className="h-4 w-4 text-cyan-300/70" />
                  {name}
                </span>
                <span className={`font-black ${color}`}>{status}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="xl:col-span-3">
          <SectionTitle>Janelas ideais detectadas</SectionTitle>
          <div className="space-y-4">
            {idealWindows.map(([time, desc]) => (
              <div key={time} className="flex gap-3">
                <Clock3 className="mt-0.5 h-5 w-5 text-emerald-300" />
                <div>
                  <p className="font-black text-white/78">{time}</p>
                  <p className="text-xs text-white/48">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="xl:col-span-3">
          <SectionTitle>Qualidade da análise</SectionTitle>
          <div className="space-y-3">
            {quality.map(([name, status, color]) => (
              <div key={name} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-white/58">{name}</span>
                <span className={`font-black ${color}`}>{status}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="xl:col-span-3">
          <SectionTitle>Comparativo com você</SectionTitle>
          <div className="space-y-3">
            {comparisons.map(([label, value, width, tone]) => (
              <div key={label} className="grid grid-cols-[1fr_78px_45px] items-center gap-3 text-sm">
                <span className="text-white/58">{label}</span>
                <ProgressBar value={width} tone={tone} />
                <span
                  className={`text-right font-black ${
                    tone === "negative" ? "text-rose-300" : "text-emerald-300"
                  }`}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-7">
          <SectionTitle>Insights automáticos</SectionTitle>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {insights.map(([Icon, text]) => (
              <div key={text} className="rounded-2xl border border-white/7 bg-white/[0.025] p-3">
                <Icon className="mb-3 h-6 w-6 text-cyan-300" />
                <p className="text-xs leading-5 text-white/60">{text}</p>
              </div>
            ))}
          </div>
          <button className="mt-3 w-full text-right text-xs font-black text-cyan-300">
            Ver todos os insights →
          </button>
        </Card>

        <Card className="relative overflow-hidden xl:col-span-5">
          <SectionTitle>Conclusão analítica</SectionTitle>
          <p className="max-w-[88%] text-sm leading-7 text-white/64">
            Seu período mostra estabilidade fisiológica com recuperação progressiva. A principal
            limitação continua sendo a irregularidade de sono, enquanto HRV e carga cardiovascular já
            demonstram melhora. O cenário atual favorece manutenção com progressão leve.
          </p>
          <Sparkles className="absolute bottom-5 right-6 h-24 w-24 text-emerald-300/12" />
        </Card>
      </div>
    </div>
  );
}

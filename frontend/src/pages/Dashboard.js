import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import {
  LayoutDashboard,
  Activity,
  TrendingUp,
  Repeat,
  Smartphone,
  FileText,
  Settings,
  Crown,
  Gauge,
  ShieldCheck,
  TimerReset,
  Focus,
  Clock3,
  HeartPulse,
  Brain,
  Sparkles,
  ArrowRight,
  Footprints,
  Flame,
  Route,
  Timer,
  Moon,
  Droplets,
  Target,
  CheckCircle2,
  Star,
  Zap,
  Cpu,
} from "lucide-react";
import Navbar from "../components/Navbar";

const bg = "#050505";
const panel = "#0b0d0f";
const surface = "#0f1114";
const elevated = "#13171a";
const border = "rgba(255,255,255,0.07)";
const borderSoft = "rgba(255,255,255,0.05)";
const textSoft = "#9ba3a8";
const textMuted = "#6e767c";
const emerald = "#27e1b3";
const emerald2 = "#3ce7c0";
const amber = "#d7b35a";
const purple = "#aa9dff";
const rose = "#ff6b86";

const topSummary = [
  { label: "Status", value: "Normal", sub: "Equilíbrio preservado", icon: ShieldCheck, color: "text-[#31d9b0]" },
  { label: "Pontos", value: "300", sub: "Energia do dia", icon: Zap, color: "text-[#d7b35a]" },
  { label: "Streak", value: "1 dia", sub: "Consistência ativa", icon: Flame, color: "text-[#d79b57]" },
  { label: "Sync", value: "Wearables", sub: "Sincronizado agora", icon: Activity, color: "text-[#39d9be]" },
  { label: "Janela", value: "Agora", sub: "Melhor momento", icon: TimerReset, color: "text-[#35d9b0]" },
  { label: "Reavaliação", value: "3h 12m", sub: "Próxima leitura", icon: Clock3, color: "text-white" },
];

const quickReadItems = [
  {
    icon: Activity,
    title: "Estável nas últimas 6h",
    sub: "Variação mínima",
    tone: "text-[#27e1b3]",
    bgTone: "bg-[#27e1b3]/10",
  },
  {
    icon: Brain,
    title: "Stress controlado",
    sub: "Carga ideal",
    tone: "text-[#d7b35a]",
    bgTone: "bg-[#d7b35a]/10",
  },
  {
    icon: HeartPulse,
    title: "HRV preservada",
    sub: "Boa recuperação",
    tone: "text-[#39e8bf]",
    bgTone: "bg-[#39e8bf]/10",
  },
  {
    icon: ShieldCheck,
    title: "Janela favorável",
    sub: "Boa manutenção",
    tone: "text-[#27e1b3]",
    bgTone: "bg-[#27e1b3]/10",
  },
];

const trendData = [
  { time: "00:00", score: 82 },
  { time: "02:00", score: 80 },
  { time: "04:00", score: 81 },
  { time: "05:00", score: 62 },
  { time: "06:00", score: 56 },
  { time: "08:00", score: 68 },
  { time: "10:00", score: 67 },
  { time: "12:00", score: 74 },
  { time: "14:00", score: 77 },
  { time: "16:00", score: 84 },
  { time: "18:00", score: 79 },
  { time: "20:00", score: 93 },
  { time: "22:00", score: 90 },
  { time: "24:00", score: 100 },
];

const metricCards = [
  { icon: HeartPulse, title: "BPM", value: "70", sub: "Normal", color: "text-[#27e1b3]" },
  { icon: Activity, title: "HRV", value: "45", sub: "Excelente", color: "text-[#4ae6be]" },
  { icon: Droplets, title: "SpO2", value: "98%", sub: "Normal", color: "text-[#39d9be]" },
  { icon: Moon, title: "Sono", value: "7h 32m", sub: "Bom", color: "text-[#ad9eff]" },
  { icon: Footprints, title: "Passos", value: "947", sub: "Meta 8k", color: "text-[#e2bc62]" },
  { icon: Timer, title: "Ativos", value: "59 min", sub: "Meta 60", color: "text-[#ad9eff]" },
];

const insights = [
  {
    icon: CheckCircle2,
    title: "Excelente recuperação",
    sub: "Recuperação muito boa",
    tone: "text-[#27e1b3]",
    bgTone: "bg-[#27e1b3]/10",
  },
  {
    icon: Star,
    title: "Consistência é chave",
    sub: "Mantenha o ritmo",
    tone: "text-[#d7b35a]",
    bgTone: "bg-[#d7b35a]/10",
  },
  {
    icon: Droplets,
    title: "Atenção à hidratação",
    sub: "Ajuste ingestão de água",
    tone: "text-[#aa9dff]",
    bgTone: "bg-[#aa9dff]/10",
  },
  {
    icon: Target,
    title: "Próximo objetivo",
    sub: "Preserve 7h+ de sono",
    tone: "text-[#ff718b]",
    bgTone: "bg-[#ff718b]/10",
  },
];

const sideMenu = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: Activity, label: "Análise" },
  { icon: TrendingUp, label: "Tendências" },
  { icon: Repeat, label: "Rotinas" },
  { icon: Smartphone, label: "Dispositivos" },
  { icon: FileText, label: "Relatório" },
  { icon: Settings, label: "Configurações" },
];

function TrendTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const value = payload[0].value;

  return (
    <div
      className="rounded-2xl border px-3 py-2 shadow-2xl backdrop-blur-xl"
      style={{
        background: "rgba(8, 10, 12, 0.94)",
        borderColor: "rgba(255,255,255,0.08)",
        boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
      }}
    >
      <p className="text-[11px] uppercase tracking-[0.18em] text-white/70">{label}</p>
      <p className="mt-1 text-sm font-bold text-[#27e1b3]">{value}</p>
    </div>
  );
}

function TrendDot(props) {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null || !payload) return null;

  const score = payload.score;
  const fill = score >= 80 ? emerald : score >= 60 ? amber : rose;
  const labelMap = {
    "05:00": "Maior queda",
    "12:00": "Recuperação",
    "24:00": "Atual",
  };
  const markerLabel = labelMap[payload.time];

  return (
    <g>
      <circle cx={cx} cy={cy} r="5.5" fill={fill} stroke="#060707" strokeWidth="2.5" />
      <circle cx={cx} cy={cy} r="10" fill={fill} fillOpacity="0.1" />
      {markerLabel ? (
        <g>
          <rect
            x={cx - 46}
            y={cy + 16}
            width={92}
            height={22}
            rx={8}
            fill={fill === emerald ? "rgba(39,225,179,0.12)" : fill === amber ? "rgba(215,179,90,0.12)" : "rgba(255,107,134,0.12)"}
            stroke={fill}
            strokeOpacity={0.24}
          />
          <text x={cx} y={cy + 30} textAnchor="middle" fill={fill} fontSize="10.5" fontWeight="700">
            {markerLabel}
          </text>
        </g>
      ) : null}
    </g>
  );
}

export default function Dashboard() {
  const avgScore = useMemo(() => {
    const total = trendData.reduce((acc, item) => acc + item.score, 0);
    return Math.round(total / trendData.length);
  }, []);

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: bg }}>
      <Navbar />

      <div className="mx-auto max-w-[1540px] px-4 pb-5 pt-4 sm:px-5 lg:px-6">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[240px_minmax(0,1fr)]">
          <motion.aside
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex h-full flex-col rounded-2xl border p-4"
            style={{
              background: panel,
              borderColor: borderSoft,
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02)",
            }}
          >
            <div className="mb-4 flex items-center gap-3 border-b border-white/[0.05] pb-4">
              <div
                className="rounded-2xl border p-3 shadow-[0_0_18px_rgba(39,225,179,0.03)]"
                style={{ borderColor: borderSoft, background: "#0a0b0c" }}
              >
                <LayoutDashboard className="h-5 w-5 text-[#27e1b3]" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em]" style={{ color: textMuted }}>
                  Navegação
                </p>
                <p className="text-sm font-semibold text-white">Painel principal</p>
              </div>
            </div>

            <nav className="space-y-1.5">
              {sideMenu.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.button
                    key={item.label}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.03 * index }}
                    className={`group flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all ${
                      item.active ? "shadow-[inset_3px_0_0_0_#27e1b3,0_0_18px_rgba(39,225,179,0.04)]" : "hover:bg-white/[0.02]"
                    }`}
                    style={{
                      background: item.active ? "linear-gradient(90deg, rgba(39,225,179,0.08), rgba(39,225,179,0.02))" : "transparent",
                      borderColor: item.active ? "rgba(39,225,179,0.15)" : "transparent",
                    }}
                    type="button"
                  >
                    <Icon className={`h-4.5 w-4.5 ${item.active ? "text-[#27e1b3]" : "text-white/38 group-hover:text-white/70"}`} />
                    <span className={`text-[15px] ${item.active ? "font-semibold text-[#e3fbf4]" : "text-white/62"}`}>
                      {item.label}
                    </span>
                  </motion.button>
                );
              })}
            </nav>
          </motion.aside>

          <main className="space-y-4">
            <div className="flex items-center gap-3">
              <div
                className="inline-flex items-center gap-2 rounded-full border px-4 py-2"
                style={{
                  background: "linear-gradient(180deg, rgba(39,225,179,0.08), rgba(39,225,179,0.03))",
                  borderColor: "rgba(39,225,179,0.16)",
                  boxShadow: "0 0 24px rgba(39,225,179,0.05)",
                }}
              >
                <Crown className="h-4 w-4 text-[#27e1b3]" />
                <span className="text-sm font-semibold text-white">Plano Premium Ativo</span>
              </div>
            </div>

            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border p-2.5"
              style={{
                background: "linear-gradient(180deg, rgba(13,15,16,0.98), rgba(10,12,13,0.96))",
                borderColor: borderSoft,
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02)",
              }}
            >
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
                {topSummary.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className={`rounded-2xl px-4 py-3 ${index === 0 ? "border" : "border border-transparent"}`}
                      style={{
                        background: index === 0 ? "linear-gradient(180deg, rgba(39,225,179,0.08), rgba(18,28,25,0.85))" : "rgba(255,255,255,0.015)",
                        borderColor: index === 0 ? "rgba(39,225,179,0.15)" : "rgba(255,255,255,0.03)",
                      }}
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${index === 0 ? "text-[#27e1b3]" : "text-white/55"}`} />
                        <p className="text-[10px] uppercase tracking-[0.22em]" style={{ color: textMuted }}>
                          {item.label}
                        </p>
                      </div>
                      <p className={`text-[17px] font-bold ${item.color}`}>{item.value}</p>
                      <p className="mt-1 truncate text-xs" style={{ color: textSoft }}>
                        {item.sub}
                      </p>
                    </div>
                  );
                })}
              </div>
            </motion.section>

            <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex h-[380px] flex-col rounded-2xl border p-5"
                style={{
                  background: surface,
                  borderColor: borderSoft,
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02)",
                }}
              >
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-[#bbc1c6]">Status Vital</p>

                <div className="mb-3 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[#27e1b3]" />
                  <h3 className="text-[18px] font-bold text-white">Resiliência ótima</h3>
                </div>

                <div className="mx-auto mt-4 flex h-40 w-40 items-center justify-center rounded-full bg-[conic-gradient(#27e1b3_0deg,#33dbb1_360deg)] p-[11px] shadow-[0_0_42px_rgba(39,225,179,0.14)]">
                  <div
                    className="flex h-full w-full flex-col items-center justify-center rounded-full border bg-[#090b0c]"
                    style={{ borderColor: "rgba(255,255,255,0.06)" }}
                  >
                    <span className="text-5xl font-black text-white">100</span>
                    <span className="mt-1 text-sm" style={{ color: textSoft }}>
                      de 100
                    </span>
                  </div>
                </div>

                <div className="mt-5 flex justify-center">
                  <span
                    className="rounded-full border px-4 py-1.5 text-sm font-semibold uppercase tracking-[0.22em] text-[#27e1b3]"
                    style={{
                      borderColor: "rgba(39,225,179,0.18)",
                      background: "rgba(39,225,179,0.08)",
                    }}
                  >
                    NORMAL
                  </span>
                </div>

                <p className="mx-auto mt-auto max-w-[250px] text-center text-[15px] leading-relaxed" style={{ color: textSoft }}>
                  Seu estado fisiológico está excelente e em equilíbrio.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.03 }}
                className="flex h-[380px] flex-col rounded-2xl border p-5"
                style={{
                  background: surface,
                  borderColor: borderSoft,
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02)",
                }}
              >
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-[#bbc1c6]">Leitura Rápida</p>

                <div className="space-y-3">
                  {quickReadItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.title}
                        className="flex items-start gap-3 rounded-2xl border p-3.5"
                        style={{
                          borderColor: "rgba(255,255,255,0.04)",
                          background: elevated,
                        }}
                      >
                        <div className={`rounded-2xl p-2.5 ${item.bgTone}`}>
                          <Icon className={`h-4.5 w-4.5 ${item.tone}`} />
                        </div>
                        <div>
                          <p className="text-[15px] font-semibold text-white">{item.title}</p>
                          <p className="mt-1 text-sm leading-relaxed" style={{ color: textSoft }}>
                            {item.sub}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 }}
                className="flex h-[380px] flex-col rounded-2xl border p-5"
                style={{
                  background: "linear-gradient(180deg, #101315, #0f1113)",
                  borderColor: "rgba(39,225,179,0.1)",
                  boxShadow: "0 0 30px rgba(39,225,179,0.05), inset 0 1px 0 rgba(255,255,255,0.02)",
                }}
              >
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#bbc1c6]">Sugestão Inteligente</p>
                  <div className="flex items-center gap-2 rounded-full bg-[#27e1b3]/6 px-3 py-1.5">
                    <Cpu className="h-4 w-4 text-[#27e1b3]" />
                    <span className="text-sm font-semibold text-white/90">VitalFlow AI</span>
                  </div>
                </div>

                <div className="grid h-full grid-cols-1 gap-4 xl:grid-cols-[1fr_150px]">
                  <div
                    className="flex flex-col rounded-2xl border p-4"
                    style={{
                      borderColor: "rgba(39,225,179,0.18)",
                      background: "linear-gradient(180deg, rgba(18,48,38,0.74), rgba(11,20,17,0.96))",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03), 0 0 26px rgba(39,225,179,0.04)",
                    }}
                  >
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#79dfc4]">
                      Recomendação prioritária
                    </p>
                    <h3 className="text-[20px] font-bold text-[#35d9b0]">Manutenção positiva</h3>
                    <p className="mt-2 text-[15px] leading-relaxed text-white/92">
                      Mantenha seu estado estável com uma respiração curta de manutenção.
                    </p>

                    <div className="mt-4 border-t border-white/8 pt-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#9ed8c9]">
                        Por que esta recomendação?
                      </p>
                      <p className="mt-2 text-sm leading-relaxed" style={{ color: textSoft }}>
                        Estado estável, HRV preservada e stress controlado.
                      </p>
                    </div>

                    <div className="mt-auto border-t border-white/8 pt-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#9ed8c9]">
                        Base da recomendação
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-white/90">122 leituras válidas hoje.</p>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between gap-3">
                    <div
                      className="rounded-2xl border p-4"
                      style={{
                        borderColor: "rgba(255,255,255,0.05)",
                        background: elevated,
                      }}
                    >
                      <p className="text-[10px] uppercase tracking-[0.24em]" style={{ color: textMuted }}>
                        Duração
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <Clock3 className="h-4 w-4 text-[#27e1b3]" />
                        <span className="text-lg font-bold text-white">3 min</span>
                      </div>

                      <p className="mt-5 text-[10px] uppercase tracking-[0.24em]" style={{ color: textMuted }}>
                        Tipo
                      </p>
                      <p className="mt-2 text-[15px] text-white/90">Manutenção</p>
                    </div>

                    <motion.button
                      whileHover={{ y: -1, scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      type="button"
                      className="mt-auto flex h-12 items-center justify-center gap-3 rounded-2xl px-5 text-[16px] font-bold text-[#041018]"
                      style={{
                        background: "linear-gradient(90deg,#29d3aa,#27e1b3)",
                        boxShadow: "0 10px 28px rgba(39,225,179,0.18)",
                      }}
                    >
                      Iniciar agora
                      <ArrowRight className="h-5 w-5" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </section>

            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col gap-2 rounded-2xl border px-5 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
              style={{
                background: panel,
                borderColor: borderSoft,
              }}
            >
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-[#27e1b3]" />
                <span style={{ color: textSoft }}>Última sincronização:</span>
                <span className="text-white/95">agora mesmo</span>
              </div>
              <div>
                <span style={{ color: textSoft }}>Qualidade do sinal:</span>{" "}
                <span className="font-semibold text-[#27e1b3]">Boa</span>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ color: textSoft }}>Cobertura do dia:</span>
                <span className="font-semibold text-[#d7b35a]">82%</span>
                <div className="h-1.5 w-14 overflow-hidden rounded-full bg-white/5">
                  <div className="h-full rounded-full bg-[#27e1b3]" style={{ width: "82%" }} />
                </div>
              </div>
            </motion.section>

            <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_0.6fr]">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border p-5"
                style={{
                  background: surface,
                  borderColor: borderSoft,
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02)",
                }}
              >
                <div className="mb-4 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-[#27e1b3]" />
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#bbc1c6]">Evolução do V-Score</p>
                </div>

                <div
                  className="h-[340px] w-full rounded-2xl border p-3"
                  style={{
                    background: "linear-gradient(180deg, rgba(8,12,13,0.92), rgba(10,14,15,0.96))",
                    borderColor: "rgba(255,255,255,0.04)",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.015)",
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 18, right: 18, left: -12, bottom: 8 }}>
                      <defs>
                        <linearGradient id="vscoreFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#27e1b3" stopOpacity={0.28} />
                          <stop offset="35%" stopColor="#27e1b3" stopOpacity={0.14} />
                          <stop offset="100%" stopColor="#27e1b3" stopOpacity={0.01} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" strokeDasharray="3 4" />
                      <ReferenceLine
                        y={70}
                        stroke="#b99748"
                        strokeDasharray="6 5"
                        label={{
                          value: "Zona ideal",
                          position: "insideBottomRight",
                          fill: "#b99748",
                          fontSize: 11,
                        }}
                      />
                      <ReferenceLine
                        y={avgScore}
                        stroke="rgba(255,255,255,0.14)"
                        strokeDasharray="4 4"
                        label={{
                          value: "Média pessoal",
                          position: "insideTopRight",
                          fill: "#8b949b",
                          fontSize: 11,
                        }}
                      />
                      <XAxis dataKey="time" stroke="rgba(255,255,255,0.22)" tickLine={false} axisLine={false} style={{ fontSize: "11px" }} />
                      <YAxis domain={[0, 100]} stroke="rgba(255,255,255,0.22)" tickLine={false} axisLine={false} style={{ fontSize: "11px" }} />
                      <Tooltip content={<TrendTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="score"
                        stroke={emerald2}
                        strokeWidth={3.5}
                        fill="url(#vscoreFill)"
                        dot={<TrendDot />}
                        activeDot={{ r: 7, fill: emerald, stroke: "#050505", strokeWidth: 3 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-5 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-[3px] w-6 rounded-full bg-[#27e1b3]" />
                    <span style={{ color: textSoft }}>V-Score</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-[3px] w-6 rounded-full bg-white/30" />
                    <span style={{ color: textSoft }}>Média pessoal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-6 rounded-md bg-[#27e1b3]/16" />
                    <span style={{ color: textSoft }}>Zona ideal</span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 }}
                className="rounded-2xl border p-5"
                style={{
                  background: surface,
                  borderColor: borderSoft,
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02)",
                }}
              >
                <div className="mb-4 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-[#27e1b3]" />
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#bbc1c6]">Métricas do momento</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {metricCards.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.title}
                        className="rounded-2xl border px-4 py-3.5"
                        style={{
                          background: elevated,
                          borderColor: "rgba(255,255,255,0.045)",
                        }}
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-[11px] uppercase tracking-[0.18em] text-white/42">{item.title}</span>
                          <Icon className={`h-4 w-4 ${item.color}`} />
                        </div>

                        <div className="flex items-end gap-1">
                          <span className={`text-[22px] font-bold ${item.color}`}>{item.value}</span>
                        </div>

                        <p className="mt-1.5 text-xs" style={{ color: textSoft }}>
                          {item.sub}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </section>

            <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 gap-3 xl:grid-cols-4">
              {insights.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="flex items-center gap-3 rounded-2xl border px-4 py-3.5"
                    style={{
                      background: surface,
                      borderColor: borderSoft,
                    }}
                  >
                    <div className={`rounded-2xl p-2.5 ${item.bgTone}`}>
                      <Icon className={`h-4.5 w-4.5 ${item.tone}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-semibold text-white">{item.title}</p>
                      <p className="truncate text-sm" style={{ color: textSoft }}>
                        {item.sub}
                      </p>
                    </div>
                  </div>
                );
              })}
            </motion.section>
          </main>
        </div>
      </div>
    </div>
  );
}

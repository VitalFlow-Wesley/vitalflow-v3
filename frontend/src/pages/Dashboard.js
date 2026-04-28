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
  Zap,
  Footprints,
  Flame,
  Route,
  Timer,
  Moon,
  Droplets,
  Target,
  CheckCircle2,
  Star,
} from "lucide-react";
import Navbar from "../components/Navbar";

const bg = "#050816";
const card = "rgba(10,18,26,0.92)";
const cardSoft = "rgba(8,15,22,0.88)";
const border = "#0f2a2a";
const teal = "#27e1b3";
const textSoft = "#8fa3ad";
const textMuted = "#6f808a";

const dayModeBlocks = [
  {
    label: "Modo do dia",
    value: "Manutenção",
    sub: "Condição ideal para manter consistência e foco nas suas atividades.",
    icon: Gauge,
    color: "text-[#27e1b3]",
  },
  {
    label: "Prioridade",
    value: "Baixa",
    sub: "Momento favorável",
    icon: ShieldCheck,
    color: "text-[#42f0bf]",
  },
  {
    label: "Janela ideal",
    value: "Agora",
    sub: "Próximas 2-3 horas",
    icon: TimerReset,
    color: "text-[#2ee7b7]",
  },
  {
    label: "Foco do dia",
    value: "Manutenção leve",
    sub: "Evite excessos",
    icon: Focus,
    color: "text-[#ffd166]",
  },
  {
    label: "Próxima reavaliação",
    value: "Em 3h 12m",
    sub: "16:30",
    icon: Clock3,
    color: "text-white",
  },
];

const quickReadItems = [
  {
    icon: Activity,
    title: "Estável nas últimas 6h",
    sub: "Variação mínima detectada",
    tone: "text-[#27e1b3]",
    bgTone: "bg-[#27e1b3]/10",
  },
  {
    icon: Brain,
    title: "Stress controlado",
    sub: "Carga mental dentro do ideal",
    tone: "text-[#f8bf4f]",
    bgTone: "bg-[#f8bf4f]/10",
  },
  {
    icon: HeartPulse,
    title: "HRV preservada",
    sub: "Bom sinal de recuperação",
    tone: "text-[#3cf0c2]",
    bgTone: "bg-[#3cf0c2]/10",
  },
  {
    icon: ShieldCheck,
    title: "Boa janela para manutenção",
    sub: "Aproveite para manter consistência",
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
  { icon: Activity, title: "HRV", value: "45", sub: "Excelente", color: "text-[#42f0bf]" },
  { icon: Droplets, title: "SpO2", value: "98%", sub: "Normal", color: "text-[#3cf0c2]" },
  { icon: Moon, title: "Sono", value: "7h 32m", sub: "Bom", color: "text-[#b39cff]" },
  { icon: Footprints, title: "Passos", value: "947", sub: "Meta: 8.000", color: "text-[#ffd166]", footer: 12 },
  { icon: Flame, title: "Calorias", value: "240", sub: "Atividade leve", color: "text-[#ffa94d]" },
  { icon: Route, title: "Distância", value: "2,2", unit: "km", sub: "Baixo impacto", color: "text-[#b39cff]" },
  { icon: Timer, title: "Min. Ativos", value: "59", unit: "min", sub: "Meta: 60 min", color: "text-[#b39cff]", footer: 98 },
];

const insights = [
  {
    icon: CheckCircle2,
    title: "Excelente recuperação",
    sub: "Seu corpo está se recuperando muito bem. Continue assim!",
    tone: "text-[#27e1b3]",
    bgTone: "bg-[#27e1b3]/10",
  },
  {
    icon: Star,
    title: "Consistência é chave",
    sub: "7 dias seguidos monitorando. Mantenha o ritmo!",
    tone: "text-[#ffd166]",
    bgTone: "bg-[#ffd166]/10",
  },
  {
    icon: Droplets,
    title: "Atenção à hidratação",
    sub: "Sua ingestão de água está um pouco abaixo do ideal.",
    tone: "text-[#a9a1ff]",
    bgTone: "bg-[#a9a1ff]/10",
  },
  {
    icon: Target,
    title: "Próximo objetivo",
    sub: "Mantenha 7+ horas de sono para otimizar ainda mais.",
    tone: "text-[#ff6b81]",
    bgTone: "bg-[#ff6b81]/10",
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
      className="rounded-2xl border px-3 py-2 shadow-2xl"
      style={{
        background: "rgba(5, 8, 22, 0.96)",
        borderColor: border,
      }}
    >
      <p className="text-xs text-white">{label}</p>
      <p className="text-sm font-bold text-[#27e1b3]">{value}</p>
    </div>
  );
}

function TrendDot(props) {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null || !payload) return null;

  const score = payload.score;
  const fill = score >= 80 ? "#27e1b3" : score >= 60 ? "#f8bf4f" : "#ff4d6d";

  const labelMap = {
    "05:00": "Maior queda",
    "12:00": "Recuperação",
    "24:00": "Atual",
  };

  const markerLabel = labelMap[payload.time];

  return (
    <g>
      <circle cx={cx} cy={cy} r="5.5" fill={fill} stroke="#06111a" strokeWidth="2.5" />
      {markerLabel ? (
        <g>
          <rect
            x={cx - 44}
            y={cy + 18}
            width={88}
            height={24}
            rx={8}
            fill={fill === "#27e1b3" ? "rgba(39,225,179,0.12)" : fill === "#f8bf4f" ? "rgba(248,191,79,0.12)" : "rgba(255,77,109,0.12)"}
            stroke={fill}
            strokeOpacity={0.35}
          />
          <text x={cx} y={cy + 34} textAnchor="middle" fill={fill} fontSize="11" fontWeight="700">
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

      <div className="mx-auto max-w-[1600px] px-4 pb-6 pt-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
          <motion.aside
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex h-full flex-col rounded-2xl border p-4"
            style={{ background: cardSoft, borderColor: border }}
          >
            <div className="mb-4 flex items-center gap-3 border-b border-white/5 pb-4">
              <div className="rounded-2xl border border-[#0f2a2a] bg-[#07131d] p-3 shadow-[0_0_20px_rgba(39,225,179,0.08)]">
                <LayoutDashboard className="h-6 w-6 text-[#27e1b3]" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.22em]" style={{ color: textMuted }}>
                  Navegação
                </p>
                <p className="text-base font-semibold text-white">Painel principal</p>
              </div>
            </div>

            <nav className="space-y-2">
              {sideMenu.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.button
                    key={item.label}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.03 * index }}
                    className={`group flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all ${
                      item.active ? "bg-[#0b1d24] shadow-[inset_3px_0_0_0_#27e1b3]" : "bg-transparent hover:bg-white/[0.03]"
                    }`}
                    style={{ borderColor: item.active ? "#153839" : "transparent" }}
                    type="button"
                  >
                    <Icon className={`h-5 w-5 ${item.active ? "text-[#27e1b3]" : "text-white/45 group-hover:text-white/70"}`} />
                    <span className={`text-[15px] ${item.active ? "font-semibold text-[#dffdf4]" : "text-white/65"}`}>
                      {item.label}
                    </span>
                  </motion.button>
                );
              })}
            </nav>

            <div className="mt-auto pt-6">
              <div
                className="rounded-2xl border p-4 shadow-[0_0_30px_rgba(39,225,179,0.06)]"
                style={{ background: "linear-gradient(180deg, rgba(8,18,24,0.96), rgba(6,14,20,0.96))", borderColor: border }}
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className="rounded-xl bg-[#27e1b3]/10 p-2">
                    <Crown className="h-4 w-4 text-[#27e1b3]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Plano Premium</p>
                    <p className="text-sm text-[#27e1b3]">Ativo</p>
                  </div>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: textSoft }}>
                  Acesso completo a insights e recomendações avançadas.
                </p>
              </div>
            </div>
          </motion.aside>

          <main className="space-y-6">
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 overflow-hidden rounded-2xl border xl:grid-cols-5"
              style={{ background: card, borderColor: border }}
            >
              {dayModeBlocks.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className={`relative flex min-h-[142px] gap-4 px-6 py-5 ${index !== dayModeBlocks.length - 1 ? "border-b xl:border-b-0 xl:border-r" : ""}`}
                    style={{ borderColor: "rgba(255,255,255,0.05)" }}
                  >
                    {index === 0 ? (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#27e1b3]/10">
                        <Icon className="h-7 w-7 text-[#27e1b3]" />
                      </div>
                    ) : (
                      <div className="mt-1 shrink-0">
                        <Icon className="h-5 w-5 text-white/50" />
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="mb-1 text-[11px] uppercase tracking-[0.24em]" style={{ color: textMuted }}>
                        {item.label}
                      </p>
                      <p className={`text-[18px] font-bold ${item.color}`}>{item.value}</p>
                      <p className="mt-1 max-w-[240px] text-sm leading-relaxed" style={{ color: textSoft }}>
                        {item.sub}
                      </p>
                      {index === 0 ? (
                        <button
                          type="button"
                          className="mt-3 rounded-xl border px-3 py-1.5 text-xs font-medium text-white/80 transition hover:bg-white/5"
                          style={{ borderColor: "rgba(255,255,255,0.08)" }}
                        >
                          Saiba mais
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </motion.section>

            <section className="grid grid-cols-1 gap-5 xl:grid-cols-[0.9fr_1.1fr_1.3fr]">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border p-6" style={{ background: card, borderColor: border }}>
                <p className="mb-5 text-xs font-semibold uppercase tracking-[0.28em] text-[#b7c7cf]">Status Vital</p>
                <div className="mb-3 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[#27e1b3]" />
                  <h3 className="text-[19px] font-bold text-white">Resiliência ótima</h3>
                </div>
                <div className="mx-auto mt-7 flex h-44 w-44 items-center justify-center rounded-full bg-[conic-gradient(#27e1b3_0deg,#32f0c0_360deg)] p-[12px] shadow-[0_0_40px_rgba(39,225,179,0.16)]">
                  <div className="flex h-full w-full flex-col items-center justify-center rounded-full border border-[#0e2327] bg-[#071018]">
                    <span className="text-5xl font-black text-white">100</span>
                    <span className="mt-1 text-sm" style={{ color: textSoft }}>de 100</span>
                  </div>
                </div>
                <div className="mt-7 flex justify-center">
                  <span className="rounded-full border border-[#12433a] bg-[#27e1b3]/10 px-4 py-1.5 text-sm font-semibold uppercase tracking-[0.22em] text-[#27e1b3]">
                    NORMAL
                  </span>
                </div>
                <p className="mx-auto mt-5 max-w-[280px] text-center text-base leading-relaxed" style={{ color: textSoft }}>
                  Seu estado fisiológico está excelente e em equilíbrio.
                </p>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }} className="rounded-2xl border p-6" style={{ background: card, borderColor: border }}>
                <p className="mb-5 text-xs font-semibold uppercase tracking-[0.28em] text-[#b7c7cf]">Leitura Rápida</p>
                <div className="space-y-4">
                  {quickReadItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.title} className="flex items-start gap-4 rounded-2xl border p-4" style={{ borderColor: "rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)" }}>
                        <div className={`rounded-2xl p-3 ${item.bgTone}`}>
                          <Icon className={`h-5 w-5 ${item.tone}`} />
                        </div>
                        <div>
                          <p className="text-base font-semibold text-white">{item.title}</p>
                          <p className="mt-1 text-sm leading-relaxed" style={{ color: textSoft }}>{item.sub}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} className="rounded-2xl border p-6" style={{ background: card, borderColor: border }}>
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#b7c7cf]">Sugestão Inteligente</p>
                  <div className="flex items-center gap-2 rounded-full bg-[#27e1b3]/8 px-3 py-1.5">
                    <Sparkles className="h-4 w-4 text-[#27e1b3]" />
                    <span className="text-sm font-semibold text-white/90">VitalFlow AI</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_170px]">
                  <div className="rounded-2xl border p-5" style={{ borderColor: "#184239", background: "linear-gradient(180deg, rgba(13,43,34,0.55), rgba(8,21,18,0.72))" }}>
                    <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#63f0c8]">Recomendação prioritária</p>
                    <h3 className="text-[20px] font-bold text-[#35e8ba]">Manutenção positiva</h3>
                    <p className="mt-2 max-w-[540px] text-[17px] leading-relaxed text-white/92">
                      Mantenha seu estado estável com uma respiração curta de manutenção.
                    </p>
                    <div className="mt-5 border-t border-white/8 pt-5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#9ed8c9]">Por que esta recomendação?</p>
                      <p className="mt-2 text-sm leading-relaxed" style={{ color: textSoft }}>
                        Seu V-Score está estável, HRV preservada e stress controlado. Este é o momento ideal para manter consistência e evitar sobrecarga.
                      </p>
                    </div>
                    <div className="mt-5 border-t border-white/8 pt-5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#9ed8c9]">Base da recomendação</p>
                      <p className="mt-2 text-sm leading-relaxed text-white/90">Baseado em 122 leituras válidas hoje.</p>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between gap-4">
                    <div className="rounded-2xl border p-4" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.01)" }}>
                      <p className="text-[11px] uppercase tracking-[0.24em]" style={{ color: textMuted }}>Duração sugerida</p>
                      <div className="mt-3 flex items-center gap-2">
                        <Clock3 className="h-4 w-4 text-[#27e1b3]" />
                        <span className="text-lg font-bold text-white">3 min</span>
                      </div>
                      <p className="mt-6 text-[11px] uppercase tracking-[0.24em]" style={{ color: textMuted }}>Tipo</p>
                      <p className="mt-2 text-base text-white/90">Manutenção</p>
                    </div>

                    <motion.button
                      whileHover={{ y: -1, scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      type="button"
                      className="flex h-14 items-center justify-center gap-3 rounded-2xl bg-[linear-gradient(90deg,#2df1bd,#27e1b3)] px-5 text-lg font-bold text-[#041018] shadow-[0_8px_30px_rgba(39,225,179,0.2)]"
                    >
                      Iniciar agora
                      <ArrowRight className="h-5 w-5" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </section>

            <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-2 rounded-2xl border px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between" style={{ background: cardSoft, borderColor: border }}>
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-[#27e1b3]" />
                <span style={{ color: textSoft }}>Última sincronização:</span>
                <span className="text-white/95">agora mesmo</span>
              </div>
              <div>
                <span style={{ color: textSoft }}>Qualidade do sinal:</span> <span className="font-semibold text-[#27e1b3]">Boa</span>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ color: textSoft }}>Cobertura do dia:</span>
                <span className="font-semibold text-[#ffd166]">82%</span>
                <div className="h-1.5 w-14 overflow-hidden rounded-full bg-white/5">
                  <div className="h-full rounded-full bg-[#27e1b3]" style={{ width: "82%" }} />
                </div>
              </div>
            </motion.section>

            <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.3fr_0.9fr]">
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border p-6" style={{ background: card, borderColor: border }}>
                <div className="mb-5 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-[#27e1b3]" />
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#b7c7cf]">Evolução do V-Score</p>
                </div>

                <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 20, right: 18, left: -12, bottom: 10 }}>
                      <defs>
                        <linearGradient id="vscoreFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#27e1b3" stopOpacity={0.25} />
                          <stop offset="100%" stopColor="#27e1b3" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 4" />
                      <ReferenceLine y={70} stroke="#d6b74a" strokeDasharray="6 5" label={{ value: "Zona ideal", position: "insideBottomRight", fill: "#d6b74a", fontSize: 11 }} />
                      <ReferenceLine y={avgScore} stroke="rgba(255,255,255,0.16)" strokeDasharray="4 4" label={{ value: "Média", position: "insideTopRight", fill: "#91a5b0", fontSize: 11 }} />
                      <XAxis dataKey="time" stroke="rgba(255,255,255,0.26)" tickLine={false} axisLine={false} style={{ fontSize: "11px" }} />
                      <YAxis domain={[0, 100]} stroke="rgba(255,255,255,0.26)" tickLine={false} axisLine={false} style={{ fontSize: "11px" }} />
                      <Tooltip content={<TrendTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="score"
                        stroke="#34eac0"
                        strokeWidth={4}
                        fill="url(#vscoreFill)"
                        dot={<TrendDot />}
                        activeDot={{ r: 7, fill: "#27e1b3", stroke: "#061018", strokeWidth: 3 }}
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
                    <div className="h-3 w-6 rounded-md bg-[#27e1b3]/20" />
                    <span style={{ color: textSoft }}>Zona ideal</span>
                  </div>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }} className="grid grid-cols-1 gap-5">
                <div className="rounded-2xl border p-6" style={{ background: card, borderColor: border }}>
                  <div className="mb-5 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-[#27e1b3]" />
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#b7c7cf]">Métricas do momento</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {metricCards.map((item) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.title} className="rounded-2xl border p-4" style={{ background: "rgba(255,255,255,0.01)", borderColor: "rgba(255,255,255,0.06)" }}>
                          <div className="mb-3 flex items-center gap-2">
                            <Icon className={`h-4 w-4 ${item.color}`} />
                            <span className="text-[15px] text-white/90">{item.title}</span>
                          </div>
                          <div className="flex items-end gap-1">
                            <span className={`text-[22px] font-bold ${item.color}`}>{item.value}</span>
                            {item.unit ? <span className="pb-1 text-sm text-white/70">{item.unit}</span> : null}
                          </div>
                          <p className="mt-2 text-sm" style={{ color: textSoft }}>{item.sub}</p>
                          {typeof item.footer === "number" ? (
                            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/5">
                              <div className={`h-full rounded-full ${item.title === "Passos" ? "bg-[#ffd166]" : "bg-[#27e1b3]"}`} style={{ width: `${item.footer}%` }} />
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            </section>

            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border p-6" style={{ background: card, borderColor: border }}>
              <p className="mb-5 text-xs font-semibold uppercase tracking-[0.28em] text-[#b7c7cf]">Insights do momento</p>

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
                {insights.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="flex items-start gap-4 rounded-2xl border p-4" style={{ background: "rgba(255,255,255,0.01)", borderColor: "rgba(255,255,255,0.06)" }}>
                      <div className={`rounded-2xl p-3 ${item.bgTone}`}>
                        <Icon className={`h-5 w-5 ${item.tone}`} />
                      </div>
                      <div>
                        <p className="text-base font-semibold text-white">{item.title}</p>
                        <p className="mt-1 text-sm leading-relaxed" style={{ color: textSoft }}>{item.sub}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.section>
          </main>
        </div>
      </div>
    </div>
  );
}

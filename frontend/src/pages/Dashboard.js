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
} from "lucide-react";
import Navbar from "../components/Navbar";

const bg = "#050505";
const card = "#0d0f10";
const cardSoft = "#0b0b0c";
const border = "rgba(255,255,255,0.08)";
const borderSoft = "rgba(255,255,255,0.06)";
const teal = "#27e1b3";
const tealSoft = "rgba(39,225,179,0.12)";
const tealGlow = "rgba(39,225,179,0.14)";
const textSoft = "#9aa1a6";
const textMuted = "#6f757b";

const dayModeBlocks = [
  {
    label: "Modo do dia",
    value: "Manutenção",
    sub: "Condição ideal para manter consistência e foco nas suas atividades.",
    icon: Gauge,
    color: "text-[#33dbb1]",
  },
  {
    label: "Prioridade",
    value: "Baixa",
    sub: "Momento favorável",
    icon: ShieldCheck,
    color: "text-[#58e6c0]",
  },
  {
    label: "Janela ideal",
    value: "Agora",
    sub: "Próximas 2-3 horas",
    icon: TimerReset,
    color: "text-[#35d9b0]",
  },
  {
    label: "Foco do dia",
    value: "Manutenção leve",
    sub: "Evite excessos",
    icon: Focus,
    color: "text-[#d7b35a]",
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
    tone: "text-[#d7b35a]",
    bgTone: "bg-[#d7b35a]/10",
  },
  {
    icon: HeartPulse,
    title: "HRV preservada",
    sub: "Bom sinal de recuperação",
    tone: "text-[#39e8bf]",
    bgTone: "bg-[#39e8bf]/10",
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
  { icon: Activity, title: "HRV", value: "45", sub: "Excelente", color: "text-[#4ae6be]" },
  { icon: Droplets, title: "SpO2", value: "98%", sub: "Normal", color: "text-[#39d9be]" },
  { icon: Moon, title: "Sono", value: "7h 32m", sub: "Bom", color: "text-[#ad9eff]" },
  { icon: Footprints, title: "Passos", value: "947", sub: "Meta: 8.000", color: "text-[#e2bc62]", footer: 12 },
  { icon: Flame, title: "Calorias", value: "240", sub: "Atividade leve", color: "text-[#d79b57]" },
  { icon: Route, title: "Distância", value: "2,2", unit: "km", sub: "Baixo impacto", color: "text-[#ad9eff]" },
  { icon: Timer, title: "Min. Ativos", value: "59", unit: "min", sub: "Meta: 60 min", color: "text-[#ad9eff]", footer: 98 },
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
    tone: "text-[#d7b35a]",
    bgTone: "bg-[#d7b35a]/10",
  },
  {
    icon: Droplets,
    title: "Atenção à hidratação",
    sub: "Sua ingestão de água está um pouco abaixo do ideal.",
    tone: "text-[#aa9dff]",
    bgTone: "bg-[#aa9dff]/10",
  },
  {
    icon: Target,
    title: "Próximo objetivo",
    sub: "Mantenha 7+ horas de sono para otimizar ainda mais.",
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
      className="rounded-2xl border px-3 py-2 shadow-2xl"
      style={{
        background: "rgba(5, 5, 5, 0.96)",
        borderColor: borderSoft,
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
  const fill = score >= 80 ? "#27e1b3" : score >= 60 ? "#d7b35a" : "#ff5f7a";

  const labelMap = {
    "05:00": "Maior queda",
    "12:00": "Recuperação",
    "24:00": "Atual",
  };

  const markerLabel = labelMap[payload.time];

  return (
    <g>
      <circle cx={cx} cy={cy} r="5" fill={fill} stroke="#060707" strokeWidth="2.5" />
      {markerLabel ? (
        <g>
          <rect
            x={cx - 44}
            y={cy + 16}
            width={88}
            height={22}
            rx={8}
            fill={fill === "#27e1b3" ? "rgba(39,225,179,0.12)" : fill === "#d7b35a" ? "rgba(215,179,90,0.12)" : "rgba(255,95,122,0.12)"}
            stroke={fill}
            strokeOpacity={0.28}
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
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[240px_minmax(0,1fr)]">
          <motion.aside
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex h-full flex-col rounded-2xl border p-4"
            style={{ background: cardSoft, borderColor: borderSoft }}
          >
            <div className="mb-4 flex items-center gap-3 border-b border-white/[0.05] pb-4">
              <div className="rounded-2xl border p-3 shadow-[0_0_18px_rgba(39,225,179,0.04)]" style={{ borderColor: borderSoft, background: "#0a0b0c" }}>
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
                      item.active
                        ? "shadow-[inset_3px_0_0_0_#27e1b3,0_0_16px_rgba(39,225,179,0.05)]"
                        : "hover:bg-white/[0.02]"
                    }`}
                    style={{
                      background: item.active ? "rgba(39,225,179,0.06)" : "transparent",
                      borderColor: item.active ? "rgba(39,225,179,0.16)" : "transparent",
                    }}
                    type="button"
                  >
                    <Icon className={`h-4.5 w-4.5 ${item.active ? "text-[#27e1b3]" : "text-white/40 group-hover:text-white/70"}`} />
                    <span className={`text-[15px] ${item.active ? "font-semibold text-[#e3fbf4]" : "text-white/62"}`}>
                      {item.label}
                    </span>
                  </motion.button>
                );
              })}
            </nav>

            <div className="mt-auto pt-5">
              <div
                className="rounded-2xl border p-4 shadow-[0_0_22px_rgba(39,225,179,0.03)]"
                style={{ background: "#0d0f10", borderColor: borderSoft }}
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

          <main className="space-y-5">
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 overflow-hidden rounded-2xl border xl:grid-cols-5"
              style={{ background: card, borderColor: borderSoft }}
            >
              {dayModeBlocks.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className={`relative flex min-h-[128px] gap-4 px-5 py-4 ${index !== dayModeBlocks.length - 1 ? "border-b xl:border-b-0 xl:border-r" : ""}`}
                    style={{ borderColor: "rgba(255,255,255,0.045)" }}
                  >
                    {index === 0 ? (
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#27e1b3]/10">
                        <Icon className="h-6 w-6 text-[#27e1b3]" />
                      </div>
                    ) : (
                      <div className="mt-1 shrink-0">
                        <Icon className="h-4.5 w-4.5 text-white/45" />
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="mb-1 text-[10px] uppercase tracking-[0.24em]" style={{ color: textMuted }}>
                        {item.label}
                      </p>
                      <p className={`text-[17px] font-bold ${item.color}`}>{item.value}</p>
                      <p className="mt-1 max-w-[220px] text-sm leading-relaxed" style={{ color: textSoft }}>
                        {item.sub}
                      </p>
                      {index === 0 ? (
                        <button
                          type="button"
                          className="mt-3 rounded-xl border px-3 py-1.5 text-xs font-medium text-white/78 transition hover:bg-white/[0.04]"
                          style={{ borderColor: "rgba(255,255,255,0.07)" }}
                        >
                          Saiba mais
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </motion.section>

            <section className="grid grid-cols-1 gap-4 xl:grid-cols-[0.9fr_1.05fr_1.25fr]">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border p-5"
                style={{ background: card, borderColor: borderSoft }}
              >
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-[#bbc1c6]">
                  Status Vital
                </p>

                <div className="mb-3 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[#27e1b3]" />
                  <h3 className="text-[18px] font-bold text-white">Resiliência ótima</h3>
                </div>

                <div className="mx-auto mt-6 flex h-40 w-40 items-center justify-center rounded-full bg-[conic-gradient(#27e1b3_0deg,#33dbb1_360deg)] p-[11px] shadow-[0_0_36px_rgba(39,225,179,0.12)]">
                  <div className="flex h-full w-full flex-col items-center justify-center rounded-full border bg-[#090b0c]" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                    <span className="text-5xl font-black text-white">100</span>
                    <span className="mt-1 text-sm" style={{ color: textSoft }}>
                      de 100
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex justify-center">
                  <span className="rounded-full border px-4 py-1.5 text-sm font-semibold uppercase tracking-[0.22em] text-[#27e1b3]" style={{ borderColor: "rgba(39,225,179,0.18)", background: "rgba(39,225,179,0.08)" }}>
                    NORMAL
                  </span>
                </div>

                <p className="mx-auto mt-4 max-w-[260px] text-center text-[15px] leading-relaxed" style={{ color: textSoft }}>
                  Seu estado fisiológico está excelente e em equilíbrio.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.03 }}
                className="rounded-2xl border p-5"
                style={{ background: card, borderColor: borderSoft }}
              >
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-[#bbc1c6]">
                  Leitura Rápida
                </p>

                <div className="space-y-3">
                  {quickReadItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.title}
                        className="flex items-start gap-4 rounded-2xl border p-4"
                        style={{ borderColor: "rgba(255,255,255,0.045)", background: "#0f1112" }}
                      >
                        <div className={`rounded-2xl p-3 ${item.bgTone}`}>
                          <Icon className={`h-5 w-5 ${item.tone}`} />
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
                className="rounded-2xl border p-5"
                style={{ background: card, borderColor: borderSoft }}
              >
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#bbc1c6]">
                    Sugestão Inteligente
                  </p>
                  <div className="flex items-center gap-2 rounded-full bg-[#27e1b3]/6 px-3 py-1.5">
                    <Sparkles className="h-4 w-4 text-[#27e1b3]" />
                    <span className="text-sm font-semibold text-white/90">VitalFlow AI</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_160px]">
                  <div
                    className="rounded-2xl border p-5"
                    style={{
                      borderColor: "rgba(39,225,179,0.16)",
                      background: "linear-gradient(180deg, rgba(16,38,30,0.72), rgba(11,19,17,0.94))",
                    }}
                  >
                    <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#79dfc4]">
                      Recomendação prioritária
                    </p>
                    <h3 className="text-[20px] font-bold text-[#35d9b0]">Manutenção positiva</h3>
                    <p className="mt-2 max-w-[520px] text-[16px] leading-relaxed text-white/92">
                      Mantenha seu estado estável com uma respiração curta de manutenção.
                    </p>

                    <div className="mt-5 border-t border-white/8 pt-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#9ed8c9]">
                        Por que esta recomendação?
                      </p>
                      <p className="mt-2 text-sm leading-relaxed" style={{ color: textSoft }}>
                        Seu V-Score está estável, HRV preservada e stress controlado. Este é o momento ideal para manter consistência e evitar sobrecarga.
                      </p>
                    </div>

                    <div className="mt-4 border-t border-white/8 pt-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#9ed8c9]">
                        Base da recomendação
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-white/90">
                        Baseado em 122 leituras válidas hoje.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between gap-4">
                    <div className="rounded-2xl border p-4" style={{ borderColor: "rgba(255,255,255,0.05)", background: "#0f1112" }}>
                      <p className="text-[10px] uppercase tracking-[0.24em]" style={{ color: textMuted }}>
                        Duração sugerida
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
                      className="flex h-13 items-center justify-center gap-3 rounded-2xl px-5 text-[17px] font-bold text-[#041018] shadow-[0_8px_24px_rgba(39,225,179,0.14)]"
                      style={{ background: "linear-gradient(90deg,#2ad7ac,#27e1b3)" }}
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
              style={{ background: cardSoft, borderColor: borderSoft }}
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

            <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.3fr_0.9fr]">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border p-5"
                style={{ background: card, borderColor: borderSoft }}
              >
                <div className="mb-4 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-[#27e1b3]" />
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#bbc1c6]">
                    Evolução do V-Score
                  </p>
                </div>

                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 20, right: 18, left: -12, bottom: 10 }}>
                      <defs>
                        <linearGradient id="vscoreFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#27e1b3" stopOpacity={0.18} />
                          <stop offset="100%" stopColor="#27e1b3" stopOpacity={0.01} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.045)" strokeDasharray="3 4" />
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
                      <XAxis dataKey="time" stroke="rgba(255,255,255,0.24)" tickLine={false} axisLine={false} style={{ fontSize: "11px" }} />
                      <YAxis domain={[0, 100]} stroke="rgba(255,255,255,0.24)" tickLine={false} axisLine={false} style={{ fontSize: "11px" }} />
                      <Tooltip content={<TrendTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="score"
                        stroke="#31d9b0"
                        strokeWidth={3.5}
                        fill="url(#vscoreFill)"
                        dot={<TrendDot />}
                        activeDot={{ r: 7, fill: "#27e1b3", stroke: "#050505", strokeWidth: 3 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-5 text-sm">
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
                style={{ background: card, borderColor: borderSoft }}
              >
                <div className="mb-4 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-[#27e1b3]" />
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#bbc1c6]">
                    Métricas do momento
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {metricCards.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.title}
                        className="rounded-2xl border p-4"
                        style={{ background: "#101214", borderColor: "rgba(255,255,255,0.05)" }}
                      >
                        <div className="mb-3 flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${item.color}`} />
                          <span className="text-[15px] text-white/88">{item.title}</span>
                        </div>

                        <div className="flex items-end gap-1">
                          <span className={`text-[22px] font-bold ${item.color}`}>{item.value}</span>
                          {item.unit ? <span className="pb-1 text-sm text-white/65">{item.unit}</span> : null}
                        </div>

                        <p className="mt-2 text-sm" style={{ color: textSoft }}>
                          {item.sub}
                        </p>

                        {typeof item.footer === "number" ? (
                          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/5">
                            <div
                              className={`h-full rounded-full ${item.title === "Passos" ? "bg-[#d7b35a]" : "bg-[#27e1b3]"}`}
                              style={{ width: `${item.footer}%` }}
                            />
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </section>

            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border p-5"
              style={{ background: card, borderColor: borderSoft }}
            >
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-[#bbc1c6]">
                Insights do momento
              </p>

              <div className="grid grid-cols-1 gap-3 xl:grid-cols-4">
                {insights.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.title}
                      className="flex items-start gap-4 rounded-2xl border p-4"
                      style={{ background: "#101214", borderColor: "rgba(255,255,255,0.05)" }}
                    >
                      <div className={`rounded-2xl p-3 ${item.bgTone}`}>
                        <Icon className={`h-5 w-5 ${item.tone}`} />
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
            </motion.section>
          </main>
        </div>
      </div>
    </div>
  );
}

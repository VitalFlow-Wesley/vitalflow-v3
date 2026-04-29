import {
  useState,
  useEffect,
  useMemo } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ReferenceLine,
  BarChart,
  Bar,
  LabelList
} from "recharts";
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Activity,
  Lock,
  Radio,
  Smartphone,
  Shield,
  Brain,
  HeartPulse,
  Moon,
  Sparkles,
  Gauge,
  Target,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const API = `${process.env.REACT_APP_BACKEND_URL || "https://vitalflow.up.railway.app"}/api`;

const PERIOD_OPTIONS = [
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "6m", label: "6 meses" },
];

const PERIOD_LABELS = {
  "7d": "7 dias",
  "30d": "30 dias",
  "6m": "6 meses",
};

const PIE_COLORS = ["#34d399", "#fbbf24", "#f43f5e"];

const REPORT_CACHE_KEY = "vitalflow_personal_report_cache_v1";
const PREMIUM_TRIAL_KEY_PREFIX = "vitalflow_premium_trial_v1";
const PREMIUM_TRIAL_DAYS = 30;

const readReportCache = () => {
  try {
    const raw = sessionStorage.getItem(REPORT_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const normalizeDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDateLabel = (value) => {
  const date = normalizeDate(value);
  if (!date) return "--";
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
};

const formatLongDateLabel = (value) => {
  const date = normalizeDate(value);
  if (!date) return "--";
  return date.toLocaleDateString("pt-BR");
};

const getScoreColor = (value) => {
  if (value >= 80) return "#34d399";
  if (value >= 60) return "#fbbf24";
  return "#f43f5e";
};

const getScoreToneClass = (value) => {
  if (value >= 80) return "text-emerald-400";
  if (value >= 60) return "text-amber-400";
  return "text-rose-400";
};

const buildPeriodEventLabel = (point, index, list, bestPoint, worstPoint) => {
  if (!point) return "";
  if (index === 0) return "Início";
  if (worstPoint && point.date === worstPoint.date) return "Maior queda";
  if (bestPoint && point.date === bestPoint.date) return "Pico de recuperação";
  if (index === list.length - 1) return "Fechamento";
  return "";
};

const ReportTrendTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  const point = payload.find((entry) => entry?.dataKey === "avg_v_score")?.payload || payload[0]?.payload;
  const value = Number(point?.avg_v_score ?? 0);
  const tone = getScoreToneClass(value);
  const statusLabel = value >= 80 ? "Estável" : value >= 60 ? "Atenção" : "Crítico";
  const eventLabel = point?.eventLabel || "Leitura do período";

  return (
    <div className="bg-[#050505]/95 border border-white/[0.07] rounded-xl p-3 shadow-xl min-w-[220px]">
      <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500 mb-2">
        {formatLongDateLabel(label)}
      </p>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-neutral-400">V-Score</span>
        <span className={`text-sm font-bold ${tone}`}>{value}</span>
      </div>
      <div className="flex items-center justify-between gap-3 mt-1">
        <span className="text-xs text-neutral-400">Leitura</span>
        <span className={`text-xs font-semibold ${tone}`}>{statusLabel}</span>
      </div>
      <p className="text-xs text-neutral-500 mt-3">{eventLabel}</p>
    </div>
  );
};

const TrendDot = ({ cx, cy, payload }) => {
  if (cx == null || cy == null || !payload) return null;

  const score = Number(payload.avg_v_score ?? 0);
  const color = getScoreColor(score);

  return (
    <g>
      <circle cx={cx} cy={cy} r={4.5} fill={color} stroke="#0a0a0a" strokeWidth={2} />
      <text
        x={cx}
        y={cy - 12}
        textAnchor="middle"
        fill={color}
        fontSize="12"
        fontWeight="700"
      >
        {score}
      </text>
      {payload.eventLabel ? (
        <text
          x={cx}
          y={cy + 28}
          textAnchor="middle"
          fill={color}
          fontSize="10"
          fontWeight="600"
        >
          {payload.eventLabel}
        </text>
      ) : null}
    </g>
  );
};

const getCompactAreaData = (topAreas = []) => {
  const fallbackOrder = [
    { key: "cardiovascular", label: "Cardiovascular" },
    { key: "cognitivo", label: "Cognitivo" },
    { key: "muscular", label: "Muscular" },
  ];

  const normalizeLabel = (label) =>
    String(label || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

  const maxCount = Math.max(...topAreas.map((item) => Number(item?.count || 0)), 0);

  return fallbackOrder.map((entry, index) => {
    const match = topAreas.find((item) => {
      const normalized = normalizeLabel(item?.area);
      if (entry.key === "cardiovascular") return normalized.includes("coracao") || normalized.includes("cardio");
      if (entry.key === "cognitivo") return normalized.includes("cerebro") || normalized.includes("cogn");
      if (entry.key === "muscular") return normalized.includes("musculo");
      return false;
    });

    const count = Number(match?.count || 0);
    const percent = maxCount > 0 ? Math.round((count / maxCount) * 100) : index === 0 ? 100 : index === 1 ? 78 : 52;
    const status =
      percent >= 85 ? "Alto impacto" :
      percent >= 65 ? "Impacto moderado" :
      "Impacto leve";

    const color =
      percent >= 85 ? "from-rose-400 to-rose-500" :
      percent >= 65 ? "from-amber-400 to-orange-400" :
      "from-yellow-300 to-amber-400";

    return {
      area: entry.label,
      percent,
      status,
      color,
    };
  });
};

const longevitySparkline = (points) =>
  points
    .map((value, index) => {
      const x = (index / (points.length - 1)) * 100;
      const y = 24 - value;
      return `${index === 0 ? "M" : "L"} ${x},${y}`;
    })
    .join(" ");

const MeuRelatorio = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const reportCache = readReportCache();
  const [period, setPeriod] = useState(reportCache.period || "7d");
  const [report, setReport] = useState(reportCache.report ?? null);
  const [loading, setLoading] = useState(!reportCache.report);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [hasDevices, setHasDevices] = useState(reportCache.hasDevices ?? false);
  const [trialStartedAt, setTrialStartedAt] = useState(null);

  const normalizedAccountType = String(user?.account_type || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  const isB2BUser =
    Boolean(user?.is_b2b) ||
    normalizedAccountType.includes("b2b") ||
    normalizedAccountType.includes("business") ||
    normalizedAccountType.includes("empresa") ||
    normalizedAccountType.includes("empresarial") ||
    normalizedAccountType.includes("corporate") ||
    normalizedAccountType.includes("rh");

  const isPremiumUser = Boolean(user?.is_premium);
  const userPlan = String(
    user?.plan || (isPremiumUser ? "premium" : "free")
  ).toLowerCase();

  const isAdmin =
    String(user?.nivel_acesso || user?.role || "").toLowerCase().includes("ceo") ||
    String(user?.nivel_acesso || user?.role || "").toLowerCase().includes("admin");

  const trialEndsAt = (() => {
    if (!trialStartedAt) return null;
    const started = new Date(trialStartedAt);
    if (Number.isNaN(started.getTime())) return null;
    const ends = new Date(started);
    ends.setDate(ends.getDate() + PREMIUM_TRIAL_DAYS);
    return ends;
  })();

  const isTrialActive = Boolean(trialEndsAt && trialEndsAt.getTime() > Date.now());

  const canExportPdf =
    userPlan === "premium" || isPremiumUser || isB2BUser || isAdmin || isTrialActive;

  useEffect(() => {
    fetchReport({ silent: !!report });
    axios
      .get(API.replace("/api", "") + "/api/wearables", { withCredentials: true })
      .then((r) => setHasDevices(r.data.some((d) => d.is_connected)))
      .catch(() => {});
  }, [period]);

  useEffect(() => {
    try {
      const identity = user?.id || user?.email || "guest";
      const raw = localStorage.getItem(`${PREMIUM_TRIAL_KEY_PREFIX}:${identity}`);
      setTrialStartedAt(raw || null);
    } catch {
      setTrialStartedAt(null);
    }
  }, [user]);

  const fetchReport = async ({ silent = false } = {}) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const { data } = await axios.get(`${API}/report/personal?period=${period}`, {
        withCredentials: true,
      });
      setReport(data);
    } catch {
      toast.error("Erro ao carregar relatorio.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    try {
      sessionStorage.setItem(
        REPORT_CACHE_KEY,
        JSON.stringify({
          period,
          report,
          hasDevices,
        })
      );
    } catch {}
  }, [period, report, hasDevices]);

  const handleExportPdf = async () => {
    if (!canExportPdf) {
      toast.error("Recurso exclusivo do Plano Premium. Faca upgrade para exportar.");
      return;
    }
    setExporting(true);
    try {
      const response = await axios.get(`${API}/report/personal/export-pdf?period=${period}`, {
        withCredentials: true,
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `vitalflow_relatorio_${period}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("PDF exportado com sucesso!");
    } catch (err) {
      const msg =
        err.response?.status === 403
          ? "Recurso exclusivo do Plano Premium."
          : "Erro ao exportar PDF.";
      toast.error(msg);
    } finally {
      setExporting(false);
    }
  };

  const pieData = report
    ? [
        {
          name: "Verde",
          value: report.distribution.verde,
          tone: "Estável",
          helper: "Base fisiológica preservada",
        },
        {
          name: "Amarelo",
          value: report.distribution.amarelo,
          tone: "Atenção",
          helper: "Momentos de sobrecarga",
        },
        {
          name: "Vermelho",
          value: report.distribution.vermelho,
          tone: "Crítico",
          helper: "Episódios críticos, porém não predominantes",
        },
      ].filter((item) => item.value > 0)
    : [];

  const totalDistribution = pieData.reduce((sum, item) => sum + Number(item.value || 0), 0);
  const dominantDistribution = pieData.length
    ? pieData.reduce((best, item) => (item.value > best.value ? item : best))
    : null;
  const dominantDistributionPercent =
    dominantDistribution && totalDistribution > 0
      ? Math.round((dominantDistribution.value / totalDistribution) * 100)
      : 0;

  const hasData = report && report.total_analyses > 0;

  const orderedTrend = useMemo(
    () =>
      report?.trend?.length
        ? [...report.trend].sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          )
        : [],
    [report]
  );

  const trendStart = orderedTrend.length ? Number(orderedTrend[0]?.avg_v_score ?? 0) : null;
  const trendEnd = orderedTrend.length
    ? Number(orderedTrend[orderedTrend.length - 1]?.avg_v_score ?? 0)
    : null;
  const trendDelta =
    trendStart !== null && trendEnd !== null
      ? Number((trendEnd - trendStart).toFixed(1))
      : null;

  const avgReferenceValue = Number(report?.avg_v_score ?? 0);

  const bestTrendPoint = orderedTrend.length
    ? orderedTrend.reduce((best, item) =>
        Number(item.avg_v_score ?? 0) > Number(best.avg_v_score ?? 0) ? item : best
      )
    : null;

  const worstTrendPoint = orderedTrend.length
    ? orderedTrend.reduce((worst, item) =>
        Number(item.avg_v_score ?? 0) < Number(worst.avg_v_score ?? 0) ? item : worst
      )
    : null;

  const trendChartData = orderedTrend.map((item, index) => ({
    ...item,
    eventLabel: buildPeriodEventLabel(item, index, orderedTrend, bestTrendPoint, worstTrendPoint),
  }));

  const trendDirectionLabel =
    trendDelta === null
      ? "Sem comparação"
      : trendDelta > 1
      ? "Melhora no período"
      : trendDelta < -1
      ? "Queda no período"
      : "Estabilidade no período";

  const trendDirectionText =
    trendDelta === null
      ? "comportamento estável"
      : trendDelta > 1
      ? "tendência de melhora"
      : trendDelta < -1
      ? "tendência de queda moderada"
      : "comportamento estável";

  const trendDirectionTone =
    trendDelta === null
      ? "text-neutral-400"
      : trendDelta > 1
      ? "text-emerald-400"
      : trendDelta < -1
      ? "text-rose-400"
      : "text-amber-400";

  const topAreasSummary =
    report?.top_areas?.slice(0, 2).map((item) => item.area).join(" e ") || "sem destaques";

  const coveragePercent =
    period === "7d"
      ? Math.round(((orderedTrend.length || 0) / 7) * 100)
      : period === "30d"
      ? Math.round(((orderedTrend.length || 0) / 30) * 100)
      : null;

  const coverageLabel =
    period === "7d"
      ? `${orderedTrend.length}/7 dias monitorados`
      : period === "30d"
      ? `${orderedTrend.length}/30 dias monitorados`
      : `${orderedTrend.length} dias monitorados`;

  const generatedAtLabel = new Date().toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const bestDayLabel = bestTrendPoint?.date ? formatDateLabel(bestTrendPoint.date) : "--";
  const worstDayLabel = worstTrendPoint?.date ? formatDateLabel(worstTrendPoint.date) : "--";

  const confidenceScore =
    coveragePercent !== null
      ? Math.max(55, Math.min(96, coveragePercent + 10))
      : Math.max(55, Math.min(96, orderedTrend.length * 10));

  const confidenceLabel =
    confidenceScore >= 85
      ? "Alta confiabilidade"
      : confidenceScore >= 70
      ? "Boa confiabilidade"
      : "Confiabilidade moderada";

  const executiveCauseLabel =
    topAreasSummary.toLowerCase().includes("coracao")
      ? "sobrecarga cardiovascular"
      : topAreasSummary.toLowerCase().includes("cerebro")
      ? "fadiga cognitiva"
      : "sobrecarga fisiológica";

  const executiveRecoveryLabel =
    trendDelta === null
      ? "Monitoramento em andamento"
      : trendDelta > 1
      ? "Manter rotina de recuperação"
      : trendDelta < -1
      ? "Atenção recomendada nas próximas 24-48h"
      : "Manter constância de recuperação";

  const narrativeMode =
    trendDelta === null
      ? "stable"
      : trendDelta > 1
      ? "improving"
      : trendDelta < -1
      ? "declining"
      : "stable";

  const executiveSummaryLead =
    narrativeMode === "improving"
      ? "Sua resiliência apresentou tendência de melhora"
      : narrativeMode === "declining"
      ? "Sua resiliência apresentou tendência de queda moderada"
      : "Sua resiliência apresentou comportamento estável";

  const interpretationTitle =
    narrativeMode === "improving"
      ? "Melhora consistente detectada"
      : narrativeMode === "declining"
      ? "Queda moderada detectada"
      : "Estabilidade detectada no período";

  const interpretationDescription =
    narrativeMode === "improving"
      ? `Seu V-Score subiu ${Math.abs(trendDelta || 0)} pontos em relação ao início do período.`
      : narrativeMode === "declining"
      ? `Seu V-Score caiu ${Math.abs(trendDelta || 0)} pontos em relação ao início do período.`
      : "Seu V-Score se manteve relativamente estável em relação ao início do período.";

  const executiveConclusionText =
    narrativeMode === "improving"
      ? "Seu período apresentou sinais consistentes de recuperação de resiliência, com melhora progressiva do V-Score e maior impacto ainda concentrado em sistemas cardiovascular e cognitivo. A principal oportunidade agora está em sustentar sua capacidade de recuperação, manter a qualidade do sono e evitar nova sobrecarga acumulada. Continue monitorando para consolidar essa evolução no próximo período."
      : narrativeMode === "declining"
      ? "Seu período apresentou sinais consistentes de queda moderada de resiliência, com maior impacto cardiovascular e cognitivo. A principal oportunidade está em restaurar sua capacidade de recuperação, melhorar a qualidade do sono e gerenciar a carga acumulada. Continue monitorando para acompanhar sua evolução no próximo período."
      : "Seu período apresentou relativa estabilidade de resiliência, com sinais ainda concentrados em sistemas cardiovascular e cognitivo. A principal oportunidade está em manter a qualidade da recuperação, preservar o sono e acompanhar possíveis oscilações antes que se tornem persistentes. Continue monitorando para validar essa consistência no próximo período.";

  const benchmarkSummaryText =
    report.avg_v_score >= 85
      ? "Seu V-Score está acima da média da faixa etária e já dentro da sua meta pessoal."
      : report.avg_v_score >= 72.3
      ? "Seu V-Score está acima da média da faixa etária, mas ainda abaixo da sua meta pessoal."
      : "Seu V-Score ainda está abaixo da média da faixa etária e da sua meta pessoal, indicando espaço relevante para evolução.";

  const benchmarkTarget = 85.1;
  const benchmarkAverage = 72.3;

  const benchmarkData = [
    { label: "Sua média", shortLabel: "Sua média", value: Number(report?.avg_v_score ?? 0), fill: "#22d3ee" },
    { label: "Média da faixa etária", shortLabel: "Faixa etária", value: benchmarkAverage, fill: "#94a3b8" },
    { label: "Sua meta", shortLabel: "Sua meta", value: benchmarkTarget, fill: "#34d399" },
  ];

  const areaImpactData = getCompactAreaData(report?.top_areas || []);

  const longevityRows = [
    {
      label: "+3% HRV (6 meses)",
      tone: "text-emerald-400",
      path: longevitySparkline([10, 9, 12, 16, 13, 14, 12, 15, 14, 17]),
      stroke: "#34d399",
    },
    {
      label: "-2% FC Repouso (6 meses)",
      tone: "text-rose-400",
      path: longevitySparkline([14, 13, 15, 12, 11, 13, 12, 14, 13, 12]),
      stroke: "#f43f5e",
    },
  ];

  return (
    <div className="min-h-screen bg-[#050505]">
      

      <div className="w-full max-w-[1460px] mx-auto px-4 sm:px-6 lg:px-8 py-7 sm:py-8">
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6 mb-7">
          <div>
            {refreshing && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 text-cyan-300 text-xs font-semibold mb-4">
                <div className="w-3 h-3 border border-cyan-300 border-t-transparent rounded-full animate-spin" />
                Atualizando relatório...
              </div>
            )}

            <div className="flex items-center gap-3 flex-wrap max-w-5xl">
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white" data-testid="report-title">
                Relatório Executivo de Resiliência
              </h1>
              <span className="px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-sm font-semibold">
                {PERIOD_LABELS[period]}
              </span>
            </div>

            <p className="text-neutral-400 text-base sm:text-lg mt-2">
              Visão consolidada da sua saúde e performance
            </p>

            <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500 mt-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                <span>
                  Período analisado: {orderedTrend[0]?.date || "--"} a {orderedTrend[orderedTrend.length - 1]?.date || "--"} ({orderedTrend.length} dias)
                </span>
              </div>
              <span className="hidden sm:inline text-neutral-700">|</span>
              <div>Gerado em: {generatedAtLabel}</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 xl:justify-end">
            <div className="flex bg-[#0b0d0f] rounded-2xl border border-white/[0.07] p-1" data-testid="period-filter">
              {PERIOD_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPeriod(opt.value)}
                  data-testid={`period-${opt.value}`}
                  className={`px-5 py-3 text-sm font-semibold rounded-xl transition-all ${
                    period === opt.value
                      ? "bg-cyan-500 text-black"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <button
              onClick={handleExportPdf}
              disabled={exporting || !hasData}
              data-testid="export-pdf-btn"
              className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-sm font-bold transition-all ${
                canExportPdf
                  ? "bg-cyan-500 hover:bg-cyan-400 text-black"
                  : "bg-neutral-800 text-neutral-500 border border-white/[0.07]"
              }`}
            >
              {canExportPdf ? (
                <>
                  <Download className="w-4 h-4" />
                  {exporting ? "Gerando..." : "Exportar PDF"}
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  PDF Premium
                </>
              )}
            </button>
          </div>
        </div>

        {loading && !report ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !hasData ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20"
            data-testid="report-empty-state"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4"
            >
              <Radio className="w-8 h-8 text-cyan-400/60" />
            </motion.div>
            <p className="text-neutral-300 font-semibold text-base mb-1">Sem dados no período</p>
            <p className="text-neutral-500 text-sm text-center max-w-sm mb-4">
              {hasDevices
                ? "Aguardando sincronização. Seus dados aparecerão aqui em breve."
                : "Conecte um dispositivo e comece a monitorar para gerar seu relatório personalizado."}
            </p>
            {!hasDevices && (
              <button
                onClick={() => navigate("/devices")}
                className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-sm font-semibold rounded-2xl transition-all"
                data-testid="report-connect-btn"
              >
                <Smartphone className="w-4 h-4" />
                Conectar dispositivo
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-[1.7fr_0.9fr] gap-5">
              <div className="border border-cyan-500/20 bg-cyan-500/[0.04] rounded-2xl px-3 py-5 sm:p-6">
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.15fr] gap-5 items-stretch h-full">
                  <div className="flex items-start">
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.22em] text-cyan-300 font-bold mb-3">
                        Resumo Executivo
                      </p>
                      <p className="text-white text-lg sm:text-[1.95rem] leading-tight font-semibold">
                        <span className={trendDirectionTone}>{executiveSummaryLead}</span>, com V-Score médio de{" "}
                        <span className="text-cyan-400">{report.avg_v_score}</span> e maior impacto fisiológico em{" "}
                        <span className="text-white">{topAreasSummary}</span>.
                      </p>
                      <p className="text-sm text-neutral-400 mt-5">
                        Cobertura do período: {coverageLabel}.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="border border-white/[0.07] bg-white/[0.025] rounded-2xl p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
                      <div className="flex items-center gap-2 mb-2">
                        <Gauge className="w-4 h-4 text-amber-400" />
                        <span className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">Status geral</span>
                      </div>
                      <p className={`text-sm font-semibold ${trendDirectionTone}`}>{trendDirectionLabel}</p>
                      <p className="text-xs text-neutral-500 mt-2">{executiveRecoveryLabel}</p>
                    </div>

                    <div className="border border-white/[0.07] bg-white/[0.025] rounded-2xl p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
                      <div className="flex items-center gap-2 mb-2">
                        <HeartPulse className="w-4 h-4 text-rose-400" />
                        <span className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">Principal risco</span>
                      </div>
                      <p className="text-sm font-semibold leading-snug text-rose-300">{executiveCauseLabel}</p>
                      <p className="text-xs text-neutral-500 mt-2">Sinais consistentes de sobrecarga</p>
                    </div>

                    <div className="border border-white/[0.07] bg-white/[0.025] rounded-2xl p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <span className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">Provável causa</span>
                      </div>
                      <p className="text-sm font-semibold leading-snug text-purple-300">
                        Baixa recuperação + esforço acumulado
                      </p>
                      <p className="text-xs text-neutral-500 mt-2">Sono irregular e carga acumulada elevada</p>
                    </div>

                    <div className="border border-white/[0.07] bg-white/[0.025] rounded-2xl p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-4 h-4 text-emerald-400" />
                        <span className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">Nível de confiança</span>
                      </div>
                      <p className="text-3xl font-black text-emerald-300">{confidenceScore}%</p>
                      <p className="text-xs text-neutral-500 mt-2">{confidenceLabel}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border border-white/[0.07] bg-[#0b0d0f] rounded-2xl p-5 sm:p-6">
                <p className="text-xs uppercase tracking-[0.22em] text-neutral-300 font-bold mb-5">
                  Interpretação do período
                </p>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                      <TrendingUp className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{interpretationTitle}</p>
                      <p className="text-xs text-neutral-400 mt-1">
                        {interpretationDescription}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                      <HeartPulse className="w-4 h-4 text-rose-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Impacto cardiovascular relevante</p>
                      <p className="text-xs text-neutral-400 mt-1">
                        Sinais de sobrecarga do sistema cardiovascular foram predominantes.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                      <Brain className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Fadiga cognitiva elevada</p>
                      <p className="text-xs text-neutral-400 mt-1">
                        Indicadores de esforço mental ficaram acima do ideal para sua rotina atual.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                      <Moon className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Recuperação inconsistente</p>
                      <p className="text-xs text-neutral-400 mt-1">
                        Sono irregular e variabilidade reduzida afetam sua capacidade de recuperação.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">
              {[
                {
                  label: "Leituras Válidas",
                  value: report.total_analyses,
                  icon: FileText,
                  color: "text-cyan-400",
                  helper: "base biométrica analisada",
                },
                {
                  label: "V-Score Médio",
                  value: report.avg_v_score,
                  icon: Activity,
                  color: report.avg_v_score >= 80 ? "text-emerald-400" : report.avg_v_score >= 60 ? "text-amber-400" : "text-rose-400",
                  helper: `${trendDelta > 0 ? "+" : ""}${trendDelta || 0} vs início do período`,
                },
                {
                  label: "Cobertura do Período",
                  value: coveragePercent !== null ? `${coveragePercent}%` : orderedTrend.length,
                  icon: Calendar,
                  color: "text-cyan-400",
                  helper: coveragePercent !== null ? `de ${period === "7d" ? 7 : period === "30d" ? 30 : orderedTrend.length} dias válidos` : coverageLabel,
                },
                {
                  label: "Dias Monitorados",
                  value: orderedTrend.length,
                  icon: Calendar,
                  color: "text-purple-400",
                  helper: "base suficiente para análise",
                },
                {
                  label: "Melhor Dia",
                  value: bestDayLabel,
                  icon: TrendingUp,
                  color: "text-emerald-400",
                  helper: bestTrendPoint ? `V-Score ${bestTrendPoint.avg_v_score}` : "sem destaque",
                },
                {
                  label: "Pior Dia",
                  value: worstDayLabel,
                  icon: TrendingUp,
                  color: "text-rose-400",
                  helper: worstTrendPoint ? `V-Score ${worstTrendPoint.avg_v_score}` : "sem destaque",
                },
              ].map((kpi) => (
                <motion.div
                  key={kpi.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-white/[0.07] bg-[#0b0d0f] rounded-2xl px-3 py-5 min-h-[220px] flex flex-col"
                  data-testid={`kpi-${kpi.label.toLowerCase().replace(/ /g, "-")}`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                    <span className="text-xs text-neutral-500 uppercase tracking-[0.16em]">{kpi.label}</span>
                  </div>
                  <p className={`text-4xl sm:text-[2.45rem] leading-none font-mono font-black ${kpi.color}`}>
                    {kpi.value}
                  </p>
                  <p className="text-sm text-neutral-500 mt-4 leading-relaxed">{kpi.helper}</p>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1.65fr_0.95fr_0.9fr] gap-5 items-stretch">
              <div className="border border-white/[0.07] bg-[#0b0d0f] rounded-2xl p-5 sm:p-6" data-testid="trend-chart">
                <h3 className="text-xs font-bold uppercase tracking-[0.22em] text-neutral-300 mb-5 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  Evolução do V-Score
                </h3>
                <div className="w-full h-[430px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendChartData} margin={{ top: 28, right: 28, left: -8, bottom: 40 }}>
                      <defs>
                        <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.28} />
                          <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.045)" vertical={false} />
                      <XAxis
                        dataKey="date"
                        stroke="rgba(255,255,255,0.28)"
                        tickLine={false}
                        axisLine={{ stroke: "rgba(255,255,255,0.14)" }}
                        style={{ fontSize: "11px" }}
                        tickMargin={10}
                        tickFormatter={formatDateLabel}
                      />
                      <YAxis
                        domain={[0, 100]}
                        stroke="rgba(255,255,255,0.28)"
                        tickLine={false}
                        axisLine={false}
                        style={{ fontSize: "11px" }}
                        tickMargin={10}
                      />
                      <Tooltip
  cursor={{ fill: "transparent" }}
  cursor={{ fill: "transparent" }}
  content={<ReportTrendTooltip />}
/>
                      <ReferenceLine
                        y={avgReferenceValue}
                        stroke="rgba(255,255,255,0.16)"
                        strokeDasharray="5 5"
                        label={{
                          value: "Média",
                          position: "insideTopRight",
                          fill: "rgba(255,255,255,0.42)",
                          fontSize: 11,
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="avg_v_score"
                        stroke="#2dd4f0"
                        strokeWidth={3.5}
                        fill="url(#trendGrad)"
                        dot={<TrendDot />}
                        activeDot={{ r: 7, stroke: "#0a0a0a", strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="border border-white/[0.07] bg-[#0b0d0f] rounded-2xl p-5 sm:p-6" data-testid="distribution-chart">
                <h3 className="text-xs font-bold uppercase tracking-[0.22em] text-neutral-300 mb-5 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  Distribuição do Período
                </h3>
                <div className="grid grid-cols-1 gap-4 items-center">
                  <div className="w-full h-48 relative flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} innerRadius={54} outerRadius={76} dataKey="value" stroke="none">
                          {pieData.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#171717",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-4xl font-black text-white">{dominantDistributionPercent}%</span>
                      <span className="text-sm text-neutral-400 mt-1">
                        {dominantDistribution?.tone || "Sem dados"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {pieData.map((item, index) => {
                      const percent = totalDistribution > 0
                        ? Math.round((Number(item.value || 0) / totalDistribution) * 100)
                        : 0;

                      const toneClass =
                        index === 0 ? "text-emerald-400" :
                        index === 1 ? "text-amber-400" :
                        "text-rose-400";

                      const dotClass =
                        index === 0 ? "bg-emerald-400" :
                        index === 1 ? "bg-amber-400" :
                        "bg-rose-400";

                      return (
                        <div key={item.name} className="flex items-start gap-3">
                          <div className={`w-3 h-3 rounded-full mt-1.5 ${dotClass}`} />
                          <div>
                            <p className={`text-lg font-bold ${toneClass}`}>
                              {percent}% {item.tone}
                            </p>
                            <p className="text-sm text-neutral-500">{item.helper}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="border border-white/[0.07] bg-[#0b0d0f] rounded-2xl p-5 sm:p-6">
                <h3 className="text-xs font-bold uppercase tracking-[0.22em] text-neutral-300 mb-5 flex items-center gap-2">
                  <Target className="w-4 h-4 text-cyan-400" />
                  Comparativo de Performance (Benchmark)
                </h3>
                <div className="w-full h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={benchmarkData} margin={{ top: 8, right: 0, left: -24, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis
                        dataKey="shortLabel"
                        stroke="rgba(255,255,255,0.32)"
                        tickLine={false}
                        axisLine={{ stroke: "rgba(255,255,255,0.12)" }}
                        style={{ fontSize: "11px" }}
                      />
                      <YAxis
                        domain={[0, 100]}
                        stroke="rgba(255,255,255,0.28)"
                        tickLine={false}
                        axisLine={false}
                        style={{ fontSize: "11px" }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#171717",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                      />
                      <ReferenceLine
                        y={benchmarkTarget}
                        stroke="rgba(52,211,153,0.35)"
                        strokeDasharray="5 5"
                        label={{
                          value: "Meta",
                          position: "insideTopRight",
                          fill: "rgba(52,211,153,0.75)",
                          fontSize: 11,
                        }}
                      />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={42}>
                        {benchmarkData.map((entry) => (
                          <Cell key={entry.label} fill={entry.fill} />
                        ))}
                        <LabelList dataKey="value" position="top" fill="rgba(255,255,255,0.9)" fontSize={12} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-sm text-neutral-500 mt-2">
                  {benchmarkSummaryText}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr_0.9fr_1fr] gap-5 items-stretch">
              <div className="border border-white/[0.07] bg-[#0b0d0f] rounded-2xl p-6">
                <h3 className="text-xs font-bold uppercase tracking-[0.22em] text-neutral-300 mb-5 flex items-center gap-2">
                  <HeartPulse className="w-4 h-4 text-cyan-400" />
                  Sistemas mais impactados
                </h3>
                <div className="space-y-5">
                  {areaImpactData.map((item) => (
                    <div key={item.area}>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-neutral-300">{item.area}</span>
                        <span className="text-neutral-400">{item.status}</span>
                      </div>
                      <div className="h-3 rounded-full bg-[#050505]/70 overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${item.color}`}
                          style={{ width: `${item.percent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-white/[0.07] bg-[#0b0d0f] rounded-2xl p-6">
                <h3 className="text-xs font-bold uppercase tracking-[0.22em] text-neutral-300 mb-5">
                  Comparativo do período
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm border-b border-white/5 pb-3">
                    <span className="text-neutral-400">Vs início do período</span>
                    <span className="font-bold text-rose-300">{trendDelta ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm border-b border-white/5 pb-3">
                    <span className="text-neutral-400">Vs melhor leitura</span>
                    <span className="font-bold text-rose-300">
                      {bestTrendPoint ? Number((report.avg_v_score - bestTrendPoint.avg_v_score).toFixed(1)) : 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-400">Vs sua média pessoal</span>
                    <span className="font-bold text-amber-300">
                      {report.avg_v_score ? `${Math.round(((report.avg_v_score - 83) / 83) * 100)}%` : "0%"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border border-white/[0.07] bg-[#0b0d0f] rounded-2xl p-6">
                <h3 className="text-xs font-bold uppercase tracking-[0.22em] text-neutral-300 mb-5">
                  Confiabilidade da análise
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm border-b border-white/5 pb-3">
                    <span className="text-neutral-400">Cobertura biométrica</span>
                    <span className="font-bold text-emerald-300">Alta</span>
                  </div>
                  <div className="flex items-center justify-between text-sm border-b border-white/5 pb-3">
                    <span className="text-neutral-400">Qualidade dos sinais</span>
                    <span className="font-bold text-emerald-300">Boa</span>
                  </div>
                  <div className="flex items-center justify-between text-sm border-b border-white/5 pb-3">
                    <span className="text-neutral-400">Janela de sono</span>
                    <span className="font-bold text-amber-300">Incompleta</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-400">Confiança</span>
                    <span className="font-bold text-cyan-300">{confidenceScore}%</span>
                  </div>
                </div>
              </div>

              <div className="border border-white/[0.07] bg-[#0b0d0f] rounded-2xl p-6">
                <h3 className="text-xs font-bold uppercase tracking-[0.22em] text-neutral-300 mb-5">
                  Insights de longevidade
                </h3>
                <div className="space-y-5">
                  {longevityRows.map((row) => (
                    <div key={row.label} className="flex items-center justify-between gap-4">
                      <div>
                        <p className={`text-3xl font-black ${row.tone}`}>{row.label.split(" ")[0]}</p>
                        <p className="text-lg text-neutral-300">{row.label.replace(`${row.label.split(" ")[0]} `, "")}</p>
                      </div>
                      <svg viewBox="0 0 100 24" className="w-24 h-8 shrink-0">
                        <path d={row.path} fill="none" stroke={row.stroke} strokeWidth="2.5" strokeLinecap="round" />
                      </svg>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1.45fr_0.4fr] gap-5">
              <div className="border border-cyan-500/20 bg-cyan-500/[0.04] rounded-2xl p-6">
                <h3 className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300 mb-4">
                  Conclusão executiva
                </h3>
                <p className="text-lg leading-[1.7] text-neutral-200 max-w-5xl">
                  {executiveConclusionText}
                </p>
              </div>

              <div className="border border-emerald-500/20 bg-emerald-500/[0.04] rounded-2xl p-5 sm:p-6">
                <h3 className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-300 mb-4">
                  Próximo período
                </h3>
                <p className="text-sm leading-relaxed text-neutral-300">
                  Continue monitorando para acompanhar sua evolução.
                </p>
              </div>
            </div>

            <div className="border border-white/[0.07] bg-[#0b0d0f]/30 rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-1">
              <p className="text-xs text-neutral-500">
                Este relatório foi gerado com base em dados biométricos coletados pelos seus dispositivos e algoritmos proprietários da VitalFlow.
              </p>
              <p className="text-xs text-neutral-600">
                Gerado em {generatedAtLabel}
              </p>
            </div>

            {!canExportPdf && (
              <div className="border border-amber-500/30 bg-amber-500/5 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-amber-400" />
                  <div>
                    <p className="text-sm font-semibold text-amber-400">Exportar PDF é exclusivo do Plano Premium</p>
                    <p className="text-xs text-neutral-400">Faça upgrade para baixar seus relatórios completos</p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MeuRelatorio;

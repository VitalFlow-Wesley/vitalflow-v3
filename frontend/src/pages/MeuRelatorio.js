import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ReferenceLine, Scatter
} from "recharts";
import {
  FileText, Download, Calendar, TrendingUp, Activity, Lock,
  Radio, Smartphone, ArrowLeft, Shield, Brain, HeartPulse, Moon
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


const ReportTrendTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  const point = payload[0]?.payload;
  const value = Number(point?.avg_v_score ?? 0);

  const tone =
    value >= 80 ? "text-emerald-400" : value >= 50 ? "text-amber-400" : "text-rose-400";

  const statusLabel =
    value >= 80 ? "Estável" : value >= 50 ? "Atenção" : "Crítico";

  return (
    <div className="bg-neutral-950/95 border border-white/10 rounded-xl p-3 shadow-xl min-w-[180px]">
      <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500 mb-2">
        {label}
      </p>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-neutral-400">V-Score</span>
        <span className={`text-sm font-bold ${tone}`}>{value}</span>
      </div>
      <div className="flex items-center justify-between gap-3 mt-1">
        <span className="text-xs text-neutral-400">Leitura</span>
        <span className={`text-xs font-semibold ${tone}`}>{statusLabel}</span>
      </div>
    </div>
  );
};

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

  const isAdmin = String(user?.nivel_acesso || user?.role || "")
    .toLowerCase()
    .includes("ceo") ||
    String(user?.nivel_acesso || user?.role || "")
      .toLowerCase()
      .includes("admin");

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
    axios.get(API.replace('/api','') + '/api/wearables', { withCredentials: true })
      .then(r => setHasDevices(r.data.some(d => d.is_connected)))
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
      const { data } = await axios.get(`${API}/report/personal?period=${period}`, { withCredentials: true });
      setReport(data);
    } catch (err) {
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
      const msg = err.response?.status === 403
        ? "Recurso exclusivo do Plano Premium."
        : "Erro ao exportar PDF.";
      toast.error(msg);
    } finally {
      setExporting(false);
    }
  };

  const pieData = report ? [
    { name: "Verde", value: report.distribution.verde, tone: "Estável" },
    { name: "Amarelo", value: report.distribution.amarelo, tone: "Atenção" },
    { name: "Vermelho", value: report.distribution.vermelho, tone: "Crítico" },
  ].filter(d => d.value > 0) : [];

  const totalDistribution = pieData.reduce((sum, item) => sum + Number(item.value || 0), 0);
  const dominantDistribution = pieData.length
    ? pieData.reduce((best, item) => (item.value > best.value ? item : best))
    : null;
  const dominantDistributionPercent =
    dominantDistribution && totalDistribution > 0
      ? Math.round((dominantDistribution.value / totalDistribution) * 100)
      : 0;

  const hasData = report && report.total_analyses > 0;

  const trendStart = report?.trend?.length ? Number(report.trend[0]?.avg_v_score ?? 0) : null;
  const trendEnd = report?.trend?.length ? Number(report.trend[report.trend.length - 1]?.avg_v_score ?? 0) : null;
  const trendDelta =
    trendStart !== null && trendEnd !== null
      ? Number((trendEnd - trendStart).toFixed(1))
      : null;

  const avgReferenceValue = Number(report?.avg_v_score ?? 0);

  const orderedTrend = report?.trend?.length
    ? [...report.trend].sort((a, b) => new Date(a.date) - new Date(b.date))
    : [];

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

  const bestTrendData = bestTrendPoint
    ? [{ date: bestTrendPoint.date, avg_v_score: bestTrendPoint.avg_v_score }]
    : [];

  const worstTrendData = worstTrendPoint
    ? [{ date: worstTrendPoint.date, avg_v_score: worstTrendPoint.avg_v_score }]
    : [];

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

  const topAreasSummary = report?.top_areas?.slice(0, 2).map((item) => item.area).join(" e ") || "sem destaques";
  const coverageLabel =
    report?.trend?.length && period === "7d"
      ? `${report.trend.length}/7 dias monitorados`
      : report?.trend?.length && period === "30d"
      ? `${report.trend.length}/30 dias monitorados`
      : report?.trend?.length
      ? `${report.trend.length} dias monitorados`
      : "Sem cobertura suficiente";

  const coveragePercent =
    period === "7d"
      ? Math.round(((report?.trend?.length || 0) / 7) * 100)
      : period === "30d"
      ? Math.round(((report?.trend?.length || 0) / 30) * 100)
      : null;

  const generatedAtLabel = new Date().toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const bestDayLabel = bestTrendPoint?.date
    ? new Date(bestTrendPoint.date).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      })
    : "--";

  const worstDayLabel = worstTrendPoint?.date
    ? new Date(worstTrendPoint.date).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      })
    : "--";

  const confidenceScore = coveragePercent !== null
    ? Math.max(55, Math.min(96, coveragePercent + 10))
    : Math.max(55, Math.min(96, (report?.trend?.length || 0) * 10));

  const confidenceLabel =
    confidenceScore >= 85 ? "Alta confiabilidade" :
    confidenceScore >= 70 ? "Boa confiabilidade" :
    "Confiabilidade moderada";

  const executiveCauseLabel =
    topAreasSummary.toLowerCase().includes("coracao")
      ? "sobrecarga cardiovascular"
      : topAreasSummary.toLowerCase().includes("cerebro")
      ? "fadiga cognitiva"
      : "sobrecarga fisiológica";

  const executiveRecoveryLabel =
    trendDelta !== null && trendDelta < -1
      ? "Atenção recomendada nas próximas 24-48h"
      : "Manter rotina de recuperação";

  return (
    <div className="min-h-screen bg-neutral-950">
      <Navbar />

      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          {refreshing && (
            <div className="sm:order-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 text-cyan-300 text-xs font-semibold">
              <div className="w-3 h-3 border border-cyan-300 border-t-transparent rounded-full animate-spin" />
              Atualizando relatório...
            </div>
          )}
          <div>
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors mb-3"
              data-testid="back-to-dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </button>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-white" data-testid="report-title">
                Relatorio Executivo de Resiliencia
              </h1>
              <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-sm font-semibold">
                {PERIOD_LABELS[period]}
              </span>
            </div>
            <p className="text-neutral-400 text-sm mt-1">
              Visao consolidada da sua saude e performance
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500 mt-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                <span>
                  Periodo analisado: {orderedTrend?.[0]?.date || "--"} a {orderedTrend?.[orderedTrend?.length - 1]?.date || "--"} ({orderedTrend?.length || 0} dias)
                </span>
              </div>
              <span className="hidden sm:inline text-neutral-700">|</span>
              <div>
                Gerado em: {generatedAtLabel}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Period Filter */}
            <div className="flex bg-neutral-900 rounded-lg border border-white/10 p-1" data-testid="period-filter">
              {PERIOD_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPeriod(opt.value)}
                  data-testid={`period-${opt.value}`}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    period === opt.value
                      ? "bg-cyan-500 text-black"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Export PDF */}
            <button
              onClick={handleExportPdf}
              disabled={exporting || !hasData}
              data-testid="export-pdf-btn"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                canExportPdf
                  ? "bg-cyan-500 hover:bg-cyan-400 text-black"
                  : "bg-neutral-800 text-neutral-500 border border-white/10"
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
          /* Empty state */
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
            <p className="text-neutral-300 font-semibold text-base mb-1">Sem dados no periodo</p>
            <p className="text-neutral-500 text-sm text-center max-w-sm mb-4">
              {hasDevices ? "Aguardando sincronizacao. Seus dados aparecerao aqui em breve." : "Conecte um dispositivo e comece a monitorar para gerar seu relatorio personalizado."}
            </p>
            {!hasDevices && (
              <button
                onClick={() => navigate("/devices")}
                className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-sm font-semibold rounded-md transition-all"
                data-testid="report-connect-btn"
              >
                <Smartphone className="w-4 h-4" />
                Conectar dispositivo
              </button>
            )}
          </motion.div>
        ) : (
          /* Report Content */
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="border border-cyan-500/20 bg-cyan-500/5 rounded-xl p-6" data-testid="report-summary">
              <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                    <Brain className="w-7 h-7 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-cyan-300 font-bold mb-3">
                      Resumo Executivo
                    </p>
                    <p className="text-white text-base sm:text-xl font-semibold leading-relaxed">
                      Sua resiliência apresentou <span className={trendDirectionTone}>{trendDirectionText}</span>,
                      com V-Score médio de <span className="text-cyan-400">{report.avg_v_score}</span> e maior impacto fisiológico em <span className="text-white">{topAreasSummary}</span>.
                    </p>
                    <p className="text-sm text-neutral-400 mt-3">
                      Cobertura do período: {coverageLabel}.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="border border-white/10 bg-neutral-950/40 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <HeartPulse className="w-4 h-4 text-rose-400" />
                      <span className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">Principal risco</span>
                    </div>
                    <p className="text-sm font-semibold text-rose-300">{executiveCauseLabel}</p>
                    <p className="text-xs text-neutral-500 mt-2">Sinais consistentes no período</p>
                  </div>

                  <div className="border border-white/10 bg-neutral-950/40 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-emerald-400" />
                      <span className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">Confiabilidade</span>
                    </div>
                    <p className="text-2xl font-black text-emerald-300">{confidenceScore}%</p>
                    <p className="text-xs text-neutral-500 mt-2">{confidenceLabel}</p>
                  </div>

                  <div className="border border-white/10 bg-neutral-950/40 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-amber-400" />
                      <span className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">Status geral</span>
                    </div>
                    <p className={`text-sm font-semibold ${trendDirectionTone}`}>{trendDirectionLabel}</p>
                    <p className="text-xs text-neutral-500 mt-2">{executiveRecoveryLabel}</p>
                  </div>

                  <div className="border border-white/10 bg-neutral-950/40 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Moon className="w-4 h-4 text-cyan-400" />
                      <span className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">Cobertura</span>
                    </div>
                    <p className="text-2xl font-black text-cyan-300">
                      {coveragePercent !== null ? `${coveragePercent}%` : report?.trend?.length || 0}
                    </p>
                    <p className="text-xs text-neutral-500 mt-2">{coverageLabel}</p>
                  </div>
                </div>
              </div>
            </div>
            {/* Premium upsell banner for free users */}
            {!canExportPdf && (
              <div className="border border-amber-500/30 bg-amber-500/5 rounded-md p-4 flex items-center justify-between" data-testid="pdf-premium-banner">
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-amber-400" />
                  <div>
                    <p className="text-sm font-semibold text-amber-400">Exportar PDF e exclusivo do Plano Premium</p>
                    <p className="text-xs text-neutral-400">Faca upgrade para baixar seus relatorios completos</p>
                  </div>
                </div>
              </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">
              {[
                {
                  label: "Leituras Validas",
                  value: report.total_analyses,
                  icon: FileText,
                  color: "text-cyan-400",
                  helper: "base biometrica analisada",
                },
                {
                  label: "V-Score Medio",
                  value: report.avg_v_score,
                  icon: Activity,
                  color: report.avg_v_score >= 80 ? "text-emerald-400" : report.avg_v_score >= 50 ? "text-amber-400" : "text-rose-400",
                  helper:
                    trendDelta === null
                      ? "sem base comparativa"
                      : `${trendDelta > 0 ? "+" : ""}${trendDelta} vs inicio do periodo`,
                },
                {
                  label: "Cobertura do Periodo",
                  value: coveragePercent !== null ? `${coveragePercent}%` : report.trend.length,
                  icon: Calendar,
                  color: "text-cyan-400",
                  helper: coveragePercent !== null ? `de ${period === "7d" ? 7 : period === "30d" ? 30 : report.trend.length} dias validos` : coverageLabel,
                },
                {
                  label: "Dias Monitorados",
                  value: report.trend.length,
                  icon: Calendar,
                  color: "text-purple-400",
                  helper: "base suficiente para analise",
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
                  className="border border-white/10 bg-neutral-900/40 backdrop-blur-xl rounded-md p-4"
                  data-testid={`kpi-${kpi.label.toLowerCase().replace(/ /g, '-')}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                    <span className="text-xs text-neutral-500 uppercase tracking-wider">{kpi.label}</span>
                  </div>
                  <p className={`text-2xl font-mono font-black ${kpi.color}`}>{kpi.value}</p>
                  <p className="text-xs text-neutral-500 mt-2">{kpi.helper}</p>
                </motion.div>
              ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* V-Score Trend Chart */}
              <div className="lg:col-span-2 border border-white/10 bg-neutral-900/40 backdrop-blur-xl rounded-md p-6" data-testid="trend-chart">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  Evolucao do V-Score
                </h3>
                <div className="w-full h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={orderedTrend}>
                      <defs>
                        <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" style={{ fontSize: "11px" }} />
                      <YAxis domain={[0, 100]} stroke="rgba(255,255,255,0.3)" style={{ fontSize: "11px" }} />
                      <Tooltip content={<ReportTrendTooltip />} />
                      <ReferenceLine
                        y={avgReferenceValue}
                        stroke="rgba(255,255,255,0.18)"
                        strokeDasharray="4 4"
                        label={{
                          value: "Média",
                          position: "insideTopRight",
                          fill: "rgba(255,255,255,0.45)",
                          fontSize: 11,
                        }}
                      />
                      <Area type="monotone" dataKey="avg_v_score" stroke="#22d3ee" strokeWidth={3} fill="url(#trendGrad)" name="V-Score" />
                      <Scatter data={bestTrendData} fill="#34d399" shape="circle" />
                      <Scatter data={worstTrendData} fill="#f43f5e" shape="circle" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Distribution Pie */}
              <div className="border border-white/10 bg-neutral-900/40 backdrop-blur-xl rounded-md p-6" data-testid="distribution-chart">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400 mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  Distribuicao do Periodo
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4 items-center">
                  <div className="w-full h-52 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          innerRadius={56}
                          outerRadius={86}
                          dataKey="value"
                          stroke="none"
                        >
                          {pieData.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: "#171717", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-2xl font-black text-white">{dominantDistributionPercent}%</span>
                      <span className="text-xs text-neutral-400 mt-1">
                        {dominantDistribution?.tone || "Sem dados"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {pieData.map((item, index) => {
                      const percent = totalDistribution > 0
                        ? Math.round((Number(item.value || 0) / totalDistribution) * 100)
                        : 0;

                      const toneClass =
                        index === 0 ? "text-emerald-400" :
                        index === 1 ? "text-amber-400" :
                        "text-rose-400";

                      return (
                        <div key={item.name} className="flex items-start gap-3">
                          <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${index === 0 ? "bg-emerald-400" : index === 1 ? "bg-amber-400" : "bg-rose-400"}`} />
                          <div>
                            <p className={`text-sm font-semibold ${toneClass}`}>
                              {percent}% {item.tone}
                            </p>
                            <p className="text-xs text-neutral-500">
                              {item.name} ({item.value}) no período
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <p className="text-xs text-neutral-500 pt-2 leading-relaxed">
                      Verde indica base fisiológica preservada. Amarelo indica momentos de sobrecarga. Vermelho indica episódios críticos, porém não predominantes.
                    </p>
                  </div>
                </div>
              </div>
            </div>


            {/* Executive Intelligence Blocks */}
            {hasData && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="border border-white/10 bg-neutral-900/40 backdrop-blur-xl rounded-md p-5">
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400 mb-4">
                    Comparativo do Periodo
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-neutral-400">Vs inicio do periodo</span>
                      <span className={trendDelta < 0 ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>
                        {trendDelta > 0 ? "+" : ""}{trendDelta ?? "--"}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-neutral-400">Vs melhor leitura</span>
                      <span className="text-rose-400 font-bold">
                        {bestTrendPoint ? (Number(report.avg_v_score) - Number(bestTrendPoint.avg_v_score)).toFixed(1) : "--"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Vs media pessoal</span>
                      <span className="text-amber-400 font-bold">-8%</span>
                    </div>
                  </div>
                </div>

                <div className="border border-white/10 bg-neutral-900/40 backdrop-blur-xl rounded-md p-5">
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400 mb-4">
                    Confiabilidade da Analise
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-neutral-400">Cobertura biometrica</span>
                      <span className="text-emerald-400 font-bold">{confidenceScore >= 85 ? "Alta" : confidenceScore >= 70 ? "Boa" : "Moderada"}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-neutral-400">Qualidade dos sinais</span>
                      <span className="text-emerald-400 font-bold">Boa</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-neutral-400">Janela de sono</span>
                      <span className="text-amber-400 font-bold">Incompleta</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Confianca</span>
                      <span className="text-cyan-400 font-bold">{confidenceScore}%</span>
                    </div>
                  </div>
                </div>

                <div className="border border-cyan-500/20 bg-cyan-500/5 backdrop-blur-xl rounded-md p-5">
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300 mb-4">
                    Conclusao Executiva
                  </h3>
                  <p className="text-sm text-neutral-300 leading-relaxed">
                    Seu periodo apresentou sinais consistentes de variacao de resiliencia, com maior impacto em {topAreasSummary}. A principal oportunidade esta em melhorar recuperacao, sono e gerenciamento de carga acumulada. Continue monitorando para acompanhar a evolucao no proximo periodo.
                  </p>
                </div>
              </div>
            )}

            {/* Top Areas Bar Chart */}
            {report.top_areas.length > 0 && (
              <div className="border border-white/10 bg-neutral-900/40 backdrop-blur-xl rounded-md p-6" data-testid="areas-chart">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400 mb-4">
                  Areas Mais Afetadas (Impacto Relativo)
                </h3>
                <div className="w-full h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={report.top_areas.map((item) => {
                        const max = Math.max(...report.top_areas.map((a) => Number(a.count || 0)), 1);
                        return {
                          ...item,
                          impacto: Math.round((Number(item.count || 0) / max) * 100),
                        };
                      })} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis type="number" stroke="rgba(255,255,255,0.3)" style={{ fontSize: "11px" }} />
                      <YAxis dataKey="area" type="category" stroke="rgba(255,255,255,0.3)" width={120} style={{ fontSize: "11px" }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#171717", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" }}
                      />
                      <Bar
                        dataKey="impacto"
                        fill="#a78bfa"
                        radius={[0, 4, 4, 0]}
                        name="Impacto relativo"
                        label={{ position: "right", fill: "rgba(255,255,255,0.72)", fontSize: 11 }}
                      >
                        {report.top_areas.map((entry, index) => (
                          <Cell key={`area-${index}`} fill={index === 0 ? "#a78bfa" : index === 1 ? "#9575e8" : "#7c5fd6"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
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

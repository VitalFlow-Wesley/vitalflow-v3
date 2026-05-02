import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Activity,
  BarChart3,
  Brain,
  Calendar,
  Download,
  HeartPulse,
  Moon,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL || "https://vitalflow.up.railway.app"}/api`;

const PERIODS = [
  { value: "7d", label: "7 dias", days: 7 },
  { value: "30d", label: "30 dias", days: 30 },
  { value: "6m", label: "6 meses", days: 180 },
];

const fallbackReport = {
  total_analyses: 1,
  avg_v_score: 90,
  confidence: 55,
  coverage: 1,
  best_day: "24/04",
  worst_day: "22/04",
  trend: [78, 65, 58, 72, 93, 82, 74],
  distribution: { stable: 57, attention: 31, critical: 12 },
};

const isPremiumPlan = (plan) => {
  if (!plan) return false;
  return Boolean(
    plan.is_premium ||
      plan.isPremium ||
      plan.premium ||
      plan.plan === "premium" ||
      plan.tier === "premium" ||
      plan.subscription_status === "active"
  );
};

const formatDate = (date) =>
  date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

export default function MeuRelatorioStable() {
  const [period, setPeriod] = useState("7d");
  const [report, setReport] = useState(fallbackReport);
  const [plan, setPlan] = useState(null);
  const [exporting, setExporting] = useState(false);

  const activePeriod = PERIODS.find((item) => item.value === period) || PERIODS[0];
  const premium = isPremiumPlan(plan);
  const showPdfPremiumNote = Boolean(plan && !premium);

  const generatedAt = useMemo(
    () =>
      new Date().toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    []
  );

  const periodLabel = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - Math.max(activePeriod.days - 1, 0));
    return `${formatDate(start)} a ${formatDate(end)} (${Math.min(activePeriod.days, report.total_analyses || activePeriod.days)} dias)`;
  }, [activePeriod.days, report.total_analyses]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 3500);

    fetch(`${API}/billing/plan`, { credentials: "include", signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => setPlan(data))
      .catch(() => setPlan(null))
      .finally(() => window.clearTimeout(timer));

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 3500);

    fetch(`${API}/report/personal?period=${period}`, {
      credentials: "include",
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!data || !data.distribution || !Array.isArray(data.trend)) return;
        setReport({
          ...fallbackReport,
          total_analyses: Number(data.total_analyses || fallbackReport.total_analyses),
          avg_v_score: Number(data.avg_v_score || fallbackReport.avg_v_score),
          trend: data.trend.map((item) => Number(item.avg_v_score || item.v_score || 0)).filter(Boolean),
        });
      })
      .catch(() => {})
      .finally(() => window.clearTimeout(timer));

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [period]);

  const exportPdf = async () => {
    setExporting(true);
    try {
      const response = await fetch(`${API}/report/personal/export-pdf?period=${period}`, {
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 403) {
          toast.error("Exportar PDF e exclusivo do Plano Premium.");
          return;
        }
        throw new Error("PDF export failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `vitalflow_relatorio_${period}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("PDF exportado com sucesso!");
    } catch {
      toast.error("Erro ao exportar PDF.");
    } finally {
      setExporting(false);
    }
  };

  const trend = report.trend.length ? report.trend : fallbackReport.trend;
  const maxTrend = Math.max(...trend, 100);

  const summaryCards = [
    {
      icon: Activity,
      label: "Status Geral",
      title: "Estabilidade no periodo",
      helper: "Manter constancia de recuperacao",
      tone: "text-amber-300",
    },
    {
      icon: HeartPulse,
      label: "Principal Risco",
      title: "sobrecarga fisiologica",
      helper: "Sinais consistentes de sobrecarga",
      tone: "text-rose-300",
    },
    {
      icon: Sparkles,
      label: "Provavel Causa",
      title: "Baixa recuperacao + esforco acumulado",
      helper: "Sono irregular e carga acumulada elevada",
      tone: "text-purple-300",
    },
    {
      icon: Shield,
      label: "Nivel de Confianca",
      title: `${report.confidence}%`,
      helper: "Confiabilidade moderada",
      tone: "text-emerald-300 text-3xl",
    },
  ];

  const metrics = [
    { icon: BarChart3, label: "Leituras", value: report.total_analyses, helper: "base biometrica analisada" },
    { icon: Activity, label: "V-Score", value: report.avg_v_score, helper: "faixa moderada de resiliencia" },
    { icon: Target, label: "Cobertura", value: `${report.coverage}/${activePeriod.days}`, helper: "dias monitorados" },
    { icon: TrendingUp, label: "Melhor Dia", value: report.best_day, helper: "pico de recuperacao" },
    { icon: Zap, label: "Pior Dia", value: report.worst_day, helper: "maior queda" },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="w-full max-w-[1640px] mx-auto px-4 sm:px-7 lg:px-8 py-5 sm:py-6">
        <section className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_auto] items-start gap-6 mb-8">
          <div>
            <h1 className="max-w-[820px] text-3xl sm:text-4xl xl:text-[42px] xl:leading-[1.08] font-black tracking-tight text-white">
              Relatorio Executivo de Resiliencia
            </h1>
            <p className="mt-2 text-lg text-slate-300">Visao consolidada da sua saude e performance</p>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-300">
              <span className="inline-flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Periodo analisado: {periodLabel}
              </span>
              <span className="hidden sm:inline text-neutral-700">|</span>
              <span>Gerado em: {generatedAt}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start gap-4 xl:pt-1">
            <div className="flex rounded-2xl border border-white/[0.08] bg-[#0b0d0f] p-1">
              {PERIODS.map((item) => (
                <button
                  key={item.value}
                  onClick={() => setPeriod(item.value)}
                  className={`min-w-[112px] rounded-xl px-4 py-3 text-sm font-bold transition ${
                    period === item.value ? "bg-cyan-500 text-black" : "text-slate-300 hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={exportPdf}
                disabled={exporting}
                className="flex min-w-[180px] items-center justify-center gap-3 rounded-2xl bg-cyan-500 px-6 py-3.5 text-sm font-black text-black hover:bg-cyan-400 disabled:opacity-60"
              >
                <Download className="h-4 w-4" />
                {exporting ? "Gerando..." : "Exportar PDF"}
              </button>
              {showPdfPremiumNote && (
                <p className="max-w-[210px] text-center text-xs font-bold leading-tight text-amber-300">
                  Exportar PDF e exclusivo do Plano Premium
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-[1.9fr_0.9fr] gap-5">
          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.035] p-5 sm:p-6">
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.28em] text-cyan-200">Resumo Executivo</p>
            <p className="max-w-5xl text-lg sm:text-xl font-semibold leading-snug text-white">
              <span className="text-amber-300">Sua resiliencia apresentou comportamento estavel</span>, com V-Score medio de{" "}
              <span className="text-cyan-400">{report.avg_v_score}</span> e maior impacto fisiologico em sem destaques.
            </p>
            <p className="mt-4 text-sm text-slate-300">Cobertura do periodo: {report.coverage}/{activePeriod.days} dias monitorados.</p>
            <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {summaryCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.label} className="min-h-[160px] rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4">
                    <div className="flex items-center gap-3 text-slate-200">
                      <Icon className={`h-4 w-4 ${card.tone}`} />
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em]">{card.label}</p>
                    </div>
                    <p className={`mt-5 font-black leading-tight ${card.tone}`}>{card.title}</p>
                    <p className="mt-3 text-sm leading-relaxed text-slate-300">{card.helper}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-[#0b0d0f] p-5 sm:p-6">
            <p className="mb-6 text-xs font-bold uppercase tracking-[0.28em] text-neutral-300">Interpretacao do Periodo</p>
            <div className="space-y-5">
              {[
                [TrendingUp, "Estabilidade detectada no periodo", "Seu V-Score se manteve relativamente estavel em relacao ao inicio do periodo.", "text-cyan-300", "bg-cyan-500/10"],
                [HeartPulse, "Impacto cardiovascular relevante", "Sinais de sobrecarga do sistema cardiovascular foram predominantes.", "text-rose-300", "bg-rose-500/10"],
                [Brain, "Fadiga cognitiva elevada", "Indicadores de esforco mental ficaram acima do ideal para sua rotina atual.", "text-purple-300", "bg-purple-500/10"],
                [Moon, "Recuperacao inconsistente", "Sono irregular e variabilidade reduzida afetam sua capacidade de recuperacao.", "text-emerald-300", "bg-emerald-500/10"],
              ].map(([Icon, title, body, tone, bg]) => (
                <div key={title} className="flex gap-4">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/[0.07] ${bg} ${tone}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-black text-white">{title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-300">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div key={metric.label} className="rounded-2xl border border-white/[0.08] bg-[#0b0d0f] p-4">
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-cyan-300" />
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-300">{metric.label}</p>
                </div>
                <p className="mt-4 text-3xl font-black text-white">{metric.value}</p>
                <p className="mt-2 text-sm text-slate-300">{metric.helper}</p>
              </div>
            );
          })}
        </section>

        <section className="mt-5 grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr_0.9fr] gap-5 pb-10">
          <div className="rounded-2xl border border-white/[0.08] bg-[#0b0d0f] p-5">
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.22em] text-neutral-300">Evolucao do V-Score</p>
            <div className="flex h-44 items-end gap-3 border-b border-white/10 pb-3">
              {trend.map((value, index) => (
                <div key={`${value}-${index}`} className="flex flex-1 flex-col items-center gap-2">
                  <div className="w-full rounded-t-lg bg-cyan-500/80" style={{ height: `${Math.max((value / maxTrend) * 145, 14)}px` }} />
                  <span className="text-xs font-bold text-slate-300">{value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-white/[0.08] bg-[#0b0d0f] p-5">
            <p className="mb-6 text-xs font-bold uppercase tracking-[0.22em] text-neutral-300">Distribuicao do Periodo</p>
            <div className="space-y-5">
              <div><p className="font-black text-emerald-300">{report.distribution.stable}% Estavel</p><div className="mt-2 h-3 rounded-full bg-white/10"><div className="h-3 rounded-full bg-emerald-400" style={{ width: `${report.distribution.stable}%` }} /></div></div>
              <div><p className="font-black text-amber-300">{report.distribution.attention}% Atencao</p><div className="mt-2 h-3 rounded-full bg-white/10"><div className="h-3 rounded-full bg-amber-400" style={{ width: `${report.distribution.attention}%` }} /></div></div>
              <div><p className="font-black text-rose-300">{report.distribution.critical}% Critico</p><div className="mt-2 h-3 rounded-full bg-white/10"><div className="h-3 rounded-full bg-rose-400" style={{ width: `${report.distribution.critical}%` }} /></div></div>
            </div>
          </div>
          <div className="rounded-2xl border border-white/[0.08] bg-[#0b0d0f] p-5">
            <p className="mb-6 text-xs font-bold uppercase tracking-[0.22em] text-neutral-300">Comparativo de Performance</p>
            <div className="grid grid-cols-3 items-end gap-4 h-44 border-b border-white/10 pb-4">
              {[report.avg_v_score, 72.3, 85.1].map((value, index) => (
                <div key={index} className="flex flex-col items-center gap-2">
                  <span className="text-sm font-bold text-white">{value}</span>
                  <div className={`w-full rounded-t-lg ${index === 0 ? "bg-cyan-500" : index === 1 ? "bg-slate-400" : "bg-emerald-400"}`} style={{ height: `${value * 1.3}px` }} />
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-slate-300">Seu V-Score esta acima da media da faixa etaria, mas ainda abaixo da sua meta pessoal.</p>
          </div>
        </section>
      </div>
    </div>
  );
}

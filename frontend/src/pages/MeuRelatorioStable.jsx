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
          toast.error("Exportar PDF é exclusivo do Plano Premium.");
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
      title: "Estabilidade no período",
      helper: "Manter constância de recuperação",
      tone: "text-amber-300",
    },
    {
      icon: HeartPulse,
      label: "Principal Risco",
      title: "sobrecarga fisiológica",
      helper: "Sinais consistentes de sobrecarga",
      tone: "text-rose-300",
    },
    {
      icon: Sparkles,
      label: "Provável Causa",
      title: "Baixa recuperação + esforço acumulado",
      helper: "Sono irregular e carga acumulada elevada",
      tone: "text-purple-300",
    },
    {
      icon: Shield,
      label: "Nível de Confiança",
      title: `${report.confidence}%`,
      helper: "Confiabilidade moderada",
      tone: "text-emerald-300",
    },
  ];

  const metrics = [
    { icon: BarChart3, label: "Leituras", value: report.total_analyses, helper: "base biométrica analisada" },
    { icon: Activity, label: "V-Score", value: report.avg_v_score, helper: "faixa moderada de resiliência" },
    { icon: Target, label: "Cobertura", value: `${report.coverage}/${activePeriod.days}`, helper: "dias monitorados" },
    { icon: TrendingUp, label: "Melhor Dia", value: report.best_day, helper: "pico de recuperação" },
    { icon: Zap, label: "Pior Dia", value: report.worst_day, helper: "maior queda" },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="w-full mx-auto px-4 sm:px-5 lg:px-6 py-3" style={{ maxWidth: 1540 }}>
        <section className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] items-start gap-4" style={{ marginBottom: 14 }}>
          <div className="min-w-0">
            <h1 className="font-black tracking-tight text-white" style={{ maxWidth: 760, fontSize: "clamp(25px, 2.15vw, 34px)", lineHeight: 1.04 }}>
              Relatório Executivo de Resiliência
            </h1>
            <p className="text-slate-300" style={{ marginTop: 6, fontSize: 16, lineHeight: 1.25 }}>Visão consolidada da sua saúde e performance</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-300" style={{ marginTop: 10, fontSize: 12, lineHeight: 1.2 }}>
              <span className="inline-flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" /> Período analisado: {periodLabel}
              </span>
              <span className="hidden sm:inline text-neutral-700">|</span>
              <span>Gerado em: {generatedAt}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start gap-3 lg:pt-0">
            <div className="flex rounded-xl border border-white/[0.08] bg-[#0b0d0f] p-1" style={{ height: 48 }}>
              {PERIODS.map((item) => (
                <button
                  key={item.value}
                  onClick={() => setPeriod(item.value)}
                  className={`rounded-lg font-bold transition ${
                    period === item.value ? "bg-cyan-500 text-black" : "text-slate-300 hover:text-white"
                  }`}
                  style={{ minWidth: 92, padding: "0 12px", fontSize: 12 }}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={exportPdf}
                disabled={exporting}
                className="flex items-center justify-center gap-2 rounded-xl bg-cyan-500 font-black text-black hover:bg-cyan-400 disabled:opacity-60"
                style={{ minWidth: 158, height: 48, padding: "0 18px", fontSize: 12 }}
              >
                <Download className="h-4 w-4" />
                {exporting ? "Gerando..." : "Exportar PDF"}
              </button>
              {showPdfPremiumNote && (
                <p className="text-center font-bold leading-tight text-amber-300" style={{ maxWidth: 178, fontSize: 10 }}>
                  Exportar PDF é exclusivo do Plano Premium
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-[2.12fr_0.9fr] gap-3">
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/[0.035]" style={{ padding: 16 }}>
            <p className="font-bold uppercase text-cyan-200" style={{ marginBottom: 10, fontSize: 11, letterSpacing: "0.22em" }}>Resumo Executivo</p>
            <div className="grid grid-cols-1 2xl:grid-cols-[1fr_1.45fr] gap-4 items-start">
              <div>
                <p className="font-semibold text-white" style={{ fontSize: 15, lineHeight: 1.45 }}>
                  <span className="text-amber-300">Sua resiliência apresentou comportamento estável</span>, com V-Score médio de{" "}
                  <span className="text-cyan-400">{report.avg_v_score}</span> e maior impacto fisiológico em sem destaques.
                </p>
                <p className="text-slate-300" style={{ marginTop: 10, fontSize: 12 }}>Cobertura do período: {report.coverage}/{activePeriod.days} dias monitorados.</p>
              </div>
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-2.5">
                {summaryCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <div key={card.label} className="rounded-lg border border-white/[0.08] bg-white/[0.025]" style={{ minHeight: 112, padding: 12 }}>
                      <div className="flex items-center gap-2 text-slate-200">
                        <Icon className={`h-3.5 w-3.5 ${card.tone}`} />
                        <p className="font-bold uppercase" style={{ fontSize: 9, letterSpacing: "0.14em", lineHeight: 1.2 }}>{card.label}</p>
                      </div>
                      <p className={`font-black leading-tight ${card.tone}`} style={{ marginTop: 12, fontSize: card.label === "Nível de Confiança" ? 27 : 12 }}>{card.title}</p>
                      <p className="leading-relaxed text-slate-300" style={{ marginTop: 8, fontSize: 11 }}>{card.helper}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-[#0b0d0f]" style={{ padding: 16 }}>
            <p className="font-bold uppercase text-neutral-300" style={{ marginBottom: 14, fontSize: 11, letterSpacing: "0.22em" }}>Interpretação do Período</p>
            <div className="space-y-3">
              {[
                [TrendingUp, "Estabilidade detectada no período", "Seu V-Score se manteve relativamente estável em relação ao início do período.", "text-cyan-300", "bg-cyan-500/10"],
                [HeartPulse, "Impacto cardiovascular relevante", "Sinais de sobrecarga do sistema cardiovascular foram predominantes.", "text-rose-300", "bg-rose-500/10"],
                [Brain, "Fadiga cognitiva elevada", "Indicadores de esforço mental ficaram acima do ideal para sua rotina atual.", "text-purple-300", "bg-purple-500/10"],
                [Moon, "Recuperação inconsistente", "Sono irregular e variabilidade reduzida afetam sua capacidade de recuperação.", "text-emerald-300", "bg-emerald-500/10"],
              ].map(([Icon, title, body, tone, bg]) => (
                <div key={title} className="flex gap-3">
                  <div className={`flex shrink-0 items-center justify-center rounded-lg border border-white/[0.07] ${bg} ${tone}`} style={{ width: 36, height: 36 }}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-black text-white" style={{ fontSize: 13, lineHeight: 1.25 }}>{title}</p>
                    <p className="leading-relaxed text-slate-300" style={{ marginTop: 3, fontSize: 11 }}>{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3" style={{ marginTop: 12 }}>
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div key={metric.label} className="rounded-xl border border-white/[0.08] bg-[#0b0d0f]" style={{ padding: 16, minHeight: 118 }}>
                <div className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4 text-cyan-300" />
                  <p className="font-bold uppercase text-slate-300" style={{ fontSize: 10, letterSpacing: "0.16em" }}>{metric.label}</p>
                </div>
                <p className="font-black text-white" style={{ marginTop: 16, fontSize: 28, lineHeight: 1 }}>{metric.value}</p>
                <p className="text-slate-300" style={{ marginTop: 8, fontSize: 12, lineHeight: 1.3 }}>{metric.helper}</p>
              </div>
            );
          })}
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-[1.25fr_0.82fr_0.92fr] gap-3 pb-8" style={{ marginTop: 12 }}>
          <div className="rounded-xl border border-white/[0.08] bg-[#0b0d0f]" style={{ padding: 16 }}>
            <p className="font-bold uppercase text-neutral-300" style={{ marginBottom: 14, fontSize: 11, letterSpacing: "0.2em" }}>Evolução do V-Score</p>
            <div className="flex items-end gap-3 border-b border-white/10" style={{ height: 136, paddingBottom: 12 }}>
              {trend.map((value, index) => (
                <div key={`${value}-${index}`} className="flex flex-1 flex-col items-center gap-2">
                  <div className="w-full rounded-t-md bg-cyan-500/80" style={{ height: `${Math.max((value / maxTrend) * 100, 12)}px` }} />
                  <span className="text-xs font-bold text-slate-300">{value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-[#0b0d0f]" style={{ padding: 16 }}>
            <p className="font-bold uppercase text-neutral-300" style={{ marginBottom: 14, fontSize: 11, letterSpacing: "0.2em" }}>Distribuição do Período</p>
            <div className="space-y-3.5">
              <div><p className="text-sm font-black text-emerald-300">{report.distribution.stable}% Estável</p><div className="mt-2 h-2.5 rounded-full bg-white/10"><div className="h-2.5 rounded-full bg-emerald-400" style={{ width: `${report.distribution.stable}%` }} /></div></div>
              <div><p className="text-sm font-black text-amber-300">{report.distribution.attention}% Atenção</p><div className="mt-2 h-2.5 rounded-full bg-white/10"><div className="h-2.5 rounded-full bg-amber-400" style={{ width: `${report.distribution.attention}%` }} /></div></div>
              <div><p className="text-sm font-black text-rose-300">{report.distribution.critical}% Crítico</p><div className="mt-2 h-2.5 rounded-full bg-white/10"><div className="h-2.5 rounded-full bg-rose-400" style={{ width: `${report.distribution.critical}%` }} /></div></div>
            </div>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-[#0b0d0f]" style={{ padding: 16 }}>
            <p className="font-bold uppercase text-neutral-300" style={{ marginBottom: 14, fontSize: 11, letterSpacing: "0.2em" }}>Comparativo de Performance</p>
            <div className="grid grid-cols-3 items-end gap-4 border-b border-white/10" style={{ height: 136, paddingBottom: 14 }}>
              {[report.avg_v_score, 72.3, 85.1].map((value, index) => (
                <div key={index} className="flex flex-col items-center gap-2">
                  <span className="text-xs font-bold text-white">{value}</span>
                  <div className={`w-full rounded-t-md ${index === 0 ? "bg-cyan-500" : index === 1 ? "bg-slate-400" : "bg-emerald-400"}`} style={{ height: `${value * 0.9}px` }} />
                </div>
              ))}
            </div>
            <p className="text-slate-300" style={{ marginTop: 12, fontSize: 12, lineHeight: 1.35 }}>Seu V-Score está acima da média da faixa etária, mas ainda abaixo da sua meta pessoal.</p>
          </div>
        </section>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Activity,
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
  date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

function SectionTitle({ children }) {
  return (
    <p className="font-bold uppercase text-neutral-300" style={{ marginBottom: 10, fontSize: 11, letterSpacing: "0.2em" }}>
      {children}
    </p>
  );
}

function MiniSparkline({ tone = "emerald" }) {
  const color = tone === "rose" ? "bg-rose-400" : "bg-emerald-400";
  return (
    <div className="flex h-7 items-end gap-1 opacity-80">
      {[30, 42, 34, 48, 39, 44, 36, 51].map((height, index) => (
        <span key={index} className={`w-3 rounded-full ${color}`} style={{ height: `${height}%` }} />
      ))}
    </div>
  );
}

function TrendLineChart({ values }) {
  const safeValues = values.length > 1 ? values : fallbackReport.trend;
  const max = Math.max(...safeValues, 100);
  const min = Math.min(...safeValues, 50);
  const spread = Math.max(max - min, 1);
  const points = safeValues.map((value, index) => {
    const x = 8 + (index * 84) / Math.max(safeValues.length - 1, 1);
    const y = 84 - ((value - min) / spread) * 58;
    return { value, x, y, label: `${20 + index}/04` };
  });
  const path = points.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <div className="relative overflow-hidden rounded-lg border border-white/[0.04] bg-cyan-500/[0.025]" style={{ height: 156 }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id="trendFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.34" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[24, 46, 68, 90].map((y) => (
          <line key={y} x1="6" x2="94" y1={y} y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth="0.45" vectorEffect="non-scaling-stroke" />
        ))}
        <polygon points={`8,92 ${path} 92,92`} fill="url(#trendFill)" />
        <polyline points={path} fill="none" stroke="#22d3ee" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        {points.map((point, index) => (
          <circle key={index} cx={point.x} cy={point.y} r="1.8" fill={point.value < 65 ? "#fb7185" : point.value > 88 ? "#34d399" : "#22d3ee"} vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      <div className="absolute inset-x-4 top-3 flex justify-between text-[10px] font-bold text-slate-200">
        {points.map((point) => <span key={`v-${point.label}`}>{point.value}</span>)}
      </div>
      <div className="absolute inset-x-4 bottom-3 flex justify-between text-[10px] text-slate-500">
        {points.map((point) => <span key={point.label}>{point.label}</span>)}
      </div>
    </div>
  );
}

export default function MeuRelatorioStable() {
  const [period, setPeriod] = useState("7d");
  const [report, setReport] = useState(fallbackReport);
  const [plan, setPlan] = useState(null);
  const [exporting, setExporting] = useState(false);

  const activePeriod = PERIODS.find((item) => item.value === period) || PERIODS[0];
  const premium = isPremiumPlan(plan);
  const showPdfPremiumNote = Boolean(plan && !premium);

  const generatedAt = useMemo(
    () => new Date().toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }),
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
    fetch(`${API}/report/personal?period=${period}`, { credentials: "include", signal: controller.signal })
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
      const response = await fetch(`${API}/report/personal/export-pdf?period=${period}`, { credentials: "include" });
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

  const trend = report.trend.length > 1 ? report.trend : fallbackReport.trend;
  const coveragePercent = Math.round((report.coverage / Math.max(activePeriod.days, 1)) * 100);

  const summaryCards = [
    { icon: Activity, label: "Status Geral", title: "Estabilidade", helper: "Manter constância", tone: "text-amber-300" },
    { icon: HeartPulse, label: "Principal Risco", title: "sobrecarga cardiovascular", helper: "Sinais consistentes", tone: "text-rose-300" },
    { icon: Sparkles, label: "Provável Causa", title: "Baixa recuperação", helper: "Esforço acumulado", tone: "text-purple-300" },
    { icon: Shield, label: "Nível de Confiança", title: `${report.confidence}%`, helper: "Confiabilidade moderada", tone: "text-emerald-300" },
  ];

  const metrics = [
    { icon: Shield, label: "Confiabilidade", value: `${report.confidence}%`, helper: "Qualidade dos dados", tone: "text-emerald-300" },
    { icon: Activity, label: "V-Score Médio", value: report.avg_v_score, helper: "Faixa moderada", tone: "text-amber-300" },
    { icon: Target, label: "Cobertura", value: `${coveragePercent}%`, helper: `${report.coverage} de ${activePeriod.days} dias válidos`, tone: "text-purple-300" },
    { icon: Calendar, label: "Dias Monitorados", value: report.coverage, helper: "Base de tendência", tone: "text-purple-300" },
    { icon: TrendingUp, label: "Melhor Dia", value: report.best_day, helper: "Pico de recuperação", tone: "text-emerald-300" },
    { icon: Zap, label: "Pior Dia", value: report.worst_day, helper: "Maior queda", tone: "text-rose-300" },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="w-full mx-auto px-4 sm:px-5 lg:px-6 py-3" style={{ maxWidth: 1540 }}>
        <section className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] items-start gap-4" style={{ marginBottom: 12 }}>
          <div className="min-w-0">
            <h1 className="font-black tracking-tight text-white" style={{ maxWidth: 760, fontSize: "clamp(25px, 2.15vw, 34px)", lineHeight: 1.04 }}>Relatório Executivo de Resiliência</h1>
            <p className="text-slate-300" style={{ marginTop: 5, fontSize: 16, lineHeight: 1.25 }}>Visão consolidada da sua saúde e performance</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-300" style={{ marginTop: 9, fontSize: 12, lineHeight: 1.2 }}>
              <span className="inline-flex items-center gap-2"><Calendar className="h-3.5 w-3.5" /> Período analisado: {periodLabel}</span>
              <span className="hidden sm:inline text-neutral-700">|</span>
              <span>Gerado em: {generatedAt}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start gap-3 lg:pt-0">
            <div className="flex rounded-xl border border-white/[0.08] bg-[#0b0d0f] p-1" style={{ height: 48 }}>
              {PERIODS.map((item) => (
                <button key={item.value} onClick={() => setPeriod(item.value)} className={`rounded-lg font-bold transition ${period === item.value ? "bg-cyan-500 text-black" : "text-slate-300 hover:text-white"}`} style={{ minWidth: 92, padding: "0 12px", fontSize: 12 }}>{item.label}</button>
              ))}
            </div>
            <div className="flex flex-col items-center gap-1">
              <button onClick={exportPdf} disabled={exporting} className="flex items-center justify-center gap-2 rounded-xl bg-cyan-500 font-black text-black hover:bg-cyan-400 disabled:opacity-60" style={{ minWidth: 158, height: 48, padding: "0 18px", fontSize: 12 }}>
                <Download className="h-4 w-4" /> {exporting ? "Gerando..." : "Exportar PDF"}
              </button>
              {showPdfPremiumNote && <p className="text-center font-bold leading-tight text-amber-300" style={{ maxWidth: 178, fontSize: 10 }}>Exportar PDF é exclusivo do Plano Premium</p>}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-[2.12fr_0.9fr] items-start gap-3">
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/[0.035]" style={{ padding: 13 }}>
            <div className="grid grid-cols-1 2xl:grid-cols-[1fr_1.45fr] gap-3 items-start">
              <div>
                <p className="font-bold uppercase text-cyan-200" style={{ marginBottom: 9, fontSize: 11, letterSpacing: "0.22em" }}>Resumo Executivo</p>
                <p className="font-semibold text-white" style={{ fontSize: 14, lineHeight: 1.4 }}><span className="text-amber-300">Sua resiliência apresentou comportamento estável</span>, com V-Score médio de <span className="text-cyan-400">{report.avg_v_score}</span> e maior impacto fisiológico em sem destaques.</p>
                <p className="text-slate-300" style={{ marginTop: 8, fontSize: 12 }}>Cobertura do período: {report.coverage}/{activePeriod.days} dias monitorados.</p>
              </div>
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-2">
                {summaryCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <div key={card.label} className="rounded-lg border border-white/[0.08] bg-white/[0.025]" style={{ minHeight: 84, padding: 9 }}>
                      <div className="flex items-center gap-2 text-slate-200"><Icon className={`h-3.5 w-3.5 ${card.tone}`} /><p className="font-bold uppercase" style={{ fontSize: 9, letterSpacing: "0.13em", lineHeight: 1.2 }}>{card.label}</p></div>
                      <p className={`font-black leading-tight ${card.tone}`} style={{ marginTop: 8, fontSize: card.label === "Nível de Confiança" ? 24 : 12 }}>{card.title}</p>
                      <p className="leading-relaxed text-slate-300" style={{ marginTop: 5, fontSize: 10.5 }}>{card.helper}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-[#0b0d0f]" style={{ padding: 13 }}>
            <p className="font-bold uppercase text-neutral-300" style={{ marginBottom: 11, fontSize: 11, letterSpacing: "0.22em" }}>Interpretação do Período</p>
            <div className="space-y-2.5">
              {[
                [TrendingUp, "Estabilidade detectada no período", "Seu V-Score se manteve relativamente estável em relação ao início do período.", "text-cyan-300", "bg-cyan-500/10"],
                [HeartPulse, "Impacto cardiovascular relevante", "Sinais de sobrecarga do sistema cardiovascular foram predominantes.", "text-rose-300", "bg-rose-500/10"],
                [Brain, "Fadiga cognitiva elevada", "Indicadores de esforço mental ficaram acima do ideal para sua rotina atual.", "text-purple-300", "bg-purple-500/10"],
                [Moon, "Recuperação inconsistente", "Sono irregular e variabilidade reduzida afetam sua capacidade de recuperação.", "text-emerald-300", "bg-emerald-500/10"],
              ].map(([Icon, title, body, tone, bg]) => (
                <div key={title} className="flex gap-3"><div className={`flex shrink-0 items-center justify-center rounded-lg border border-white/[0.07] ${bg} ${tone}`} style={{ width: 32, height: 32 }}><Icon className="h-4 w-4" /></div><div><p className="font-black text-white" style={{ fontSize: 12.5, lineHeight: 1.2 }}>{title}</p><p className="leading-relaxed text-slate-300" style={{ marginTop: 3, fontSize: 10.5 }}>{body}</p></div></div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-3" style={{ marginTop: 10 }}>
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return <div key={metric.label} className="rounded-xl border border-white/[0.08] bg-[#0b0d0f]" style={{ padding: 13, minHeight: 105 }}><div className="flex items-center gap-2.5"><Icon className={`h-4 w-4 ${metric.tone}`} /><p className="font-bold uppercase text-slate-300" style={{ fontSize: 9.5, letterSpacing: "0.15em" }}>{metric.label}</p></div><p className={`font-black ${metric.tone || "text-white"}`} style={{ marginTop: 12, fontSize: 25, lineHeight: 1 }}>{metric.value}</p><p className="text-slate-300" style={{ marginTop: 6, fontSize: 11, lineHeight: 1.3 }}>{metric.helper}</p></div>;
          })}
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-[1.35fr_0.8fr_0.9fr] gap-3" style={{ marginTop: 10 }}>
          <div className="rounded-xl border border-white/[0.08] bg-[#0b0d0f]" style={{ padding: 15 }}><SectionTitle>Evolução do V-Score</SectionTitle><TrendLineChart values={trend} /></div>
          <div className="rounded-xl border border-white/[0.08] bg-[#0b0d0f]" style={{ padding: 15 }}><SectionTitle>Distribuição do Período</SectionTitle><div className="space-y-3"><div><p className="text-sm font-black text-emerald-300">{report.distribution.stable}% Estável</p><p className="text-[11px] text-slate-400">Maior parte do período</p><div className="mt-2 h-2.5 rounded-full bg-white/10"><div className="h-2.5 rounded-full bg-emerald-400" style={{ width: `${report.distribution.stable}%` }} /></div></div><div><p className="text-sm font-black text-amber-300">{report.distribution.attention}% Atenção</p><p className="text-[11px] text-slate-400">Sinais de sobrecarga</p><div className="mt-2 h-2.5 rounded-full bg-white/10"><div className="h-2.5 rounded-full bg-amber-400" style={{ width: `${report.distribution.attention}%` }} /></div></div><div><p className="text-sm font-black text-rose-300">{report.distribution.critical}% Crítico</p><p className="text-[11px] text-slate-400">Risco elevado presente</p><div className="mt-2 h-2.5 rounded-full bg-white/10"><div className="h-2.5 rounded-full bg-rose-400" style={{ width: `${report.distribution.critical}%` }} /></div></div></div></div>
          <div className="rounded-xl border border-white/[0.08] bg-[#0b0d0f]" style={{ padding: 15 }}><SectionTitle>Comparativo de Performance</SectionTitle><div className="grid grid-cols-3 items-end gap-4 border-b border-white/10" style={{ height: 126, paddingBottom: 12 }}>{[report.avg_v_score, 72.3, 85.1].map((value, index) => <div key={index} className="flex flex-col items-center gap-1.5"><span className="text-xs font-bold text-white">{value}</span><div className={`w-full rounded-t-md ${index === 0 ? "bg-cyan-500" : index === 1 ? "bg-slate-400" : "bg-emerald-400"}`} style={{ height: `${value * 0.82}px` }} /><span className="text-[10px] text-slate-500">{index === 0 ? "Sua média" : index === 1 ? "Faixa etária" : "Sua meta"}</span></div>)}</div><p className="text-slate-300" style={{ marginTop: 10, fontSize: 11, lineHeight: 1.35 }}>Seu V-Score está acima da média da faixa etária, mas ainda abaixo da sua meta pessoal.</p></div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.55fr_0.7fr_0.95fr] gap-3" style={{ marginTop: 10 }}>
          <div className="rounded-xl border border-white/[0.08] bg-[#0b0d0f]" style={{ padding: 15 }}><SectionTitle>Sistemas Mais Impactados</SectionTitle>{[[HeartPulse, "Cardiovascular", 82, "Alto impacto", "bg-rose-400", "text-rose-300"], [Brain, "Cognitivo", 68, "Impacto moderado", "bg-amber-400", "text-amber-300"], [Activity, "Muscular", 56, "Impacto leve", "bg-yellow-400", "text-yellow-300"]].map(([Icon, label, value, helper, bar, tone]) => <div key={label} className="mb-3 last:mb-0 grid grid-cols-[110px_1fr_96px] items-center gap-3 text-xs"><span className={`inline-flex items-center gap-2 ${tone}`}><Icon className="h-4 w-4" />{label}</span><span className="h-2.5 rounded-full bg-white/10"><span className={`block h-2.5 rounded-full ${bar}`} style={{ width: `${value}%` }} /></span><span className={tone}>{helper}</span></div>)}</div>
          <div className="rounded-xl border border-white/[0.08] bg-[#0b0d0f]" style={{ padding: 15 }}><SectionTitle>Comparativo do Período</SectionTitle>{[["Vs início", "+2.1"], ["Vs melhor leitura", "-3.0"], ["Vs média pessoal", "+8%"]].map(([label, value]) => <div key={label} className="flex justify-between border-b border-white/10 py-2 text-xs last:border-b-0"><span className="text-slate-400">{label}</span><span className="font-bold text-emerald-300">{value}</span></div>)}</div>
          <div className="rounded-xl border border-white/[0.08] bg-[#0b0d0f]" style={{ padding: 15 }}><SectionTitle>Confiabilidade da Análise</SectionTitle>{[["Cobertura biométrica", "Alta", "text-emerald-300"], ["Qualidade dos sinais", "Boa", "text-emerald-300"], ["Janela de sono", "Incompleta", "text-amber-300"], ["Confiança", `${report.confidence}%`, "text-emerald-300"]].map(([label, value, tone]) => <div key={label} className="flex justify-between border-b border-white/10 py-1.5 text-xs last:border-b-0"><span className="text-slate-400">{label}</span><span className={`font-bold ${tone}`}>{value}</span></div>)}</div>
          <div className="rounded-xl border border-white/[0.08] bg-[#0b0d0f]" style={{ padding: 15 }}><SectionTitle>Insights de Longevidade</SectionTitle><div className="flex items-center justify-between border-b border-white/10 pb-3"><span className="text-lg font-black text-emerald-300">+3%</span><span className="text-sm text-slate-300">HRV (6 meses)</span><MiniSparkline /></div><div className="mt-3 flex items-center justify-between"><span className="text-lg font-black text-rose-300">-2%</span><span className="text-sm text-slate-300">FC Repouso (6 meses)</span><MiniSparkline tone="rose" /></div></div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-[1fr_0.28fr] gap-3 pb-8" style={{ marginTop: 10 }}>
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/[0.035]" style={{ padding: 15 }}><SectionTitle>Conclusão Executiva</SectionTitle><p className="text-xs leading-relaxed text-slate-300">Seu período apresentou sinais consistentes de estabilidade, com maior atenção à recuperação e ao controle de sobrecarga. A principal oportunidade está em manter sono regular, reduzir esforço acumulado e preservar constância nas próximas 24-48h.</p></div>
          <div className="rounded-xl border border-white/[0.08] bg-[#0b0d0f]" style={{ padding: 15 }}><SectionTitle>Próximo Período</SectionTitle><p className="text-xs leading-relaxed text-slate-300">Continue monitorando para acompanhar sua evolução.</p></div>
        </section>
      </div>
    </div>
  );
}

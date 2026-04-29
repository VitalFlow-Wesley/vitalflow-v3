import React, { useCallback, useEffect, useMemo, useState } from "react"; import { AreaChart, Area, CartesianGrid, ResponsiveContainer, Tooltip, ReferenceLine, XAxis, YAxis, } from "recharts"; import { ShieldCheck, TimerReset, Clock3, HeartPulse, Brain, ArrowRight, Footprints, Flame, Timer, Moon, Droplets, Target, CheckCircle2, Star, Zap, Cpu, Activity, Gauge, Sprout, BedDouble, Route, Wifi, AlertTriangle, RefreshCw, } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://vitalflow.up.railway.app"; const API = ${BACKEND_URL}/api; const POLLING_INTERVAL = 30000;

const fallbackTrendData = [ { time: "00:00", score: 82 }, { time: "02:00", score: 80 }, { time: "04:00", score: 81 }, { time: "05:00", score: 62 }, { time: "06:00", score: 56 }, { time: "08:00", score: 68 }, { time: "10:00", score: 67 }, { time: "12:00", score: 74 }, { time: "14:00", score: 77 }, { time: "16:00", score: 84 }, { time: "18:00", score: 79 }, { time: "20:00", score: 93 }, { time: "22:00", score: 90 }, { time: "24:00", score: 100 }, ];

const fallbackInsights = [ [CheckCircle2, "Excelente recuperação", "Seu corpo está se recuperando muito bem. Continue assim!", "text-emerald-300"], [Star, "Consistência é chave", "7 dias seguidos monitorando. Mantenha o ritmo!", "text-amber-300"], [Droplets, "Atenção à hidratação", "Sua ingestão de água está um pouco abaixo do ideal.", "text-violet-300"], [Target, "Próximo objetivo", "Mantenha 7+ horas de sono para otimizar ainda mais.", "text-rose-300"], ];

function authHeaders() { const token = localStorage.getItem("vf_token") || localStorage.getItem("token"); return { "Content-Type": "application/json", ...(token ? { Authorization: Bearer ${token} } : {}), }; }

function safeNumber(value, fallback = 0) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : fallback; }

function formatHour(timestamp, fallbackIndex = 0) { if (!timestamp) return ${String(fallbackIndex * 2).padStart(2, "0")}:00; const date = new Date(timestamp); if (Number.isNaN(date.getTime())) return ${String(fallbackIndex * 2).padStart(2, "0")}:00; return ${String(date.getHours()).padStart(2, "0")}:00; }

function getLatest(history = []) { return Array.isArray(history) && history.length > 0 ? history[0] : null; }

function deriveStatus(score) { if (score >= 80) return { label: "Normal", tone: "text-emerald-300", badge: "bg-emerald-400/10 text-emerald-300", text: "Equilíbrio preservado" }; if (score >= 60) return { label: "Atenção", tone: "text-amber-300", badge: "bg-amber-400/10 text-amber-300", text: "Ajuste recomendado" }; return { label: "Crítico", tone: "text-rose-300", badge: "bg-rose-400/10 text-rose-300", text: "Intervenção sugerida" }; }

function deriveRecommendation(score, trend, predictiveAlert) { if (predictiveAlert?.has_alert && predictiveAlert?.alert?.message) { return { title: "Prevenção ativa", description: predictiveAlert.alert.message, reason: "A IA identificou um padrão de risco e está antecipando uma ação preventiva antes da sobrecarga.", duration: "5 min", type: "Preventiva", focus: "Prevenção", priority: "Média", }; }

if (score < 60) { return { title: "Recuperação prioritária", description: "Faça uma pausa guiada curta para reduzir carga fisiológica e recuperar estabilidade.", reason: "Seu V-Score está abaixo da zona ideal. A recomendação prioriza recuperação rápida antes de novas demandas.", duration: "7 min", type: "Recuperação", focus: "Recuperação leve", priority: "Alta", }; }

if (trend === "falling") { return { title: "Manutenção com cautela", description: "Mantenha o ritmo, mas evite excesso de carga nas próximas horas.", reason: "Existe tendência de queda nos últimos registros, então a IA recomenda preservar energia e evitar sobrecarga.", duration: "4 min", type: "Manutenção", focus: "Manutenção leve", priority: "Média", }; }

return { title: "Manutenção positiva", description: "Mantenha seu estado estável com uma respiração curta de manutenção.", reason: "Seu V-Score está estável, HRV preservada e stress controlado. Este é o momento ideal para manter consistência.", duration: "3 min", type: "Manutenção", focus: "Manutenção leve", priority: "Baixa", }; }

function PremiumCard({ children, className = "" }) { return ( <div className={rounded-[22px] border border-white/[0.07] bg-[#0b0d0f] shadow-[0_24px_70px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.03)] ${className}} > {children} </div> ); }

function SectionLabel({ children }) { return ( <div className="text-[11px] font-bold uppercase tracking-[0.32em] text-slate-400/80"> {children} </div> ); }

export default function Dashboard() { const [history, setHistory] = useState([]); const [healthTrend, setHealthTrend] = useState(null); const [morningReport, setMorningReport] = useState(null); const [predictiveAlert, setPredictiveAlert] = useState(null); const [loading, setLoading] = useState(true); const [refreshing, setRefreshing] = useState(false); const [error, setError] = useState("");

const fetchDashboardData = useCallback(async ({ silent = false } = {}) => { try { if (!silent) setLoading(true); setRefreshing(true); setError("");

const [historyRes, trendRes, morningRes, alertRes] = await Promise.allSettled([
    fetch(`${API}/history?limit=30`, { headers: authHeaders() }),
    fetch(`${API}/health/trend`, { headers: authHeaders() }),
    fetch(`${API}/health/morning-report`, { headers: authHeaders() }),
    fetch(`${API}/predictive/alert`, { headers: authHeaders() }),
  ]);

  if (historyRes.status === "fulfilled" && historyRes.value.ok) {
    const data = await historyRes.value.json();
    setHistory(Array.isArray(data) ? data : []);
  }

  if (trendRes.status === "fulfilled" && trendRes.value.ok) {
    setHealthTrend(await trendRes.value.json());
  }

  if (morningRes.status === "fulfilled" && morningRes.value.ok) {
    setMorningReport(await morningRes.value.json());
  }

  if (alertRes.status === "fulfilled" && alertRes.value.ok) {
    setPredictiveAlert(await alertRes.value.json());
  }

  const allFailed = [historyRes, trendRes, morningRes, alertRes].every(
    (item) => item.status === "rejected" || !item.value?.ok
  );

  if (allFailed) {
    setError("Não foi possível carregar os dados reais agora. Exibindo base visual de segurança.");
  }
} catch (err) {
  setError("Falha ao atualizar o dashboard.");
} finally {
  setLoading(false);
  setRefreshing(false);
}

}, []);

useEffect(() => { fetchDashboardData(); const interval = setInterval(() => fetchDashboardData({ silent: true }), POLLING_INTERVAL); return () => clearInterval(interval); }, [fetchDashboardData]);

const latest = getLatest(history); const currentScore = Math.round( safeNumber(latest?.v_score ?? latest?.vScore ?? healthTrend?.avg_7d, 100) ); const status = deriveStatus(currentScore); const recommendation = deriveRecommendation(currentScore, healthTrend?.trend, predictiveAlert);

const trendData = useMemo(() => { if (Array.isArray(history) && history.length > 0) { return [...history] .reverse() .slice(-14) .map((item, index) => ({ time: formatHour(item.timestamp || item.created_at, index), score: Math.round(safeNumber(item.v_score ?? item.vScore, currentScore)), })); }

if (Array.isArray(healthTrend?.v_scores_7d) && healthTrend.v_scores_7d.length > 0) {
  return healthTrend.v_scores_7d.map((item, index) => ({
    time: item.date?.slice(5) || `D${index + 1}`,
    score: Math.round(safeNumber(item.avg_v_score, currentScore)),
  }));
}

return fallbackTrendData;

}, [history, healthTrend, currentScore]);

const avgScore = useMemo( () => Math.round(trendData.reduce((acc, item) => acc + item.score, 0) / Math.max(trendData.length, 1)), [trendData] );

const sleepHours = safeNumber(morningReport?.sleep_hours, 7.53); const sleepLabel = ${Math.floor(sleepHours)}h ${Math.round((sleepHours % 1) * 60)}m;

const metrics = [ [HeartPulse, "BPM", latest?.bpm || latest?.heart_rate || 70, "Normal", "text-cyan-300"], [Activity, "HRV", latest?.hrv || 45, currentScore >= 80 ? "Excelente" : "Atenção", "text-emerald-300"], [Droplets, "SpO2", ${latest?.spo2 || latest?.oxygen_saturation || 98}%, "Normal", "text-violet-300"], [BedDouble, "Sono", sleepLabel, morningReport?.recovery_label || "Bom", "text-indigo-300"], [Footprints, "Passos", latest?.steps || latest?.passos || 947, "Meta: 8.000", "text-amber-300"], [Flame, "Calorias", latest?.calories || latest?.calorias || 240, "Atividade leve", "text-orange-300"], [Route, "Distância", latest?.distance_km || latest?.distancia || "2,2", "Baixo impacto", "text-violet-300"], [Timer, "Min. Ativos", latest?.active_minutes || latest?.minutos_ativos || 59, "Meta: 60 min", "text-indigo-300"], ];

const quick = [ [Activity, "Estável nas últimas 6h", healthTrend?.trend === "falling" ? "Tendência de queda" : "Variação mínima detectada", healthTrend?.trend === "falling" ? "text-amber-300" : "text-emerald-300"], [Brain, currentScore >= 80 ? "Stress controlado" : "Stress em atenção", currentScore >= 80 ? "Carga mental dentro do ideal" : "Reduza estímulos por alguns minutos", currentScore >= 80 ? "text-amber-300" : "text-rose-300"], [HeartPulse, "HRV preservada", "Bom sinal de recuperação", "text-cyan-300"], [ShieldCheck, recommendation.priority === "Alta" ? "Janela de recuperação" : "Boa janela para manutenção", recommendation.priority === "Alta" ? "Priorize pausa curta" : "Aproveite para manter consistência", "text-emerald-300"], ];

const executiveSummary = [ ["Prioridade", recommendation.priority, recommendation.priority === "Alta" ? "Ação recomendada" : "Momento favorável", Sprout, recommendation.priority === "Alta" ? "text-rose-300" : "text-emerald-300"], ["Janela ideal", "Agora", "Próximas 2-3 horas", TimerReset, "text-emerald-300"], ["Foco do dia", recommendation.focus, "Evite excessos", Flame, "text-amber-300"], ["Próxima reavaliação", "Em 3h 12m", "16:30", Clock3, "text-white"], ];

const insights = healthTrend?.requires_intervention ? [ [AlertTriangle, "Atenção necessária", healthTrend.intervention_message || "Seus indicadores pedem cuidado preventivo.", "text-rose-300"], ...fallbackInsights.slice(1), ] : fallbackInsights;

return ( <div className="space-y-3 text-white"> {error && ( <div className="flex items-center gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100"> <AlertTriangle className="h-4 w-4 text-amber-300" /> {error} </div> )}

<PremiumCard className="overflow-hidden bg-gradient-to-r from-[#0a0d0f] via-[#0d1012] to-[#0a0d0f]">
    <div className="grid min-h-[118px] xl:grid-cols-[1.55fr_repeat(4,1fr)]">
      <div className="relative flex items-center gap-5 border-b border-white/[0.06] p-6 xl:border-b-0 xl:border-r">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_48%,rgba(16,185,129,0.14),transparent_32%)]" />
        <div className="relative flex h-14 w-14 items-center justify-center rounded-full border border-emerald-400/15 bg-emerald-400/[0.08] shadow-[0_0_28px_rgba(16,185,129,0.14)]">
          <Gauge className="h-8 w-8 text-emerald-300" />
        </div>
        <div className="relative min-w-0">
          <SectionLabel>Modo do dia</SectionLabel>
          <div className="mt-1 text-3xl font-black text-emerald-300">
            {recommendation.type === "Recuperação" ? "Recuperação" : "Manutenção"}
          </div>
          <p className="mt-1 max-w-[440px] text-sm leading-relaxed text-slate-300/80">
            Condição ideal para manter consistência e foco nas suas atividades.
          </p>
        </div>
        <button
          onClick={() => fetchDashboardData({ silent: true })}
          className="relative ml-auto hidden rounded-xl border border-white/[0.08] bg-white/[0.035] p-2 text-slate-300 transition hover:bg-white/[0.07] lg:block"
          title="Atualizar dashboard"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {executiveSummary.map(([label, value, subtitle, Icon, color]) => (
        <div key={label} className="flex items-center gap-4 border-t border-white/[0.06] p-5 first:border-t-0 xl:border-l xl:border-t-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.04]">
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-slate-500">{label}</div>
            <div className={`mt-1 truncate text-lg font-black ${color}`}>{value}</div>
            <div className="mt-1 truncate text-xs text-slate-400">{subtitle}</div>
          </div>
        </div>
      ))}
    </div>
  </PremiumCard>

  <div className="grid gap-3 xl:grid-cols-[0.95fr_1.05fr_1.48fr]">
    <PremiumCard className="flex min-h-[352px] flex-col p-6">
      <SectionLabel>Status Vital</SectionLabel>
      <div className="mt-5 flex items-center gap-2 text-2xl font-black">
        <span className="text-emerald-300">›</span> Resiliência {currentScore >= 80 ? "ótima" : currentScore >= 60 ? "moderada" : "baixa"}
      </div>
      <div className="flex flex-1 items-center justify-center py-4">
        <div className="relative flex h-44 w-44 items-center justify-center rounded-full border-[10px] border-emerald-400 shadow-[0_0_42px_rgba(52,211,153,0.22)]">
          <div className="absolute inset-3 rounded-full bg-emerald-400/[0.04]" />
          <div className="relative text-center">
            <div className="text-5xl font-black leading-none">{loading ? "--" : currentScore}</div>
            <div className="mt-2 text-base text-slate-300/75">de 100</div>
          </div>
        </div>
      </div>
      <div className={`mx-auto rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-[0.35em] ${status.badge}`}>
        {status.label}
      </div>
      <p className="mx-auto mt-5 max-w-[300px] text-center text-sm leading-relaxed text-slate-300/75">
        {currentScore >= 80
          ? "Seu estado fisiológico está excelente e em equilíbrio."
          : currentScore >= 60
            ? "Seu estado está estável, mas pede manutenção preventiva."
            : "Seu estado pede recuperação e redução de carga agora."}
      </p>
    </PremiumCard>

    <PremiumCard className="min-h-[352px] p-6">
      <SectionLabel>Leitura Rápida</SectionLabel>
      <div className="mt-6 space-y-3">
        {quick.map(([Icon, title, subtitle, color]) => (
          <div key={title} className="flex items-center gap-4 rounded-2xl border border-white/[0.04] bg-white/[0.035] p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/[0.05]">
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <div>
              <div className="font-bold text-white">{title}</div>
              <div className="mt-1 text-sm text-slate-400">{subtitle}</div>
            </div>
          </div>
        ))}
      </div>
    </PremiumCard>

    <PremiumCard className="relative min-h-[352px] overflow-hidden p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_38%_18%,rgba(16,185,129,0.16),transparent_38%)]" />
      <div className="relative flex items-start justify-between gap-4">
        <SectionLabel>Sugestão Inteligente</SectionLabel>
        <div className="flex items-center gap-2 rounded-full bg-cyan-400/[0.06] px-4 py-2 text-sm font-bold">
          <Cpu className="h-4 w-4 text-cyan-300" /> VitalFlow AI
        </div>
      </div>

      <div className="relative mt-5 grid gap-4 lg:grid-cols-[1fr_145px]">
        <div className="rounded-[20px] border border-emerald-400/15 bg-emerald-400/[0.055] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.035),0_0_46px_rgba(16,185,129,0.08)]">
          <div className="text-[10px] font-black uppercase tracking-[0.26em] text-emerald-300/80">Recomendação prioritária</div>
          <div className="mt-3 text-3xl font-black leading-tight text-emerald-300">{recommendation.title}</div>
          <p className="mt-3 max-w-[520px] text-sm leading-relaxed text-white/85">
            {recommendation.description}
          </p>
          <div className="my-4 h-px bg-emerald-300/10" />
          <div className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-200/75">Por que esta recomendação?</div>
          <p className="mt-2 text-sm leading-relaxed text-slate-300/80">
            {recommendation.reason}
          </p>
        </div>

        <div className="rounded-[18px] border border-white/[0.07] bg-white/[0.025] p-4">
          <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Duração sugerida</div>
          <div className="mt-3 flex items-center gap-2 text-lg font-black text-emerald-300">
            <Clock3 className="h-5 w-5" /> {recommendation.duration}
          </div>
          <div className="my-4 h-px bg-white/[0.06]" />
          <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Tipo</div>
          <div className="mt-2 text-sm font-semibold text-white/85">{recommendation.type}</div>
        </div>
      </div>

      <div className="relative mt-5 grid items-end gap-4 lg:grid-cols-[1fr_225px]">
        <div>
          <SectionLabel>Base da recomendação</SectionLabel>
          <p className="mt-2 text-sm text-slate-300/80">
            Baseado em <span className="font-bold text-white">{history.length || 122} leituras válidas</span> hoje.
          </p>
        </div>
        <button className="flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 px-5 py-3.5 font-black text-black shadow-[0_18px_45px_rgba(34,211,238,0.12)] transition hover:scale-[1.01]">
          Iniciar agora <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </PremiumCard>
  </div>

  <div className="grid gap-3 xl:grid-cols-[1.1fr_0.9fr]">
    <PremiumCard className="p-6">
      <div className="mb-5 flex items-center justify-between">
        <SectionLabel>Evolução do V-Score</SectionLabel>
        <span className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">Atual</span>
      </div>
      <div className="h-[310px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trendData} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="vscoreGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.3} />
                <stop offset="55%" stopColor="#10b981" stopOpacity={0.12} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,.055)" strokeDasharray="4 4" />
            <ReferenceLine y={70} stroke="#d6a756" strokeDasharray="7 5" />
            <ReferenceLine y={avgScore} stroke="rgba(255,255,255,.14)" strokeDasharray="4 4" />
            <XAxis dataKey="time" stroke="rgba(255,255,255,.35)" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis stroke="rgba(255,255,255,.35)" tickLine={false} axisLine={false} fontSize={12} domain={[0, 100]} />
            <Tooltip contentStyle={{ background: "#0b0d0f", border: "1px solid rgba(255,255,255,.12)", borderRadius: 14 }} />
            <Area type="monotone" dataKey="score" stroke="#22d3ee" strokeWidth={3} fill="url(#vscoreGlow)" activeDot={{ r: 6 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-5 text-xs text-slate-400">
        <span className="flex items-center gap-2"><span className="h-1 w-8 rounded-full bg-cyan-300" /> V-Score</span>
        <span className="flex items-center gap-2"><span className="h-1 w-8 rounded-full border-t border-dashed border-amber-300" /> Média pessoal</span>
        <span className="flex items-center gap-2"><span className="h-3 w-7 rounded-md bg-emerald-400/20" /> Zona ideal</span>
      </div>
    </PremiumCard>

    <PremiumCard className="p-4">
      <SectionLabel>Métricas do momento</SectionLabel>
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-4">
        {metrics.map(([Icon, title, value, subtitle, color]) => (
          <div key={title} className="min-h-[118px] rounded-[18px] border border-white/[0.07] bg-white/[0.025] p-4">
            <div className="flex items-center justify-between text-sm font-bold text-slate-400">
              {title}
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <div className={`mt-3 text-3xl font-black ${color}`}>{value}</div>
            <div className="mt-1 text-xs text-slate-400">{subtitle}</div>
          </div>
        ))}
      </div>
    </PremiumCard>
  </div>

  <PremiumCard className="p-4">
    <div className="flex items-center justify-between gap-3">
      <SectionLabel>Insights do momento</SectionLabel>
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Wifi className="h-3.5 w-3.5 text-emerald-300" />
        {refreshing ? "Sincronizando..." : "Sincronizado"}
      </div>
    </div>
    <div className="mt-4 grid gap-3 xl:grid-cols-4">
      {insights.map(([Icon, title, subtitle, color]) => (
        <div key={title} className="flex items-center gap-4 rounded-2xl bg-white/[0.025] p-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/[0.05]">
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
          <div>
            <div className={`font-black ${color}`}>{title}</div>
            <div className="mt-1 text-sm leading-snug text-slate-400">{subtitle}</div>
          </div>
        </div>
      ))}
    </div>
  </PremiumCard>
</div>

); }
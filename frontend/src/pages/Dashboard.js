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
  ShieldCheck,
  TimerReset,
  Clock3,
  HeartPulse,
  Brain,
  ArrowRight,
  Footprints,
  Flame,
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

const topSummary = [
  ["Status", "Normal", "Equilíbrio preservado", ShieldCheck, "text-emerald-400"],
  ["Pontos", "300", "Energia do dia", Zap, "text-amber-400"],
  ["Streak", "1 dia", "Consistência ativa", Flame, "text-orange-400"],
  ["Sync", "Wearables", "Sincronizado agora", Activity, "text-cyan-400"],
  ["Janela", "Agora", "Melhor momento", TimerReset, "text-emerald-400"],
  ["Reavaliação", "3h 12m", "Próxima leitura", Clock3, "text-white"],
];

const trendData = [
  { time: "00:00", score: 82 }, { time: "02:00", score: 80 }, { time: "04:00", score: 81 },
  { time: "05:00", score: 62 }, { time: "06:00", score: 56 }, { time: "08:00", score: 68 },
  { time: "10:00", score: 67 }, { time: "12:00", score: 74 }, { time: "14:00", score: 77 },
  { time: "16:00", score: 84 }, { time: "18:00", score: 79 }, { time: "20:00", score: 93 },
  { time: "22:00", score: 90 }, { time: "24:00", score: 100 },
];

const metrics = [
  [HeartPulse, "BPM", "70", "Normal", "text-emerald-400"],
  [Activity, "HRV", "45", "Excelente", "text-cyan-400"],
  [Droplets, "SpO2", "98%", "Normal", "text-emerald-300"],
  [Moon, "Sono", "7h 32m", "Bom", "text-violet-300"],
  [Footprints, "Passos", "947", "Meta 8k", "text-amber-300"],
  [Timer, "Ativos", "59 min", "Meta 60", "text-violet-300"],
];

const menu = [
  [LayoutDashboard, "Dashboard", true],
  [Activity, "Análise"],
  [TrendingUp, "Tendências"],
  [Repeat, "Rotinas"],
  [Smartphone, "Dispositivos"],
  [FileText, "Relatório"],
  [Settings, "Configurações"],
];

const quick = [
  [Activity, "Estável nas últimas 6h", "Variação mínima", "text-emerald-400"],
  [Brain, "Stress controlado", "Carga ideal", "text-amber-400"],
  [HeartPulse, "HRV preservada", "Boa recuperação", "text-cyan-400"],
  [ShieldCheck, "Janela favorável", "Boa manutenção", "text-emerald-400"],
];

function Card({ children, className = "" }) {
  return <div className={`rounded-3xl border border-white/5 bg-[#0c1013] ${className}`}>{children}</div>;
}

export default function Dashboard() {
  const avgScore = useMemo(() => Math.round(trendData.reduce((a, b) => a + b.score, 0) / trendData.length), []);

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <Navbar />
      <div className="mx-auto max-w-[1540px] px-4 py-4 lg:px-6">
        <div className="grid gap-4 xl:grid-cols-[250px_minmax(0,1fr)]">
          <Card className="p-4">
            <div className="mb-4 flex items-center gap-3 border-b border-white/5 pb-4">
              <div className="rounded-2xl border border-white/5 bg-black p-3"><LayoutDashboard className="h-5 w-5 text-emerald-400" /></div>
              <div><p className="text-xs uppercase tracking-[0.25em] text-white/40">Navegação</p><p className="font-semibold">Painel principal</p></div>
            </div>
            <div className="space-y-2">
              {menu.map(([Icon, label, active]) => (
                <button key={label} className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left ${active ? "border border-emerald-500/20 bg-emerald-500/5" : "hover:bg-white/5"}`}>
                  <Icon className={`h-4 w-4 ${active ? "text-emerald-400" : "text-white/50"}`} />
                  <span className={active ? "font-semibold text-white" : "text-white/70"}>{label}</span>
                </button>
              ))}
            </div>
          </Card>

          <main className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-2"><Crown className="h-4 w-4 text-emerald-400" />Plano Premium Ativo</div>

            <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-6">
              {topSummary.map(([label, value, sub, Icon, tone], i) => (
                <Card key={label} className={`p-4 ${i === 0 ? "border-emerald-500/20 bg-emerald-500/5" : ""}`}>
                  <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-white/40"><Icon className={`h-4 w-4 ${tone}`} />{label}</div>
                  <div className={`text-xl font-bold ${tone}`}>{value}</div>
                  <div className="mt-1 text-xs text-white/60">{sub}</div>
                </Card>
              ))}
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
              <Card className="p-5"><div className="text-xs uppercase tracking-[0.3em] text-white/50">Status Vital</div><div className="mt-4 text-xl font-bold">Resiliência ótima</div><div className="mx-auto my-6 flex h-40 w-40 items-center justify-center rounded-full border-[10px] border-emerald-400"><div className="text-center"><div className="text-5xl font-black">100</div><div className="text-white/60">de 100</div></div></div><div className="mx-auto w-fit rounded-full bg-emerald-500/10 px-4 py-1 text-sm font-semibold tracking-[0.25em] text-emerald-400">NORMAL</div><p className="mt-6 text-center text-white/65">Seu estado fisiológico está excelente e em equilíbrio.</p></Card>
              <Card className="p-5"><div className="mb-4 text-xs uppercase tracking-[0.3em] text-white/50">Leitura Rápida</div><div className="space-y-3">{quick.map(([Icon,t,s,c]) => <div key={t} className="flex gap-3 rounded-2xl bg-white/[0.03] p-3"><div className="rounded-2xl bg-white/5 p-2.5"><Icon className={`h-4 w-4 ${c}`} /></div><div><div className="font-semibold">{t}</div><div className="text-sm text-white/60">{s}</div></div></div>)}</div></Card>
              <Card className="border-emerald-500/10 bg-gradient-to-b from-[#101614] to-[#0d1114] p-5"><div className="mb-4 flex items-center justify-between"><div className="text-xs uppercase tracking-[0.3em] text-white/50">Sugestão Inteligente</div><div className="flex items-center gap-2 rounded-full bg-emerald-500/5 px-3 py-1"><Cpu className="h-4 w-4 text-emerald-400" />VitalFlow AI</div></div><div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-4"><div className="text-xs uppercase tracking-[0.25em] text-emerald-300">Recomendação prioritária</div><div className="mt-2 text-3xl font-bold text-emerald-400">Manutenção positiva</div><p className="mt-3 text-white/80">Mantenha seu estado estável com uma respiração curta de manutenção.</p></div><button className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-4 py-3 font-bold text-black">Iniciar agora <ArrowRight className="h-4 w-4" /></button></Card>
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.45fr_0.55fr]">
              <Card className="p-5"><div className="mb-4 flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-white/50"><TrendingUp className="h-4 w-4 text-emerald-400" />Evolução do V-Score</div><div className="h-[360px]"><ResponsiveContainer width="100%" height="100%"><AreaChart data={trendData}><defs><linearGradient id="vf" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#34d399" stopOpacity={0.35}/><stop offset="100%" stopColor="#34d399" stopOpacity={0}/></linearGradient></defs><CartesianGrid vertical={false} stroke="rgba(255,255,255,.05)" strokeDasharray="4 4" /><ReferenceLine y={70} stroke="#d6a756" strokeDasharray="6 4" /><ReferenceLine y={avgScore} stroke="rgba(255,255,255,.15)" strokeDasharray="4 4" /><XAxis dataKey="time" stroke="rgba(255,255,255,.25)" tickLine={false} axisLine={false} /><YAxis stroke="rgba(255,255,255,.25)" tickLine={false} axisLine={false} domain={[0,100]} /><Tooltip /><Area type="monotone" dataKey="score" stroke="#34d399" strokeWidth={3} fill="url(#vf)" /></AreaChart></ResponsiveContainer></div></Card>
              <Card className="p-5"><div className="mb-4 text-xs uppercase tracking-[0.3em] text-white/50">Métricas do momento</div><div className="grid grid-cols-2 gap-3">{metrics.map(([Icon,t,v,s,c]) => <div key={t} className="rounded-2xl bg-white/[0.03] p-4"><div className="flex items-center justify-between text-sm text-white/60">{t}<Icon className={`h-4 w-4 ${c}`} /></div><div className={`mt-4 text-4xl font-bold ${c}`}>{v}</div><div className="mt-1 text-white/60">{s}</div></div>)}</div></Card>
            </div>

            <div className="grid gap-3 xl:grid-cols-4">{[[CheckCircle2,"Excelente recuperação","Recuperação muito boa","text-emerald-400"],[Star,"Consistência é chave","Mantenha o ritmo","text-amber-400"],[Droplets,"Atenção à hidratação","Ajuste ingestão de água","text-violet-300"],[Target,"Próximo objetivo","Preserve 7h+ de sono","text-rose-400"]].map(([Icon,t,s,c]) => <Card key={t} className="flex items-center gap-3 p-4"><div className="rounded-2xl bg-white/5 p-3"><Icon className={`h-5 w-5 ${c}`} /></div><div><div className="font-semibold">{t}</div><div className="text-sm text-white/60">{s}</div></div></Card>)}</div>
          </main>
        </div>
      </div>
    </div>
  );
}

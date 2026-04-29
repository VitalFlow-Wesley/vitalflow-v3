import React, { useMemo } from "react";
import {
  AreaChart, Area, CartesianGrid, ResponsiveContainer, Tooltip, ReferenceLine, XAxis, YAxis,
} from "recharts";
import {
  Crown, ShieldCheck, TimerReset, Clock3, HeartPulse, Brain, ArrowRight,
  Footprints, Flame, Timer, Moon, Droplets, Target, CheckCircle2, Star, Zap,
  Cpu, Activity, TrendingUp,
} from "lucide-react";

const topSummary = [
  ["Status", "Normal", "Equilíbrio preservado", ShieldCheck, "text-emerald-300"],
  ["Pontos", "300", "Energia do dia", Zap, "text-amber-300"],
  ["Streak", "1 dia", "Consistência ativa", Flame, "text-orange-300"],
  ["Sync", "Wearables", "Sincronizado agora", Activity, "text-cyan-300"],
  ["Janela", "Agora", "Melhor momento", TimerReset, "text-emerald-300"],
  ["Reavaliação", "3h 12m", "Próxima leitura", Clock3, "text-white"],
];
const trendData = [{ time: "00:00", score: 82 },{ time: "02:00", score: 80 },{ time: "04:00", score: 81 },{ time: "05:00", score: 62 },{ time: "06:00", score: 56 },{ time: "08:00", score: 68 },{ time: "10:00", score: 67 },{ time: "12:00", score: 74 },{ time: "14:00", score: 77 },{ time: "16:00", score: 84 },{ time: "18:00", score: 79 },{ time: "20:00", score: 93 },{ time: "22:00", score: 90 },{ time: "24:00", score: 100 }];
const metrics = [[HeartPulse,"BPM","70","Normal","text-emerald-300"],[Activity,"HRV","45","Excelente","text-cyan-300"],[Droplets,"SpO2","98%","Normal","text-emerald-200"],[Moon,"Sono","7h 32m","Bom","text-violet-300"],[Footprints,"Passos","947","Meta 8k","text-amber-300"],[Timer,"Ativos","59 min","Meta 60","text-violet-300"]];
const quick = [[Activity,"Estável nas últimas 6h","Variação mínima","text-emerald-300"],[Brain,"Stress controlado","Carga ideal","text-amber-300"],[HeartPulse,"HRV preservada","Boa recuperação","text-cyan-300"],[ShieldCheck,"Janela favorável","Boa manutenção","text-emerald-300"]];
const insights = [[CheckCircle2,"Excelente recuperação","Recuperação muito boa","text-emerald-300"],[Star,"Consistência é chave","Mantenha o ritmo","text-amber-300"],[Droplets,"Atenção à hidratação","Ajuste ingestão de água","text-violet-300"],[Target,"Próximo objetivo","Preserve 7h+ de sono","text-rose-300"]];

function Card({ children, className = "" }) { return <div className={`rounded-3xl border border-white/[0.06] bg-[#0d0f12] shadow-[0_0_0_1px_rgba(255,255,255,0.02)] ${className}`}>{children}</div>; }

export default function Dashboard() {
  const avgScore = useMemo(() => Math.round(trendData.reduce((a, b) => a + b.score, 0) / trendData.length), []);
  return <div className="space-y-4">
    <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/15 bg-cyan-400/[0.06] px-4 py-2"><Crown className="h-4 w-4 text-cyan-300" />Plano Premium Ativo</div>
    <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-6">{topSummary.map(([l,v,s,I,t],i)=><Card key={l} className={`p-4 ${i===0?"border-cyan-400/15 bg-cyan-400/[0.04]":""}`}><div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-white/35"><I className={`h-4 w-4 ${t}`} />{l}</div><div className={`text-xl font-bold ${t}`}>{v}</div><div className="mt-1 text-xs text-white/55">{s}</div></Card>)}</div>
    <div className="grid gap-4 xl:grid-cols-3">
      <Card className="p-5"><div className="text-xs uppercase tracking-[0.3em] text-white/45">Status Vital</div><div className="mt-4 text-xl font-bold">Resiliência ótima</div><div className="mx-auto my-6 flex h-40 w-40 items-center justify-center rounded-full border-[10px] border-emerald-400"><div className="text-center"><div className="text-5xl font-black">100</div><div className="text-white/60">de 100</div></div></div><div className="mx-auto w-fit rounded-full bg-emerald-500/10 px-4 py-1 text-sm font-semibold tracking-[0.25em] text-emerald-300">NORMAL</div><p className="mt-6 text-center text-white/65">Seu estado fisiológico está excelente e em equilíbrio.</p></Card>
      <Card className="p-5"><div className="mb-4 text-xs uppercase tracking-[0.3em] text-white/45">Leitura Rápida</div><div className="space-y-3">{quick.map(([I,t,s,c])=><div key={t} className="flex gap-3 rounded-2xl bg-white/[0.03] p-3"><div className="rounded-2xl bg-white/5 p-2.5"><I className={`h-4 w-4 ${c}`} /></div><div><div className="font-semibold">{t}</div><div className="text-sm text-white/55">{s}</div></div></div>)}</div></Card>
      <Card className="border-cyan-400/10 bg-gradient-to-b from-[#101514] to-[#0d1012] p-5"><div className="mb-4 flex items-center justify-between"><div className="text-xs uppercase tracking-[0.3em] text-white/45">Sugestão Inteligente</div><div className="flex items-center gap-2 rounded-full bg-cyan-400/5 px-3 py-1"><Cpu className="h-4 w-4 text-cyan-300" />VitalFlow AI</div></div><div className="rounded-3xl border border-cyan-400/15 bg-cyan-400/[0.05] p-4"><div className="text-xs uppercase tracking-[0.25em] text-cyan-200">Recomendação prioritária</div><div className="mt-2 text-3xl font-bold text-emerald-300">Manutenção positiva</div><p className="mt-3 text-white/80">Mantenha seu estado estável com uma respiração curta de manutenção.</p></div><button className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-emerald-400 px-4 py-3 font-bold text-black">Iniciar agora <ArrowRight className="h-4 w-4" /></button></Card>
    </div>
    <div className="grid gap-4 xl:grid-cols-[1.45fr_0.55fr]">
      <Card className="p-5"><div className="mb-4 flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-white/45"><TrendingUp className="h-4 w-4 text-cyan-300" />Evolução do V-Score</div><div className="h-[360px]"><ResponsiveContainer width="100%" height="100%"><AreaChart data={trendData}><defs><linearGradient id="vf" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#22d3ee" stopOpacity={0.28}/><stop offset="100%" stopColor="#22d3ee" stopOpacity={0}/></linearGradient></defs><CartesianGrid vertical={false} stroke="rgba(255,255,255,.05)" strokeDasharray="4 4" /><ReferenceLine y={70} stroke="#d6a756" strokeDasharray="6 4" /><ReferenceLine y={avgScore} stroke="rgba(255,255,255,.12)" strokeDasharray="4 4" /><XAxis dataKey="time" stroke="rgba(255,255,255,.22)" tickLine={false} axisLine={false} /><YAxis stroke="rgba(255,255,255,.22)" tickLine={false} axisLine={false} domain={[0,100]} /><Tooltip /><Area type="monotone" dataKey="score" stroke="#22d3ee" strokeWidth={3} fill="url(#vf)" /></AreaChart></ResponsiveContainer></div></Card>
      <Card className="p-5"><div className="mb-4 text-xs uppercase tracking-[0.3em] text-white/45">Métricas do momento</div><div className="grid grid-cols-2 gap-3">{metrics.map(([I,t,v,s,c])=><div key={t} className="rounded-2xl bg-white/[0.03] p-4"><div className="flex items-center justify-between text-sm text-white/55">{t}<I className={`h-4 w-4 ${c}`} /></div><div className={`mt-4 text-4xl font-bold ${c}`}>{v}</div><div className="mt-1 text-white/55">{s}</div></div>)}</div></Card>
    </div>
    <div className="grid gap-3 xl:grid-cols-4">{insights.map(([I,t,s,c])=><Card key={t} className="flex items-center gap-3 p-4"><div className="rounded-2xl bg-white/5 p-3"><I className={`h-5 w-5 ${c}`} /></div><div><div className="font-semibold">{t}</div><div className="text-sm text-white/55">{s}</div></div></Card>)}</div>
  </div>;
}

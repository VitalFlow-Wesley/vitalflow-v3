import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, BedDouble, Brain, Flame, RotateCcw, Save, Shield, Sparkles, TrendingUp, Zap } from "lucide-react";
import { saveActiveSimulation, scoreFromVitals, toneFromScore } from "../utils/simulationData";

const scenarios = [
  {
    id: "ideal",
    label: "Dia ideal",
    description: "Sono bom, HRV preservada e stress baixo.",
    values: { bpm: 64, hrv: 72, sleep: 8.1, stress: 10, steps: 9400, spo2: 99 },
  },
  {
    id: "maintenance",
    label: "Manutencao",
    description: "Estado estavel para manter consistencia.",
    values: { bpm: 66, hrv: 54, sleep: 7.3, stress: 32, steps: 5200, spo2: 98 },
  },
  {
    id: "overload",
    label: "Sobrecarga",
    description: "Stress alto, HRV baixa e recuperacao parcial.",
    values: { bpm: 96, hrv: 31, sleep: 5, stress: 48, steps: 2600, spo2: 96 },
  },
  {
    id: "badSleep",
    label: "Sono ruim",
    description: "Janela de sono curta com impacto cognitivo.",
    values: { bpm: 72, hrv: 39, sleep: 4.8, stress: 58, steps: 4100, spo2: 97 },
  },
  {
    id: "training",
    label: "Treino intenso",
    description: "Carga fisica alta pedindo recuperacao.",
    values: { bpm: 86, hrv: 38, sleep: 4.3, stress: 16, steps: 14300, spo2: 98 },
  },
  {
    id: "recovery",
    label: "Recuperacao",
    description: "Sinais voltando ao equilibrio apos queda.",
    values: { bpm: 64, hrv: 60, sleep: 7.8, stress: 18, steps: 6200, spo2: 99 },
  },
];

const toneCopy = {
  normal: {
    label: "Normal",
    color: "text-emerald-300",
    border: "border-emerald-400/40 bg-emerald-400/10",
    risk: "Baixo",
    driver: "Equilibrio fisiologico",
    preview: "Manter rotina e consistencia. Sugestoes leves devem permanecer ativas.",
  },
  manutencao: {
    label: "Manutencao",
    color: "text-emerald-300",
    border: "border-emerald-400/35 bg-emerald-400/10",
    risk: "Moderado",
    driver: "Equilibrio fisiologico",
    preview: "Reduzir carga e priorizar recuperacao nas proximas 24h sem bloquear o dia.",
  },
  atencao: {
    label: "Atencao",
    color: "text-yellow-300",
    border: "border-yellow-400/45 bg-yellow-400/10",
    risk: "Elevado",
    driver: "Sobrecarga acumulada",
    preview: "Exibir alerta preventivo, reduzir intensidade das sugestoes e reforcar recuperacao.",
  },
  critico: {
    label: "Critico",
    color: "text-rose-300",
    border: "border-rose-400/45 bg-rose-400/10",
    risk: "Alto",
    driver: "Sono insuficiente",
    preview: "Bloquear sugestoes intensas e recomendar pausa, sono e recuperacao imediata.",
  },
};

const controls = [
  { key: "bpm", label: "BPM repouso", unit: "bpm", min: 45, max: 120, icon: Activity },
  { key: "hrv", label: "HRV", unit: "ms", min: 20, max: 90, icon: TrendingUp },
  { key: "sleep", label: "Sono", unit: "h", min: 3, max: 9, step: 0.1, icon: BedDouble },
  { key: "stress", label: "Stress", unit: "%", min: 0, max: 100, icon: Zap },
  { key: "steps", label: "Passos", unit: "", min: 0, max: 16000, step: 100, icon: Sparkles },
  { key: "spo2", label: "SpO2", unit: "%", min: 90, max: 100, icon: Shield },
];

export default function Simulador() {
  const navigate = useNavigate();
  const [activeId, setActiveId] = useState("maintenance");
  const activeScenario = scenarios.find((scenario) => scenario.id === activeId) || scenarios[1];
  const [values, setValues] = useState(activeScenario.values);

  const result = useMemo(() => {
    const score = scoreFromVitals(values);
    const tone = toneFromScore(score);
    const confidence = Math.max(42, Math.min(96, Math.round(72 + score * 0.18 - Math.abs(values.stress - 20) * 0.15)));
    return { score, tone, confidence };
  }, [values]);

  const tone = toneCopy[result.tone] || toneCopy.manutencao;

  useEffect(() => {
    saveActiveSimulation({ scenario: activeScenario, values, result });
  }, [activeScenario, values, result]);

  const selectScenario = (scenario) => {
    setActiveId(scenario.id);
    setValues(scenario.values);
    saveActiveSimulation({ scenario, values: scenario.values, result: { score: scoreFromVitals(scenario.values), tone: toneFromScore(scoreFromVitals(scenario.values)) } });
  };

  const updateValue = (key, value) => {
    setValues((current) => ({ ...current, [key]: Number(value) }));
  };

  const applyToDashboard = () => {
    saveActiveSimulation({ scenario: activeScenario, values, result });
    navigate("/");
  };

  const resetScenario = () => selectScenario(scenarios[1]);

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white lg:px-12">
      <section className="mx-auto max-w-[1720px] space-y-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-3 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-5 py-2 text-xs font-black uppercase tracking-[0.35em] text-cyan-200">
              <Sparkles className="h-4 w-4" /> Ambiente de teste
            </span>
            <div>
              <h1 className="text-4xl font-black tracking-tight md:text-6xl">Laboratorio de Simulacoes</h1>
              <p className="mt-4 max-w-4xl text-xl leading-relaxed text-slate-300">
                Teste cenarios fisiologicos como se viessem do Google Fit. O cenario salvo alimenta Dashboard, relatorio e regras visuais.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <button type="button" onClick={resetScenario} className="inline-flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-6 py-4 text-lg font-bold transition hover:border-cyan-300/40">
              <RotateCcw className="h-5 w-5" /> Resetar cenario
            </button>
            <button type="button" onClick={applyToDashboard} className="inline-flex items-center gap-3 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 px-7 py-4 text-lg font-black text-black transition hover:scale-[1.01]">
              <Save className="h-5 w-5" /> Aplicar no dashboard
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-5 py-4 font-bold text-emerald-200">
          Simulacao salva localmente. Ela fica separada dos dados reais do usuario e simula uma sincronizacao Google.
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          {scenarios.map((scenario) => (
            <button
              key={scenario.id}
              type="button"
              onClick={() => selectScenario(scenario)}
              className={`rounded-2xl border p-6 text-left transition hover:-translate-y-1 hover:border-cyan-300/40 ${activeId === scenario.id ? tone.border : "border-white/10 bg-[#0b0d0f]"}`}
            >
              <h2 className="text-xl font-black">{scenario.label}</h2>
              <p className="mt-4 text-base leading-relaxed text-blue-200/80">{scenario.description}</p>
            </button>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-2xl border border-cyan-400/20 bg-[#061011] p-7">
            <div className="mb-7 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-black uppercase tracking-[0.45em] text-cyan-200">Controles da simulacao</h2>
                <p className="mt-3 text-lg text-blue-200/80">Ajuste os sinais e veja o impacto calculado em tempo real.</p>
              </div>
              <span className={`rounded-full border px-4 py-2 text-sm font-black ${tone.border}`}>{activeScenario.label}</span>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {controls.map(({ key, label, unit, min, max, step = 1, icon: Icon }) => (
                <label key={key} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                  <span className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-3 text-lg font-black text-blue-100">
                      <Icon className="h-5 w-5 text-cyan-300" /> {label}
                    </span>
                    <strong className="text-2xl">{values[key]} {unit}</strong>
                  </span>
                  <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={values[key]}
                    onChange={(event) => updateValue(key, event.target.value)}
                    className="mt-8 w-full accent-cyan-400"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className={`rounded-2xl border p-7 ${tone.border}`}>
            <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-lg font-black uppercase tracking-[0.45em] text-cyan-200">Resultado simulado</h2>
                <div className="mt-8 text-7xl font-black">{result.score}</div>
                <div className={`mt-1 text-3xl font-black ${tone.color}`}>{tone.label}</div>
              </div>
              <div className="grid h-44 w-44 place-items-center rounded-full border-[14px] border-emerald-400 text-center">
                <div>
                  <div className="text-4xl font-black">{result.confidence}%</div>
                  <div className="text-sm font-bold text-blue-200/80">confianca</div>
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-black/20 p-5">
                <div className="text-xs font-black uppercase tracking-[0.35em] text-blue-300/70">Risco</div>
                <div className="mt-3 text-2xl font-black">{tone.risk}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-5">
                <div className="text-xs font-black uppercase tracking-[0.35em] text-blue-300/70">Driver</div>
                <div className="mt-3 text-2xl font-black">{tone.driver}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-5">
                <div className="text-xs font-black uppercase tracking-[0.35em] text-blue-300/70">Destino</div>
                <div className="mt-3 text-2xl font-black">Dashboard + relatorio</div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#0b0d0f] p-7">
          <h2 className="text-lg font-black uppercase tracking-[0.45em] text-cyan-200">Preview da IA</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
              <div className="flex items-center gap-4 text-2xl font-black"><Brain className="h-6 w-6 text-cyan-300" /> Recomendacao sugerida</div>
              <p className="mt-4 text-lg leading-relaxed text-blue-100/80">{tone.preview}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
              <div className="flex items-center gap-4 text-2xl font-black"><Flame className="h-6 w-6 text-yellow-300" /> Como deve aparecer</div>
              <p className="mt-4 text-lg leading-relaxed text-blue-100/80">Ao voltar para o Dashboard, o score, status, metricas e cor principal devem refletir este cenario.</p>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

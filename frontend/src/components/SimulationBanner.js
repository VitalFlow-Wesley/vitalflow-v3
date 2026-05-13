import { FlaskConical, X } from "lucide-react";
import { useSimulation } from "../contexts/SimulationContext";

export function SimulationBanner() {
  const { isSimulating, simulation, getSimulatedApiData, clearSimulation } = useSimulation();

  if (!isSimulating) return null;

  const data = getSimulatedApiData?.();
  const label = data?.scenarioLabel || simulation?.scenario?.label || "cenario ativo";
  const status = data?.statusLabel || data?.status || "simulado";

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex max-w-[calc(100vw-32px)] items-center gap-3 rounded-xl border border-cyan-400/30 bg-[#061317]/95 px-4 py-3 text-sm text-white shadow-2xl shadow-cyan-500/10 backdrop-blur">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-300">
        <FlaskConical className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <strong className="block text-cyan-200">Simulacao ativa</strong>
        <span className="block truncate text-slate-300">{label} · {status}</span>
      </span>
      <button
        type="button"
        onClick={clearSimulation}
        className="ml-1 rounded-lg border border-white/10 p-2 text-slate-300 transition hover:border-cyan-300/40 hover:text-white"
        aria-label="Encerrar simulacao"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export default SimulationBanner;

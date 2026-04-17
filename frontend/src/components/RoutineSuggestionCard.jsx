import { useMemo, useState } from "react";
import {
  getInitialRoutine,
  evaluateResponse,
  getNextRoutine,
  getRoutineFeedback,
} from "../utils/routineEngine";

function toneClasses(tone) {
  if (tone === "red") {
    return {
      badge: "bg-red-500/10 text-red-300 border border-red-500/30",
      button: "bg-red-500 hover:bg-red-400 text-white",
      panel: "bg-red-500/10 border border-red-500/20",
    };
  }

  if (tone === "yellow") {
    return {
      badge: "bg-yellow-500/10 text-yellow-300 border border-yellow-500/30",
      button: "bg-yellow-500 hover:bg-yellow-400 text-black",
      panel: "bg-yellow-500/10 border border-yellow-500/20",
    };
  }

  return {
    badge: "bg-green-500/10 text-green-300 border border-green-500/30",
    button: "bg-green-500 hover:bg-green-400 text-black",
    panel: "bg-green-500/10 border border-green-500/20",
  };
}

export default function RoutineSuggestionCard({
  currentData,
  previousData,
  onStartRoutine,
}) {
  const [result, setResult] = useState(null);
  const [currentRoutine, setCurrentRoutine] = useState(null);

  const initialRoutine = useMemo(() => getInitialRoutine(currentData), [currentData]);

  const activeRoutine = currentRoutine || initialRoutine;
  const feedback = result ? getRoutineFeedback(result) : null;

  const tone =
    result === "worse"
      ? "red"
      : result === "insufficient"
      ? "yellow"
      : activeRoutine?.tipo === "maintenance"
      ? "green"
      : "green";

  const styles = toneClasses(tone);

  const estadoAtual = useMemo(() => {
    const stress = Number(currentData?.stress ?? 0);
    const vScore = Number(currentData?.v_score ?? 0);

    if (stress >= 75 || vScore <= 55) return "Atenção elevada";
    if (stress >= 55 || vScore <= 75) return "Monitoramento";
    return "Estado estável";
  }, [currentData]);

  const handleStart = () => {
    onStartRoutine?.(activeRoutine, {
      before: currentData,
      previous: previousData,
    });
  };

  const handleSimulateRecheck = () => {
    if (!previousData || !currentData) return;

    const evaluation = evaluateResponse(previousData, currentData);
    setResult(evaluation);

    const nextRoutine = getNextRoutine(activeRoutine.id, evaluation);
    if (nextRoutine) {
      setCurrentRoutine(nextRoutine);
    }
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-[#0f172a] to-[#020617] p-5 xl:p-6 shadow-[0_0_30px_rgba(34,197,94,0.10)]">
      <div className="flex flex-col items-center text-center">
        <div className={`mb-4 rounded-full px-4 py-1 text-sm font-medium ${styles.badge}`}>
          Estado atual
        </div>

        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5 text-2xl">
          ✓
        </div>

        <h3 className="mb-2 text-xl font-semibold text-white">
          {feedback?.cta ? activeRoutine.titulo : activeRoutine.titulo}
        </h3>

        <div className={`mb-4 w-full rounded-2xl p-4 text-left ${styles.panel}`}>
          <p className="mb-1 text-sm text-white/90">{estadoAtual}</p>
          <p className="text-sm text-white/70">
            {feedback ? feedback.descricao : activeRoutine.descricao}
          </p>
        </div>

        <div className="mb-6 flex items-center gap-2 text-sm text-neutral-300">
          <span>⏱</span>
          <span>{activeRoutine.duracao} minutos</span>
        </div>

        <button
          onClick={handleStart}
          className={`w-full rounded-2xl py-3 font-semibold transition hover:scale-[1.01] active:scale-[0.99] ${styles.button}`}
        >
          {feedback?.cta || activeRoutine.acao}
        </button>

        <button
          onClick={handleSimulateRecheck}
          className="mt-3 text-sm text-neutral-400 underline underline-offset-4"
        >
          Simular reavaliação
        </button>
      </div>
    </div>
  );
}
import { useEffect, useMemo, useState } from "react";

export default function RoutineExecutionModal({
  open,
  routine,
  onClose,
  onComplete,
}) {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [phaseSecondsLeft, setPhaseSecondsLeft] = useState(4);

  const breathingPhases = useMemo(
    () => [
      { label: "Inspire", seconds: 4, scale: 1.18 },
      { label: "Segure", seconds: 4, scale: 1.18 },
      { label: "Expire", seconds: 4, scale: 0.9 },
      { label: "Segure", seconds: 4, scale: 0.9 },
    ],
    []
  );

  const currentPhase = breathingPhases[phaseIndex];

  const getTheme = (status) => {
    switch (status) {
      case "critico":
        return {
          border: "border-red-500/30",
          glow: "shadow-[0_0_40px_rgba(239,68,68,0.22)]",
          progress: "bg-red-500",
          button: "bg-red-500 hover:bg-red-400 text-black",
          title: "text-red-300",
          time: "text-red-200",
          orb: "bg-red-500/20 border-red-400/30",
          orbCore: "bg-red-400/70",
          instruction: "text-red-200",
        };
      case "atencao":
        return {
          border: "border-yellow-500/30",
          glow: "shadow-[0_0_40px_rgba(234,179,8,0.22)]",
          progress: "bg-yellow-400",
          button: "bg-yellow-400 hover:bg-yellow-300 text-black",
          title: "text-yellow-300",
          time: "text-yellow-200",
          orb: "bg-yellow-500/20 border-yellow-400/30",
          orbCore: "bg-yellow-400/70",
          instruction: "text-yellow-200",
        };
      default:
        return {
          border: "border-emerald-500/30",
          glow: "shadow-[0_0_40px_rgba(16,185,129,0.22)]",
          progress: "bg-emerald-400",
          button: "bg-emerald-400 hover:bg-emerald-300 text-black",
          title: "text-emerald-300",
          time: "text-emerald-200",
          orb: "bg-emerald-500/20 border-emerald-400/30",
          orbCore: "bg-emerald-400/70",
          instruction: "text-emerald-200",
        };
    }
  };

  const theme = getTheme(routine?.status);

  useEffect(() => {
    if (!open || !routine) return;

    const duration =
      Number(routine.duration_minutes) ||
      Number(routine.duracao) ||
      5;

    const total = duration * 60;

    setSecondsLeft(total);
    setTotalTime(total);
    setPhaseIndex(0);
    setPhaseSecondsLeft(breathingPhases[0].seconds);
  }, [open, routine, breathingPhases]);

  useEffect(() => {
    if (!open || secondsLeft <= 0) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));

      setPhaseSecondsLeft((prev) => {
        if (prev > 1) return prev - 1;

        const nextIndex = (phaseIndex + 1) % breathingPhases.length;
        setPhaseIndex(nextIndex);
        return breathingPhases[nextIndex].seconds;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [open, secondsLeft, phaseIndex, breathingPhases]);

  useEffect(() => {
  if (!open) return;

  if (secondsLeft === 0 && totalTime > 0) {
    onComplete?.(routine);
    onClose?.();
  }
}, [secondsLeft, totalTime, open, onComplete, onClose, routine]);

  if (!open || !routine) return null;

  const safe = Number(secondsLeft) || 0;
  const minutes = String(Math.floor(safe / 60)).padStart(2, "0");
  const seconds = String(safe % 60).padStart(2, "0");

  const progress =
    totalTime > 0 ? ((totalTime - secondsLeft) / totalTime) * 100 : 0;

  const circleStyle = {
    transform: `scale(${currentPhase?.scale || 1})`,
    transition: "transform 1s ease-in-out",
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div
        className={`w-full max-w-lg rounded-3xl border bg-neutral-950/90 backdrop-blur-xl p-6 text-white ${theme.border} ${theme.glow}`}
      >
        <div className="text-center mb-5">
          <p className="text-xs uppercase tracking-[0.18em] text-neutral-400 font-bold">
            Rotina em andamento
          </p>

          <h2 className={`text-2xl font-black mt-2 ${theme.title || "text-white"}`}>
            {routine.title || routine.titulo || "Rotina guiada"}
          </h2>
        </div>

        <div className="flex flex-col items-center mb-5">
          <div
            className={`w-28 h-28 rounded-full border flex items-center justify-center ${theme.orb}`}
            style={circleStyle}
          >
            <div
              className={`w-16 h-16 rounded-full ${theme.orbCore} blur-[1px]`}
            />
          </div>

          <p className={`mt-4 text-lg font-bold ${theme.instruction}`}>
            {currentPhase?.label}
          </p>

          <p className="text-sm text-neutral-400 mt-1">
            {phaseSecondsLeft}s nesta etapa
          </p>
        </div>

        <div className="mb-4 text-center">
          <p className="text-sm text-neutral-300">Tempo restante</p>

          <p className={`text-5xl font-black tracking-widest mt-2 ${theme.time}`}>
            {minutes}:{seconds}
          </p>
        </div>

        <div className="w-full h-2 bg-white/10 rounded-full mb-6 overflow-hidden">
          <div
            className={`h-full ${theme.progress} transition-all duration-1000`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="grid grid-cols-4 gap-2 mb-6">
          {breathingPhases.map((phase, index) => {
            const active = index === phaseIndex;
            return (
              <div
                key={phase.label + index}
                className={`rounded-xl border px-2 py-3 text-center text-xs font-semibold transition-all ${
                  active
                    ? `${theme.border} bg-white/5 ${theme.title}`
                    : "border-white/10 text-neutral-500"
                }`}
              >
                {phase.label}
              </div>
            );
          })}
        </div>

        <p className="text-center text-sm text-neutral-300 mb-6 leading-6">
          {routine.description ||
            routine.descricao ||
            "Siga a orientação visual e acompanhe a respiração para recuperar seu estado."}
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-2xl border border-white/10 py-3 text-neutral-300 hover:bg-white/5 transition"
          >
            Fechar
          </button>

          <button
            onClick={() => onComplete?.(routine)}
            className={`flex-1 rounded-2xl py-3 font-semibold transition ${theme.button}`}
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
}
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
  const [finished, setFinished] = useState(false);

  const breathingPhases = useMemo(
    () => [
      {
        label: "Inspire",
        instruction: "Inspire lentamente pelo nariz",
        seconds: 4,
        scale: 1.22,
      },
      {
        label: "Segure",
        instruction: "Segure sem tensionar o corpo",
        seconds: 4,
        scale: 1.22,
      },
      {
        label: "Expire",
        instruction: "Expire devagar pela boca",
        seconds: 4,
        scale: 0.88,
      },
      {
        label: "Segure",
        instruction: "Mantenha o ritmo e prepare a próxima respiração",
        seconds: 4,
        scale: 0.88,
      },
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
          orb: "bg-red-500/12 border-red-400/30",
          orbCore: "bg-red-400",
          instruction: "text-red-200",
          activeStep: "border-red-500/30 bg-red-500/10 text-red-300",
          badge: "border-red-500/20 bg-red-500/10 text-red-300",
        };
      case "atencao":
        return {
          border: "border-yellow-500/30",
          glow: "shadow-[0_0_40px_rgba(234,179,8,0.22)]",
          progress: "bg-yellow-400",
          button: "bg-yellow-400 hover:bg-yellow-300 text-black",
          title: "text-yellow-300",
          time: "text-yellow-200",
          orb: "bg-yellow-500/12 border-yellow-400/30",
          orbCore: "bg-yellow-400",
          instruction: "text-yellow-200",
          activeStep: "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
          badge: "border-yellow-500/20 bg-yellow-500/10 text-yellow-300",
        };
      default:
        return {
          border: "border-emerald-500/30",
          glow: "shadow-[0_0_40px_rgba(16,185,129,0.22)]",
          progress: "bg-emerald-400",
          button: "bg-emerald-400 hover:bg-emerald-300 text-black",
          title: "text-emerald-300",
          time: "text-emerald-200",
          orb: "bg-emerald-500/12 border-emerald-400/30",
          orbCore: "bg-emerald-400",
          instruction: "text-emerald-200",
          activeStep: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
          badge: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
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
    setFinished(false);
  }, [open, routine, breathingPhases]);

  useEffect(() => {
    if (!open || secondsLeft <= 0 || finished) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        const next = prev > 0 ? prev - 1 : 0;
        if (next === 0) {
          setFinished(true);
        }
        return next;
      });

      setPhaseSecondsLeft((prev) => {
        if (prev > 1) return prev - 1;

        const nextIndex = (phaseIndex + 1) % breathingPhases.length;
        setPhaseIndex(nextIndex);
        return breathingPhases[nextIndex].seconds;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [open, secondsLeft, phaseIndex, breathingPhases, finished]);

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

  const finishRoutine = () => {
    setFinished(true);
  };

  const closeAndComplete = () => {
    onComplete?.(routine);
    onClose?.();
  };

  const estimatedImpact = (() => {
    switch (routine?.status) {
      case "critico":
        return {
          recovery: "+12%",
          stress: "-8%",
          points: "+20 energia",
          message: "Seu estado começou a responder à rotina de recuperação.",
        };
      case "atencao":
        return {
          recovery: "+8%",
          stress: "-5%",
          points: "+15 energia",
          message: "Há sinais iniciais de estabilização no seu estado atual.",
        };
      default:
        return {
          recovery: "+5%",
          stress: "-3%",
          points: "+10 energia",
          message: "Você reforçou sua consistência e manteve um bom equilíbrio.",
        };
    }
  })();

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div
        className={`w-full max-w-lg rounded-3xl border bg-neutral-950/90 backdrop-blur-xl p-6 text-white ${theme.border} ${theme.glow}`}
      >
        {!finished ? (
          <>
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
                className={`relative w-32 h-32 rounded-full border flex items-center justify-center ${theme.orb}`}
                style={circleStyle}
              >
                <div className="absolute inset-3 rounded-full border border-white/5" />
                <div className={`w-16 h-16 rounded-full ${theme.orbCore} blur-[1px]`} />
              </div>

              <p className={`mt-5 text-2xl font-black ${theme.instruction}`}>
                {currentPhase?.label}
              </p>

              <p className="text-sm text-neutral-400 mt-1">
                {phaseSecondsLeft}s nesta etapa
              </p>

              <p className="text-sm text-neutral-300 mt-3">
                {currentPhase?.instruction}
              </p>
            </div>

            <div className="mb-4 text-center">
              <p className="text-sm text-neutral-300">Tempo restante</p>

              <p
                className={`text-5xl font-black tracking-widest mt-2 ${theme.time}`}
                style={{ transition: "all 0.3s ease" }}
              >
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
                        ? theme.activeStep
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
                onClick={finishRoutine}
                className={`flex-1 rounded-2xl py-3 font-semibold transition ${theme.button}`}
              >
                Concluir
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="text-center mb-6">
              <p className="text-xs uppercase tracking-[0.18em] text-neutral-400 font-bold">
                Rotina concluída
              </p>

              <h2 className={`text-2xl font-black mt-2 ${theme.title}`}>
                {routine.title || routine.titulo || "Rotina finalizada"}
              </h2>

              <div
                className={`mt-4 inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold border ${theme.badge}`}
              >
                Impacto estimado registrado
              </div>
            </div>

            <div className={`rounded-2xl border p-4 mb-5 bg-neutral-950/40 ${theme.border}`}>
              <p className="text-neutral-200 text-sm leading-6 text-center">
                {estimatedImpact.message}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className={`rounded-2xl border p-4 text-center bg-neutral-950/40 ${theme.border}`}>
                <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500 mb-2">
                  Recovery
                </p>
                <p className={`text-xl font-black ${theme.title}`}>
                  {estimatedImpact.recovery}
                </p>
              </div>

              <div className={`rounded-2xl border p-4 text-center bg-neutral-950/40 ${theme.border}`}>
                <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500 mb-2">
                  Stress
                </p>
                <p className={`text-xl font-black ${theme.title}`}>
                  {estimatedImpact.stress}
                </p>
              </div>

              <div className={`rounded-2xl border p-4 text-center bg-neutral-950/40 ${theme.border}`}>
                <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500 mb-2">
                  Energia
                </p>
                <p className={`text-xl font-black ${theme.title}`}>
                  {estimatedImpact.points}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 rounded-2xl border border-white/10 py-3 text-neutral-300 hover:bg-white/5 transition"
              >
                Fechar
              </button>

              <button
                onClick={closeAndComplete}
                className={`flex-1 rounded-2xl py-3 font-semibold transition ${theme.button}`}
              >
                Voltar ao painel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
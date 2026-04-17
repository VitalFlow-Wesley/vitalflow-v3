import { useEffect, useState } from "react";

export default function RoutineExecutionModal({
  open,
  routine,
  onClose,
  onComplete,
}) {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(0);

  // 🎨 tema baseado no estado
  const getTheme = (status) => {
    switch (status) {
      case "critico":
        return {
          border: "border-red-500/30",
          glow: "shadow-[0_0_40px_rgba(239,68,68,0.25)]",
          progress: "bg-red-500",
          button: "bg-red-500 hover:bg-red-400 text-black",
        };
      case "atencao":
        return {
          border: "border-yellow-500/30",
          glow: "shadow-[0_0_40px_rgba(234,179,8,0.25)]",
          progress: "bg-yellow-400",
          button: "bg-yellow-400 hover:bg-yellow-300 text-black",
        };
      default:
        return {
          border: "border-emerald-500/30",
          glow: "shadow-[0_0_40px_rgba(16,185,129,0.25)]",
          progress: "bg-emerald-400",
          button: "bg-emerald-400 hover:bg-emerald-300 text-black",
        };
    }
  };

  const theme = getTheme(routine?.status);

  // ⏱️ inicia tempo
  useEffect(() => {
    if (!open || !routine) return;

    const duration =
      Number(routine.duration_minutes) ||
      Number(routine.duracao) ||
      5;

    const total = duration * 60;

    setSecondsLeft(total);
    setTotalTime(total);
  }, [open, routine]);

  // ⏳ contador
  useEffect(() => {
    if (!open || secondsLeft <= 0) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [open, secondsLeft]);

  if (!open || !routine) return null;

  // 🧠 formatação
  const safe = Number(secondsLeft) || 0;
  const minutes = String(Math.floor(safe / 60)).padStart(2, "0");
  const seconds = String(safe % 60).padStart(2, "0");

  // 📊 progresso
  const progress =
    totalTime > 0 ? ((totalTime - secondsLeft) / totalTime) * 100 : 0;

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div
        className={`w-full max-w-md rounded-3xl border p-6 bg-neutral-950/80 backdrop-blur-xl ${theme.border} ${theme.glow}`}
      >
        {/* Header */}
        <div className="text-center mb-5">
          <p className="text-xs uppercase tracking-wider text-neutral-400">
            Rotina em andamento
          </p>
          <h2 className="text-xl font-bold mt-1">
            {routine.title || routine.titulo}
          </h2>
        </div>

        {/* Timer */}
        <div className="mb-4 text-center">
          <p className="text-sm text-neutral-400">Tempo restante</p>

          <p className="text-5xl font-black tracking-widest mt-2">
            {minutes}:{seconds}
          </p>
        </div>

        {/* Barra de progresso */}
        <div className="w-full h-2 bg-white/10 rounded-full mb-6 overflow-hidden">
          <div
            className={`h-full ${theme.progress} transition-all duration-1000`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Descrição */}
        <p className="text-center text-sm text-neutral-300 mb-6">
          {routine.description || routine.descricao}
        </p>

        {/* Botões */}
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
import { useEffect, useState } from "react";

export default function RoutineExecutionModal({
  open,
  routine,
  onClose,
  onComplete,
}) {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (!open || !routine) return;
    setSecondsLeft(routine.duracao * 60);
  }, [open, routine]);

  useEffect(() => {
    if (!open || secondsLeft <= 0) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [open, secondsLeft]);

  if (!open || !routine) return null;

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const seconds = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#07111f] p-6 text-white shadow-2xl">
        <div className="mb-4 text-center">
          <p className="text-sm text-neutral-400">Rotina em andamento</p>
          <h2 className="mt-1 text-2xl font-semibold">{routine.titulo}</h2>
        </div>

        <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
          <p className="text-sm text-neutral-400">Tempo restante</p>
          <p className="mt-2 text-4xl font-bold tracking-widest">
            {minutes}:{seconds}
          </p>
        </div>

        <p className="mb-6 text-center text-sm text-neutral-300">
          {routine.descricao}
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-2xl border border-white/10 py-3 text-neutral-300"
          >
            Fechar
          </button>

          <button
            onClick={() => onComplete?.(routine)}
            className="flex-1 rounded-2xl bg-green-500 py-3 font-semibold text-black hover:bg-green-400"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
}
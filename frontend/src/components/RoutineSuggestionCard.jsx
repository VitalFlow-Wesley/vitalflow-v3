import React, { useMemo, useState } from "react";
import { Brain, Clock3, Info, RefreshCw } from "lucide-react";
import {
  buildSmartSuggestions,
  getReevaluationPreview,
} from "../utils/smartRoutineEngine";

function getThemeByStatus(status) {
  if (status === "critico") {
    return {
      border: "border-rose-500/30",
      badge: "border-rose-500/20 bg-rose-500/10 text-rose-300",
      title: "text-rose-300",
      button: "bg-rose-500 hover:bg-rose-400 text-white",
      subtleButton:
        "border border-rose-500/20 bg-transparent text-rose-200 hover:bg-rose-500/10",
      chip: "border-rose-500/20 bg-transparent text-rose-200",
      alt: "border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10",
    };
  }

  if (status === "atencao") {
    return {
      border: "border-amber-500/30",
      badge: "border-amber-500/20 bg-amber-500/10 text-amber-300",
      title: "text-amber-300",
      button: "bg-amber-500 hover:bg-amber-400 text-black",
      subtleButton:
        "border border-amber-500/20 bg-transparent text-amber-200 hover:bg-amber-500/10",
      chip: "border-amber-500/20 bg-transparent text-amber-200",
      alt: "border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10",
    };
  }

  return {
    border: "border-emerald-500/30",
    badge: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
    title: "text-emerald-300",
    button: "bg-emerald-500 hover:bg-emerald-400 text-black",
    subtleButton:
      "border border-emerald-500/20 bg-transparent text-emerald-200 hover:bg-emerald-500/10",
    chip: "border-emerald-500/20 bg-transparent text-emerald-200",
    alt: "border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10",
  };
}

export default function RoutineSuggestionCard({
  currentData,
  previousData,
  onStartRoutine,
}) {
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showReevaluate, setShowReevaluate] = useState(false);

  const smart = useMemo(
    () => buildSmartSuggestions(currentData, previousData),
    [currentData, previousData]
  );

  const theme = useMemo(() => getThemeByStatus(smart.status), [smart.status]);
  const reevaluation = useMemo(
    () => getReevaluationPreview(smart.status),
    [smart.status]
  );

  const primary = smart.primary;
  const alternatives = smart.alternatives || [];

  const startPrimaryRoutine = () => {
    onStartRoutine?.({
      ...primary,
      status: smart.status,
      currentData,
      previousData,
    });
  };

  return (
    <>
      <div
        className={`rounded-3xl border bg-neutral-950/40 backdrop-blur-sm p-5 xl:p-6 ${theme.border}`}
        data-testid="routine-suggestion-card"
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500 font-bold">
              Sugestão inteligente
            </p>

            <div
              className={`mt-3 inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ${theme.badge}`}
            >
              Estado atual: {smart.status}
            </div>
          </div>

          <div className="inline-flex items-center gap-2 text-white text-sm font-semibold tracking-tight">
            <Brain className="w-5 h-5 text-cyan-400" />
            <span>VitalFlow</span>
          </div>
        </div>

        <div
          className={`rounded-2xl border p-4 mb-4 bg-neutral-950/40 ${theme.border}`}
        >
          <h3 className={`text-2xl font-black tracking-tight mb-2 ${theme.title}`}>
            {primary.title}
          </h3>

          <p className="text-sm leading-6 text-neutral-200 mb-3">
            {primary.description}
          </p>

          <p className="text-xs leading-6 text-neutral-400">
            {smart.explanation}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-5">
          <div
            className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium border ${theme.chip}`}
          >
            <Clock3 className="w-3.5 h-3.5" />
            {primary.duration_label}
          </div>

          <div
            className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium border ${theme.chip}`}
          >
            {primary.focus}
          </div>

          <div
            className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium border ${theme.chip}`}
          >
            {primary.context}
          </div>
        </div>

        {alternatives.length > 0 && (
          <div className="mb-5">
            <p className="text-xs uppercase tracking-[0.16em] text-neutral-500 font-bold mb-3">
              Outras opções sugeridas
            </p>

            <div className="grid gap-2">
              {alternatives.map((item) => (
                <button
                  key={item.id}
                  onClick={() =>
                    onStartRoutine?.({
                      ...item,
                      status: smart.status,
                      currentData,
                      previousData,
                    })
                  }
                  className={`w-full text-left rounded-2xl border px-4 py-3 transition ${theme.alt}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {item.title}
                      </p>
                      <p className="text-xs text-neutral-400 mt-1">
                        {item.duration_label} • {item.focus}
                      </p>
                    </div>

                    <span className="text-xs text-neutral-500">
                      alternativa
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={startPrimaryRoutine}
            className={`w-full rounded-2xl px-4 py-3 font-bold transition-all duration-200 ${theme.button}`}
            data-testid="routine-start-button"
          >
            Iniciar agora
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setShowHowItWorks(true)}
              className={`rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200 ${theme.subtleButton}`}
              data-testid="routine-explain-button"
            >
              <span className="inline-flex items-center gap-2">
                <Info className="w-4 h-4" />
                Como funciona
              </span>
            </button>

            <button
              onClick={() => setShowReevaluate(true)}
              className={`rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200 ${theme.subtleButton}`}
              data-testid="routine-reevaluate-button"
            >
              <span className="inline-flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Reavaliar
              </span>
            </button>
          </div>
        </div>
      </div>

      {showHowItWorks && (
        <div className="fixed inset-0 z-[1200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`w-full max-w-md rounded-3xl border bg-neutral-950/95 p-6 ${theme.border}`}
          >
            <p className="text-xs uppercase tracking-[0.18em] text-neutral-500 font-bold mb-3">
              Como funciona
            </p>

            <h3 className={`text-2xl font-black mb-3 ${theme.title}`}>
              {primary.title}
            </h3>

            <p className="text-base text-neutral-200 leading-7 mb-5">
              {primary.description}
            </p>

            <div className="space-y-3 mb-5">
              {primary.howItWorks?.map((step, idx) => (
                <div
                  key={idx}
                  className={`rounded-2xl border px-4 py-3 text-sm leading-6 bg-neutral-950/50 ${theme.border} text-neutral-100`}
                >
                  <span className={`font-bold mr-2 ${theme.title}`}>
                    {idx + 1}.
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowHowItWorks(false)}
              className={`w-full rounded-2xl px-4 py-3 font-bold ${theme.button}`}
            >
              Entendi
            </button>
          </div>
        </div>
      )}

      {showReevaluate && (
        <div className="fixed inset-0 z-[1200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`w-full max-w-md rounded-3xl border bg-neutral-950/95 p-6 ${theme.border}`}
          >
            <p className="text-xs uppercase tracking-[0.18em] text-neutral-500 font-bold mb-3">
              {reevaluation.title}
            </p>

            <h3 className={`text-2xl font-black mb-4 ${theme.title}`}>
              Se você concluir esta rotina
            </h3>

            <div className="grid grid-cols-3 gap-3 mb-5">
              {reevaluation.items.map((item) => (
                <div
                  key={item.label}
                  className={`rounded-2xl border p-4 text-center bg-neutral-950/50 ${theme.border}`}
                >
                  <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500 mb-2">
                    {item.label}
                  </p>
                  <p className={`text-lg font-black ${theme.title}`}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowReevaluate(false)}
                className="flex-1 rounded-2xl border border-white/10 py-3 text-neutral-300 hover:bg-white/5"
              >
                Fechar
              </button>

              <button
                onClick={() => {
                  setShowReevaluate(false);
                  startPrimaryRoutine();
                }}
                className={`flex-1 rounded-2xl py-3 font-bold ${theme.button}`}
              >
                Fazer agora
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
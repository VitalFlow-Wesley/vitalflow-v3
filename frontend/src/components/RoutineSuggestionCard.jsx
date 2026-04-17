import React, { useMemo } from "react";
import { Clock3, Info, RefreshCw } from "lucide-react";

function normalizeStatus(rawStatus) {
  const value = String(rawStatus || "").toLowerCase();

  if (
    value.includes("crit") ||
    value.includes("vermelh") ||
    value.includes("alerta")
  ) {
    return "critico";
  }

  if (
    value.includes("aten") ||
    value.includes("amarel") ||
    value.includes("moderad")
  ) {
    return "atencao";
  }

  return "normal";
}

function getThemeByStatus(status) {
  if (status === "critico") {
    return {
      border: "border-rose-500/30",
      glow: "shadow-[0_0_40px_rgba(244,63,94,0.14)]",
      soft: "bg-rose-500/10",
      softStrong: "bg-rose-500/12",
      badge: "border-rose-400/30 bg-rose-500/10 text-rose-300",
      title: "text-rose-300",
      button: "bg-rose-500 hover:bg-rose-400 text-white",
      subtleButton:
        "border border-rose-500/20 bg-rose-500/10 text-rose-200 hover:bg-rose-500/15",
      chip: "border-rose-500/20 bg-rose-500/10 text-rose-200",
    };
  }

  if (status === "atencao") {
    return {
      border: "border-amber-500/30",
      glow: "shadow-[0_0_40px_rgba(245,158,11,0.12)]",
      soft: "bg-amber-500/10",
      softStrong: "bg-amber-500/12",
      badge: "border-amber-400/30 bg-amber-500/10 text-amber-300",
      title: "text-amber-300",
      button: "bg-amber-500 hover:bg-amber-400 text-black",
      subtleButton:
        "border border-amber-500/20 bg-amber-500/10 text-amber-200 hover:bg-amber-500/15",
      chip: "border-amber-500/20 bg-amber-500/10 text-amber-200",
    };
  }

  return {
    border: "border-emerald-500/30",
    glow: "shadow-[0_0_40px_rgba(16,185,129,0.12)]",
    soft: "bg-emerald-500/10",
    softStrong: "bg-emerald-500/12",
    badge: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
    title: "text-emerald-300",
    button: "bg-emerald-500 hover:bg-emerald-400 text-black",
    subtleButton:
      "border border-emerald-500/20 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/15",
    chip: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
  };
}

function getSuggestionByState({
  stress = 0,
  sleep = 0,
  hrv = 0,
  recovery = 100,
  bpm = 0,
  v_score = 100,
  status = "normal",
}) {
  if (status === "critico") {
    return {
      stateLabel: "Estado atual: crítico",
      title: "Recuperação prioritária",
      description:
        "Pratique uma respiração guiada curta para reduzir a sobrecarga imediata e estabilizar seu estado fisiológico.",
      duration: "5 min",
      focus: "recuperação",
      context:
        stress >= 70
          ? "estresse"
          : sleep < 6
          ? "sono ruim"
          : hrv < 50
          ? "HRV baixa"
          : "monitoramento",
      cta: "Iniciar agora",
    };
  }

  if (status === "atencao") {
    return {
      stateLabel: "Estado atual: atenção",
      title: "Recuperação leve",
      description:
        "Há sinais de recuperação, mas ainda exige atenção. Faça uma pausa guiada para melhorar sua estabilidade.",
      duration: "5 min",
      focus: "equilíbrio",
      context:
        recovery < 70
          ? "recuperação"
          : stress >= 50
          ? "estresse"
          : bpm >= 90
          ? "ritmo cardíaco"
          : "monitoramento",
      cta: "Iniciar agora",
    };
  }

  return {
    stateLabel: "Estado atual: estável",
    title: "Manutenção positiva",
    description:
      "Seu estado está equilibrado. Mantenha a consistência com uma rotina curta para sustentar sua performance.",
    duration: "5 min",
    focus: "manutenção",
    context: "estabilidade",
    cta: "Iniciar agora",
  };
}

export default function RoutineSuggestionCard({
  currentData,
  previousData,
  onStartRoutine,
  onExplain,
  onReevaluate,
}) {
  const currentStatus = useMemo(() => {
    const explicitStatus =
      currentData?.status ||
      currentData?.status_visual ||
      currentData?.estado ||
      "";

    if (explicitStatus) return normalizeStatus(explicitStatus);

    const stress = Number(currentData?.stress ?? 0);
    const vScore = Number(currentData?.v_score ?? 100);

    if (stress >= 75 || vScore <= 55) return "critico";
    if (stress >= 50 || vScore <= 75) return "atencao";
    return "normal";
  }, [currentData]);

  const theme = useMemo(() => getThemeByStatus(currentStatus), [currentStatus]);

  const suggestion = useMemo(
    () =>
      getSuggestionByState({
        stress: Number(currentData?.stress ?? 0),
        sleep: Number(currentData?.sleep ?? currentData?.sleep_hours ?? 0),
        hrv: Number(currentData?.hrv ?? 0),
        recovery: Number(currentData?.recovery ?? 100),
        bpm: Number(currentData?.bpm ?? 0),
        v_score: Number(currentData?.v_score ?? 100),
        status: currentStatus,
      }),
    [currentData, currentStatus]
  );

  const routinePayload = useMemo(
    () => ({
      title: suggestion.title,
      description: suggestion.description,
      duration_minutes: 5,
      status: currentStatus,
      cycle_seconds: [4, 4, 4, 4],
      focus: suggestion.focus,
      context: suggestion.context,
      currentData,
      previousData,
    }),
    [suggestion, currentStatus, currentData, previousData]
  );

  return (
    <div
      className={`rounded-3xl border bg-gradient-to-b from-[#0f172a] to-[#020617] p-5 xl:p-6 ${theme.border} ${theme.glow}`}
      data-testid="routine-suggestion-card"
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500 font-bold">
            Sugestão de rotina (5 min)
          </p>
          <div
            className={`mt-3 inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ${theme.badge}`}
          >
            {suggestion.stateLabel}
          </div>
        </div>
      </div>

      <div
        className={`rounded-2xl border p-4 mb-4 ${theme.border} ${theme.softStrong}`}
      >
        <h3 className={`text-2xl font-black tracking-tight mb-2 ${theme.title}`}>
          {suggestion.title}
        </h3>

        <p className="text-sm leading-6 text-neutral-200">
          {suggestion.description}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        <div
          className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium border ${theme.chip}`}
        >
          <Clock3 className="w-3.5 h-3.5" />
          {suggestion.duration}
        </div>

        <div
          className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium border ${theme.chip}`}
        >
          {suggestion.focus}
        </div>

        <div
          className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium border ${theme.chip}`}
        >
          {suggestion.context}
        </div>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => onStartRoutine?.(routinePayload)}
          className={`w-full rounded-2xl px-4 py-3 font-bold transition-all duration-200 ${theme.button}`}
          data-testid="routine-start-button"
        >
          {suggestion.cta}
        </button>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onExplain?.(routinePayload)}
            className={`rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200 ${theme.subtleButton}`}
            data-testid="routine-explain-button"
          >
            <span className="inline-flex items-center gap-2">
              <Info className="w-4 h-4" />
              Como funciona
            </span>
          </button>

          <button
            onClick={() => onReevaluate?.(routinePayload)}
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
  );
}
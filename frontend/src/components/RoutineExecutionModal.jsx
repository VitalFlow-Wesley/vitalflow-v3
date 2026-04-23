import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Brain,
  Clock3,
  Droplets,
  Eye,
  Footprints,
  Wind,
} from "lucide-react";

function getTheme(status) {
  switch (status) {
    case "critico":
      return {
        border: "border-rose-500/30",
        glow: "shadow-[0_0_45px_rgba(244,63,94,0.20)]",
        title: "text-rose-300",
        accentText: "text-rose-200",
        progress: "bg-rose-500",
        button: "bg-rose-500 hover:bg-rose-400 text-white",
        subtle: "border-rose-500/20 bg-rose-500/5 text-rose-200",
        chip: "border-rose-500/20 bg-rose-500/10 text-rose-200",
      };
    case "atencao":
      return {
        border: "border-amber-500/30",
        glow: "shadow-[0_0_45px_rgba(245,158,11,0.18)]",
        title: "text-amber-300",
        accentText: "text-amber-200",
        progress: "bg-amber-400",
        button: "bg-amber-400 hover:bg-amber-300 text-black",
        subtle: "border-amber-500/20 bg-amber-500/5 text-amber-200",
        chip: "border-amber-500/20 bg-amber-500/10 text-amber-200",
      };
    default:
      return {
        border: "border-emerald-500/30",
        glow: "shadow-[0_0_45px_rgba(16,185,129,0.18)]",
        title: "text-emerald-300",
        accentText: "text-emerald-200",
        progress: "bg-emerald-400",
        button: "bg-emerald-400 hover:bg-emerald-300 text-black",
        subtle: "border-emerald-500/20 bg-emerald-500/5 text-emerald-200",
        chip: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
      };
  }
}

function normalizeRoutineType(type, subtype) {
  const rawType = String(type || "").toLowerCase().trim();
  const rawSubtype = String(subtype || "").toLowerCase().trim();

  if (rawType === "breathing") return "breathing";
  if (rawType === "movement") return "movement";
  if (rawType === "visual") return "visual";
  if (rawType === "recovery") return "recovery";
  if (rawType === "mental") return "mental";

  if (rawType === "hydration") return "recovery";
  if (rawType === "stretch") return "movement";
  if (rawType === "walk") return "movement";
  if (rawType === "focus") return "mental";

  if (rawSubtype === "hydration") return "recovery";
  if (rawSubtype === "stretch") return "movement";
  if (rawSubtype === "walk") return "movement";
  if (rawSubtype === "focus_reset") return "mental";
  if (rawSubtype === "distance_focus") return "visual";

  return "breathing";
}

function getRoutineMeta(type, subtype) {
  if (type === "breathing") {
    return { icon: Wind, label: "Respiração guiada" };
  }

  if (type === "movement") {
    if (subtype === "stretch") {
      return { icon: Footprints, label: "Alongamento leve" };
    }
    return { icon: Footprints, label: "Movimento leve" };
  }

  if (type === "visual") {
    return { icon: Eye, label: "Descanso visual" };
  }

  if (type === "recovery") {
    if (subtype === "hydration") {
      return { icon: Droplets, label: "Hidratação rápida" };
    }
    return { icon: Droplets, label: "Recuperação rápida" };
  }

  if (type === "mental") {
    return { icon: Brain, label: "Pausa cognitiva" };
  }

  return { icon: Activity, label: "Rotina guiada" };
}

function formatSeconds(total) {
  const safe = Number(total) || 0;
  const minutes = String(Math.floor(safe / 60)).padStart(2, "0");
  const seconds = String(safe % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function buildDefaultSteps(routine) {
  if (routine?.type !== "breathing") return [];

  if (Array.isArray(routine?.steps) && routine.steps.length > 0) {
    return routine.steps;
  }

  return [
    { label: "Inspire", seconds: 4, instruction: "Inspire lentamente pelo nariz" },
    {
      label: "Segure",
      seconds: 4,
      instruction: "Segure o ar por 4 segundos sem tensionar o corpo",
    },
    { label: "Expire", seconds: 4, instruction: "Solte o ar devagar pela boca" },
    { label: "Segure", seconds: 4, instruction: "Mantenha o ritmo" },
  ];
}

export default function RoutineExecutionModal({
  open,
  routine,
  onClose,
  onComplete,
}) {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [finished, setFinished] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [phaseSecondsLeft, setPhaseSecondsLeft] = useState(0);

  const theme = getTheme(routine?.status);
  const routineType = normalizeRoutineType(routine?.type, routine?.subtype);
  const routineMeta = getRoutineMeta(routineType, routine?.subtype);
  const RoutineIcon = routineMeta.icon;

  const breathingSteps = useMemo(
    () => buildDefaultSteps({ ...routine, type: routineType }),
    [routine, routineType]
  );

  const currentPhase = breathingSteps[phaseIndex] || null;

  useEffect(() => {
    if (!open || !routine) return;

    const duration =
      Number(routine?.duration_seconds) ||
      Number(routine?.duration_minutes) * 60 ||
      Number(routine?.duracao) * 60 ||
      300;

    setSecondsLeft(duration);
    setTotalTime(duration);
    setFinished(false);

    if (routineType === "breathing" && breathingSteps.length > 0) {
      setPhaseIndex(0);
      setPhaseSecondsLeft(Number(breathingSteps[0]?.seconds) || 4);
    } else {
      setPhaseIndex(0);
      setPhaseSecondsLeft(0);
    }
  }, [open, routine, routineType, breathingSteps]);

  useEffect(() => {
    if (!open || finished || secondsLeft <= 0) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        const next = prev > 0 ? prev - 1 : 0;
        if (next === 0) {
          setFinished(true);
        }
        return next;
      });

      if (routineType === "breathing" && breathingSteps.length > 0) {
        setPhaseSecondsLeft((prev) => {
          if (prev > 1) return prev - 1;

          const nextIndex = (phaseIndex + 1) % breathingSteps.length;
          setPhaseIndex(nextIndex);
          return Number(breathingSteps[nextIndex]?.seconds) || 4;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [open, finished, secondsLeft, routineType, breathingSteps, phaseIndex]);

  const progress =
    totalTime > 0 ? ((totalTime - secondsLeft) / totalTime) * 100 : 0;

  const finishRoutine = () => {
    setFinished(true);
  };

  const closeAndComplete = async () => {
    // --- ENVIO DOS PONTOS PARA O BACKEND ---
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await fetch('/api/gamification/follow-nudge', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            analysis_id: routine.id || "manual_" + Date.now() 
          })
        });
      }
    } catch (err) {
      console.error("Erro ao creditar pontos:", err);
    }

    onComplete?.(routine);
    onClose?.();
    
    // Força a atualização da página para garantir que a barra de energia suba
    setTimeout(() => window.location.reload(), 500);
  };

  if (!open || !routine) return null;

  const estimatedImpact =
    routine?.status === "critico"
      ? {
          recovery: "+12%",
          stress: "-8%",
          points: "+20 energia",
          message:
            "Seu corpo começou a responder à intervenção e saiu do pico de sobrecarga.",
        }
      : routine?.status === "atencao"
      ? {
          recovery: "+8%",
          stress: "-5%",
          points: "+15 energia",
          message:
            "Há sinais iniciais de estabilização e retomada de equilíbrio.",
        }
      : {
          recovery: "+5%",
          stress: "-3%",
          points: "+10 energia",
          message: "Você reforçou sua consistência e manteve um bom estado geral.",
        };

  const getPrimaryInstruction = () => {
    if (routineType === "visual") {
      if (routine?.subtype === "distance_focus") {
        return "Relaxe a visão focando em um ponto distante.";
      }
      return "Reduza a fadiga visual afastando o olhar da tela.";
    }

    if (routineType === "movement") {
      if (routine?.subtype === "stretch") {
        return "Movimente o corpo de forma leve e sem forçar.";
      }
      if (routine?.subtype === "walk") {
        return "Levante-se e caminhe por alguns minutos.";
      }
      return "Movimente o corpo de forma leve.";
    }

    if (routineType === "recovery") {
      if (routine?.subtype === "hydration") {
        return "Hidrate o corpo e recupere sua disposição.";
      }
      return "Faça uma pausa curta para acelerar sua recuperação.";
    }

    if (routineType === "mental") {
      if (routine?.subtype === "focus_reset") {
        return "Desacelere e reorganize sua atenção.";
      }
      return "Faça uma pausa mental breve.";
    }

    if (routineType === "breathing") {
      return currentPhase?.instruction || "Siga a respiração guiada.";
    }

    return "Siga as instruções da rotina.";
  };

  const getSupportText = () => {
    if (routineType === "visual") {
      if (routine?.subtype === "distance_focus") {
        return "Tire os olhos da tela e mantenha o foco longe por alguns segundos.";
      }
      return "Evite estímulos visuais intensos e permita que os olhos descansem.";
    }

    if (routineType === "movement") {
      if (routine?.subtype === "stretch") {
        return "Solte pescoço, ombros e postura com leveza.";
      }
      if (routine?.subtype === "walk") {
        return "Ative a circulação e quebre o tempo prolongado parado.";
      }
      return "Deixe o corpo retomar o ritmo aos poucos.";
    }

    if (routineType === "recovery") {
      if (routine?.subtype === "hydration") {
        return "Beba água devagar e dê ao organismo um momento de recomposição.";
      }
      return "Use este instante para reduzir a sobrecarga antes de continuar.";
    }

    if (routineType === "mental") {
      if (routine?.subtype === "focus_reset") {
        return "Retome clareza mental escolhendo apenas a próxima ação.";
      }
      return "Diminua o ruído mental por alguns instantes.";
    }

    if (routineType === "breathing") {
      return `${phaseSecondsLeft}s nesta etapa`;
    }

    return "Siga o ritmo da rotina.";
  };

  const renderPremiumCenter = () => {
    if (routineType === "breathing") {
      const phase = currentPhase || {};
      const label = phase?.label || "Respire";
      const phaseScale =
        label === "Inspire" ? 1.18 : label === "Expire" ? 0.88 : 1.02;

      return (
        <div className="flex flex-col items-center mb-6">
          <div
            className={`relative w-36 h-36 rounded-full border ${theme.border} bg-white/[0.02] flex items-center justify-center`}
            style={{
              transform: `scale(${phaseScale})`,
              transition: "transform 1s ease-in-out",
            }}
          >
            <div className="absolute inset-3 rounded-full border border-white/5" />
            <div className="absolute inset-8 rounded-full border border-white/10" />
            <div
              className={`w-16 h-16 rounded-full ${theme.progress} opacity-90 blur-[1px]`}
            />
          </div>

          <p className={`mt-6 text-3xl font-black ${theme.title}`}>{label}</p>
          <p className="mt-2 text-sm text-neutral-400">{getSupportText()}</p>
          <p className="mt-3 text-sm text-neutral-300 text-center">
            {getPrimaryInstruction()}
          </p>
        </div>
      );
    }

    if (routineType === "visual") {
      return (
        <div className="flex flex-col items-center mb-6">
          <div
            className={`relative w-36 h-36 rounded-full border ${theme.border} bg-white/[0.02] flex items-center justify-center`}
          >
            <div className="absolute w-3 h-3 rounded-full bg-white/70" />
            <div className="absolute inset-5 rounded-full border border-white/5" />
            <div className="absolute inset-10 rounded-full border border-white/10" />
            <RoutineIcon className={`w-10 h-10 ${theme.title}`} />
          </div>

          <p className={`mt-6 text-2xl font-black ${theme.title}`}>
            {routine.title}
          </p>
          <p className="mt-2 text-sm text-neutral-400">{getSupportText()}</p>
          <p className="mt-3 text-sm text-neutral-300 text-center">
            {getPrimaryInstruction()}
          </p>
        </div>
      );
    }

    if (routineType === "movement") {
      return (
        <div className="flex flex-col items-center mb-6">
          <div
            className={`relative w-36 h-36 rounded-3xl border ${theme.border} bg-white/[0.02] flex items-center justify-center`}
          >
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/[0.03] to-transparent" />
            <RoutineIcon className={`w-16 h-16 ${theme.title}`} />
          </div>

          <p className={`mt-6 text-2xl font-black ${theme.title}`}>
            {routine.title}
          </p>
          <p className="mt-2 text-sm text-neutral-400">{getSupportText()}</p>
          <p className="mt-3 text-sm text-neutral-300 text-center">
            {getPrimaryInstruction()}
          </p>
        </div>
      );
    }

    if (routineType === "recovery") {
      return (
        <div className="flex flex-col items-center mb-6">
          <div
            className={`relative w-36 h-36 rounded-3xl border ${theme.border} bg-white/[0.02] flex items-center justify-center`}
          >
            <RoutineIcon className={`w-16 h-16 ${theme.title}`} />
          </div>

          <p className={`mt-6 text-2xl font-black ${theme.title}`}>
            {routine.title}
          </p>
          <p className="mt-2 text-sm text-neutral-400">{getSupportText()}</p>
          <p className="mt-3 text-sm text-neutral-300 text-center">
            {getPrimaryInstruction()}
          </p>
        </div>
      );
    }

    if (routineType === "mental") {
      return (
        <div className="flex flex-col items-center mb-6">
          <div
            className={`relative w-36 h-36 rounded-3xl border ${theme.border} bg-white/[0.02] flex items-center justify-center`}
          >
            <RoutineIcon className={`w-16 h-16 ${theme.title}`} />
          </div>

          <p className={`mt-6 text-2xl font-black ${theme.title}`}>
            {routine.title}
          </p>
          <p className="mt-2 text-sm text-neutral-400">{getSupportText()}</p>
          <p className="mt-3 text-sm text-neutral-300 text-center">
            {getPrimaryInstruction()}
          </p>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center mb-6">
        <div
          className={`relative w-36 h-36 rounded-3xl border ${theme.border} bg-white/[0.02] flex items-center justify-center`}
        >
          <RoutineIcon className={`w-16 h-16 ${theme.title}`} />
        </div>

        <p className={`mt-6 text-2xl font-black ${theme.title}`}>
          {routine.title || "Rotina guiada"}
        </p>
        <p className="mt-2 text-sm text-neutral-400">{getSupportText()}</p>
        <p className="mt-3 text-sm text-neutral-300 text-center">
          {getPrimaryInstruction()}
        </p>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div
        className={`w-full max-w-xl rounded-[28px] border bg-neutral-950/95 backdrop-blur-xl p-6 md:p-7 text-white ${theme.border} ${theme.glow}`}
      >
        {!finished ? (
          <>
            <div className="text-center mb-6">
              <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500 font-bold">
                Rotina em andamento
              </p>

              <h2 className={`text-3xl md:text-4xl font-black mt-3 ${theme.title}`}>
                {routine.title || "Rotina guiada"}
              </h2>
            </div>

            {renderPremiumCenter()}

            <div className="text-center mb-4">
              <p className="text-sm text-neutral-400">Tempo restante</p>
              <p className={`text-6xl md:text-7xl font-black tracking-wider mt-2 ${theme.title}`}>
                {formatSeconds(secondsLeft)}
              </p>
            </div>

            <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden mb-6">
              <div
                className={`h-full ${theme.progress} transition-all duration-1000`}
                style={{ width: `${progress}%` }}
              />
            </div>

            {routineType === "breathing" && breathingSteps.length > 0 ? (
              <div className="grid grid-cols-4 gap-2 mb-6">
                {breathingSteps.map((step, index) => {
                  const active = index === phaseIndex;
                  return (
                    <div
                      key={`${step.label}-${index}`}
                      className={`rounded-2xl border px-2 py-3 text-center text-xs font-semibold transition-all ${
                        active
                          ? `${theme.subtle} ${theme.title}`
                          : "border-white/10 text-neutral-500"
                      }`}
                    >
                      {step.label}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                <div
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold ${theme.chip}`}
                >
                  <Clock3 className="w-3.5 h-3.5" />
                  {routine.duration_label || formatSeconds(totalTime)}
                </div>

                <div
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold ${theme.chip}`}
                >
                  <RoutineIcon className="w-3.5 h-3.5" />
                  {routineMeta.label}
                </div>
              </div>
            )}

            <p className="text-center text-sm md:text-base text-neutral-300 leading-7 mb-6">
              {routine.description ||
                "Siga a rotina até o final para melhorar seu estado atual."}
            </p>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 rounded-2xl border border-white/10 py-3.5 text-neutral-300 hover:bg-white/5 transition"
              >
                Fechar
              </button>

              <button
                onClick={finishRoutine}
                className={`flex-1 rounded-2xl py-3.5 font-bold transition ${theme.button}`}
              >
                Concluir
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="text-center mb-6">
              <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500 font-bold">
                Rotina concluída
              </p>

              <h2 className={`text-3xl md:text-4xl font-black mt-3 ${theme.title}`}>
                {routine.title || "Rotina finalizada"}
              </h2>

              <div
                className={`mt-4 inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold ${theme.chip}`}
              >
                Impacto estimado registrado
              </div>
            </div>

            <div
              className={`rounded-2xl border p-4 mb-5 bg-neutral-950/40 ${theme.border}`}
            >
              <p className="text-neutral-200 text-sm md:text-base leading-7 text-center">
                {estimatedImpact.message}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              <div
                className={`rounded-2xl border p-4 text-center bg-neutral-950/40 ${theme.border}`}
              >
                <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500 mb-2">
                  Recovery
                </p>
                <p className={`text-xl font-black ${theme.title}`}>
                  {estimatedImpact.recovery}
                </p>
              </div>

              <div
                className={`rounded-2xl border p-4 text-center bg-neutral-950/40 ${theme.border}`}
              >
                <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500 mb-2">
                  Stress
                </p>
                <p className={`text-xl font-black ${theme.title}`}>
                  {estimatedImpact.stress}
                </p>
              </div>

              <div
                className={`rounded-2xl border p-4 text-center bg-neutral-950/40 ${theme.border}`}
              >
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
                className="flex-1 rounded-2xl border border-white/10 py-3.5 text-neutral-300 hover:bg-white/5 transition"
              >
                Fechar
              </button>

              <button
                onClick={closeAndComplete}
                className={`flex-1 rounded-2xl py-3.5 font-bold transition ${theme.button}`}
              >
                Finalizar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
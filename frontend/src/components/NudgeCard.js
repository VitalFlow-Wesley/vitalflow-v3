import { Zap, ArrowRight, Check, Clock3, Activity, Moon, HeartPulse } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { toast } from "sonner";

const API = `${
  process.env.REACT_APP_BACKEND_URL || "https://vitalflow.up.railway.app"
}/api`;

function normalizeNudgeVisual(statusValue, tagValue, scoreValue) {
  const status = String(statusValue || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  const tag = String(tagValue || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  const score = Number(scoreValue ?? 0);

  if (
    status.includes("vermelho") ||
    status.includes("critico") ||
    status.includes("urgente") ||
    tag.includes("urgente") ||
    tag.includes("critico") ||
    score < 50
  ) {
    return {
      key: "critico",
      border: "border-rose-500/30",
      bg: "bg-rose-500/8",
      soft: "bg-rose-500/10",
      text: "text-rose-300",
      button: "bg-rose-500 hover:bg-rose-400",
      icon: HeartPulse,
      label: "Recuperação prioritária",
    };
  }

  if (
    status.includes("amarelo") ||
    status.includes("atencao") ||
    status.includes("stress") ||
    status.includes("alerta") ||
    tag.includes("stress") ||
    tag.includes("alerta") ||
    (score >= 50 && score < 80)
  ) {
    return {
      key: "atencao",
      border: "border-amber-500/30",
      bg: "bg-amber-500/8",
      soft: "bg-amber-500/10",
      text: "text-amber-300",
      button: "bg-amber-500 hover:bg-amber-400",
      icon: Activity,
      label: "Reequilíbrio rápido",
    };
  }

  return {
    key: "normal",
    border: "border-emerald-500/25",
    bg: "bg-emerald-500/8",
    soft: "bg-emerald-500/10",
    text: "text-emerald-300",
    button: "bg-emerald-500 hover:bg-emerald-400",
    icon: Moon,
    label: "Manutenção positiva",
  };
}

function buildRoutineText(analysis) {
  const tag = String(analysis?.tag_rapida || "").toLowerCase();
  const cause = String(analysis?.causa_provavel || "").toLowerCase();
  const nudge = analysis?.nudge_acao;
  const bpm = Number(analysis?.input_data?.bpm ?? 0);
  const sleep = Number(analysis?.input_data?.sleep_hours ?? 0);

  if (typeof nudge === "string" && nudge.trim().length > 8) {
    return nudge;
  }

  if (
    tag.includes("sono") ||
    cause.includes("sono") ||
    sleep > 0 && sleep < 6
  ) {
    return "Reduza estímulos por 5 minutos: saia da tela, diminua a luz do ambiente, beba água e programe um horário de descanso mais cedo hoje.";
  }

  if (
    tag.includes("stress") ||
    tag.includes("alerta") ||
    cause.includes("estresse") ||
    bpm >= 95
  ) {
    return "Faça 5 minutos de respiração 4-7-8: inspire por 4 segundos, segure por 7 e solte por 8. Repita em ciclos curtos e reduza o ritmo antes da próxima atividade.";
  }

  if (tag.includes("recuper") || cause.includes("fadiga")) {
    return "Faça uma pausa de 5 minutos com caminhada leve, alongamento de pescoço e ombros e respiração profunda para acelerar sua recuperação.";
  }

  return "Faça uma rotina breve de 5 minutos: levante, alongue ombros e pescoço, respire profundamente por 1 minuto e retome a atividade com ritmo controlado.";
}

const NudgeCard = ({ analysis, onPointsEarned }) => {
  const analysisId = analysis?.id;
  const status = analysis?.status_visual;
  const tag = analysis?.tag_rapida;
  const score = analysis?.v_score ?? 0;

  const [followed, setFollowed] = useState(false);
  const [loading, setLoading] = useState(false);

  const routineText = useMemo(() => buildRoutineText(analysis), [analysis]);
  const visual = useMemo(
    () => normalizeNudgeVisual(status, tag, score),
    [status, tag, score]
  );

  const VisualIcon = visual.icon;

  useEffect(() => {
    if (!analysisId) return;
    const followedNudges = JSON.parse(
      localStorage.getItem("vitalflow_followed_nudges") || "[]"
    );
    setFollowed(followedNudges.includes(analysisId));
  }, [analysisId]);

  const handleFollow = async () => {
    if (followed || loading || !analysisId) return;

    setLoading(true);
    try {
      const { data } = await axios.post(
        `${API}/gamification/follow-nudge`,
        { analysis_id: analysisId },
        { withCredentials: true }
      );

      setFollowed(true);

      const followedNudges = JSON.parse(
        localStorage.getItem("vitalflow_followed_nudges") || "[]"
      );

      if (!followedNudges.includes(analysisId)) {
        followedNudges.push(analysisId);
      }

      if (followedNudges.length > 50) {
        followedNudges.splice(0, followedNudges.length - 50);
      }

      localStorage.setItem(
        "vitalflow_followed_nudges",
        JSON.stringify(followedNudges)
      );

      const msg = data?.bonus_events?.length
        ? `+${data.points_earned} Pontos de Energia! (inclui bônus)`
        : `+${data.points_earned} Pontos de Energia!`;

      toast.success(msg, { duration: 4000 });

      if (onPointsEarned) onPointsEarned(data);
    } catch (err) {
      const detail = err?.response?.data?.detail;

      if (detail === "Nudge ja seguido para esta analise") {
        setFollowed(true);

        const followedNudges = JSON.parse(
          localStorage.getItem("vitalflow_followed_nudges") || "[]"
        );

        if (!followedNudges.includes(analysisId)) {
          followedNudges.push(analysisId);
          localStorage.setItem(
            "vitalflow_followed_nudges",
            JSON.stringify(followedNudges)
          );
        }
      } else {
        toast.error("Erro ao registrar rotina.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.22 }}
      className={`border ${visual.border} ${visual.bg} backdrop-blur-xl rounded-[28px] p-6`}
      data-testid="nudge-card"
    >
      <div className="flex items-center gap-2 mb-4">
        <Zap className={`w-4 h-4 ${visual.text}`} />
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">
          Sugestão de rotina (5 min)
        </h3>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto] gap-5 items-start">
        <div className="space-y-4">
          <div className={`rounded-2xl border ${visual.border} ${visual.soft} p-4`}>
            <div className="flex items-center gap-2 mb-2">
              <VisualIcon className={`w-4 h-4 ${visual.text}`} />
              <p className={`text-sm font-bold ${visual.text}`}>
                {visual.label}
              </p>
            </div>
            <p className="text-sm text-white leading-7">
              {routineText}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="px-3 py-2 rounded-xl border border-white/10 bg-neutral-950/35 flex items-center gap-2">
              <Clock3 className="w-4 h-4 text-neutral-400" />
              <span className="text-xs text-neutral-300">Duração: 5 min</span>
            </div>

            <div className={`px-3 py-2 rounded-xl border ${visual.border} ${visual.soft}`}>
              <span className={`text-xs font-semibold ${visual.text}`}>
                Estado atual: {visual.key === "normal" ? "normal" : visual.key === "atencao" ? "atenção" : "crítico"}
              </span>
            </div>
          </div>
        </div>

        <div className="w-full xl:w-[240px]">
          <button
            onClick={handleFollow}
            disabled={followed || loading}
            data-testid="follow-nudge-btn"
            className={`
              w-full py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2
              transition-all duration-200 text-black
              ${
                followed
                  ? "bg-neutral-700 text-neutral-300 cursor-default"
                  : visual.button
              }
            `}
          >
            {followed ? (
              <>
                <Check className="w-4 h-4" />
                Concluído
              </>
            ) : loading ? (
              "Registrando..."
            ) : (
              <>
                Iniciar Agora
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default NudgeCard;
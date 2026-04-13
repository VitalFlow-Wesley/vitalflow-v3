import { Zap, ArrowRight, Check } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL || "https://vitalflow.up.railway.app"}/api`;

const NudgeCard = ({ nudge, status, analysisId, onPointsEarned }) => {
  const [followed, setFollowed] = useState(false);
  const [loading, setLoading] = useState(false);

  // Verificar se nudge ja foi seguido (localStorage + reset ao mudar analysisId)
  useEffect(() => {
    if (!analysisId) return;
    const followedNudges = JSON.parse(localStorage.getItem("vitalflow_followed_nudges") || "[]");
    setFollowed(followedNudges.includes(analysisId));
  }, [analysisId]);

  const borderColor = {
    Verde: "border-emerald-400/30",
    Amarelo: "border-amber-400/30",
    Vermelho: "border-rose-500/30",
  }[status] || "border-cyan-400/30";

  const btnBg = {
    Verde: "bg-emerald-500 hover:bg-emerald-400",
    Amarelo: "bg-amber-500 hover:bg-amber-400",
    Vermelho: "bg-rose-500 hover:bg-rose-400",
  }[status] || "bg-cyan-500 hover:bg-cyan-400";

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
      // Salvar no localStorage para persistir entre recarregamentos
      const followedNudges = JSON.parse(localStorage.getItem("vitalflow_followed_nudges") || "[]");
      followedNudges.push(analysisId);
      // Manter apenas ultimos 50
      if (followedNudges.length > 50) followedNudges.splice(0, followedNudges.length - 50);
      localStorage.setItem("vitalflow_followed_nudges", JSON.stringify(followedNudges));

      const msg = data.bonus_events?.length
        ? `+${data.points_earned} Pontos de Energia! (inclui bonus)`
        : `+${data.points_earned} Pontos de Energia!`;
      toast.success(msg, { duration: 4000 });
      if (onPointsEarned) onPointsEarned(data);
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (detail === "Nudge ja seguido para esta analise") {
        setFollowed(true);
        // Corrigir localStorage
        const followedNudges = JSON.parse(localStorage.getItem("vitalflow_followed_nudges") || "[]");
        if (!followedNudges.includes(analysisId)) {
          followedNudges.push(analysisId);
          localStorage.setItem("vitalflow_followed_nudges", JSON.stringify(followedNudges));
        }
      } else {
        toast.error("Erro ao registrar nudge.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className={`border ${borderColor} bg-neutral-900/40 backdrop-blur-xl rounded-md p-6`}
      data-testid="nudge-card"
    >
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-amber-400" />
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">
          Sugestao de Rotina (5 min)
        </h3>
      </div>

      <p className="text-neutral-200 text-sm leading-relaxed mb-5">{nudge}</p>

      <button
        onClick={handleFollow}
        disabled={followed || loading}
        data-testid="follow-nudge-btn"
        className={`
          w-full py-3 rounded-md text-sm font-semibold flex items-center justify-center gap-2
          transition-all duration-200 text-black
          ${followed
            ? "bg-neutral-700 text-neutral-400 cursor-default"
            : btnBg
          }
        `}
      >
        {followed ? (
          <>
            <Check className="w-4 h-4" /> Concluido
          </>
        ) : loading ? (
          "Registrando..."
        ) : (
          <>
            Iniciar Agora <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </motion.div>
  );
};

export default NudgeCard;

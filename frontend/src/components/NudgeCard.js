import { Zap, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const NudgeCard = ({ nudge, status }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "Verde":
        return {
          border: "border-emerald-400/50",
          bg: "bg-emerald-400/5",
          button: "bg-emerald-500 hover:bg-emerald-400 text-black",
          glow: "shadow-[0_0_20px_rgba(52,211,153,0.3)]"
        };
      case "Amarelo":
        return {
          border: "border-amber-400/50",
          bg: "bg-amber-400/5",
          button: "bg-amber-500 hover:bg-amber-400 text-black",
          glow: "shadow-[0_0_20px_rgba(251,191,36,0.3)]"
        };
      case "Vermelho":
        return {
          border: "border-rose-500/50",
          bg: "bg-rose-500/5",
          button: "bg-rose-500 hover:bg-rose-400 text-white",
          glow: "shadow-[0_0_20px_rgba(244,63,94,0.3)]"
        };
      default:
        return {
          border: "border-cyan-400/50",
          bg: "bg-cyan-400/5",
          button: "bg-cyan-500 hover:bg-cyan-400 text-black",
          glow: "shadow-[0_0_20px_rgba(34,211,238,0.3)]"
        };
    }
  };

  const colors = getStatusColor(status);
  const shouldPulse = status === "Vermelho" || status === "Amarelo";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3 }}
      data-testid="nudge-action-card"
      className={`
        relative border-2 ${colors.border} ${colors.bg} ${colors.glow}
        backdrop-blur-xl rounded-md p-6 overflow-hidden
        ${shouldPulse ? 'animate-pulse-glow' : ''}
      `}
    >
      {/* Glowing border animation */}
      <div className="absolute inset-0 pointer-events-none">
        <div className={`absolute inset-0 ${colors.border} opacity-30 animate-pulse`} />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-amber-400" />
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white">
            AÇÃO IMEDIATA (5 MIN)
          </h3>
        </div>

        {/* Nudge Text */}
        <p className="text-base sm:text-lg text-white leading-relaxed mb-6 font-body" data-testid="nudge-text">
          {nudge}
        </p>

        {/* Action Button */}
        <button
          className={`
            w-full flex items-center justify-center gap-2
            px-6 py-3 rounded-md font-semibold
            transition-all duration-200
            ${colors.button}
          `}
          data-testid="nudge-action-button"
        >
          Iniciar Agora
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

export default NudgeCard;
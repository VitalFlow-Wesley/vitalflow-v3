import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const VScoreDisplay = ({ analysis }) => {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    // Animate the score counting up
    let start = 0;
    const end = analysis.v_score;
    const duration = 1500;
    const increment = end / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayScore(end);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [analysis.v_score]);

  const getStatusColor = (status) => {
    switch (status) {
      case "Verde":
        return {
          text: "text-emerald-400",
          bg: "bg-emerald-400/10",
          border: "border-emerald-400/30",
          glow: "data-glow-green"
        };
      case "Amarelo":
        return {
          text: "text-amber-400",
          bg: "bg-amber-400/10",
          border: "border-amber-400/30",
          glow: "data-glow-yellow"
        };
      case "Vermelho":
        return {
          text: "text-rose-500",
          bg: "bg-rose-500/10",
          border: "border-rose-500/30",
          glow: "data-glow-red"
        };
      default:
        return {
          text: "text-cyan-400",
          bg: "bg-cyan-400/10",
          border: "border-cyan-400/30",
          glow: ""
        };
    }
  };

  const colors = getStatusColor(analysis.status_visual);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      data-testid="vscore-display"
      className={`relative border ${colors.border} ${colors.bg} backdrop-blur-xl rounded-md overflow-hidden scanline-bg p-8`}
    >
      {/* Background pattern */}
      <div 
        className="absolute inset-0 opacity-10 bg-cover bg-center"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1762278804951-43ec485de332?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTJ8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGRhcmslMjB0ZWNoJTIwZ3JlZW4lMjBkYXRhJTIwbGluZXN8ZW58MHx8fHwxNzc0NzM2OTAwfDA&ixlib=rb-4.1.0&q=85')`,
          maskImage: 'radial-gradient(circle, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 70%)'
        }}
      />

      <div className="relative z-10">
        {/* Label */}
        <div className="mb-4">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">V-SCORE</span>
        </div>

        {/* Score */}
        <div className="flex items-baseline gap-2 mb-6">
          <motion.span
            key={displayScore}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            data-testid="vscore-value"
            className={`text-6xl sm:text-7xl font-mono font-bold tracking-tighter ${colors.text} ${colors.glow}`}
          >
            {displayScore}
          </motion.span>
          <span className="text-2xl text-neutral-500 font-mono">/100</span>
        </div>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${colors.bg} ${colors.border} border-2`} />
          <span className={`text-sm font-semibold uppercase tracking-wider ${colors.text}`}>
            {analysis.status_visual}
          </span>
        </div>

        {/* Timestamp */}
        <div className="mt-6 pt-6 border-t border-white/5">
          <p className="text-xs text-neutral-500">
            Análise realizada em {new Date(analysis.timestamp).toLocaleString('pt-BR')}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default VScoreDisplay;
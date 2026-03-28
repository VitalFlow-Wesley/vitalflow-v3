import { AlertCircle, CheckCircle, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

const AIAnalysis = ({ tag, cause, status }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case "Verde":
        return { icon: CheckCircle, color: "text-emerald-400" };
      case "Amarelo":
        return { icon: AlertTriangle, color: "text-amber-400" };
      case "Vermelho":
        return { icon: AlertCircle, color: "text-rose-500" };
      default:
        return { icon: AlertCircle, color: "text-cyan-400" };
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Verde":
        return {
          border: "border-emerald-400/30",
          bg: "bg-emerald-400/10",
          text: "text-emerald-400"
        };
      case "Amarelo":
        return {
          border: "border-amber-400/30",
          bg: "bg-amber-400/10",
          text: "text-amber-400"
        };
      case "Vermelho":
        return {
          border: "border-rose-500/30",
          bg: "bg-rose-500/10",
          text: "text-rose-500"
        };
      default:
        return {
          border: "border-cyan-400/30",
          bg: "bg-cyan-400/10",
          text: "text-cyan-400"
        };
    }
  };

  const { icon: StatusIcon, color: iconColor } = getStatusIcon(status);
  const colors = getStatusColor(status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      data-testid="ai-analysis-card"
      className={`border ${colors.border} bg-neutral-900/40 backdrop-blur-xl rounded-md p-6 space-y-4`}
    >
      {/* Tag */}
      <div className="flex items-center gap-3">
        <StatusIcon className={`w-5 h-5 ${iconColor}`} />
        <span className={`font-mono text-sm font-bold uppercase tracking-wider ${colors.text}`} data-testid="analysis-tag">
          [{tag}]
        </span>
      </div>

      {/* Cause */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400 mb-2">
          CAUSA PROVÁVEL
        </h4>
        <p className="text-sm sm:text-base text-white leading-relaxed font-body" data-testid="analysis-cause">
          {cause}
        </p>
      </div>
    </motion.div>
  );
};

export default AIAnalysis;
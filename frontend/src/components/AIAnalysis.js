import {
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Minus,
} from "lucide-react";
import { motion } from "framer-motion";

function normalizeVisualState(statusValue, tagValue, scoreValue) {
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
      icon: AlertCircle,
      iconColor: "text-rose-400",
      border: "border-rose-500/30",
      bg: "bg-rose-500/8",
      soft: "bg-rose-500/10",
      text: "text-rose-300",
      title: "Análise de tendências",
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
      icon: AlertTriangle,
      iconColor: "text-amber-300",
      border: "border-amber-500/30",
      bg: "bg-amber-500/8",
      soft: "bg-amber-500/10",
      text: "text-amber-300",
      title: "Análise de tendências",
    };
  }

  return {
    key: "normal",
    icon: CheckCircle,
    iconColor: "text-emerald-400",
    border: "border-emerald-500/25",
    bg: "bg-emerald-500/8",
    soft: "bg-emerald-500/10",
    text: "text-emerald-300",
    title: "Análise de tendências",
  };
}

function getTrendMeta(history = []) {
  if (!Array.isArray(history) || history.length < 2) {
    return {
      label: "Sem histórico suficiente",
      description: "Ainda não há dados suficientes para identificar uma tendência confiável.",
      icon: Minus,
      color: "text-neutral-400",
    };
  }

  const ordered = [...history].sort((a, b) => {
    const ta = a?.timestamp ? new Date(a.timestamp).getTime() : 0;
    const tb = b?.timestamp ? new Date(b.timestamp).getTime() : 0;
    return tb - ta;
  });

  const latest = Number(ordered[0]?.v_score ?? 0);
  const previous = Number(ordered[1]?.v_score ?? latest);
  const delta = latest - previous;

  if (delta >= 8) {
    return {
      label: "Melhora recente",
      description: "Seu V-Score subiu em relação à leitura anterior.",
      icon: TrendingUp,
      color: "text-emerald-300",
    };
  }

  if (delta <= -8) {
    return {
      label: "Queda",
      description: "Seu padrão recente mostra redução de resiliência.",
      icon: TrendingDown,
      color: "text-rose-300",
    };
  }

  return {
    label: "Estável",
    description: "Seu comportamento recente está relativamente constante.",
    icon: Minus,
    color: "text-amber-300",
  };
}

const AIAnalysis = ({ analysis }) => {
  const tag = analysis?.tag_rapida || "Sem leitura";
  const cause =
    analysis?.causa_provavel || "Ainda não há uma causa provável disponível.";
  const status = analysis?.status_visual || "Normal";
  const score = analysis?.v_score ?? 0;
  const history = analysis?.history || [];

  const visual = normalizeVisualState(status, tag, score);
  const HeaderIcon = visual.icon;

  const trend = getTrendMeta(history);
  const TrendMetaIcon = trend.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      data-testid="ai-analysis-card"
      className={`border ${visual.border} ${visual.bg} backdrop-blur-xl rounded-[28px] p-5`}
    >
      <div className="flex items-center gap-2 mb-4">
        <HeaderIcon className={`w-5 h-5 ${visual.iconColor}`} />
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
          {visual.title}
        </h3>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.35fr_0.65fr] gap-4 items-start">
        <div className="space-y-3">
          <div className={`rounded-2xl border ${visual.border} ${visual.soft} px-5 py-4`}>
            <p
              className={`text-[1.85rem] font-black leading-tight ${visual.text}`}
              data-testid="analysis-tag"
            >
              {tag}
            </p>
          </div>

          <div className={`rounded-2xl border ${visual.border} bg-neutral-950/35 px-5 py-4`}>
            <p
              className="text-sm sm:text-[15px] text-white leading-7 max-w-3xl"
              data-testid="analysis-cause"
            >
              {cause}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl border border-white/10 bg-neutral-950/35 px-5 py-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendMetaIcon className={`w-4 h-4 ${trend.color}`} />
              <p className={`text-sm font-bold ${trend.color}`}>
                {trend.label}
              </p>
            </div>
            <p className="text-sm text-neutral-400 leading-6">
              {trend.description}
            </p>
          </div>

        </div>
      </div>
    </motion.div>
  );
};

export default AIAnalysis;
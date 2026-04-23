import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";

const STATUS_PRESETS = {
  normal: {
    key: "normal",
    color: "#34d399",
    rgb: "52, 211, 153",
    label: "NORMAL",
    pulseSpeed: 3.8,
    glowSize: 110,
    glowOpacity: 0.34,
    title: "Resiliência ótima",
    subtitle: "Seu estado fisiológico está estável e positivo.",
  },
  atencao: {
    key: "atencao",
    color: "#fbbf24",
    rgb: "251, 191, 36",
    label: "ATENÇÃO",
    pulseSpeed: 2.2,
    glowSize: 125,
    glowOpacity: 0.42,
    title: "Atenção moderada",
    subtitle: "Seu corpo indica necessidade de pequenas correções.",
  },
  critico: {
    key: "critico",
    color: "#f43f5e",
    rgb: "244, 63, 94",
    label: "CRÍTICO",
    pulseSpeed: 1.25,
    glowSize: 145,
    glowOpacity: 0.56,
    title: "Recuperação crítica",
    subtitle: "Seu estado atual exige atenção imediata.",
  },
};

function normalizeStatus(statusValue, scoreValue, tagValue) {
  const status = String(statusValue || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  const tag = String(tagValue || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  const score = Number(scoreValue ?? 0);

  // Score tem prioridade — evita conflito entre score e tag
  if (score >= 80) return STATUS_PRESETS.normal;
  if (score >= 50) return STATUS_PRESETS.atencao;
  return STATUS_PRESETS.critico;
}

const StatusOrb = ({
  status,
  vScore,
  score,
  areas,
  tag,
}) => {
  const finalScore =
    score !== undefined && score !== null
      ? score
      : vScore !== undefined && vScore !== null
      ? vScore
      : 0;

  const config = useMemo(
    () => normalizeStatus(status, finalScore, tag),
    [status, finalScore, tag]
  );

  const isCritical = config.key === "critico";
  const isAttention = config.key === "atencao";

  return (
    <div
      className="border border-white/10 bg-neutral-900/40 backdrop-blur-xl rounded-[28px] p-6 md:p-7 flex flex-col relative overflow-hidden h-full"
      data-testid="status-orb-container"
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 35%, rgba(${config.rgb}, 0.09) 0%, transparent 68%)`,
          transition: "background 0.9s ease-in-out",
        }}
      />

      <div className="relative z-10">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-300 mb-3">
          Status Vital
        </h3>

        <h2 className="text-3xl md:text-[2rem] leading-tight font-black text-white mb-2">
          {config.title}
        </h2>

        <p className="text-sm text-neutral-400 leading-6 mb-6">
          {config.subtitle}
        </p>
      </div>

      <div className="relative z-10 flex items-center justify-center mb-6">
        <div
          className="relative flex items-center justify-center"
          style={{ width: 280, height: 280 }}
        >
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 280,
              height: 280,
              border: `1px solid rgba(${config.rgb}, 0.12)`,
            }}
            animate={{
              scale: [1, 1.08, 1],
              opacity: [0.3, 0.08, 0.3],
            }}
            transition={{
              duration: config.pulseSpeed * 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          <motion.div
            className="absolute rounded-full"
            style={{
              width: 220,
              height: 220,
              border: `1px solid rgba(${config.rgb}, 0.18)`,
            }}
            animate={{
              scale: [1, 1.06, 1],
              opacity: [0.36, 0.12, 0.36],
            }}
            transition={{
              duration: config.pulseSpeed * 1.15,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.2,
            }}
          />

          <motion.div
            className="absolute rounded-full"
            style={{
              width: config.glowSize,
              height: config.glowSize,
              background: `radial-gradient(circle, rgba(${config.rgb}, ${config.glowOpacity}) 0%, transparent 70%)`,
              filter: "blur(26px)",
            }}
            animate={
              isCritical
                ? {
                    scale: [1, 1.38, 1.1, 1.32, 1],
                    opacity: [0.6, 1, 0.72, 0.96, 0.6],
                  }
                : isAttention
                ? {
                    scale: [1, 1.22, 1],
                    opacity: [0.52, 0.88, 0.52],
                  }
                : {
                    scale: [1, 1.16, 1],
                    opacity: [0.45, 0.78, 0.45],
                  }
            }
            transition={{
              duration: config.pulseSpeed,
              repeat: Infinity,
              ease: isCritical ? "easeOut" : "easeInOut",
            }}
          />

          <motion.div
            className="relative rounded-full flex items-center justify-center"
            style={{
              width: 150,
              height: 150,
              background: `radial-gradient(circle at 35% 35%, rgba(${config.rgb}, 0.96) 0%, rgba(${config.rgb}, 0.55) 48%, rgba(${config.rgb}, 0.18) 100%)`,
              boxShadow: isCritical
                ? `0 0 55px rgba(${config.rgb}, 0.55), inset 0 0 35px rgba(255,255,255,0.08)`
                : `0 0 45px rgba(${config.rgb}, 0.42), inset 0 0 30px rgba(255,255,255,0.08)`,
            }}
            data-testid="status-orb"
            animate={
              isCritical
                ? {
                    scale: [1, 1.045, 0.985, 1.03, 1],
                    x: [0, -1.2, 1.2, -0.8, 0],
                  }
                : isAttention
                ? {
                    scale: [1, 1.04, 1],
                  }
                : {
                    scale: [1, 1.05, 1],
                  }
            }
            transition={{
              duration: config.pulseSpeed,
              repeat: Infinity,
              ease: isCritical ? "easeOut" : "easeInOut",
            }}
          >
            <div
              className="absolute rounded-full"
              style={{
                width: 52,
                height: 52,
                top: "20%",
                left: "24%",
                background:
                  "radial-gradient(circle, rgba(255,255,255,0.26) 0%, transparent 72%)",
              }}
            />

            <div className="text-center relative z-10">
              <span
                className="text-4xl md:text-5xl font-mono font-bold text-white"
                style={{
                  textShadow: `0 0 18px rgba(${config.rgb}, 0.45)`,
                }}
                data-testid="orb-vscore"
              >
                {finalScore}
              </span>
            </div>
          </motion.div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={config.key}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.45 }}
          className="flex items-center justify-center gap-2 mb-5 relative z-10"
        >
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{
              backgroundColor: config.color,
              boxShadow: `0 0 10px ${config.color}`,
            }}
          />
          <span
            className="text-sm font-bold uppercase tracking-[0.18em]"
            style={{ color: config.color }}
          >
            {config.label}
          </span>
        </motion.div>
      </AnimatePresence>

      {areas && areas.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center mb-4 relative z-10">
          {areas.map((area) => (
            <span
              key={area}
              className="px-3 py-1 rounded-full text-xs font-semibold border"
              style={{
                color: config.color,
                borderColor: `rgba(${config.rgb}, 0.32)`,
                backgroundColor: `rgba(${config.rgb}, 0.08)`,
              }}
              data-testid={`orb-area-${String(area)
                .toLowerCase()
                .replace(/\s+/g, "-")}`}
            >
              {area}
            </span>
          ))}
        </div>
      )}

      {tag && (
        <p
          className="text-sm text-neutral-500 text-center mt-auto relative z-10"
          data-testid="orb-tag"
        >
          {tag}
        </p>
      )}


    </div>
  );
};

export default StatusOrb;
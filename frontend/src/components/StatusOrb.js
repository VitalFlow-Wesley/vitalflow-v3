import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";

const STATUS_CONFIG = {
  Verde: {
    color: "#34d399",
    rgb: "52, 211, 153",
    label: "Normal",
    pulseSpeed: 4,
    glowSize: 80,
    glowOpacity: 0.3,
  },
  Amarelo: {
    color: "#fbbf24",
    rgb: "251, 191, 36",
    label: "Atenção",
    pulseSpeed: 2.4,
    glowSize: 100,
    glowOpacity: 0.4,
  },
  Vermelho: {
    color: "#f43f5e",
    rgb: "244, 63, 94",
    label: "Crítico",
    pulseSpeed: 1.2,
    glowSize: 120,
    glowOpacity: 0.55,
  },
};

const StatusOrb = ({ status, vScore, areas, tag }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.Verde;
  const [prevStatus, setPrevStatus] = useState(status);
  const orbRef = useRef(null);

  useEffect(() => {
    if (status !== prevStatus) {
      setPrevStatus(status);
    }
  }, [status, prevStatus]);

  const isRed = status === "Vermelho";

  return (
    <div
      className="border border-white/10 bg-neutral-900/40 backdrop-blur-xl rounded-md p-8 flex flex-col items-center relative overflow-hidden"
      data-testid="status-orb-container"
    >
      {/* Subtle background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 40%, rgba(${config.rgb}, 0.06) 0%, transparent 70%)`,
          transition: "background 1.5s ease-in-out",
        }}
      />

      {/* Label */}
      <div className="mb-8 relative z-10">
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400 text-center">
          STATUS VITAL
        </h3>
      </div>

      {/* Orb */}
      <div className="relative flex items-center justify-center mb-8" style={{ width: 200, height: 200 }}>
        {/* Outer ring - slow pulse */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 200,
            height: 200,
            border: `1px solid rgba(${config.rgb}, 0.15)`,
            transition: "border-color 1.5s ease-in-out",
          }}
          animate={{
            scale: [1, 1.08, 1],
            opacity: [0.4, 0.15, 0.4],
          }}
          transition={{
            duration: config.pulseSpeed * 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Middle ring - medium pulse */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 160,
            height: 160,
            border: `1px solid rgba(${config.rgb}, 0.2)`,
            transition: "border-color 1.5s ease-in-out",
          }}
          animate={{
            scale: [1, 1.06, 1],
            opacity: [0.5, 0.2, 0.5],
          }}
          transition={{
            duration: config.pulseSpeed * 1.2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.3,
          }}
        />

        {/* Glow layer behind the orb */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: config.glowSize,
            height: config.glowSize,
            background: `radial-gradient(circle, rgba(${config.rgb}, ${config.glowOpacity}) 0%, transparent 70%)`,
            filter: "blur(20px)",
            transition: "all 1.5s ease-in-out",
          }}
          animate={
            isRed
              ? {
                  scale: [1, 1.3, 1.05, 1.25, 1],
                  opacity: [0.6, 1, 0.7, 0.95, 0.6],
                }
              : {
                  scale: [1, 1.15, 1],
                  opacity: [0.5, 0.8, 0.5],
                }
          }
          transition={{
            duration: config.pulseSpeed,
            repeat: Infinity,
            ease: isRed ? "easeOut" : "easeInOut",
          }}
        />

        {/* Main orb */}
        <motion.div
          ref={orbRef}
          className="relative rounded-full flex items-center justify-center"
          style={{
            width: 120,
            height: 120,
            background: `radial-gradient(circle at 35% 35%, rgba(${config.rgb}, 0.9) 0%, rgba(${config.rgb}, 0.5) 50%, rgba(${config.rgb}, 0.2) 100%)`,
            boxShadow: `0 0 40px rgba(${config.rgb}, 0.3), inset 0 0 30px rgba(255, 255, 255, 0.1)`,
            transition: "background 1.5s ease-in-out, box-shadow 1.5s ease-in-out",
          }}
          data-testid="status-orb"
          animate={
            isRed
              ? {
                  scale: [1, 1.04, 0.98, 1.03, 1],
                  x: [0, -1.5, 1.5, -1, 0],
                }
              : {
                  scale: [1, 1.04, 1],
                }
          }
          transition={{
            duration: config.pulseSpeed,
            repeat: Infinity,
            ease: isRed ? "easeOut" : "easeInOut",
          }}
        >
          {/* Inner highlight */}
          <div
            className="absolute rounded-full"
            style={{
              width: 40,
              height: 40,
              top: "20%",
              left: "25%",
              background: `radial-gradient(circle, rgba(255, 255, 255, 0.25) 0%, transparent 70%)`,
            }}
          />

          {/* V-Score inside orb */}
          <div className="text-center relative z-10">
            <span
              className="text-3xl font-mono font-bold"
              style={{ color: "rgba(255, 255, 255, 0.95)", textShadow: `0 0 20px rgba(${config.rgb}, 0.5)` }}
              data-testid="orb-vscore"
            >
              {vScore}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Status label with smooth transition */}
      <AnimatePresence mode="wait">
        <motion.div
          key={status}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-2 mb-6 relative z-10"
        >
          <div
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: config.color,
              boxShadow: `0 0 8px ${config.color}`,
              transition: "all 1.5s ease-in-out",
            }}
          />
          <span
            className="text-sm font-semibold uppercase tracking-wider"
            style={{ color: config.color, transition: "color 1.5s ease-in-out" }}
          >
            {config.label}
          </span>
        </motion.div>
      </AnimatePresence>

      {/* Affected areas as minimal tags */}
      {areas && areas.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center relative z-10">
          {areas.map((area) => (
            <span
              key={area}
              className="px-3 py-1 rounded-full text-xs font-medium border"
              style={{
                color: config.color,
                borderColor: `rgba(${config.rgb}, 0.3)`,
                backgroundColor: `rgba(${config.rgb}, 0.08)`,
                transition: "all 1.5s ease-in-out",
              }}
              data-testid={`orb-area-${area.toLowerCase().replace(/\s+/g, "-")}`}
            >
              {area}
            </span>
          ))}
        </div>
      )}

      {/* Tag */}
      {tag && (
        <p
          className="text-xs text-neutral-500 mt-4 text-center relative z-10"
          data-testid="orb-tag"
        >
          {tag}
        </p>
      )}
    </div>
  );
};

export default StatusOrb;

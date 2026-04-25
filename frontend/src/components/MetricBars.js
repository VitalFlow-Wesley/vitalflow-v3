import { motion } from "framer-motion";
import { Heart, Brain, Dumbbell, Apple } from "lucide-react";

const AREA_ICONS = {
  "Cérebro": Brain,
  "Coração": Heart,
  "Músculos": Dumbbell,
  "Sistema Digestivo": Apple,
  "Sistema Geral": Brain,
};

const STATUS_COLORS = {
  Verde: { color: "#34d399", rgb: "52, 211, 153" },
  Amarelo: { color: "#fbbf24", rgb: "251, 191, 36" },
  Vermelho: { color: "#f43f5e", rgb: "244, 63, 94" },
};

const MetricBars = ({ analysis }) => {
  if (!analysis) return null;

  const { status_visual: status } = analysis;
  const palette = STATUS_COLORS[status] || STATUS_COLORS.Verde;
  const input = analysis.input_data || {};

  const metrics = [
    {
      label: "HRV",
      value: input.hrv ?? 60,
      max: 150,
      unit: "ms",
      ideal: "50-100ms",
      warn: (v) => v < 50,
    },
    {
      label: "BPM",
      value: input.bpm ?? 75,
      max: 180,
      unit: "bpm",
      ideal: "60-100bpm",
      warn: (v) => v > 100,
    },
    {
      label: "Sono",
      value: input.sleep_hours || null,
      max: 12,
      unit: "h",
      ideal: "7-9h",
      warn: (v) => v < 6,
      noData: !input.sleep_hours,
    },
    {
      label: "Carga Cognitiva",
      value: input.cognitive_load ?? 5,
      max: 10,
      unit: "/10",
      ideal: "0-5",
      warn: (v) => v > 7,
    },
  ];

  const areas = analysis.area_afetada || [];

  return (
    <div
      className="border border-white/10 bg-neutral-900/40 backdrop-blur-xl rounded-md p-6 space-y-5"
      data-testid="metric-bars"
    >
      <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">
        MÉTRICAS BIOMÉTRICAS
      </h3>

      {/* Progress bars */}
      <div className="space-y-4">
        {metrics.map((m, i) => {
          const pct = Math.min(100, (m.value / m.max) * 100);
          const isWarning = m.warn(m.value);
          const barColor = isWarning ? palette.color : "rgba(255,255,255,0.2)";

          return (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              data-testid={`metric-${m.label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-neutral-400 font-medium">{m.label}</span>
                <div className="flex items-baseline gap-1">
                  <span
                    className="text-sm font-mono font-bold"
                    style={{
                      color: isWarning ? palette.color : "rgba(255,255,255,0.7)",
                      transition: "color 1s ease",
                    }}
                  >
                    {m.noData ? "--" : m.value}
                  </span>
                  <span className="text-xs text-neutral-600">{m.noData ? "" : m.unit}</span>
                </div>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    backgroundColor: barColor,
                    transition: "background-color 1.5s ease-in-out",
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, delay: i * 0.08, ease: "easeOut" }}
                />
              </div>
              <span className="text-[10px] text-neutral-600 mt-0.5 block">
                Ideal: {m.ideal}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Affected areas - minimal grid */}
      {areas.length > 0 && (
        <div className="pt-4 border-t border-white/5">
          <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400 mb-3">
            ÁREAS AFETADAS
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {["Cérebro", "Coração", "Músculos", "Sistema Digestivo"].map((area) => {
              const isAffected = areas.includes(area);
              const Icon = AREA_ICONS[area] || Brain;
              return (
                <div
                  key={area}
                  className="flex items-center gap-2 px-3 py-2 rounded-md border transition-all duration-700"
                  style={{
                    borderColor: isAffected ? `rgba(${palette.rgb}, 0.3)` : "rgba(255,255,255,0.05)",
                    backgroundColor: isAffected ? `rgba(${palette.rgb}, 0.06)` : "transparent",
                  }}
                  data-testid={`area-indicator-${area.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <Icon
                    className="w-3.5 h-3.5 transition-colors duration-700"
                    style={{ color: isAffected ? palette.color : "rgba(255,255,255,0.15)" }}
                  />
                  <span
                    className="text-xs transition-colors duration-700"
                    style={{ color: isAffected ? palette.color : "rgba(255,255,255,0.2)" }}
                  >
                    {area}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MetricBars;

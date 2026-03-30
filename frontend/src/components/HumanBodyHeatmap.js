import { motion } from "framer-motion";
import { AlertCircle, Brain, Heart, Dumbbell, Apple } from "lucide-react";

const HumanBodyHeatmap = ({ areas, status, tag }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "Verde":
        return {
          primary: "#34d399",
          primaryRgb: "52, 211, 153",
          secondary: "#10b981",
          shadow: "0 0 40px rgba(52, 211, 153, 0.6)"
        };
      case "Amarelo":
        return {
          primary: "#fbbf24",
          primaryRgb: "251, 191, 36",
          secondary: "#f59e0b",
          shadow: "0 0 40px rgba(251, 191, 36, 0.6)"
        };
      case "Vermelho":
        return {
          primary: "#f43f5e",
          primaryRgb: "244, 63, 94",
          secondary: "#ef4444",
          shadow: "0 0 40px rgba(244, 63, 94, 0.6)"
        };
      default:
        return {
          primary: "#22d3ee",
          primaryRgb: "34, 211, 238",
          secondary: "#06b6d4",
          shadow: "0 0 40px rgba(34, 211, 238, 0.6)"
        };
    }
  };

  const colors = getStatusColor(status);
  const isAffectedArea = (area) => areas.includes(area);

  // Define posições das áreas no corpo (em porcentagem)
  const areaPositions = {
    "Cérebro": { top: "8%", left: "50%", icon: Brain },
    "Coração": { top: "32%", left: "50%", icon: Heart },
    "Músculos": { top: "55%", left: "50%", icon: Dumbbell },
    "Sistema Digestivo": { top: "45%", left: "50%", icon: Apple }
  };

  return (
    <div className="border border-white/10 bg-neutral-900/40 backdrop-blur-xl rounded-md p-6 relative overflow-hidden">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">
          MAPA ANATÔMICO
        </h3>
      </div>

      <div className="relative flex items-center justify-center">
        {/* Silhueta Humana com Heatmap */}
        <div className="relative w-full max-w-sm mx-auto" style={{ aspectRatio: "2/3" }}>
          {/* Base da silhueta */}
          <div className="absolute inset-0 flex items-center justify-center">
            <img
              src="https://images.pexels.com/photos/7723385/pexels-photo-7723385.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
              alt="Human body anatomy"
              className="w-full h-full object-contain"
              style={{ 
                filter: 'invert(1) grayscale(1) brightness(2) contrast(1.5)',
                opacity: 0.5
              }}
            />
          </div>

          {/* Contorno da silhueta para melhor definição */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div 
              className="w-full h-full"
              style={{
                background: `radial-gradient(ellipse 40% 70% at 50% 35%, rgba(255, 255, 255, 0.05) 0%, transparent 50%)`,
              }}
            />
          </div>

          {/* Overlay de iluminação base (verde/âmbar sutil) */}
          <div 
            className="absolute inset-0 mix-blend-screen pointer-events-none"
            style={{
              background: `radial-gradient(ellipse 50% 60% at 50% 40%, ${status === 'Vermelho' ? 'rgba(251, 191, 36, 0.15)' : status === 'Amarelo' ? 'rgba(251, 191, 36, 0.2)' : 'rgba(52, 211, 153, 0.15)'} 0%, transparent 65%)`,
              opacity: 0.6
            }}
          />

          {/* Cérebro - Área Superior */}
          {isAffectedArea("Cérebro") && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute z-10"
                style={{
                  top: "8%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: "45%",
                  height: "18%",
                  background: `radial-gradient(ellipse, ${colors.primary} 0%, rgba(${colors.primaryRgb}, 0.6) 35%, rgba(${colors.primaryRgb}, 0.2) 60%, transparent 80%)`,
                  filter: `blur(15px)`,
                  mixBlendMode: "screen"
                }}
              />
              {/* Glow extra para status crítico */}
              {status === "Vermelho" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.4, 0.8, 0.4] }}
                  transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute z-10"
                  style={{
                    top: "8%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "55%",
                    height: "22%",
                    background: `radial-gradient(ellipse, ${colors.primary} 0%, transparent 60%)`,
                    filter: `blur(25px)`,
                    mixBlendMode: "screen"
                  }}
                />
              )}
            </>
          )}

          {/* Coração - Área do Tórax */}
          {isAffectedArea("Coração") && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute z-10"
                style={{
                  top: "32%",
                  left: "48%",
                  transform: "translate(-50%, -50%)",
                  width: "35%",
                  height: "22%",
                  background: `radial-gradient(ellipse, ${colors.primary} 0%, rgba(${colors.primaryRgb}, 0.7) 30%, rgba(${colors.primaryRgb}, 0.3) 55%, transparent 75%)`,
                  filter: `blur(12px)`,
                  mixBlendMode: "screen"
                }}
              />
              {/* Glow extra para status crítico */}
              {status === "Vermelho" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.5, 0.9, 0.5] }}
                  transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute z-10"
                  style={{
                    top: "32%",
                    left: "48%",
                    transform: "translate(-50%, -50%)",
                    width: "45%",
                    height: "28%",
                    background: `radial-gradient(ellipse, ${colors.primary} 0%, transparent 55%)`,
                    filter: `blur(22px)`,
                    mixBlendMode: "screen"
                  }}
                />
              )}
            </>
          )}

          {/* Músculos - Braços e Pernas */}
          {isAffectedArea("Músculos") && (
            <>
              {/* Braços */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute"
                style={{
                  top: "40%",
                  left: "20%",
                  width: "25%",
                  height: "30%",
                  background: `linear-gradient(180deg, ${colors.primary} 0%, rgba(${colors.primaryRgb}, 0.3) 50%, transparent 100%)`,
                  filter: `blur(22px) drop-shadow(${colors.shadow})`,
                  mixBlendMode: "screen"
                }}
              />
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                className="absolute"
                style={{
                  top: "40%",
                  right: "20%",
                  width: "25%",
                  height: "30%",
                  background: `linear-gradient(180deg, ${colors.primary} 0%, rgba(${colors.primaryRgb}, 0.3) 50%, transparent 100%)`,
                  filter: `blur(22px) drop-shadow(${colors.shadow})`,
                  mixBlendMode: "screen"
                }}
              />
              {/* Pernas */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                className="absolute"
                style={{
                  bottom: "5%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "50%",
                  height: "35%",
                  background: `linear-gradient(180deg, rgba(${colors.primaryRgb}, 0.4) 0%, ${colors.primary} 40%, rgba(${colors.primaryRgb}, 0.2) 100%)`,
                  filter: `blur(25px) drop-shadow(${colors.shadow})`,
                  mixBlendMode: "screen"
                }}
              />
            </>
          )}

          {/* Sistema Digestivo - Área Abdominal */}
          {isAffectedArea("Sistema Digestivo") && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.6, 0.9, 0.6] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute"
              style={{
                top: "42%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "35%",
                height: "22%",
                background: `radial-gradient(ellipse, ${colors.primary} 0%, rgba(${colors.primaryRgb}, 0.4) 40%, transparent 70%)`,
                filter: `blur(20px) drop-shadow(${colors.shadow})`,
                mixBlendMode: "screen"
              }}
            />
          )}

          {/* Tags com linhas conectoras */}
          {areas.map((area, index) => {
            const position = areaPositions[area];
            if (!position) return null;

            const Icon = position.icon;
            const angle = index * 30 - 45; // Distribui as tags ao redor
            const distance = 120; // Distância do centro
            const x = Math.cos((angle * Math.PI) / 180) * distance;
            const y = Math.sin((angle * Math.PI) / 180) * distance;

            return (
              <motion.div
                key={area}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="absolute"
                style={{
                  top: position.top,
                  left: position.left,
                }}
              >
                {/* Linha conectora */}
                <svg
                  className="absolute pointer-events-none"
                  style={{
                    left: "0",
                    top: "0",
                    width: Math.abs(x) + 50,
                    height: Math.abs(y) + 50,
                    transform: `translate(${x > 0 ? '0' : x - 50}px, ${y > 0 ? '0' : y - 50}px)`
                  }}
                >
                  <motion.line
                    x1={x > 0 ? 0 : Math.abs(x)}
                    y1={y > 0 ? 0 : Math.abs(y)}
                    x2={x > 0 ? x : 0}
                    y2={y > 0 ? y : 0}
                    stroke={colors.primary}
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.6 }}
                    transition={{ duration: 0.8, delay: 0.3 + index * 0.1 }}
                  />
                </svg>

                {/* Tag */}
                <motion.div
                  className="absolute flex items-center gap-2 px-3 py-1.5 rounded-md border whitespace-nowrap"
                  style={{
                    background: `rgba(${colors.primaryRgb}, 0.1)`,
                    borderColor: colors.primary,
                    left: x,
                    top: y,
                    boxShadow: `0 0 15px rgba(${colors.primaryRgb}, 0.3)`
                  }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1, type: "spring" }}
                >
                  <Icon className="w-3 h-3" style={{ color: colors.primary }} />
                  <span className="text-xs font-mono font-bold" style={{ color: colors.primary }}>
                    {area.toUpperCase()}
                  </span>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Status Summary */}
      <div className="mt-6 pt-4 border-t border-white/5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-neutral-500">
            {areas.length} {areas.length === 1 ? 'área afetada' : 'áreas afetadas'}
          </span>
          <div className="flex items-center gap-2">
            <div 
              className="w-2 h-2 rounded-full"
              style={{ 
                backgroundColor: colors.primary,
                boxShadow: colors.shadow
              }}
            />
            <span className="text-xs font-semibold" style={{ color: colors.primary }}>
              {status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HumanBodyHeatmap;
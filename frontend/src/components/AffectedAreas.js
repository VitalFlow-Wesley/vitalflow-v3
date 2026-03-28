import { Brain, Heart, Dumbbell, Apple } from "lucide-react";
import { motion } from "framer-motion";

const AffectedAreas = ({ areas, status }) => {
  const areaIcons = {
    "Cérebro": { icon: Brain, color: "text-purple-400" },
    "Coração": { icon: Heart, color: "text-rose-500" },
    "Músculos": { icon: Dumbbell, color: "text-cyan-400" },
    "Sistema Digestivo": { icon: Apple, color: "text-green-400" },
    "Sistema Geral": { icon: Brain, color: "text-cyan-400" }
  };

  const allAreas = ["Cérebro", "Coração", "Músculos", "Sistema Digestivo"];

  const getStatusColor = (status) => {
    switch (status) {
      case "Verde":
        return "border-emerald-400/30";
      case "Amarelo":
        return "border-amber-400/30";
      case "Vermelho":
        return "border-rose-500/30";
      default:
        return "border-cyan-400/30";
    }
  };

  return (
    <div 
      className={`border ${getStatusColor(status)} bg-neutral-900/40 backdrop-blur-xl rounded-md p-6`}
      data-testid="affected-areas"
    >
      <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400 mb-4">
        ÁREAS AFETADAS
      </h3>

      <div className="grid grid-cols-2 gap-4">
        {allAreas.map((area, index) => {
          const isAffected = areas.includes(area);
          const { icon: Icon, color } = areaIcons[area];

          return (
            <motion.div
              key={area}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              data-testid={`area-${area.toLowerCase().replace(/\s+/g, '-')}`}
              className={`
                flex flex-col items-center justify-center p-4 rounded-md border
                transition-all duration-200
                ${
                  isAffected
                    ? `${color} border-white/20 bg-white/5`
                    : 'text-neutral-600 border-white/5 bg-neutral-900/20'
                }
              `}
            >
              <Icon className="w-8 h-8 mb-2" />
              <span className="text-xs font-medium text-center">{area}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default AffectedAreas;
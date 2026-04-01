import { Flame, Zap } from "lucide-react";

const GamificationBar = ({ energyPoints, currentStreak }) => {
  return (
    <div className="flex items-center gap-3" data-testid="gamification-bar">
      {/* Energy Points */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
        <Zap className="w-3 h-3 text-amber-400" />
        <span className="text-xs font-mono font-bold text-amber-400" data-testid="energy-points">
          {energyPoints || 0}
        </span>
      </div>

      {/* Streak */}
      {currentStreak > 0 && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20">
          <Flame className="w-3 h-3 text-orange-400" />
          <span className="text-xs font-mono font-bold text-orange-400" data-testid="streak-count">
            {currentStreak}d
          </span>
        </div>
      )}
    </div>
  );
};

export default GamificationBar;

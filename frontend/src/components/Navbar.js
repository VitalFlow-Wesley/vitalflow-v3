import { useNavigate } from "react-router-dom";
import {
  Brain,
  Circle,
  Zap,
  Flame,
  BarChart3,
  User,
  Wifi,
} from "lucide-react";

export default function Navbar() {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#050505]/95 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-6">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex items-center gap-3"
        >
          <Brain className="h-9 w-9 text-cyan-400" />
          <span className="text-2xl font-black text-white">VitalFlow</span>
          <Circle className="h-2.5 w-2.5 fill-emerald-400 text-emerald-400" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
            <Circle className="h-3 w-3 fill-emerald-400 text-emerald-400" />
            Normal
          </div>

          <div className="flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-sm font-bold text-amber-300">
            <Zap className="h-4 w-4" />
            300
          </div>

          <div className="flex items-center gap-2 rounded-full border border-orange-400/20 bg-orange-400/10 px-3 py-2 text-sm font-bold text-orange-300">
            <Flame className="h-4 w-4" />
            1d
          </div>

          <div className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-slate-300 md:flex">
            <Wifi className="h-4 w-4 text-emerald-300" />
            Sincronizado com wearables
          </div>

          <button
            type="button"
            onClick={() => navigate("/gestor")}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-bold text-white transition hover:border-cyan-400/25 hover:bg-white/[0.06]"
          >
            <BarChart3 className="h-4 w-4" />
            Gestor
          </button>

          <button
            type="button"
            onClick={() => navigate("/profile")}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-bold text-white transition hover:border-cyan-400/25 hover:bg-white/[0.06]"
          >
            <User className="h-4 w-4" />
            WESLEY
          </button>
        </div>
      </div>
    </header>
  );
}

import { Brain } from "lucide-react";

const Navbar = ({ onOpenForm }) => {
  return (
    <nav 
      className="sticky top-0 z-50 glass-header border-b border-white/10"
      data-testid="navbar"
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Brain className="w-8 h-8 text-cyan-400" />
            <h1 className="text-xl sm:text-2xl font-black tracking-tighter text-white font-heading">
              VitalFlow
            </h1>
          </div>

          {/* CTA Button */}
          <button
            onClick={onOpenForm}
            data-testid="add-data-button"
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black text-sm font-semibold rounded-md transition-all duration-200"
          >
            + Adicionar Dados
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
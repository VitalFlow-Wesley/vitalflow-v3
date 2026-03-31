import { Brain, Settings, User, LogOut, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useState, useRef, useEffect } from "react";
import EnergyStatus from "./EnergyStatus";

const Navbar = ({ onOpenForm }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav 
      className="sticky top-0 z-50 glass-header border-b border-white/10"
      data-testid="navbar"
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
            <Brain className="w-8 h-8 text-cyan-400" />
            <h1 className="text-xl sm:text-2xl font-black tracking-tighter text-white font-heading">
              VitalFlow
            </h1>
          </div>

          {/* Energy Status */}
          <div className="hidden lg:block">
            <EnergyStatus />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Dashboard Gestor (apenas para gestores) */}
            {user?.nivel_acesso === 'Gestor' && (
              <button
                onClick={() => navigate("/gestor")}
                data-testid="gestor-dashboard-button"
                className="px-3 py-2 border border-purple-500/30 text-purple-400 text-sm font-semibold rounded-md hover:bg-purple-500/10 transition-all duration-200 flex items-center gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </button>
            )}

            <button
              onClick={() => navigate("/devices")}
              data-testid="devices-button"
              className="px-3 py-2 border border-white/20 text-white text-sm font-semibold rounded-md hover:bg-white/5 transition-all duration-200 flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Dispositivos</span>
            </button>
            <button
              onClick={onOpenForm}
              data-testid="add-data-button"
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black text-sm font-semibold rounded-md transition-all duration-200"
            >
              + Adicionar Dados
            </button>

            {/* User Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 border border-white/20 rounded-md hover:bg-white/5 transition-all duration-200"
                data-testid="user-menu-button"
              >
                {user?.foto_url ? (
                  <img
                    src={user.foto_url}
                    alt={user.nome}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center">
                    <User className="w-4 h-4 text-black" />
                  </div>
                )}
                <span className="text-white text-sm font-medium hidden sm:inline">
                  {user?.nome?.split(' ')[0]}
                </span>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-neutral-900 border border-white/10 rounded-md shadow-xl z-50">
                  <div className="p-3 border-b border-white/10">
                    <p className="text-sm font-semibold text-white">{user?.nome}</p>
                    <p className="text-xs text-neutral-400">{user?.email}</p>
                    <p className="text-xs text-cyan-400 mt-1">{user?.setor}</p>
                  </div>
                  <button
                    onClick={() => {
                      navigate('/profile');
                      setDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-white hover:bg-white/5 transition-colors"
                    data-testid="profile-menu-item"
                  >
                    <User className="w-4 h-4" />
                    Meu Perfil
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors border-t border-white/10"
                    data-testid="logout-button"
                  >
                    <LogOut className="w-4 h-4" />
                    Sair
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
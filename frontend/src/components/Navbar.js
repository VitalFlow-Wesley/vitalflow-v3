import {
  Brain,
  Settings,
  User,
  LogOut,
  BarChart3,
  Radio,
  FileText,
  LayoutDashboard,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import GamificationBar from "./GamificationBar";
import ConnectionStatus from "./ConnectionStatus";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "https://vitalflow.up.railway.app";
const API = `${BACKEND_URL}/api`;

function normalizeNavbarStatus(latestAnalysis) {
  const rawStatus = String(latestAnalysis?.status_visual || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  const rawTag = String(latestAnalysis?.tag_rapida || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  const score = Number(latestAnalysis?.v_score ?? 0);

  if (
    rawStatus.includes("vermelho") ||
    rawStatus.includes("critico") ||
    rawStatus.includes("urgente") ||
    rawTag.includes("urgente") ||
    rawTag.includes("critico") ||
    score < 50
  ) {
    return "Crítico";
  }

  if (
    rawStatus.includes("amarelo") ||
    rawStatus.includes("atencao") ||
    rawStatus.includes("stress") ||
    rawStatus.includes("alerta") ||
    rawTag.includes("stress") ||
    rawTag.includes("alerta") ||
    (score >= 50 && score < 80)
  ) {
    return "Atenção";
  }

  return "Normal";
}

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [currentStatus, setCurrentStatus] = useState("Normal");
  const [hasConnectedWearables, setHasConnectedWearables] = useState(false);
  const [hasAnalysisData, setHasAnalysisData] = useState(false);

  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchLatestStatus = async () => {
      try {
        const { data } = await axios.get(`${API}/history?limit=1`, {
          withCredentials: true,
        });

        if (Array.isArray(data) && data.length > 0) {
          setCurrentStatus(normalizeNavbarStatus(data[0]));
          setHasAnalysisData(true);
          return;
        }

        setCurrentStatus("Normal");
        setHasAnalysisData(false);
      } catch (error) {
        console.error("Erro ao buscar status do navbar:", error);
        setCurrentStatus("Normal");
        setHasAnalysisData(false);
      }
    };

    const fetchWearableState = async () => {
      try {
        const { data } = await axios.get(`${API}/wearables`, {
          withCredentials: true,
        });

        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.devices)
          ? data.devices
          : [];

        setHasConnectedWearables(list.some((device) => device?.is_connected));
      } catch (error) {
        console.error("Erro ao buscar wearables do navbar:", error);
        setHasConnectedWearables(false);
      }
    };

    fetchLatestStatus();
    fetchWearableState();

    const interval = setInterval(() => {
      fetchLatestStatus();
      fetchWearableState();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const ROLE_LEVELS_NAV = {
    CEO: 1,
    Diretor: 2,
    "Ger. Executivo": 3,
    "Ger. Operacional": 4,
    Coordenador: 5,
    Supervisor: 6,
    Gestor: 7,
    Colaborador: 8,
  };

  const isGestor = (ROLE_LEVELS_NAV[user?.nivel_acesso] || 99) <= 7;
  const isRelatorio = location.pathname === "/relatorio";
  const isGestorPage = location.pathname === "/gestor";
  const isDevicesPage = location.pathname === "/devices";

  const navButtonClass = (active) =>
    `px-3 py-2 border text-sm font-semibold rounded-xl transition-all duration-200 flex items-center gap-2 ${
      active
        ? "border-cyan-400/30 bg-cyan-500/10 text-cyan-300"
        : "border-white/20 text-white hover:bg-white/5"
    }`;

  const statusStyles = {
    Normal: {
      wrapper: "border-emerald-500/20 bg-emerald-500/10",
      dot: "bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.95)]",
      text: "text-emerald-300",
    },
    Atenção: {
      wrapper: "border-amber-500/20 bg-amber-500/10",
      dot: "bg-amber-400 shadow-[0_0_14px_rgba(251,191,36,0.95)]",
      text: "text-amber-300",
    },
    Crítico: {
      wrapper: "border-rose-500/20 bg-rose-500/10",
      dot: "bg-rose-400 shadow-[0_0_14px_rgba(251,113,133,0.95)]",
      text: "text-rose-300",
    },
  };

  const currentStyle = statusStyles[currentStatus] || statusStyles.Normal;

  return (
    <nav className="sticky top-0 z-50 bg-neutral-950/85 backdrop-blur-xl border-b border-white/10">
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="flex items-center gap-3 cursor-pointer shrink-0"
              onClick={() => navigate("/")}
            >
              <Brain className="w-8 h-8 text-cyan-400" />
              <h1 className="text-xl sm:text-2xl font-black tracking-tighter text-white">
                VitalFlow
              </h1>
            </div>

            <div className="hidden md:block">
              <ConnectionStatus />
            </div>
          </div>

          {hasAnalysisData && (
            <div className="hidden lg:flex items-center gap-4">
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-full border ${currentStyle.wrapper}`}
              >
                <span className={`w-3 h-3 rounded-full ${currentStyle.dot}`} />
                <span className={`font-semibold text-sm ${currentStyle.text}`}>
                  {currentStatus}
                </span>
              </div>

              <GamificationBar
                energyPoints={user?.energy_points}
                currentStreak={user?.current_streak}
              />
            </div>
          )}

          <div className="flex items-center gap-3">
            {hasConnectedWearables && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800/50 border border-white/10">
                <Radio className="w-3 h-3 text-emerald-400" />
                <span className="text-[11px] text-neutral-300">
                  Sincronizado com wearables
                </span>
              </div>
            )}

            {isGestor &&
              (isGestorPage ? (
                <button
                  onClick={() => navigate("/")}
                  className={navButtonClass(false)}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Meus Dados</span>
                </button>
              ) : (
                <button
                  onClick={() => navigate("/gestor")}
                  className={navButtonClass(isGestorPage)}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Gestor</span>
                </button>
              ))}

            {!isRelatorio && (
              <button
                onClick={() => navigate("/relatorio")}
                className={navButtonClass(isRelatorio)}
              >
                <FileText className="w-4 h-4" />
                <span>Relatório</span>
              </button>
            )}

            <button
              onClick={() => navigate("/devices")}
              className={navButtonClass(isDevicesPage)}
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Dispositivos</span>
            </button>

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 border border-white/20 rounded-xl hover:bg-white/5 transition-all duration-200"
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
                  {user?.nome?.split(" ")[0] || "Usuário"}
                </span>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-neutral-900 border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="p-3 border-b border-white/10">
                    <p className="text-sm font-semibold text-white">
                      {user?.nome}
                    </p>
                    <p className="text-xs text-neutral-400">{user?.email}</p>
                  </div>

                  <button
                    onClick={() => {
                      navigate("/profile");
                      setDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-white hover:bg-white/5"
                  >
                    <User className="w-4 h-4" />
                    Meu Perfil
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-rose-400 hover:bg-rose-500/10 border-t border-white/10"
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
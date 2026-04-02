import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import StatusOrb from "../components/StatusOrb";
import MetricBars from "../components/MetricBars";
import AIAnalysis from "../components/AIAnalysis";
import NudgeCard from "../components/NudgeCard";
import HistoryChart from "../components/HistoryChart";
import OnboardingTour from "../components/OnboardingTour";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Lock, Zap, Flame, Trophy, Shield, Smartphone, Radio } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const POLLING_INTERVAL = 10000;

const Dashboard = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const [history, setHistory] = useState([]);
  const [connectedDevices, setConnectedDevices] = useState([]);
  const [predictiveAlert, setPredictiveAlert] = useState(null);
  const [gamStats, setGamStats] = useState(null);
  const [healthTrend, setHealthTrend] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const pollingIntervalRef = useRef(null);
  const lastAnalysisIdRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      await Promise.all([
        fetchHistory(),
        fetchConnectedDevices(),
        fetchPredictiveAlert(),
        fetchGamificationStats(),
        fetchHealthTrend(),
      ]);
      setDataLoaded(true);
      startPolling();
    };
    init();

    // Check if onboarding should be shown
    const onboardingDone = localStorage.getItem("vitalflow_onboarding_done");
    if (!onboardingDone) {
      setShowOnboarding(true);
    }

    return () => stopPolling();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${API}/history?limit=30`, { withCredentials: true });
      setHistory(response.data);
      if (response.data.length > 0 && !currentAnalysis) {
        setCurrentAnalysis(response.data[0]);
        lastAnalysisIdRef.current = response.data[0].id;
      }
    } catch (error) {
      console.error("Erro ao buscar historico:", error);
    }
  };

  const fetchConnectedDevices = async () => {
    try {
      const response = await axios.get(`${API}/wearables`, { withCredentials: true });
      setConnectedDevices(response.data.filter((d) => d.is_connected));
    } catch (error) {
      console.error("Erro ao buscar dispositivos:", error);
    }
  };

  const fetchPredictiveAlert = async () => {
    try {
      const { data } = await axios.get(`${API}/predictive/alert`, { withCredentials: true });
      setPredictiveAlert(data);
    } catch (error) {
      console.error("Erro ao buscar alerta preditivo:", error);
    }
  };

  const fetchGamificationStats = async () => {
    try {
      const { data } = await axios.get(`${API}/gamification/stats`, { withCredentials: true });
      setGamStats(data);
    } catch (error) {
      console.error("Erro ao buscar gamificacao:", error);
    }
  };

  const fetchHealthTrend = async () => {
    try {
      const { data } = await axios.get(`${API}/health/trend`, { withCredentials: true });
      setHealthTrend(data);
    } catch (error) {
      console.error("Erro ao buscar tendencia:", error);
    }
  };

  const checkForNewAnalysis = async () => {
    try {
      const response = await axios.get(`${API}/history?limit=1`, { withCredentials: true });
      if (response.data.length > 0) {
        const latestAnalysis = response.data[0];
        if (lastAnalysisIdRef.current !== latestAnalysis.id) {
          lastAnalysisIdRef.current = latestAnalysis.id;
          setCurrentAnalysis(latestAnalysis);
          await fetchHistory();
          toast.success("Nova analise disponivel!", { duration: 4000 });
        }
      }
    } catch (error) {
      console.error("Erro ao verificar novas analises:", error);
    }
  };

  const startPolling = () => {
    pollingIntervalRef.current = setInterval(checkForNewAnalysis, POLLING_INTERVAL);
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
  };

  const handlePointsEarned = () => {
    fetchGamificationStats();
    refreshUser();
  };

  const handleUpgrade = async () => {
    try {
      await axios.post(`${API}/billing/upgrade`, {}, { withCredentials: true });
      toast.success("Upgrade para Premium realizado!");
      refreshUser();
      fetchPredictiveAlert();
    } catch (error) {
      toast.error("Erro ao realizar upgrade.");
    }
  };

  const isFreeLocked = predictiveAlert?.locked === true;
  const hasDevices = connectedDevices.length > 0;
  const hasData = currentAnalysis !== null;

  return (
    <div className="min-h-screen bg-neutral-950">
      <Navbar />

      {/* Onboarding Tour */}
      {showOnboarding && (
        <OnboardingTour onComplete={() => setShowOnboarding(false)} />
      )}

      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {hasData ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="space-y-6">
            {/* Gamification Stats Bar */}
            {gamStats && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-white/10 bg-neutral-900/40 backdrop-blur-xl rounded-md p-4 flex flex-wrap items-center justify-between gap-4"
                data-testid="gamification-stats"
              >
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span className="text-sm text-neutral-400">Pontos de Energia</span>
                    <span className="text-lg font-mono font-bold text-amber-400" data-testid="dashboard-energy-points">
                      {gamStats.energy_points}
                    </span>
                  </div>
                  {gamStats.current_streak > 0 && (
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-orange-400" />
                      <span className="text-sm text-neutral-400">Streak</span>
                      <span className="text-lg font-mono font-bold text-orange-400" data-testid="dashboard-streak">
                        {gamStats.current_streak} dia(s)
                      </span>
                    </div>
                  )}
                  {gamStats.badges?.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-purple-400" />
                      <span className="text-sm text-purple-400 font-semibold" data-testid="dashboard-badge">
                        Biohacker da Semana
                      </span>
                    </div>
                  )}
                </div>
                <span className="text-xs text-neutral-600">
                  Proximo badge em {gamStats.next_badge_in} dia(s)
                </span>
              </motion.div>
            )}

            {/* Premium Lock Banner */}
            {isFreeLocked && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="border border-amber-500/30 bg-amber-500/5 rounded-md p-4 flex items-center justify-between"
                data-testid="premium-lock-banner"
              >
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-amber-400" />
                  <div>
                    <p className="text-sm font-semibold text-amber-400">IA Preditiva bloqueada</p>
                    <p className="text-xs text-neutral-400">Faca upgrade para Premium e acesse predicoes de estresse</p>
                  </div>
                </div>
                <button
                  onClick={handleUpgrade}
                  data-testid="upgrade-btn"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold rounded-md transition-all"
                >
                  Upgrade Premium
                </button>
              </motion.div>
            )}

            {/* Health Trend - Lei 14.831 Intervention Alert */}
            {healthTrend?.requires_intervention && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="border border-rose-500/40 bg-rose-500/8 rounded-md p-4 flex items-start gap-3"
                data-testid="intervention-alert"
              >
                <Shield className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-rose-400">Intervencao Necessaria</p>
                  <p className="text-xs text-neutral-300 mt-1">{healthTrend.intervention_message}</p>
                </div>
              </motion.div>
            )}

            {/* Predictive Alert (if unlocked and has alert) */}
            {!isFreeLocked && predictiveAlert?.has_alert && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="border border-purple-500/30 bg-purple-500/5 rounded-md p-4"
                data-testid="predictive-alert"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-400">Alerta Preditivo</span>
                  <span className="text-xs text-neutral-500">Confianca: {predictiveAlert.alert.confidence}%</span>
                </div>
                <p className="text-sm text-neutral-200">{predictiveAlert.alert.message}</p>
              </motion.div>
            )}

            {/* Top row: Orb + AI + Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4">
                <StatusOrb
                  status={currentAnalysis.status_visual}
                  vScore={currentAnalysis.v_score}
                  areas={currentAnalysis.area_afetada}
                  tag={currentAnalysis.tag_rapida}
                />
              </div>
              <div className="lg:col-span-4 space-y-6">
                <AIAnalysis
                  tag={currentAnalysis.tag_rapida}
                  cause={currentAnalysis.causa_provavel}
                  status={currentAnalysis.status_visual}
                />
                <NudgeCard
                  nudge={currentAnalysis.nudge_acao}
                  status={currentAnalysis.status_visual}
                  analysisId={currentAnalysis.id}
                  onPointsEarned={handlePointsEarned}
                />
              </div>
              <div className="lg:col-span-4">
                <MetricBars analysis={currentAnalysis} />
              </div>
            </div>

            {/* History Chart */}
            <HistoryChart history={history} />
          </motion.div>
        ) : (
          /* Empty state - Awaiting sync / No data */
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Gamification bar even without data */}
            {gamStats && (
              <div className="border border-white/10 bg-neutral-900/40 backdrop-blur-xl rounded-md p-4 flex flex-wrap items-center gap-6" data-testid="gamification-stats">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span className="text-sm text-neutral-400">Pontos de Energia</span>
                  <span className="text-lg font-mono font-bold text-amber-400" data-testid="dashboard-energy-points">{gamStats.energy_points}</span>
                </div>
              </div>
            )}

            {/* Main empty state */}
            <div className="flex flex-col items-center justify-center py-16">
              <div className="text-center space-y-6 max-w-lg">
                {/* Animated sync icon */}
                <motion.div
                  animate={{ scale: [1, 1.1, 1], opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="w-20 h-20 rounded-full bg-cyan-500/10 border-2 border-cyan-500/20 flex items-center justify-center mx-auto"
                >
                  <Radio className="w-10 h-10 text-cyan-400/70" />
                </motion.div>

                <div>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2" data-testid="awaiting-sync-title">
                    {hasDevices ? "Aguardando sincronizacao" : "Conecte um dispositivo"}
                  </h2>
                  <p className="text-neutral-400 text-sm leading-relaxed">
                    {hasDevices
                      ? "Seu dispositivo esta conectado. Assim que os primeiros dados biometricos forem sincronizados, o VitalFlow ira gerar sua primeira analise automaticamente."
                      : "Para que o VitalFlow analise sua saude, voce precisa conectar um wearable (Google Fit, Apple Watch, Garmin ou Fitbit). Sem dados reais, nao ha analise."
                    }
                  </p>
                </div>

                {!hasDevices && (
                  <button
                    onClick={() => navigate("/devices")}
                    data-testid="connect-wearable-button"
                    className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-black font-bold rounded-lg transition-all duration-200 shadow-lg shadow-cyan-500/20"
                  >
                    <span className="flex items-center gap-2">
                      <Smartphone className="w-5 h-5" />
                      Conectar Dispositivo
                    </span>
                  </button>
                )}

                {hasDevices && (
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs text-emerald-400 font-semibold">
                        {connectedDevices.length} dispositivo(s) conectado(s)
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500">
                      A primeira analise sera gerada automaticamente apos a sincronizacao
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Empty history chart placeholder */}
            <HistoryChart history={[]} />
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

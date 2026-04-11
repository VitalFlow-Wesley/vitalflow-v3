import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import StatusOrb from "../components/StatusOrb";
import MetricBars from "../components/MetricBars";
import AIAnalysis from "../components/AIAnalysis";
import NudgeCard from "../components/NudgeCard";
import HistoryChart from "../components/HistoryChart";
import OnboardingTour from "../components/OnboardingTour";
import FirstAccessFlow from "../components/FirstAccessFlow";
import { queueOfflineData } from "../components/ConnectionStatus";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Zap, Flame, Trophy, Shield, Smartphone, Radio, Stethoscope, X, Moon, Sun } from "lucide-react";

const BACKEND_URL = "https://vitalflow.ia.br";
const API = `${BACKEND_URL}/api`;
const POLLING_INTERVAL = 10000;
const BACKGROUND_SYNC_INTERVAL = 30 * 60 * 1000; // 30 min

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
  const [showFirstAccess, setShowFirstAccess] = useState(false);
  const [showMedicalAlert, setShowMedicalAlert] = useState(false);
  const [medicalAlertData, setMedicalAlertData] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [morningReport, setMorningReport] = useState(null);
  const pollingIntervalRef = useRef(null);
  const bgSyncRef = useRef(null);
  const lastAnalysisIdRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      await Promise.all([
        fetchHistory(),
        fetchConnectedDevices(),
        fetchPredictiveAlert(),
        fetchGamificationStats(),
        fetchHealthTrend(),
        fetchMorningReport(),
      ]);
      setDataLoaded(true);
      startPolling();
    };
    init();

    // Check if first access flow is needed (RH-registered user)
    if (user?.must_change_password || user?.must_accept_lgpd) {
      setShowFirstAccess(true);
    } else {
      // Check if onboarding should be shown
      const onboardingDone = localStorage.getItem("vitalflow_onboarding_done");
      if (!onboardingDone) {
        setShowOnboarding(true);
      }
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
      // Check for critical medical alert
      if (data?.medical_alert?.show) {
        const dismissed = localStorage.getItem("vitalflow_medical_alert_dismissed");
        const today = new Date().toISOString().split("T")[0];
        if (dismissed !== today) {
          setMedicalAlertData(data.medical_alert);
          setShowMedicalAlert(true);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar tendencia:", error);
    }
  };

  const fetchMorningReport = async () => {
    try {
      const { data } = await axios.get(`${API}/health/morning-report`, { withCredentials: true });
      if (data.available) setMorningReport(data);
    } catch {
      // Silencioso
    }
  };

  // Background sync: sincroniza dados do wearable a cada 30 min
  const [lastSyncData, setLastSyncData] = useState(null);

  const backgroundSync = useCallback(async () => {
    try {
      const { data } = await axios.post(`${API}/wearables/sync`, {}, { withCredentials: true });
      if (data.status === "synced") {
        setLastSyncData(data);
        if (data.has_real_data && data.auto_analysis) {
          const a = data.auto_analysis;
          const exerciseMsg = a.exercise_detected ? " | Exercicio detectado!" : "";
          toast.success(
            `Sync Real: V-Score ${a.v_score} (${a.status_visual}) - ${a.recovery_label}${exerciseMsg}`,
            { duration: 5000 }
          );
        } else {
          toast.success("Dados do wearable sincronizados!", { duration: 3000 });
        }
        fetchHistory();
        fetchConnectedDevices();
        fetchMorningReport();
      }
    } catch {
      // Offline: enfileirar sync para quando voltar online
      queueOfflineData("wearables/sync", {});
    }
  }, []);

  // Background sync timer
  useEffect(() => {
    bgSyncRef.current = setInterval(backgroundSync, BACKGROUND_SYNC_INTERVAL);
    // Initial sync on mount
    backgroundSync();
    return () => {
      if (bgSyncRef.current) clearInterval(bgSyncRef.current);
    };
  }, [backgroundSync]);

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
      const originUrl = window.location.origin;
      const { data } = await axios.post(`${API}/billing/create-checkout`, {
        plan_id: "premium_monthly",
        origin_url: originUrl,
      }, { withCredentials: true });
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error("Erro ao iniciar pagamento.");
      }
    } catch (error) {
      const msg = error.response?.data?.detail || "Erro ao processar upgrade.";
      toast.error(msg);
    }
  };

  const isFreeLocked = user?.account_type === "personal" && !user?.is_premium;
  const hasDevices = connectedDevices.length > 0 || history.length > 0;
  const hasData = currentAnalysis !== null;

  return (
    <div className="min-h-screen bg-neutral-950">
      <Navbar />

      {/* First Access Flow (RH-registered users) */}
      {showFirstAccess && (
        <FirstAccessFlow
          user={user}
          onComplete={() => {
            setShowFirstAccess(false);
            refreshUser();
            const onboardingDone = localStorage.getItem("vitalflow_onboarding_done");
            if (!onboardingDone) setShowOnboarding(true);
          }}
        />
      )}

      {/* Medical Consultation Alert Popup */}
      <AnimatePresence>
        {showMedicalAlert && medicalAlertData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 backdrop-blur-sm"
            data-testid="medical-alert-overlay"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md mx-4 bg-neutral-900 border-2 border-rose-500/40 rounded-xl overflow-hidden shadow-2xl shadow-rose-500/10"
              data-testid="medical-alert-modal"
            >
              <div className="h-1.5 bg-gradient-to-r from-rose-500 to-amber-500 w-full" />
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
                    <Stethoscope className="w-6 h-6 text-rose-400" />
                  </div>
                  <button
                    onClick={() => {
                      setShowMedicalAlert(false);
                      localStorage.setItem("vitalflow_medical_alert_dismissed", new Date().toISOString().split("T")[0]);
                    }}
                    className="text-neutral-500 hover:text-white transition-colors"
                    data-testid="dismiss-medical-alert"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <h2 className="text-lg font-black text-rose-400 mb-2" data-testid="medical-alert-title">
                  Recomendacao de Consulta Profissional
                </h2>
                <p className="text-sm text-neutral-300 leading-relaxed mb-4">
                  {medicalAlertData.message}
                </p>
                <div className="bg-rose-500/5 border border-rose-500/20 rounded-md p-3 mb-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-400">V-Score medio</span>
                    <span className="text-rose-400 font-mono font-bold">{medicalAlertData.avg_score}/100</span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1">
                    <span className="text-neutral-400">Dias consecutivos</span>
                    <span className="text-rose-400 font-mono font-bold">{medicalAlertData.days} dias</span>
                  </div>
                </div>
                <div className="p-3 rounded-md bg-amber-500/5 border border-amber-500/20 flex items-start gap-2">
                  <Shield className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-300/70">
                    O VitalFlow e uma ferramenta de suporte ao bem-estar. Nao substitui diagnostico ou tratamento medico profissional.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowMedicalAlert(false);
                    localStorage.setItem("vitalflow_medical_alert_dismissed", new Date().toISOString().split("T")[0]);
                  }}
                  className="w-full mt-4 py-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 font-semibold text-sm rounded-md border border-rose-500/30 transition-all"
                  data-testid="medical-alert-understood"
                >
                  Entendi
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Onboarding Tour */}
      {showOnboarding && !showFirstAccess && (
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

            {/* Morning Report Card */}
            {morningReport && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-indigo-500/30 bg-indigo-500/5 rounded-md p-4"
                data-testid="morning-report-card"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
                    {new Date().getHours() < 12 ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Morning Report</span>
                    <p className="text-sm text-neutral-200 font-medium">{morningReport.greeting}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                  <div className="bg-neutral-900/50 rounded-md p-2.5 border border-white/5">
                    <p className="text-[10px] text-neutral-500 uppercase tracking-wider">Sono Total</p>
                    <p className="text-lg font-mono font-bold text-indigo-400" data-testid="morning-sleep-hours">{morningReport.sleep_hours}h</p>
                  </div>
                  <div className="bg-neutral-900/50 rounded-md p-2.5 border border-white/5">
                    <p className="text-[10px] text-neutral-500 uppercase tracking-wider">Sono Profundo</p>
                    <p className="text-lg font-mono font-bold text-blue-400" data-testid="morning-deep-sleep">{morningReport.deep_sleep_pct}%</p>
                  </div>
                  <div className="bg-neutral-900/50 rounded-md p-2.5 border border-white/5">
                    <p className="text-[10px] text-neutral-500 uppercase tracking-wider">Limite BPM</p>
                    <p className="text-lg font-mono font-bold text-cyan-400" data-testid="morning-bpm-threshold">{morningReport.bpm_stress_threshold}</p>
                  </div>
                  <div className="bg-neutral-900/50 rounded-md p-2.5 border border-white/5">
                    <p className="text-[10px] text-neutral-500 uppercase tracking-wider">Recuperacao</p>
                    <p className={`text-xs font-bold ${
                      morningReport.recovery_factor >= 0.9 ? "text-emerald-400" :
                      morningReport.recovery_factor >= 0.7 ? "text-amber-400" : "text-rose-400"
                    }`} data-testid="morning-recovery">{morningReport.recovery_label}</p>
                  </div>
                </div>
                <p className="text-xs text-neutral-400 italic">{morningReport.personalized_tip}</p>
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

            {/* Real Wearable Data Card */}
            {lastSyncData?.has_real_data && lastSyncData?.auto_analysis && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-cyan-500/30 bg-cyan-500/5 rounded-md p-4"
                data-testid="real-data-card"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Sensores Reais - Google Fit</span>
                  {lastSyncData.auto_analysis.exercise_detected && (
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/30">
                      Exercicio Detectado
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-neutral-900/50 rounded-md p-2.5 border border-white/5">
                    <p className="text-[10px] text-neutral-500 uppercase tracking-wider">BPM</p>
                    <p className="text-lg font-mono font-bold text-rose-400" data-testid="real-bpm">
                      {lastSyncData.data?.bpm || "—"}
                    </p>
                  </div>
                  <div className="bg-neutral-900/50 rounded-md p-2.5 border border-white/5">
                    <p className="text-[10px] text-neutral-500 uppercase tracking-wider">Passos</p>
                    <p className="text-lg font-mono font-bold text-blue-400" data-testid="real-steps">
                      {lastSyncData.auto_analysis.steps?.toLocaleString() || "0"}
                    </p>
                  </div>
                  <div className="bg-neutral-900/50 rounded-md p-2.5 border border-white/5">
                    <p className="text-[10px] text-neutral-500 uppercase tracking-wider">Sono</p>
                    <p className="text-lg font-mono font-bold text-indigo-400" data-testid="real-sleep">
                      {lastSyncData.auto_analysis.sleep_hours || "—"}h
                    </p>
                  </div>
                  <div className="bg-neutral-900/50 rounded-md p-2.5 border border-white/5">
                    <p className="text-[10px] text-neutral-500 uppercase tracking-wider">Recuperacao</p>
                    <p className={`text-xs font-bold ${
                      lastSyncData.auto_analysis.recovery_label?.includes("Otima") ? "text-emerald-400" :
                      lastSyncData.auto_analysis.recovery_label?.includes("Moderada") ? "text-amber-400" :
                      "text-rose-400"
                    }`} data-testid="real-recovery">
                      {lastSyncData.auto_analysis.recovery_label || "—"}
                    </p>
                  </div>
                </div>
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

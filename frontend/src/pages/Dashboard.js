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
import { Lock, Zap, Flame, Trophy, Shield, Smartphone, Radio, Stethoscope, X } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const POLLING_INTERVAL = 10000;
const BACKGROUND_SYNC_INTERVAL = 30 * 60 * 1000;

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
  const pollingIntervalRef = useRef(null);
  const bgSyncRef = useRef(null);
  const lastAnalysisIdRef = useRef(null);

  const fetchHistory = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/history?limit=30`, { withCredentials: true });
      setHistory(response.data);
      if (response.data.length > 0 && !currentAnalysis) {
        setCurrentAnalysis(response.data[0]);
        lastAnalysisIdRef.current = response.data[0].id;
      }
    } catch (error) { console.error(error); }
  }, [currentAnalysis]);

  const fetchConnectedDevices = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/wearables`, { withCredentials: true });
      setConnectedDevices(response.data.filter((d) => d.is_connected));
    } catch (error) { console.error(error); }
  }, []);

  const fetchPredictiveAlert = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/predictive/alert`, { withCredentials: true });
      setPredictiveAlert(data);
    } catch (error) { console.error(error); }
  }, []);

  const fetchGamificationStats = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/gamification/stats`, { withCredentials: true });
      setGamStats(data);
    } catch (error) { console.error(error); }
  }, []);

  const fetchHealthTrend = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/health/trend`, { withCredentials: true });
      setHealthTrend(data);
      if (data?.medical_alert?.show) {
        const dismissed = localStorage.getItem("vitalflow_medical_alert_dismissed");
        if (dismissed !== new Date().toISOString().split("T")[0]) {
          setMedicalAlertData(data.medical_alert);
          setShowMedicalAlert(true);
        }
      }
    } catch (error) { console.error(error); }
  }, []);

  const startPolling = useCallback(() => {
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const response = await axios.get(`${API}/history?limit=1`, { withCredentials: true });
        if (response.data.length > 0 && lastAnalysisIdRef.current !== response.data[0].id) {
          lastAnalysisIdRef.current = response.data[0].id;
          setCurrentAnalysis(response.data[0]);
          fetchHistory();
          toast.success("Nova analise disponivel!");
        }
      } catch (error) { console.error(error); }
    }, POLLING_INTERVAL);
  }, [fetchHistory]);

  const backgroundSync = useCallback(async () => {
    try {
      const { data } = await axios.post(`${API}/wearables/sync`, {}, { withCredentials: true });
      if (data.status === "synced") {
        fetchHistory();
        fetchConnectedDevices();
      }
    } catch { queueOfflineData("wearables/sync", {}); }
  }, [fetchHistory, fetchConnectedDevices]);

  useEffect(() => {
    const init = async () => {
      await Promise.all([
        fetchHistory(),
        fetchConnectedDevices(),
        fetchPredictiveAlert(),
        fetchGamificationStats(),
        fetchHealthTrend()
      ]);
      setDataLoaded(true);
      startPolling();
    };
    init();

    if (user?.must_change_password || user?.must_accept_lgpd) {
      setShowFirstAccess(true);
    } else {
      const onboardingDone = localStorage.getItem("vitalflow_onboarding_done");
      if (!onboardingDone) setShowOnboarding(true);
    }

    bgSyncRef.current = setInterval(backgroundSync, BACKGROUND_SYNC_INTERVAL);
    backgroundSync();

    return () => {
      clearInterval(pollingIntervalRef.current);
      clearInterval(bgSyncRef.current);
    };
  }, [user, fetchHistory, fetchConnectedDevices, fetchPredictiveAlert, fetchGamificationStats, fetchHealthTrend, startPolling, backgroundSync]);

  const isFreeLocked = !user?.is_premium;
  const hasDevices = connectedDevices.length > 0 || user?.google_id || user?.provider === 'google';
  const hasData = currentAnalysis !== null;

  if (!dataLoaded) return <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-white">Carregando...</div>;

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <Navbar />
      {showFirstAccess && <FirstAccessFlow user={user} onComplete={() => { setShowFirstAccess(false); refreshUser(); }} />}
      <AnimatePresence>
        {showMedicalAlert && medicalAlertData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-full max-w-md mx-4 bg-neutral-900 border-2 border-rose-500/40 rounded-xl p-6">
              <div className="flex justify-between mb-4">
                <Stethoscope className="text-rose-400" />
                <button onClick={() => setShowMedicalAlert(false)}><X className="text-neutral-500" /></button>
              </div>
              <h2 className="text-lg font-black text-rose-400 mb-2">Recomendacao Medica</h2>
              <p className="text-sm text-neutral-300 mb-4">{medicalAlertData.message}</p>
              <button onClick={() => setShowMedicalAlert(false)} className="w-full py-2 bg-rose-500/20 text-rose-400 rounded-md border border-rose-500/30">Entendi</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {showOnboarding && !showFirstAccess && <OnboardingTour onComplete={() => setShowOnboarding(false)} />}
      <div className="w-full max-w-6xl mx-auto px-4 py-8">
        {hasData ? (
          <div className="space-y-6">
            {gamStats && (
              <div className="border border-white/10 bg-neutral-900/40 rounded-md p-4 flex justify-between items-center">
                <div className="flex gap-6">
                  <span className="flex items-center gap-2 text-amber-400"><Zap size={16}/> {gamStats.energy_points} pts</span>
                  <span className="flex items-center gap-2 text-orange-400"><Flame size={16}/> {gamStats.current_streak} dias</span>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4"><StatusOrb status={currentAnalysis.status_visual} vScore={currentAnalysis.v_score} areas={currentAnalysis.area_afetada} tag={currentAnalysis.tag_rapida} /></div>
              <div className="lg:col-span-4 space-y-6">
                <AIAnalysis tag={currentAnalysis.tag_rapida} cause={currentAnalysis.causa_provavel} status={currentAnalysis.status_visual} />
                <NudgeCard nudge={currentAnalysis.nudge_acao} status={currentAnalysis.status_visual} analysisId={currentAnalysis.id} onPointsEarned={() => { fetchGamificationStats(); refreshUser(); }} />
              </div>
              <div className="lg:col-span-4"><MetricBars analysis={currentAnalysis} /></div>
            </div>
            <HistoryChart history={history} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-cyan-500/10 border-2 border-cyan-500/20 flex items-center justify-center animate-pulse">
              <Radio className="text-cyan-400" size={40} />
            </div>
            <div>
              <h2 className="text-2xl font-black">{hasDevices ? "Aguardando sincronizacao" : "Conecte um dispositivo"}</h2>
              <p className="text-neutral-400 max-w-sm mx-auto">
                {hasDevices ? "Seu dispositivo está conectado. Assim que os primeiros dados forem sincronizados, sua analise aparecera aqui." : "Para que o VitalFlow analise sua saude, voce precisa conectar um wearable."}
              </p>
            </div>
            {!hasDevices && (
              <button onClick={() => navigate("/devices")} className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-black font-bold rounded-lg flex items-center gap-2">
                <Smartphone size={20} /> Conectar Dispositivo
              </button>
            )}
            {hasDevices && (
              <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 text-xs font-bold">
                Dispositivo conectado (Google Fit)
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
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

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
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
  }, [user]);

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
      await fetchPredictiveAlert();
    } catch (error) {
      toast.error("Erro ao realizar upgrade.");
    }
  };

  // --- O NOSSO INTERRUPTOR E CORREÇÕES ESTÃO AQUI ---
  const isFreeLocked = !user?.is_premium;
  const hasDevices = connectedDevices.length > 0 || user?.google_id || user?.wearable_id || user?.provider === 'google';
  const hasData = currentAnalysis !== null;

  return (
    <div className="min-h-screen bg-neutral-950">
      <Navbar />

      {/* First Access Flow (RH-registered users) */}
      {showFirstAccess && (
        <FirstAccessFlow
          user={user}
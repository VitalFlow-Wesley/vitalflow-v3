import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import StatusOrb from "../components/StatusOrb";
import AIAnalysis from "../components/AIAnalysis";
import RoutineSuggestionCard from "../components/RoutineSuggestionCard";
import RoutineExecutionModal from "../components/RoutineExecutionModal";
import NudgeCard from "../components/NudgeCard";
import HistoryChart from "../components/HistoryChart";
import OnboardingTour from "../components/OnboardingTour";
import FirstAccessFlow from "../components/FirstAccessFlow";
import { queueOfflineData } from "../components/ConnectionStatus";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  Zap,
  Flame,
  Trophy,
  Shield,
  Smartphone,
  Radio,
  Stethoscope,
  X,
  Moon,
  Sun,
  Wifi,
  AlertTriangle,
  Activity,
  HeartPulse,
  Footprints,
  TrendingUp,
  BedDouble,
} from "lucide-react";

// Apontando para o Railway no fallback
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://vitalflow.up.railway.app";
const API = `${BACKEND_URL}/api`;
const POLLING_INTERVAL = 10000;
const BACKGROUND_SYNC_INTERVAL = 30 * 60 * 1000;

function normalizeState(statusValue, tagValue, scoreValue) {
  const status = String(statusValue || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  const tag = String(tagValue || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  const score = Number(scoreValue ?? 0);

  if (
    status.includes("vermelho") ||
    status.includes("critico") ||
    status.includes("urgente") ||
    tag.includes("urgente") ||
    tag.includes("critico") ||
    score < 50
  ) {
    return {
      key: "critico",
      border: "border-rose-500/30",
      bg: "bg-rose-500/8",
      soft: "bg-rose-500/10",
      text: "text-rose-300",
      pill: "border-rose-500/20 bg-rose-500/10 text-rose-300",
      button: "bg-rose-500 hover:bg-rose-400",
    };
  }

  if (
    status.includes("amarelo") ||
    status.includes("atencao") ||
    status.includes("stress") ||
    status.includes("alerta") ||
    tag.includes("stress") ||
    tag.includes("alerta") ||
    (score >= 50 && score < 80)
  ) {
    return {
      key: "atencao",
      border: "border-amber-500/30",
      bg: "bg-amber-500/8",
      soft: "bg-amber-500/10",
      text: "text-amber-300",
      pill: "border-amber-500/20 bg-amber-500/10 text-amber-300",
      button: "bg-amber-500 hover:bg-amber-400",
    };
  }

  return {
    key: "normal",
    border: "border-emerald-500/25",
    bg: "bg-emerald-500/8",
    soft: "bg-emerald-500/10",
    text: "text-emerald-300",
    pill: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
    button: "bg-emerald-500 hover:bg-emerald-400",
  };
}

function getMetricTheme(metricLabel, metricValue, analysis) {
  const state = normalizeState(
    analysis?.status_visual,
    analysis?.tag_rapida,
    analysis?.v_score
  );

  const label = String(metricLabel || "").toLowerCase();
  const numeric = Number(
    typeof metricValue === "string"
      ? metricValue.replace(/[^\d.-]/g, "")
      : metricValue
  );

  if (label === "bpm") {
    if (numeric >= 100) {
      return {
        border: "border-rose-500/20",
        bg: "from-rose-500/18 to-rose-400/5",
        text: "text-rose-300",
        icon: "text-rose-300",
      };
    }
    if (numeric >= 85) {
      return {
        border: "border-amber-500/20",
        bg: "from-amber-500/18 to-amber-400/5",
        text: "text-amber-300",
        icon: "text-amber-300",
      };
    }
    return {
      border: "border-emerald-500/20",
      bg: "from-emerald-500/18 to-emerald-400/5",
      text: "text-emerald-300",
      icon: "text-emerald-300",
    };
  }

  if (label === "hrv") {
    if (numeric < 35) {
      return {
        border: "border-rose-500/20",
        bg: "from-rose-500/18 to-rose-400/5",
        text: "text-rose-300",
        icon: "text-rose-300",
      };
    }
    if (numeric < 50) {
      return {
        border: "border-amber-500/20",
        bg: "from-amber-500/18 to-amber-400/5",
        text: "text-amber-300",
        icon: "text-amber-300",
      };
    }
    return {
      border: "border-cyan-500/20",
      bg: "from-cyan-500/18 to-cyan-400/5",
      text: "text-cyan-300",
      icon: "text-cyan-300",
    };
  }

  if (label === "sono") {
    if (numeric < 5.5) {
      return {
        border: "border-rose-500/20",
        bg: "from-rose-500/18 to-rose-400/5",
        text: "text-rose-300",
        icon: "text-rose-300",
      };
    }
    if (numeric < 7) {
      return {
        border: "border-amber-500/20",
        bg: "from-amber-500/18 to-amber-400/5",
        text: "text-amber-300",
        icon: "text-amber-300",
      };
    }
    return {
      border: "border-indigo-500/20",
      bg: "from-indigo-500/18 to-indigo-400/5",
      text: "text-indigo-300",
      icon: "text-indigo-300",
    };
  }

  if (label === "passos") {
    if (numeric < 3500) {
      return {
        border: "border-amber-500/20",
        bg: "from-amber-500/18 to-amber-400/5",
        text: "text-amber-300",
        icon: "text-amber-300",
      };
    }
    return {
      border: "border-emerald-500/20",
      bg: "from-emerald-500/18 to-emerald-400/5",
      text: "text-emerald-300",
      icon: "text-emerald-300",
    };
  }

  if (label === "stress") {
    return state.key === "critico"
      ? {
          border: "border-rose-500/20",
          bg: "from-rose-500/18 to-rose-400/5",
          text: "text-rose-300",
          icon: "text-rose-300",
        }
      : state.key === "atencao"
      ? {
          border: "border-amber-500/20",
          bg: "from-amber-500/18 to-amber-400/5",
          text: "text-amber-300",
          icon: "text-amber-300",
        }
      : {
          border: "border-emerald-500/20",
          bg: "from-emerald-500/18 to-emerald-400/5",
          text: "text-emerald-300",
          icon: "text-emerald-300",
        };
  }

  if (label === "recovery") {
    if (numeric < 55) {
      return {
        border: "border-rose-500/20",
        bg: "from-rose-500/18 to-rose-400/5",
        text: "text-rose-300",
        icon: "text-rose-300",
      };
    }
    if (numeric < 75) {
      return {
        border: "border-amber-500/20",
        bg: "from-amber-500/18 to-amber-400/5",
        text: "text-amber-300",
        icon: "text-amber-300",
      };
    }
    return {
      border: "border-emerald-500/20",
      bg: "from-emerald-500/18 to-emerald-400/5",
      text: "text-emerald-300",
      icon: "text-emerald-300",
    };
  }

  if (label === "risco") {
    if (numeric >= 70) {
      return {
        border: "border-rose-500/20",
        bg: "from-rose-500/18 to-rose-400/5",
        text: "text-rose-300",
        icon: "text-rose-300",
      };
    }
    if (numeric >= 35) {
      return {
        border: "border-amber-500/20",
        bg: "from-amber-500/18 to-amber-400/5",
        text: "text-amber-300",
        icon: "text-amber-300",
      };
    }
    return {
      border: "border-emerald-500/20",
      bg: "from-emerald-500/18 to-emerald-400/5",
      text: "text-emerald-300",
      icon: "text-emerald-300",
    };
  }

  if (label === "contexto") {
    const context = String(metricValue || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    if (context.includes("stress") || context.includes("alerta")) {
      return state.key === "critico"
        ? {
            border: "border-rose-500/20",
            bg: "from-rose-500/18 to-rose-400/5",
            text: "text-rose-300",
            icon: "text-rose-300",
          }
        : {
            border: "border-amber-500/20",
            bg: "from-amber-500/18 to-amber-400/5",
            text: "text-amber-300",
            icon: "text-amber-300",
          };
    }

    if (context.includes("normal")) {
      return {
        border: "border-emerald-500/20",
        bg: "from-emerald-500/18 to-emerald-400/5",
        text: "text-emerald-300",
        icon: "text-emerald-300",
      };
    }

    return {
      border: "border-sky-500/20",
      bg: "from-sky-500/18 to-sky-400/5",
      text: "text-sky-300",
      icon: "text-sky-300",
    };
  }

  return {
    border: "border-white/10",
    bg: "from-white/5 to-white/[0.02]",
    text: "text-white",
    icon: "text-neutral-300",
  };
}


const hasRealMetric = (value) =>
  value !== null &&
  value !== undefined &&
  value !== "" &&
  !(typeof value === "number" && Number.isNaN(value));

const formatSleepMetric = (value) => {
  const num = Number(value);
  if (!hasRealMetric(value) || !Number.isFinite(num) || num <= 0) return "--";
  const normalized = Number.isInteger(num) ? String(num) : num.toFixed(1).replace(/\.0$/, "");
  return `${normalized}h`;
};

const formatOptionalMetric = (value, suffix = "") => {
  const num = Number(value);
  if (!hasRealMetric(value) || !Number.isFinite(num) || num <= 0) return "--";
  const normalized = Number.isInteger(num) ? String(num) : num.toFixed(1).replace(/\.0$/, "");
  return `${normalized}${suffix}`;
};


const formatMetricValue = (value, suffix = "") => {
  const num = Number(value);
  if (value === null || value === undefined || value === "" || !Number.isFinite(num) || num <= 0) {
    return "--";
  }
  const normalized = Number.isInteger(num) ? String(num) : num.toFixed(1).replace(/\.0$/, "");
  return `${normalized}${suffix}`;
};

const formatSleepValue = (value) => formatMetricValue(value, "h");
const formatCaloriesValue = (value) => formatMetricValue(value, " kcal");
const formatMinutesValue = (value) => formatMetricValue(value, " min");


const DASHBOARD_CACHE_KEY = "vitalflow_dashboard_cache_v1";

const readDashboardCache = () => {
  try {
    const raw = sessionStorage.getItem(DASHBOARD_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const dashboardCache = readDashboardCache();
  const [dashboardLoading, setDashboardLoading] = useState(
    !dashboardCache.currentAnalysis && !(dashboardCache.history || []).length
  );
  const [currentAnalysis, setCurrentAnalysis] = useState(
    dashboardCache.currentAnalysis ?? null
  );
  const [history, setHistory] = useState(dashboardCache.history ?? []);
  const [connectedDevices, setConnectedDevices] = useState(
    dashboardCache.connectedDevices ?? []
  );
  const [devicesLoading, setDevicesLoading] = useState(true);
  const [selectedRoutine, setSelectedRoutine] = useState(null);
  const [predictiveAlert, setPredictiveAlert] = useState(null);
  const [gamStats, setGamStats] = useState(null);
  const [healthTrend, setHealthTrend] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showFirstAccess, setShowFirstAccess] = useState(false);
  const [showMedicalAlert, setShowMedicalAlert] = useState(false);
  const [medicalAlertData, setMedicalAlertData] = useState(null);
  const [morningReport, setMorningReport] = useState(null);
  const [lastSyncData, setLastSyncData] = useState(dashboardCache.lastSyncData ?? null);

  const pollingIntervalRef = useRef(null);
  const bgSyncRef = useRef(null);
  const lastAnalysisKeyRef = useRef(null);

  const getAnalysisKey = (analysis) => {
    if (!analysis) return null;
    return analysis.id || analysis.timestamp || JSON.stringify(analysis);
  };

  const sortHistoryDesc = (items) => {
    const list = Array.isArray(items) ? [...items] : [];
    return list.sort((a, b) => {
      const ta = a?.timestamp ? new Date(a.timestamp).getTime() : 0;
      const tb = b?.timestamp ? new Date(b.timestamp).getTime() : 0;
      return tb - ta;
    });
  };

  // ✅ CORRIGIDO: Retornando os dados normalmente sem filtro fantasma!
  const filterRealAnalyses = (items) => {
    return Array.isArray(items) ? items : [];
  };

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${API}/history?limit=30`, {
        withCredentials: true,
      });

      const realHistory = filterRealAnalyses(response.data);
      const orderedHistory = sortHistoryDesc(realHistory);

      setHistory(orderedHistory);

      if (orderedHistory.length > 0) {
        const latest = orderedHistory[0];
        setCurrentAnalysis(latest);
        lastAnalysisKeyRef.current = getAnalysisKey(latest);
      } else {
        setCurrentAnalysis(null);
        lastAnalysisKeyRef.current = null;
      }
    } catch (error) {
      console.error("Erro ao buscar histórico:", error);
    } finally {
      setDashboardLoading(false);
    }
  };

  const fetchConnectedDevices = async () => {
    try {
      setDevicesLoading(true);

      const response = await axios.get(`${API}/wearables`, {
        withCredentials: true,
      });

      const payload = response?.data;
      const list = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.devices)
        ? payload.devices
        : [];

      setConnectedDevices(list);
    } catch (error) {
      console.error("Erro ao buscar dispositivos:", error);
      setConnectedDevices([]);
    } finally {
      setDevicesLoading(false);
    }
  };

  const fetchPredictiveAlert = async () => {
    try {
      const { data } = await axios.get(`${API}/predictive/alert`, {
        withCredentials: true,
      });
      setPredictiveAlert(data);
    } catch (error) {
      console.error("Erro ao buscar alerta preditivo:", error);
    }
  };

  const fetchGamificationStats = async () => {
    try {
      const { data } = await axios.get(`${API}/gamification/stats`, {
        withCredentials: true,
      });
      setGamStats(data);
    } catch (error) {
      console.error("Erro ao buscar gamificação:", error);
    }
  };

  const fetchHealthTrend = async () => {
    try {
      const { data } = await axios.get(`${API}/health/trend`, {
        withCredentials: true,
      });
      setHealthTrend(data);

      if (data?.medical_alert?.show) {
        const dismissed = localStorage.getItem(
          "vitalflow_medical_alert_dismissed"
        );
        const today = new Date().toISOString().split("T")[0];

        if (dismissed !== today) {
          setMedicalAlertData(data.medical_alert);
          setShowMedicalAlert(true);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar tendência:", error);
    }
  };

  const fetchMorningReport = async () => {
    try {
      const { data } = await axios.get(`${API}/health/morning-report`, {
        withCredentials: true,
      });

      if (data?.available) {
        setMorningReport(data);
      } else {
        setMorningReport(null);
      }
    } catch {
      setMorningReport(null);
    }
  };

  const checkForNewAnalysis = async () => {
    try {
      const response = await axios.get(`${API}/history?limit=5`, {
        withCredentials: true,
      });

      const realHistory = filterRealAnalyses(response.data);
      const orderedHistory = sortHistoryDesc(realHistory);

      if (orderedHistory.length === 0) {
        return;
      }

      const latest = orderedHistory[0];
      const latestKey = getAnalysisKey(latest);

      if (lastAnalysisKeyRef.current !== latestKey) {
        lastAnalysisKeyRef.current = latestKey;
        setCurrentAnalysis(latest);
        setHistory(orderedHistory);
      }
    } catch (error) {
      console.error("Erro ao verificar nova análise:", error);
    }
  };

  const backgroundSync = useCallback(async () => {
    try {
      const { data } = await axios.post(
        `${API}/wearables/sync`,
        {},
        { withCredentials: true }
      );

      if (data.status === "synced") {
        setLastSyncData(data);

        if (data.has_real_data && data.auto_analysis) {
          const a = data.auto_analysis;
          const exerciseMsg = a.exercise_detected
            ? " | Exercício detectado!"
            : "";

          toast.success(
            `Sync: V-Score ${a.v_score} (${a.status_visual}) - ${a.recovery_label}${exerciseMsg}`,
            { duration: 5000 }
          );
        } else {
          toast.success("Dados do wearable sincronizados!", {
            duration: 3000,
          });
        }

        await fetchHistory();
        await fetchConnectedDevices();
        await fetchMorningReport();
      } else if (data.status === "no_real_data") {
        toast.info(
          data.message ||
            "Conecte um wearable real para carregar dados verdadeiros.",
          { duration: 4000 }
        );
      } else if (data.status === "no_data") {
        toast.info(
          data.message || "Nenhum dado novo real disponível no momento.",
          { duration: 4000 }
        );
      }
    } catch {
      queueOfflineData("wearables/sync", {});
      setDashboardLoading(false);
    }
  }, []);


  useEffect(() => {
    try {
      sessionStorage.setItem(
        DASHBOARD_CACHE_KEY,
        JSON.stringify({
          currentAnalysis,
          history,
          connectedDevices,
          lastSyncData,
        })
      );
    } catch {}
  }, [currentAnalysis, history, connectedDevices, lastSyncData]);

  useEffect(() => {
    fetchHistory();
    fetchConnectedDevices();
    fetchPredictiveAlert();
    fetchGamificationStats();
    fetchHealthTrend();
    fetchMorningReport();
  }, []);

  useEffect(() => {
    bgSyncRef.current = setInterval(backgroundSync, BACKGROUND_SYNC_INTERVAL);

    return () => {
      if (bgSyncRef.current) clearInterval(bgSyncRef.current);
    };
  }, [backgroundSync]);

  useEffect(() => {
    pollingIntervalRef.current = setInterval(() => {
      checkForNewAnalysis();
      fetchConnectedDevices();
    }, POLLING_INTERVAL);

    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, []);

  const handlePointsEarned = async () => {
    await fetchGamificationStats();
    await refreshUser();
  };

  const handleUpgrade = async () => {
    try {
      const originUrl = window.location.origin;
      const { data } = await axios.post(
        `${API}/billing/create-checkout`,
        {
          plan_id: "premium_monthly",
          origin_url: originUrl,
        },
        { withCredentials: true }
      );

      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error("Erro ao iniciar pagamento.");
      }
    } catch (error) {
      const msg =
        error.response?.data?.detail || "Erro ao processar upgrade.";
      toast.error(msg);
    }
  };

  const accountType = String(user?.account_type || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  const isB2BUser =
    Boolean(user?.is_b2b) ||
    accountType.includes("b2b") ||
    accountType.includes("business") ||
    accountType.includes("empresa") ||
    accountType.includes("empresarial") ||
    accountType.includes("corporate") ||
    accountType.includes("rh");

  const isPremiumUser = Boolean(user?.is_premium);
  const userPlan = String(
    user?.plan || (isPremiumUser ? "premium" : "free")
  ).toLowerCase();

  const isAdmin = String(user?.nivel_acesso || user?.role || "")
    .toLowerCase()
    .includes("ceo") ||
    String(user?.nivel_acesso || user?.role || "")
    .toLowerCase()
    .includes("admin");

  const isFreeLocked =
    userPlan === "free" && !isPremiumUser && !isB2BUser && !isAdmin;

  console.log("USER PLAN DEBUG", {
    accountType,
    isB2BUser,
    isPremiumUser,
    userPlan,
    isFreeLocked,
    user,
  });

  const hasData = !dashboardLoading && currentAnalysis !== null;

  const connectedDevicesCount = useMemo(() => {
    if (!Array.isArray(connectedDevices)) return 0;
    return connectedDevices.filter((device) => device?.is_connected).length;
  }, [connectedDevices]);

  const hasConnectedWearables = connectedDevicesCount > 0;

  const lastSyncTime = useMemo(() => {
    if (!Array.isArray(connectedDevices)) return null;
    const connected = connectedDevices.filter(d => d?.is_connected && d?.last_sync);
    if (connected.length === 0) return null;
    const latest = connected.sort((a, b) => new Date(b.last_sync) - new Date(a.last_sync))[0];
    return latest?.last_sync ? new Date(latest.last_sync) : null;
  }, [connectedDevices]);

  const formatSyncTime = (date) => {
    if (!date) return null;
    const now = new Date();
    const diff = Math.floor((now - date) / 60000);
    if (diff < 1) return "agora mesmo";
    if (diff < 60) return `há ${diff} min`;
    if (diff < 1440) return `há ${Math.floor(diff/60)}h`;
    return `há ${Math.floor(diff/1440)}d`;
  };

  const engine = currentAnalysis?.engine || {};
  const inputData = currentAnalysis?.input_data || {};
  const realData = currentAnalysis?.real_data || {};
  const stateUI = normalizeState(
    currentAnalysis?.status_visual,
    currentAnalysis?.tag_rapida,
    currentAnalysis?.v_score
  );

  const mergedAnalysis = useMemo(() => {
    if (!currentAnalysis) return null;
    return {
      ...currentAnalysis,
      history,
    };
  }, [currentAnalysis, history]);

  const metrics = [
    {
      label: "BPM",
      value: inputData.bpm ?? "--",
      icon: HeartPulse,
    },
    {
      label: "HRV",
      value: inputData.hrv ?? "--",
      icon: Activity,
    },
    {
          label: "SpO2",
          value: inputData.spo2 ? `${inputData.spo2}%` : "--",
          icon: Activity,
        },
    {
      label: "Sono",
      value:
        Number(inputData.sleep_hours) > 0
          ? formatSleepValue(inputData.sleep_hours)
          : Number(realData.sleep_hours) > 0
          ? formatSleepValue(realData.sleep_hours)
          : "--",
      icon: BedDouble,
    },
    {
      label: "Passos",
      value:
        realData.steps !== undefined
          ? Number(realData.steps).toLocaleString("pt-BR")
          : "--",
      icon: Footprints,
    },
    {
      label: "Stress",
      value: engine.stress_score ?? "--",
      icon: Activity,
    },
    {
      label: "Recovery",
      value:
        currentAnalysis?.recovery?.label === "no_sleep_data"
          ? "--"
          : engine.recovery_score ?? "--",
      icon: Shield,
    },
    {
      label: "Risco",
      value: engine.risk_score ?? "--",
      icon: TrendingUp,
    },
    {
      label: "Contexto",
      value:
        typeof engine.contexto === "string"
          ? engine.contexto
          : engine.contexto?.label || "--",
      icon: Radio,
    },
    {
      label: "Calorias",
      value: formatCaloriesValue(realData.calories),
      icon: Flame,
    },
    {
      label: "Distância",
      value: formatOptionalMetric(realData.distance ?? realData.distance_km, " km"),
      icon: Footprints,
    },
    {
      label: "Min. Ativos",
      value: formatMinutesValue(realData.active_minutes),
      icon: TrendingUp,
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-950">
      <Navbar />

      {showFirstAccess && (
        <FirstAccessFlow
          user={user}
          onComplete={() => {
            setShowFirstAccess(false);
            refreshUser();
            const onboardingDone = localStorage.getItem(
              "vitalflow_onboarding_done"
            );
            if (!onboardingDone) setShowOnboarding(true);
          }}
        />
      )}

      <AnimatePresence>
        {showMedicalAlert && medicalAlertData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              className="w-full max-w-md mx-4 bg-neutral-900 border-2 border-rose-500/40 rounded-2xl overflow-hidden shadow-2xl shadow-rose-500/10"
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
                      localStorage.setItem(
                        "vitalflow_medical_alert_dismissed",
                        new Date().toISOString().split("T")[0]
                      );
                    }}
                    className="text-neutral-500 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <h2 className="text-lg font-black text-rose-400 mb-2">
                  Recomendação de Consulta Profissional
                </h2>

                <p className="text-sm text-neutral-300 leading-relaxed mb-4">
                  {medicalAlertData.message}
                </p>

                <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-3 mb-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-400">V-Score médio</span>
                    <span className="text-rose-400 font-mono font-bold">
                      {medicalAlertData.avg_score}/100
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1">
                    <span className="text-neutral-400">Dias consecutivos</span>
                    <span className="text-rose-400 font-mono font-bold">
                      {medicalAlertData.days} dias
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-2">
                  <Shield className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-300/70">
                    O VitalFlow é uma ferramenta de suporte ao bem-estar. Não
                    substitui diagnóstico ou tratamento médico profissional.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setShowMedicalAlert(false);
                    localStorage.setItem(
                      "vitalflow_medical_alert_dismissed",
                      new Date().toISOString().split("T")[0]
                    );
                  }}
                  className="w-full mt-4 py-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 font-semibold text-sm rounded-xl border border-rose-500/30 transition-all"
                >
                  Entendi
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showOnboarding && !showFirstAccess && (
        <OnboardingTour onComplete={() => setShowOnboarding(false)} />
      )}

      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {hasData ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45 }}
            className="space-y-6"
          >
            {gamStats && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-white/10 bg-neutral-900/40 backdrop-blur-xl rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4"
              >
                <div className="flex items-center gap-6 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span className="text-sm text-neutral-400">
                      Pontos de Energia
                    </span>
                    <span className="text-lg font-mono font-bold text-amber-400">
                      {gamStats.energy_points}
                    </span>
                  </div>

                  {gamStats.current_streak > 0 && (
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-orange-400" />
                      <span className="text-sm text-neutral-400">Streak</span>
                      <span className="text-lg font-mono font-bold text-orange-400">
                        {gamStats.current_streak} dia(s)
                      </span>
                    </div>
                  )}

                  {gamStats.badges?.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-purple-400" />
                      <span className="text-sm text-purple-400 font-semibold">
                        Biohacker da Semana
                      </span>
                    </div>
                  )}
                </div>

                <span className="text-xs text-neutral-600">
                  Próximo badge em {gamStats.next_badge_in} dia(s)
                </span>
              </motion.div>
            )}

            {lastSyncTime && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-between px-4 py-2.5 rounded-xl border border-white/8 bg-neutral-900/30 text-xs text-neutral-500"
              >
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Dados sincronizados <span className="text-neutral-400 font-medium">{formatSyncTime(lastSyncTime)}</span></span>
                </div>
                <button
                  onClick={backgroundSync}
                  className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                >
                  Atualizar agora
                </button>
              </motion.div>
            )}

            {morningReport && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-indigo-500/30 bg-indigo-500/5 rounded-2xl p-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
                    {new Date().getHours() < 12 ? (
                      <Sun className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Moon className="w-4 h-4 text-indigo-400" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                      Morning Report
                    </span>
                    <p className="text-sm text-neutral-200 font-medium">
                      {morningReport.greeting}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                  <MiniMorningCard
                    label="Sono Total"
                    value={`${morningReport.sleep_hours}h`}
                    color="text-indigo-400"
                  />
                  <MiniMorningCard
                    label="Sono Profundo"
                    value={`${morningReport.deep_sleep_pct}%`}
                    color="text-blue-400"
                  />
                  <MiniMorningCard
                    label="Limite BPM"
                    value={morningReport.bpm_stress_threshold}
                    color="text-cyan-400"
                  />
                  <MiniMorningCard
                    label="Recuperação"
                    value={morningReport.recovery_label}
                    color={
                      morningReport.recovery_factor >= 0.9
                        ? "text-emerald-400"
                        : morningReport.recovery_factor >= 0.7
                        ? "text-amber-400"
                        : "text-rose-400"
                    }
                  />
                </div>

                <p className="text-xs text-neutral-400 italic">
                  {morningReport.personalized_tip}
                </p>
              </motion.div>
            )}

            {isFreeLocked && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="border border-amber-500/30 bg-amber-500/5 rounded-2xl p-4 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-amber-400" />
                  <div>
                    <p className="text-sm font-semibold text-amber-400">
                      IA Preditiva bloqueada
                    </p>
                    <p className="text-xs text-neutral-400">
                      Faça upgrade para Premium e acesse predições de estresse
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleUpgrade}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold rounded-xl transition-all"
                >
                  Upgrade Premium
                </button>
              </motion.div>
            )}

            {healthTrend?.requires_intervention && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="border border-rose-500/40 bg-rose-500/8 rounded-2xl p-4 flex items-start gap-3"
              >
                <Shield className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-rose-400">
                    Intervenção Necessária
                  </p>
                  <p className="text-xs text-neutral-300 mt-1">
                    {healthTrend.intervention_message}
                  </p>
                </div>
              </motion.div>
            )}

            {!isFreeLocked && predictiveAlert?.has_alert && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="border border-purple-500/30 bg-purple-500/5 rounded-2xl p-4"
              >
                <p className="text-sm font-bold text-purple-400 mb-1">
                  Alerta Preditivo
                </p>
                <p className="text-xs text-neutral-300">
                  {predictiveAlert.message}
                </p>
              </motion.div>
            )}

            <section className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              <div className="xl:col-span-4">
                <StatusOrb
                  score={currentAnalysis?.v_score || 0}
                  status={currentAnalysis?.status_visual || "Sem dados"}
                  tag={currentAnalysis?.tag_rapida || "Aguardando"}
                  areas={currentAnalysis?.area_afetada || []}
                />
              </div>

              <div className="xl:col-span-8 space-y-6">
                <AIAnalysis analysis={mergedAnalysis} />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {metrics.map((metric) => (
                    <MetricCard
                      key={metric.label}
                      analysis={currentAnalysis}
                      label={metric.label}
                      value={metric.value}
                      Icon={metric.icon}
                    />
                  ))}
                </div>

                {engine.alert && (
                  <div className="border border-rose-500/20 bg-rose-500/10 rounded-2xl p-4 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-300 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-rose-300">
                        Alerta detectado
                      </p>
                      <p className="text-xs text-neutral-300 mt-1">
                        {engine.alert}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              <div className="xl:col-span-8">
                <HistoryChart history={history} />
              </div>

              <div className="xl:col-span-4 space-y-6">
                <RoutineSuggestionCard
                  currentData={{
                    stress:
                      currentAnalysis?.stress ??
                      currentAnalysis?.stress_score ??
                      0,
                    sleep: currentAnalysis?.input_data?.sleep_hours ?? 0,
                    hrv: currentAnalysis?.input_data?.hrv ?? 0,
                    recovery:
                      currentAnalysis?.recovery ??
                      currentAnalysis?.recovery_score ??
                      100,
                    bpm: currentAnalysis?.input_data?.bpm ?? 0,
                    v_score: currentAnalysis?.v_score ?? 100,
                    status:
                      currentAnalysis?.status_visual ||
                      currentAnalysis?.status ||
                      "normal",
                  }}
                  previousData={{
                    stress: history?.[1]?.stress ?? history?.[1]?.stress_score ?? 0,
                    sleep: history?.[1]?.input_data?.sleep_hours ?? 0,
                    hrv: history?.[1]?.input_data?.hrv ?? 0,
                    recovery:
                      history?.[1]?.recovery ??
                      history?.[1]?.recovery_score ??
                      100,
                    bpm: history?.[1]?.input_data?.bpm ?? 0,
                    v_score: history?.[1]?.v_score ?? 100,
                    status:
                      history?.[1]?.status_visual ||
                      history?.[1]?.status ||
                      "normal",
                  }}
                  onStartRoutine={(routineData) =>
                    setSelectedRoutine(routineData)
                  }
                />
              </div>
            </section>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {gamStats && (
              <div className="border border-white/10 bg-neutral-900/40 backdrop-blur-xl rounded-2xl p-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-sm text-neutral-400">
                  Pontos de Energia
                </span>
                <span className="text-lg font-mono font-bold text-amber-400">
                  {gamStats.energy_points}
                </span>
              </div>
            )}

            <div className="border border-white/10 bg-neutral-900/50 rounded-3xl p-10 text-center">
              <div className="w-20 h-20 mx-auto rounded-full border border-cyan-500/20 bg-cyan-500/5 flex items-center justify-center mb-6">
                <Wifi className="w-10 h-10 text-cyan-400" />
              </div>

              <h2 className="text-3xl font-black tracking-tight mb-3 text-white">
                {devicesLoading
                  ? "Verificando wearables..."
                  : hasConnectedWearables
                  ? "Aguardando sincronização"
                  : "Nenhum dispositivo conectado"}
              </h2>

              <p className="text-neutral-400 max-w-2xl mx-auto">
                {devicesLoading
                  ? "Estamos verificando seus dispositivos conectados."
                  : hasConnectedWearables
                  ? "Seu dispositivo está conectado. Assim que os primeiros dados biométricos reais forem sincronizados, o VitalFlow vai gerar sua primeira análise automaticamente."
                  : "Conecte um wearable para começar a receber seus dados biométricos reais e gerar suas análises automaticamente."}
              </p>

              <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 text-sm font-semibold">
                <Smartphone className="w-4 h-4" />
                {devicesLoading
                  ? "Verificando..."
                  : `${connectedDevicesCount} dispositivo(s) conectado(s)`}
              </div>

              <div className="mt-4 text-xs text-neutral-500">
                {hasConnectedWearables
                  ? "A primeira análise será gerada automaticamente após a sincronização"
                  : "Conecte um dispositivo em Dispositivos para começar"}
              </div>

              {hasConnectedWearables && (
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={async () => {
                      await fetchHistory();
                    }}
                    className="px-4 py-2 rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 transition-all text-sm font-semibold"
                  >
                    Carregar última análise
                  </button>
                  <button
                    onClick={backgroundSync}
                    className="px-4 py-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 transition-all text-sm font-semibold"
                  >
                    Sincronizar agora
                  </button>
                </div>
              )}
            </div>

            <div className="border border-white/10 bg-neutral-900/50 rounded-3xl p-6">
              <div className="text-xs uppercase tracking-[0.18em] text-cyan-300 font-bold mb-6">
                Histórico V-Score
              </div>

              <div className="h-60 flex items-center justify-center text-center text-neutral-500">
                Seus dados biométricos aparecerão aqui em tempo real assim que
                forem recebidos.
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <RoutineExecutionModal
        open={!!selectedRoutine}
        routine={selectedRoutine}
        onClose={() => setSelectedRoutine(null)}
        onComplete={async () => {
          setSelectedRoutine(null);
          await fetchHistory();
          await fetchGamificationStats();
          await refreshUser();
          toast.success("Pontos de energia atualizados!");
        }}
      />
    </div>
  );
}

function MetricCard({ Icon, label, value, analysis }) {
  const theme = getMetricTheme(label, value, analysis);

  return (
    <div
      className={`rounded-2xl border ${theme.border} bg-gradient-to-br ${theme.bg} bg-neutral-900/50 p-4 backdrop-blur-xl min-h-[112px]`}
    >
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-4 h-4 ${theme.icon}`} />
        <span className="text-[11px] text-neutral-500 uppercase tracking-[0.14em]">
          {label}
        </span>
      </div>
      <div className={`text-2xl font-black ${theme.text}`}>
        {value !== undefined && value !== null ? value : "--"}
      </div>
    </div>
  );
}

function MiniMorningCard({ label, value, color }) {
  return (
    <div className="bg-neutral-900/50 rounded-xl p-3 border border-white/5">
      <p className="text-[10px] text-neutral-500 uppercase tracking-wider">
        {label}
      </p>
      <p className={`text-lg font-mono font-bold ${color}`}>{value}</p>
    </div>
  );
}
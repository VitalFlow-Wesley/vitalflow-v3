import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import BiometricForm from "../components/BiometricForm";
import VScoreDisplay from "../components/VScoreDisplay";
import HumanBodyHeatmap from "../components/HumanBodyHeatmap";
import AIAnalysis from "../components/AIAnalysis";
import NudgeCard from "../components/NudgeCard";
import HistoryChart from "../components/HistoryChart";
import { toast } from "sonner";
import { motion } from "framer-motion";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const POLLING_INTERVAL = 10000; // 10 segundos

const Dashboard = () => {
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const [history, setHistory] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [connectedDevices, setConnectedDevices] = useState([]);
  const pollingIntervalRef = useRef(null);
  const lastAnalysisIdRef = useRef(null);

  // Fetch history on mount
  useEffect(() => {
    fetchHistory();
    fetchConnectedDevices();
    startPolling();

    return () => {
      stopPolling();
    };
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${API}/history?limit=30`);
      setHistory(response.data);
      if (response.data.length > 0 && !currentAnalysis) {
        setCurrentAnalysis(response.data[0]);
        lastAnalysisIdRef.current = response.data[0].id;
      }
    } catch (error) {
      console.error("Erro ao buscar histórico:", error);
    }
  };

  const fetchConnectedDevices = async () => {
    try {
      const response = await axios.get(`${API}/wearables`);
      setConnectedDevices(response.data.filter(d => d.is_connected));
    } catch (error) {
      console.error("Erro ao buscar dispositivos:", error);
    }
  };

  const checkForNewAnalysis = async () => {
    try {
      const response = await axios.get(`${API}/history?limit=1`);
      
      if (response.data.length > 0) {
        const latestAnalysis = response.data[0];
        
        // Se há uma nova análise (ID diferente da última conhecida)
        if (lastAnalysisIdRef.current !== latestAnalysis.id) {
          lastAnalysisIdRef.current = latestAnalysis.id;
          setCurrentAnalysis(latestAnalysis);
          
          // Atualizar histórico completo
          await fetchHistory();
          
          // Notificar usuário
          toast.success("Nova análise disponível! Mapa Anatômico atualizado.", {
            duration: 5000
          });
        }
      }
    } catch (error) {
      console.error("Erro ao verificar novas análises:", error);
    }
  };

  const startPolling = () => {
    // Poll a cada 10 segundos para detectar novas análises
    pollingIntervalRef.current = setInterval(() => {
      checkForNewAnalysis();
    }, POLLING_INTERVAL);
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const handleAnalyze = async (biometricData) => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API}/analyze`, biometricData);
      setCurrentAnalysis(response.data);
      lastAnalysisIdRef.current = response.data.id;
      await fetchHistory();
      setIsFormOpen(false);
      toast.success("Análise concluída com sucesso!");
    } catch (error) {
      console.error("Erro na análise:", error);
      toast.error("Erro ao processar análise. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950">
      <Navbar onOpenForm={() => setIsFormOpen(true)} />
      
      {/* Connected Devices Banner */}
      {connectedDevices.length > 0 && (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="border border-emerald-400/30 bg-emerald-400/5 rounded-md p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm text-emerald-400 font-semibold">
                {connectedDevices.length} dispositivo(s) conectado(s) - Sincronização automática ativa
              </span>
            </div>
            <span className="text-xs text-neutral-400">
              Atualizando a cada {POLLING_INTERVAL / 1000}s
            </span>
          </div>
        </div>
      )}
      
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentAnalysis ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Left Column - V-Score Hero */}
            <div className="lg:col-span-5 space-y-6">
              <VScoreDisplay analysis={currentAnalysis} />
              <HumanBodyHeatmap 
                areas={currentAnalysis.area_afetada} 
                status={currentAnalysis.status_visual}
                tag={currentAnalysis.tag_rapida}
              />
            </div>

            {/* Right Column - Analysis & Nudge */}
            <div className="lg:col-span-7 space-y-6">
              <AIAnalysis 
                tag={currentAnalysis.tag_rapida}
                cause={currentAnalysis.causa_provavel}
                status={currentAnalysis.status_visual}
              />
              <NudgeCard 
                nudge={currentAnalysis.nudge_acao}
                status={currentAnalysis.status_visual}
              />
              <HistoryChart history={history} />
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold text-white font-heading">Bem-vindo ao VitalFlow</h2>
              <p className="text-neutral-400 text-lg">Comece sua jornada de otimização biológica</p>
              <button
                onClick={() => setIsFormOpen(true)}
                data-testid="start-analysis-button"
                className="mt-6 px-8 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-md transition-all duration-200"
              >
                Iniciar Primeira Análise
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Biometric Form Dialog */}
      <BiometricForm 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleAnalyze}
        isLoading={isLoading}
      />
    </div>
  );
};

export default Dashboard;
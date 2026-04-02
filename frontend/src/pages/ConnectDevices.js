import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Smartphone, Watch, Activity, CheckCircle2, XCircle, Wifi, ArrowRight, RefreshCw, Zap } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const OAUTH_STEPS = ["Abrindo autorizacao...", "Verificando permissoes...", "Conectando ao dispositivo...", "Sincronizando dados..."];

const ConnectDevices = () => {
  const navigate = useNavigate();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [oauthFlow, setOauthFlow] = useState(null); // { provider, step }
  const [syncResult, setSyncResult] = useState(null);

  const wearableProviders = [
    {
      id: "google_health_connect",
      name: "Google Health Connect",
      platform: "Android",
      icon: Smartphone,
      color: "text-green-400",
      borderColor: "border-green-400/30",
      bgColor: "bg-green-400/10",
      description: "Sincronize dados do Google Fit e apps de saude Android",
      oauthUrl: "https://accounts.google.com/o/oauth2/v2/auth?scope=fitness.activity.read+fitness.heart_rate.read+fitness.sleep.read"
    },
    {
      id: "apple_healthkit",
      name: "Apple HealthKit",
      platform: "iOS",
      icon: Watch,
      color: "text-blue-400",
      borderColor: "border-blue-400/30",
      bgColor: "bg-blue-400/10",
      description: "Conecte seu Apple Watch e iPhone Health",
      oauthUrl: "healthkit://authorize"
    },
    {
      id: "garmin",
      name: "Garmin Connect",
      platform: "Multi-plataforma",
      icon: Activity,
      color: "text-cyan-400",
      borderColor: "border-cyan-400/30",
      bgColor: "bg-cyan-400/10",
      description: "Integre dados de dispositivos Garmin",
      oauthUrl: "https://connect.garmin.com/oauthConfirm"
    },
    {
      id: "fitbit",
      name: "Fitbit",
      platform: "Multi-plataforma",
      icon: Activity,
      color: "text-purple-400",
      borderColor: "border-purple-400/30",
      bgColor: "bg-purple-400/10",
      description: "Conecte seu Fitbit e sincronize automatico",
      oauthUrl: "https://www.fitbit.com/oauth2/authorize"
    }
  ];

  useEffect(() => {
    fetchConnectedDevices();

    // Verificar se voltou do callback do Google Fit
    const params = new URLSearchParams(window.location.search);
    if (params.get("google_fit") === "success") {
      toast.success("Google Fit conectado e sincronizado com sucesso!", { duration: 5000 });
      // Limpar query string da URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const fetchConnectedDevices = async () => {
    try {
      const response = await axios.get(`${API}/wearables`, { withCredentials: true });
      setDevices(response.data);
    } catch (error) {
      console.error("Erro ao buscar dispositivos:", error);
    }
  };

  const handleConnect = async (providerId) => {
    // Google Fit: usar fluxo OAuth real quando configurado
    if (providerId === "google_health_connect") {
      try {
        const { data: statusData } = await axios.get(`${API}/wearables/google-fit/status`, { withCredentials: true });
        if (statusData.configured) {
          // Fluxo OAuth REAL
          const { data: authData } = await axios.get(`${API}/wearables/google-fit/auth`, { withCredentials: true });
          if (authData.auth_url) {
            toast.info("Redirecionando para o Google...", { duration: 2000 });
            window.location.href = authData.auth_url;
            return;
          }
        }
      } catch (error) {
        console.log("Google Fit real nao disponivel, usando fluxo simulado");
      }
    }

    // Fluxo simulado para outros providers
    setOauthFlow({ provider: providerId, step: 0 });
    setSyncResult(null);

    for (let i = 0; i < OAUTH_STEPS.length; i++) {
      setOauthFlow({ provider: providerId, step: i });
      await new Promise(r => setTimeout(r, 800 + Math.random() * 600));
    }

    try {
      const { data } = await axios.post(
        `${API}/wearables/oauth/callback`,
        { provider: providerId, auth_code: `mock-code-${Date.now()}` },
        { withCredentials: true }
      );

      setSyncResult(data.sync_data);
      await fetchConnectedDevices();
      toast.success(`${providerId.replace(/_/g, ' ')} autorizado e sincronizado!`);
    } catch (error) {
      toast.error("Erro na autorizacao. Tente novamente.");
    } finally {
      setTimeout(() => {
        setOauthFlow(null);
        setSyncResult(null);
      }, 4000);
    }
  };

  const handleDisconnect = async (deviceId) => {
    setLoading(true);
    try {
      await axios.delete(`${API}/wearables/${deviceId}`, { withCredentials: true });
      setDevices(devices.filter(d => d.id !== deviceId));
      toast.success("Dispositivo desconectado");
    } catch (error) {
      toast.error("Erro ao desconectar dispositivo");
    } finally {
      setLoading(false);
    }
  };

  const isConnected = (providerId) => devices.some(d => d.provider === providerId && d.is_connected);
  const getConnectedDevice = (providerId) => devices.find(d => d.provider === providerId);
  const isInOauthFlow = (providerId) => oauthFlow?.provider === providerId;

  return (
    <div className="min-h-screen bg-neutral-950 p-6">
      {/* Header */}
      <div className="w-full max-w-5xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-white font-heading mb-2">
              Conectar Dispositivos
            </h1>
            <p className="text-neutral-400 text-sm sm:text-base">
              Autorize e sincronize dados automaticamente via OAuth
            </p>
          </div>
          <Button
            onClick={() => navigate("/")}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/5"
            data-testid="close-devices-button"
          >
            Voltar
          </Button>
        </div>

        {/* Info Banner */}
        <div className="border border-cyan-400/30 bg-cyan-400/5 rounded-md p-4 flex items-start gap-3">
          <Wifi className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-cyan-400 mb-1">
              Coleta Automatica via OAuth 2.0
            </h3>
            <p className="text-xs text-neutral-300">
              Ao autorizar, o VitalFlow conecta via OAuth 2.0 e sincroniza automaticamente HRV, BPM, horas de sono e passos. Sem digitacao manual.
            </p>
          </div>
        </div>
      </div>

      {/* OAuth Flow Modal */}
      <AnimatePresence>
        {oauthFlow && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-neutral-900 border border-white/10 rounded-md p-8 w-full max-w-md mx-4"
              data-testid="oauth-flow-modal"
            >
              <h3 className="text-lg font-bold text-white mb-6 text-center">Autorizacao OAuth 2.0</h3>

              <div className="space-y-3 mb-6">
                {OAUTH_STEPS.map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-500 ${
                      i < oauthFlow.step ? 'bg-emerald-500' :
                      i === oauthFlow.step ? 'bg-cyan-500 animate-pulse' :
                      'bg-neutral-800'
                    }`}>
                      {i < oauthFlow.step ? (
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      ) : i === oauthFlow.step ? (
                        <RefreshCw className="w-3 h-3 text-white animate-spin" />
                      ) : (
                        <span className="text-xs text-neutral-500">{i + 1}</span>
                      )}
                    </div>
                    <span className={`text-sm transition-colors duration-500 ${
                      i <= oauthFlow.step ? 'text-white' : 'text-neutral-600'
                    }`}>
                      {step}
                    </span>
                  </div>
                ))}
              </div>

              {/* Sync Result */}
              {syncResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-emerald-400/30 bg-emerald-400/5 rounded-md p-4"
                  data-testid="sync-result"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-bold text-emerald-400">Dados Sincronizados</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-neutral-800/50 rounded p-2">
                      <span className="text-neutral-500">HRV</span>
                      <p className="text-white font-mono font-bold">{syncResult.hrv}ms</p>
                    </div>
                    <div className="bg-neutral-800/50 rounded p-2">
                      <span className="text-neutral-500">BPM</span>
                      <p className="text-white font-mono font-bold">{syncResult.bpm}</p>
                    </div>
                    <div className="bg-neutral-800/50 rounded p-2">
                      <span className="text-neutral-500">Sono</span>
                      <p className="text-white font-mono font-bold">{syncResult.sleep_hours}h</p>
                    </div>
                    <div className="bg-neutral-800/50 rounded p-2">
                      <span className="text-neutral-500">Passos</span>
                      <p className="text-white font-mono font-bold">{syncResult.steps?.toLocaleString()}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Devices Grid */}
      <div className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {wearableProviders.map((provider, index) => {
          const connected = isConnected(provider.id);
          const device = getConnectedDevice(provider.id);
          const inFlow = isInOauthFlow(provider.id);
          const Icon = provider.icon;

          return (
            <motion.div
              key={provider.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              data-testid={`device-card-${provider.id}`}
              className={`border rounded-md p-6 relative overflow-hidden transition-all duration-200 ${
                connected
                  ? `${provider.borderColor} ${provider.bgColor} border-2`
                  : 'border-white/10 bg-neutral-900/40 hover:bg-neutral-900/60 hover:border-white/20'
              }`}
            >
              {connected && (
                <div className="absolute top-4 right-4">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-full border border-emerald-400/50 bg-emerald-400/10"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span className="text-xs font-semibold text-emerald-400">Conectado</span>
                  </motion.div>
                </div>
              )}

              <div className={`w-12 h-12 rounded-md ${provider.bgColor} flex items-center justify-center mb-4`}>
                <Icon className={`w-6 h-6 ${provider.color}`} />
              </div>

              <div className="mb-4">
                <h3 className="text-lg font-bold text-white mb-1">{provider.name}</h3>
                <p className="text-xs text-neutral-500 mb-2">{provider.platform}</p>
                <p className="text-sm text-neutral-400">{provider.description}</p>
              </div>

              {connected && device && (
                <div className="mb-4 text-xs text-neutral-500">
                  Ultima sinc.: {device.last_sync ? new Date(device.last_sync).toLocaleString('pt-BR') : 'Nunca'}
                </div>
              )}

              <div className="flex gap-2">
                {connected ? (
                  <Button
                    onClick={() => handleDisconnect(device.id)}
                    disabled={loading}
                    className="w-full bg-rose-600 hover:bg-rose-500 text-white font-semibold border-0"
                    data-testid={`disconnect-${provider.id}`}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Desconectar
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleConnect(provider.id)}
                    disabled={inFlow || !!oauthFlow}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold border-0 text-sm"
                    data-testid={`connect-${provider.id}`}
                  >
                    {inFlow ? (
                      <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Autorizando...</>
                    ) : (
                      <><ArrowRight className="w-4 h-4 mr-2" /> Conectar via OAuth</>
                    )}
                  </Button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Sync Info */}
      <div className="w-full max-w-5xl mx-auto mt-8 border border-white/5 bg-neutral-900/40 rounded-md p-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-400 mb-3">
          Dados Coletados Automaticamente
        </h3>
        <ul className="space-y-2 text-sm text-neutral-300">
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span><strong>HRV:</strong> Variabilidade cardiaca (24h)</span>
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span><strong>BPM Medio:</strong> Batimentos em repouso</span>
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span><strong>Horas de Sono:</strong> Duracao da ultima noite</span>
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span><strong>Passos:</strong> Contagem diaria do acelerometro</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default ConnectDevices;

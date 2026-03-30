import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Smartphone, Watch, Activity, CheckCircle2, XCircle, Wifi } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ConnectDevices = () => {
  const navigate = useNavigate();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(null);

  const wearableProviders = [
    {
      id: "google_health_connect",
      name: "Google Health Connect",
      platform: "Android",
      icon: Smartphone,
      color: "text-green-400",
      borderColor: "border-green-400/30",
      bgColor: "bg-green-400/10",
      description: "Sincronize dados do Google Fit e apps de saúde Android"
    },
    {
      id: "apple_healthkit",
      name: "Apple HealthKit",
      platform: "iOS",
      icon: Watch,
      color: "text-blue-400",
      borderColor: "border-blue-400/30",
      bgColor: "bg-blue-400/10",
      description: "Conecte seu Apple Watch e iPhone Health"
    },
    {
      id: "garmin",
      name: "Garmin Connect",
      platform: "Multi-plataforma",
      icon: Activity,
      color: "text-cyan-400",
      borderColor: "border-cyan-400/30",
      bgColor: "bg-cyan-400/10",
      description: "Integre dados de dispositivos Garmin"
    },
    {
      id: "fitbit",
      name: "Fitbit",
      platform: "Multi-plataforma",
      icon: Activity,
      color: "text-purple-400",
      borderColor: "border-purple-400/30",
      bgColor: "bg-purple-400/10",
      description: "Conecte seu Fitbit e sincronize automático"
    }
  ];

  useEffect(() => {
    fetchConnectedDevices();
  }, []);

  const fetchConnectedDevices = async () => {
    try {
      const response = await axios.get(`${API}/wearables`);
      setDevices(response.data);
    } catch (error) {
      console.error("Erro ao buscar dispositivos:", error);
    }
  };

  const handleConnect = async (providerId) => {
    setConnecting(providerId);
    setLoading(true);

    try {
      const provider = wearableProviders.find(p => p.id === providerId);
      
      const response = await axios.post(`${API}/wearables/connect`, {
        provider: providerId,
        device_name: provider.name
      });

      setDevices([...devices, response.data]);
      toast.success(`${provider.name} conectado com sucesso!`);
    } catch (error) {
      console.error("Erro ao conectar dispositivo:", error);
      toast.error("Erro ao conectar dispositivo. Tente novamente.");
    } finally {
      setLoading(false);
      setConnecting(null);
    }
  };

  const handleDisconnect = async (deviceId) => {
    setLoading(true);

    try {
      await axios.delete(`${API}/wearables/${deviceId}`);
      setDevices(devices.filter(d => d.id !== deviceId));
      toast.success("Dispositivo desconectado");
    } catch (error) {
      console.error("Erro ao desconectar:", error);
      toast.error("Erro ao desconectar dispositivo");
    } finally {
      setLoading(false);
    }
  };

  const isConnected = (providerId) => {
    return devices.some(d => d.provider === providerId && d.is_connected);
  };

  const getConnectedDevice = (providerId) => {
    return devices.find(d => d.provider === providerId);
  };

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
              Sincronize seus dados de saúde automaticamente
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
              Sincronização Automática Ativada
            </h3>
            <p className="text-xs text-neutral-300">
              Após conectar, o VitalFlow irá automaticamente puxar HRV, BPM médio e horas de sono das últimas 24h. O Mapa Anatômico atualizará em tempo real sem necessidade de clicar em "Analisar".
            </p>
          </div>
        </div>
      </div>

      {/* Devices Grid */}
      <div className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {wearableProviders.map((provider, index) => {
          const connected = isConnected(provider.id);
          const device = getConnectedDevice(provider.id);
          const Icon = provider.icon;

          return (
            <motion.div
              key={provider.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              data-testid={`device-card-${provider.id}`}
              className={`
                border rounded-md p-6 relative overflow-hidden
                transition-all duration-200
                ${
                  connected
                    ? `${provider.borderColor} ${provider.bgColor} border-2`
                    : 'border-white/10 bg-neutral-900/40 hover:bg-neutral-900/60 hover:border-white/20'
                }
              `}
            >
              {/* Connected Badge */}
              {connected && (
                <div className="absolute top-4 right-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-full border border-emerald-400/50 bg-emerald-400/10"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span className="text-xs font-semibold text-emerald-400">Conectado</span>
                  </motion.div>
                </div>
              )}

              {/* Icon */}
              <div className={`w-12 h-12 rounded-md ${provider.bgColor} flex items-center justify-center mb-4`}>
                <Icon className={`w-6 h-6 ${provider.color}`} />
              </div>

              {/* Info */}
              <div className="mb-4">
                <h3 className="text-lg font-bold text-white mb-1">
                  {provider.name}
                </h3>
                <p className="text-xs text-neutral-500 mb-2">
                  {provider.platform}
                </p>
                <p className="text-sm text-neutral-400">
                  {provider.description}
                </p>
              </div>

              {/* Last Sync Info */}
              {connected && device && (
                <div className="mb-4 text-xs text-neutral-500">
                  Última sinc.: {device.last_sync ? new Date(device.last_sync).toLocaleString('pt-BR') : 'Nunca'}
                </div>
              )}

              {/* Action Button */}
              <div className="flex gap-2">
                {connected ? (
                  <Button
                    onClick={() => handleDisconnect(device.id)}
                    disabled={loading}
                    variant="outline"
                    className="w-full border-rose-500/30 text-rose-500 hover:bg-rose-500/10"
                    data-testid={`disconnect-${provider.id}`}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Desconectar
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleConnect(provider.id)}
                    disabled={loading || connecting === provider.id}
                    className={`w-full ${provider.color.replace('text-', 'bg-').replace('400', '500')} hover:opacity-90 text-black font-semibold`}
                    data-testid={`connect-${provider.id}`}
                  >
                    {connecting === provider.id ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2" />
                        Conectando...
                      </>
                    ) : (
                      <>Conectar {provider.name}</>
                    )}
                  </Button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Technical Note */}
      <div className="w-full max-w-5xl mx-auto mt-8 border border-white/5 bg-neutral-900/40 rounded-md p-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-400 mb-3">
          Dados Sincronizados Automaticamente
        </h3>
        <ul className="space-y-2 text-sm text-neutral-300">
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span><strong>HRV:</strong> Variabilidade cardíaca das últimas 24h (média)</span>
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span><strong>BPM Médio em Repouso:</strong> Batimentos cardíacos em repouso das últimas 24h</span>
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span><strong>Horas de Sono:</strong> Total de sono da última noite</span>
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span><strong>Atualização:</strong> Automática a cada sincronização do dispositivo</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default ConnectDevices;
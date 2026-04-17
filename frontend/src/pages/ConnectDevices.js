import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const API =
  process.env.REACT_APP_BACKEND_URL || "https://vitalflow.up.railway.app";

export default function ConnectDevices() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchConnectedDevices = async () => {
    try {
      const { data } = await axios.get(`${API}/api/wearables/devices`, {
        withCredentials: true,
      });

      if (Array.isArray(data)) {
        setDevices(data);
      } else if (Array.isArray(data?.devices)) {
        setDevices(data.devices);
      } else {
        setDevices([]);
      }
    } catch (err) {
      console.error("Erro ao buscar dispositivos:", err);
      setDevices([]);
    }
  };

  useEffect(() => {
    fetchConnectedDevices();
  }, []);

  const isConnected = (providerId) => {
    if (!Array.isArray(devices)) return false;
    return devices.some(
      (d) =>
        (d.provider === providerId || d.provider_id === providerId) &&
        (d.is_connected === true || d.connected === true)
    );
  };

  const handleSyncNow = async () => {
    setLoading(true);

    try {
      await axios.post(
        `${API}/api/wearables/sync`,
        { scenario: "random" },
        { withCredentials: true }
      );

      toast.success("Sincronização concluída!");

      setTimeout(() => {
        navigate("/");
      }, 1000);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao sincronizar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Conectar Dispositivos</h1>
        <p className="text-neutral-400 mb-8">
          Autorize e sincronize seus dados biométricos automaticamente.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-white/10 rounded-2xl p-6 bg-neutral-950">
            <h2 className="font-bold text-lg mb-2">Google Health Connect</h2>
            <p className="text-sm text-neutral-400 mb-4">
              Sincronize dados do Google Fit e apps de saúde Android.
            </p>

            {isConnected("google") ? (
              <button
                onClick={handleSyncNow}
                disabled={loading}
                className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-4 py-2 rounded-xl"
              >
                {loading ? "Sincronizando..." : "Sincronizar Agora"}
              </button>
            ) : (
              <button
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-2 rounded-xl"
              >
                Conectar
              </button>
            )}
          </div>

          <div className="border border-white/10 rounded-2xl p-6 bg-neutral-950">
            <h2 className="font-bold text-lg mb-2">Apple HealthKit</h2>
            <p className="text-sm text-neutral-400 mb-4">
              Conecte seu Apple Watch e iPhone Health.
            </p>
            <button className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-2 rounded-xl">
              Conectar
            </button>
          </div>

          <div className="border border-white/10 rounded-2xl p-6 bg-neutral-950">
            <h2 className="font-bold text-lg mb-2">Garmin Connect</h2>
            <p className="text-sm text-neutral-400 mb-4">
              Integre dados de dispositivos Garmin.
            </p>
            <button className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-2 rounded-xl">
              Conectar
            </button>
          </div>

          <div className="border border-white/10 rounded-2xl p-6 bg-neutral-950">
            <h2 className="font-bold text-lg mb-2">Fitbit</h2>
            <p className="text-sm text-neutral-400 mb-4">
              Conecte seu Fitbit e sincronize automaticamente.
            </p>
            <button className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-2 rounded-xl">
              Conectar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
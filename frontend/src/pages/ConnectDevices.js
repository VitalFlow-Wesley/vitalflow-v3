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

  // 🔹 Buscar dispositivos conectados
  const fetchConnectedDevices = async () => {
    try {
      const { data } = await axios.get(`${API}/api/wearables/devices`, {
        withCredentials: true,
      });
      setDevices(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchConnectedDevices();
  }, []);

  // 🔹 Verifica se está conectado
  const isConnected = (providerId) => {
    return devices.some((d) => d.provider === providerId && d.is_connected);
  };

  // 🔹 Sincronizar
  const handleSyncNow = async () => {
    setLoading(true);
    try {
      await axios.post(
        `${API}/api/wearables/sync`,
        { scenario: "random" },
        { withCredentials: true }
      );

      toast.success("Sincronização concluída!");

      // 🔥 VOLTA PRO DASHBOARD
      setTimeout(() => {
        navigate("/");
      }, 1000);
    } catch (err) {
      toast.error("Erro ao sincronizar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-2xl font-bold mb-6">
        Conectar Dispositivos
      </h1>

      <div className="grid md:grid-cols-2 gap-6">
        {/* GOOGLE */}
        <div className="border border-white/10 rounded-xl p-4">
          <h2 className="font-bold mb-2">Google Health Connect</h2>
          <p className="text-sm text-neutral-400 mb-4">
            Sincronize dados do Android
          </p>

          {isConnected("google") ? (
            <button
              onClick={handleSyncNow}
              className="bg-blue-500 px-4 py-2 rounded-lg"
            >
              {loading ? "Sincronizando..." : "Sincronizar Agora"}
            </button>
          ) : (
            <button className="bg-green-500 px-4 py-2 rounded-lg">
              Conectar
            </button>
          )}
        </div>

        {/* APPLE */}
        <div className="border border-white/10 rounded-xl p-4">
          <h2 className="font-bold mb-2">Apple HealthKit</h2>
          <p className="text-sm text-neutral-400 mb-4">
            Conecte seu iPhone
          </p>

          <button className="bg-green-500 px-4 py-2 rounded-lg">
            Conectar
          </button>
        </div>

        {/* GARMIN */}
        <div className="border border-white/10 rounded-xl p-4">
          <h2 className="font-bold mb-2">Garmin</h2>
          <p className="text-sm text-neutral-400 mb-4">
            Conecte dispositivos Garmin
          </p>

          <button className="bg-green-500 px-4 py-2 rounded-lg">
            Conectar
          </button>
        </div>

        {/* FITBIT */}
        <div className="border border-white/10 rounded-xl p-4">
          <h2 className="font-bold mb-2">Fitbit</h2>
          <p className="text-sm text-neutral-400 mb-4">
            Conecte seu Fitbit
          </p>

          <button className="bg-green-500 px-4 py-2 rounded-lg">
            Conectar
          </button>
        </div>
      </div>
    </div>
  );
}
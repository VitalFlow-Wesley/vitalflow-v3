import { useState, useEffect, useRef, useCallback } from "react";
import { Wifi, WifiOff } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

const API = `${"https://vitalflow.ia.br"}/api`;
const CACHE_KEY = "vitalflow_offline_queue";
const PING_INTERVAL = 15000;

const getStatusConfig = (status) => ({
  online: { color: "#34d399", label: "Online", pulse: "animate-pulse" },
  reconnecting: { color: "#fbbf24", label: "Reconectando...", pulse: "animate-ping" },
  offline: { color: "#f43f5e", label: "Offline", pulse: "" },
}[status]);

const ConnectionStatus = () => {
  const [status, setStatus] = useState("online");
  const retryRef = useRef(null);
  const syncingRef = useRef(false);

  const checkConnection = useCallback(async () => {
    try {
      await axios.get(`${API}/`, { timeout: 5000 });
      if (status !== "online") {
        setStatus("online");
        flushOfflineQueue();
      }
    } catch {
      if (status === "online") {
        setStatus("reconnecting");
        setTimeout(() => setStatus((s) => s === "reconnecting" ? "offline" : s), 8000);
      }
    }
  }, [status]);

  useEffect(() => {
    const handleOnline = () => {
      setStatus("reconnecting");
      checkConnection();
    };
    const handleOffline = () => setStatus("offline");

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (!navigator.onLine) setStatus("offline");

    retryRef.current = setInterval(checkConnection, PING_INTERVAL);
    return () => {
      clearInterval(retryRef.current);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [checkConnection]);

  const flushOfflineQueue = async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;

    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return;

      const queue = JSON.parse(raw);
      if (!queue.length) return;

      let sent = 0;
      const failed = [];

      for (const item of queue) {
        try {
          await axios.post(`${API}/${item.endpoint}`, item.payload, { withCredentials: true });
          sent++;
        } catch {
          failed.push(item);
        }
      }

      localStorage.setItem(CACHE_KEY, JSON.stringify(failed));
      if (sent > 0) {
        toast.success(`${sent} dado(s) offline sincronizado(s) automaticamente!`);
      }
    } finally {
      syncingRef.current = false;
    }
  };

  const cfg = getStatusConfig(status);

  return (
    <div className="flex items-center gap-1.5" data-testid="connection-status" title={cfg.label}>
      <div className="relative">
        <div
          className={`w-2 h-2 rounded-full ${cfg.pulse}`}
          style={{ backgroundColor: cfg.color }}
        />
        {status === "online" && (
          <div
            className="absolute inset-0 w-2 h-2 rounded-full animate-ping opacity-40"
            style={{ backgroundColor: cfg.color }}
          />
        )}
      </div>
      {status !== "online" && (
        <span className="text-[10px] font-medium" style={{ color: cfg.color }}>
          {cfg.label}
        </span>
      )}
    </div>
  );
};

// Utility: queue data when offline
export const queueOfflineData = (endpoint, payload) => {
  const raw = localStorage.getItem(CACHE_KEY) || "[]";
  const queue = JSON.parse(raw);
  queue.push({ endpoint, payload, queued_at: new Date().toISOString() });
  localStorage.setItem(CACHE_KEY, JSON.stringify(queue));
};

export default ConnectionStatus;

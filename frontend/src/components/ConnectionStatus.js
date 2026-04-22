import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";

// PADRONIZADO: Sem o /api no final para evitar duplicidade
const API_URL = process.env.REACT_APP_BACKEND_URL || "https://vitalflow.up.railway.app";

const CACHE_KEY = "vitalflow_offline_queue";
const PING_INTERVAL = 15000;

const getStatusConfig = (status) =>
  ({
    online: {
      color: "#34d399",
      label: "Online",
      pulse: "animate-pulse",
    },
    reconnecting: {
      color: "#fbbf24",
      label: "Reconectando...",
      pulse: "animate-pulse",
    },
    offline: {
      color: "#f43f5e",
      label: "Offline",
      pulse: "",
    },
  }[status]);

const ConnectionStatus = () => {
  const [status, setStatus] = useState("online");
  const retryRef = useRef(null);
  const syncingRef = useRef(false);
  const offlineTimeoutRef = useRef(null);

  const flushOfflineQueue = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;

    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return;

      const queue = JSON.parse(raw);
      if (!Array.isArray(queue) || queue.length === 0) return;

      let sent = 0;
      const failed = [];

      for (const item of queue) {
        try {
          // Garante que o endpoint tenha a barra correta, sem duplicar
          const endpoint = item.endpoint.startsWith('/') ? item.endpoint : `/${item.endpoint}`;
          await axios.post(`${API_URL}${endpoint}`, item.payload, {
            withCredentials: true,
            timeout: 10000,
          });
          sent++;
        } catch (error) {
          failed.push(item);
        }
      }

      localStorage.setItem(CACHE_KEY, JSON.stringify(failed));

      if (sent > 0) {
        toast.success(`${sent} dado(s) offline sincronizado(s) automaticamente!`);
      }
    } catch (error) {
      console.error("Erro ao sincronizar fila offline:", error);
    } finally {
      syncingRef.current = false;
    }
  }, []);

  const checkConnection = useCallback(async () => {
    try {
      // Bate na raiz do servidor para ver se ele está vivo
      await axios.get(`${API_URL}/api/auth/me`, {
        timeout: 5000,
        // DICA PRO: Aceita erro 404 como "online", pois significa que o servidor atendeu a chamada
        validateStatus: (status) => status < 500, 
      });

      if (offlineTimeoutRef.current) {
        clearTimeout(offlineTimeoutRef.current);
        offlineTimeoutRef.current = null;
      }

      setStatus((prev) => {
        if (prev !== "online") {
          flushOfflineQueue();
        }
        return "online";
      });
    } catch (error) {
      setStatus((prev) => {
        if (prev === "online") {
          if (offlineTimeoutRef.current) {
            clearTimeout(offlineTimeoutRef.current);
          }

          offlineTimeoutRef.current = setTimeout(() => {
            setStatus((current) =>
              current === "reconnecting" ? "offline" : current
            );
          }, 8000);

          return "reconnecting";
        }

        return prev;
      });
    }
  }, [flushOfflineQueue]);

  useEffect(() => {
    const handleOnline = () => {
      setStatus("reconnecting");
      checkConnection();
    };

    const handleOffline = () => {
      if (offlineTimeoutRef.current) {
        clearTimeout(offlineTimeoutRef.current);
        offlineTimeoutRef.current = null;
      }
      setStatus("offline");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (!navigator.onLine) {
      setStatus("offline");
    } else {
      checkConnection();
    }

    retryRef.current = setInterval(checkConnection, PING_INTERVAL);

    return () => {
      if (retryRef.current) clearInterval(retryRef.current);
      if (offlineTimeoutRef.current) clearTimeout(offlineTimeoutRef.current);

      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [checkConnection]);

  const cfg = getStatusConfig(status);

  return (
    <div
      className="flex items-center gap-1.5"
      data-testid="connection-status"
      title={cfg.label}
    >
      <div className="relative flex h-2 w-2 items-center justify-center overflow-visible">
        <div
          className={`relative z-10 h-2 w-2 rounded-full ${cfg.pulse}`}
          style={{ backgroundColor: cfg.color }}
        />
        {status === "online" && (
          <div
            className="absolute z-0 h-2 w-2 rounded-full animate-ping opacity-40"
            style={{ backgroundColor: cfg.color }}
          />
        )}
      </div>

      {status !== "online" && (
        <span
          className="text-[10px] font-medium leading-none"
          style={{ color: cfg.color }}
        >
          {cfg.label}
        </span>
      )}
    </div>
  );
};

export const queueOfflineData = (endpoint, payload) => {
  try {
    const raw = localStorage.getItem(CACHE_KEY) || "[]";
    const queue = JSON.parse(raw);

    const safeQueue = Array.isArray(queue) ? queue : [];

    safeQueue.push({
      endpoint,
      payload,
      queued_at: new Date().toISOString(),
    });

    localStorage.setItem(CACHE_KEY, JSON.stringify(safeQueue));
  } catch (error) {
    console.error("Erro ao salvar fila offline:", error);
  }
};

export default ConnectionStatus;
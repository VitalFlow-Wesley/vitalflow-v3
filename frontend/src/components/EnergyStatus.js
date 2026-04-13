import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || "https://vitalflow.up.railway.app";

const EnergyStatus = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEnergyStatus();
    
    // Poll a cada 30 segundos
    const interval = setInterval(fetchEnergyStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchEnergyStatus = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/status/energy`, {
        withCredentials: true,
      });
      setStatus(data);
    } catch (error) {
      console.error('Erro ao buscar status de energia:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !status) {
    return (
      <div className="flex items-center gap-3">
        <div className="w-4 h-4 rounded-full bg-neutral-700 animate-pulse" />
        <span className="text-sm text-neutral-500">Carregando...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3" data-testid="energy-status">
      {/* Bolinha com pulso */}
      <motion.div
        className="relative"
        animate={{
          scale: status.status === 'Vermelho' ? [1, 1.2, 1] : [1, 1.1, 1],
        }}
        transition={{
          duration: status.status === 'Vermelho' ? 1.5 : 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <div
          className="w-4 h-4 rounded-full shadow-lg"
          style={{
            backgroundColor: status.color_code,
            boxShadow: `0 0 20px ${status.color_code}80`,
          }}
          data-testid={`status-indicator-${status.status.toLowerCase()}`}
        />
        
        {/* Anel externo pulsante */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            border: `2px solid ${status.color_code}`,
          }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.6, 0, 0.6],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      </motion.div>

      {/* Label */}
      <div className="flex flex-col">
        <span
          className="text-sm font-semibold"
          style={{ color: status.color_code }}
        >
          {status.label}
        </span>
        {status.current_bpm && (
          <span className="text-xs text-neutral-500">
            {status.current_bpm} BPM | HRV {status.current_hrv}ms
          </span>
        )}
      </div>
    </div>
  );
};

export default EnergyStatus;

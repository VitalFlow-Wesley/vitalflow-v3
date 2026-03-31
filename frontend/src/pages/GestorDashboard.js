import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import axios from 'axios';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, AlertTriangle, Activity, Users, Clock } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const GestorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verifica se é gestor
    if (user && user.nivel_acesso !== 'Gestor') {
      navigate('/');
      return;
    }

    fetchMetrics();
    
    // Atualiza a cada 2 minutos
    const interval = setInterval(fetchMetrics, 120000);
    
    return () => clearInterval(interval);
  }, [user, navigate]);

  const fetchMetrics = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/dashboard/team-stress`, {
        withCredentials: true,
      });
      setMetrics(data);
    } catch (error) {
      console.error('Erro ao buscar métricas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStressColor = (level) => {
    if (level >= 80) return '#f43f5e'; // red
    if (level >= 50) return '#fbbf24'; // amber
    return '#34d399'; // green
  };

  const getStressLabel = (level) => {
    if (level >= 80) return 'Crítico';
    if (level >= 50) return 'Moderado';
    return 'Baixo';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950">
        <Navbar onOpenForm={() => {}} />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-neutral-400">Carregando métricas...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <Navbar onOpenForm={() => {}} />

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-white font-heading mb-2">
            Dashboard do Gestor
          </h1>
          <p className="text-neutral-400">
            Métricas de estresse do time (anonimizadas) - {metrics.period}
          </p>
        </div>

        {/* Cards de Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Análises Totais */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-white/10 bg-neutral-900/60 backdrop-blur-xl rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-cyan-400" />
              <span className="text-2xl font-mono font-bold text-white">
                {metrics.total_analyses}
              </span>
            </div>
            <p className="text-sm text-neutral-400">Análises Totais</p>
          </motion.div>

          {/* Média de Estresse */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="border border-white/10 bg-neutral-900/60 backdrop-blur-xl rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-8 h-8 text-amber-400" />
              <span
                className="text-2xl font-mono font-bold"
                style={{ color: getStressColor(metrics.average_stress_level) }}
              >
                {metrics.average_stress_level}
              </span>
            </div>
            <p className="text-sm text-neutral-400">
              Nível Médio - {getStressLabel(metrics.average_stress_level)}
            </p>
          </motion.div>

          {/* Alertas Críticos */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="border border-rose-500/30 bg-rose-500/5 backdrop-blur-xl rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="w-8 h-8 text-rose-500" />
              <span className="text-2xl font-mono font-bold text-rose-500">
                {metrics.critical_alerts}
              </span>
            </div>
            <p className="text-sm text-neutral-400">Alertas Críticos</p>
          </motion.div>

          {/* Horário de Pico */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="border border-white/10 bg-neutral-900/60 backdrop-blur-xl rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-purple-400" />
              <span className="text-2xl font-mono font-bold text-white">
                {metrics.peak_stress_time || 'N/A'}
              </span>
            </div>
            <p className="text-sm text-neutral-400">Pico de Estresse</p>
          </motion.div>
        </div>

        {/* Gráfico de Distribuição */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="border border-white/10 bg-neutral-900/60 backdrop-blur-xl rounded-lg p-6 mb-8"
        >
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-bold text-white">
              Distribuição de Estresse por Horário
            </h3>
          </div>

          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.stress_distribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="hour"
                  stroke="rgba(255,255,255,0.3)"
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  domain={[0, 100]}
                  stroke="rgba(255,255,255,0.3)"
                  style={{ fontSize: '12px' }}
                  label={{ value: 'Nível de Estresse', angle: -90, position: 'insideLeft', fill: '#fff' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#171717',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#fff' }}
                  formatter={(value, name) => {
                    if (name === 'avg_stress_level') {
                      return [
                        `${value} - ${getStressLabel(value)}`,
                        'Nível de Estresse',
                      ];
                    }
                    return [value, name];
                  }}
                />
                <Bar dataKey="avg_stress_level" radius={[8, 8, 0, 0]}>
                  {metrics.stress_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getStressColor(entry.avg_stress_level)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Resumo de Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border border-emerald-400/30 bg-emerald-400/5 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-emerald-400">Normal</span>
              <span className="text-2xl font-mono font-bold text-emerald-400">
                {metrics.normal_status}
              </span>
            </div>
          </div>

          <div className="border border-amber-400/30 bg-amber-400/5 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-amber-400">Atenção</span>
              <span className="text-2xl font-mono font-bold text-amber-400">
                {metrics.medium_alerts}
              </span>
            </div>
          </div>

          <div className="border border-rose-500/30 bg-rose-500/5 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-rose-500">Crítico</span>
              <span className="text-2xl font-mono font-bold text-rose-500">
                {metrics.critical_alerts}
              </span>
            </div>
          </div>
        </div>

        {/* Nota sobre Anonimização */}
        <div className="mt-8 border border-white/5 bg-neutral-900/40 rounded-lg p-4">
          <p className="text-xs text-neutral-500 text-center">
            🔒 Dados anonimizados conforme LGPD. Nenhum colaborador pode ser identificado individualmente nestas métricas.
          </p>
        </div>
      </div>
    </div>
  );
};

export default GestorDashboard;

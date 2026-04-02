import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';
import {
  TrendingUp, TrendingDown, AlertTriangle, Activity,
  Users, Clock, Shield, FileText, Download, BarChart3
} from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const GestorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stressMetrics, setStressMetrics] = useState(null);
  const [teamOverview, setTeamOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.nivel_acesso !== 'Gestor') {
      navigate('/');
      return;
    }
    fetchAllMetrics();
    const interval = setInterval(fetchAllMetrics, 120000);
    return () => clearInterval(interval);
  }, [user, navigate]);

  const fetchAllMetrics = async () => {
    try {
      const [stressRes, overviewRes] = await Promise.all([
        axios.get(`${API_URL}/api/dashboard/team-stress`, { withCredentials: true }),
        axios.get(`${API_URL}/api/dashboard/team-overview`, { withCredentials: true })
      ]);
      setStressMetrics(stressRes.data);
      setTeamOverview(overviewRes.data);
    } catch (error) {
      console.error('Erro ao buscar metricas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/dashboard/export-pdf`, { withCredentials: true });
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vitalflow_relatorio_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Relatorio exportado!');
    } catch (error) {
      toast.error('Erro ao exportar relatorio.');
    }
  };

  const getStressColor = (level) => {
    if (level >= 80) return '#f43f5e';
    if (level >= 50) return '#fbbf24';
    return '#34d399';
  };

  const getVScoreColor = (score) => {
    if (score >= 80) return '#34d399';
    if (score >= 50) return '#fbbf24';
    return '#f43f5e';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-neutral-400">Carregando metricas do time...</p>
          </div>
        </div>
      </div>
    );
  }

  const pieData = teamOverview ? [
    { name: 'Verde', value: teamOverview.distribution.verde, fill: '#34d399' },
    { name: 'Amarelo', value: teamOverview.distribution.amarelo, fill: '#fbbf24' },
    { name: 'Vermelho', value: teamOverview.distribution.vermelho, fill: '#f43f5e' },
  ].filter(d => d.value > 0) : [];

  return (
    <div className="min-h-screen bg-neutral-950">
      <Navbar />

      {/* Mobile block */}
      <div className="block md:hidden p-8 text-center">
        <div className="border border-purple-500/30 bg-purple-500/5 rounded-md p-8 max-w-sm mx-auto">
          <BarChart3 className="w-10 h-10 text-purple-400 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-white mb-2">Painel do RH</h2>
          <p className="text-sm text-neutral-400">
            Este painel esta disponivel apenas no desktop para melhor visualizacao dos dados do time.
          </p>
        </div>
      </div>

      {/* Desktop content */}
      <div className="hidden md:block w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-white font-heading mb-1" data-testid="gestor-title">
              Painel do Gestor
            </h1>
            <p className="text-neutral-400 text-sm">
              Visao agregada do time - dados anonimizados (LGPD)
            </p>
          </div>
          <button
            onClick={handleExportPDF}
            data-testid="export-pdf-btn"
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-sm font-semibold rounded-md hover:bg-cyan-500/20 transition-all"
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>

        {/* Lei 14.831 Alert */}
        {teamOverview && teamOverview.lei_14831_alerts > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 border border-rose-500/40 bg-rose-500/10 rounded-md p-4 flex items-start gap-3"
            data-testid="lei-14831-alert"
          >
            <Shield className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-rose-400">
                Lei 14.831 - Intervencao Necessaria
              </p>
              <p className="text-xs text-neutral-300 mt-1">
                {teamOverview.lei_14831_alerts} colaborador(es) com V-Score medio abaixo de 50 nos ultimos 7 dias. A legislacao exige acao preventiva de saude mental.
              </p>
            </div>
          </motion.div>
        )}

        {/* Top Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {/* V-Score Agregado */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-1 border border-white/10 bg-neutral-900/60 rounded-md p-5"
            data-testid="team-vscore"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">V-Score Time</p>
            <p className="text-3xl font-mono font-black" style={{ color: getVScoreColor(teamOverview?.avg_v_score || 0) }}>
              {teamOverview?.avg_v_score || 0}
            </p>
            <p className="text-xs text-neutral-500 mt-1">Media agregada 7 dias</p>
          </motion.div>

          {/* Estresse Medio */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="border border-white/10 bg-neutral-900/60 rounded-md p-5"
            data-testid="team-stress"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">Estresse Medio</p>
            <p className="text-3xl font-mono font-black" style={{ color: getStressColor(teamOverview?.avg_stress_level || 0) }}>
              {teamOverview?.avg_stress_level || 0}
            </p>
            <p className="text-xs text-neutral-500 mt-1">Indice invertido</p>
          </motion.div>

          {/* Colaboradores */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="border border-white/10 bg-neutral-900/60 rounded-md p-5"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">Colaboradores</p>
            <p className="text-3xl font-mono font-black text-white">{teamOverview?.total_colaboradores || 0}</p>
            <p className="text-xs text-neutral-500 mt-1">{teamOverview?.engagement_rate || 0}% engajados</p>
          </motion.div>

          {/* Alertas Criticos (24h) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="border border-rose-500/20 bg-rose-500/5 rounded-md p-5"
            data-testid="critical-alerts"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">Criticos 24h</p>
            <p className="text-3xl font-mono font-black text-rose-500">{stressMetrics?.critical_alerts || 0}</p>
            <p className="text-xs text-neutral-500 mt-1">Alertas estresse alto</p>
          </motion.div>

          {/* Pico */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="border border-white/10 bg-neutral-900/60 rounded-md p-5"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">Pico Estresse</p>
            <p className="text-3xl font-mono font-black text-purple-400">{stressMetrics?.peak_stress_time || 'N/A'}</p>
            <p className="text-xs text-neutral-500 mt-1">Horario critico</p>
          </motion.div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* V-Score Trend (7d) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="lg:col-span-2 border border-white/10 bg-neutral-900/60 rounded-md p-6"
            data-testid="vscore-trend-chart"
          >
            <div className="flex items-center gap-2 mb-4">
              {teamOverview?.avg_v_score >= 60 ? (
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-rose-400" />
              )}
              <h3 className="text-sm font-bold text-white">Tendencia V-Score (7 dias)</h3>
            </div>
            <div className="w-full h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={teamOverview?.trend_7d || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" style={{ fontSize: '10px' }}
                    tickFormatter={(v) => v.slice(5)}
                  />
                  <YAxis domain={[0, 100]} stroke="rgba(255,255,255,0.3)" style={{ fontSize: '10px' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#171717', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px' }}
                    labelStyle={{ color: '#fff', fontSize: '12px' }}
                    formatter={(v) => [`${v}`, 'V-Score Medio']}
                  />
                  <Line type="monotone" dataKey="avg_v_score" stroke="#22d3ee" strokeWidth={2} dot={{ fill: '#22d3ee', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Distribution Pie */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="border border-white/10 bg-neutral-900/60 rounded-md p-6"
            data-testid="distribution-chart"
          >
            <h3 className="text-sm font-bold text-white mb-4">Distribuicao de Status</h3>
            {pieData.length > 0 ? (
              <div className="w-full h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" />
                    <Tooltip contentStyle={{ backgroundColor: '#171717', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-neutral-500 text-sm text-center py-16">Sem dados</p>
            )}
            <div className="flex justify-around mt-2">
              {pieData.map(d => (
                <div key={d.name} className="text-center">
                  <span className="text-lg font-mono font-bold" style={{ color: d.fill }}>{d.value}</span>
                  <p className="text-xs text-neutral-500">{d.name}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Stress Distribution (24h) */}
        {stressMetrics && stressMetrics.stress_distribution.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="border border-white/10 bg-neutral-900/60 rounded-md p-6 mb-8"
            data-testid="stress-hourly-chart"
          >
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Estresse por Horario (24h)</h3>
            </div>
            <div className="w-full h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stressMetrics.stress_distribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="hour" stroke="rgba(255,255,255,0.3)" style={{ fontSize: '10px' }} />
                  <YAxis domain={[0, 100]} stroke="rgba(255,255,255,0.3)" style={{ fontSize: '10px' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#171717', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px' }}
                    formatter={(v) => [`${v}`, 'Nivel Estresse']}
                  />
                  <Bar dataKey="avg_stress_level" radius={[4, 4, 0, 0]}>
                    {stressMetrics.stress_distribution.map((entry, i) => (
                      <Cell key={i} fill={getStressColor(entry.avg_stress_level)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* LGPD Notice */}
        <div className="border border-white/5 bg-neutral-900/40 rounded-md p-4 flex items-center gap-3">
          <Shield className="w-4 h-4 text-neutral-500 flex-shrink-0" />
          <p className="text-xs text-neutral-500">
            Dados 100% anonimizados conforme LGPD. Nenhum colaborador individual e identificado. Metricas agregadas para conformidade com a Lei 14.831/2024 (Saude Mental no Trabalho).
          </p>
        </div>
      </div>
      {/* End desktop content */}
    </div>
  );
};

export default GestorDashboard;

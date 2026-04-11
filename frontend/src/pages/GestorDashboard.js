import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';
import {
  TrendingUp, TrendingDown, Activity, Shield, Download,
  BarChart3, UserPlus, X, Calendar
} from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const PERIODS = [
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "6m", label: "6 meses" },
];

const GestorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stressMetrics, setStressMetrics] = useState(null);
  const [teamOverview, setTeamOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("7d");
  const [setor, setSetor] = useState("");
  const [setores, setSetores] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ nome: "", email: "", setor: "Operacional", cargo: "", nivel_acesso: "User" });
  const [addLoading, setAddLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const [heatmapData, setHeatmapData] = useState(null);

  useEffect(() => {
    if (user && user.nivel_acesso !== 'Gestor') {
      navigate('/');
      return;
    }
    fetchSetores();
    fetchAllMetrics();
    fetchHeatmap();
  }, [user, navigate, period, setor]);

  const fetchSetores = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/dashboard/setores`, { withCredentials: true });
      setSetores(data.setores || []);
    } catch (err) {}
  };

  const fetchHeatmap = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/dashboard/heatmap?period=${period}`, { withCredentials: true });
      setHeatmapData(data);
    } catch (err) {}
  };

  const fetchAllMetrics = async () => {
    setLoading(true);
    try {
      const [stressRes, overviewRes] = await Promise.all([
        axios.get(`${API_URL}/api/dashboard/team-stress`, { withCredentials: true }),
        axios.get(`${API_URL}/api/dashboard/team-overview?period=${period}&setor=${setor}`, { withCredentials: true })
      ]);
      setStressMetrics(stressRes.data);
      setTeamOverview(overviewRes.data);
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error("Acesso negado.");
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    setPdfLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/dashboard/export-pdf?period=${period}`, {
        withCredentials: true,
        responseType: 'blob'
      });
      const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `vitalflow_relatorio_${period}_${new Date().toISOString().split('T')[0]}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Relatorio PDF exportado!');
    } catch (error) {
      toast.error('Erro ao exportar relatorio.');
    } finally {
      setPdfLoading(false);
    }
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    if (!addForm.nome || !addForm.email) {
      toast.error("Nome e email sao obrigatorios.");
      return;
    }
    setAddLoading(true);
    try {
      const { data } = await axios.post(`${API_URL}/api/dashboard/add-employee`, addForm, { withCredentials: true });
      toast.success(`${data.nome} cadastrado! Senha temporaria: ${data.temp_password}`, { duration: 10000 });
      setShowAddModal(false);
      setAddForm({ nome: "", email: "", setor: "Operacional", cargo: "", nivel_acesso: "User" });
      fetchAllMetrics();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao cadastrar.");
    } finally {
      setAddLoading(false);
    }
  };

  const getStressColor = (level) => level >= 80 ? '#f43f5e' : level >= 50 ? '#fbbf24' : '#34d399';
  const getVScoreColor = (score) => score >= 80 ? '#34d399' : score >= 50 ? '#fbbf24' : '#f43f5e';

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
        {/* Header with actions */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-white font-heading mb-1" data-testid="gestor-title">
              Painel do Gestor
            </h1>
            <p className="text-neutral-400 text-sm">Visao agregada - dados anonimizados (LGPD)</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              data-testid="add-employee-btn"
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-bold rounded-md transition-all"
            >
              <UserPlus className="w-4 h-4" />
              Adicionar Funcionario
            </button>
            <button
              onClick={handleExportPDF}
              disabled={pdfLoading}
              data-testid="export-pdf-btn"
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black text-sm font-bold rounded-md transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {pdfLoading ? "Gerando..." : "Exportar PDF"}
            </button>
          </div>
        </div>

        {/* Filters Row: Period + Setor */}
        <div className="flex flex-wrap items-center gap-4 mb-6" data-testid="filters-row">
          {/* Period Filter */}
          <div className="flex items-center gap-2" data-testid="period-filter">
            <Calendar className="w-4 h-4 text-neutral-500" />
            <span className="text-xs text-neutral-500 mr-1">Periodo:</span>
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                data-testid={`period-${p.value}`}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  period === p.value
                    ? "bg-cyan-500 text-black"
                    : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Separator */}
          <div className="w-px h-6 bg-white/10 hidden sm:block" />

          {/* Setor Filter */}
          <div className="flex items-center gap-2" data-testid="setor-filter">
            <Shield className="w-4 h-4 text-neutral-500" />
            <span className="text-xs text-neutral-500 mr-1">Setor:</span>
            <select
              value={setor}
              onChange={(e) => setSetor(e.target.value)}
              data-testid="setor-select"
              className="px-3 py-1.5 text-xs font-semibold rounded-md bg-neutral-800 text-neutral-300 border border-white/10 focus:outline-none focus:border-cyan-500 transition-all cursor-pointer"
            >
              <option value="">Todos os Setores</option>
              {setores.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {setor && (
              <button
                onClick={() => setSetor("")}
                data-testid="clear-setor-filter"
                className="px-2 py-1 text-[10px] font-bold rounded bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-all"
              >
                Limpar
              </button>
            )}
          </div>
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
              <p className="text-sm font-bold text-rose-400">Lei 14.831 - Intervencao Necessaria</p>
              <p className="text-xs text-neutral-300 mt-1">
                {teamOverview.lei_14831_alerts} colaborador(es) com V-Score medio abaixo de 50. A legislacao exige acao preventiva de saude mental.
              </p>
            </div>
          </motion.div>
        )}

        {/* Top Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="border border-white/10 bg-neutral-900/60 rounded-md p-5" data-testid="team-vscore">
            <p className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">V-Score Time</p>
            <p className="text-3xl font-mono font-black" style={{ color: getVScoreColor(teamOverview?.avg_v_score || 0) }}>
              {teamOverview?.avg_v_score || 0}
            </p>
            <p className="text-xs text-neutral-500 mt-1">Media agregada</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="border border-white/10 bg-neutral-900/60 rounded-md p-5" data-testid="team-stress">
            <p className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">Estresse Medio</p>
            <p className="text-3xl font-mono font-black" style={{ color: getStressColor(teamOverview?.avg_stress_level || 0) }}>
              {teamOverview?.avg_stress_level || 0}
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="border border-white/10 bg-neutral-900/60 rounded-md p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">Colaboradores</p>
            <p className="text-3xl font-mono font-black text-white">{teamOverview?.total_colaboradores || 0}</p>
            <p className="text-xs text-neutral-500 mt-1">{teamOverview?.engagement_rate || 0}% engajados</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="border border-rose-500/20 bg-rose-500/5 rounded-md p-5" data-testid="critical-alerts">
            <p className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">Criticos 24h</p>
            <p className="text-3xl font-mono font-black text-rose-500">{stressMetrics?.critical_alerts || 0}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="border border-white/10 bg-neutral-900/60 rounded-md p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">Pico Estresse</p>
            <p className="text-3xl font-mono font-black text-purple-400">{stressMetrics?.peak_stress_time || 'N/A'}</p>
          </motion.div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="lg:col-span-2 border border-white/10 bg-neutral-900/60 rounded-md p-6" data-testid="vscore-trend-chart">
            <div className="flex items-center gap-2 mb-4">
              {teamOverview?.avg_v_score >= 60
                ? <TrendingUp className="w-4 h-4 text-emerald-400" />
                : <TrendingDown className="w-4 h-4 text-rose-400" />}
              <h3 className="text-sm font-bold text-white">Tendencia V-Score ({PERIODS.find(p => p.value === period)?.label})</h3>
            </div>
            <div className="w-full h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={teamOverview?.trend_7d || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" style={{ fontSize: '10px' }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis domain={[0, 100]} stroke="rgba(255,255,255,0.3)" style={{ fontSize: '10px' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#171717', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px' }}
                    labelStyle={{ color: '#fff', fontSize: '12px' }} formatter={(v) => [`${v}`, 'V-Score Medio']} />
                  <Line type="monotone" dataKey="avg_v_score" stroke="#22d3ee" strokeWidth={2} dot={{ fill: '#22d3ee', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="border border-white/10 bg-neutral-900/60 rounded-md p-6" data-testid="distribution-chart">
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

        {/* Stress by hour */}
        {stressMetrics && stressMetrics.stress_distribution.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="border border-white/10 bg-neutral-900/60 rounded-md p-6 mb-8" data-testid="stress-hourly-chart">
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
                  <Tooltip contentStyle={{ backgroundColor: '#171717', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px' }}
                    formatter={(v) => [`${v}`, 'Nivel Estresse']} />
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

        {/* Stress Heatmap by Sector */}
        {heatmapData && heatmapData.hourly_heatmap?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="border border-white/10 bg-neutral-900/60 rounded-md p-6 mb-8" data-testid="stress-heatmap">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-orange-400" />
                <h3 className="text-sm font-bold text-white">Mapa de Calor - Estresse por Setor</h3>
              </div>
              {heatmapData.peak_stress?.setor !== "N/A" && (
                <span className="text-[10px] px-2 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full font-bold" data-testid="peak-stress-badge">
                  Pico: {heatmapData.peak_stress.setor} as {heatmapData.peak_stress.hour} ({heatmapData.peak_stress.stress}%)
                </span>
              )}
            </div>

            {/* Heatmap Grid */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left text-[10px] text-neutral-500 uppercase tracking-wider px-2 py-1 w-24">Setor</th>
                    {heatmapData.hours?.map(h => (
                      <th key={h} className="text-center text-[10px] text-neutral-500 px-1 py-1 font-mono">{h.slice(0, 2)}h</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {heatmapData.hourly_heatmap.map((row) => (
                    <tr key={row.setor}>
                      <td className="text-[11px] text-neutral-300 font-medium px-2 py-1 whitespace-nowrap">{row.setor}</td>
                      {heatmapData.hours?.map(h => {
                        const cell = row.hours?.[h] || { avg_stress: 0, count: 0 };
                        const intensity = Math.min(cell.avg_stress / 80, 1);
                        const bg = cell.count === 0
                          ? "rgba(255,255,255,0.02)"
                          : cell.avg_stress > 60 ? `rgba(239,68,68,${0.15 + intensity * 0.6})`
                          : cell.avg_stress > 35 ? `rgba(251,191,36,${0.1 + intensity * 0.4})`
                          : `rgba(34,211,238,${0.05 + intensity * 0.2})`;
                        return (
                          <td key={h} className="p-0.5">
                            <div
                              className="w-full h-7 rounded-sm flex items-center justify-center text-[9px] font-mono font-bold transition-all hover:scale-110 cursor-default"
                              style={{ backgroundColor: bg, color: cell.count > 0 ? (cell.avg_stress > 60 ? '#fca5a5' : cell.avg_stress > 35 ? '#fcd34d' : '#67e8f9') : 'transparent' }}
                              title={`${row.setor} ${h}: Estresse ${cell.avg_stress}% (${cell.count} leituras)`}
                            >
                              {cell.count > 0 ? cell.avg_stress : ""}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-3 justify-end">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'rgba(34,211,238,0.2)' }} />
                <span className="text-[10px] text-neutral-500">Baixo</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'rgba(251,191,36,0.4)' }} />
                <span className="text-[10px] text-neutral-500">Moderado</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'rgba(239,68,68,0.6)' }} />
                <span className="text-[10px] text-neutral-500">Alto</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* LGPD Notice */}
        <div className="border border-white/5 bg-neutral-900/40 rounded-md p-4 flex items-center gap-3">
          <Shield className="w-4 h-4 text-neutral-500 flex-shrink-0" />
          <p className="text-xs text-neutral-500">
            Dados 100% anonimizados conforme LGPD. Conformidade com a Lei 14.831/2024 (Saude Mental no Trabalho).
          </p>
        </div>
      </div>

      {/* Add Employee Modal */}
      <AnimatePresence>
        {showAddModal && (
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
              className="bg-neutral-900 border border-white/10 rounded-md p-6 w-full max-w-md mx-4"
              data-testid="add-employee-modal"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white">Adicionar Funcionario</h3>
                <button onClick={() => setShowAddModal(false)} className="text-neutral-500 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddEmployee} className="space-y-4">
                <div>
                  <label className="text-xs text-neutral-400 font-medium block mb-1">Nome completo *</label>
                  <input
                    type="text"
                    value={addForm.nome}
                    onChange={(e) => setAddForm({ ...addForm, nome: e.target.value })}
                    placeholder="Ex: Maria Silva"
                    data-testid="employee-name-input"
                    className="w-full px-3 py-2.5 bg-neutral-800 border border-white/10 rounded-md text-white text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-400 font-medium block mb-1">Email corporativo *</label>
                  <input
                    type="email"
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    placeholder="Ex: maria@empresa.com.br"
                    data-testid="employee-email-input"
                    className="w-full px-3 py-2.5 bg-neutral-800 border border-white/10 rounded-md text-white text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-neutral-400 font-medium block mb-1">Setor</label>
                    <select
                      value={addForm.setor}
                      onChange={(e) => setAddForm({ ...addForm, setor: e.target.value })}
                      data-testid="employee-setor-select"
                      className="w-full px-3 py-2.5 bg-neutral-800 border border-white/10 rounded-md text-white text-sm focus:outline-none focus:border-cyan-500"
                    >
                      <option value="Operacional">Operacional</option>
                      <option value="Administrativo">Administrativo</option>
                      <option value="SAC">SAC</option>
                      <option value="Logistica">Logistica</option>
                      <option value="TI">TI</option>
                      <option value="RH">RH</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-neutral-400 font-medium block mb-1">Cargo</label>
                    <input
                      type="text"
                      value={addForm.cargo}
                      onChange={(e) => setAddForm({ ...addForm, cargo: e.target.value })}
                      placeholder="Ex: Analista"
                      data-testid="employee-cargo-input"
                      className="w-full px-3 py-2.5 bg-neutral-800 border border-white/10 rounded-md text-white text-sm focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-neutral-400 font-medium block mb-1">Nivel de Acesso</label>
                  <select
                    value={addForm.nivel_acesso}
                    onChange={(e) => setAddForm({ ...addForm, nivel_acesso: e.target.value })}
                    data-testid="employee-nivel-select"
                    className="w-full px-3 py-2.5 bg-neutral-800 border border-white/10 rounded-md text-white text-sm focus:outline-none focus:border-cyan-500"
                  >
                    <option value="User">Colaborador (User)</option>
                    <option value="Gestor">Gestor (Admin)</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={addLoading}
                  data-testid="submit-employee-btn"
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-md transition-all disabled:opacity-50"
                >
                  {addLoading ? "Cadastrando..." : "Cadastrar Funcionario"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GestorDashboard;

import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import {
  FileText, Download, Calendar, TrendingUp, Activity, Lock,
  Radio, Smartphone, ArrowLeft
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const API = `${"https://vitalflow.ia.br"}/api`;

const PERIOD_OPTIONS = [
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "6m", label: "6 meses" },
];

const PIE_COLORS = ["#34d399", "#fbbf24", "#f43f5e"];

const MeuRelatorio = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [period, setPeriod] = useState("7d");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const canExportPdf = user?.account_type === "corporate" || user?.is_premium;

  useEffect(() => {
    fetchReport();
  }, [period]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/report/personal?period=${period}`, { withCredentials: true });
      setReport(data);
    } catch (err) {
      toast.error("Erro ao carregar relatorio.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportPdf = async () => {
    if (!canExportPdf) {
      toast.error("Recurso exclusivo do Plano Premium. Faca upgrade para exportar.");
      return;
    }
    setExporting(true);
    try {
      const response = await axios.get(`${API}/report/personal/export-pdf?period=${period}`, {
        withCredentials: true,
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `vitalflow_relatorio_${period}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("PDF exportado com sucesso!");
    } catch (err) {
      const msg = err.response?.status === 403
        ? "Recurso exclusivo do Plano Premium."
        : "Erro ao exportar PDF.";
      toast.error(msg);
    } finally {
      setExporting(false);
    }
  };

  const pieData = report ? [
    { name: "Verde", value: report.distribution.verde },
    { name: "Amarelo", value: report.distribution.amarelo },
    { name: "Vermelho", value: report.distribution.vermelho },
  ].filter(d => d.value > 0) : [];

  const hasData = report && report.total_analyses > 0;

  return (
    <div className="min-h-screen bg-neutral-950">
      <Navbar />

      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors mb-3"
              data-testid="back-to-dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </button>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-white" data-testid="report-title">
              Meu Relatorio
            </h1>
            <p className="text-neutral-400 text-sm mt-1">
              Visao consolidada da sua saude e bem-estar
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Period Filter */}
            <div className="flex bg-neutral-900 rounded-lg border border-white/10 p-1" data-testid="period-filter">
              {PERIOD_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPeriod(opt.value)}
                  data-testid={`period-${opt.value}`}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    period === opt.value
                      ? "bg-cyan-500 text-black"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Export PDF */}
            <button
              onClick={handleExportPdf}
              disabled={exporting || !hasData}
              data-testid="export-pdf-btn"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                canExportPdf
                  ? "bg-cyan-500 hover:bg-cyan-400 text-black"
                  : "bg-neutral-800 text-neutral-500 border border-white/10"
              }`}
            >
              {canExportPdf ? (
                <>
                  <Download className="w-4 h-4" />
                  {exporting ? "Gerando..." : "Exportar PDF"}
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  PDF Premium
                </>
              )}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !hasData ? (
          /* Empty state */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20"
            data-testid="report-empty-state"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4"
            >
              <Radio className="w-8 h-8 text-cyan-400/60" />
            </motion.div>
            <p className="text-neutral-300 font-semibold text-base mb-1">Sem dados no periodo</p>
            <p className="text-neutral-500 text-sm text-center max-w-sm mb-4">
              Conecte um dispositivo e comece a monitorar para gerar seu relatorio personalizado.
            </p>
            <button
              onClick={() => navigate("/devices")}
              className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-sm font-semibold rounded-md transition-all"
              data-testid="report-connect-btn"
            >
              <Smartphone className="w-4 h-4" />
              Conectar dispositivo
            </button>
          </motion.div>
        ) : (
          /* Report Content */
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Premium upsell banner for free users */}
            {!canExportPdf && (
              <div className="border border-amber-500/30 bg-amber-500/5 rounded-md p-4 flex items-center justify-between" data-testid="pdf-premium-banner">
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-amber-400" />
                  <div>
                    <p className="text-sm font-semibold text-amber-400">Exportar PDF e exclusivo do Plano Premium</p>
                    <p className="text-xs text-neutral-400">Faca upgrade para baixar seus relatorios completos</p>
                  </div>
                </div>
              </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Analises", value: report.total_analyses, icon: FileText, color: "text-cyan-400" },
                { label: "V-Score Medio", value: report.avg_v_score, icon: Activity, color: report.avg_v_score >= 80 ? "text-emerald-400" : report.avg_v_score >= 50 ? "text-amber-400" : "text-rose-400" },
                { label: "Dias com Dados", value: report.trend.length, icon: Calendar, color: "text-purple-400" },
                { label: "Tendencia", value: report.trend.length >= 2 ? (report.trend[report.trend.length-1].avg_v_score > report.trend[0].avg_v_score ? "Subindo" : report.trend[report.trend.length-1].avg_v_score < report.trend[0].avg_v_score ? "Caindo" : "Estavel") : "-", icon: TrendingUp, color: "text-blue-400" },
              ].map((kpi) => (
                <motion.div
                  key={kpi.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-white/10 bg-neutral-900/40 backdrop-blur-xl rounded-md p-4"
                  data-testid={`kpi-${kpi.label.toLowerCase().replace(/ /g, '-')}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                    <span className="text-xs text-neutral-500 uppercase tracking-wider">{kpi.label}</span>
                  </div>
                  <p className={`text-2xl font-mono font-black ${kpi.color}`}>{kpi.value}</p>
                </motion.div>
              ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* V-Score Trend Chart */}
              <div className="lg:col-span-2 border border-white/10 bg-neutral-900/40 backdrop-blur-xl rounded-md p-6" data-testid="trend-chart">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  Evolucao do V-Score
                </h3>
                <div className="w-full h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={report.trend}>
                      <defs>
                        <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" style={{ fontSize: "11px" }} />
                      <YAxis domain={[0, 100]} stroke="rgba(255,255,255,0.3)" style={{ fontSize: "11px" }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#171717", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" }}
                        labelStyle={{ color: "#999" }}
                        itemStyle={{ color: "#22d3ee" }}
                      />
                      <Area type="monotone" dataKey="avg_v_score" stroke="#22d3ee" strokeWidth={2} fill="url(#trendGrad)" name="V-Score" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Distribution Pie */}
              <div className="border border-white/10 bg-neutral-900/40 backdrop-blur-xl rounded-md p-6" data-testid="distribution-chart">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400 mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  Distribuicao
                </h3>
                <div className="w-full h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        innerRadius={50}
                        outerRadius={80}
                        dataKey="value"
                        stroke="none"
                      >
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: "#171717", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 mt-2">
                  {[
                    { color: "bg-emerald-400", label: `Verde (${report.distribution.verde})` },
                    { color: "bg-amber-400", label: `Amarelo (${report.distribution.amarelo})` },
                    { color: "bg-rose-400", label: `Vermelho (${report.distribution.vermelho})` },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${item.color}`} />
                      <span className="text-[10px] text-neutral-400">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Areas Bar Chart */}
            {report.top_areas.length > 0 && (
              <div className="border border-white/10 bg-neutral-900/40 backdrop-blur-xl rounded-md p-6" data-testid="areas-chart">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400 mb-4">
                  Areas Mais Afetadas
                </h3>
                <div className="w-full h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={report.top_areas} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis type="number" stroke="rgba(255,255,255,0.3)" style={{ fontSize: "11px" }} />
                      <YAxis dataKey="area" type="category" stroke="rgba(255,255,255,0.3)" width={120} style={{ fontSize: "11px" }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#171717", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" }}
                      />
                      <Bar dataKey="count" fill="#a78bfa" radius={[0, 4, 4, 0]} name="Ocorrencias" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MeuRelatorio;

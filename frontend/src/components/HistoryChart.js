import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Radio, Smartphone } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const HistoryChart = ({ history }) => {
  const navigate = useNavigate();

  // Awaiting sync state
  if (!history || history.length === 0) {
    return (
      <div
        className="border border-white/10 bg-neutral-900/40 backdrop-blur-xl rounded-md p-6"
        data-testid="history-chart-empty"
      >
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">
            HISTORICO V-SCORE
          </h3>
        </div>

        <div className="w-full h-64 flex flex-col items-center justify-center" data-testid="awaiting-sync-state">
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="w-14 h-14 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4"
          >
            <Radio className="w-7 h-7 text-cyan-400/60" />
          </motion.div>

          <p className="text-neutral-300 font-semibold text-sm mb-1">
            Aguardando sincronizacao
          </p>
          <p className="text-neutral-500 text-xs text-center max-w-xs mb-4">
            Conecte um dispositivo wearable para que seus dados biometricos aparecam aqui em tempo real.
          </p>

          <button
            onClick={() => navigate('/devices')}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-xs font-semibold rounded-md transition-all"
            data-testid="chart-connect-device-btn"
          >
            <Smartphone className="w-3.5 h-3.5" />
            Conectar dispositivo
          </button>
        </div>
      </div>
    );
  }

  // Prepare data for chart (reverse to show oldest first)
  const chartData = [...history].reverse().map((item, index) => ({
    index: index + 1,
    score: item.v_score,
    date: new Date(item.timestamp).toLocaleDateString('pt-BR', {
      month: 'short',
      day: 'numeric'
    }),
    status: item.status_visual
  }));

  // Get latest status for color
  const latestStatus = history[0]?.status_visual || "Verde";

  const getStatusColor = (status) => {
    switch (status) {
      case "Verde":
        return { stroke: "#34d399", fill: "#34d399" };
      case "Amarelo":
        return { stroke: "#fbbf24", fill: "#fbbf24" };
      case "Vermelho":
        return { stroke: "#f43f5e", fill: "#f43f5e" };
      default:
        return { stroke: "#22d3ee", fill: "#22d3ee" };
    }
  };

  const colors = getStatusColor(latestStatus);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-neutral-900 border border-white/20 rounded-md p-3 shadow-xl">
          <p className="text-white font-mono font-bold text-lg">{payload[0].value}</p>
          <p className="text-neutral-400 text-xs">{payload[0].payload.date}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className="border border-white/10 bg-neutral-900/40 backdrop-blur-xl rounded-md p-6"
      data-testid="history-chart"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-cyan-400" />
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">
          HISTORICO V-SCORE ({history.length} analises)
        </h3>
      </div>

      {/* Chart */}
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.fill} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={colors.fill} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="date"
              stroke="rgba(255,255,255,0.3)"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              domain={[0, 100]}
              stroke="rgba(255,255,255,0.3)"
              style={{ fontSize: '12px' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="score"
              stroke={colors.stroke}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorScore)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default HistoryChart;

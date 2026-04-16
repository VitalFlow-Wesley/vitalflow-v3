import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Radio,
  Activity,
  AlertTriangle,
} from "lucide-react";
import { motion } from "framer-motion";

const HistoryChart = ({ history }) => {
  const safeHistory = Array.isArray(history) ? history : [];

  if (safeHistory.length === 0) {
    return (
      <div
        className="border border-white/10 bg-neutral-900/40 backdrop-blur-xl rounded-2xl p-6"
        data-testid="history-chart-empty"
      >
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
              Tendência
            </h3>
            <p className="text-sm text-neutral-500 mt-1">
              Evolução do V-Score
            </p>
          </div>
        </div>

        <div
          className="w-full h-[420px] flex flex-col items-center justify-center text-center"
          data-testid="awaiting-sync-state"
        >
          <motion.div
            animate={{ scale: [1, 1.12, 1], opacity: [0.45, 1, 0.45] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-5"
          >
            <Radio className="w-8 h-8 text-cyan-400/70" />
          </motion.div>

          <p className="text-neutral-200 font-semibold text-base mb-2">
            Aguardando histórico
          </p>
          <p className="text-neutral-500 text-sm max-w-md leading-6">
            Assim que novas sincronizações forem concluídas, o VitalFlow vai
            exibir a evolução do seu V-Score e identificar se seu padrão está
            melhorando, estável ou em queda.
          </p>
        </div>
      </div>
    );
  }

  const orderedHistory = [...safeHistory]
    .filter(Boolean)
    .sort((a, b) => {
      const ta = a?.timestamp ? new Date(a.timestamp).getTime() : 0;
      const tb = b?.timestamp ? new Date(b.timestamp).getTime() : 0;
      return ta - tb;
    });

  const chartData = orderedHistory.map((item, index) => ({
    index: index + 1,
    score: Number(item?.v_score ?? 0),
    date: item?.timestamp
      ? new Date(item.timestamp).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "short",
        })
      : `#${index + 1}`,
    status: item?.status_visual || "Sem status",
    raw: item,
  }));

  const latest = orderedHistory[orderedHistory.length - 1];
  const first = orderedHistory[0];

  const latestScore = Number(latest?.v_score ?? 0);
  const firstScore = Number(first?.v_score ?? 0);

  const avgScore =
    chartData.length > 0
      ? Math.round(
          chartData.reduce((acc, item) => acc + item.score, 0) / chartData.length
        )
      : 0;

  const maxScore =
    chartData.length > 0
      ? Math.max(...chartData.map((item) => item.score))
      : 0;

  const minScore =
    chartData.length > 0
      ? Math.min(...chartData.map((item) => item.score))
      : 0;

  const delta = latestScore - firstScore;

  const getTrendMeta = () => {
    if (chartData.length < 2) {
      return {
        label: "Leitura inicial",
        icon: Minus,
        color: "text-neutral-400",
        description:
          "Ainda não há pontos suficientes para identificar tendência.",
      };
    }

    const rawStatus = String(latest?.status_visual || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    const isCritical =
      rawStatus.includes("critico") ||
      rawStatus.includes("vermelho") ||
      rawStatus.includes("urgente") ||
      latestScore < 50;

    const isWarning =
      rawStatus.includes("atencao") ||
      rawStatus.includes("amarelo") ||
      rawStatus.includes("stress") ||
      rawStatus.includes("alerta") ||
      (latestScore >= 50 && latestScore < 80);

    if (isCritical) {
      return {
        label: "Crítico",
        icon: AlertTriangle,
        color: "text-rose-400",
        description:
          delta >= 0
            ? "Seu padrão está estável, porém em nível crítico. Ação imediata recomendada."
            : "Seu padrão recente mostra queda em estado crítico. Priorize recuperação imediata.",
      };
    }

    if (isWarning) {
      return {
        label:
          delta > 3
            ? "Melhora sob atenção"
            : delta < -3
            ? "Queda sob atenção"
            : "Estável sob atenção",
        icon:
          delta > 3
            ? TrendingUp
            : delta < -3
            ? TrendingDown
            : Minus,
        color: "text-amber-300",
        description:
          delta > 3
            ? "Há sinais de recuperação, mas ainda exige atenção."
            : delta < -3
            ? "Seu padrão está piorando. Ajustes são recomendados."
            : "Seu comportamento está constante, porém ainda requer atenção.",
      };
    }

    if (delta > 3) {
      return {
        label: "Melhora",
        icon: TrendingUp,
        color: "text-emerald-400",
        description: "Seu padrão recente mostra evolução positiva.",
      };
    }

    if (delta < -3) {
      return {
        label: "Queda",
        icon: TrendingDown,
        color: "text-rose-400",
        description: "Seu padrão recente mostra redução de resiliência.",
      };
    }

    return {
      label: "Estável",
      icon: Minus,
      color: "text-emerald-300",
      description: "Seu comportamento recente está equilibrado.",
    };
  };

  const trend = getTrendMeta();
  const TrendIcon = trend.icon;

  const getAreaColor = () => {
    const rawStatus = String(latest?.status_visual || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    if (
      rawStatus.includes("vermelho") ||
      rawStatus.includes("critico") ||
      rawStatus.includes("urgente") ||
      latestScore < 50
    ) {
      return {
        stroke: "#f43f5e",
        fillStart: 0.28,
        fillEnd: 0.02,
      };
    }

    if (
      rawStatus.includes("amarelo") ||
      rawStatus.includes("atencao") ||
      rawStatus.includes("stress") ||
      rawStatus.includes("alerta") ||
      (latestScore >= 50 && latestScore < 80)
    ) {
      return {
        stroke: "#fbbf24",
        fillStart: 0.28,
        fillEnd: 0.02,
      };
    }

    return {
      stroke: "#34d399",
      fillStart: 0.35,
      fillEnd: 0.02,
    };
  };

  const color = getAreaColor();

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;

    const point = payload[0]?.payload;
    return (
      <div className="bg-neutral-900 border border-white/15 rounded-xl p-3 shadow-2xl">
        <p className="text-white font-mono font-bold text-lg leading-none">
          {point?.score}
        </p>
        <p className="text-neutral-400 text-xs mt-2">{point?.date}</p>
        <p className="text-cyan-300 text-xs mt-1">
          {point?.status || "Sem status"}
        </p>
      </div>
    );
  };

  return (
    <div
      className="border border-white/10 bg-neutral-900/40 backdrop-blur-xl rounded-2xl p-6"
      data-testid="history-chart"
    >
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
              Tendência
            </h3>
            <p className="text-lg font-bold text-white mt-1">
              Evolução do V-Score
            </p>
          </div>
        </div>

        <div className={`flex items-start gap-2 ${trend.color}`}>
          <TrendIcon className="w-4 h-4 mt-0.5" />
          <div>
            <p className="text-sm font-semibold">{trend.label}</p>
            <p className="text-xs text-neutral-500 mt-1 max-w-xs">
              {trend.description}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <SummaryCard
          icon={<Activity className="w-4 h-4 text-cyan-300" />}
          label="Média"
          value={avgScore}
          valueColor="text-cyan-300"
        />
        <SummaryCard
          icon={<TrendingUp className="w-4 h-4 text-emerald-300" />}
          label="Máximo"
          value={maxScore}
          valueColor="text-emerald-300"
        />
        <SummaryCard
          icon={<AlertTriangle className="w-4 h-4 text-rose-300" />}
          label="Mínimo"
          value={minScore}
          valueColor="text-rose-300"
        />
        <SummaryCard
          icon={<Minus className="w-4 h-4 text-yellow-300" />}
          label="Variação"
          value={delta > 0 ? `+${delta}` : delta}
          valueColor={
            delta > 3
              ? "text-emerald-300"
              : delta < -3
              ? "text-rose-300"
              : "text-yellow-300"
          }
        />
      </div>

      <div className="w-full h-[440px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 12, left: -12, bottom: 0 }}
          >
            <defs>
              <linearGradient id="vscoreFill" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={color.stroke}
                  stopOpacity={color.fillStart}
                />
                <stop
                  offset="95%"
                  stopColor={color.stroke}
                  stopOpacity={color.fillEnd}
                />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
            />

            <XAxis
              dataKey="date"
              stroke="rgba(255,255,255,0.25)"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />

            <YAxis
              domain={[0, 100]}
              stroke="rgba(255,255,255,0.25)"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />

            <ReferenceLine
              y={80}
              stroke="rgba(52, 211, 153, 0.2)"
              strokeDasharray="4 4"
            />
            <ReferenceLine
              y={50}
              stroke="rgba(251, 191, 36, 0.18)"
              strokeDasharray="4 4"
            />

            <Tooltip content={<CustomTooltip />} />

            <Area
              type="monotone"
              dataKey="score"
              stroke={color.stroke}
              strokeWidth={3}
              fill="url(#vscoreFill)"
              dot={{
                r: 4,
                strokeWidth: 2,
                fill: color.stroke,
                stroke: "rgba(10,10,10,0.9)",
              }}
              activeDot={{
                r: 6,
                strokeWidth: 2,
                fill: color.stroke,
                stroke: "#fff",
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

function SummaryCard({ icon, label, value, valueColor }) {
  return (
    <div className="bg-neutral-900/60 border border-white/5 rounded-xl p-3">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <p className="text-[10px] text-neutral-500 uppercase tracking-[0.14em]">
          {label}
        </p>
      </div>
      <p className={`text-xl font-mono font-bold ${valueColor}`}>{value}</p>
    </div>
  );
}

export default HistoryChart;
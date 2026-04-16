import { ArrowLeft, BarChart3, Users, TrendingUp, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const card =
  "border border-white/10 bg-neutral-900/60 backdrop-blur-xl rounded-2xl p-5";

export default function RelatorioExecutivo() {
  const navigate = useNavigate();

  return (
    <div className="p-6 md:p-8 flex-1 overflow-y-auto text-white bg-black">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate("/gestor/relatorios")}
          className="w-10 h-10 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div>
          <h1 className="text-3xl font-black tracking-tight">
            Relatório Executivo
          </h1>
          <p className="text-neutral-400 mt-1">
            Visão estratégica consolidada da organização
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <ExecCard
          icon={<BarChart3 className="w-5 h-5 text-cyan-300" />}
          title="V-Score Médio"
          value="78"
          valueColor="text-cyan-300"
        />
        <ExecCard
          icon={<Users className="w-5 h-5 text-purple-300" />}
          title="Colaboradores"
          value="124"
          valueColor="text-purple-300"
        />
        <ExecCard
          icon={<TrendingUp className="w-5 h-5 text-emerald-300" />}
          title="Saudáveis"
          value="92%"
          valueColor="text-emerald-300"
        />
        <ExecCard
          icon={<AlertTriangle className="w-5 h-5 text-rose-300" />}
          title="Críticos"
          value="8%"
          valueColor="text-rose-300"
        />
      </div>

      <div className={`${card} mb-6`}>
        <div className="text-sm text-neutral-400 mb-4">
          Resumo Executivo
        </div>
        <div className="text-neutral-300 leading-7 text-sm">
          Este relatório apresenta uma visão geral do estado atual da operação,
          com foco em saúde corporativa, engajamento, nível de risco e tendência
          de desempenho das equipes.
        </div>
      </div>

      <div className={card}>
        <div className="text-sm text-neutral-400 mb-4">
          Insights Estratégicos
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <InsightBox
            title="Ponto forte"
            text="A maioria da operação está em faixa saudável, indicando boa estabilidade geral."
          />
          <InsightBox
            title="Atenção"
            text="Existe um grupo em estado crítico que precisa de monitoramento preventivo imediato."
          />
          <InsightBox
            title="Tendência"
            text="O V-Score agregado indica estabilidade com possibilidade de crescimento."
          />
          <InsightBox
            title="Ação sugerida"
            text="Priorizar análise por setor e relatório de risco para decisões mais rápidas."
          />
        </div>
      </div>
    </div>
  );
}

function ExecCard({ icon, title, value, valueColor }) {
  return (
    <div className={card}>
      <div className="w-11 h-11 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center mb-4">
        {icon}
      </div>
      <div className="text-xs text-neutral-500 mb-2">{title}</div>
      <div className={`text-3xl font-mono font-bold ${valueColor}`}>{value}</div>
    </div>
  );
}

function InsightBox({ title, text }) {
  return (
    <div className="border border-white/10 bg-black/20 rounded-2xl p-4">
      <div className="text-sm font-bold text-white mb-2">{title}</div>
      <div className="text-sm text-neutral-400 leading-6">{text}</div>
    </div>
  );
}
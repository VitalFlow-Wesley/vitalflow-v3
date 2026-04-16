import {
  FileText,
  Users,
  AlertTriangle,
  Calendar,
  TrendingUp,
  BarChart3,
  Download,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const card =
  "border border-white/10 bg-neutral-900/60 backdrop-blur-xl rounded-2xl p-5 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all cursor-pointer";

export default function RelatoriosEquipe() {
  const navigate = useNavigate();

  return (
    <div className="p-6 md:p-8 flex-1 overflow-y-auto text-white bg-black">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">
            Relatórios de Equipe
          </h1>
          <p className="text-neutral-400 mt-2">
            Gere e exporte relatórios estratégicos da organização
          </p>
        </div>

        <button className="flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all font-semibold">
          <Download className="w-4 h-4" />
          Exportar PDF
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div
          className={card}
          onClick={() => navigate("/gestor/relatorios/executivo")}
        >
          <div className="flex items-center gap-3 mb-3">
            <BarChart3 className="text-cyan-400" />
            <h2 className="font-bold text-lg">Relatório Executivo</h2>
          </div>
          <p className="text-neutral-400 text-sm">
            Visão geral com V-score, risco, tendências e insights estratégicos
          </p>
        </div>

        <div
          className={card}
          onClick={() => navigate("/gestor/relatorios/setor")}
        >
          <div className="flex items-center gap-3 mb-3">
            <FileText className="text-cyan-400" />
            <h2 className="font-bold text-lg">Relatório por Setor</h2>
          </div>
          <p className="text-neutral-400 text-sm">
            Performance e engajamento por diretoria ou área
          </p>
        </div>

        <div
          className={card}
          onClick={() => navigate("/gestor/relatorios/equipe")}
        >
          <div className="flex items-center gap-3 mb-3">
            <Users className="text-purple-400" />
            <h2 className="font-bold text-lg">Relatório por Equipe</h2>
          </div>
          <p className="text-neutral-400 text-sm">
            Análise individual e coletiva das equipes
          </p>
        </div>

        <div
          className={card}
          onClick={() => navigate("/gestor/relatorios/risco")}
        >
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className="text-red-400" />
            <h2 className="font-bold text-lg text-red-400">
              Relatório de Risco
            </h2>
          </div>
          <p className="text-red-400 text-sm">
            Colaboradores críticos nas últimas 24h
          </p>
        </div>

        <div
          className={card}
          onClick={() => navigate("/gestor/relatorios/tendencia")}
        >
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp className="text-yellow-400" />
            <h2 className="font-bold text-lg">Relatório de Tendência</h2>
          </div>
          <p className="text-neutral-400 text-sm">
            Evolução do V-score e risco ao longo do tempo
          </p>
        </div>

        <div
          className={card}
          onClick={() => navigate("/gestor/relatorios/mensal")}
        >
          <div className="flex items-center gap-3 mb-3">
            <Calendar className="text-emerald-400" />
            <h2 className="font-bold text-lg">Relatório Mensal</h2>
          </div>
          <p className="text-neutral-400 text-sm">
            Consolidado LGPD com dados anonimizados
          </p>
        </div>
      </div>
    </div>
  );
}
import { ArrowLeft, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";

const card =
  "border border-white/10 bg-neutral-900/60 backdrop-blur-xl rounded-2xl p-5";

export default function RelatorioMensal() {
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
            Relatório Mensal
          </h1>
          <p className="text-neutral-400 mt-1">
            Consolidado LGPD com dados anonimizados
          </p>
        </div>
      </div>

      <div className={card}>
        <div className="flex items-center gap-2 text-neutral-300 mb-4">
          <Calendar className="w-4 h-4 text-emerald-300" />
          <span className="text-sm font-semibold">Resumo do mês</span>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <MonthlyBox title="V-Score Médio" value="79" color="text-cyan-300" />
          <MonthlyBox title="Engajamento" value="88%" color="text-emerald-300" />
          <MonthlyBox title="Críticos" value="6%" color="text-rose-300" />
        </div>
      </div>
    </div>
  );
}

function MonthlyBox({ title, value, color }) {
  return (
    <div className="border border-white/10 bg-black/20 rounded-2xl p-4">
      <div className="text-xs text-neutral-500 mb-2">{title}</div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
    </div>
  );
}
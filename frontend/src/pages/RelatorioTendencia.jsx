import { ArrowLeft, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

const card =
  "border border-white/10 bg-neutral-900/60 backdrop-blur-xl rounded-2xl p-5";

export default function RelatorioTendencia() {
  const navigate = useNavigate();

  const dados = [
    { periodo: "Semana 1", score: 72 },
    { periodo: "Semana 2", score: 74 },
    { periodo: "Semana 3", score: 76 },
    { periodo: "Semana 4", score: 78 },
  ];

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
            Relatório de Tendência
          </h1>
          <p className="text-neutral-400 mt-1">
            Evolução do V-Score e risco ao longo do tempo
          </p>
        </div>
      </div>

      <div className={`${card} mb-6`}>
        <div className="flex items-center gap-2 text-neutral-300 mb-4">
          <TrendingUp className="w-4 h-4 text-yellow-400" />
          <span className="text-sm font-semibold">Tendência das últimas semanas</span>
        </div>

        <div className="flex flex-col gap-3">
          {dados.map((item) => (
            <div
              key={item.periodo}
              className="flex items-center justify-between border border-white/10 rounded-xl px-4 py-3"
            >
              <span className="text-neutral-300">{item.periodo}</span>
              <span className="font-mono text-cyan-300 font-bold">{item.score}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={card}>
        <div className="text-sm text-neutral-400 mb-3">Leitura da tendência</div>
        <p className="text-sm text-neutral-300 leading-7">
          O comportamento atual sugere evolução positiva e consistente do score médio.
          Essa leitura ajuda a identificar melhora ou queda progressiva na saúde organizacional.
        </p>
      </div>
    </div>
  );
}
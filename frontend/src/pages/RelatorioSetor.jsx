import { ArrowLeft, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const card =
  "border border-white/10 bg-neutral-900/60 backdrop-blur-xl rounded-2xl p-5";

export default function RelatorioSetor() {
  const navigate = useNavigate();

  const setores = [
    { nome: "Operações", score: 81, stress: "Baixo" },
    { nome: "Qualidade", score: 77, stress: "Moderado" },
    { nome: "Suporte", score: 69, stress: "Moderado" },
    { nome: "Campo", score: 62, stress: "Alto" },
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
            Relatório por Setor
          </h1>
          <p className="text-neutral-400 mt-1">
            Performance e engajamento por diretoria ou área
          </p>
        </div>
      </div>

      <div className={card}>
        <div className="text-sm text-neutral-400 mb-4">
          Comparativo entre setores
        </div>

        <div className="flex flex-col gap-3">
          {setores.map((setor) => (
            <div
              key={setor.nome}
              className="border border-white/10 rounded-2xl p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-cyan-300" />
                <div>
                  <div className="font-semibold text-white">{setor.nome}</div>
                  <div className="text-xs text-neutral-500">Stress: {setor.stress}</div>
                </div>
              </div>

              <div className="font-mono font-bold text-cyan-300">{setor.score}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
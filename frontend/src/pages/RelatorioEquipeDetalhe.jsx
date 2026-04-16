import { ArrowLeft, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

const card =
  "border border-white/10 bg-neutral-900/60 backdrop-blur-xl rounded-2xl p-5";

export default function RelatorioEquipeDetalhe() {
  const navigate = useNavigate();

  const equipes = [
    { nome: "Equipe Alpha", score: 90, membros: 12 },
    { nome: "Equipe Beta", score: 85, membros: 10 },
    { nome: "Equipe Gamma", score: 80, membros: 9 },
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
            Relatório por Equipe
          </h1>
          <p className="text-neutral-400 mt-1">
            Análise individual e coletiva das equipes
          </p>
        </div>
      </div>

      <div className={card}>
        <div className="text-sm text-neutral-400 mb-4">
          Ranking das equipes
        </div>

        <div className="flex flex-col gap-3">
          {equipes.map((equipe) => (
            <div
              key={equipe.nome}
              className="border border-white/10 rounded-2xl p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-purple-300" />
                <div>
                  <div className="font-semibold text-white">{equipe.nome}</div>
                  <div className="text-xs text-neutral-500">
                    {equipe.membros} membros
                  </div>
                </div>
              </div>

              <div className="font-mono font-bold text-cyan-300">
                {equipe.score}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
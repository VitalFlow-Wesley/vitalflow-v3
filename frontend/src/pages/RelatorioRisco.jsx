import { ArrowLeft, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const card =
  "border border-red-500/20 bg-red-500/10 backdrop-blur-xl rounded-2xl p-5";

export default function RelatorioRisco() {
  const navigate = useNavigate();

  const riscos = [
    { nome: "Colaborador A", setor: "Campo", status: "Crítico" },
    { nome: "Colaborador B", setor: "Suporte", status: "Alerta" },
    { nome: "Colaborador C", setor: "Operações", status: "Crítico" },
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
          <h1 className="text-3xl font-black tracking-tight text-red-400">
            Relatório de Risco
          </h1>
          <p className="text-neutral-400 mt-1">
            Colaboradores críticos nas últimas 24h
          </p>
        </div>
      </div>

      <div className={card}>
        <div className="text-sm text-red-300 mb-4">
          Alertas prioritários
        </div>

        <div className="flex flex-col gap-3">
          {riscos.map((item) => (
            <div
              key={item.nome}
              className="border border-red-500/20 rounded-2xl p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-300" />
                <div>
                  <div className="font-semibold text-white">{item.nome}</div>
                  <div className="text-xs text-red-200/70">
                    {item.setor} · {item.status}
                  </div>
                </div>
              </div>

              <span className="text-red-300 font-semibold">{item.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
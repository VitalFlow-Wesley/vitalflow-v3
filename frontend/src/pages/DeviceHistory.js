import {
  ArrowLeft,
  RefreshCcw,
  CheckCircle2,
  Info,
  TriangleAlert,
  AlertCircle,
  Calendar,
  Download,
  Heart,
  Moon,
  Footprints,
  Activity,
  Watch,
} from "lucide-react";

const stats = [
  { label: "Eventos totais", value: "156", desc: "Últimos 30 dias", icon: RefreshCcw },
  { label: "Sincronizações", value: "142", desc: "91% do total", icon: CheckCircle2 },
  { label: "Processamentos", value: "8", desc: "5% do total", icon: Info },
  { label: "Alertas", value: "6", desc: "4% do total", icon: TriangleAlert },
];

const activities = [
  {
    time: "Hoje, 14:32",
    event: "Sincronização concluída",
    device: "Google Health Connect",
    detail: "4.842 passos, 52 bpm, sono",
    status: "Concluído",
    type: "success",
    icon: RefreshCcw,
  },
  {
    time: "Hoje, 13:58",
    event: "Passos atualizados",
    device: "Google Health Connect",
    detail: "5.842 passos importados",
    status: "Concluído",
    type: "success",
    icon: Footprints,
  },
  {
    time: "Hoje, 13:40",
    event: "Processamento de sono",
    device: "Google Health Connect",
    detail: "7h 32m de sono analisado",
    status: "Concluído",
    type: "success",
    icon: Moon,
  },
  {
    time: "Hoje, 12:10",
    event: "HRV recalculado",
    device: "Google Health Connect",
    detail: "Variabilidade cardíaca atualizada",
    status: "Concluído",
    type: "success",
    icon: Heart,
  },
  {
    time: "Hoje, 11:45",
    event: "Dados de atividade",
    device: "Google Health Connect",
    detail: "Atividade diária processada",
    status: "Concluído",
    type: "success",
    icon: Activity,
  },
  {
    time: "Ontem, 22:15",
    event: "Processamento de sono",
    device: "Google Health Connect",
    detail: "7h 15m de sono analisado",
    status: "Concluído",
    type: "success",
    icon: Moon,
  },
  {
    time: "Ontem, 20:30",
    event: "Sincronização falhou",
    device: "Fitbit",
    detail: "Falha de conexão com API",
    status: "Erro",
    type: "error",
    icon: AlertCircle,
  },
  {
    time: "Ontem, 20:29",
    event: "Tentativa de reconexão",
    device: "Fitbit",
    detail: "Reconexão automática iniciada",
    status: "Concluído",
    type: "success",
    icon: Info,
  },
  {
    time: "Ontem, 18:20",
    event: "Sincronização concluída",
    device: "Garmin Connect",
    detail: "Dados de atividade importados",
    status: "Concluído",
    type: "success",
    icon: Watch,
  },
  {
    time: "Ontem, 17:15",
    event: "Dados incompletos",
    device: "Apple HealthKit",
    detail: "Alguns dados de SpO₂ não disponíveis",
    status: "Aviso",
    type: "warning",
    icon: TriangleAlert,
  },
];

export default function DeviceHistory() {
  return (
    <div className="w-full px-5 pb-8 pt-5 text-white">
      <button
        onClick={() => window.history.back()}
        className="mb-5 flex items-center gap-2 text-sm text-zinc-400 transition hover:text-cyan-300"
      >
        <ArrowLeft size={16} />
        Voltar
      </button>

      <div className="mb-5">
        <h1 className="text-3xl font-bold leading-tight">Histórico de Atividades</h1>
        <p className="text-sm text-zinc-400">
          Acompanhe todas as sincronizações e eventos dos seus dispositivos
        </p>
      </div>

      <section className="mb-5 grid gap-4 xl:grid-cols-4">
        {stats.map(({ label, value, desc, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-white/5 bg-[#091017] p-5">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-cyan-500/10 p-3 text-cyan-300">
                <Icon size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-sm font-medium text-white">{label}</p>
                <p className="text-xs text-zinc-500">{desc}</p>
              </div>
            </div>
          </div>
        ))}
      </section>

      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <section className="overflow-hidden rounded-xl border border-white/5 bg-[#071015]">
          <div className="grid grid-cols-[130px_1.3fr_1fr_1.5fr_120px] border-b border-white/5 px-5 py-4 text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-400">
            <span>Data/Hora</span>
            <span>Evento</span>
            <span>Dispositivo</span>
            <span>Detalhes</span>
            <span>Status</span>
          </div>

          {activities.map(({ time, event, device, detail, status, type, icon: Icon }) => (
            <div
              key={`${time}-${event}`}
              className="grid grid-cols-[130px_1.3fr_1fr_1.5fr_120px] items-center border-b border-white/5 px-5 py-4 last:border-b-0"
            >
              <span className="text-sm text-zinc-400">{time}</span>

              <div className="flex items-center gap-3">
                <Icon
                  size={18}
                  className={
                    type === "error"
                      ? "text-red-400"
                      : type === "warning"
                      ? "text-yellow-400"
                      : "text-cyan-400"
                  }
                />
                <span
                  className={
                    type === "error"
                      ? "text-sm font-semibold text-red-400"
                      : type === "warning"
                      ? "text-sm font-semibold text-yellow-400"
                      : "text-sm font-semibold text-white"
                  }
                >
                  {event}
                </span>
              </div>

              <span className="text-sm text-zinc-300">{device}</span>
              <span className="text-sm text-zinc-400">{detail}</span>

              <span
                className={
                  type === "error"
                    ? "text-sm font-medium text-red-400"
                    : type === "warning"
                    ? "text-sm font-medium text-yellow-400"
                    : "text-sm font-medium text-emerald-400"
                }
              >
                ● {status}
              </span>
            </div>
          ))}

          <div className="flex items-center justify-between border-t border-white/5 px-5 py-4">
            <button className="rounded-lg border border-white/5 px-4 py-2 text-sm text-zinc-600">
              Anterior
            </button>

            <div className="flex items-center gap-2 text-sm">
              <button className="rounded-lg border border-cyan-400/40 bg-cyan-400/10 px-3 py-2 text-cyan-300">
                1
              </button>
              <button className="rounded-lg px-3 py-2 text-zinc-400">2</button>
              <button className="rounded-lg px-3 py-2 text-zinc-400">3</button>
              <button className="rounded-lg px-3 py-2 text-zinc-400">4</button>
              <span className="px-2 text-zinc-500">...</span>
              <button className="rounded-lg px-3 py-2 text-zinc-400">16</button>
            </div>

            <button className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white">
              Próxima
            </button>
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-xl border border-white/5 bg-[#091017] p-5">
            <p className="mb-5 text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-400">
              Filtros
            </p>

            <div className="mb-4">
              <p className="mb-2 text-sm text-zinc-300">Período</p>
              <div className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-3 text-sm text-white">
                <span>20/05/2025</span>
                <span className="text-zinc-500">→</span>
                <span>19/06/2025</span>
                <Calendar size={16} className="text-zinc-400" />
              </div>
            </div>

            <select className="mb-5 w-full rounded-lg border border-white/10 bg-[#0d141c] px-3 py-3 text-sm text-white outline-none">
              <option>Últimos 30 dias</option>
              <option>Últimos 7 dias</option>
              <option>Hoje</option>
            </select>

            <div className="mb-5">
              <p className="mb-3 text-sm text-zinc-300">Tipo de evento</p>

              {["Sincronizações", "Processamentos", "Atualizações", "Alertas", "Erros"].map(
                (item) => (
                  <label key={item} className="mb-2 flex items-center gap-2 text-sm text-zinc-300">
                    <input defaultChecked type="checkbox" className="accent-cyan-400" />
                    {item}
                  </label>
                )
              )}
            </div>

            <div className="mb-5">
              <p className="mb-2 text-sm text-zinc-300">Dispositivo</p>
              <select className="w-full rounded-lg border border-white/10 bg-[#0d141c] px-3 py-3 text-sm text-white outline-none">
                <option>Todos os dispositivos</option>
                <option>Google Health Connect</option>
                <option>Apple HealthKit</option>
                <option>Garmin Connect</option>
                <option>Fitbit</option>
              </select>
            </div>

            <button className="w-full rounded-lg border border-white/10 px-4 py-3 text-sm text-white">
              Limpar filtros
            </button>
          </section>

          <section className="rounded-xl border border-white/5 bg-[#091017] p-5">
            <p className="mb-5 text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-400">
              Resumo do período
            </p>

            <SummaryRow label="Sincronizações" value="142" />
            <SummaryRow label="Processamentos" value="8" />
            <SummaryRow label="Atualizações" value="23" />
            <SummaryRow label="Alertas" value="6" />
            <SummaryRow label="Erros" value="3" />
            <SummaryRow label="Taxa de sucesso" value="94%" highlight />
          </section>

          <section className="rounded-xl border border-white/5 bg-[#091017] p-5">
            <button className="flex items-center gap-3 text-left">
              <Download size={20} className="text-zinc-300" />
              <div>
                <p className="text-sm font-bold text-white">Exportar histórico</p>
                <p className="text-xs text-zinc-500">Download em CSV</p>
              </div>
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, highlight }) {
  return (
    <div className="mb-3 flex items-center justify-between text-sm last:mb-0">
      <span className="text-zinc-400">{label}</span>
      <span className={highlight ? "font-bold text-emerald-400" : "font-bold text-white"}>
        {value}
      </span>
    </div>
  );
}

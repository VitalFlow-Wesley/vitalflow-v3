import {
  Heart,
  Activity,
  BedDouble,
  Footprints,
  Droplets,
  RefreshCcw,
  Settings2,
  CheckCircle2,
  Signal,
  ShieldCheck,
  Clock3,
} from "lucide-react";

const metrics = [
  { label: "HRV", status: "Ativo", icon: Heart },
  { label: "BPM", status: "Ativo", icon: Activity },
  { label: "Sono", status: "Ativo", icon: BedDouble },
  { label: "Passos", status: "Ativo", icon: Footprints },
  { label: "SpO2", status: "Aguardando", icon: Droplets },
];

export default function MainDeviceCard() {
  return (
    <section className="rounded-2xl border border-emerald-500/20 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_rgba(3,7,18,0.96)_45%)] p-5 shadow-[0_0_30px_rgba(16,185,129,0.08)]">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <img
              src="https://www.gstatic.com/fit/android/icons/google-fit-icon-512.png"
              alt="Google Health Connect"
              className="h-11 w-11 rounded-xl"
            />
            <div>
              <h3 className="text-2xl font-semibold text-white">Google Health Connect</h3>
              <p className="text-sm text-zinc-400">Hub principal de biometria Android</p>
            </div>
          </div>
          <p className="max-w-2xl text-sm text-zinc-300">
            Seu Google Health está conectado e fornecendo dados confiáveis. Última
            sincronização há 2 min. VitalFlow já está usando HRV, BPM e sono para análises.
          </p>
        </div>

        <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
          Conectado
        </span>
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-white/5 bg-black/20 p-3">
          <div className="mb-1 flex items-center gap-2 text-zinc-300">
            <Clock3 size={16} className="text-cyan-400" />
            <span className="text-xs">Última sincronização</span>
          </div>
          <p className="text-sm font-medium text-white">Agora</p>
        </div>

        <div className="rounded-xl border border-white/5 bg-black/20 p-3">
          <div className="mb-1 flex items-center gap-2 text-zinc-300">
            <Signal size={16} className="text-cyan-400" />
            <span className="text-xs">Qualidade do sinal</span>
          </div>
          <p className="text-sm font-medium text-white">Alta</p>
        </div>

        <div className="rounded-xl border border-white/5 bg-black/20 p-3">
          <div className="mb-1 flex items-center gap-2 text-zinc-300">
            <Activity size={16} className="text-cyan-400" />
            <span className="text-xs">Cobertura de dados</span>
          </div>
          <p className="text-sm font-medium text-white">82%</p>
        </div>

        <div className="rounded-xl border border-white/5 bg-black/20 p-3">
          <div className="mb-1 flex items-center gap-2 text-zinc-300">
            <ShieldCheck size={16} className="text-cyan-400" />
            <span className="text-xs">Confiabilidade</span>
          </div>
          <p className="text-sm font-medium text-white">96%</p>
        </div>
      </div>

      <div className="mb-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400">
          Dados ativos
        </p>

        <div className="grid gap-3 md:grid-cols-5">
          {metrics.map(({ label, status, icon: Icon }) => (
            <div
              key={label}
              className="rounded-xl border border-white/5 bg-black/20 p-3"
            >
              <div className="mb-2 flex items-center gap-2">
                <Icon size={16} className="text-cyan-400" />
                <span className="text-sm font-medium text-white">{label}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <CheckCircle2 size={14} className="text-emerald-400" />
                {status}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row">
        <button className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 text-sm font-medium text-black transition hover:bg-cyan-400">
          <RefreshCcw size={16} />
          Sincronizar agora
        </button>

        <button className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-medium text-white transition hover:bg-white/[0.06]">
          <Settings2 size={16} />
          Gerenciar dados
        </button>
      </div>
    </section>
  );
}

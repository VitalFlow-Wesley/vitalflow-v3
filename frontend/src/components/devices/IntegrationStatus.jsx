import { Smartphone, Layers3, Clock3, Signal, Activity, ShieldCheck } from "lucide-react";

export default function IntegrationStatus() {
  const items = [
    { icon: Smartphone, label: "Dispositivo ativo", value: "1" },
    { icon: Layers3, label: "Fontes disponíveis", value: "4" },
    { icon: Clock3, label: "Última sincronização", value: "Agora" },
    { icon: Signal, label: "Qualidade do sinal", value: "Alta" },
    { icon: Activity, label: "Cobertura biométrica", value: "82%" },
    { icon: ShieldCheck, label: "Confiabilidade", value: "96%" },
  ];

  return (
    <section className="rounded-2xl border border-cyan-500/10 bg-[#07111a] p-5 shadow-[0_0_0_1px_rgba(34,211,238,0.04)]">
      <div className="mb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-400">
          Status da Integração
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {items.map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3"
          >
            <div className="mb-2 flex items-center gap-2 text-cyan-400">
              <Icon size={18} />
              <span className="text-xl font-semibold text-white">{value}</span>
            </div>
            <p className="text-xs text-zinc-400">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

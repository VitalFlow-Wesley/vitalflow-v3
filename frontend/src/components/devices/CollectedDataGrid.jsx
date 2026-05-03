import { Heart, Activity, BedDouble, Footprints } from "lucide-react";

const items = [
  { icon: Heart, title: "HRV", desc: "Variabilidade cardíaca (24h)" },
  { icon: Activity, title: "BPM", desc: "Batimentos em repouso" },
  { icon: BedDouble, title: "Sono", desc: "Duração da última noite" },
  { icon: Footprints, title: "Passos", desc: "Contagem diária do acelerômetro" },
];

export default function CollectedDataGrid() {
  return (
    <section className="rounded-2xl border border-white/5 bg-[#0a1017] p-5">
      <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-400">
        Dados coletados automaticamente
      </p>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {items.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <Icon className="mb-3 text-cyan-400" size={20} />
            <h4 className="text-base font-semibold text-white">{title}</h4>
            <p className="text-sm text-zinc-400">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

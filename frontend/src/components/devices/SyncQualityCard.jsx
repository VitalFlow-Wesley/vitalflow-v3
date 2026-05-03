export default function SyncQualityCard() {
  const items = [
    ["Latência", "Baixa (2 min)"],
    ["Integridade", "Alta (98%)"],
    ["Cobertura", "82%"],
    ["Confiabilidade", "Excelente"],
  ];

  return (
    <section className="rounded-2xl border border-white/5 bg-[#0a1017] p-5">
      <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-400">
        Qualidade da sincronização
      </p>

      <div className="space-y-3">
        <div className="flex items-center justify-center">
          <div className="flex h-36 w-36 items-center justify-center rounded-full border-8 border-emerald-400 text-center">
            <div>
              <div className="text-3xl font-bold text-white">96%</div>
              <div className="text-xs text-emerald-300">Excelente</div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {items.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">{label}</span>
              <span className="text-white">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const events = [
  ["Agora", "Google Health sincronizado", "Todos os dados atualizados"],
  ["13:58", "Passos atualizados", "5.842 passos importados"],
  ["13:40", "Sono processado", "7h 32m de sono analisado"],
  ["12:10", "HRV recalculado", "Variabilidade cardíaca atualizada"],
];

export default function RecentActivity() {
  return (
    <section className="rounded-2xl border border-white/5 bg-[#0a1017] p-5">
      <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-400">
        Atividade recente
      </p>

      <div className="space-y-4">
        {events.map(([time, title, desc]) => (
          <div key={title} className="flex items-start justify-between gap-3">
            <div className="text-xs text-zinc-500">{time}</div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">{title}</p>
              <p className="text-xs text-zinc-400">{desc}</p>
            </div>
            
        ))}
      </div>
    </section>
  );
}

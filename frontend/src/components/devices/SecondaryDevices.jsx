const devices = [
  {
    name: "Apple HealthKit",
    subtitle: "Sincronização nativa com Apple Watch e iPhone Health",
  },
  {
    name: "Garmin Connect",
    subtitle: "Integre seus dispositivos Garmin compatíveis",
  },
  {
    name: "Fitbit",
    subtitle: "Sincronize automaticamente seus dados Fitbit",
  },
];

export default function SecondaryDevices() {
  return (
    <section className="grid gap-4 xl:grid-cols-3">
      {devices.map((device) => (
        <div
          key={device.name}
          className="rounded-2xl border border-white/5 bg-[#0a1017] p-5"
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">{device.name}</h3>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] text-zinc-300">
              Em breve
            </span>
          </div>

          <p className="mb-2 text-sm text-zinc-300">{device.subtitle}</p>
          <p className="mb-5 text-xs text-zinc-500">Integração planejada</p>

          <button className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white transition hover:bg-white/[0.06]">
            Notificar lançamento
          </button>
        </div>
      ))}
    </section>
  );
}

import {
  Smartphone,
  Layers3,
  Clock3,
  Signal,
  Activity,
  ShieldCheck,
  Heart,
  BedDouble,
  Footprints,
  Droplets,
  RefreshCcw,
  Settings2,
  Bell,
  Apple,
  Watch,
  Zap,
  Info,
  ArrowRight,
} from "lucide-react";

const comingSoon = [
  {
    name: "Apple HealthKit",
    platform: "iOS",
    icon: Apple,
    desc: "Sincronização nativa com Apple Watch e iPhone Health",
    items: ["HRV", "BPM", "Sono", "Atividade", "Treinos"],
  },
  {
    name: "Garmin Connect",
    platform: "Multi-plataforma",
    icon: Watch,
    desc: "Integre seus dispositivos Garmin compatíveis",
    items: ["Atividade", "Sono", "Estresse", "Body Battery", "Performance"],
  },
  {
    name: "Fitbit",
    platform: "Multi-plataforma",
    icon: Activity,
    desc: "Sincronize automaticamente seus dados do Fitbit",
    items: ["Atividade", "Sono", "Frequência cardíaca", "Estresse", "Peso e composição"],
  },
];

const activeData = [
  { label: "HRV", desc: "Variabilidade cardíaca (24h)", icon: Heart },
  { label: "BPM", desc: "Batimentos em repouso", icon: Activity },
  { label: "Sono", desc: "Duração da última noite", icon: BedDouble },
  { label: "Passos", desc: "Contagem diária do acelerômetro", icon: Footprints },
];

const recent = [
  ["Agora", "Google Health sincronizado", "Todos os dados atualizados"],
  ["13:58", "Passos atualizados", "5.842 passos importados"],
  ["13:40", "Sono processado", "7h 32m de sono analisado"],
  ["12:10", "HRV recalculado", "Variabilidade cardíaca atualizada"],
];

export default function ConnectDevices() {
  return (
    <div className="w-full space-y-3 px-5 pb-5 pt-4 text-white">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold leading-tight">Central de Dispositivos</h1>
          <p className="text-xs text-zinc-400">
            Seus wearables e fontes biométricas conectadas ao VitalFlow
          </p>
        </div>
        <button className="text-xs text-zinc-400 hover:text-cyan-300">Ajuda</button>
      </div>

      <section className="rounded-xl border border-white/5 bg-[#071015] p-4">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-400">
          Status da Integração
        </p>

        <div className="grid grid-cols-6 divide-x divide-white/10">
          <Status icon={Smartphone} value="1" label="Dispositivo ativo" />
          <Status icon={Layers3} value="4" label="Fontes disponíveis" />
          <Status icon={Clock3} value="Agora" label="Última sincronização" />
          <Status icon={Signal} value="Alta" label="Qualidade do sinal" />
          <Status icon={Activity} value="82%" label="Cobertura biométrica" />
          <Status icon={ShieldCheck} value="96%" label="Confiabilidade" />
        </div>
      </section>

      <section className="grid grid-cols-[1.35fr_0.75fr_0.75fr_0.75fr] gap-3">
        <GoogleMaster />

        {comingSoon.map((device) => (
          <ComingSoonCard key={device.name} {...device} />
        ))}
      </section>

      <section className="grid grid-cols-[1fr_0.9fr_1.05fr] gap-3">
        <CollectedData />
        <SyncQuality />
        <RecentActivity />
      </section>

      <section className="flex items-center justify-between rounded-xl border border-emerald-500/10 bg-[#07140f] px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-2 text-emerald-300">
            <ShieldCheck size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-300">Seus dados estão protegidos</p>
            <p className="text-xs text-zinc-400">
              Utilizamos criptografia de ponta a ponta e seguimos os mais altos padrões de segurança e privacidade.
            </p>
          </div>
        </div>

        <button className="flex items-center gap-2 text-xs font-medium text-emerald-300">
          Saiba mais sobre segurança <ArrowRight size={14} />
        </button>
      </section>
    </div>
  );
}

function Status({ icon: Icon, value, label }) {
  return (
    <div className="flex items-center gap-3 px-4 first:pl-0">
      <Icon size={23} className="text-cyan-400" />
      <div>
        <p className="text-xl font-bold">{value}</p>
        <p className="text-xs text-zinc-400">{label}</p>
      </div>
    </div>
  );
}

function GoogleMaster() {
  const data = [
    { label: "HRV", icon: Heart, status: "Ativo" },
    { label: "BPM", icon: Activity, status: "Ativo" },
    { label: "Sono", icon: BedDouble, status: "Ativo" },
    { label: "Passos", icon: Footprints, status: "Ativo" },
    { label: "SpO2", icon: Droplets, status: "Aguardando" },
  ];

  return (
    <div className="rounded-xl border border-emerald-500/30 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),rgba(4,8,13,0.96)_45%)] p-5">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-xl">
            💚
          </div>
          <div>
            <h2 className="text-xl font-bold">Google Health Connect</h2>
            <p className="text-xs text-zinc-400">Android</p>
            <p className="mt-2 text-sm text-zinc-300">
              Sincroniza dados do Google Fit e apps de saúde Android
            </p>
          </div>
        </div>

        <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
          ✓ Conectado
        </span>
      </div>

      <div className="mb-4 grid grid-cols-3 rounded-lg border border-white/5 bg-white/[0.025] p-3">
        <MiniInfo icon={Clock3} label="Última sincronização" value="Agora" />
        <MiniInfo icon={Signal} label="Qualidade do sinal" value="Alta" />
        <MiniInfo icon={Activity} label="Cobertura de dados" value="82%" />
      </div>

      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
        Dados ativos
      </p>

      <div className="mb-4 grid grid-cols-5 gap-2">
        {data.map(({ label, icon: Icon, status }) => (
          <div key={label} className="rounded-lg border border-white/5 bg-black/20 p-3">
            <div className="mb-1 flex items-center gap-2">
              <Icon size={17} className="text-cyan-400" />
              <span className="text-sm font-bold">{label}</span>
            </div>
            <p className="text-[11px] text-emerald-300">{status}</p>
          </div>
        ))}
      </div>

      <div>
        <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 py-3 text-sm font-bold text-white">
          <RefreshCcw size={16} /> Sincronizar agora
        </button>
      </div>
    </div>
  );
}

function MiniInfo({ icon: Icon, label, value }) {
  return (
    <div className="border-r border-white/10 px-3 last:border-r-0">
      <div className="mb-1 flex items-center gap-2 text-xs text-zinc-400">
        <Icon size={14} className="text-cyan-400" />
        {label}
      </div>
      <p className="text-xs font-bold text-emerald-300">{value}</p>
    </div>
  );
}

function ComingSoonCard({ name, platform, icon: Icon, desc, items }) {
  return (
    <div className="rounded-xl border border-white/5 bg-[#090c11] p-5">
      <div className="mb-3 flex items-start justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-cyan-300">
          <Icon size={24} />
        </div>
        <span className="rounded-full bg-white/5 px-3 py-1 text-[11px] text-zinc-400">
          Em breve
        </span>
      </div>

      <h3 className="text-lg font-bold">{name}</h3>
      <p className="mb-3 text-xs text-zinc-500">{platform}</p>
      <p className="mb-4 text-xs leading-relaxed text-zinc-400">{desc}</p>

      <div className="mb-5 space-y-2">
        {items.map((item) => (
          <div key={item} className="flex items-center gap-2 text-xs text-zinc-400">
            <Zap size={13} className="text-emerald-400" />
            {item}
          </div>
        ))}
      </div>

      <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.025] py-3 text-xs text-zinc-300">
        <Bell size={14} /> Notificar lançamento
      </button>
    </div>
  );
}

function CollectedData() {
  return (
    <div className="rounded-xl border border-white/5 bg-[#090f14] p-4">
      <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-400">
        Dados coletados automaticamente
      </p>

      <div className="mb-4 grid grid-cols-4 gap-2">
        {activeData.map(({ icon: Icon, label, desc }) => (
          <div key={label} className="rounded-lg border border-white/5 bg-white/[0.025] p-3">
            <Icon size={24} className="mb-3 text-cyan-400" />
            <h4 className="text-sm font-bold">{label}</h4>
            <p className="text-[11px] leading-snug text-zinc-400">{desc}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-white/5 bg-black/20 px-3 py-2 text-xs text-zinc-400">
        <Info size={14} className="text-emerald-400" />
        Os dados são processados com segurança e usados para gerar insights personalizados no VitalFlow.
      </div>
    </div>
  );
}

function SyncQuality() {
  return (
    <div className="rounded-xl border border-white/5 bg-[#090f14] p-4">
      <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-400">
        Qualidade da sincronização
      </p>

      <div className="grid grid-cols-[0.8fr_1fr] items-center gap-4">
        <div className="flex justify-center">
          <div className="flex h-32 w-32 items-center justify-center rounded-full border-[10px] border-emerald-400">
            <div className="text-center">
              <p className="text-3xl font-bold">96%</p>
              <p className="text-xs text-emerald-300">Excelente</p>
            </div>
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <Row label="Latência" value="Baixa (2 min)" />
          <Row label="Integridade" value="Alta (98%)" />
          <Row label="Cobertura" value="82%" />
          <Row label="Confiabilidade" value="Excelente" />
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-white/5 bg-black/20 px-3 py-2 text-xs text-zinc-400">
        Sua integração está funcionando perfeitamente.
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between border-b border-white/5 pb-2 last:border-0">
      <span className="text-zinc-400">{label}</span>
      <span className="font-medium text-emerald-300">{value}</span>
    </div>
  );
}

function RecentActivity() {
  return (
    <div className="rounded-xl border border-white/5 bg-[#090f14] p-4">
      <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-400">
        Atividade recente
      </p>

      <div className="space-y-3">
        {recent.map(([time, title, desc]) => (
          <div key={title} className="grid grid-cols-[48px_1fr_10px] items-start gap-3">
            <span className="text-xs text-zinc-500">{time}</span>
            <div>
              <p className="text-sm font-bold">{title}</p>
              <p className="text-xs text-zinc-400">{desc}</p>
            </div>
            <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400" />
          </div>
        ))}
      </div>

      <button onClick={() => (window.location.href = "/devices/history")} className="mt-3 flex items-center gap-1 text-xs font-medium text-cyan-400">
        Ver histórico completo <ArrowRight size={13} />
      </button>
    </div>
  );
}

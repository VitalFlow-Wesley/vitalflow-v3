import { useState } from "react";
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
  CheckCircle2,
  Info,
  TriangleAlert,
  AlertCircle,
  Calendar,
  Download,
  Moon,
  Watch,
  Bell,
  Apple,
  Zap,
  ArrowRight,
  ArrowLeft,
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


const historyStats = [
  { label: "Eventos totais", value: "156", desc: "Últimos 30 dias", icon: RefreshCcw },
  { label: "Sincronizações", value: "142", desc: "91% do total", icon: CheckCircle2 },
  { label: "Processamentos", value: "8", desc: "5% do total", icon: Info },
  { label: "Alertas", value: "6", desc: "4% do total", icon: TriangleAlert },
];

const historyActivities = [
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

export default function ConnectDevices() {
  const [showHistory, setShowHistory] = useState(false);

  if (showHistory) {
    return <DeviceHistoryView onBack={() => setShowHistory(false)} />;
  }

if (showHistory) {
    return <DeviceHistoryView onBack={() => setShowHistory(false)} />;
  }

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
        <RecentActivity onOpenHistory={() => setShowHistory(true)} />
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

function RecentActivity({ onOpenHistory }) {
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

      

      <div className="mb-5">
        <h1 className="text-3xl font-bold leading-tight">Histórico de Atividades</h1>
        <p className="text-sm text-zinc-400">
          Acompanhe todas as sincronizações e eventos dos seus dispositivos
        </p>
      </div>

      <section className="mb-5 grid gap-4 xl:grid-cols-4">
        {historyStats.map(({ label, value, desc, icon: Icon }) => (
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

          {historyActivities.map(({ time, event, device, detail, status, type, icon: Icon }) => (
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

            <HistorySummaryRow label="Sincronizações" value="142" />
            <HistorySummaryRow label="Processamentos" value="8" />
            <HistorySummaryRow label="Atualizações" value="23" />
            <HistorySummaryRow label="Alertas" value="6" />
            <HistorySummaryRow label="Erros" value="3" />
            <HistorySummaryRow label="Taxa de sucesso" value="94%" highlight />
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

function HistorySummaryRow({ label, value, highlight }) {
  return (
    <div className="mb-3 flex items-center justify-between text-sm last:mb-0">
      <span className="text-zinc-400">{label}</span>
      <span className={highlight ? "font-bold text-emerald-400" : "font-bold text-white"}>
        {value}
      </span>
    </div>
  );
}

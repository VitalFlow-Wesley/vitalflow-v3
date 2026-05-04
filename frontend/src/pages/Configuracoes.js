import {
  User,
  Lock,
  Camera,
  CreditCard,
  LogOut,
  Target,
  Zap,
  Flower2,
  Focus,
  Moon,
  Rocket,
  Scale,
  Brain,
  Bell,
  Mail,
  MessageCircle,
  HeartPulse,
  Activity,
  Ruler,
  Weight,
  Footprints,
  Watch,
  ShieldCheck,
  Download,
  Trash2,
  Power,
  Palette,
  Eye,
  Maximize2,
  Volume2,
  Trophy,
  Flame,
  BadgeCheck,
  HelpCircle,
  Headphones,
  Bug,
  Lightbulb,
  Radio,
  Info,
  ExternalLink,
  ChevronRight,
  Check,
  Smartphone,
  Apple,
} from "lucide-react";

const user = {
  name: "Wesley Nascimento",
  email: "wesley@email.com",
  plan: "Plano Premium",
  memberSince: "23/02/2024",
  age: "28 anos",
  gender: "Masculino",
  height: "1,78 m",
  weight: "74 kg",
  activityLevel: "Moderado",
  restingHeartRate: "58 bpm",
  sleepGoal: "7h 30min",
  stepsGoal: "8.000 passos",
  stressSensitivity: "Média",
};

const goals = [
  { title: "Melhorar energia", priority: "Prioridade alta", icon: Zap, color: "text-cyan-300" },
  { title: "Reduzir estresse", priority: "Prioridade média", icon: Flower2, color: "text-purple-300" },
  { title: "Melhorar foco", priority: "Prioridade alta", icon: Focus, color: "text-blue-300" },
  { title: "Dormir melhor", priority: "Prioridade alta", icon: Moon, color: "text-violet-300" },
  { title: "Aumentar performance", priority: "Prioridade média", icon: Rocket, color: "text-orange-300" },
  { title: "Manter equilíbrio", priority: "Prioridade média", icon: Scale, color: "text-emerald-300" },
];

const integrations = [
  { name: "Google Health Connect", status: "Conectado", icon: HeartPulse, active: true },
  { name: "Apple Health", status: "Não conectado", icon: Apple, active: false },
  { name: "Garmin Connect", status: "Não conectado", icon: Watch, active: false },
  { name: "Fitbit", status: "Não conectado", icon: Activity, active: false },
  { name: "Oura", status: "Em breve", icon: Smartphone, active: false },
];

const healthRows = [
  { label: "Idade", value: user.age, icon: User },
  { label: "Sexo", value: user.gender, icon: Activity },
  { label: "Altura", value: user.height, icon: Ruler },
  { label: "Peso", value: user.weight, icon: Weight },
  { label: "Nível de atividade", value: user.activityLevel, icon: Footprints },
  { label: "FC de repouso média", value: user.restingHeartRate, icon: HeartPulse },
  { label: "Meta de sono", value: user.sleepGoal, icon: Moon },
  { label: "Meta de passos", value: user.stepsGoal, icon: Footprints },
  { label: "Sensibilidade ao estresse", value: user.stressSensitivity, icon: Brain },
];

export default function Configuracoes() {
  return (
    <div className="w-full px-5 pb-8 pt-5 text-white">
      <div className="mb-5">
        <h1 className="text-3xl font-bold leading-tight">Configurações</h1>
        <p className="text-sm text-zinc-400">
          Personalize sua experiência e gerencie suas preferências no VitalFlow.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1.3fr]">
        <ProfileCard />
        <GoalsCard />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <AiPreferencesCard />
        <NotificationsCard />
        <HealthBiomarkersCard />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <IntegrationsCard />
        <PrivacyCard />
        <AppearanceCard />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <GamificationCard />
        <PlanCard />
        <SupportCard />
      </div>

      <AboutFooter />
    </div>
  );
}

function ProfileCard() {
  const actions = [
    { label: "Editar perfil", icon: User },
    { label: "Alterar senha", icon: Lock },
    { label: "Trocar foto", icon: Camera },
    { label: "Gerenciar assinatura", icon: CreditCard },
    { label: "Encerrar sessão", icon: LogOut },
  ];

  return (
    <Card>
      <CardTitle title="Perfil e conta" />
      <div className="mb-5 flex items-center gap-4">
        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-cyan-400/20 bg-cyan-400/10">
          <User size={36} className="text-cyan-300" />
        </div>

        <div>
          <h2 className="text-xl font-bold">{user.name}</h2>
          <p className="text-sm text-zinc-400">{user.email}</p>
          <span className="mt-2 inline-flex rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
            {user.plan}
          </span>
          <p className="mt-2 text-xs text-zinc-500">Membro desde {user.memberSince}</p>
        </div>
      </div>

      <div className="divide-y divide-white/5">
        {actions.map(({ label, icon: Icon }) => {
          const isLogout = label === "Encerrar sessão";

          return (
            <button
              key={label}
              className={
                isLogout
                  ? "flex w-full items-center justify-between py-3 text-sm text-red-400 transition hover:text-red-300"
                  : "flex w-full items-center justify-between py-3 text-sm text-zinc-300 transition hover:text-cyan-300"
              }
            >
              <span className="flex items-center gap-3">
                <Icon size={17} className={isLogout ? "text-red-400" : "text-zinc-500"} />
                {label}
              </span>
              <ChevronRight size={17} className={isLogout ? "text-red-400" : "text-zinc-500"} />
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function GoalsCard() {
  return (
    <Card>
      <CardTitle
        title="Metas e objetivos"
        desc="Defina seus principais objetivos para o VitalFlow otimizar suas recomendações."
      />

      <div className="grid gap-3 md:grid-cols-2">
        {goals.map(({ title, priority, icon: Icon, color }) => (
          <button
            key={title}
            className="rounded-xl border border-white/5 bg-white/[0.025] p-4 text-left transition hover:border-cyan-400/30 hover:bg-cyan-400/5"
          >
            <div className="flex items-center gap-3">
              <Icon size={24} className={color} />
              <div>
                <p className="text-sm font-bold text-white">{title}</p>
                <p className="text-xs text-zinc-500">{priority}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <button className="mt-5 flex w-full items-center justify-between border-t border-white/5 pt-4 text-sm font-medium text-emerald-300">
        Editar metas
        <ChevronRight size={17} />
      </button>
    </Card>
  );
}

function AiPreferencesCard() {
  return (
    <Card>
      <CardTitle
        title="Preferências da IA"
        desc="Personalize como o VitalFlow deve analisar e recomendar para você."
      />

      <Segment title="Estilo de recomendação" items={["Conservador", "Equilibrado", "Proativo"]} active="Equilibrado" />
      <Segment title="Frequência de recomendações" items={["Baixa", "Moderada", "Alta"]} active="Moderada" />
      <Segment title="Linguagem das recomendações" items={["Técnica", "Equilibrada", "Simples"]} active="Equilibrada" />

      <div className="mt-5">
        <p className="mb-2 text-xs font-semibold text-zinc-400">Foco principal da IA</p>
        <button className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-3 text-sm text-white">
          Recuperação e equilíbrio
          <ChevronRight size={16} className="rotate-90 text-zinc-500" />
        </button>
      </div>

      <button className="mt-6 text-sm font-semibold text-emerald-300">Salvar preferências</button>
    </Card>
  );
}

function NotificationsCard() {
  return (
    <Card>
      <CardTitle
        title="Notificações"
        desc="Escolha como e quando deseja receber alertas e insights."
      />

      <NotificationGroup
        title="Push"
        items={[
          "Recomendação inteligente",
          "Janela ideal",
          "Alerta de risco",
          "Meta concluída",
          "Rotina sugerida",
        ]}
      />

      <NotificationGroup
        title="Email"
        items={["Relatório semanal", "Resumo mensal"]}
      />

      <NotificationGroup
        title="WhatsApp (Premium)"
        items={["Alertas prioritários", "Relatório executivo"]}
        lastOff
      />

      <button className="mt-4 text-sm font-semibold text-emerald-300">Gerenciar canais</button>
    </Card>
  );
}

function HealthBiomarkersCard() {
  return (
    <Card>
      <CardTitle
        title="Saúde & biomarcadores"
        desc="Mantenha suas informações atualizadas para análises mais precisas."
      />

      <div className="divide-y divide-white/5">
        {healthRows.map(({ label, value, icon: Icon }) => (
          <div key={label} className="flex items-center justify-between py-3 text-sm">
            <span className="flex items-center gap-3 text-zinc-400">
              <Icon size={16} className="text-zinc-500" />
              {label}
            </span>
            <span className="text-zinc-200">{value}</span>
          </div>
        ))}
      </div>

      <button className="mt-4 text-sm font-semibold text-emerald-300">Editar informações</button>
    </Card>
  );
}

function IntegrationsCard() {
  return (
    <Card>
      <CardTitle
        title="Integrações"
        desc="Gerencie suas conexões com dispositivos e plataformas."
      />

      <div className="divide-y divide-white/5">
        {integrations.map(({ name, status, icon: Icon, active }) => (
          <button
            key={name}
            className="flex w-full items-center justify-between py-3 text-sm"
          >
            <span className="flex items-center gap-3 text-zinc-300">
              <Icon size={17} className={active ? "text-emerald-300" : "text-cyan-300"} />
              {name}
            </span>

            <span className="flex items-center gap-2">
              <span className={active ? "text-xs text-emerald-300" : "text-xs text-zinc-500"}>
                {status}
              </span>
              <ChevronRight size={16} className="text-zinc-600" />
            </span>
          </button>
        ))}
      </div>

      <button className="mt-5 text-sm font-semibold text-emerald-300">
        Ver todas as integrações
      </button>
    </Card>
  );
}

function PrivacyCard() {
  const items = [
    { label: "Gerenciar permissões", icon: ShieldCheck },
    { label: "Exportar meus dados", icon: Download },
    { label: "Excluir histórico", icon: Trash2 },
    { label: "Baixar relatório LGPD", icon: Download },
    { label: "Encerrar todas as conexões", icon: Power },
  ];

  return (
    <Card>
      <CardTitle title="Privacidade & dados" desc="Você tem total controle sobre seus dados." />

      <div className="divide-y divide-white/5">
        {items.map(({ label, icon: Icon }) => (
          <button key={label} className="flex w-full items-center gap-3 py-3 text-sm text-zinc-300">
            <Icon size={17} className="text-zinc-500" />
            {label}
          </button>
        ))}
      </div>

      <button className="mt-4 flex items-center gap-3 text-sm font-semibold text-red-400">
        <Trash2 size={17} />
        Excluir minha conta
      </button>

      <button className="mt-5 text-sm font-semibold text-emerald-300">
        Saiba mais sobre segurança
      </button>
    </Card>
  );
}

function AppearanceCard() {
  return (
    <Card>
      <CardTitle title="Aparência & experiência" desc="Personalize a interface do VitalFlow." />

      <SelectRow icon={Palette} label="Tema" value="Escuro" />
      <SelectRow icon={Eye} label="Contraste" value="Padrão" />
      <SelectRow icon={Maximize2} label="Tamanho da interface" value="Médio" />

      <ToggleRow icon={Focus} label="Modo foco" checked />
      <ToggleRow icon={Zap} label="Animações" checked />
      <ToggleRow icon={Volume2} label="Som da interface" />

      <button className="mt-5 text-sm font-semibold text-emerald-300">
        Restaurar padrões
      </button>
    </Card>
  );
}

function GamificationCard() {
  return (
    <Card>
      <CardTitle
        title="Gamificação"
        desc="Configure elementos que tornam sua jornada mais motivadora."
      />

      <ToggleRow icon={Flame} label="Mostrar streak" checked />
      <ToggleRow icon={Zap} label="Mostrar energia" checked />
      <ToggleRow icon={BadgeCheck} label="Exibir badges" checked />

      <button className="mt-5 text-sm font-semibold text-emerald-300">
        Ver meus badges
      </button>
    </Card>
  );
}

function PlanCard() {
  return (
    <Card>
      <CardTitle title="Plano & assinatura" desc="Informações sobre seu plano atual." />

      <div className="space-y-3 text-sm">
        <InfoRow label="Plano atual" value="Premium" />
        <InfoRow label="Próxima cobrança" value="23/06/2024" />
        <InfoRow label="Método de pagamento" value="•••• 4242" />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <button className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-white">
          Gerenciar plano
        </button>
        <button className="rounded-lg border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm font-semibold text-red-300">
          Cancelar assinatura
        </button>
      </div>
    </Card>
  );
}

function SupportCard() {
  const items = [
    { label: "Central de ajuda", icon: HelpCircle },
    { label: "Falar com suporte", icon: Headphones },
    { label: "Reportar problema", icon: Bug },
    { label: "Sugerir melhoria", icon: Lightbulb },
  ];

  return (
    <Card>
      <CardTitle title="Ajuda & suporte" desc="Estamos aqui para ajudar." />

      <div className="divide-y divide-white/5">
        {items.map(({ label, icon: Icon }) => (
          <button key={label} className="flex w-full items-center gap-3 py-3 text-sm text-zinc-300">
            <Icon size={17} className="text-zinc-500" />
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between rounded-lg border border-white/5 bg-black/20 px-3 py-3">
        <span className="flex items-center gap-3 text-sm text-zinc-300">
          <Radio size={17} className="text-emerald-300" />
          Status do sistema
        </span>
        <span className="flex items-center gap-2 text-xs text-emerald-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          Operacional
        </span>
      </div>
    </Card>
  );
}

function AboutFooter() {
  return (
    <footer className="mt-5 rounded-xl border border-white/5 bg-[#090f14] p-5">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <Brain size={28} className="text-cyan-300" />
          <div>
            <p className="text-sm font-bold text-white">Sobre o VitalFlow</p>
            <p className="text-xs text-zinc-500">Versão 2.4.1 • Build 2024.04.28</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-5 text-xs text-emerald-300">
          {["Política de Privacidade", "Termos de Uso", "Licenças", "Changelog"].map((item) => (
            <button key={item} className="flex items-center gap-1">
              {item}
              <ExternalLink size={12} />
            </button>
          ))}
        </div>
      </div>
    </footer>
  );
}

function Card({ children }) {
  return (
    <section className="rounded-xl border border-white/5 bg-[#090d12] p-5 shadow-[0_0_25px_rgba(0,0,0,0.16)]">
      {children}
    </section>
  );
}

function CardTitle({ title, desc }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-bold text-white">{title}</h2>
      {desc && <p className="mt-1 text-xs leading-relaxed text-zinc-400">{desc}</p>}
    </div>
  );
}

function Segment({ title, items, active }) {
  return (
    <div className="mb-5">
      <p className="mb-2 text-xs font-semibold text-zinc-400">{title}</p>
      <div className="grid grid-cols-3 gap-2 rounded-lg bg-black/20 p-1">
        {items.map((item) => (
          <button
            key={item}
            className={
              item === active
                ? "rounded-md bg-emerald-400/20 px-2 py-2 text-xs font-semibold text-emerald-300"
                : "rounded-md px-2 py-2 text-xs text-zinc-500"
            }
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

function Toggle({ checked }) {
  return (
    <span
      className={
        checked
          ? "relative h-5 w-9 rounded-full bg-emerald-400"
          : "relative h-5 w-9 rounded-full bg-zinc-700"
      }
    >
      <span
        className={
          checked
            ? "absolute right-0.5 top-0.5 h-4 w-4 rounded-full bg-white"
            : "absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white"
        }
      />
    </span>
  );
}

function NotificationGroup({ title, items, lastOff }) {
  return (
    <div className="mb-5">
      <p className="mb-2 text-sm font-semibold text-cyan-300">{title}</p>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={item} className="flex items-center justify-between text-sm">
            <span className="text-zinc-300">{item}</span>
            <Toggle checked={!(lastOff && index === 0)} />
          </div>
        ))}
      </div>
    </div>
  );
}

function SelectRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 py-3 text-sm">
      <span className="flex items-center gap-3 text-zinc-400">
        <Icon size={17} className="text-zinc-500" />
        {label}
      </span>

      <button className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-white">
        {value}
        <ChevronRight size={14} className="rotate-90 text-zinc-500" />
      </button>
    </div>
  );
}

function ToggleRow({ icon: Icon, label, checked }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 py-3 text-sm last:border-b-0">
      <span className="flex items-center gap-3 text-zinc-400">
        <Icon size={17} className="text-zinc-500" />
        {label}
      </span>
      <Toggle checked={checked} />
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 pb-3">
      <span className="text-zinc-400">{label}</span>
      <span className="font-medium text-white">{value}</span>
    </div>
  );
}

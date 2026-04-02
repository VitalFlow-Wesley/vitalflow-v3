import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Brain, Activity, Zap, Flame, Smartphone, ChevronRight, X, Sparkles } from "lucide-react";

const STEPS = [
  {
    id: "welcome",
    icon: Brain,
    iconColor: "text-cyan-400",
    iconBg: "bg-cyan-500/10 border-cyan-500/30",
    title: "Bem-vindo ao VitalFlow",
    subtitle: "Seu copiloto de longevidade e saude mental",
    body: "O VitalFlow analisa seus dados biometricos em tempo real e transforma numeros em acoes praticas para voce viver melhor.",
    highlight: null,
  },
  {
    id: "vscore",
    icon: Activity,
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/10 border-emerald-500/30",
    title: "Seu V-Score",
    subtitle: "O termometro da sua vitalidade",
    body: "O StatusOrb pulsa e muda de cor conforme sua saude: Verde (80-100) voce esta otimo, Amarelo (50-79) atencao necessaria, Vermelho (0-49) alerta critico. Cada analise gera um Nudge: uma acao rapida de 5 minutos para melhorar seu estado agora.",
    highlight: "status-orb-container",
  },
  {
    id: "gamification",
    icon: Zap,
    iconColor: "text-amber-400",
    iconBg: "bg-amber-500/10 border-amber-500/30",
    title: "Pontos de Energia",
    subtitle: "Gamificacao que motiva sua rotina",
    body: "Cada vez que voce segue um Nudge, ganha +50 Pontos de Energia. Mantenha uma sequencia diaria para acumular Streaks e desbloquear o badge 'Biohacker da Semana' ao completar 7 dias seguidos!",
    highlight: "gamification-stats",
  },
  {
    id: "connect",
    icon: Smartphone,
    iconColor: "text-purple-400",
    iconBg: "bg-purple-500/10 border-purple-500/30",
    title: "Conecte seu Dispositivo",
    subtitle: "Dados reais, analises reais",
    body: "Conecte seu Google Fit, Apple Watch, Garmin ou Fitbit para o VitalFlow receber seus dados biometricos automaticamente. Sem dispositivo, sem analise — este e o primeiro passo para comecar!",
    highlight: null,
    isFinal: true,
  },
];

const OnboardingTour = ({ onComplete }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(true);
  const current = STEPS[step];
  const progress = ((step + 1) / STEPS.length) * 100;

  const handleNext = () => {
    if (current.isFinal) {
      handleFinish(true);
    } else {
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    }
  };

  const handleSkip = () => {
    handleFinish(false);
  };

  const handleFinish = (goToDevices) => {
    localStorage.setItem("vitalflow_onboarding_done", "true");
    setVisible(false);
    setTimeout(() => {
      onComplete();
      if (goToDevices) navigate("/devices");
    }, 300);
  };

  const Icon = current.icon;

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center"
        data-testid="onboarding-overlay"
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

        {/* Card */}
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="relative w-full max-w-lg mx-4 rounded-xl overflow-hidden"
          data-testid="onboarding-card"
        >
          {/* Progress bar */}
          <div className="h-1 bg-neutral-800 w-full">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>

          <div className="bg-neutral-900 border border-white/10 p-8 sm:p-10">
            {/* Close / Skip */}
            <button
              onClick={handleSkip}
              className="absolute top-4 right-4 p-1.5 rounded-full text-neutral-500 hover:text-white hover:bg-white/10 transition-colors"
              data-testid="onboarding-skip"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Step indicator */}
            <div className="flex items-center gap-1.5 mb-8">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    i === step ? "w-8 bg-cyan-400" : i < step ? "w-4 bg-cyan-400/40" : "w-4 bg-neutral-700"
                  }`}
                />
              ))}
            </div>

            {/* Icon */}
            <div className={`w-16 h-16 rounded-xl ${current.iconBg} border flex items-center justify-center mb-6`}>
              <Icon className={`w-8 h-8 ${current.iconColor}`} />
            </div>

            {/* Content */}
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-1" data-testid="onboarding-title">
              {current.title}
            </h2>
            <p className="text-sm text-cyan-400/80 font-medium mb-4">{current.subtitle}</p>
            <p className="text-neutral-300 text-sm leading-relaxed mb-8" data-testid="onboarding-body">
              {current.body}
            </p>

            {/* Visual hint for V-Score step */}
            {current.id === "vscore" && (
              <div className="flex justify-center gap-3 mb-8">
                {[
                  { color: "bg-emerald-400", label: "Verde", range: "80-100" },
                  { color: "bg-amber-400", label: "Amarelo", range: "50-79" },
                  { color: "bg-rose-400", label: "Vermelho", range: "0-49" },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                    <div className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                    <span className="text-xs text-neutral-300 font-mono">{s.range}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Visual hint for Gamification step */}
            {current.id === "gamification" && (
              <div className="flex items-center gap-4 mb-8 p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-mono font-bold text-amber-400">+50</span>
                </div>
                <div className="w-px h-6 bg-white/10" />
                <div className="flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span className="text-sm font-mono font-bold text-orange-400">7d Streak</span>
                </div>
                <div className="w-px h-6 bg-white/10" />
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="text-xs text-purple-400 font-semibold">Badge!</span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between">
              <button
                onClick={handleSkip}
                className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors"
                data-testid="onboarding-skip-text"
              >
                Pular tour
              </button>
              <button
                onClick={handleNext}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all duration-200 ${
                  current.isFinal
                    ? "bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-black shadow-lg shadow-cyan-500/20"
                    : "bg-white/10 hover:bg-white/20 text-white"
                }`}
                data-testid="onboarding-next"
              >
                {current.isFinal ? (
                  <>
                    <Smartphone className="w-4 h-4" />
                    Conectar Dispositivo
                  </>
                ) : (
                  <>
                    Proximo
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OnboardingTour;

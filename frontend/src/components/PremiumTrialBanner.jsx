import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Crown, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const API_URL = (process.env.REACT_APP_BACKEND_URL || "https://vitalflow.up.railway.app").replace(/\/+$/, "");

export default function PremiumTrialBanner() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadPlan = async () => {
    try {
      const response = await fetch(`${API_URL}/api/billing/plan`, {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (response.ok) setPlan(await response.json());
    } catch {}
  };

  useEffect(() => {
    loadPlan();
  }, [user?.id]);

  const accountType = String(user?.account_type || "").toLowerCase();
  const isCorporate = accountType === "corporate" || Boolean(user?.is_b2b);
  const state = useMemo(() => {
    if (!plan || isCorporate || location.pathname === "/payment/success") return null;
    if (plan.access_type === "premium") return "premium";
    if (plan.access_type === "trial" && plan.trial_active) return "trial";
    if (plan.trial_expired) return "expired";
    if (plan.trial_available) return "offer";
    return null;
  }, [plan, isCorporate, location.pathname]);

  if (!state) return null;

  const createCheckout = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/billing/create-checkout`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_id: "premium_monthly",
          origin_url: window.location.origin,
        }),
      });
      const data = await response.json();
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
    } catch {}
    setLoading(false);
  };

  const startTrial = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/billing/start-trial`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (response.ok) {
        setPlan(await response.json());
        await refreshUser?.();
      }
    } catch {}
    setLoading(false);
  };

  const copy = {
    offer: {
      icon: Sparkles,
      title: `Experimente Premium grátis por ${plan?.trial_days || 30} dias`,
      description: "Libere IA preditiva, exportação em PDF e relatórios completos durante o período de teste.",
      action: "Começar teste grátis",
      onClick: startTrial,
    },
    trial: {
      icon: ShieldCheck,
      title: `Premium Trial ativo: ${plan?.trial_days_remaining || 0} dias restantes`,
      description: "Você está usando todos os recursos Premium. Faça upgrade antes do fim para manter o acesso.",
      action: "Fazer upgrade",
      onClick: createCheckout,
    },
    premium: {
      icon: Crown,
      title: "Plano Premium ativo",
      description: "PDF, relatórios completos e IA preditiva liberados na sua conta.",
      action: "Ver relatório",
      onClick: () => navigate("/relatorio"),
    },
    expired: {
      icon: LockKeyhole,
      title: "Seu teste Premium terminou",
      description: "IA preditiva, PDF e relatórios completos estão bloqueados. Faça upgrade para continuar.",
      action: "Fazer upgrade",
      onClick: createCheckout,
    },
  }[state];

  const Icon = copy.icon;
  const tone = state === "expired" ? "rose" : state === "premium" ? "emerald" : "amber";
  const classes = {
    amber: "border-amber-400/25 bg-amber-400/[0.08] text-amber-50",
    emerald: "border-emerald-400/25 bg-emerald-400/[0.08] text-emerald-50",
    rose: "border-rose-400/25 bg-rose-400/[0.08] text-rose-50",
  }[tone];
  const buttonClasses = {
    amber: "bg-amber-400 text-black hover:bg-amber-300",
    emerald: "bg-emerald-400 text-black hover:bg-emerald-300",
    rose: "bg-rose-400 text-black hover:bg-rose-300",
  }[tone];
  const iconClasses = {
    amber: "border-amber-400/25 bg-amber-400/10 text-amber-300",
    emerald: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
    rose: "border-rose-400/25 bg-rose-400/10 text-rose-300",
  }[tone];

  return (
    <section className={`mb-2 rounded-xl border px-4 py-3 shadow-[0_14px_34px_rgba(0,0,0,0.22)] ${classes}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${iconClasses}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black">{copy.title}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-200/85">{copy.description}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={copy.onClick}
          disabled={loading}
          className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition disabled:opacity-60 ${buttonClasses}`}
        >
          {loading ? "Aguarde..." : copy.action}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}

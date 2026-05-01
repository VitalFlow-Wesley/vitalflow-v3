import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Crown, ShieldCheck, Sparkles } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const OFFER_ACCEPTED_KEY_PREFIX = "vitalflow:premium-trial-offer-accepted";
const PREMIUM_TRIAL_DAYS = 30;

const getIdentity = (user) => user?.id || user?.email || "guest";

const getDaysRemaining = (expiresAt) => {
  const expires = expiresAt ? new Date(expiresAt) : null;
  if (!expires || Number.isNaN(expires.getTime())) return null;
  return Math.max(0, Math.ceil((expires.getTime() - Date.now()) / 86400000));
};

export default function PremiumTrialBanner() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const identity = getIdentity(user);
  const storageKey = `${OFFER_ACCEPTED_KEY_PREFIX}:${identity}`;
  const [offerAccepted, setOfferAccepted] = useState(() => {
    try {
      return localStorage.getItem(storageKey) === "1";
    } catch {
      return false;
    }
  });

  const plan = String(user?.plan || "").toLowerCase();
  const accountType = String(user?.account_type || "").toLowerCase();
  const role = String(user?.nivel_acesso || user?.role || "").toLowerCase();
  const daysRemaining = getDaysRemaining(user?.premium_expires_at);
  const isPaidPremium =
    Boolean(user?.is_premium) && !user?.premium_expires_at && plan === "premium";
  const isCorporate =
    accountType === "corporate" ||
    Boolean(user?.is_b2b) ||
    role.includes("admin") ||
    role.includes("ceo");
  const isTrialActive = daysRemaining !== null && daysRemaining > 0;
  const isTrialExpired =
    daysRemaining === 0 || (!user?.is_premium && Boolean(user?.premium_expires_at));

  const state = useMemo(() => {
    if (isCorporate || isPaidPremium) return null;
    if (isTrialActive) return "active";
    if (isTrialExpired) return "expired";
    return offerAccepted ? "accepted" : "offer";
  }, [isCorporate, isPaidPremium, isTrialActive, isTrialExpired, offerAccepted]);

  if (!state || location.pathname === "/payment/success") return null;

  const copy = {
    offer: {
      icon: Sparkles,
      title: `Teste Premium de ${PREMIUM_TRIAL_DAYS} dias`,
      description:
        "Aceite o convite agora. O prazo só começa quando você parear seu primeiro wearable.",
      action: "Aceitar teste",
      onClick: () => {
        try {
          localStorage.setItem(storageKey, "1");
        } catch {}
        setOfferAccepted(true);
        navigate("/devices");
      },
    },
    accepted: {
      icon: ShieldCheck,
      title: "Teste Premium reservado",
      description:
        "Agora pareie seu wearable. Assim que o primeiro pareamento for concluído, os 30 dias começam a valer.",
      action: "Parear wearable",
      onClick: () => navigate("/devices"),
    },
    active: {
      icon: Crown,
      title: `Premium ativo: ${daysRemaining} dias restantes`,
      description:
        "Seu teste já começou. Aproveite relatórios, PDF e recursos avançados durante o período.",
      action: "Ver relatório",
      onClick: () => navigate("/relatorio"),
    },
    expired: {
      icon: Crown,
      title: "Seu teste Premium terminou",
      description:
        "Assine o Plano Premium para continuar com PDF, relatórios completos e recursos avançados.",
      action: "Fazer upgrade",
      onClick: async () => {
        try {
          const response = await fetch(
            `${process.env.REACT_APP_BACKEND_URL || "https://vitalflow.up.railway.app"}/api/billing/create-checkout`,
            {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                plan_id: "premium_monthly",
                origin_url: window.location.origin,
              }),
            }
          );
          const data = await response.json();
          if (data?.url) {
            window.location.href = data.url;
            return;
          }
        } catch {}
        navigate("/relatorio");
      },
    },
  }[state];

  const Icon = copy.icon;

  return (
    <section className="mb-2 rounded-xl border border-amber-400/25 bg-amber-400/[0.08] px-4 py-3 text-amber-50 shadow-[0_14px_34px_rgba(0,0,0,0.22)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-400/25 bg-amber-400/10">
            <Icon className="h-5 w-5 text-amber-300" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black text-amber-300">{copy.title}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-200/85">
              {copy.description}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={copy.onClick}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-2 text-xs font-black text-black transition hover:bg-amber-300"
        >
          {copy.action}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}

const fs = require("fs");
const path = require("path");

function patchDashboard() {
  const dashboardPath = path.join(__dirname, "..", "src", "pages", "Dashboard.js");
  let source = fs.readFileSync(dashboardPath, "utf8");

  if (!source.includes("LockKeyhole,")) {
    source = source.replace(/  RefreshCw,\r?\n}/, "  RefreshCw,\n  LockKeyhole,\n}");
  }

  if (!source.includes('import { useAuth } from "../contexts/AuthContext";')) {
    source = source.replace(
      /} from "lucide-react";\r?\n/,
      '} from "lucide-react";\nimport { useAuth } from "../contexts/AuthContext";\n'
    );
  }

  if (!source.includes("const { user } = useAuth();")) {
    source = source.replace(
      /export default function Dashboard\(\) \{\r?\n/,
      `export default function Dashboard() {\n  const { user } = useAuth();\n  const accessType = String(user?.access_type || \"\").toLowerCase();\n  const isB2BPlan = Boolean(user?.is_b2b) || accessType === \"b2b\";\n  const hasPremiumAccess = Boolean(user?.has_premium_access || user?.is_premium);\n  const planLabel = isB2BPlan\n    ? \"Plano B2B\"\n    : hasPremiumAccess\n    ? \"Plano Premium\"\n    : \"Plano Free\";\n\n`
    );
  }

  source = source.replace(
    /<ShieldCheck className="h-3\.5 w-3\.5 text-cyan-300" \/>\r?\n\s*<span className="font-semibold text-white">Plano Premium Ativo<\/span>/,
    `{isB2BPlan || hasPremiumAccess ? (\n            <ShieldCheck className="h-3.5 w-3.5 text-cyan-300" />\n          ) : (\n            <LockKeyhole className="h-3.5 w-3.5 text-rose-300" />\n          )}\n          <span className="font-semibold text-white">{planLabel}</span>`
  );

  fs.writeFileSync(dashboardPath, source);
}

function patchReport() {
  const reportPath = path.join(__dirname, "..", "src", "pages", "MeuRelatorioStable.jsx");
  let source = fs.readFileSync(reportPath, "utf8");
  const replacement = `const isPremiumPlan = (plan) => {\n  if (!plan) return false;\n  const subscriptionStatus = String(plan.subscription_status || \"\").toLowerCase();\n  const accessType = String(plan.access_type || \"\").toLowerCase();\n  const planName = String(plan.plan || \"\").toLowerCase();\n  const tier = String(plan.tier || \"\").toLowerCase();\n\n  return Boolean(\n    plan.has_premium_access ||\n      plan.features?.pdf_export ||\n      plan.is_premium ||\n      plan.isPremium ||\n      plan.premium ||\n      accessType === \"premium\" ||\n      accessType === \"b2b\" ||\n      (accessType === \"trial\" && plan.trial_active) ||\n      planName === \"premium\" ||\n      tier === \"premium\" ||\n      subscriptionStatus === \"active\" ||\n      subscriptionStatus === \"trialing\"\n  );\n};\n\nconst formatDate`;

  source = source.replace(
    /const isPremiumPlan = \(plan\) => \{[\s\S]*?\};\r?\n\r?\nconst formatDate/,
    replacement
  );

  fs.writeFileSync(reportPath, source);
}

patchDashboard();
patchReport();
console.log("Plan status and report premium checks patched for build.");

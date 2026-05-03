const fs = require("fs");
const path = require("path");

const dashboardPath = path.join(__dirname, "..", "src", "pages", "Dashboard.js");
let source = fs.readFileSync(dashboardPath, "utf8");

if (!source.includes("LockKeyhole,")) {
  source = source.replace("  RefreshCw,\n}", "  RefreshCw,\n  LockKeyhole,\n}");
}

if (!source.includes('import { useAuth } from "../contexts/AuthContext";')) {
  source = source.replace(
    '} from "lucide-react";\n',
    '} from "lucide-react";\nimport { useAuth } from "../contexts/AuthContext";\n'
  );
}

if (!source.includes("const { user } = useAuth();")) {
  source = source.replace(
    "export default function Dashboard() {\n",
    `export default function Dashboard() {\n  const { user } = useAuth();\n  const accessType = String(user?.access_type || \"\").toLowerCase();\n  const isB2BPlan = Boolean(user?.is_b2b) || accessType === \"b2b\";\n  const hasPremiumAccess = Boolean(user?.has_premium_access || user?.is_premium);\n  const planLabel = isB2BPlan\n    ? \"Plano B2B\"\n    : hasPremiumAccess\n    ? \"Plano Premium\"\n    : \"Plano Free\";\n\n`
  );
}

source = source.replace(
  /<ShieldCheck className="h-3\.5 w-3\.5 text-cyan-300" \/>\n\s*<span className="font-semibold text-white">Plano Premium Ativo<\/span>/,
  `{isB2BPlan || hasPremiumAccess ? (\n            <ShieldCheck className="h-3.5 w-3.5 text-cyan-300" />\n          ) : (\n            <LockKeyhole className="h-3.5 w-3.5 text-rose-300" />\n          )}\n          <span className="font-semibold text-white">{planLabel}</span>`
);

fs.writeFileSync(dashboardPath, source);
console.log("Dashboard plan status patched for Free/Premium/B2B.");

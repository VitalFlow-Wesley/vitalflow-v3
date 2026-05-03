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
  const premiumReplacement = `const isPremiumPlan = (plan) => {\n  if (!plan) return false;\n  const subscriptionStatus = String(plan.subscription_status || \"\").toLowerCase();\n  const accessType = String(plan.access_type || \"\").toLowerCase();\n  const planName = String(plan.plan || \"\").toLowerCase();\n  const tier = String(plan.tier || \"\").toLowerCase();\n\n  return Boolean(\n    plan.has_premium_access ||\n      plan.features?.pdf_export ||\n      plan.is_premium ||\n      plan.isPremium ||\n      plan.premium ||\n      accessType === \"premium\" ||\n      accessType === \"b2b\" ||\n      (accessType === \"trial\" && plan.trial_active) ||\n      planName === \"premium\" ||\n      tier === \"premium\" ||\n      subscriptionStatus === \"active\" ||\n      subscriptionStatus === \"trialing\"\n  );\n};\n\nconst formatDate`;

  source = source.replace(
    /const isPremiumPlan = \(plan\) => \{[\s\S]*?\};\r?\n\r?\nconst formatDate/,
    premiumReplacement
  );
  source = source.replace(
    /const showPdfPremiumNote = Boolean\(plan && !premium\);/,
    "const showPdfPremiumNote = false;"
  );

  const chartReplacement = `function TrendLineChart({ values }) {\n  const [hovered, setHovered] = useState(null);\n  const safeValues = values.length > 1 ? values : fallbackReport.trend;\n  const chart = { left: 8, right: 96, top: 10, bottom: 82 };\n  const points = safeValues.map((value, index) => {\n    const x = chart.left + (index * (chart.right - chart.left)) / Math.max(safeValues.length - 1, 1);\n    const y = chart.bottom - (Math.max(0, Math.min(100, value)) / 100) * (chart.bottom - chart.top);\n    return { value, x, y, label: String(20 + index) + \"/04\" };\n  });\n  const path = points.map((point) => point.x + \",\" + point.y).join(\" \" );\n  const fillPath = chart.left + \",\" + chart.bottom + \" \" + path + \" \" + chart.right + \",\" + chart.bottom;\n  const lowest = points.reduce((current, point) => (point.value < current.value ? point : current), points[0]);\n  const highest = points.reduce((current, point) => (point.value > current.value ? point : current), points[0]);\n  const last = points[points.length - 1];\n  const activePoint = hovered || null;\n  const annotations = [\n    { point: lowest, label: \"Carga de treino alta\", color: \"#fb7185\", anchor: \"middle\" },\n    { point: highest, label: \"Noite bem dormida\", color: \"#34d399\", anchor: \"middle\" },\n    { point: last, label: \"Dia de descanso\", color: \"#fbbf24\", anchor: \"end\" },\n  ];\n  const getTone = (point) => point.value < 65 ? { label: \"Crítico\", color: \"#fb7185\" } : point.value > 88 ? { label: \"Pico de recuperação\", color: \"#34d399\" } : { label: \"Estável\", color: \"#22d3ee\" };\n\n  return (\n    <div className=\"relative overflow-hidden rounded-xl border border-cyan-400/10 bg-[#071115]\" style={{ height: 208 }}>\n      <div className=\"absolute inset-0 bg-[radial-gradient(circle_at_50%_12%,rgba(34,211,238,0.10),transparent_34%)]\" />\n      <svg viewBox=\"0 0 100 100\" preserveAspectRatio=\"none\" className=\"absolute inset-0 h-full w-full\">\n        <defs>\n          <linearGradient id=\"trendFill\" x1=\"0\" x2=\"0\" y1=\"0\" y2=\"1\">\n            <stop offset=\"0%\" stopColor=\"#22d3ee\" stopOpacity=\"0.34\" />\n            <stop offset=\"72%\" stopColor=\"#22d3ee\" stopOpacity=\"0.10\" />\n            <stop offset=\"100%\" stopColor=\"#22d3ee\" stopOpacity=\"0.02\" />\n          </linearGradient>\n        </defs>\n        {[0, 25, 50, 75, 100].map((value) => {\n          const y = chart.bottom - (value / 100) * (chart.bottom - chart.top);\n          return <line key={value} x1={chart.left} x2={chart.right} y1={y} y2={y} stroke=\"rgba(255,255,255,0.08)\" strokeWidth=\"0.45\" vectorEffect=\"non-scaling-stroke\" />;\n        })}\n        {points.map((point) => (\n          <line key={point.label} x1={point.x} x2={point.x} y1={chart.top} y2={chart.bottom} stroke=\"rgba(255,255,255,0.035)\" strokeWidth=\"0.35\" vectorEffect=\"non-scaling-stroke\" />\n        ))}\n        {annotations.map(({ point, color }) => (\n          <line key={\"marker-\" + point.label} x1={point.x} x2={point.x} y1={point.y} y2={chart.bottom} stroke={color} strokeDasharray=\"2 2\" strokeOpacity=\"0.72\" strokeWidth=\"0.7\" vectorEffect=\"non-scaling-stroke\" />\n        ))}\n        <polygon points={fillPath} fill=\"url(#trendFill)\" />\n        <polyline points={path} fill=\"none\" stroke=\"#22d3ee\" strokeWidth=\"1.75\" strokeLinecap=\"round\" strokeLinejoin=\"round\" vectorEffect=\"non-scaling-stroke\" />\n        {points.map((point) => {\n          const isLow = point.value === lowest.value;\n          const isHigh = point.value === highest.value;\n          const isActive = activePoint?.label === point.label;\n          return (\n            <circle key={\"dot-\" + point.label} cx={point.x} cy={point.y} r={isActive ? \"2.8\" : isLow || isHigh ? \"2.15\" : \"1.75\"} fill={isLow ? \"#fb7185\" : isHigh ? \"#34d399\" : \"#22d3ee\"} stroke=\"#071115\" strokeWidth=\"0.85\" vectorEffect=\"non-scaling-stroke\" />\n          );\n        })}\n        {points.map((point, index) => {\n          const prev = points[index - 1];\n          const next = points[index + 1];\n          const left = prev ? (prev.x + point.x) / 2 : chart.left;\n          const right = next ? (next.x + point.x) / 2 : chart.right;\n          return <rect key={\"hit-\" + point.label} x={left} y={chart.top} width={right - left} height={chart.bottom - chart.top} fill=\"transparent\" onMouseEnter={() => setHovered(point)} onMouseMove={() => setHovered(point)} onMouseLeave={() => setHovered(null)} />;\n        })}\n      </svg>\n\n      <div className=\"absolute inset-y-5 left-3 flex flex-col justify-between text-[10px] font-semibold text-slate-500 pointer-events-none\">\n        {[100, 75, 50, 25, 0].map((value) => <span key={value}>{value}</span>)}\n      </div>\n      <div className=\"absolute left-12 right-8 top-4 flex justify-between text-[11px] font-black text-slate-100 pointer-events-none\">\n        {points.map((point) => <span key={\"v-\" + point.label}>{point.value}</span>)}\n      </div>\n      <div className=\"absolute left-12 right-8 bottom-9 flex justify-between text-[11px] text-slate-400 pointer-events-none\">\n        {points.map((point) => <span key={point.label}>{point.label}</span>)}\n      </div>\n      <div className=\"absolute left-12 right-8 bottom-3 h-7 pointer-events-none\">\n        {annotations.map(({ point, label, color, anchor }) => (\n          <span key={label} className=\"absolute max-w-[76px] text-[9px] font-bold leading-[1.05]\" style={{ left: (((point.x - chart.left) / (chart.right - chart.left)) * 100) + \"%\", transform: anchor === \"end\" ? \"translateX(-100%)\" : \"translateX(-50%)\", color, textAlign: anchor === \"end\" ? \"right\" : \"center\" }}>{label}</span>\n        ))}\n      </div>\n      {activePoint && (\n        <div className=\"pointer-events-none absolute z-10 min-w-[142px] rounded-xl border border-cyan-300/25 bg-[#071115]/95 px-3 py-2 text-xs shadow-[0_16px_34px_rgba(0,0,0,0.35)] backdrop-blur\" style={{ left: (((activePoint.x - chart.left) / (chart.right - chart.left)) * 100) + \"%\", top: Math.max(12, activePoint.y * 1.95 - 32), transform: activePoint.x > 78 ? \"translateX(-100%)\" : activePoint.x < 22 ? \"translateX(0)\" : \"translateX(-50%)\" }}>\n          <div className=\"text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400\">{activePoint.label}</div>\n          <div className=\"mt-1 flex items-end gap-2\"><span className=\"text-2xl font-black text-white\">{activePoint.value}</span><span className=\"pb-1 text-[10px] text-slate-400\">V-Score</span></div>\n          <div className=\"mt-1 text-[11px] font-bold\" style={{ color: getTone(activePoint).color }}>{getTone(activePoint).label}</div>\n        </div>\n      )}\n    </div>\n  );\n}\n\nexport default function MeuRelatorioStable`;

  source = source.replace(
    /function TrendLineChart\(\{ values \}\) \{[\s\S]*?\}\r?\n\r?\nexport default function MeuRelatorioStable/,
    chartReplacement
  );

  fs.writeFileSync(reportPath, source);
}

function patchCssOverrides() {
  const cssPath = path.join(__dirname, "..", "src", "index.css");
  let css = fs.readFileSync(cssPath, "utf8");

  css = css.replace(/#root \.space-y-1\.text-white > div\.flex\.flex-wrap\.items-center\.gap-5\.rounded-xl > div:first-child > span \{[\s\S]*?\}\s*/g, "");
  css = css.replace(/#root \.space-y-1\.text-white > div\.flex\.flex-wrap\.items-center\.gap-5\.rounded-xl > div:first-child > span::after \{[\s\S]*?\}\s*/g, "");
  css = css.replace(/#root \[data-testid="export-pdf-btn"\] ~ div \{[\s\S]*?\}\s*/g, "");
  css = css.replace(/#root \[data-testid="export-pdf-btn"\]:has\(svg\.lucide-lock\) \{[\s\S]*?\}\s*/g, "");
  css = css.replace(/#root \[data-testid="export-pdf-btn"\]:has\(svg\.lucide-lock\)::after \{[\s\S]*?\}\s*/g, "");

  fs.writeFileSync(cssPath, css);
}

patchDashboard();
patchReport();
patchCssOverrides();
console.log("Plan status, report premium checks, and interactive V-Score chart patched for build.");

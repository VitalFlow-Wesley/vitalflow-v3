const fs = require("fs");
const path = require("path");

const reportPath = path.join(__dirname, "..", "src", "pages", "MeuRelatorioStable.jsx");
let source = fs.readFileSync(reportPath, "utf8");

source = source
  .replace(
    /className="pointer-events-none absolute z-10 min-w-\[142px\] rounded-xl border border-cyan-300\/25 bg-\[#071115\]\/95 px-3 py-2 text-xs shadow-\[0_16px_34px_rgba\(0,0,0,0\.35\)\] backdrop-blur"/g,
    'className="pointer-events-none absolute z-10 w-[72px] rounded-md border border-cyan-300/15 bg-[#071115]/90 px-1.5 py-1 text-[9px] shadow-[0_6px_14px_rgba(0,0,0,0.26)] backdrop-blur"'
  )
  .replace(
    /className="pointer-events-none absolute z-10 min-w-\[96px\] rounded-lg border border-cyan-300\/20 bg-\[#071115\]\/95 px-2 py-1\.5 text-\[10px\] shadow-\[0_10px_22px_rgba\(0,0,0,0\.30\)\] backdrop-blur"/g,
    'className="pointer-events-none absolute z-10 w-[72px] rounded-md border border-cyan-300/15 bg-[#071115]/90 px-1.5 py-1 text-[9px] shadow-[0_6px_14px_rgba(0,0,0,0.26)] backdrop-blur"'
  )
  .replace(
    /top: Math\.max\(12, activePoint\.y \* 1\.95 - 32\)/g,
    "top: Math.max(8, activePoint.y * 1.95 - 18)"
  )
  .replace(
    /top: Math\.max\(10, activePoint\.y \* 1\.95 - 24\)/g,
    "top: Math.max(8, activePoint.y * 1.95 - 18)"
  )
  .replace(
    /className="text-\[10px\] font-bold uppercase tracking-\[0\.22em\] text-slate-400"/g,
    'className="text-[8px] font-bold uppercase tracking-[0.08em] text-slate-400"'
  )
  .replace(
    /className="text-\[9px\] font-bold uppercase tracking-\[0\.16em\] text-slate-400"/g,
    'className="text-[8px] font-bold uppercase tracking-[0.08em] text-slate-400"'
  )
  .replace(
    /className="mt-1 flex items-end gap-2"/g,
    'className="mt-0 flex items-baseline gap-0.5"'
  )
  .replace(
    /className="mt-0\.5 flex items-end gap-1"/g,
    'className="mt-0 flex items-baseline gap-0.5"'
  )
  .replace(
    /className="text-2xl font-black text-white"/g,
    'className="text-base font-black text-white"'
  )
  .replace(
    /className="text-lg font-black text-white"/g,
    'className="text-base font-black text-white"'
  )
  .replace(
    /className="pb-1 text-\[10px\] text-slate-400"/g,
    'className="text-[8px] text-slate-400"'
  )
  .replace(
    /className="pb-0\.5 text-\[9px\] text-slate-400"/g,
    'className="text-[8px] text-slate-400"'
  )
  .replace(
    /className="mt-1 text-\[11px\] font-bold"/g,
    'className="mt-0 text-[8px] font-bold leading-none"'
  )
  .replace(
    /className="mt-0\.5 text-\[10px\] font-bold"/g,
    'className="mt-0 text-[8px] font-bold leading-none"'
  );

fs.writeFileSync(reportPath, source);
console.log("V-Score tooltip compacted for build.");

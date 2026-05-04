const fs = require("fs");
const path = require("path");

const dashboardPath = path.join(__dirname, "..", "src", "pages", "Dashboard.js");
let source = fs.readFileSync(dashboardPath, "utf8");

source = source
  .replace(
    /<div className="grid gap-2 xl:grid-cols-\[1\.1fr_0\.9fr\]">/g,
    '<div className="grid gap-2">'
  )
  .replace(
    /<PremiumCard className="p-3">\n          <div className="mb-3 flex items-center justify-between">\n            <SectionLabel>Evolução do V-Score<\/SectionLabel>/g,
    '<PremiumCard className="order-2 p-3">\n          <div className="mb-3 flex items-center justify-between">\n            <SectionLabel>Evolução do V-Score</SectionLabel>'
  )
  .replace(
    /<PremiumCard className="p-3">\n          <SectionLabel>Métricas do momento<\/SectionLabel>/g,
    '<PremiumCard className="order-1 p-3">\n          <SectionLabel>Métricas do momento</SectionLabel>'
  )
  .replace(
    /<div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-4">/g,
    '<div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">'
  )
  .replace(
    /<div className="h-\[210px\]">/g,
    '<div className="h-[240px]">'
  );

fs.writeFileSync(dashboardPath, source);
console.log("Dashboard metrics stacked above V-Score chart for build.");

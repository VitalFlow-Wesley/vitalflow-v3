const EnergyStatus = ({ status }) => {
  if (!status) return null;

  const raw = String(status.status_visual || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  let visual;

  if (raw.includes("critico") || raw.includes("vermelho")) {
    visual = {
      label: "Crítico",
      color: "#f43f5e",
      bg: "bg-rose-500/10",
      border: "border-rose-500/30",
      text: "text-rose-400",
    };
  } else if (raw.includes("atencao") || raw.includes("amarelo")) {
    visual = {
      label: "Atenção",
      color: "#fbbf24",
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
      text: "text-amber-400",
    };
  } else {
    visual = {
      label: "Normal",
      color: "#34d399",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
      text: "text-emerald-400",
    };
  }

  return (
    <div className={`flex items-center gap-3 px-4 py-2 rounded-full border ${visual.border} ${visual.bg}`}>
      <div
        className="w-3 h-3 rounded-full"
        style={{ backgroundColor: visual.color }}
      />
      <span className={`text-sm font-semibold ${visual.text}`}>
        {visual.label}
      </span>
    </div>
  );
};
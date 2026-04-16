export const STATUS_UI = {
  Verde: {
    label: "Normal",
    color: "#34d399",
    text: "text-emerald-400",
    border: "border-emerald-400/30",
    bg: "bg-emerald-400/10",
    button: "bg-emerald-500 hover:bg-emerald-400",
  },
  Amarelo: {
    label: "Atenção",
    color: "#fbbf24",
    text: "text-amber-400",
    border: "border-amber-400/30",
    bg: "bg-amber-400/10",
    button: "bg-amber-500 hover:bg-amber-400",
  },
  Vermelho: {
    label: "Crítico",
    color: "#f43f5e",
    text: "text-rose-500",
    border: "border-rose-500/30",
    bg: "bg-rose-500/10",
    button: "bg-rose-500 hover:bg-rose-400",
  },
};

export const getStatusUI = (status) => {
  return STATUS_UI[status] || STATUS_UI.Verde;
};
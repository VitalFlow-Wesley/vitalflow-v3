import React from "react";
import { useSimulation, SIMULATION_SCENARIOS } from "../contexts/SimulationContext";

export function SimulationBanner() {
  const { isSimulating, activeScenario, deactivateSimulation } = useSimulation();

  if (!isSimulating) return null;

  const scenarioLabel =
    activeScenario === "custom"
      ? "Personalizado"
      : SIMULATION_SCENARIOS[activeScenario]?.label ?? activeScenario;

  return (
    <div style={styles.banner}>
      <div style={styles.left}>
        <span style={styles.icon}>⚗️</span>
        <span style={styles.text}>
          <strong>MODO SIMULAÇÃO ATIVO</strong>
          <span style={styles.scenario}> — Cenário: {scenarioLabel}</span>
          <span style={styles.sub}>
            {" "}· Os dados exibidos são simulados. Nenhum dado real foi alterado.
          </span>
        </span>
      </div>
      <button
        style={styles.button}
        onClick={deactivateSimulation}
        title="Encerrar modo simulação"
      >
        ✕ Encerrar simulação
      </button>
    </div>
  );
}

const styles = {
  banner: {
    position: "sticky",
    top: 0,
    zIndex: 9999,
    background: "linear-gradient(90deg, #451a03 0%, #78350f 100%)",
    borderBottom: "1px solid #f59e0b",
    padding: "8px 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    fontFamily: "inherit",
    fontSize: "13px",
    color: "#fef3c7",
    boxShadow: "0 2px 8px rgba(245,158,11,0.25)",
  },
  left: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },
  icon: { fontSize: "16px", flexShrink: 0 },
  text: { lineHeight: 1.4 },
  scenario: { color: "#fcd34d" },
  sub: { color: "#fde68a", opacity: 0.8, fontSize: "12px" },
  button: { background: "transparent", border: "1px solid #f59e0b", color: "#fcd34d", padding: "4px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "600", whiteSpace: "nowrap", transition: "background 0.15s", flexShrink: 0 },
};

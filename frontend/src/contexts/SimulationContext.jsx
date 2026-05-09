import React, { createContext, useContext, useState, useCallback } from "react";

// ─── Cenários pré-definidos (espelha os do Simulador) ───────────────────────
export const SIMULATION_SCENARIOS = {
  dia_ideal: {
    label: "Dia ideal",
    data: { bpm: 58, hrv: 72, sleep: 8.2, stress: 15, steps: 9500, spo2: 99 },
  },
  manutencao: {
    label: "Manutenção",
    data: { bpm: 66, hrv: 54, sleep: 7.3, stress: 32, steps: 5200, spo2: 98 },
  },
  sobrecarga: {
    label: "Sobrecarga",
    data: { bpm: 82, hrv: 28, sleep: 5.5, stress: 74, steps: 3100, spo2: 96 },
  },
  sono_ruim: {
    label: "Sono ruim",
    data: { bpm: 76, hrv: 34, sleep: 4.2, stress: 61, steps: 4200, spo2: 97 },
  },
  treino_intenso: {
    label: "Treino intenso",
    data: { bpm: 88, hrv: 22, sleep: 6.8, stress: 68, steps: 14000, spo2: 97 },
  },
  recuperacao: {
    label: "Recuperação",
    data: { bpm: 62, hrv: 48, sleep: 7.8, stress: 28, steps: 2800, spo2: 98 },
  },
};

// ─── Helpers: converte dados simulados no formato exato que o Dashboard espera ─
function buildSimulatedLatest(d) {
  return {
    bpm: d.bpm,
    heart_rate: d.bpm,
    hrv: d.hrv,
    spo2: d.spo2,
    steps: d.steps,
    recorded_at: new Date().toISOString(),
  };
}

function buildSimulatedHealthTrend(d) {
  const vScore = calcVScore(d);
  // Gera 7 pontos de histórico simulado em torno do valor atual
  const v_scores_7d = Array.from({ length: 7 }, (_, i) => ({
    date: new Date(Date.now() - (6 - i) * 86400000).toISOString().split("T")[0],
    v_score: Math.max(0, Math.min(100, vScore + (Math.random() - 0.5) * 10)),
  }));

  return {
    trend: d.stress > 60 ? "falling" : d.hrv > 50 ? "stable" : "falling",
    avg_7d: vScore,
    v_score: vScore,
    vScore: vScore,
    requires_intervention: d.stress > 65,
    intervention_message:
      d.stress > 65 ? "Reduza a carga e priorize recuperação nas próximas 24h." : null,
    v_scores_7d,
    sleep_hours: d.sleep,
    stress_level: d.stress,
    steps: d.steps,
  };
}

function buildSimulatedHistory(d) {
  // Gera 30 entradas fake no formato que o Dashboard usa
  return Array.from({ length: 30 }, (_, i) => ({
    bpm: d.bpm + Math.floor((Math.random() - 0.5) * 6),
    heart_rate: d.bpm + Math.floor((Math.random() - 0.5) * 6),
    hrv: d.hrv + Math.floor((Math.random() - 0.5) * 8),
    spo2: d.spo2,
    steps: Math.floor(d.steps * (0.8 + Math.random() * 0.4)),
    v_score: calcVScore(d) + (Math.random() - 0.5) * 8,
    recorded_at: new Date(Date.now() - i * 3600000).toISOString(),
  }));
}

function buildSimulatedMorningReport(d) {
  const vScore = calcVScore(d);
  const mode =
    vScore >= 80
      ? "Dia ideal"
      : vScore >= 60
      ? "Manutenção"
      : vScore >= 40
      ? "Atenção"
      : "Recuperação";

  return {
    v_score: vScore,
    mode,
    sleep_hours: d.sleep,
    stress_level: d.stress,
    recommendation: `Estado simulado: ${mode}. Dados de teste ativos.`,
    priority: d.stress > 60 ? "Alta" : "Baixa",
    ideal_window: "Agora",
    focus: mode,
    next_evaluation: "Em 3h",
  };
}

function buildSimulatedAlert(d) {
  if (d.stress > 65) {
    return {
      level: "warning",
      message: "Stress elevado detectado. Considere pausar atividades intensas.",
      type: "stress",
    };
  }
  if (d.hrv < 30) {
    return {
      level: "critical",
      message: "HRV baixa. Priorize recuperação.",
      type: "hrv",
    };
  }
  return {
    level: "info",
    message: "Sinais dentro do esperado para o cenário simulado.",
    type: "normal",
  };
}

// V-Score simplificado (espelha a lógica do backend)
function calcVScore(d) {
  let score = 100;
  // HRV (0-100ms → peso alto)
  if (d.hrv < 20) score -= 30;
  else if (d.hrv < 40) score -= 15;
  else if (d.hrv < 55) score -= 5;
  // BPM repouso
  if (d.bpm > 85) score -= 20;
  else if (d.bpm > 75) score -= 10;
  else if (d.bpm > 70) score -= 5;
  // Stress
  if (d.stress > 70) score -= 20;
  else if (d.stress > 50) score -= 10;
  else if (d.stress > 35) score -= 5;
  // Sono
  if (d.sleep < 5) score -= 20;
  else if (d.sleep < 6.5) score -= 10;
  else if (d.sleep < 7) score -= 5;
  // SpO2
  if (d.spo2 < 94) score -= 15;
  else if (d.spo2 < 96) score -= 5;
  return Math.max(0, Math.min(100, Math.round(score)));
}

// ─── Context ────────────────────────────────────────────────────────────────
const SimulationContext = createContext(null);

export function SimulationProvider({ children }) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedData, setSimulatedData] = useState(
    SIMULATION_SCENARIOS.manutencao.data
  );
  const [activeScenario, setActiveScenario] = useState("manutencao");

  const activateSimulation = useCallback((data, scenarioKey = "custom") => {
    setSimulatedData(data);
    setActiveScenario(scenarioKey);
    setIsSimulating(true);
  }, []);

  const deactivateSimulation = useCallback(() => {
    setIsSimulating(false);
  }, []);

  const updateSlider = useCallback((key, value) => {
    setSimulatedData((prev) => {
      const updated = { ...prev, [key]: value };
      return updated;
    });
    setActiveScenario("custom");
    setIsSimulating(true); // ativa automaticamente ao mexer slider
  }, []);

  // Retorna os dados simulados no formato exato que o Dashboard consome
  const getSimulatedApiData = useCallback(() => {
    if (!isSimulating) return null;
    return {
      latest: buildSimulatedLatest(simulatedData),
      healthTrend: buildSimulatedHealthTrend(simulatedData),
      history: buildSimulatedHistory(simulatedData),
      morningReport: buildSimulatedMorningReport(simulatedData),
      alert: buildSimulatedAlert(simulatedData),
      raw: simulatedData,
    };
  }, [isSimulating, simulatedData]);

  return (
    <SimulationContext.Provider
      value={{
        isSimulating,
        simulatedData,
        activeScenario,
        activateSimulation,
        deactivateSimulation,
        updateSlider,
        getSimulatedApiData,
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation() {
  const ctx = useContext(SimulationContext);
  if (!ctx) throw new Error("useSimulation precisa estar dentro de SimulationProvider");
  return ctx;
}

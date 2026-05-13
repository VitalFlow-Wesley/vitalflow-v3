export const SIMULATION_STORAGE_KEY = "vitalflow:active-google-simulation";
export const LEGACY_SIMULATION_STORAGE_KEY = "vitalflow:latest-simulation";
export const SIMULATION_EVENT = "vitalflow:simulation-updated";

const DAY = 24 * 60 * 60 * 1000;

const toneMeta = {
  normal: {
    label: "Normal",
    status: "normal",
    risk: "Baixo",
    driver: "Equilibrio fisiologico",
    recommendation: "Manutencao positiva",
    explanation: "Seu estado esta estavel, HRV preservada e stress controlado. Este e o momento ideal para manter consistencia.",
    focus: "Manutencao leve",
  },
  manutencao: {
    label: "Manutencao",
    status: "normal",
    risk: "Moderado",
    driver: "Equilibrio fisiologico",
    recommendation: "Manutencao positiva",
    explanation: "Sinais estaveis com pequenas oportunidades de recuperacao. Mantenha rotina leve e sono regular.",
    focus: "Manutencao leve",
  },
  atencao: {
    label: "Atencao",
    status: "atencao",
    risk: "Elevado",
    driver: "Sobrecarga acumulada",
    recommendation: "Recuperacao leve",
    explanation: "Ha sinais de sobrecarga. Reduza intensidade, priorize hidratacao e uma pausa curta para estabilizar.",
    focus: "Recuperacao leve",
  },
  critico: {
    label: "Critico",
    status: "critico",
    risk: "Alto",
    driver: "Sono insuficiente",
    recommendation: "Recuperacao prioritaria",
    explanation: "Seu corpo indica necessidade de recuperacao. Bloqueie esforcos intensos e priorize descanso nas proximas horas.",
    focus: "Recuperacao prioritaria",
  },
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
const number = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export function scoreFromVitals(values = {}) {
  const bpm = number(values.bpm ?? values.resting_bpm, 70);
  const hrv = number(values.hrv, 55);
  const sleep = number(values.sleep ?? values.sleep_hours, 7.2);
  const stress = number(values.stress, 25);
  const spo2 = number(values.spo2, 98);
  const steps = number(values.steps, 6000);

  const bpmScore = clamp(100 - Math.abs(bpm - 64) * 2.2, 20, 100);
  const hrvScore = clamp((hrv / 72) * 100, 15, 100);
  const sleepScore = clamp((sleep / 8) * 100, 10, 100);
  const stressScore = clamp(100 - stress * 1.35, 5, 100);
  const spo2Score = clamp((spo2 - 90) * 12.5, 10, 100);
  const stepsScore = clamp((steps / 9000) * 100, 15, 100);

  return Math.round(
    bpmScore * 0.16 +
      hrvScore * 0.24 +
      sleepScore * 0.22 +
      stressScore * 0.22 +
      spo2Score * 0.08 +
      stepsScore * 0.08
  );
}

export function toneFromScore(score) {
  const value = number(score, 0);
  if (value >= 85) return "normal";
  if (value >= 68) return "manutencao";
  if (value >= 50) return "atencao";
  return "critico";
}

function normalizeSimulation(input) {
  if (!input) return null;
  const values = {
    bpm: number(input.values?.bpm ?? input.bpm, 70),
    hrv: number(input.values?.hrv ?? input.hrv, 55),
    sleep: number(input.values?.sleep ?? input.sleep, 7),
    stress: number(input.values?.stress ?? input.stress, 25),
    steps: number(input.values?.steps ?? input.steps, 6000),
    spo2: number(input.values?.spo2 ?? input.spo2, 98),
  };
  const score = clamp(Math.round(number(input.result?.score ?? input.score ?? input.v_score ?? input.vScore, scoreFromVitals(values))), 0, 100);
  const tone = input.result?.tone || input.tone || toneFromScore(score);
  const meta = toneMeta[tone] || toneMeta.manutencao;
  const scenario = input.scenario || { id: input.scenarioId || tone, label: input.scenarioLabel || meta.label };

  return {
    ...input,
    scenario,
    values,
    result: {
      ...(input.result || {}),
      score,
      tone,
      confidence: clamp(Math.round(number(input.result?.confidence, 70)), 35, 98),
    },
    score,
    v_score: score,
    vScore: score,
    tone,
    status: meta.status,
    statusLabel: meta.label,
    scenarioLabel: scenario.label || meta.label,
    savedAt: input.savedAt || new Date().toISOString(),
  };
}

function metricStatus(tone, normalText = "Normal") {
  if (tone === "critico") return "Critico";
  if (tone === "atencao") return "Atencao";
  if (tone === "manutencao") return "Bom";
  return normalText;
}

function buildHistory(payload) {
  const score = payload.score;
  const tone = payload.tone;
  const values = payload.values;
  const offsetsByTone = {
    normal: [0, -4, -8, -2, -6, -10, -5],
    manutencao: [0, 5, -3, 4, -6, 2, -8],
    atencao: [0, 7, -8, 9, -10, 4, -12],
    critico: [0, 11, -6, 16, -12, 8, -18],
  };
  const offsets = offsetsByTone[tone] || offsetsByTone.manutencao;

  return offsets.map((offset, index) => {
    const value = clamp(score + offset, 0, 100);
    return {
      id: `sim-${index}`,
      created_at: new Date(Date.now() - index * DAY).toISOString(),
      timestamp: new Date(Date.now() - index * DAY).toISOString(),
      v_score: value,
      vScore: value,
      score: value,
      status: toneMeta[tone].status,
      status_label: toneMeta[tone].label,
      tone,
      context: payload.scenarioLabel,
      bpm: Math.round(values.bpm + index * 0.7),
      hrv: Math.round(values.hrv - index * 0.8),
      sleep_hours: Number(Math.max(3.5, values.sleep + (index % 2 ? 0.2 : -0.1)).toFixed(1)),
      stress: Math.round(values.stress + index * 1.5),
      steps: Math.max(0, Math.round(values.steps - index * 280)),
      spo2: values.spo2,
    };
  });
}

export function saveActiveSimulation(simulation) {
  const payload = normalizeSimulation(simulation);
  if (typeof window === "undefined" || !payload) return payload;
  const serialized = JSON.stringify(payload);
  window.localStorage.setItem(SIMULATION_STORAGE_KEY, serialized);
  window.localStorage.setItem(LEGACY_SIMULATION_STORAGE_KEY, serialized);
  window.dispatchEvent(new CustomEvent(SIMULATION_EVENT, { detail: payload }));
  try {
    window.dispatchEvent(new StorageEvent("storage", { key: SIMULATION_STORAGE_KEY, newValue: serialized }));
  } catch (error) {
    window.dispatchEvent(new Event("storage"));
  }
  return payload;
}

export function getActiveSimulation() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SIMULATION_STORAGE_KEY) || window.localStorage.getItem(LEGACY_SIMULATION_STORAGE_KEY);
    return raw ? normalizeSimulation(JSON.parse(raw)) : null;
  } catch (error) {
    return null;
  }
}

export function clearActiveSimulation() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SIMULATION_STORAGE_KEY);
  window.localStorage.removeItem(LEGACY_SIMULATION_STORAGE_KEY);
  delete window.document.documentElement.dataset.vitalflowTone;
  window.dispatchEvent(new CustomEvent(SIMULATION_EVENT, { detail: null }));
  window.dispatchEvent(new Event("storage"));
}

export function simulationToDashboardData(simulation) {
  const payload = normalizeSimulation(simulation);
  if (!payload) return null;

  const meta = toneMeta[payload.tone] || toneMeta.manutencao;
  const history = buildHistory(payload);
  const latest = history[0];
  const hasAlert = payload.tone === "atencao" || payload.tone === "critico";

  const morningReport = {
    ...payload.values,
    score: payload.score,
    v_score: payload.score,
    vScore: payload.score,
    status: meta.status,
    status_label: meta.label,
    visual_state: meta.label,
    tone: payload.tone,
    context: payload.scenarioLabel,
    scenario_label: payload.scenarioLabel,
    recommendation_title: meta.recommendation,
    recommendation: meta.recommendation,
    recommendation_reason: meta.explanation,
    focus: meta.focus,
    risk: meta.risk,
    driver: meta.driver,
    calories: Math.round(payload.values.steps * 0.058),
    distance: Number((payload.values.steps * 0.00072).toFixed(1)),
    active_minutes: Math.round(payload.values.steps / 120),
    readings_count: 3,
  };

  return {
    ...payload,
    latest,
    history,
    healthTrend: {
      score: payload.score,
      v_score: payload.score,
      vScore: payload.score,
      avg_7d: payload.score,
      current_score: payload.score,
      trend: payload.tone === "critico" ? "falling" : payload.tone === "atencao" ? "attention" : "stable",
      trend_label: meta.label,
      status: meta.status,
      visual_state: meta.label,
      tone: payload.tone,
      scenario_label: payload.scenarioLabel,
    },
    morningReport,
    report: morningReport,
    predictiveAlert: {
      has_alert: hasAlert,
      alert_level: payload.tone,
      score: payload.score,
      tone: payload.tone,
      status: meta.status,
      title: hasAlert ? meta.recommendation : "Estabilidade mantida",
      alert: hasAlert ? meta.recommendation : "Sem alerta preventivo",
      description: meta.explanation,
      target_system: meta.driver,
    },
    alert: {
      has_alert: hasAlert,
      alert_level: payload.tone,
      title: hasAlert ? meta.recommendation : "Estabilidade mantida",
      description: meta.explanation,
    },
    connectedDevice: {
      provider: "Google Fit",
      status: "simulated",
      source: "simulador",
      last_sync_at: payload.savedAt,
      signal_quality: payload.tone === "critico" ? "Baixa" : "Boa",
      coverage: payload.tone === "critico" ? 54 : 82,
    },
    recommendation: meta.recommendation,
    explanation: meta.explanation,
  };
}

export function simulationToReportData(simulation, days = 7) {
  const data = simulationToDashboardData(simulation);
  if (!data) return null;
  return {
    ...data,
    period_days: days,
    entries: data.history.slice(0, days),
    report_summary: data.explanation,
  };
}

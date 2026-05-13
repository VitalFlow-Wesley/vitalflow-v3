import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  clearActiveSimulation,
  getActiveSimulation,
  SIMULATION_EVENT,
  simulationToDashboardData,
} from "../utils/simulationData";

const SimulationContext = createContext({
  isSimulating: false,
  simulation: null,
  activeSimulation: null,
  getSimulatedApiData: () => null,
  clearSimulation: () => {},
});

function SimulationToneStyles() {
  return (
    <style>{`
      html[data-vitalflow-tone="atencao"] .text-emerald-300,
      html[data-vitalflow-tone="atencao"] .text-emerald-400,
      html[data-vitalflow-tone="atencao"] .text-green-300,
      html[data-vitalflow-tone="atencao"] .text-green-400 { color: #facc15 !important; }
      html[data-vitalflow-tone="atencao"] .border-emerald-400,
      html[data-vitalflow-tone="atencao"] .border-green-400,
      html[data-vitalflow-tone="atencao"] .border-cyan-400 { border-color: rgba(250, 204, 21, 0.5) !important; }
      html[data-vitalflow-tone="atencao"] .bg-emerald-500,
      html[data-vitalflow-tone="atencao"] .bg-green-500,
      html[data-vitalflow-tone="atencao"] .from-emerald-400,
      html[data-vitalflow-tone="atencao"] .from-emerald-500 { --tw-gradient-from: #facc15 var(--tw-gradient-from-position) !important; background-color: #facc15 !important; }
      html[data-vitalflow-tone="atencao"] .to-emerald-400,
      html[data-vitalflow-tone="atencao"] .to-emerald-500 { --tw-gradient-to: #f59e0b var(--tw-gradient-to-position) !important; }

      html[data-vitalflow-tone="critico"] .text-emerald-300,
      html[data-vitalflow-tone="critico"] .text-emerald-400,
      html[data-vitalflow-tone="critico"] .text-green-300,
      html[data-vitalflow-tone="critico"] .text-green-400 { color: #fb7185 !important; }
      html[data-vitalflow-tone="critico"] .border-emerald-400,
      html[data-vitalflow-tone="critico"] .border-green-400,
      html[data-vitalflow-tone="critico"] .border-cyan-400 { border-color: rgba(251, 113, 133, 0.55) !important; }
      html[data-vitalflow-tone="critico"] .bg-emerald-500,
      html[data-vitalflow-tone="critico"] .bg-green-500,
      html[data-vitalflow-tone="critico"] .from-emerald-400,
      html[data-vitalflow-tone="critico"] .from-emerald-500 { --tw-gradient-from: #fb7185 var(--tw-gradient-from-position) !important; background-color: #fb7185 !important; }
      html[data-vitalflow-tone="critico"] .to-emerald-400,
      html[data-vitalflow-tone="critico"] .to-emerald-500 { --tw-gradient-to: #e11d48 var(--tw-gradient-to-position) !important; }
    `}</style>
  );
}

function useSimulationState() {
  const [simulation, setSimulation] = useState(() => getActiveSimulation());

  useEffect(() => {
    let lastSignature = "";
    const refresh = (event) => {
      const next = event?.detail === undefined ? getActiveSimulation() : event.detail;
      const signature = JSON.stringify(next || null);
      if (signature !== lastSignature) {
        lastSignature = signature;
        setSimulation(next || null);
      }
    };

    refresh();
    const interval = window.setInterval(refresh, 1000);
    window.addEventListener(SIMULATION_EVENT, refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener(SIMULATION_EVENT, refresh);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  const dashboardData = useMemo(() => simulationToDashboardData(simulation), [simulation]);

  useEffect(() => {
    if (!dashboardData?.tone) {
      delete document.documentElement.dataset.vitalflowTone;
      return;
    }
    document.documentElement.dataset.vitalflowTone = dashboardData.tone;
  }, [dashboardData?.tone]);

  return useMemo(
    () => ({
      isSimulating: Boolean(dashboardData),
      simulation,
      activeSimulation: simulation,
      getSimulatedApiData: () => {
        if (!dashboardData) return null;
        return {
          ...dashboardData,
          latest: dashboardData.latest || dashboardData.history?.[0],
          history: dashboardData.history,
          healthTrend: dashboardData.healthTrend,
          morningReport: dashboardData.morningReport,
          report: dashboardData.report,
          alert: dashboardData.alert,
          predictiveAlert: dashboardData.predictiveAlert,
          connectedDevice: dashboardData.connectedDevice,
        };
      },
      clearSimulation: () => {
        clearActiveSimulation();
        setSimulation(null);
      },
    }),
    [dashboardData, simulation]
  );
}

export function SimulationProvider({ children }) {
  const value = useSimulationState();

  return (
    <SimulationContext.Provider value={value}>
      <SimulationToneStyles />
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation() {
  return useContext(SimulationContext);
}

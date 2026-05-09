import { useState, useCallback } from "react";
import { useSimulation } from "../contexts/SimulationContext";

export function useDashboardData({ authHeaders, API }) {
  const { isSimulating, getSimulatedApiData } = useSimulation();
  const [history, setHistory] = useState([]);
  const [healthTrend, setHealthTrend] = useState(null);
  const [morningReport, setMorningReport] = useState(null);
  const [predictiveAlert, setPredictiveAlert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      setError(null);
      try {
        if (isSimulating) {
          const sim = getSimulatedApiData();
          if (sim) {
            setHistory(sim.history);
            setHealthTrend(sim.healthTrend);
            setMorningReport(sim.morningReport);
            setPredictiveAlert(sim.alert);
            return { history: sim.history, healthTrend: sim.healthTrend, morningReport: sim.morningReport, predictiveAlert: sim.alert };
          }
        }
        const headers = authHeaders();
        const [histRes, trendRes, reportRes, alertRes] = await Promise.all([
          fetch(`${APIY/history?limit=30`, { headers }),
          fetch(`${APIY/health/trend`, { headers }),
          fetch(`${API}/health/morning-report`, { headers }),
          fetch(`${API}/predictive/alert`, { headers }),
        ]);
        const [histData, trendData, reportData, alertData] = await Promise.all([
          histRes.ok ? histRes.json() : [],
          trendRes.ok ? trendRes.json() : null,
          reportRes.ok ? reportRes.json() : null,
          alertRes.ok ? alertRes.json() : null,
        ]);
        setHistory(histData);
        setHealthTrend(trendData);
        setMorningReport(reportData);
        setPredictiveAlert(alertData);
        return { history: histData, healthTrend: trendData, morningReport: reportData, predictiveAlert: alertData };
      } catch (err) {
        setError(err.message);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [isSimulating, getSimulatedApiData, authHeaders, API]
  );

  return { fetchDashboardData, history, healthTrend, morningReport, predictiveAlert, loading, error, isSimulating };
}

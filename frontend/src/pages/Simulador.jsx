import React from "react";
import { useSimulation, SIMULATION_SCENARIOS } from "../contexts/SimulationContext";

function Slider({ label, value, min, max, step = 1, unit, onChange }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={S.card}>
      <div style={S.row}>
        <span style={S.label}>{label}</span>
        <span style={S.val}>{typeof value === "number" && !Number.isInteger(value) ? value.toFixed(1) : value}<span style={S.unit}> {unit}</span></span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ ...S.input, background: `linear-gradient(to right, #2dd4bf 0%, #2dd4bf ${pct}%, #374151 ${pct}%, #374151 100%)` }} />
    </div>
  );
}

function calc(d) {
  let score = 100;
  if (d.hrv < 20) score -= 30; else if (d.hrv < 40) score -= 15; else if (d.hrv < 55) score -= 5;
  if (d.bpm > 85) score -= 20; else if (d.bpm > 75) score -= 10; else if (d.bpm > 70) score -= 5;
  if (d.stress > 70) score -= 20; else if (d.stress > 50) score -= 10; else if (d.stress > 35) score -= 5;
  if (d.sleep < 5) score -= 20; else if (d.sleep < 6.5) score -= 10; else if (d.sleep < 7) score -= 5;
  if (d.spo2 < 94) score -= 15; else if (d.spo2 < 96) score -= 5;
  const v = Math.max(0, Math.min(100, Math.round(score)));
  const color = v >= 75 ? "#10b981" : v >= 50 ? "#f59e0b" : "#ef4444";
  const label = v >= 75 ? "Normal" : v >= 50 ? "Atencao" : "Critico";
  const risco = v >= 75 ? "Baixo" : v >= 50 ? "Elevado" : "Alto";
  const driver = d.hrv < 35 ? "HRV baixa" : d.stress > 60 ? "Stress elevado" : d.sleep < 6 ? "Sono insuficiente" : "Equilibrio fisiologico";
  const destino = v >= 75 ? "Dashboard + relatorio" : v >= 50 ? "Dashboard + alerta" : "Alerta critico";
  const confianca = Math.min(99, 60 + Math.round(v * 0.35));
  return { v, color, label, risco, driver, destino, confianca };
}

export default function Simulador() {
  const { isSimulating, simulatedData, activeScenario, activateSimulation, updateSlider, deactivateSimulation } = useSimulation();
  // Usa direto o contexto global - persiste ao navegar
  const handleSlider = (key, value) => { updateSlider(key, value); };
  const handleScenario = (key) => { const d = SIMULATION_SCENARIOS[key].data; activateSimulation(d, key); };
  const handleReset = () => { deactivateSimulation(); };
  const r = calc(simulatedData);

  return (
    <div style={P.wrap}>
      <div style={P.header}>
        <span style={P.badge}>AMBIENTE DE TESTE</span>
        <h1 style={P.title}>Laboratorio de Simulacoes</h1>
        <p style={P.sub}>Teste cenarios fisiologicos sem alterar dados reais.</p>
        <div style={P.actions}>
          <button style={P.btnReset} onClick={handleReset}>Resetar cenario</button>
          <button style={{ ...P.btnSave, opacity: isSimulating ? 1 : 0.5 }} onClick={() => activateSimulation(simulatedData, activeScenario)}>
            {isSimulating ? "Simulacao ativa" : "Ativar simulacao"}
          </button>
        </div>
      </div>

      <div style={P.scenarios}>
        {Object.entries(SIMULATION_SCENARIOS).map(([key, s]) => (
          <button key={key} style={{ ...P.scenBtn, ...(activeScenario === key && isSimulating ? P.scenBtnActive : {}) }} onClick={() => handleScenario(key)}>
            {s.label}
          </button>
        ))}
      </div>

      <div style={P.grid}>
        <div style={P.controls}>
          <div style={P.secTitle}>CONTROLES DA SIMULACAO</div>
          <div style={P.sliders}>
            <Slider label="BPM repouso" value={simulatedData.bpm} min={45} max={110} unit="bpm" onChange={v => handleSlider("bpm", v)} />
            <Slider label="HRV" value={simulatedData.hrv} min={10} max={120} unit="ms" onChange={v => handleSlider("hrv", v)} />
            <Slider label="Sono" value={simulatedData.sleep} min={2} max={12} step={0.1} unit="h" onChange={v => handleSlider("sleep", v)} />
            <Slider label="Stress" value={simulatedData.stress} min={0} max={100} unit="%" onChange={v => handleSlider("stress", v)} />
            <Slider label="Passos" value={simulatedData.steps} min={0} max={20000} step={100} unit="p" onChange={v => handleSlider("steps", v)} />
            <Slider label="SpO2" value={simulatedData.spo2} min={88} max={100} unit="%" onChange={v => handleSlider("spo2", v)} />
          </div>
        </div>

        <div style={P.result}>
          <div style={P.scoreRow}>
            <div style={P.scoreNum}>{r.v}</div>
            <div style={{ ...P.scoreLabel, color: r.color }}>{r.label}</div>
            <div style={P.ring}>
              <svg viewBox="0 0 80 80" width="80" height="80">
                <circle cx="40" cy="40" r="34" fill="none" stroke="#1f2937" strokeWidth="6" />
                <circle cx="40" cy="40" r="34" fill="none" stroke={r.color} strokeWidth="6"
                  strokeDasharray={`${(r.confianca / 100) * 213.6} 213.6`} strokeLinecap="round" transform="rotate(-90 40 40)" />
                <text x="40" y="44" textAnchor="middle" fill="#f9fafb" fontSize="13" fontWeight="bold">{r.confianca}%</text>
              </svg>
              <div style={{ fontSize: 10, color: "#6b7280" }}>confianca</div>
            </div>
          </div>
          <div style={P.meta}>
            {[["RISCO", r.risco], ["DRIVER", r.driver], ["DESTINO", r.destino]].map(([k, v]) => (
              <div key={k} style={P.metaItem}><div style={P.metaKey}>{k}</div><div style={P.metaVal}>{v}</div></div>
            ))}
          </div>
          <div style={P.preview}>
            <div style={P.previewTitle}>PREVIEW DA IA</div>
            {[
              { title: "Recomendacao sugerida", desc: r.v >= 75 ? "Mantenha consistencia." : r.v >= 50 ? "Reduza carga e priorize recuperacao." : "Intervencao necessaria.", color: "#2dd4bf" },
              { title: "Alerta esperado", desc: r.v >= 75 ? "Nenhum alerta previsto." : "Exibir alerta preventivo.", color: "#f59e0b" },
              { title: "Uso no produto", desc: "Bom para validar layout, PDF e regras de bloqueio premium.", color: "#10b981" },
            ].map((item, i) => (
              <div key={i} style={P.previewItem}>
                <span style={{ ...P.dot, background: item.color }} />
                <div>
                  <div style={P.piTitle}>{item.title}</div>
                  <div style={P.piDesc}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const P = {
  wrap: { padding: "24px", maxWidth: "1200px", margin: "0 auto", color: "#f9fafb" },
  header: { marginBottom: "24px" },
  badge: { background: "#1f2937", border: "1px solid #374151", borderRadius: "20px", padding: "4px 12px", fontSize: "11px", color: "#9ca3af" },
  title: { fontSize: "28px", fontWeight: "700", margin: "12px 0 8px", color: "#f9fafb" },
  sub: { color: "#9ca3af", fontSize: "14px", marginBottom: "16px" },
  actions: { display: "flex", gap: "12px" },
  btnReset: { background: "#1f2937", border: "1px solid #374151", color: "#d1d5db", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "13px" },
  btnSave: { background: "#2dd4bf", border: "none", color: "#111827", padding: "8px 18px", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "700" },
  scenarios: { display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "24px" },
  scenBtn: { background: "#1f2937", border: "1px solid #374151", color: "#9ca3af", padding: "10px 16px", borderRadius: "10px", cursor: "pointer", fontSize: "13px" },
  scenBtnActive: { background: "#134e4a", border: "1px solid #2dd4bf", color: "#2dd4bf" },
  grid: { display: "grid", gridTemplateColumns: "1fr 380px", gap: "20px" },
  controls: { background: "#111827", border: "1px solid #1f2937", borderRadius: "12px", padding: "20px" },
  secTitle: { fontSize: "11px", letterSpacing: "0.1em", color: "#2dd4bf", fontWeight: "700", marginBottom: "16px" },
  sliders: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" },
  result: { background: "#111827", border: "1px solid #1f2937", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" },
  scoreRow: { display: "flex", alignItems: "center", gap: "16px" },
  scoreNum: { fontSize: "52px", fontWeight: "800", color: "#f9fafb", lineHeight: 1 },
  scoreLabel: { fontSize: "18px", fontWeight: "700" },
  ring: { marginLeft: "auto", textAlign: "center" },
  meta: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" },
  metaItem: { background: "#1a2332", borderRadius: "8px", padding: "10px" },
  metaKey: { fontSize: "10px", color: "#6b7280", marginBottom: "4px" },
  metaVal: { fontSize: "13px", fontWeight: "700", color: "#f9fafb" },
  preview: { background: "#0f172a", borderRadius: "10px", padding: "14px" },
  previewTitle: { fontSize: "10px", letterSpacing: "0.1em", color: "#2dd4bf", fontWeight: "700", marginBottom: "12px" },
  previewItem: { display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "10px" },
  dot: { width: "8px", height: "8px", borderRadius: "50%", marginTop: "4px", flexShrink: 0 },
  piTitle: { fontSize: "13px", fontWeight: "700", color: "#f9fafb", marginBottom: "2px" },
  piDesc: { fontSize: "12px", color: "#9ca3af", lineHeight: 1.5 },
};

const S = {
  card: { background: "#1a2332", border: "1px solid #1f2937", borderRadius: "10px", padding: "14px" },
  row: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" },
  label: { flex: 1, fontSize: "13px", color: "#9ca3af" },
  val: { fontWeight: "700", fontSize: "16px", color: "#f9fafb" },
  unit: { fontSize: "11px", color: "#6b7280", fontWeight: "400" },
  input: { width: "100%", height: "4px", borderRadius: "2px", outline: "none", border: "none", cursor: "pointer", appearance: "none", WebkitAppearance: "none" },
};

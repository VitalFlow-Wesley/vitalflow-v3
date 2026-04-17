export const ROUTINES = {
  breathing: {
    id: "breathing",
    tipo: "calm",
    titulo: "Respiração guiada",
    descricao: "Seu corpo precisa reduzir stress e estabilizar a frequência.",
    acao: "Iniciar respiração",
    duracao: 5,
    reavaliarEm: 10,
    objetivo: "reduzir stress e bpm",
  },
  recovery: {
    id: "recovery",
    tipo: "recovery",
    titulo: "Recuperação leve",
    descricao: "Seu corpo precisa recuperar energia e reduzir a carga fisiológica.",
    acao: "Iniciar recuperação",
    duracao: 7,
    reavaliarEm: 15,
    objetivo: "aumentar recuperação",
  },
  focus: {
    id: "focus",
    tipo: "balance",
    titulo: "Foco e estabilização",
    descricao: "Seu HRV sugere necessidade de reequilíbrio fisiológico.",
    acao: "Iniciar foco guiado",
    duracao: 6,
    reavaliarEm: 10,
    objetivo: "equilibrar HRV",
  },
  pause: {
    id: "pause",
    tipo: "pause",
    titulo: "Pausa operacional",
    descricao: "Seu estado ainda exige redução de carga e pausa consciente.",
    acao: "Iniciar pausa",
    duracao: 10,
    reavaliarEm: 20,
    objetivo: "reduzir carga geral",
  },
  maintenance: {
    id: "maintenance",
    tipo: "maintenance",
    titulo: "Manutenção positiva",
    descricao: "Seu estado está estável. Mantenha o ritmo com uma rotina leve.",
    acao: "Manter rotina",
    duracao: 5,
    reavaliarEm: 15,
    objetivo: "manter estabilidade",
  },
};

export function getInitialRoutine(data = {}) {
  const stress = Number(data.stress ?? 0);
  const sleep = Number(data.sleep ?? data.sleep_hours ?? 0);
  const hrv = Number(data.hrv ?? 0);
  const recovery = Number(data.recovery ?? 100);
  const bpm = Number(data.bpm ?? 0);

  if (stress >= 75 || bpm >= 105) return ROUTINES.breathing;
  if (sleep > 0 && sleep < 6) return ROUTINES.recovery;
  if (hrv > 0 && hrv < 50) return ROUTINES.focus;
  if (recovery < 55) return ROUTINES.recovery;

  return ROUTINES.maintenance;
}

export function evaluateResponse(before = {}, after = {}) {
  const stressDiff = Number(before.stress ?? 0) - Number(after.stress ?? 0);
  const bpmDiff = Number(before.bpm ?? 0) - Number(after.bpm ?? 0);
  const hrvDiff = Number(after.hrv ?? 0) - Number(before.hrv ?? 0);
  const vScoreDiff = Number(after.v_score ?? 0) - Number(before.v_score ?? 0);

  if (stressDiff >= 8 || bpmDiff >= 5 || hrvDiff >= 4 || vScoreDiff >= 5) {
    return "improved";
  }

  if (stressDiff <= -5 || vScoreDiff <= -5) {
    return "worse";
  }

  return "insufficient";
}

export function getNextRoutine(currentRoutineId, result) {
  if (result === "improved") return null;

  if (currentRoutineId === "breathing") return ROUTINES.pause;
  if (currentRoutineId === "focus") return ROUTINES.recovery;
  if (currentRoutineId === "recovery") return ROUTINES.pause;
  if (currentRoutineId === "pause") return ROUTINES.breathing;

  return ROUTINES.breathing;
}

export function getRoutineFeedback(result) {
  if (result === "improved") {
    return {
      titulo: "Resposta positiva",
      descricao: "Seu corpo respondeu bem à intervenção.",
      tone: "green",
      cta: null,
    };
  }

  if (result === "worse") {
    return {
      titulo: "Piora detectada",
      descricao:
        "Seu estado apresentou piora após a última análise. Recomendamos uma ação imediata de recuperação.",
      tone: "red",
      cta: "Corrigir agora",
    };
  }

  return {
    titulo: "Resposta insuficiente",
    descricao:
      "Seu corpo ainda não apresentou recuperação suficiente. Recomendamos uma nova intervenção para estabilização.",
    tone: "yellow",
    cta: "Nova ação",
  };
}
export function normalizeStatus(rawStatus) {
  const value = String(rawStatus || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (
    value.includes("crit") ||
    value.includes("vermelh") ||
    value.includes("alerta")
  ) {
    return "critico";
  }

  if (
    value.includes("aten") ||
    value.includes("amarel") ||
    value.includes("moderad")
  ) {
    return "atencao";
  }

  return "normal";
}

const ROUTINES = {
  breathing_critical: {
    id: "breathing_critical",
    type: "breathing",
    title: "Recuperação prioritária",
    description:
      "Faça uma respiração guiada para reduzir a sobrecarga fisiológica imediata e estabilizar seu estado.",
    duration_minutes: 5,
    duration_label: "5 min",
    focus: "recuperação",
    context: "estresse",
    statusHint: "critico",
    cycle_seconds: [4, 4, 6, 2],
    howItWorks: [
      "Inspire lentamente pelo nariz por 4 segundos.",
      "Segure o ar por 4 segundos sem tensionar o corpo.",
      "Expire devagar pela boca por 6 segundos.",
      "Segure por 2 segundos antes do próximo ciclo.",
    ],
  },

  breathing_balance: {
    id: "breathing_balance",
    type: "breathing",
    title: "Recuperação leve",
    description:
      "Use uma respiração guiada curta para reduzir o estresse e recuperar seu equilíbrio.",
    duration_minutes: 5,
    duration_label: "5 min",
    focus: "equilíbrio",
    context: "monitoramento",
    statusHint: "atencao",
    cycle_seconds: [4, 4, 4, 4],
    howItWorks: [
      "Inspire pelo nariz por 4 segundos.",
      "Segure por 4 segundos.",
      "Solte o ar devagar por 4 segundos.",
      "Segure por 4 segundos e repita.",
    ],
  },

  breathing_maintenance: {
    id: "breathing_maintenance",
    type: "breathing",
    title: "Manutenção positiva",
    description:
      "Mantenha seu estado estável com uma respiração curta de manutenção.",
    duration_minutes: 3,
    duration_label: "3 min",
    focus: "manutenção",
    context: "estabilidade",
    statusHint: "normal",
    cycle_seconds: [3, 3, 3, 3],
    howItWorks: [
      "Inspire suavemente por 3 segundos.",
      "Segure por 3 segundos.",
      "Solte o ar por 3 segundos.",
      "Segure por 3 segundos e repita.",
    ],
  },

  visual_reset: {
    id: "visual_reset",
    type: "visual",
    title: "Descanso visual",
    description:
      "Afaste o olhar da tela e foque em um ponto distante para reduzir fadiga ocular e mental.",
    duration_minutes: 1,
    duration_label: "20 s",
    focus: "visão",
    context: "tela",
    statusHint: "atencao",
    visual_seconds: 20,
    howItWorks: [
      "Olhe para um ponto fixo a cerca de 6 metros de distância.",
      "Mantenha o foco fora da tela por 20 segundos.",
      "Piscar naturalmente ajuda a relaxar os olhos.",
      "Retorne à tela com menos tensão visual.",
    ],
  },

  hydration_boost: {
    id: "hydration_boost",
    type: "hydration",
    title: "Hidratação rápida",
    description:
      "Faça uma pausa curta e beba água para apoiar recuperação, clareza mental e energia.",
    duration_minutes: 2,
    duration_label: "2 min",
    focus: "hidratação",
    context: "energia",
    statusHint: "atencao",
    howItWorks: [
      "Levante do lugar por um momento.",
      "Beba água com calma.",
      "Respire fundo uma vez antes de retornar.",
      "Volte à tarefa com mais clareza.",
    ],
  },

  walk_reset: {
    id: "walk_reset",
    type: "walk",
    title: "Caminhada leve",
    description:
      "Faça uma caminhada curta para reduzir a estagnação física e recuperar presença mental.",
    duration_minutes: 3,
    duration_label: "3 min",
    focus: "movimento",
    context: "fadiga",
    statusHint: "atencao",
    howItWorks: [
      "Levante do lugar e caminhe em ritmo leve.",
      "Solte os ombros e respire naturalmente.",
      "Afaste-se da tela ou do posto por alguns minutos.",
      "Retorne quando sentir mais leveza corporal.",
    ],
  },

  stretch_reset: {
    id: "stretch_reset",
    type: "stretch",
    title: "Alongamento rápido",
    description:
      "Solte pescoço, ombros e tronco para aliviar tensão física acumulada.",
    duration_minutes: 3,
    duration_label: "3 min",
    focus: "postura",
    context: "tensão",
    statusHint: "atencao",
    howItWorks: [
      "Gire os ombros lentamente para trás.",
      "Alongue o pescoço com movimentos leves.",
      "Estique braços e costas por alguns segundos.",
      "Respire de forma solta durante os movimentos.",
    ],
  },

  pause_total: {
    id: "pause_total",
    type: "pause",
    title: "Pausa total",
    description:
      "Afaste-se da atividade por alguns minutos para reduzir a carga imediata e recuperar seu estado.",
    duration_minutes: 5,
    duration_label: "5 min",
    focus: "pausa",
    context: "sobrecarga",
    statusHint: "critico",
    howItWorks: [
      "Afaste-se da tela ou da atividade principal.",
      "Evite estímulos intensos por alguns minutos.",
      "Respire normalmente e reduza o ritmo.",
      "Retorne apenas quando se sentir mais estável.",
    ],
  },

  focus_reset: {
    id: "focus_reset",
    type: "focus",
    title: "Reorganizar foco",
    description:
      "Faça uma micro pausa para reorganizar atenção e reduzir dispersão cognitiva.",
    duration_minutes: 2,
    duration_label: "2 min",
    focus: "foco",
    context: "atenção",
    statusHint: "normal",
    howItWorks: [
      "Feche os olhos por alguns segundos.",
      "Respire fundo uma vez.",
      "Defina mentalmente sua próxima tarefa única.",
      "Retorne com foco em um passo de cada vez.",
    ],
  },
};

function inferScreenFatigue(data) {
  const bpm = Number(data?.bpm ?? 0);
  const stress = Number(data?.stress ?? data?.stress_score ?? 0);
  const hrv = Number(data?.hrv ?? 0);
  return stress >= 45 && bpm < 95 && hrv >= 40;
}

function inferPhysicalFatigue(data) {
  const sleep = Number(data?.sleep ?? data?.sleep_hours ?? 0);
  const recovery = Number(data?.recovery ?? data?.recovery_score ?? 100);
  return sleep < 6 || recovery < 55;
}

function inferHighStress(data) {
  const stress = Number(data?.stress ?? data?.stress_score ?? 0);
  const bpm = Number(data?.bpm ?? 0);
  return stress >= 70 || bpm >= 100;
}

function inferLowFocus(data) {
  const stress = Number(data?.stress ?? data?.stress_score ?? 0);
  const vScore = Number(data?.v_score ?? 100);
  return stress >= 40 && vScore < 80;
}

export function buildSmartSuggestions(currentData = {}, previousData = {}) {
  const explicitStatus =
    currentData?.status ||
    currentData?.status_visual ||
    currentData?.estado ||
    "";

  let status = normalizeStatus(explicitStatus);

  const stress = Number(currentData?.stress ?? currentData?.stress_score ?? 0);
  const sleep = Number(currentData?.sleep ?? currentData?.sleep_hours ?? 0);
  const hrv = Number(currentData?.hrv ?? 0);
  const recovery = Number(
    currentData?.recovery ?? currentData?.recovery_score ?? 100
  );
  const bpm = Number(currentData?.bpm ?? 0);
  const vScore = Number(currentData?.v_score ?? 100);

  if (!explicitStatus) {
    if (stress >= 75 || vScore <= 55) status = "critico";
    else if (stress >= 50 || vScore <= 75) status = "atencao";
    else status = "normal";
  }

  let primary;
  let alternatives = [];
  let explanation = "";

  if (status === "critico") {
    if (inferHighStress(currentData)) {
      primary = ROUTINES.breathing_critical;
      alternatives = [ROUTINES.pause_total, ROUTINES.hydration_boost];
      explanation =
        "Seu estado indica sobrecarga imediata. A prioridade agora é reduzir estresse e estabilizar seu sistema.";
    } else if (inferPhysicalFatigue(currentData)) {
      primary = ROUTINES.pause_total;
      alternatives = [ROUTINES.hydration_boost, ROUTINES.walk_reset];
      explanation =
        "Há sinais de desgaste acumulado. Uma pausa real pode ajudar mais do que insistir em performance agora.";
    } else {
      primary = ROUTINES.breathing_critical;
      alternatives = [ROUTINES.walk_reset, ROUTINES.pause_total];
      explanation =
        "Seu corpo precisa de uma intervenção curta e direta para sair do estado crítico.";
    }
  } else if (status === "atencao") {
    if (inferScreenFatigue(currentData)) {
      primary = ROUTINES.visual_reset;
      alternatives = [ROUTINES.hydration_boost, ROUTINES.breathing_balance];
      explanation =
        "Seu padrão parece mais próximo de fadiga de tela e atenção. Um descanso visual pode ajudar rapidamente.";
    } else if (inferPhysicalFatigue(currentData)) {
      primary = ROUTINES.walk_reset;
      alternatives = [ROUTINES.hydration_boost, ROUTINES.stretch_reset];
      explanation =
        "Há sinais de cansaço corporal e queda de energia. Movimento leve tende a funcionar melhor agora.";
    } else if (inferLowFocus(currentData)) {
      primary = ROUTINES.breathing_balance;
      alternatives = [ROUTINES.focus_reset, ROUTINES.visual_reset];
      explanation =
        "Seu estado pede estabilização leve. Uma intervenção curta já pode melhorar foco e equilíbrio.";
    } else {
      primary = ROUTINES.hydration_boost;
      alternatives = [ROUTINES.visual_reset, ROUTINES.stretch_reset];
      explanation =
        "Seu estado está em atenção moderada. Pequenas ações rápidas podem recuperar energia sem interromper demais sua rotina.";
    }
  } else {
    primary = ROUTINES.breathing_maintenance;
    alternatives = [ROUTINES.focus_reset, ROUTINES.hydration_boost];
    explanation =
      "Seu estado está estável. O objetivo agora é manter consistência e prevenir queda de performance.";
  }

  return {
    status,
    primary,
    alternatives,
    explanation,
    metrics: {
      stress,
      sleep,
      hrv,
      recovery,
      bpm,
      vScore,
    },
  };
}

export function getReevaluationPreview(status) {
  if (status === "critico") {
    return {
      title: "Impacto estimado",
      items: [
        { label: "Recovery", value: "+12%" },
        { label: "Stress", value: "-8%" },
        { label: "Estado", value: "crítico → atenção" },
      ],
    };
  }

  if (status === "atencao") {
    return {
      title: "Impacto estimado",
      items: [
        { label: "Recovery", value: "+8%" },
        { label: "Stress", value: "-5%" },
        { label: "Estado", value: "atenção → estável" },
      ],
    };
  }

  return {
    title: "Impacto estimado",
    items: [
      { label: "Recovery", value: "+5%" },
      { label: "Stress", value: "-3%" },
      { label: "Estado", value: "estável → manutenção" },
    ],
  };
}
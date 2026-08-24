export interface Question {
  id: string; // e.g. 'q01'
  number: number;
  text: string;
  dimensionId: DimensionId;
  criticalFlag?: string; // Flag code if answer is 'no'
}

export type DimensionId = 
  | 'procesos' 
  | 'finanzas' 
  | 'datos' 
  | 'integraciones' 
  | 'adopcion' 
  | 'governance';

export interface DimensionInfo {
  id: DimensionId;
  name: string;
  weight: number; // decimal e.g. 0.20
  questionIds: string[];
  description: string;
}

export const DIMENSIONS: Record<DimensionId, DimensionInfo> = {
  procesos: {
    id: 'procesos',
    name: 'Procesos',
    weight: 0.20,
    questionIds: ['q01', 'q02', 'q03', 'q04', 'q05'],
    description: 'Determina si Fusion realmente soporta la operación de punta a punta o si existen procesos paralelos y workarounds.'
  },
  finanzas: {
    id: 'finanzas',
    name: 'Finanzas & Reporting',
    weight: 0.20,
    questionIds: ['q06', 'q07', 'q08', 'q09', 'q10'],
    description: 'Evalúa cierre, conciliaciones, reporting financiero, estructura contable y dependencia de actividades manuales.'
  },
  datos: {
    id: 'datos',
    name: 'Datos',
    weight: 0.15,
    questionIds: ['q11', 'q12', 'q13', 'q14'],
    description: 'Analiza calidad, gobierno, consistencia y confiabilidad de los datos.'
  },
  integraciones: {
    id: 'integraciones',
    name: 'Integraciones',
    weight: 0.15,
    questionIds: ['q15', 'q16', 'q17', 'q18'],
    description: 'Evalúa estabilidad, monitoreo, manejo de errores y mantenibilidad de las interfaces.'
  },
  adopcion: {
    id: 'adopcion',
    name: 'Adopción',
    weight: 0.15,
    questionIds: ['q19', 'q20', 'q21'],
    description: 'Determina si los usuarios realmente trabajan en Fusion y si existe ownership de los procesos.'
  },
  governance: {
    id: 'governance',
    name: 'Governance & Support',
    weight: 0.15,
    questionIds: ['q22', 'q23', 'q24', 'q25'],
    description: 'Evalúa backlog, modelo de soporte, ownership, actualizaciones y resolución de causa raíz.'
  }
};

export const QUESTIONS: Question[] = [
  // DIMENSIÓN 1 — PROCESOS (Q1-Q5)
  {
    id: 'q01',
    number: 1,
    dimensionId: 'procesos',
    text: '¿Los principales procesos transaccionales pueden ejecutarse de punta a punta dentro de Fusion sin recurrir habitualmente a procesos manuales fuera del sistema?',
    criticalFlag: 'MANUAL_PROCESS_DEPENDENCY'
  },
  {
    id: 'q02',
    number: 2,
    dimensionId: 'procesos',
    text: '¿Los workflows y aprobaciones reflejan correctamente las reglas actuales del negocio?'
  },
  {
    id: 'q03',
    number: 3,
    dimensionId: 'procesos',
    text: '¿Las excepciones pueden administrarse dentro del proceso sin depender recurrentemente de Excel, correo, WhatsApp u otras herramientas externas?'
  },
  {
    id: 'q04',
    number: 4,
    dimensionId: 'procesos',
    text: '¿Los principales procesos mantienen tiempos de ejecución adecuados para las necesidades del negocio?'
  },
  {
    id: 'q05',
    number: 5,
    dimensionId: 'procesos',
    text: '¿Las extensiones, personalizaciones y excepciones existentes tienen una justificación clara de negocio y están adecuadamente controladas?'
  },

  // DIMENSIÓN 2 — FINANZAS & REPORTING (Q6-Q10)
  {
    id: 'q06',
    number: 6,
    dimensionId: 'finanzas',
    text: '¿El cierre financiero se realiza dentro del calendario esperado sin una dependencia material de actividades manuales fuera de Fusion?',
    criticalFlag: 'FINANCIAL_CLOSE_CRITICAL'
  },
  {
    id: 'q07',
    number: 7,
    dimensionId: 'finanzas',
    text: '¿Los subledgers y el General Ledger concilian consistentemente?',
    criticalFlag: 'FINANCE_RECONCILIATION_CRITICAL'
  },
  {
    id: 'q08',
    number: 8,
    dimensionId: 'finanzas',
    text: '¿La dirección obtiene sus principales reportes financieros desde fuentes controladas sin tener que reconstruirlos manualmente en Excel?',
    criticalFlag: 'REPORTING_DEPENDENCY'
  },
  {
    id: 'q09',
    number: 9,
    dimensionId: 'finanzas',
    text: '¿El Chart of Accounts y las dimensiones contables permiten analizar adecuadamente el negocio?'
  },
  {
    id: 'q10',
    number: 10,
    dimensionId: 'finanzas',
    text: '¿El volumen de journals, reclasificaciones, conciliaciones y ajustes manuales se encuentra dentro de niveles razonables?'
  },

  // DIMENSIÓN 3 — DATOS (Q11-Q14)
  {
    id: 'q11',
    number: 11,
    dimensionId: 'datos',
    text: '¿Existen responsables claramente definidos de la calidad y gobierno de los datos maestros?'
  },
  {
    id: 'q12',
    number: 12,
    dimensionId: 'datos',
    text: '¿Los datos maestros presentan bajos niveles de duplicidad, inconsistencia o información incompleta?'
  },
  {
    id: 'q13',
    number: 13,
    dimensionId: 'datos',
    text: '¿Los datos migrados a Fusion fueron conciliados y validados formalmente?'
  },
  {
    id: 'q14',
    number: 14,
    dimensionId: 'datos',
    text: '¿Los problemas de calidad de datos dejaron de provocar incidencias recurrentes en la operación?',
    criticalFlag: 'DATA_QUALITY_CRITICAL'
  },

  // DIMENSIÓN 4 — INTEGRACIONES (Q15-Q18)
  {
    id: 'q15',
    number: 15,
    dimensionId: 'integraciones',
    text: '¿Las integraciones críticas funcionan de manera estable?',
    criticalFlag: 'INTEGRATION_CRITICAL'
  },
  {
    id: 'q16',
    number: 16,
    dimensionId: 'integraciones',
    text: '¿Los fallos de integración se detectan, asignan y reprocesan bajo un procedimiento claramente definido?'
  },
  {
    id: 'q17',
    number: 17,
    dimensionId: 'integraciones',
    text: '¿Las interfaces y extensiones están adecuadamente documentadas y pueden mantenerse sin depender excesivamente de personas específicas?'
  },
  {
    id: 'q18',
    number: 18,
    dimensionId: 'integraciones',
    text: '¿La arquitectura evita una proliferación descontrolada de integraciones punto a punto?'
  },

  // DIMENSIÓN 5 — ADOPCIÓN (Q19-Q21)
  {
    id: 'q19',
    number: 19,
    dimensionId: 'adopcion',
    text: '¿Los usuarios pueden ejecutar los procesos principales sin requerir asistencia permanente del equipo de soporte?'
  },
  {
    id: 'q20',
    number: 20,
    dimensionId: 'adopcion',
    text: '¿Fusion es realmente el sistema principal de trabajo y no simplemente el sistema donde finalmente se registran operaciones realizadas fuera de él?',
    criticalFlag: 'ADOPTION_FAILURE'
  },
  {
    id: 'q21',
    number: 21,
    dimensionId: 'adopcion',
    text: '¿Los process owners tienen responsabilidad clara sobre adopción, desempeño y mejora continua de sus procesos?'
  },

  // DIMENSIÓN 6 — GOVERNANCE & SUPPORT (Q22-Q25)
  {
    id: 'q22',
    number: 22,
    dimensionId: 'governance',
    text: '¿El backlog de incidencias y mejoras se prioriza de acuerdo con su impacto sobre el negocio?',
    criticalFlag: 'SUPPORT_BACKLOG_RISK'
  },
  {
    id: 'q23',
    number: 23,
    dimensionId: 'governance',
    text: '¿Están claramente definidas las responsabilidades entre las áreas de negocio, TI, Oracle y el partner?'
  },
  {
    id: 'q24',
    number: 24,
    dimensionId: 'governance',
    text: '¿Existe un proceso estructurado para probar actualizaciones, regresiones y cambios antes de llevarlos a producción?'
  },
  {
    id: 'q25',
    number: 25,
    dimensionId: 'governance',
    text: '¿El modelo de soporte busca eliminar las causas raíz y no únicamente cerrar tickets?'
  }
];

export type AnswerValue = 'no' | 'mayormente_no' | 'parcialmente' | 'mayormente_si' | 'si' | 'no_lo_se' | 'no_aplica';

export interface AnswerOption {
  value: AnswerValue;
  label: string;
  scorePoints: number | null; // null for no_lo_se and no_aplica
}

export const ANSWER_OPTIONS: AnswerOption[] = [
  { value: 'no', label: 'No', scorePoints: 0 },
  { value: 'mayormente_no', label: 'Mayormente no', scorePoints: 1 },
  { value: 'parcialmente', label: 'Parcialmente', scorePoints: 2 },
  { value: 'mayormente_si', label: 'Mayormente sí', scorePoints: 3 },
  { value: 'si', label: 'Sí', scorePoints: 4 },
  { value: 'no_lo_se', label: 'No lo sé', scorePoints: null },
  { value: 'no_aplica', label: 'No aplica', scorePoints: null }
];

export interface EnvironmentData {
  company: string;
  country: string;
  industry: string;
  solution: string;
  goLiveAge: string;
  role: string;
}

export interface ContactData {
  firstName: string;
  lastName: string;
  company: string;
  jobTitle: string;
  email: string;
  phone?: string;
  privacyAccepted: boolean;
}

export interface UTMData {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  landing_page?: string;
  referrer?: string;
  first_touch_date?: string;
  content_id?: string;
}

export interface DimensionResult {
  dimensionId: DimensionId;
  name: string;
  score: number; // 0 - 100
  earnedPoints: number;
  maxPoints: number;
  weight: number;
  weightedScore: number;
  applicableQuestionsCount: number;
}

export type HealthClassification = 'OPTIMIZED' | 'STABLE' | 'AT RISK' | 'CRITICAL';
export type RecommendedPath = 'OPTIMIZE' | 'REMEDIATE' | 'RESCUE' | 'REASSESS';

export interface AssessmentResult {
  healthScore: number; // 0 - 100
  classification: HealthClassification;
  recommendedPath: RecommendedPath;
  dimensionResults: Record<DimensionId, DimensionResult>;
  topPriorities: DimensionResult[];
  criticalFlags: string[];
  unknownFlagsCount: number;
  mainProblem: string;
  problemDescription: string;
  timing: string;
}

export function parseUTMParameters(): UTMData {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  
  let utm_source = params.get('utm_source') || undefined;
  let utm_medium = params.get('utm_medium') || undefined;
  const ref = typeof document !== 'undefined' && document.referrer ? document.referrer.toLowerCase() : '';

  // Smart Referrer Fallback if utm_source was not explicitly set in URL
  if (!utm_source && ref) {
    if (ref.includes('linkedin.com') || ref.includes('lnkd.in')) {
      utm_source = 'linkedin';
      utm_medium = utm_medium || 'social';
    } else if (ref.includes('tiktok.com')) {
      utm_source = 'tiktok';
      utm_medium = utm_medium || 'social';
    } else if (ref.includes('instagram.com')) {
      utm_source = 'instagram';
      utm_medium = utm_medium || 'social';
    } else if (ref.includes('facebook.com') || ref.includes('fb.com')) {
      utm_source = 'facebook';
      utm_medium = utm_medium || 'social';
    } else if (ref.includes('twitter.com') || ref.includes('t.co') || ref.includes('x.com')) {
      utm_source = 'twitter';
      utm_medium = utm_medium || 'social';
    } else if (ref.includes('youtube.com') || ref.includes('youtu.be')) {
      utm_source = 'youtube';
      utm_medium = utm_medium || 'social';
    } else if (ref.includes('whatsapp.com') || ref.includes('wa.me')) {
      utm_source = 'whatsapp';
      utm_medium = utm_medium || 'messaging';
    } else if (ref.includes('google.com') || ref.includes('google.es')) {
      utm_source = 'google';
      utm_medium = utm_medium || 'organic';
    }
  }

  const contentId = params.get('content_id') || params.get('utm_content') || (utm_source ? `${utm_source.toUpperCase()}-TRAFFIC` : undefined);

  return {
    utm_source,
    utm_medium,
    utm_campaign: params.get('utm_campaign') || undefined,
    utm_content: params.get('utm_content') || undefined,
    utm_term: params.get('utm_term') || undefined,
    landing_page: typeof window !== 'undefined' ? window.location.pathname : '/fusion-rescue',
    referrer: typeof document !== 'undefined' ? document.referrer || undefined : undefined,
    first_touch_date: new Date().toISOString(),
    content_id: contentId,
  };
}

export function calculateAssessmentResult(
  answers: Record<string, AnswerValue>,
  mainProblem: string = '',
  problemDescription: string = '',
  timing: string = ''
): AssessmentResult {
  const criticalFlagsSet = new Set<string>();
  let unknownCount = 0;

  // Process answers per dimension
  const dimensionResults: Record<DimensionId, DimensionResult> = {} as any;

  (Object.keys(DIMENSIONS) as DimensionId[]).forEach((dimKey) => {
    const dim = DIMENSIONS[dimKey];
    let earnedPoints = 0;
    let applicableQuestionsCount = 0;

    dim.questionIds.forEach((qId) => {
      const question = QUESTIONS.find((q) => q.id === qId);
      const answerVal = answers[qId];

      if (!answerVal) return;

      if (answerVal === 'no_lo_se') {
        unknownCount++;
        criticalFlagsSet.add('UNKNOWN_RESPONSE');
      }

      // Check critical flags for "No" or "Mayormente no" on flag-designated questions
      if (question?.criticalFlag && (answerVal === 'no' || answerVal === 'mayormente_no')) {
        criticalFlagsSet.add(question.criticalFlag);
      }

      if (answerVal !== 'no_aplica') {
        applicableQuestionsCount++;
        const option = ANSWER_OPTIONS.find((o) => o.value === answerVal);
        if (option && option.scorePoints !== null) {
          earnedPoints += option.scorePoints;
        }
      }
    });

    const maxPoints = applicableQuestionsCount * 4; // Each applicable question max is 4
    const score = maxPoints > 0 ? Math.round((earnedPoints / maxPoints) * 100) : 0;
    const weightedScore = Math.round(score * dim.weight);

    dimensionResults[dimKey] = {
      dimensionId: dimKey,
      name: dim.name,
      score,
      earnedPoints,
      maxPoints,
      weight: dim.weight,
      weightedScore,
      applicableQuestionsCount
    };
  });

  // Calculate Overall Health Score
  const healthScore = Math.round(
    (dimensionResults.procesos.score * DIMENSIONS.procesos.weight) +
    (dimensionResults.finanzas.score * DIMENSIONS.finanzas.weight) +
    (dimensionResults.datos.score * DIMENSIONS.datos.weight) +
    (dimensionResults.integraciones.score * DIMENSIONS.integraciones.weight) +
    (dimensionResults.adopcion.score * DIMENSIONS.adopcion.weight) +
    (dimensionResults.governance.score * DIMENSIONS.governance.weight)
  );

  // Classification
  let classification: HealthClassification = 'CRITICAL';
  if (healthScore >= 85) classification = 'OPTIMIZED';
  else if (healthScore >= 70) classification = 'STABLE';
  else if (healthScore >= 40) classification = 'AT RISK';

  // Recommended Path
  let recommendedPath: RecommendedPath = 'REASSESS';
  const dimScores = Object.values(dimensionResults).map((d) => d.score);
  const lowDimCount = dimScores.filter((s) => s < 60).length;
  const criticalFlagsList = Array.from(criticalFlagsSet);

  const hasCriticalFlagIssues = criticalFlagsList.some((f) => 
    ['MANUAL_PROCESS_DEPENDENCY', 'FINANCIAL_CLOSE_CRITICAL', 'FINANCE_RECONCILIATION_CRITICAL', 'INTEGRATION_CRITICAL'].includes(f)
  );

  if (healthScore >= 85 && !hasCriticalFlagIssues) {
    recommendedPath = 'OPTIMIZE';
  } else if (healthScore >= 70 && lowDimCount <= 2 && !hasCriticalFlagIssues) {
    recommendedPath = 'REMEDIATE';
  } else if (healthScore < 45 || hasCriticalFlagIssues) {
    recommendedPath = 'REASSESS';
  } else {
    recommendedPath = 'RESCUE';
  }

  // Top priorities: sort dimensions ascending by score
  const topPriorities = Object.values(dimensionResults)
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);

  return {
    healthScore,
    classification,
    recommendedPath,
    dimensionResults,
    topPriorities,
    criticalFlags: criticalFlagsList,
    unknownFlagsCount: unknownCount,
    mainProblem,
    problemDescription,
    timing
  };
}

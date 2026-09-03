// src/utils/erpModernizationEngine.ts

export type SourceErp = 'ebs' | 'jde' | 'peoplesoft' | 'sap' | 'general';

export interface ErpContactData {
  firstName: string;
  lastName: string;
  company: string;
  jobTitle: string;
  workEmail: string;
  country: string;
  phone?: string;
  currentErp: string;
  erpVersion?: string;
  currentModules: string[];
  privacyAccepted: boolean;
}

export interface BantData {
  mainNeed: string;
  businessImpact: string;
  problemDescription?: string;
  authorityRole: string;
  budgetStatus: string;
  timing: string;
}

export type BantPrequalification = 'HIGH' | 'MEDIUM' | 'NURTURE';
export type AssignedSdr = 'Ximena' | 'Fabrizio';

export interface ErpModernizationPayload extends ErpContactData, BantData {
  sourceErp: SourceErp;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  content_id?: string;
  landing_page?: string;
  referrer?: string;
  first_touch_date?: string;
}

/**
 * Parsea el parámetro ?source_erp de la URL
 */
export function getSourceErpFromUrl(search: string): SourceErp {
  const params = new URLSearchParams(search);
  const source = (params.get('source_erp') || '').toLowerCase();
  if (['ebs', 'jde', 'peoplesoft', 'sap'].includes(source)) {
    return source as SourceErp;
  }
  return 'general';
}

/**
 * Parsea parámetros UTM del navegador
 */
export function parseUTMParameters() {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  
  // Guardar first_touch_date en localStorage si no existe
  let firstTouch = localStorage.getItem('fabric_first_touch_date');
  if (!firstTouch) {
    firstTouch = new Date().toISOString();
    localStorage.setItem('fabric_first_touch_date', firstTouch);
  }

  return {
    utm_source: params.get('utm_source') || undefined,
    utm_medium: params.get('utm_medium') || undefined,
    utm_campaign: params.get('utm_campaign') || undefined,
    utm_content: params.get('utm_content') || undefined,
    utm_term: params.get('utm_term') || undefined,
    content_id: params.get('content_id') || undefined,
    landing_page: window.location.pathname,
    referrer: document.referrer || undefined,
    first_touch_date: firstTouch
  };
}

/**
 * Algoritmo de Precalificación BANT
 * 
 * HIGH: Need concreta + Authority decide/comité/lidera/business case + Budget aprobado/estimado/en definición + Timing <= 6 meses
 * MEDIUM: Need identificada + definiendo presupuesto/business case + Timing 6-12 meses
 * NURTURE: Solo recopilando / Sin necesidad / Sin presupuesto / Timing > 12 meses o explorando
 */
export function calculateBantPrequalification(bant: BantData): BantPrequalification {
  const { mainNeed, authorityRole, budgetStatus, timing } = bant;

  const isHighNeed = Boolean(mainNeed && mainNeed !== 'Otro');
  
  const isHighAuthority = [
    'Soy responsable de la decisión.',
    'Formo parte del comité de decisión.',
    'Lidero la evaluación técnica o funcional.',
    'Estoy construyendo el business case.'
  ].includes(authorityRole);

  const isHighBudget = [
    'Ya existe presupuesto aprobado.',
    'Existe una partida estimada, pendiente de aprobación.',
    'Estamos definiendo el presupuesto.'
  ].includes(budgetStatus);

  const isHighTiming = [
    'Ya estamos evaluando proveedores o partners.',
    'Durante los próximos 3 meses.',
    'Durante los próximos 3–6 meses.'
  ].includes(timing);

  if (isHighNeed && isHighAuthority && isHighBudget && isHighTiming) {
    return 'HIGH';
  }

  const isMediumTiming = timing === 'Durante los próximos 6–12 meses.';
  const isMediumBudget = budgetStatus === 'Necesitamos construir primero el business case.';

  if (isHighNeed && (isMediumBudget || isHighBudget) && (isHighTiming || isMediumTiming)) {
    return 'MEDIUM';
  }

  return 'NURTURE';
}

/**
 * Disparador de eventos analíticos (GA4, GTM, Pixel)
 */
export function trackErpEvent(eventName: string, eventParams: Record<string, any> = {}) {
  if (typeof window !== 'undefined') {
    if ((window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: eventName,
        ...eventParams
      });
    }
    console.log(`[ERP ANALYTICS EVENT] ${eventName}:`, eventParams);
  }
}


export type SlotStatus = 'activo' | 'reservado' | 'libre';

export type QuarterStatus = 'closed' | 'open' | 'upcoming';

export interface AdmissionQuarter {
  quarter: string;
  status: QuarterStatus;
  label: string;
  description: string;
  deadline: string;
}

export interface WaitlistEntry {
  rank: number;
  company: string;
  contact: string;
  industry: Industry;
  score: number;
  since: string;
}

export interface CapacidadState {
  slots: SlotStatus[];          // siempre 12 elementos
  waitlist: WaitlistEntry[];
  admissionOpen: boolean;
  admissionQuarters: AdmissionQuarter[];
  deadlineQ3: string;           // ISO date para el countdown
}

export type Industry = 'Inmobiliario' | 'Financiero' | 'Logística';

export type LeadStatus = 'Nuevo' | 'Revisión' | 'Aprobado' | 'WaitList' | 'Rechazado';

export type LeadSource =
  | 'Aplicar'
  | 'Rescue Assessment'
  | 'AI Diagnostic'
  | 'Office Hours'
  | 'Doctrine Generator'
  | 'OCI Optimizer'
  | 'TCO Comparator'
  | 'Founder Line'
  | 'Manual';

export interface Lead {
  id: string;
  date: string;
  // Datos de la persona
  nombre: string;
  cargo: string;
  // Datos de la empresa
  company: string;
  industry: Industry;
  revenue: string;
  // Contexto Oracle
  iniciativa: string;       // qué proyecto Oracle consideran
  plazo: string;            // plazo de decisión
  // Seguimiento
  score: number;
  status: LeadStatus;
  source: LeadSource;
  // Captura extra
  email: string;
  queryChat?: string;       // si vino del AI Diagnostic
  notas?: string;           // notas internas del admin
  historial: Array<{ fecha: string; estado: LeadStatus; autor: string }>;
}

export interface MetricaPublica {
  id: string;
  label: string;
  value: number;
  unit: string;
  publicLabel: string;
  period: string;
  visible: boolean;
  appearsIn: string;
  version: number;
}

export interface OfficeHoursSlot {
  id: string;
  fecha: string;            // 'jue 22 mayo · 16:00'
  isoDate: string;
  disponible: boolean;
  reservadoPor?: string;    // nombre del solicitante
  empresa?: string;
  email?: string;
  confirmado: boolean;
}

export interface FabricStore {
  capacidad: CapacidadState;
  metricas: MetricaPublica[];
  leads: Lead[];
  officeHours: OfficeHoursSlot[];
}

// ─── DATOS INICIALES ──────────────────────────────────────────────────────────

export const INITIAL_SLOTS: SlotStatus[] = [
  'activo', 'activo', 'activo', 'activo', 'activo',
  'activo', 'activo', 'activo', 'activo',
  'reservado', 'reservado', 'libre',
];

export const INITIAL_WAITLIST: WaitlistEntry[] = [
  { rank: 1, company: 'FinCore Bank',       contact: 'A. Torres CFO',   industry: 'Financiero',   score: 91, since: '19 may' },
  { rank: 2, company: 'Capital Seguro',      contact: 'L. Mora CFO',     industry: 'Financiero',   score: 94, since: '16 may' },
  { rank: 3, company: 'Plaza Reforma',       contact: 'I. Díaz Dir.',    industry: 'Inmobiliario', score: 83, since: '12 may' },
  { rank: 4, company: 'Inmobiliaria Mítica', contact: 'M. Saldívar CFO', industry: 'Inmobiliario', score: 87, since: '20 may' },
  { rank: 5, company: 'TransLog SA',         contact: 'R. Méndez COO',   industry: 'Logística',    score: 82, since: '20 may' },
  { rank: 6, company: 'FlexCargo',           contact: 'G. Salas COO',    industry: 'Logística',    score: 88, since: '14 may' },
  { rank: 7, company: 'Nexo Financiero',     contact: 'H. Cruz CFO',     industry: 'Financiero',   score: 76, since: '13 may' },
];

export const INITIAL_ADMISSION_QUARTERS: AdmissionQuarter[] = [
  { quarter: 'Q1 2026', status: 'closed',   label: 'Cerrado',  description: '3 proyectos aceptados',  deadline: '○ Completo'        },
  { quarter: 'Q2 2026', status: 'closed',   label: 'Cerrado',  description: '2 proyectos aceptados',  deadline: '○ Completo'        },
  { quarter: 'Q3 2026', status: 'open',     label: 'Abierto',  description: 'Evaluando aplicaciones', deadline: 'Plazo · 30 julio'  },
  { quarter: 'Q4 2026', status: 'upcoming', label: 'Próximo',  description: 'Aplicaciones desde 01 sept', deadline: '○ Próximo'    },
];

export const INITIAL_METRICAS: MetricaPublica[] = [
  {
    id: 'rescue',
    label: 'Rescue Counter',
    value: 14,
    unit: 'rescates',
    publicLabel: 'Rescates Oracle · 2024–2026',
    period: '2024–2026',
    visible: true,
    appearsIn: 'Hero · S07 · OG image',
    version: 12,
  },
  {
    id: 'nps',
    label: 'NPS clientes activos',
    value: 72,
    unit: 'pts',
    publicLabel: 'NPS · Publicación Q4 2026',
    period: 'Q1 2026',
    visible: false,
    appearsIn: 'S13 Transparencia',
    version: 1,
  },
  {
    id: 'senior',
    label: '% Senior consultants',
    value: 100,
    unit: '%',
    publicLabel: '100% Senior Team',
    period: 'Vigente',
    visible: true,
    appearsIn: 'S15 Founder',
    version: 3,
  },
  {
    id: 'waitlist',
    label: 'Wait list actual',
    value: 7,
    unit: 'orgs',
    publicLabel: '7 organizaciones en espera',
    period: 'Mayo 2026',
    visible: true,
    appearsIn: 'S15 Founder',
    version: 5,
  },
  {
    id: 'slots',
    label: 'Proyectos activos',
    value: 9,
    unit: '/12',
    publicLabel: '9 proyectos activos',
    period: 'Mayo 2026',
    visible: true,
    appearsIn: 'S15 Founder · Dashboard',
    version: 8,
  },
  {
    id: 'fixed_price',
    label: '% Proyectos Fixed-Price en presupuesto',
    value: 100,
    unit: '%',
    publicLabel: '100% dentro de presupuesto Fixed-Price',
    period: 'Q1 2026',
    visible: false,
    appearsIn: 'S13 Transparencia',
    version: 1,
  },
  {
    id: 'retencion',
    label: 'Retención clientes 24 meses',
    value: 0,
    unit: '%',
    publicLabel: 'No publicado',
    period: 'Q1 2026',
    visible: false,
    appearsIn: 'S13 Transparencia',
    version: 1,
  },
  {
    id: 'tiempo_respuesta',
    label: 'Tiempo medio respuesta crítico',
    value: 0,
    unit: 'min',
    publicLabel: 'No publicado',
    period: 'Q1 2026',
    visible: false,
    appearsIn: 'S13 Transparencia',
    version: 1,
  },
];

export const INITIAL_LEADS: Lead[] = [
  {
    id: 'lead-001',
    date: '20 may',
    nombre: 'M. Saldívar',
    cargo: 'CFO',
    company: 'Inmobiliaria Mítica',
    industry: 'Inmobiliario',
    revenue: 'USD 180M',
    iniciativa: 'Migración EBS a Fusion Cloud',
    plazo: '3–6 meses',
    score: 87,
    status: 'Nuevo',
    source: 'Rescue Assessment',
    email: 'm.saldivar@imictica.com',
    historial: [{ fecha: '20 may', estado: 'Nuevo', autor: 'system' }],
  },
  {
    id: 'lead-002',
    date: '20 may',
    nombre: 'R. Méndez',
    cargo: 'COO',
    company: 'TransLog SA',
    industry: 'Logística',
    revenue: 'USD 240M',
    iniciativa: 'Greenfield Fusion Cloud SCM',
    plazo: '6–12 meses',
    score: 82,
    status: 'Aprobado',
    source: 'Office Hours',
    email: 'r.mendez@translog.mx',
    historial: [
      { fecha: '20 may', estado: 'Nuevo',    autor: 'system'        },
      { fecha: '20 may', estado: 'Aprobado', autor: 'Julio Alvarez' },
    ],
  },
  {
    id: 'lead-003',
    date: '19 may',
    nombre: 'A. Torres',
    cargo: 'CFO',
    company: 'FinCore Bank',
    industry: 'Financiero',
    revenue: 'USD 320M',
    iniciativa: 'Rescate Fusion Cloud — cierre contable fallido',
    plazo: 'Próximos 3 meses',
    score: 91,
    status: 'WaitList',
    source: 'Founder Line',
    email: 'a.torres@fincore.mx',
    historial: [
      { fecha: '19 may', estado: 'Nuevo',    autor: 'system'        },
      { fecha: '19 may', estado: 'WaitList', autor: 'Julio Alvarez' },
    ],
  },
  {
    id: 'lead-004',
    date: '19 may',
    nombre: 'C. Ríos',
    cargo: 'CFO',
    company: 'Plazas del Norte',
    industry: 'Inmobiliario',
    revenue: 'USD 95M',
    iniciativa: 'Implementación Oracle Fusion Financials',
    plazo: '6–12 meses',
    score: 74,
    status: 'Revisión',
    source: 'AI Diagnostic',
    email: 'c.rios@plazasnorte.mx',
    queryChat: '¿Cuánto tarda una implementación Fusion para operador multi-plaza?',
    historial: [{ fecha: '19 may', estado: 'Nuevo', autor: 'system' }],
  },
  {
    id: 'lead-005',
    date: '18 may',
    nombre: 'D. Vega',
    cargo: 'CTO',
    company: 'Aplazo Corp',
    industry: 'Financiero',
    revenue: 'USD 150M',
    iniciativa: 'Migración JDE a Fusion Cloud',
    plazo: '3–6 meses',
    score: 79,
    status: 'Aprobado',
    source: 'TCO Comparator',
    email: 'd.vega@aplazo.mx',
    historial: [
      { fecha: '18 may', estado: 'Nuevo',    autor: 'system'        },
      { fecha: '18 may', estado: 'Aprobado', autor: 'Julio Alvarez' },
    ],
  },
  {
    id: 'lead-006',
    date: '16 may',
    nombre: 'L. Mora',
    cargo: 'CFO',
    company: 'Capital Seguro',
    industry: 'Financiero',
    revenue: 'USD 420M',
    iniciativa: 'Rescate Oracle EBS — adopción crítica',
    plazo: 'Próximos 3 meses',
    score: 94,
    status: 'WaitList',
    source: 'Founder Line',
    email: 'l.mora@capitalseguro.mx',
    historial: [
      { fecha: '16 may', estado: 'Nuevo',    autor: 'system'        },
      { fecha: '16 may', estado: 'WaitList', autor: 'Julio Alvarez' },
    ],
  },
  {
    id: 'lead-007',
    date: '15 may',
    nombre: 'F. Luna',
    cargo: 'CTO',
    company: 'Centros Alfa',
    industry: 'Inmobiliario',
    revenue: 'USD 75M',
    iniciativa: 'Optimización Oracle existente',
    plazo: 'Sin plazo definido',
    score: 55,
    status: 'Rechazado',
    source: 'AI Diagnostic',
    email: 'f.luna@centrosalfa.mx',
    notas: 'Revenue por debajo de USD 50M. No cumple criterio de admisión.',
    historial: [
      { fecha: '15 may', estado: 'Nuevo',     autor: 'system'        },
      { fecha: '15 may', estado: 'Rechazado', autor: 'Julio Alvarez' },
    ],
  },
  {
    id: 'lead-008',
    date: '14 may',
    nombre: 'G. Salas',
    cargo: 'COO',
    company: 'FlexCargo',
    industry: 'Logística',
    revenue: 'USD 310M',
    iniciativa: 'Greenfield Oracle Fusion SCM + Financials',
    plazo: '6–12 meses',
    score: 88,
    status: 'Aprobado',
    source: 'Office Hours',
    email: 'g.salas@flexcargo.mx',
    historial: [
      { fecha: '14 may', estado: 'Nuevo',    autor: 'system'        },
      { fecha: '14 may', estado: 'Aprobado', autor: 'Julio Alvarez' },
    ],
  },
];

export const INITIAL_OFFICE_HOURS: OfficeHoursSlot[] = [
  {
    id: 'oh-001',
    fecha: 'Jue 22 mayo · 16:00',
    isoDate: '2026-05-22T16:00:00-06:00',
    disponible: false,
    reservadoPor: 'R. Méndez',
    empresa: 'TransLog SA',
    email: 'r.mendez@translog.mx',
    confirmado: true,
  },
  {
    id: 'oh-002',
    fecha: 'Vie 23 mayo · 11:00',
    isoDate: '2026-05-23T11:00:00-06:00',
    disponible: true,
    confirmado: false,
  },
  {
    id: 'oh-003',
    fecha: 'Lun 26 mayo · 17:00',
    isoDate: '2026-05-26T17:00:00-06:00',
    disponible: true,
    confirmado: false,
  },
  {
    id: 'oh-004',
    fecha: 'Mié 28 mayo · 16:00',
    isoDate: '2026-05-28T16:00:00-06:00',
    disponible: false,
    reservadoPor: 'G. Salas',
    empresa: 'FlexCargo',
    email: 'g.salas@flexcargo.mx',
    confirmado: false,
  },
];

// ─── ESTADO INICIAL COMPLETO ──────────────────────────────────────────────────

export const INITIAL_STORE: FabricStore = {
  capacidad: {
    slots: INITIAL_SLOTS,
    waitlist: INITIAL_WAITLIST,
    admissionOpen: true,
    admissionQuarters: INITIAL_ADMISSION_QUARTERS,
    deadlineQ3: '2026-07-30T23:59:59-06:00',
  },
  metricas: INITIAL_METRICAS,
  leads: INITIAL_LEADS,
  officeHours: INITIAL_OFFICE_HOURS,
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/** Cuenta slots por estado */
export function countSlots(slots: SlotStatus[]) {
  return {
    activos:   slots.filter(s => s === 'activo').length,
    reservados: slots.filter(s => s === 'reservado').length,
    libres:    slots.filter(s => s === 'libre').length,
  };
}

/** Obtiene la métrica pública por id */
export function getMetrica(metricas: MetricaPublica[], id: string) {
  return metricas.find(m => m.id === id);
}

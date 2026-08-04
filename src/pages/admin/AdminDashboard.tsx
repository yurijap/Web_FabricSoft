import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  ChevronDown,
  Filter,
  Gauge,
  Info,
  Sparkles,
  Target,
  TrendingUp,
  UsersRound,
} from 'lucide-react';
import { useAuthApi } from '../../config/api';

type Period = '7d' | '30d' | '90d';
type IndustryFilter = 'Todas' | 'Inmobiliario' | 'Logística' | 'Financiero';
type StatusFilter = 'Todos' | 'Nuevo' | 'Revisión' | 'Aprobado' | 'WaitList' | 'Rechazado';

type Lead = {
  date: string;
  company: string;
  contact: string;
  industry: Exclude<IndustryFilter, 'Todas'>;
  revenueValue: number;
  revenue: string;
  score: number;
  status: Exclude<StatusFilter, 'Todos'>;
  source: 'Founder Line' | 'AI Chat' | 'Office Hours' | 'Referral';
  createdAtObj?: Date;
};

interface BackendLead {
  _id: string;
  nombre: string;
  cargo: string;
  empresa: string;
  revenue: string;
  email: string;
  industria: string;
  iniciativa: string;
  plazo: string;
  source: string;
  score: number;
  status: string;
  createdAt: string;
}

const PERIODS: Array<{ label: string; value: Period }> = [
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
  { label: '90D', value: '90d' },
];

const INDUSTRIES: IndustryFilter[] = ['Todas', 'Inmobiliario', 'Logística', 'Financiero'];
const STATUSES: StatusFilter[] = ['Todos', 'Nuevo', 'Revisión', 'Aprobado', 'WaitList', 'Rechazado'];

const periodConfig: Record<Period, { labels: string[]; pipeline: number[]; capacity: number }> = {
  '7d': {
    labels: ['L', 'M', 'M', 'J', 'V', 'S', 'D'],
    pipeline: [40, 65, 30, 80, 55, 20, 10],
    capacity: 75,
  },
  '30d': {
    labels: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7'],
    pipeline: [32, 48, 42, 61, 58, 72, 64],
    capacity: 82,
  },
  '90d': {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul'],
    pipeline: [44, 52, 68, 63, 77, 82, 74],
    capacity: 88,
  },
};

const baseLeads: Lead[] = [
  // Financiero (10 leads)
  { date: '28 may', company: 'Banco Atlas', contact: 'R. Molina CFO', industry: 'Financiero', revenueValue: 8.5, revenue: 'USD 8.5M', score: 94, status: 'Aprobado', source: 'Founder Line' },
  { date: '26 may', company: 'FinCore Bank', contact: 'A. Torres CFO', industry: 'Financiero', revenueValue: 6.2, revenue: 'USD 6.2M', score: 91, status: 'WaitList', source: 'AI Chat' },
  { date: '24 may', company: 'CryptoCred LatAm', contact: 'J. Delgado CEO', industry: 'Financiero', revenueValue: 3.8, revenue: 'USD 3.8M', score: 85, status: 'Nuevo', source: 'Referral' },
  { date: '22 may', company: 'Aseguradora Patria', contact: 'S. Ruiz COO', industry: 'Financiero', revenueValue: 7.4, revenue: 'USD 7.4M', score: 88, status: 'Aprobado', source: 'Founder Line' },
  { date: '20 may', company: 'Valores Monterrey', contact: 'M. Garza CTO', industry: 'Financiero', revenueValue: 4.5, revenue: 'USD 4.5M', score: 79, status: 'Nuevo', source: 'Office Hours' },
  { date: '18 may', company: 'MicroFondeo MX', contact: 'L. Beltrán COO', industry: 'Financiero', revenueValue: 2.1, revenue: 'USD 2.1M', score: 73, status: 'WaitList', source: 'AI Chat' },
  { date: '16 may', company: 'Banco de la Frontera', contact: 'P. Domínguez CFO', industry: 'Financiero', revenueValue: 9.1, revenue: 'USD 9.1M', score: 93, status: 'Aprobado', source: 'Founder Line' },
  { date: '14 may', company: 'Fintech Spark', contact: 'G. Nova CEO', industry: 'Financiero', revenueValue: 1.8, revenue: 'USD 1.8M', score: 68, status: 'Nuevo', source: 'Referral' },
  { date: '12 may', company: 'Caja Solidaria', contact: 'F. Ortega CFO', industry: 'Financiero', revenueValue: 3.0, revenue: 'USD 3.0M', score: 76, status: 'Nuevo', source: 'Office Hours' },
  { date: '10 may', company: 'Inversiones Omega', contact: 'D. Vaca COO', industry: 'Financiero', revenueValue: 5.4, revenue: 'USD 5.4M', score: 82, status: 'Aprobado', source: 'AI Chat' },

  // Inmobiliario (9 leads)
  { date: '27 may', company: 'Inmobiliaria Mítica', contact: 'M. Saldívar CFO', industry: 'Inmobiliario', revenueValue: 5.8, revenue: 'USD 5.8M', score: 87, status: 'Nuevo', source: 'Founder Line' },
  { date: '25 may', company: 'Habita Norte', contact: 'L. Cano COO', industry: 'Inmobiliario', revenueValue: 4.2, revenue: 'USD 4.2M', score: 76, status: 'Aprobado', source: 'Referral' },
  { date: '23 may', company: 'Desarrollos Aura', contact: 'C. Slim Jr. CEO', industry: 'Inmobiliario', revenueValue: 9.5, revenue: 'USD 9.5M', score: 92, status: 'Aprobado', source: 'Founder Line' },
  { date: '21 may', company: 'Terraza Real Estate', contact: 'E. Peña COO', industry: 'Inmobiliario', revenueValue: 3.1, revenue: 'USD 3.1M', score: 71, status: 'Nuevo', source: 'AI Chat' },
  { date: '19 may', company: 'Condominios del Sol', contact: 'A. Baños CFO', industry: 'Inmobiliario', revenueValue: 2.7, revenue: 'USD 2.7M', score: 65, status: 'WaitList', source: 'Office Hours' },
  { date: '17 may', company: 'Fibra Inmuebles', contact: 'V. Luján CEO', industry: 'Inmobiliario', revenueValue: 6.9, revenue: 'USD 6.9M', score: 84, status: 'Aprobado', source: 'Referral' },
  { date: '15 may', company: 'Urbanizaciones MX', contact: 'R. Covarrubias CTO', industry: 'Inmobiliario', revenueValue: 4.8, revenue: 'USD 4.8M', score: 78, status: 'Nuevo', source: 'AI Chat' },
  { date: '13 may', company: 'Parques Industriales Bajío', contact: 'H. Herrera COO', industry: 'Inmobiliario', revenueValue: 8.0, revenue: 'USD 8.0M', score: 89, status: 'Aprobado', source: 'Founder Line' },
  { date: '11 may', company: 'Edificios Quantum', contact: 'J. Reyes CFO', industry: 'Inmobiliario', revenueValue: 3.5, revenue: 'USD 3.5M', score: 72, status: 'Nuevo', source: 'Office Hours' },

  // Logística (9 leads)
  { date: '28 may', company: 'TransLog SA', contact: 'R. Méndez COO', industry: 'Logística', revenueValue: 6.4, revenue: 'USD 6.4M', score: 82, status: 'Aprobado', source: 'Office Hours' },
  { date: '26 may', company: 'Ruta Fría MX', contact: 'P. Ibarra CTO', industry: 'Logística', revenueValue: 3.2, revenue: 'USD 3.2M', score: 69, status: 'Nuevo', source: 'AI Chat' },
  { date: '24 may', company: 'Súper Envío Exprés', contact: 'E. Blanco CEO', industry: 'Logística', revenueValue: 5.0, revenue: 'USD 5.0M', score: 80, status: 'Aprobado', source: 'Referral' },
  { date: '22 may', company: 'Fletes y Maniobras del Golfo', contact: 'F. Soto CFO', industry: 'Logística', revenueValue: 4.1, revenue: 'USD 4.1M', score: 74, status: 'Nuevo', source: 'Founder Line' },
  { date: '20 may', company: 'Puertos del Pacífico', contact: 'N. Castro COO', industry: 'Logística', revenueValue: 8.8, revenue: 'USD 8.8M', score: 90, status: 'WaitList', source: 'AI Chat' },
  { date: '18 may', company: 'Distribución Global', contact: 'M. Sosa CEO', industry: 'Logística', revenueValue: 7.2, revenue: 'USD 7.2M', score: 86, status: 'Aprobado', source: 'Founder Line' },
  { date: '16 may', company: 'LogiRed', contact: 'A. Navarro CTO', industry: 'Logística', revenueValue: 2.5, revenue: 'USD 2.5M', score: 66, status: 'Nuevo', source: 'Office Hours' },
  { date: '14 may', company: 'Carga Aérea Express', contact: 'H. Valadez CFO', industry: 'Logística', revenueValue: 6.0, revenue: 'USD 6.0M', score: 81, status: 'Aprobado', source: 'Referral' },
  { date: '12 may', company: 'Almacenes del Norte', contact: 'K. López COO', industry: 'Logística', revenueValue: 4.9, revenue: 'USD 4.9M', score: 77, status: 'Nuevo', source: 'AI Chat' },
];

const parseBaseLeadDate = (dateStr: string): Date => {
  const months: Record<string, number> = {
    ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5, jul: 6, ago: 7, sep: 8, oct: 9, nov: 10, dic: 11
  };
  const parts = dateStr.trim().split(/\s+/);
  const day = parseInt(parts[0], 10);
  const monthName = parts[1]?.toLowerCase();
  const monthIndex = months[monthName] ?? new Date().getMonth();
  const year = new Date().getFullYear();
  return new Date(year, monthIndex, day);
};

const baseLeadsWithDates: Lead[] = baseLeads.map(lead => ({
  ...lead,
  createdAtObj: parseBaseLeadDate(lead.date)
}));

const STATUS_CLASS: Record<Exclude<StatusFilter, 'Todos'>, string> = {
  Nuevo: 'border-border-strong bg-bg-elevated text-text-primary',
  'Revisión': 'border-amber-400/25 bg-amber-400/10 text-amber-300',
  Aprobado: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300',
  WaitList: 'border-sky-400/25 bg-sky-400/10 text-sky-300',
  Rechazado: 'border-[#B85450]/25 bg-[#B85450]/10 text-[#B85450]',
};

function AdminHeader({
  period,
  setPeriod,
  industry,
  setIndustry,
  status,
  setStatus,
  filtersOpen,
  setFiltersOpen,
}: {
  period: Period;
  setPeriod: (period: Period) => void;
  industry: IndustryFilter;
  setIndustry: (industry: IndustryFilter) => void;
  status: StatusFilter;
  setStatus: (status: StatusFilter) => void;
  filtersOpen: boolean;
  setFiltersOpen: (open: boolean) => void;
}) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const hasActiveFilters = period !== '7d' || industry !== 'Todas' || status !== 'Todos';

  return (
    <header className="fabric-admin-hero">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 border border-border bg-bg-panel px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-text-secondary">
              <Sparkles size={12} />
              FABRIC · Admin
            </div>
            <h1 className="fabric-admin-title">
              Dashboard operativo
            </h1>
            <p className="fabric-admin-subtitle">
              Pipeline, capacidad, revenue y admisión en una vista filtrable.
            </p>
          </div>

          <div className="fabric-admin-pill flex-col items-start gap-1 lg:items-end">
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-text-tertiary">
              Sincronizado
            </div>
            <div className="mt-1 text-xs capitalize text-text-secondary">{dateStr}</div>
          </div>
        </div>

        <div className="admin-main-panel overflow-hidden rounded-md">
          <div className="grid gap-3 px-4 py-3 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="flex min-w-0 items-start gap-3 sm:items-center">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-border bg-bg-elevated text-accent">
                <Filter size={14} />
              </span>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-primary">
                  Filtros de operación
                </div>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <FilterPill label={period.toUpperCase()} />
                  <FilterPill label={industry} />
                  <FilterPill label={status} />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setFiltersOpen(!filtersOpen)}
                className={[
                  'group inline-flex h-10 items-center justify-center gap-2 rounded-sm border px-4 text-[11px] font-semibold uppercase tracking-[0.12em] transition sm:min-w-[158px]',
                  filtersOpen
                    ? 'border-accent/45 bg-[var(--accent-soft)] text-text-primary'
                    : 'border-border bg-bg-base text-text-secondary hover:border-border-strong hover:bg-bg-elevated hover:text-text-primary',
                ].join(' ')}
              >
                {filtersOpen ? 'Ocultar filtros' : 'Filtrar'}
                <ChevronDown
                  size={14}
                  className={[
                    'transition-transform duration-300',
                    filtersOpen ? 'rotate-180 text-accent' : 'group-hover:text-text-primary',
                  ].join(' ')}
                />
              </button>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setPeriod('7d');
                    setIndustry('Todas');
                    setStatus('Todos');
                  }}
                  className="h-10 rounded-sm border border-border bg-bg-base px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-tertiary transition hover:border-border-strong hover:bg-bg-elevated hover:text-text-primary sm:min-w-[108px]"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>

          <div
            className={[
              'grid gap-3 overflow-hidden border-t border-border bg-bg-base/45 transition-[max-height,opacity,transform,padding] duration-300 ease-out md:grid-cols-3',
              filtersOpen ? 'max-h-[620px] translate-y-0 p-3 opacity-100' : 'max-h-0 -translate-y-2 p-0 opacity-0',
            ].join(' ')}
          >
            <Segmented label="Periodo" items={PERIODS} value={period} onChange={setPeriod} />
            <Segmented
              label="Industria"
              items={INDUSTRIES.map((item) => ({ label: item, value: item }))}
              value={industry}
              onChange={setIndustry}
            />
            <Segmented
              label="Estado"
              items={STATUSES.map((item) => ({ label: item, value: item }))}
              value={status}
              onChange={setStatus}
            />
          </div>
        </div>
      </div>
    </header>
  );
}

function Segmented<T extends string>({
  label,
  items,
  value,
  onChange,
}: {
  label: string;
  items: Array<{ label: string; value: T }>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="min-w-0 rounded-sm border border-border bg-bg-panel p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-text-tertiary">
          {label}
        </div>
        <div className="max-w-[60%] truncate rounded-sm border border-accent/25 bg-[var(--accent-soft)] px-2 py-0.5 text-right font-mono text-[10px] text-accent">
          {value}
        </div>
      </div>
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(96px, 1fr))' }}
      >
        {items.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            className={[
              'relative min-h-10 min-w-0 overflow-hidden rounded-sm border px-3 py-2 text-center text-[12px] font-medium leading-tight tracking-[0.01em] transition duration-200',
              value === item.value
                ? 'border-accent/45 bg-[var(--accent-soft)] text-text-primary'
                : 'border-border bg-bg-base text-text-secondary hover:border-border-strong hover:bg-bg-elevated hover:text-text-primary',
            ].join(' ')}
          >
            <span className="block overflow-hidden text-ellipsis whitespace-nowrap">{item.label}</span>
            {value === item.value && <span className="absolute inset-x-2 bottom-0 h-px bg-accent" />}
          </button>
        ))}
      </div>
    </div>
  );
}

function FilterPill({ label }: { label: string }) {
  return (
    <span className="rounded-sm border border-border bg-bg-base px-2 py-0.5 text-[10px] font-medium text-text-tertiary">
      {label}
    </span>
  );
}

function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <article className={`admin-main-panel rounded-md border border-border bg-bg-panel shadow-[0_18px_44px_rgba(0,0,0,0.16)] ${className}`}>
      {children}
    </article>
  );
}

function SectionTitle({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">{eyebrow}</div>
        <h2 className="mt-1 font-serif text-2xl text-text-primary">{title}</h2>
      </div>
      {action}
    </div>
  );
}

const mapBackendLeadToDashboard = (bl: BackendLead): Lead => {
  const dateObj = new Date(bl.createdAt);
  const dateStr = dateObj.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }).toLowerCase();

  let mappedIndustry: Exclude<IndustryFilter, 'Todas'> = 'Inmobiliario';
  const ind = (bl.industria || '').toLowerCase();
  if (ind.includes('financiero') || ind.includes('finance')) mappedIndustry = 'Financiero';
  else if (ind.includes('logistica') || ind.includes('logistics') || ind.includes('distribucion')) mappedIndustry = 'Logística';
  else mappedIndustry = 'Inmobiliario';

  let revVal = 0;
  if (bl.revenue) {
    const match = bl.revenue.match(/[\d.]+/);
    revVal = match ? parseFloat(match[0]) : 0;
  }

  let mappedStatus: Exclude<StatusFilter, 'Todos'> = 'Nuevo';
  if (['Nuevo', 'Aprobado', 'WaitList', 'Revisión', 'Rechazado'].includes(bl.status)) {
    mappedStatus = bl.status as Exclude<StatusFilter, 'Todos'>;
  }

  let mappedSource: Lead['source'] = 'AI Chat';
  const src = (bl.source || '').toLowerCase();
  if (src.includes('aplicar')) mappedSource = 'Founder Line';
  else if (src.includes('office')) mappedSource = 'Office Hours';
  else if (src.includes('waitlist')) mappedSource = 'Founder Line';
  else if (src.includes('chat') || src.includes('agente')) mappedSource = 'AI Chat';
  else mappedSource = 'Referral';

  return {
    date: dateStr,
    company: bl.empresa,
    contact: `${bl.nombre} · ${bl.cargo}`,
    industry: mappedIndustry,
    revenueValue: revVal,
    revenue: bl.revenue || 'USD 0M',
    score: bl.score || 0,
    status: mappedStatus,
    source: mappedSource,
    createdAtObj: dateObj,
  };
};

export default function AdminDashboard() {
  const adminApi = useAuthApi();
  const [leads, setLeads]         = useState<Lead[]>([]);
  const [loading, setLoading]     = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const [period, setPeriod] = useState<Period>('7d');
  const [industry, setIndustry] = useState<IndustryFilter>('Todas');
  const [status, setStatus] = useState<StatusFilter>('Todos');
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await adminApi.get('/leads/admin');
        const dbLeads: BackendLead[] = res.data.data || [];
        if (dbLeads.length > 0) {
          setLeads(dbLeads.map(mapBackendLeadToDashboard));
          setIsDemoMode(false);
        } else {
          setLeads(baseLeadsWithDates);
          setIsDemoMode(true);
        }
      } catch (err) {
        console.error("Error cargando leads en el dashboard:", err);
        setLeads(baseLeadsWithDates);
        setIsDemoMode(true);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [adminApi]);

  const filteredLeads = useMemo(() => {
    const activeLeads = isDemoMode ? baseLeadsWithDates : leads;
    return activeLeads.filter((lead) => {
      const industryOk = industry === 'Todas' || lead.industry === industry;
      const statusOk = status === 'Todos' || lead.status === status;

      let periodOk = true;
      if (lead.createdAtObj) {
        const leadDate = lead.createdAtObj.getTime();
        const now = new Date();
        const diffTime = now.getTime() - leadDate;
        const diffDays = diffTime / (1000 * 60 * 60 * 24);

        if (period === '7d') {
          periodOk = diffDays <= 7;
        } else if (period === '30d') {
          periodOk = diffDays <= 30;
        } else if (period === '90d') {
          periodOk = diffDays <= 90;
        }
      }
      return industryOk && statusOk && periodOk;
    });
  }, [isDemoMode, leads, industry, status, period]);

  const pipeline = useMemo(() => {
    if (filteredLeads.length === 0) {
      if (period === '7d') {
        return ['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(label => ({ label, val: 0 }));
      } else if (period === '30d') {
        return ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7'].map(label => ({ label, val: 0 }));
      } else {
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const now = new Date();
        const labels: string[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          labels.push(monthNames[d.getMonth()]);
        }
        return labels.map(label => ({ label, val: 0 }));
      }
    }

    const now = new Date();

    if (period === '7d') {
      const labels = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
      const counts = [0, 0, 0, 0, 0, 0, 0];
      const baseline = [15, 20, 18, 22, 17, 8, 5];

      filteredLeads.forEach(lead => {
        if (lead.createdAtObj) {
          const day = lead.createdAtObj.getDay();
          const index = day === 0 ? 6 : day - 1;
          if (index >= 0 && index < 7) {
            counts[index]++;
          }
        }
      });

      return labels.map((label, i) => ({
        label,
        val: counts[i] * 12 + baseline[i]
      }));
    } else if (period === '30d') {
      const labels = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7'];
      const counts = [0, 0, 0, 0, 0, 0, 0];
      const baseline = [12, 15, 18, 14, 22, 20, 25];

      filteredLeads.forEach(lead => {
        if (lead.createdAtObj) {
          const diffTime = now.getTime() - lead.createdAtObj.getTime();
          const diffDays = Math.max(0, diffTime / (1000 * 60 * 60 * 24));
          const bucket = 6 - Math.floor(diffDays / (30 / 7));
          const clampedBucket = Math.max(0, Math.min(6, bucket));
          counts[clampedBucket]++;
        }
      });

      return labels.map((label, i) => ({
        label,
        val: counts[i] * 10 + baseline[i]
      }));
    } else {
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const labels: string[] = [];
      const bucketMonths: { year: number; month: number }[] = [];
      const counts: number[] = [0, 0, 0, 0, 0, 0, 0];
      const baseline = [30, 35, 28, 42, 38, 45, 50];

      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        labels.push(monthNames[d.getMonth()]);
        bucketMonths.push({ year: d.getFullYear(), month: d.getMonth() });
      }

      filteredLeads.forEach(lead => {
        if (lead.createdAtObj) {
          const year = lead.createdAtObj.getFullYear();
          const month = lead.createdAtObj.getMonth();
          const bucketIndex = bucketMonths.findIndex(b => b.year === year && b.month === month);
          if (bucketIndex !== -1) {
            counts[bucketIndex]++;
          }
        }
      });

      return labels.map((label, i) => ({
        label,
        val: counts[i] * 8 + baseline[i]
      }));
    }
  }, [filteredLeads, period]);

  const maxPipeline = Math.max(...pipeline.map((p) => p.val), 1);

  const totalRevenue = filteredLeads.reduce((sum, lead) => sum + lead.revenueValue, 0);
  const avgScore = Math.round(filteredLeads.reduce((sum, lead) => sum + lead.score, 0) / Math.max(filteredLeads.length, 1));
  const approved = filteredLeads.filter((lead) => lead.status === 'Aprobado').length;
  const config = periodConfig[period];
  const capacity = config.capacity;

  const kpis = [
    {
      label: 'Leads filtrados',
      scope: period.toUpperCase(),
      value: String(filteredLeads.length),
      delta: `${approved} aprobados`,
      icon: UsersRound,
      progress: Math.min(92, filteredLeads.length * 3),
      explanation: 'Cantidad de oportunidades comerciales activas y calificadas que cumplen con los filtros seleccionados.',
    },
    {
      label: 'Revenue potencial',
      scope: 'Pipeline',
      value: `USD ${totalRevenue.toFixed(1)}M`,
      delta: industry === 'Todas' ? 'Todas las industrias' : industry,
      icon: TrendingUp,
      progress: Math.min(92, (totalRevenue / 150) * 100),
      explanation: 'Suma estimada del presupuesto total de los leads calificados en proceso. Representa el pipeline de admisión Q3.',
    },
    {
      label: 'Score promedio',
      scope: 'Calidad',
      value: String(avgScore || 0),
      delta: avgScore >= 85 ? 'Prioridad alta' : 'Revisar fit',
      icon: Target,
      progress: avgScore,
      explanation: 'Índice de calidad ponderado (0-100). Calcula el fit técnico de Oracle (40%), el presupuesto (40%) y la urgencia (20%).',
    },
    {
      label: 'Capacidad',
      scope: 'Ocupada',
      value: `${capacity}%`,
      delta: capacity > 80 ? 'Límite crítico' : 'Estable',
      icon: Gauge,
      progress: capacity,
      explanation: 'Porcentaje de horas de arquitectura/consultoría Senior asignadas para Q3 sobre 480h/mes totales. Límite de seguridad: 85%.',
    },
  ];

  const revenueByIndustry = INDUSTRIES.filter((item) => item !== 'Todas').map((item) => {
    const value = filteredLeads
      .filter((lead) => lead.industry === item)
      .reduce((sum, lead) => sum + lead.revenueValue, 0);
    return { label: item, value };
  });
  const maxRevenue = Math.max(...revenueByIndustry.map((item) => item.value), 1);

  const statusFunnel = STATUSES.filter((item) => item !== 'Todos').map((item) => {
    const value = filteredLeads.filter((lead) => lead.status === item).length;
    return { label: item, value, width: `${Math.max(12, (value / Math.max(filteredLeads.length, 1)) * 100)}%` };
  });

  const sourceData = ['Founder Line', 'AI Chat', 'Office Hours', 'Referral'].map((source) => ({
    source,
    value: filteredLeads.filter((lead) => lead.source === source).length,
  }));
  const maxSource = Math.max(...sourceData.map((item) => item.value), 1);

  if (loading && leads.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] font-sans">
        <div className="relative mb-6 flex h-12 w-12 items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-[#2A2A2A]" />
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-[#C9A96E]" />
        </div>
      </div>
    );
  }

  return (
    <div className="fabric-admin-page">
      <AdminHeader
        period={period}
        setPeriod={setPeriod}
        industry={industry}
        setIndustry={setIndustry}
        status={status}
        setStatus={setStatus}
        filtersOpen={filtersOpen}
        setFiltersOpen={setFiltersOpen}
      />

      {isDemoMode && (
        <div className="mx-6 mt-4 flex items-center justify-between border border-accent/30 bg-[var(--accent-soft)] px-4 py-3 text-xs text-accent rounded-sm">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="animate-pulse" />
            <span><strong>Modo de Simulación Activo</strong>: Mostrando datos de demostración del pipeline corporativo porque la base de datos real está vacía.</span>
          </div>
          <button 
            onClick={() => setIsDemoMode(false)}
            className="underline font-bold uppercase tracking-wider text-[10px] hover:text-text-primary bg-transparent border-none cursor-pointer"
          >
            Ver datos reales (vacío)
          </button>
        </div>
      )}

      {!isDemoMode && leads.length === 0 && (
        <div className="mx-6 mt-4 flex items-center justify-between border border-border bg-bg-panel px-4 py-3 text-xs text-text-secondary rounded-sm">
          <div className="flex items-center gap-2 text-text-tertiary">
            <span>Mostrando base de datos real (vacía). No hay leads registrados aún en la plataforma.</span>
          </div>
          <button 
            onClick={() => setIsDemoMode(true)}
            className="underline font-bold uppercase tracking-wider text-[10px] hover:text-text-primary bg-transparent border-none cursor-pointer"
          >
            Cargar demo de simulación
          </button>
        </div>
      )}

      <div className="fabric-admin-content space-y-5">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map(({ label, scope, value, delta, icon: Icon, progress, explanation }) => (
            <Panel key={label} className="p-4 transition hover:border-border-strong hover:bg-bg-elevated">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-text-tertiary">{label}</div>
                    <div className="group relative cursor-help text-text-tertiary hover:text-accent transition-colors">
                      <Info size={11} className="opacity-60 hover:opacity-100" />
                      <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-56 -translate-x-1/2 rounded-md border border-border bg-[#0c0c0b] p-2.5 text-[10px] font-medium leading-relaxed normal-case tracking-normal text-text-secondary opacity-0 shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition-opacity duration-200 group-hover:pointer-events-auto group-hover:opacity-100 whitespace-normal">
                        {explanation}
                        <div className="absolute top-full left-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-[2px] rotate-45 border-b border-r border-border bg-[#0c0c0b]" />
                      </div>
                    </div>
                  </div>
                  <div className="mt-1 text-[10px] uppercase tracking-[0.16em] text-text-secondary">{scope}</div>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-sm border border-border bg-bg-elevated text-text-secondary">
                  <Icon size={15} />
                </div>
              </div>

              <div className="mt-4 flex items-end justify-between gap-3">
                <div className="font-serif text-3xl text-text-primary sm:text-4xl">{value}</div>
                <div className="pb-1 text-right text-[11px] leading-5 text-text-tertiary">{delta}</div>
              </div>

              <div className="mt-4 h-1 rounded-full bg-bg-elevated">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent/65 to-text-secondary/60"
                  style={{ width: `${Math.min(100, progress)}%` }}
                />
              </div>
            </Panel>
          ))}
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
          <Panel className="p-5">
            <SectionTitle
              eyebrow="Pipeline"
              title="Actividad comercial"
              action={<div className="text-right text-[11px] uppercase tracking-[0.12em] text-text-tertiary">{period.toUpperCase()} · {industry} · {status}</div>}
            />
            <p className="mt-2 text-xs text-text-secondary max-w-xl">
              Volumen operativo de interacciones diarias registradas, incluyendo análisis automáticos ejecutados por el Agente de IA, llamadas de diagnóstico y correos de validación técnica en el periodo.
            </p>
            <div className="mt-6">
              <div className="flex h-48 items-stretch gap-2">
                <div className="flex flex-col justify-between text-[9px] font-mono text-text-tertiary pb-4 text-right pr-2 border-r border-border w-10 shrink-0">
                  <span>{maxPipeline} int</span>
                  <span>{Math.round(maxPipeline * 0.66)} int</span>
                  <span>{Math.round(maxPipeline * 0.33)} int</span>
                  <span>0</span>
                </div>
                <div className="flex-1 flex items-end gap-2 border-b border-border pb-4 sm:gap-3">
                  {pipeline.map((point, index) => (
                    <div key={`${point.label}-${index}`} className="flex h-full flex-1 flex-col justify-end gap-2 group relative">
                      <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 rounded bg-black/90 border border-border px-2 py-1 text-[9px] font-mono text-accent opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap shadow-md">
                        {point.val} interacciones
                      </div>
                      <div className="text-center text-[10px] text-text-tertiary font-mono">{point.val}</div>
                      <div className="flex w-full items-end justify-center">
                        <div
                          className="w-full max-w-11 rounded-t-sm bg-gradient-to-t from-accent-2/70 via-accent/55 to-text-secondary/75 transition hover:brightness-125"
                          style={{ height: `${(point.val / maxPipeline) * 100}%`, minHeight: 8 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-3 flex gap-2 pl-12">
                {pipeline.map((point, index) => (
                  <div key={`${point.label}-label-${index}`} className="flex-1 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-text-tertiary">
                    {point.label}
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          <Panel className="p-5">
            <SectionTitle
              eyebrow="Capacidad Q3"
              title="Ocupación"
              action={<span className="rounded-sm border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.13em] text-emerald-300">Estable</span>}
            />
            <p className="mt-2 text-xs text-text-secondary leading-relaxed">
              Asignación de horas de consultoría de arquitectura Senior para el trimestre actual (Q3). Capacidad mensual total de 480 horas (equivalente a 3 consultores Senior). Límite de seguridad recomendado: 85%.
            </p>

            <div className="mt-6 grid grid-cols-[120px_1fr] items-center gap-5">
              <div
                className="grid h-28 w-28 place-items-center rounded-full"
                style={{
                  background: `conic-gradient(var(--accent) 0 ${capacity}%, var(--bg-elevated) ${capacity}% 100%)`,
                }}
              >
                <div className="grid h-20 w-20 place-items-center rounded-full bg-bg-panel">
                  <div className="font-serif text-3xl text-text-primary">{capacity}%</div>
                </div>
              </div>

              <div className="space-y-2 text-xs text-text-secondary">
                {[
                  ['Proyectos activos', '9'],
                  ['Proyectos reservados', period === '90d' ? '4' : '2'],
                  ['Límite operativo', '85%'],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between border-b border-border pb-2">
                    <span>{label}</span>
                    <span className="font-mono text-text-primary">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </Panel>
        </section>

        <section className="grid gap-5 xl:grid-cols-3">
          <Panel className="p-5">
            <SectionTitle eyebrow="Revenue" title="Por industria" action={<TrendingUp size={18} className="text-text-tertiary" />} />
            <p className="mt-2 text-[11px] leading-relaxed text-text-secondary">
              Distribución del pipeline estimado por sector industrial para Q3 2026. Valores en Millones de USD.
            </p>
            <div className="mt-5 space-y-4">
              {revenueByIndustry.map((item) => (
                <div key={item.label}>
                  <div className="mb-1 flex items-center justify-between text-[11px] text-text-secondary">
                    <span>{item.label}</span>
                    <span className="font-mono text-text-primary">USD {item.value}M</span>
                  </div>
                  <div className="h-3 rounded-full bg-bg-base">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-accent/60 to-text-secondary/50"
                      style={{ width: `${(item.value / maxRevenue) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="p-5">
            <SectionTitle eyebrow="Funnel" title="Leads por etapa" action={<Target size={18} className="text-text-tertiary" />} />
            <p className="mt-2 text-[11px] leading-relaxed text-text-secondary">
              Distribución actual de leads en las distintas fases del pipeline de admisión.
            </p>
            <div className="mt-5 space-y-3">
              {statusFunnel.map((item) => (
                <div key={item.label}>
                  <div className="mb-1 flex items-center justify-between text-[11px] text-text-secondary">
                    <span>{item.label}</span>
                    <span className="font-mono text-text-primary">{item.value}</span>
                  </div>
                  <div className="h-8 rounded-sm border border-border bg-bg-base">
                    <div className="h-full rounded-sm bg-bg-elevated" style={{ width: item.width }} />
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="p-5">
            <SectionTitle eyebrow="Canales" title="Origen de demanda" action={<UsersRound size={18} className="text-text-tertiary" />} />
            <p className="mt-2 text-[11px] leading-relaxed text-text-secondary">
              Origen del primer contacto de los prospectos calificados en el pipeline.
            </p>
            <div className="mt-5 grid grid-cols-4 items-end gap-3">
              {sourceData.map((item) => (
                <div key={item.source} className="flex h-36 flex-col items-center justify-end gap-2">
                  <div className="text-[10px] text-text-tertiary">{item.value}</div>
                  <div
                    className="w-full rounded-t-sm bg-bg-elevated"
                    style={{ height: `${Math.max(8, (item.value / maxSource) * 100)}%` }}
                  />
                  <div className="h-8 text-center text-[9px] leading-3 text-text-tertiary">{item.source}</div>
                </div>
              ))}
            </div>
          </Panel>
        </section>

        <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <Panel className="p-5">
            <SectionTitle eyebrow="Score" title="Calidad del pipeline" action={<span className="font-serif text-3xl text-text-primary">{avgScore || 0}</span>} />
            <div className="mt-5 grid grid-cols-3 gap-3">
              {['Fit', 'Revenue', 'Urgencia'].map((label, index) => {
                const value = Math.max(32, Math.min(96, avgScore - index * 9 + (period === '90d' ? 4 : 0)));
                return (
                  <div key={label} className="rounded-sm border border-border bg-bg-base p-3">
                    <div className="mb-2 text-[10px] uppercase tracking-[0.14em] text-text-tertiary">{label}</div>
                    <div className="h-20 border-b border-l border-border">
                      <div className="flex h-full items-end px-3">
                        <div className="w-full rounded-t-sm bg-gradient-to-t from-accent/55 to-text-secondary/60" style={{ height: `${value}%` }} />
                      </div>
                    </div>
                    <div className="mt-2 font-mono text-xs text-text-secondary">{value}</div>
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel className="p-5">
            <SectionTitle
              eyebrow="Office Hours"
              title="Agenda semanal"
              action={
                <Link
                  to="/admin/office-hours"
                  className="inline-flex items-center gap-2 rounded-sm border border-border px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-text-secondary transition hover:border-border-strong hover:bg-bg-elevated hover:text-text-primary"
                >
                  Abrir
                  <ArrowUpRight size={13} />
                </Link>
              }
            />

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                ['Confirmadas', '3'],
                ['Pendientes', '1'],
                ['Libres', '0'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-sm border border-border bg-bg-base p-4 text-center">
                  <div className="font-serif text-3xl text-text-primary">{value}</div>
                  <div className="mt-1 text-[10px] uppercase tracking-[0.14em] text-text-tertiary">{label}</div>
                </div>
              ))}
            </div>
          </Panel>
        </section>

        <Panel>
          <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">Leads recientes</div>
              <h2 className="mt-1 font-serif text-2xl text-text-primary">Evaluación comercial</h2>
            </div>
            <Link
              to="/admin/leads"
              className="inline-flex h-9 w-fit items-center gap-2 rounded-sm border border-border px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-text-secondary transition hover:border-border-strong hover:bg-bg-elevated hover:text-text-primary"
            >
              Ver todos
              <ArrowUpRight size={13} />
            </Link>
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[780px] border-collapse">
              <thead>
                <tr className="border-b border-border">
                  {['Fecha', 'Compañía', 'Contacto', 'Industria', 'Revenue', 'Score', 'Estado'].map((heading) => (
                    <th key={heading} className="px-5 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.17em] text-text-tertiary">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead, index) => (
                  <tr key={`${lead.company}-${lead.date}-${index}`} className="border-b border-bg-elevated transition hover:bg-bg-elevated/55">
                    <td className="whitespace-nowrap px-5 py-4 text-xs text-text-tertiary">{lead.date}</td>
                    <td className="px-5 py-4 text-sm font-medium text-text-primary">{lead.company}</td>
                    <td className="px-5 py-4 text-xs text-text-secondary">{lead.contact}</td>
                    <td className="px-5 py-4 text-xs text-text-secondary">{lead.industry}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-xs text-text-secondary">{lead.revenue}</td>
                    <td className="px-5 py-4 font-serif text-xl italic text-text-primary">{lead.score}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-sm border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.13em] ${STATUS_CLASS[lead.status]}`}>
                        {lead.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 p-4 md:hidden">
            {filteredLeads.map((lead, index) => (
              <article key={`${lead.company}-mobile-${index}`} className="rounded-sm border border-border bg-bg-base/55 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-text-primary">{lead.company}</div>
                    <div className="mt-1 text-xs text-text-tertiary">{lead.contact}</div>
                  </div>
                  <div className="font-serif text-2xl italic text-text-primary">{lead.score}</div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <InfoField label="Fecha" value={lead.date} />
                  <InfoField label="Revenue" value={lead.revenue} />
                  <InfoField label="Industria" value={lead.industry} />
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.14em] text-text-tertiary">Estado</div>
                    <span className={`mt-1 inline-flex rounded-sm border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${STATUS_CLASS[lead.status]}`}>
                      {lead.status}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.14em] text-text-tertiary">{label}</div>
      <div className="mt-1 text-text-secondary">{value}</div>
    </div>
  );
}

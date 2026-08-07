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
  // Financiero
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

  // Inmobiliario
  { date: '27 may', company: 'Inmobiliaria Mítica', contact: 'M. Saldívar CFO', industry: 'Inmobiliario', revenueValue: 5.8, revenue: 'USD 5.8M', score: 87, status: 'Nuevo', source: 'Founder Line' },
  { date: '25 may', company: 'Habita Norte', contact: 'L. Cano COO', industry: 'Inmobiliario', revenueValue: 4.2, revenue: 'USD 4.2M', score: 76, status: 'Aprobado', source: 'Referral' },
  { date: '23 may', company: 'Desarrollos Aura', contact: 'C. Slim Jr. CEO', industry: 'Inmobiliario', revenueValue: 9.5, revenue: 'USD 9.5M', score: 92, status: 'Aprobado', source: 'Founder Line' },
  { date: '21 may', company: 'Terraza Real Estate', contact: 'E. Peña COO', industry: 'Inmobiliario', revenueValue: 3.1, revenue: 'USD 3.1M', score: 71, status: 'Nuevo', source: 'AI Chat' },
  { date: '19 may', company: 'Condominios del Sol', contact: 'A. Baños CFO', industry: 'Inmobiliario', revenueValue: 2.7, revenue: 'USD 2.7M', score: 65, status: 'WaitList', source: 'Office Hours' },
  { date: '17 may', company: 'Fibra Inmuebles', contact: 'V. Luján CEO', industry: 'Inmobiliario', revenueValue: 6.9, revenue: 'USD 6.9M', score: 84, status: 'Aprobado', source: 'Referral' },
  { date: '15 may', company: 'Urbanizaciones MX', contact: 'R. Covarrubias CTO', industry: 'Inmobiliario', revenueValue: 4.8, revenue: 'USD 4.8M', score: 78, status: 'Nuevo', source: 'AI Chat' },
  { date: '13 may', company: 'Parques Industriales Bajío', contact: 'H. Herrera COO', industry: 'Inmobiliario', revenueValue: 8.0, revenue: 'USD 8.0M', score: 89, status: 'Aprobado', source: 'Founder Line' },
  { date: '11 may', company: 'Edificios Quantum', contact: 'J. Reyes CFO', industry: 'Inmobiliario', revenueValue: 3.5, revenue: 'USD 3.5M', score: 72, status: 'Nuevo', source: 'Office Hours' },

  // Logística
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
  Nuevo: 'border-[#1E3A5F] bg-[#123254] text-[#F5F5F5]',
  'Revisión': 'border-amber-500/30 bg-amber-500/15 text-amber-300',
  Aprobado: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300',
  WaitList: 'border-sky-500/30 bg-sky-500/15 text-sky-300',
  Rechazado: 'border-rose-500/30 bg-rose-500/15 text-rose-300',
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
    <header className="p-6 md:p-8 bg-[#0B1F3A] border-b border-[#1E3A5F]">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 border border-[#C9A96E]/30 bg-[#C9A96E]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#C9A96E] rounded-md">
              <Sparkles size={12} />
              FABRIC · Admin
            </div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-white tracking-tight">
              Dashboard operativo
            </h1>
            <p className="text-xs md:text-sm text-[#94A3B8] mt-1 font-sans">
              Pipeline, capacidad, revenue y admisión en una vista filtrable.
            </p>
          </div>

          <div className="flex flex-col items-start lg:items-end gap-1 bg-[#0E2747] border border-[#1E3A5F] px-4 py-2.5 rounded-xl shadow-md">
            <div className="text-[10px] font-mono font-bold uppercase tracking-[0.16em] text-[#94A3B8]">
              Sincronizado
            </div>
            <div className="text-xs capitalize font-medium text-white">{dateStr}</div>
          </div>
        </div>

        <div className="bg-[#0E2747] border border-[#1E3A5F] rounded-2xl shadow-lg overflow-hidden">
          <div className="grid gap-3 px-5 py-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="flex min-w-0 items-start gap-3 sm:items-center">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#C9A96E]/30 bg-[#C9A96E]/10 text-[#C9A96E]">
                <Filter size={16} />
              </span>
              <div className="min-w-0">
                <div className="text-[11px] font-mono font-bold uppercase tracking-[0.14em] text-white">
                  Filtros de operación
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
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
                  'group inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-4 text-[11px] font-mono font-bold uppercase tracking-[0.12em] transition cursor-pointer sm:min-w-[150px]',
                  filtersOpen
                    ? 'border-[#C9A96E] bg-[#C9A96E]/15 text-[#C9A96E]'
                    : 'border-[#1E3A5F] bg-[#123254] text-[#94A3B8] hover:border-[#C9A96E]/50 hover:bg-[#1A426E] hover:text-white',
                ].join(' ')}
              >
                {filtersOpen ? 'Ocultar filtros' : 'Filtrar'}
                <ChevronDown
                  size={14}
                  className={[
                    'transition-transform duration-300',
                    filtersOpen ? 'rotate-180 text-[#C9A96E]' : 'group-hover:text-white',
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
                  className="h-10 rounded-xl border border-[#1E3A5F] bg-[#123254] px-4 text-[11px] font-mono font-bold uppercase tracking-[0.12em] text-[#94A3B8] transition hover:border-[#C9A96E]/50 hover:bg-[#1A426E] hover:text-white cursor-pointer sm:min-w-[100px]"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>

          <div
            className={[
              'grid gap-4 border-t border-[#1E3A5F] bg-[#07192F]/60 transition-all duration-300 ease-out md:grid-cols-3',
              filtersOpen ? 'max-h-[600px] p-5 opacity-100' : 'max-h-0 p-0 opacity-0 overflow-hidden border-t-0',
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
    <div className="min-w-0 rounded-xl border border-[#1E3A5F] bg-[#0E2747] p-3.5 shadow-md">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="text-[10px] font-mono font-bold uppercase tracking-[0.12em] text-[#94A3B8]">
          {label}
        </div>
        <div className="max-w-[60%] truncate rounded-md border border-[#C9A96E]/30 bg-[#C9A96E]/10 px-2 py-0.5 font-mono text-[10px] font-bold text-[#C9A96E]">
          {value}
        </div>
      </div>
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))' }}
      >
        {items.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            className={[
              'relative min-h-[38px] min-w-0 overflow-hidden rounded-lg border px-2.5 py-1.5 text-center text-xs font-semibold leading-tight transition duration-200 cursor-pointer',
              value === item.value
                ? 'border-[#C9A96E] bg-[#C9A96E]/15 text-white font-bold'
                : 'border-[#1E3A5F] bg-[#123254] text-[#94A3B8] hover:border-[#1E3A5F] hover:bg-[#1A426E] hover:text-white',
            ].join(' ')}
          >
            <span className="block overflow-hidden text-ellipsis whitespace-nowrap">{item.label}</span>
            {value === item.value && <span className="absolute inset-x-2 bottom-0 h-0.5 bg-[#C9A96E]" />}
          </button>
        ))}
      </div>
    </div>
  );
}

function FilterPill({ label }: { label: string }) {
  return (
    <span className="rounded-md border border-[#1E3A5F] bg-[#123254] px-2.5 py-0.5 text-[10px] font-mono font-semibold text-[#94A3B8]">
      {label}
    </span>
  );
}

function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <article className={`rounded-2xl border border-[#1E3A5F] bg-[#0E2747] shadow-lg ${className}`}>
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
        <div className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-[#C9A96E]">{eyebrow}</div>
        <h2 className="mt-1 font-serif text-xl md:text-2xl font-bold text-white">{title}</h2>
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
      <div className="min-h-screen flex items-center justify-center bg-[#0B1F3A]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#C9A96E] border-t-transparent animate-spin rounded-full"></div>
          <span className="font-mono text-xs font-bold text-[#C9A96E] uppercase tracking-widest animate-pulse">Cargando métricas...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1F3A] text-white font-sans pb-12">
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

      <div className="px-6 md:px-8 space-y-6 mt-6">
        {isDemoMode && (
          <div className="flex items-center justify-between border border-[#C9A96E]/30 bg-[#C9A96E]/10 px-4 py-3 text-xs text-[#C9A96E] rounded-xl shadow-md">
            <div className="flex items-center gap-2.5">
              <Sparkles size={16} className="animate-pulse shrink-0" />
              <span><strong>Modo de Simulación Activo</strong>: Mostrando datos de demostración del pipeline corporativo porque la base de datos real está vacía.</span>
            </div>
            <button 
              onClick={() => setIsDemoMode(false)}
              className="underline font-bold uppercase tracking-wider text-[10px] font-mono hover:text-white bg-transparent border-none cursor-pointer shrink-0 ml-3"
            >
              Ver datos reales (vacío)
            </button>
          </div>
        )}

        {!isDemoMode && leads.length === 0 && (
          <div className="flex items-center justify-between border border-[#1E3A5F] bg-[#0E2747] px-4 py-3 text-xs text-[#94A3B8] rounded-xl shadow-md">
            <div className="flex items-center gap-2 text-[#94A3B8]">
              <span>Mostrando base de datos real (vacía). No hay leads registrados aún en la plataforma.</span>
            </div>
            <button 
              onClick={() => setIsDemoMode(true)}
              className="underline font-bold uppercase tracking-wider text-[10px] font-mono hover:text-white bg-transparent border-none cursor-pointer shrink-0 ml-3 text-[#C9A96E]"
            >
              Cargar demo de simulación
            </button>
          </div>
        )}

        {/* ── KPI Cards ── */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map(({ label, scope, value, delta, icon: Icon, progress, explanation }) => (
            <Panel key={label} className="p-5 transition-all duration-200 hover:border-[#C9A96E]/40 hover:shadow-xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5">
                    <div className="text-[10px] font-mono font-bold uppercase tracking-[0.16em] text-[#94A3B8]">{label}</div>
                    <div className="group relative cursor-help text-[#94A3B8] hover:text-[#C9A96E] transition-colors">
                      <Info size={13} className="opacity-70 hover:opacity-100" />
                      <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-60 -translate-x-1/2 rounded-xl border border-[#1E3A5F] bg-[#07192F] p-3 text-[11px] font-medium leading-relaxed text-[#94A3B8] opacity-0 shadow-2xl transition-opacity duration-200 group-hover:pointer-events-auto group-hover:opacity-100 whitespace-normal">
                        {explanation}
                        <div className="absolute top-full left-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1 rotate-45 border-b border-r border-[#1E3A5F] bg-[#07192F]" />
                      </div>
                    </div>
                  </div>
                  <div className="mt-1 text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-[#C9A96E]">{scope}</div>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#1E3A5F] bg-[#123254] text-[#94A3B8]">
                  <Icon size={16} />
                </div>
              </div>

              <div className="mt-4 flex items-end justify-between gap-3">
                <div className="font-serif text-3xl font-bold text-white sm:text-4xl">{value}</div>
                <div className="pb-1 text-right text-xs font-medium text-[#94A3B8]">{delta}</div>
              </div>

              <div className="mt-4 h-1.5 rounded-full bg-[#123254] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#C9A96E] to-[#A07845]"
                  style={{ width: `${Math.min(100, progress)}%` }}
                />
              </div>
            </Panel>
          ))}
        </section>

        {/* ── Main Charts ── */}
        <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <Panel className="p-6">
            <SectionTitle
              eyebrow="Pipeline"
              title="Actividad comercial"
              action={<div className="text-right text-xs font-mono font-bold uppercase tracking-[0.12em] text-[#94A3B8]">{period.toUpperCase()} · {industry} · {status}</div>}
            />
            <p className="mt-2 text-xs text-[#94A3B8] max-w-xl leading-relaxed">
              Volumen operativo de interacciones diarias registradas, incluyendo análisis automáticos ejecutados por el Agente de IA, llamadas de diagnóstico y correos de validación técnica en el periodo.
            </p>
            <div className="mt-6">
              <div className="flex h-52 items-stretch gap-2">
                <div className="flex flex-col justify-between text-[10px] font-mono text-[#94A3B8] pb-5 text-right pr-3 border-r border-[#1E3A5F] w-12 shrink-0">
                  <span>{maxPipeline} int</span>
                  <span>{Math.round(maxPipeline * 0.66)} int</span>
                  <span>{Math.round(maxPipeline * 0.33)} int</span>
                  <span>0</span>
                </div>
                <div className="flex-1 flex items-end gap-2 border-b border-[#1E3A5F] pb-5 sm:gap-3">
                  {pipeline.map((point, index) => (
                    <div key={`${point.label}-${index}`} className="flex h-full flex-1 flex-col justify-end gap-2 group relative">
                      <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 rounded-lg bg-[#07192F] border border-[#1E3A5F] px-2.5 py-1 text-[10px] font-mono text-[#C9A96E] opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap shadow-lg">
                        {point.val} interacciones
                      </div>
                      <div className="text-center text-[10px] text-[#94A3B8] font-mono">{point.val}</div>
                      <div className="flex w-full items-end justify-center">
                        <div
                          className="w-full max-w-10 rounded-t-lg bg-gradient-to-t from-[#A07845] via-[#C9A96E] to-[#e6cf9c] transition-all duration-200 hover:brightness-125"
                          style={{ height: `${(point.val / maxPipeline) * 100}%`, minHeight: 10 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-3 flex gap-2 pl-14">
                {pipeline.map((point, index) => (
                  <div key={`${point.label}-label-${index}`} className="flex-1 text-center text-xs font-mono font-bold uppercase tracking-[0.14em] text-[#94A3B8]">
                    {point.label}
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          <Panel className="p-6">
            <SectionTitle
              eyebrow="Capacidad Q3"
              title="Ocupación"
              action={<span className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-[0.13em] text-emerald-300">Estable</span>}
            />
            <p className="mt-2 text-xs text-[#94A3B8] leading-relaxed">
              Asignación de horas de consultoría de arquitectura Senior para el trimestre actual (Q3). Capacidad mensual total de 480 horas (equivalente a 3 consultores Senior). Límite de seguridad recomendado: 85%.
            </p>

            <div className="mt-6 grid grid-cols-[130px_1fr] items-center gap-6">
              <div
                className="grid h-32 w-32 place-items-center rounded-full p-2.5 shadow-lg"
                style={{
                  background: `conic-gradient(#C9A96E 0 ${capacity}%, #123254 ${capacity}% 100%)`,
                }}
              >
                <div className="grid h-24 w-24 place-items-center rounded-full bg-[#0E2747] shadow-inner">
                  <div className="font-serif text-3xl font-bold text-white">{capacity}%</div>
                </div>
              </div>

              <div className="space-y-3 text-xs text-[#94A3B8]">
                {[
                  ['Proyectos activos', '9'],
                  ['Proyectos reservados', period === '90d' ? '4' : '2'],
                  ['Límite operativo', '85%'],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between border-b border-[#1E3A5F] pb-2">
                    <span className="font-medium">{label}</span>
                    <span className="font-mono font-bold text-white">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </Panel>
        </section>

        {/* ── Secondary Grid ── */}
        <section className="grid gap-6 xl:grid-cols-3">
          <Panel className="p-6">
            <SectionTitle eyebrow="Revenue" title="Por industria" action={<TrendingUp size={18} className="text-[#94A3B8]" />} />
            <p className="mt-2 text-xs leading-relaxed text-[#94A3B8]">
              Distribución del pipeline estimado por sector industrial para Q3 2026. Valores en Millones de USD.
            </p>
            <div className="mt-6 space-y-4">
              {revenueByIndustry.map((item) => (
                <div key={item.label}>
                  <div className="mb-1.5 flex items-center justify-between text-xs text-[#94A3B8]">
                    <span className="font-semibold text-white">{item.label}</span>
                    <span className="font-mono font-bold text-white">USD {item.value}M</span>
                  </div>
                  <div className="h-3 rounded-full bg-[#123254] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#C9A96E] to-[#A07845]"
                      style={{ width: `${(item.value / maxRevenue) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="p-6">
            <SectionTitle eyebrow="Funnel" title="Leads por etapa" action={<Target size={18} className="text-[#94A3B8]" />} />
            <p className="mt-2 text-xs leading-relaxed text-[#94A3B8]">
              Distribución actual de leads en las distintas fases del pipeline de admisión.
            </p>
            <div className="mt-6 space-y-3.5">
              {statusFunnel.map((item) => (
                <div key={item.label}>
                  <div className="mb-1 flex items-center justify-between text-xs text-[#94A3B8]">
                    <span className="font-semibold text-white">{item.label}</span>
                    <span className="font-mono font-bold text-white">{item.value}</span>
                  </div>
                  <div className="h-7 rounded-lg border border-[#1E3A5F] bg-[#123254] overflow-hidden p-0.5">
                    <div className="h-full rounded-md bg-[#C9A96E]/30 border border-[#C9A96E]/50" style={{ width: item.width }} />
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="p-6">
            <SectionTitle eyebrow="Canales" title="Origen de demanda" action={<UsersRound size={18} className="text-[#94A3B8]" />} />
            <p className="mt-2 text-xs leading-relaxed text-[#94A3B8]">
              Origen del primer contacto de los prospectos calificados en el pipeline.
            </p>
            <div className="mt-6 grid grid-cols-4 items-end gap-3">
              {sourceData.map((item) => (
                <div key={item.source} className="flex h-40 flex-col items-center justify-end gap-2">
                  <div className="text-xs font-mono font-bold text-white">{item.value}</div>
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-[#123254] to-[#1E3A5F]"
                    style={{ height: `${Math.max(10, (item.value / maxSource) * 100)}%` }}
                  />
                  <div className="h-9 text-center text-[10px] font-mono font-semibold leading-tight text-[#94A3B8]">{item.source}</div>
                </div>
              ))}
            </div>
          </Panel>
        </section>

        {/* ── Third Grid ── */}
        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Panel className="p-6">
            <SectionTitle eyebrow="Score" title="Calidad del pipeline" action={<span className="font-serif text-3xl font-bold text-white">{avgScore || 0}</span>} />
            <div className="mt-6 grid grid-cols-3 gap-3.5">
              {['Fit', 'Revenue', 'Urgencia'].map((label, index) => {
                const value = Math.max(32, Math.min(96, avgScore - index * 9 + (period === '90d' ? 4 : 0)));
                return (
                  <div key={label} className="rounded-xl border border-[#1E3A5F] bg-[#123254] p-3.5 text-center">
                    <div className="mb-2 text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-[#94A3B8]">{label}</div>
                    <div className="h-24 border-b border-l border-[#1E3A5F] mb-2">
                      <div className="flex h-full items-end justify-center px-2">
                        <div className="w-full max-w-[28px] rounded-t-md bg-gradient-to-t from-[#C9A96E] to-[#e6cf9c]" style={{ height: `${value}%` }} />
                      </div>
                    </div>
                    <div className="font-mono text-xs font-bold text-white">{value}</div>
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel className="p-6">
            <SectionTitle
              eyebrow="Office Hours"
              title="Agenda semanal"
              action={
                <Link
                  to="/admin/office-hours"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#1E3A5F] bg-[#123254] px-3.5 py-2 text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-white transition hover:border-[#C9A96E] hover:text-[#C9A96E] hover:bg-[#1A426E]"
                >
                  Abrir
                  <ArrowUpRight size={14} />
                </Link>
              }
            />

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {[
                ['Confirmadas', '3'],
                ['Pendientes', '1'],
                ['Libres', '0'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-[#1E3A5F] bg-[#123254] p-4 text-center">
                  <div className="font-serif text-3xl font-bold text-white">{value}</div>
                  <div className="mt-1 text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-[#94A3B8]">{label}</div>
                </div>
              ))}
            </div>
          </Panel>
        </section>

        {/* ── Table Section ── */}
        <Panel className="overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-[#1E3A5F] p-6 sm:flex-row sm:items-center sm:justify-between bg-[#0E2747]">
            <div>
              <div className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-[#C9A96E]">Leads recientes</div>
              <h2 className="mt-1 font-serif text-2xl font-bold text-white">Evaluación comercial</h2>
            </div>
            <Link
              to="/admin/leads"
              className="inline-flex h-9 w-fit items-center gap-2 rounded-xl border border-[#1E3A5F] bg-[#123254] px-4 text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-white transition hover:border-[#C9A96E] hover:text-[#C9A96E]"
            >
              Ver todos
              <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[780px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-[#1E3A5F] bg-[#07192F]">
                  {['Fecha', 'Compañía', 'Contacto', 'Industria', 'Revenue', 'Score', 'Estado'].map((heading) => (
                    <th key={heading} className="px-6 py-3.5 text-[10px] font-mono font-bold uppercase tracking-[0.17em] text-[#94A3B8]">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E3A5F]/50">
                {filteredLeads.map((lead, index) => (
                  <tr key={`${lead.company}-${lead.date}-${index}`} className="transition hover:bg-[#123254]/50">
                    <td className="whitespace-nowrap px-6 py-4 font-mono text-[#94A3B8]">{lead.date}</td>
                    <td className="px-6 py-4 font-bold text-white">{lead.company}</td>
                    <td className="px-6 py-4 text-[#94A3B8]">{lead.contact}</td>
                    <td className="px-6 py-4 text-[#94A3B8]">{lead.industry}</td>
                    <td className="whitespace-nowrap px-6 py-4 font-mono font-semibold text-[#F5F5F5]">{lead.revenue}</td>
                    <td className="px-6 py-4 font-serif text-lg font-bold text-white">{lead.score}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-md border px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-[0.13em] ${STATUS_CLASS[lead.status]}`}>
                        {lead.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 p-4 md:hidden bg-[#07192F]">
            {filteredLeads.map((lead, index) => (
              <article key={`${lead.company}-mobile-${index}`} className="rounded-xl border border-[#1E3A5F] bg-[#0E2747] p-4 shadow-md space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold text-white">{lead.company}</div>
                    <div className="mt-0.5 text-xs text-[#94A3B8]">{lead.contact}</div>
                  </div>
                  <div className="font-serif text-2xl font-bold text-white">{lead.score}</div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs border-t border-[#1E3A5F] pt-3">
                  <InfoField label="Fecha" value={lead.date} />
                  <InfoField label="Revenue" value={lead.revenue} />
                  <InfoField label="Industria" value={lead.industry} />
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#94A3B8]">Estado</div>
                    <span className={`mt-1 inline-flex rounded-md border px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-[0.12em] ${STATUS_CLASS[lead.status]}`}>
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
      <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#94A3B8]">{label}</div>
      <div className="mt-0.5 font-medium text-white">{value}</div>
    </div>
  );
}

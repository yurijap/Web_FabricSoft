import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  ChevronDown,
  Filter,
  Gauge,
  Sparkles,
  Target,
  TrendingUp,
  UsersRound,
} from 'lucide-react';

type Period = '7d' | '30d' | '90d';
type IndustryFilter = 'Todas' | 'Inmobiliario' | 'Logística' | 'Financiero';
type StatusFilter = 'Todos' | 'Nuevo' | 'Aprobado' | 'WaitList';

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
};

const PERIODS: Array<{ label: string; value: Period }> = [
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
  { label: '90D', value: '90d' },
];

const INDUSTRIES: IndustryFilter[] = ['Todas', 'Inmobiliario', 'Logística', 'Financiero'];
const STATUSES: StatusFilter[] = ['Todos', 'Nuevo', 'Aprobado', 'WaitList'];

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
  { date: '20 may', company: 'Inmobiliaria Mítica', contact: 'M. Saldívar CFO', industry: 'Inmobiliario', revenueValue: 180, revenue: 'USD 180M', score: 87, status: 'Nuevo', source: 'Founder Line' },
  { date: '20 may', company: 'TransLog SA', contact: 'R. Méndez COO', industry: 'Logística', revenueValue: 240, revenue: 'USD 240M', score: 82, status: 'Aprobado', source: 'Office Hours' },
  { date: '19 may', company: 'FinCore Bank', contact: 'A. Torres CFO', industry: 'Financiero', revenueValue: 320, revenue: 'USD 320M', score: 91, status: 'WaitList', source: 'AI Chat' },
  { date: '18 may', company: 'Habita Norte', contact: 'L. Cano COO', industry: 'Inmobiliario', revenueValue: 145, revenue: 'USD 145M', score: 76, status: 'Aprobado', source: 'Referral' },
  { date: '18 may', company: 'Ruta Fría MX', contact: 'P. Ibarra CTO', industry: 'Logística', revenueValue: 110, revenue: 'USD 110M', score: 69, status: 'Nuevo', source: 'AI Chat' },
  { date: '17 may', company: 'Banco Atlas', contact: 'R. Molina CFO', industry: 'Financiero', revenueValue: 410, revenue: 'USD 410M', score: 94, status: 'Aprobado', source: 'Founder Line' },
];

const STATUS_CLASS: Record<Lead['status'], string> = {
  Nuevo: 'border-border-strong bg-bg-elevated text-text-primary',
  Aprobado: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300',
  WaitList: 'border-sky-400/25 bg-sky-400/10 text-sky-300',
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

export default function AdminDashboard() {
  const [period, setPeriod] = useState<Period>('7d');
  const [industry, setIndustry] = useState<IndustryFilter>('Todas');
  const [status, setStatus] = useState<StatusFilter>('Todos');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filteredLeads = useMemo(() => {
    return baseLeads.filter((lead) => {
      const industryOk = industry === 'Todas' || lead.industry === industry;
      const statusOk = status === 'Todos' || lead.status === status;
      return industryOk && statusOk;
    });
  }, [industry, status]);

  const config = periodConfig[period];
  const pipeline = config.pipeline.map((val, index) => ({ label: config.labels[index], val }));
  const maxPipeline = Math.max(...pipeline.map((p) => p.val));

  const totalRevenue = filteredLeads.reduce((sum, lead) => sum + lead.revenueValue, 0);
  const avgScore = Math.round(filteredLeads.reduce((sum, lead) => sum + lead.score, 0) / Math.max(filteredLeads.length, 1));
  const approved = filteredLeads.filter((lead) => lead.status === 'Aprobado').length;
  const capacity = config.capacity;

  const kpis = [
    { label: 'Leads filtrados', scope: period.toUpperCase(), value: String(filteredLeads.length), delta: `${approved} aprobados`, icon: UsersRound, progress: Math.min(92, filteredLeads.length * 14) },
    { label: 'Revenue potencial', scope: 'Pipeline', value: `USD ${totalRevenue}M`, delta: industry === 'Todas' ? 'Todas las industrias' : industry, icon: TrendingUp, progress: Math.min(92, totalRevenue / 7) },
    { label: 'Score promedio', scope: 'Calidad', value: String(avgScore || 0), delta: avgScore >= 85 ? 'Alta prioridad' : 'Revisar fit', icon: Target, progress: avgScore },
    { label: 'Capacidad', scope: 'Ocupada', value: `${capacity}%`, delta: 'Q3 operativo', icon: Gauge, progress: capacity },
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

      <div className="fabric-admin-content space-y-5">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map(({ label, scope, value, delta, icon: Icon, progress }) => (
            <Panel key={label} className="p-4 transition hover:border-border-strong hover:bg-bg-elevated">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-text-tertiary">{label}</div>
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

            <div className="mt-6 flex h-48 items-end gap-2 border-b border-border pb-4 sm:gap-3">
              {pipeline.map((point, index) => (
                <div key={`${point.label}-${index}`} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                  <div className="text-[10px] text-text-tertiary">{point.val}</div>
                  <div className="flex w-full items-end justify-center">
                    <div
                      className="w-full max-w-11 rounded-t-sm bg-gradient-to-t from-accent-2/70 via-accent/55 to-text-secondary/75 transition hover:brightness-125"
                      style={{ height: `${(point.val / maxPipeline) * 100}%`, minHeight: 8 }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-7 gap-2">
              {pipeline.map((point, index) => (
                <div key={`${point.label}-label-${index}`} className="text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-text-tertiary">
                  {point.label}
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="p-5">
            <SectionTitle
              eyebrow="Capacidad Q3"
              title="Ocupación"
              action={<span className="rounded-sm border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.13em] text-emerald-300">Estable</span>}
            />

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
                  ['Activos', '9'],
                  ['Reservados', period === '90d' ? '4' : '2'],
                  ['Libre', period === '7d' ? '1' : '0'],
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
                {filteredLeads.map((lead) => (
                  <tr key={`${lead.company}-${lead.date}`} className="border-b border-bg-elevated transition hover:bg-bg-elevated/55">
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
            {filteredLeads.map((lead) => (
              <article key={`${lead.company}-mobile`} className="rounded-sm border border-border bg-bg-base/55 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-text-primary">{lead.company}</div>
                    <div className="mt-1 text-xs text-text-tertiary">{lead.contact}</div>
                  </div>
                  <div className="font-serif text-2xl italic text-text-primary">{lead.score}</div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <Info label="Fecha" value={lead.date} />
                  <Info label="Revenue" value={lead.revenue} />
                  <Info label="Industria" value={lead.industry} />
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

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.14em] text-text-tertiary">{label}</div>
      <div className="mt-1 text-text-secondary">{value}</div>
    </div>
  );
}

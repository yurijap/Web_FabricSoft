import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { toast } from 'sonner';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Download,
  LockKeyhole,
  Mail,
  Phone,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Trash2,
  UserRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { api } from '../../config/api';

type DiagnosticStatus = 'nuevo' | 'en_revision' | 'contactado' | 'aprobado' | 'descartado';
type EmailStatus = 'not_sent' | 'sent' | 'preview' | 'failed';

type Diagnostic = {
  _id: string;
  contact: {
    name: string;
    role: string;
    email: string;
    company: string;
    phone?: string;
  };
  answers: Array<{
    questionId: number;
    question: string;
    answer: string;
    score: number;
  }>;
  result: {
    totalScore: number;
    level: 'CRITICO' | 'ALTO' | 'MEDIO' | 'BAJO';
    description: string;
    action: string;
    investment: string;
    roi: string;
    pattern: string;
  };
  status: DiagnosticStatus;
  emailStatus?: EmailStatus;
  emailSentAt?: string | null;
  emailError?: string;
  ip: string;
  userAgent: string;
  createdAt: string;
};

const STATUS_ORDER: DiagnosticStatus[] = ['nuevo', 'en_revision', 'contactado', 'aprobado', 'descartado'];

const STATUS_LABEL: Record<DiagnosticStatus, string> = {
  nuevo: 'Nuevo',
  en_revision: 'En revision',
  contactado: 'Contactado',
  aprobado: 'Aprobado',
  descartado: 'Descartado',
};

const STATUS_HINT: Record<DiagnosticStatus, string> = {
  nuevo: 'Datos recibidos',
  en_revision: 'En evaluacion',
  contactado: 'Correo o llamada enviada',
  aprobado: 'Puede avanzar',
  descartado: 'Fuera del proceso',
};

const STATUS_CLASS: Record<DiagnosticStatus, string> = {
  nuevo: 'border-sky-400/30 bg-sky-400/10 text-sky-300',
  en_revision: 'border-amber-300/35 bg-amber-300/10 text-amber-200',
  contactado: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  aprobado: 'border-lime-400/30 bg-lime-400/10 text-lime-300',
  descartado: 'border-red-400/30 bg-red-400/10 text-red-300',
};

const EMAIL_LABEL: Record<EmailStatus, string> = {
  not_sent: 'No enviado',
  sent: 'Enviado',
  preview: 'Preparado',
  failed: 'Error',
};

const EMAIL_CLASS: Record<EmailStatus, string> = {
  not_sent: 'border-zinc-700 bg-zinc-950 text-zinc-400',
  sent: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  preview: 'border-amber-300/35 bg-amber-300/10 text-amber-200',
  failed: 'border-red-400/30 bg-red-400/10 text-red-300',
};

const LEVEL_CLASS: Record<Diagnostic['result']['level'], string> = {
  CRITICO: 'text-red-300',
  ALTO: 'text-rose-200',
  MEDIO: 'text-amber-200',
  BAJO: 'text-zinc-400',
};

const LEVEL_BADGE_CLASS: Record<Diagnostic['result']['level'], string> = {
  CRITICO: 'border-red-400/30 bg-red-400/10 text-red-300',
  ALTO: 'border-rose-400/30 bg-rose-400/10 text-rose-200',
  MEDIO: 'border-amber-300/35 bg-amber-300/10 text-amber-200',
  BAJO: 'border-zinc-700 bg-zinc-950 text-zinc-400',
};

const PROSPECTS_PER_PAGE = 8;

const authHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

function defaultEmailSubject(item: Diagnostic) {
  return `Diagnostico Oracle FABRIC - ${item.contact.company}`;
}

function defaultEmailMessage(item: Diagnostic) {
  return [
    `Hola ${item.contact.name},`,
    '',
    'Gracias por completar el diagnostico.',
    '',
    'Te compartimos el documento con tus respuestas y el resultado obtenido.',
    '',
    `Adjunto: ${diagnosticFileName(item)}`,
    '',
    'FABRIC',
  ].join('\n');
}

function buildMailtoUrl(to: string, subject: string, body: string) {
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function diagnosticFileName(item: Diagnostic) {
  const company = String(item.contact.company || 'prospecto')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();

  return `diagnostico-oracle-${company || 'prospecto'}.doc`;
}

function buildDiagnosticDocument(item: Diagnostic) {
  const escapeHtml = (value: string | number) => String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const rows = item.answers.map((answer) => `
    <tr>
      <td style="border:1px solid #d9d9d9;padding:8px;">${escapeHtml(answer.question)}</td>
      <td style="border:1px solid #d9d9d9;padding:8px;"><strong>${escapeHtml(answer.answer)}</strong></td>
      <td style="border:1px solid #d9d9d9;padding:8px;text-align:center;">+${escapeHtml(answer.score)}</td>
    </tr>
  `).join('');

  return `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <title>Diagnostico Oracle FABRIC</title>
        <style>
          body { font-family: Arial, sans-serif; color: #111111; line-height: 1.45; }
          h1 { font-size: 28px; margin-bottom: 4px; }
          h2 { font-size: 18px; margin-top: 24px; border-bottom: 1px solid #cccccc; padding-bottom: 6px; }
          .muted { color: #666666; font-size: 12px; }
          .summary { border: 1px solid #d9d9d9; padding: 14px; margin: 18px 0; background: #f7f7f7; }
          table { border-collapse: collapse; width: 100%; margin-top: 10px; }
          th { border: 1px solid #d9d9d9; padding: 8px; background: #eeeeee; text-align: left; }
        </style>
      </head>
      <body>
        <h1>Diagnostico Oracle FABRIC</h1>
        <p class="muted">Documento generado desde el panel administrativo FABRIC.</p>

        <h2>Prospecto</h2>
        <p><strong>Empresa:</strong> ${escapeHtml(item.contact.company)}</p>
        <p><strong>Contacto:</strong> ${escapeHtml(item.contact.name)}</p>
        <p><strong>Cargo:</strong> ${escapeHtml(item.contact.role)}</p>
        <p><strong>Email:</strong> ${escapeHtml(item.contact.email)}</p>
        <p><strong>Telefono:</strong> ${escapeHtml(item.contact.phone || 'No capturado')}</p>

        <h2>Resultado</h2>
        <div class="summary">
          <p><strong>Nivel:</strong> ${escapeHtml(item.result.level)}</p>
          <p><strong>Score:</strong> ${escapeHtml(item.result.totalScore)}</p>
          <p><strong>Detalle:</strong> ${escapeHtml(item.result.description)}</p>
        </div>

        <h2>Preguntas y respuestas</h2>
        <table>
          <thead>
            <tr>
              <th>Pregunta</th>
              <th>Respuesta</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </body>
    </html>
  `;
}

function downloadDiagnosticDocument(item: Diagnostic) {
  const blob = new Blob([buildDiagnosticDocument(item)], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = diagnosticFileName(item);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function canMoveStatus(current: DiagnosticStatus, next: DiagnosticStatus) {
  return STATUS_ORDER.indexOf(next) >= STATUS_ORDER.indexOf(current);
}

function canSendDiagnostic(item: Diagnostic) {
  return ['en_revision', 'contactado', 'aprobado'].includes(item.status);
}

function formatRelative(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.floor(diff / 60000));

  if (minutes < 1) return 'ahora';
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;

  return `${Math.floor(hours / 24)}d`;
}

export default function AdminDiagnosticosOracle() {
  const { getToken } = useAuth();
  const [items, setItems] = useState<Diagnostic[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<DiagnosticStatus | 'todos'>('todos');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadDiagnostics = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;

      const { data } = await api.get('/diagnostico-oracle', {
        headers: authHeaders(token),
      });

      const nextItems = data.diagnosticos || [];
      setItems(nextItems);
      setSelectedId((current) => current || nextItems[0]?._id || null);
    } catch (error: any) {
      toast.error('No se pudieron cargar los prospectos', {
        description: error.response?.data?.error || 'Revisa el backend e intenta otra vez.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDiagnostics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return items.filter((item) => {
      if (statusFilter !== 'todos' && item.status !== statusFilter) return false;
      if (!query) return true;

      return [
        item.contact.name,
        item.contact.role,
        item.contact.email,
        item.contact.company,
        item.result.level,
      ].some((value) => String(value || '').toLowerCase().includes(query));
    });
  }, [items, search, statusFilter]);

  const selected =
    filtered.find((item) => item._id === selectedId) ||
    items.find((item) => item._id === selectedId) ||
    filtered[0] ||
    items[0];

  const totalPages = Math.max(1, Math.ceil(filtered.length / PROSPECTS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pageStartIndex = (currentPage - 1) * PROSPECTS_PER_PAGE;
  const paginated = filtered.slice(pageStartIndex, pageStartIndex + PROSPECTS_PER_PAGE);
  const showingFrom = filtered.length ? pageStartIndex + 1 : 0;
  const showingTo = Math.min(pageStartIndex + PROSPECTS_PER_PAGE, filtered.length);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const updateStatus = async (id: string, status: DiagnosticStatus) => {
    const current = items.find((item) => item._id === id);

    if (current && !canMoveStatus(current.status, status)) {
      toast.error('Flujo bloqueado', {
        description: 'No puedes regresar un prospecto a un estado anterior.',
      });
      return;
    }

    try {
      const token = await getToken();
      if (!token) return;

      const { data } = await api.patch(
        `/diagnostico-oracle/${id}/status`,
        { status },
        { headers: authHeaders(token) },
      );

      setItems((currentItems) => currentItems.map((item) => (item._id === id ? data.diagnostico : item)));
      toast.success('Estado actualizado');
    } catch (error: any) {
      toast.error('No se pudo actualizar el prospecto', {
        description: error.response?.data?.error || 'Intenta otra vez.',
      });
    }
  };

  const sendDiagnostic = async (item: Diagnostic) => {
    if (!canSendDiagnostic(item)) {
      toast.error('Primero revisa el prospecto', {
        description: 'Marca el prospecto como En revision o superior antes de enviar el correo.',
      });
      return;
    }

    window.location.href = buildMailtoUrl(item.contact.email, defaultEmailSubject(item), defaultEmailMessage(item));
  };

  const deleteDiagnostic = async (item: Diagnostic) => {
    const confirmed = window.confirm(`Eliminar prospecto de ${item.contact.company}? Esta accion no se puede deshacer.`);
    if (!confirmed) return;

    try {
      const token = await getToken();
      if (!token) return;

      setDeletingId(item._id);

      await api.delete(`/diagnostico-oracle/${item._id}`, {
        headers: authHeaders(token),
      });

      setItems((current) => {
        const next = current.filter((entry) => entry._id !== item._id);
        setSelectedId(next[0]?._id || null);
        return next;
      });

      toast.success('Prospecto eliminado');
    } catch (error: any) {
      toast.error('No se pudo eliminar el prospecto', {
        description: error.response?.data?.error || 'Intenta otra vez.',
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0B0E] px-3 py-4 text-zinc-100 sm:px-5 lg:px-8">
      <style>{`
        @keyframes panelIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .diagnostic-scroll {
          scrollbar-width: thin;
          scrollbar-color: #3f3f46 #111214;
        }
        .diagnostic-scroll::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        .diagnostic-scroll::-webkit-scrollbar-track {
          background: #111214;
          border-left: 1px solid #27272a;
        }
        .diagnostic-scroll::-webkit-scrollbar-thumb {
          background: #3f3f46;
          border: 2px solid #111214;
        }
        .diagnostic-scroll::-webkit-scrollbar-thumb:hover {
          background: #71717a;
        }
      `}</style>

      <header className="border border-zinc-800 bg-[#0F1012] animate-[panelIn_220ms_ease-out]">
        <div className="grid gap-4 border-b border-zinc-800 p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="min-w-0">
            <div className="mb-3 inline-flex items-center gap-2 border border-amber-400/25 bg-amber-400/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300">
              <ClipboardList size={13} />
              Prospectos
            </div>
            <h1 className="font-serif text-3xl leading-tight text-zinc-50 sm:text-4xl">
              Diagnosticos recibidos
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
              Prospectos que enviaron sus datos. Revisa respuestas, cambia el proceso, descarga el Word o abre el correo.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat label="Prospectos" value={String(items.length)} />
            <Stat label="Filtrados" value={String(filtered.length)} />
            <Stat label="Enviados" value={String(items.filter((item) => item.emailStatus === 'sent').length)} />
          </div>
        </div>

        <div className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_220px_auto] md:items-center">
          <div className="relative min-w-0">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-10 w-full border border-zinc-800 bg-[#17181B] pl-9 pr-3 text-sm text-zinc-200 outline-none transition placeholder:text-zinc-600 focus:border-amber-400/50"
              placeholder="Buscar prospecto, empresa, correo..."
            />
          </div>

          <Select value={statusFilter} onChange={(value) => setStatusFilter(value as DiagnosticStatus | 'todos')}>
            <option value="todos">Todos los estados</option>
            {Object.entries(STATUS_LABEL).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>

          <button
            type="button"
            onClick={loadDiagnostics}
            disabled={loading}
            className="inline-flex h-10 items-center justify-center gap-2 border border-zinc-800 bg-[#17181B] px-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-100 disabled:cursor-wait disabled:opacity-60"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>
      </header>

      <section className="mt-5 grid gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
        <aside className="overflow-hidden border border-zinc-800 bg-[#0F1012] animate-[panelIn_280ms_ease-out]">
          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
              Prospectos
            </span>
            <span className="font-mono text-[10px] text-zinc-500">
              {showingFrom}-{showingTo}/{filtered.length}
            </span>
          </div>

          <div className="diagnostic-scroll max-h-[510px] overflow-y-auto p-2 xl:h-[calc(100vh-370px)] xl:max-h-none">
            {loading && (
              <div className="border border-zinc-800 bg-[#17181B] p-4 text-sm text-zinc-500 animate-pulse">
                Cargando prospectos...
              </div>
            )}

            {!loading && filtered.length === 0 && (
              <EmptyState
                icon={AlertTriangle}
                title="Sin prospectos"
                text="No hay prospectos con esos filtros."
              />
            )}

            <div className="space-y-2">
              {paginated.map((item, index) => (
                <ProspectCard
                  key={item._id}
                  item={item}
                  active={selected?._id === item._id}
                  index={index}
                  onClick={() => setSelectedId(item._id)}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-zinc-800 p-3 px-4">
            <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-500">
              Pág <span className="text-amber-300 font-bold">{currentPage}</span> / <span className="text-amber-300 font-bold">{totalPages}</span>
            </div>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={currentPage <= 1}
                className="group flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400 transition-colors hover:text-amber-300 disabled:opacity-20 disabled:hover:text-zinc-400 disabled:cursor-not-allowed"
              >
                <span className="transition-transform duration-300 group-hover:-translate-x-0.5">←</span>
                <span>Anterior</span>
              </button>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={currentPage >= totalPages}
                className="group flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400 transition-colors hover:text-amber-300 disabled:opacity-20 disabled:hover:text-zinc-400 disabled:cursor-not-allowed"
              >
                <span>Siguiente</span>
                <span className="transition-transform duration-300 group-hover:translate-x-0.5">→</span>
              </button>
            </div>
          </div>
        </aside>

        <main className="min-h-[640px] overflow-hidden border border-zinc-800 bg-[#0F1012] animate-[panelIn_340ms_ease-out]">
          {selected ? (
            <ProspectDetail
              item={selected}
              deleting={deletingId === selected._id}
              onDelete={() => deleteDiagnostic(selected)}
              onSend={() => sendDiagnostic(selected)}
              onStatusChange={(status) => updateStatus(selected._id, status)}
            />
          ) : (
            <div className="grid min-h-[640px] place-items-center p-8 text-center">
              <EmptyState icon={ClipboardList} title="Selecciona un prospecto" text="Sus datos y respuestas apareceran aqui." />
            </div>
          )}
        </main>
      </section>

    </div>
  );
}

function ProspectCard({
  item,
  active,
  index,
  onClick,
}: {
  item: Diagnostic;
  active: boolean;
  index: number;
  onClick: () => void;
}) {
  const emailStatus = item.emailStatus || 'not_sent';

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'grid w-full grid-cols-[minmax(0,1fr)_auto] gap-3 border px-3 py-3 text-left transition active:scale-[0.99]',
        active
          ? 'border-amber-400/40 bg-amber-400/10 shadow-[inset_3px_0_0_rgba(251,191,36,0.75)]'
          : 'border-zinc-800 bg-[#17181B] hover:border-zinc-700 hover:bg-zinc-900/70',
      ].join(' ')}
      style={{ animation: `panelIn 200ms ease-out ${Math.min(index * 18, 160)}ms both` }}
    >
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-zinc-100">{item.contact.company}</div>
        <div className="mt-1 truncate text-xs text-zinc-500">{item.contact.name}</div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Badge label={STATUS_LABEL[item.status]} className={STATUS_CLASS[item.status]} />
          <Badge label={item.result.level} className={LEVEL_BADGE_CLASS[item.result.level]} />
          {emailStatus !== 'not_sent' && <Badge label={EMAIL_LABEL[emailStatus]} className={EMAIL_CLASS[emailStatus]} />}
        </div>
      </div>

      <div className="text-right">
        <div className={`font-serif text-3xl leading-none ${LEVEL_CLASS[item.result.level]}`}>
          {item.result.totalScore}
        </div>
        <div className="mt-2 text-[10px] text-zinc-600">{formatRelative(item.createdAt)}</div>
      </div>
    </button>
  );
}

function ProspectDetail({
  item,
  deleting,
  onDelete,
  onSend,
  onStatusChange,
}: {
  item: Diagnostic;
  deleting: boolean;
  onDelete: () => void;
  onSend: () => void;
  onStatusChange: (status: DiagnosticStatus) => void;
}) {
  const emailStatus = item.emailStatus || 'not_sent';

  return (
    <div className="grid min-h-full xl:grid-cols-[minmax(0,1fr)_340px]">
      <section className="min-w-0 border-b border-zinc-800 p-5 xl:border-b-0 xl:border-r 2xl:p-6">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap gap-2">
              <Badge label={STATUS_LABEL[item.status]} className={STATUS_CLASS[item.status]} />
              <Badge label={EMAIL_LABEL[emailStatus]} className={EMAIL_CLASS[emailStatus]} />
              <Badge label={item.result.level} className={LEVEL_BADGE_CLASS[item.result.level]} />
            </div>
            <h2 className="break-words font-serif text-2xl leading-tight text-zinc-50 sm:text-3xl">
              {item.contact.company}
            </h2>
            <p className="mt-2 break-all text-sm text-zinc-400">{item.contact.name} / {item.contact.role}</p>
          </div>

          <div className="flex items-center justify-between gap-3 lg:justify-end">
            <div className="text-left lg:text-right">
              <div className={`font-serif text-5xl leading-none ${LEVEL_CLASS[item.result.level]}`}>
                {item.result.totalScore}
              </div>
              <div className="mt-1 text-[10px] uppercase tracking-[0.16em] text-zinc-500">Score</div>
            </div>
            <div className="flex gap-2">
              <IconButton
                icon={Download}
                label="Descargar Word"
                onClick={() => {
                  downloadDiagnosticDocument(item);
                  toast.success('Documento descargado');
                }}
              />
              <IconButton
                icon={Send}
                label="Abrir correo"
                onClick={onSend}
                disabled={!canSendDiagnostic(item)}
                tone="primary"
              />
              <IconButton
                icon={deleting ? RefreshCw : Trash2}
                label="Eliminar prospecto"
                onClick={onDelete}
                disabled={deleting}
                tone="danger"
                spinning={deleting}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Info icon={UserRound} label="Contacto" value={item.contact.name} />
          <Info icon={ShieldCheck} label="Cargo" value={item.contact.role} />
          <Info icon={Building2} label="Empresa" value={item.contact.company} />
          <Info icon={Mail} label="Correo" value={item.contact.email} />
          <Info icon={Phone} label="Telefono" value={item.contact.phone || 'No capturado'} />
          <Info icon={Clock3} label="Recibido" value={new Date(item.createdAt).toLocaleString('es-MX')} />
        </div>

        <Panel title="Detalle del resultado" className="mt-5">
          <p className="text-sm leading-6 text-zinc-300">{item.result.description}</p>
        </Panel>

        <Panel title="Preguntas que contesto" className="mt-5">
          <div className="diagnostic-scroll max-h-[520px] overflow-y-auto pr-1">
            <div className="divide-y divide-zinc-800">
              {item.answers.map((answer) => (
                <div key={answer.questionId} className="grid gap-3 py-3 md:grid-cols-[minmax(0,1fr)_240px_58px] md:items-center">
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-[0.14em] text-zinc-600">Pregunta {answer.questionId}</div>
                    <div className="mt-1 text-sm leading-5 text-zinc-300">{answer.question}</div>
                  </div>
                  <div className="break-words text-sm font-medium text-zinc-100">{answer.answer}</div>
                  <div className="font-mono text-xs text-amber-200 md:text-right">+{answer.score}</div>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </section>

      <aside className="p-5 2xl:p-6">
        <StatusPanel item={item} onStatusChange={onStatusChange} />
      </aside>
    </div>
  );
}

function StatusPanel({ item, onStatusChange }: { item: Diagnostic; onStatusChange: (status: DiagnosticStatus) => void }) {
  return (
    <Panel title="Proceso del prospecto">
      <div className="space-y-2">
        {STATUS_ORDER.map((value, index) => {
          const active = item.status === value;
          const locked = !canMoveStatus(item.status, value);
          const disabled = active || locked;

          return (
            <button
              key={value}
              type="button"
              onClick={() => onStatusChange(value)}
              disabled={disabled}
              title={locked ? 'No se puede volver a un estado anterior' : STATUS_HINT[value]}
              className={[
                'grid w-full grid-cols-[30px_minmax(0,1fr)_auto] items-center gap-3 border px-3 py-2 text-left transition',
                active
                  ? STATUS_CLASS[value]
                  : locked
                    ? 'cursor-not-allowed border-zinc-800 bg-[#111214] text-zinc-700'
                    : 'border-zinc-800 bg-[#111214] text-zinc-400 hover:border-zinc-700 hover:text-zinc-100',
              ].join(' ')}
            >
              <span className="grid h-7 w-7 place-items-center border border-current text-[10px] font-semibold">{index + 1}</span>
              <span className="min-w-0">
                <span className="block truncate text-[11px] font-semibold uppercase tracking-[0.1em]">{STATUS_LABEL[value]}</span>
                <span className="mt-0.5 block truncate text-[10px] normal-case tracking-normal opacity-65">{STATUS_HINT[value]}</span>
              </span>
              {active && <CheckCircle2 size={14} />}
              {locked && <LockKeyhole size={13} />}
            </button>
          );
        })}
      </div>
    </Panel>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-zinc-800 bg-[#17181B] px-4 py-3">
      <div className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">{label}</div>
      <div className="mt-1 font-serif text-2xl text-zinc-50">{value}</div>
    </div>
  );
}

function Info({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="min-w-0 overflow-hidden border border-zinc-800 bg-[#17181B] p-4">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-zinc-500">
        <Icon size={14} className="shrink-0 text-amber-300" />
        {label}
      </div>
      <div className="mt-2 break-all text-sm font-medium text-zinc-100">{value || 'No detectado'}</div>
    </div>
  );
}

function IconButton({
  icon: Icon,
  label,
  onClick,
  disabled = false,
  tone = 'default',
  spinning = false,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: 'default' | 'primary' | 'danger';
  spinning?: boolean;
}) {
  const toneClass = {
    default: 'border-zinc-800 bg-[#17181B] text-zinc-300 hover:border-amber-400/35 hover:text-amber-200',
    primary: 'border-amber-400/30 bg-amber-400/10 text-amber-200 hover:border-amber-300 hover:bg-amber-400/15',
    danger: 'border-red-400/25 bg-red-400/10 text-red-300 hover:border-red-300 hover:bg-red-400/15',
  }[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-10 w-10 items-center justify-center border transition disabled:cursor-not-allowed disabled:opacity-50 ${toneClass}`}
      aria-label={label}
      title={label}
    >
      <Icon size={16} className={spinning ? 'animate-spin' : ''} />
    </button>
  );
}

function Panel({ title, children, className = '' }: { title: string; children: ReactNode; className?: string }) {
  return (
    <article className={`border border-zinc-800 bg-[#17181B] p-4 ${className}`}>
      <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">{title}</div>
      {children}
    </article>
  );
}

function Badge({ label, className = 'border-zinc-700 bg-zinc-950 text-zinc-400' }: { label: string; className?: string }) {
  return (
    <span className={`inline-flex max-w-full shrink-0 border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] ${className}`}>
      <span className="truncate">{label}</span>
    </span>
  );
}

function Select({ value, onChange, children }: { value: string; onChange: (value: string) => void; children: ReactNode }) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-10 border border-zinc-800 bg-[#17181B] px-3 text-[11px] uppercase tracking-[0.12em] text-zinc-300 outline-none transition focus:border-amber-400/50"
    >
      {children}
    </select>
  );
}

function EmptyState({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return (
    <div className="border border-zinc-800 bg-[#17181B] p-6 text-center">
      <Icon className="mx-auto text-zinc-600" size={34} />
      <div className="mt-3 text-sm font-semibold text-zinc-300">{title}</div>
      <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-zinc-500">{text}</p>
    </div>
  );
}

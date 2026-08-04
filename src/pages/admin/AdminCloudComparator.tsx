import { useEffect, useState, type ReactNode } from "react";
import { useAuthApi } from "../../config/api";

type CloudComparatorStatus = "Nuevo" | "Revision" | "Aprobado" | "WaitList" | "Rechazado";

interface HistorialEntry {
  fecha: string;
  estado: string;
  autor: string;
}

interface Breakdown {
  compute: number;
  storage: number;
  database: number;
  networking: number;
  other: number;
}

interface CloudComparatorLead {
  _id: string;
  createdAt: string;
  nombre: string;
  cargo: string;
  empresa: string;
  email: string;
  telefono?: string;
  provider: string;
  monthlySpend: number;
  analysisPeriod: string;
  criticalApplication: string;
  objective: string;
  workload: string;
  breakdown?: Breakdown;
  notas?: string;
  score: number;
  status: CloudComparatorStatus;
  historial: HistorialEntry[];
}

const STATUSES: CloudComparatorStatus[] = ["Nuevo", "Revision", "Aprobado", "WaitList", "Rechazado"];

function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.15em] text-[#F5F5F5]/50">{children}</span>;
}

const fmtCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value || 0);

const inputClass =
  "w-full border border-[#2A2A2A] bg-[#111] px-4 py-3 text-sm text-[#F5F5F5] outline-none transition-all duration-300 placeholder:text-[#F5F5F5]/25 focus:border-[#C9A96E] focus:bg-black rounded-sm";

function StatusBadge({ status }: { status: CloudComparatorStatus }) {
  const styles: Record<CloudComparatorStatus, string> = {
    Nuevo: "bg-blue-500/10 text-blue-300 border-blue-500/30",
    Revision: "bg-violet-500/10 text-violet-300 border-violet-500/30",
    WaitList: "bg-[#F5F5F5]/5 text-[#F5F5F5]/60 border-[#2A2A2A]",
    Aprobado: "bg-[#C9A96E]/10 text-[#C9A96E] border-[#C9A96E]/30",
    Rechazado: "bg-red-500/10 text-red-300 border-red-500/30",
  };

  return (
    <span className={`inline-flex items-center rounded-sm border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${styles[status]}`}>
      {status}
    </span>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 70 ? "text-[#C9A96E]" : score >= 40 ? "text-[#F5F5F5]" : "text-[#F5F5F5]/60";

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-12 overflow-hidden bg-[#1A1A1A] rounded-full">
        <div className={score >= 70 ? "h-full bg-[#C9A96E]" : "h-full bg-[#F5F5F5]/40"} style={{ width: `${Math.min(score, 100)}%` }} />
      </div>
      <span className={`font-mono text-[11px] font-bold ${color}`}>{score}</span>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="break-words font-sans text-sm leading-relaxed text-[#F5F5F5]/85">{value || "N/A"}</div>
    </div>
  );
}

function CloudComparatorDrawer({
  item,
  isOpen,
  onClose,
  onUpdate,
}: {
  item: CloudComparatorLead | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedLead: CloudComparatorLead) => void;
}) {
  const adminApi = useAuthApi();
  const [newStatus, setNewStatus] = useState<CloudComparatorStatus>(item?.status || "Nuevo");
  const [notas, setNotas] = useState(item?.notas || "");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!item) return;
    setNewStatus(item.status);
    setNotas(item.notas || "");
  }, [item]);

  if (!isOpen || !item) return null;

  const handleSaveStatus = async () => {
    if (newStatus === item.status) return;

    try {
      setIsSaving(true);
      const res = await adminApi.patch(`/cloud-comparator/admin/${item._id}/status`, { status: newStatus });
      onUpdate(res.data.data);
    } catch {
      alert("Error al actualizar estado");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotas = async () => {
    try {
      setIsSaving(true);
      const res = await adminApi.patch(`/cloud-comparator/admin/${item._id}/notas`, { notas });
      onUpdate(res.data.data);
    } catch {
      alert("Error al guardar notas");
    } finally {
      setIsSaving(false);
    }
  };

  const breakdown = item.breakdown;
  const hasBreakdown = Boolean(
    breakdown && [breakdown.compute, breakdown.storage, breakdown.database, breakdown.networking, breakdown.other].some((value) => value > 0)
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      <div className="flex h-full w-full max-w-[620px] flex-col border-l border-[#2A2A2A] bg-[#0A0A0A] shadow-2xl animate-[cloudDrawerIn_260ms_ease-out]">
        <style>{`
          @keyframes cloudDrawerIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        `}</style>

        <div className="flex items-center justify-between border-b border-[#2A2A2A] bg-[#050505] p-6">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#C9A96E]">Cloud Comparator</span>
              <StatusBadge status={item.status} />
            </div>
            <h2 className="truncate font-serif text-2xl text-[#F5F5F5]">{item.empresa}</h2>
            <p className="font-sans text-sm text-[#F5F5F5]/60">{item.nombre} / {item.cargo}</p>
          </div>
          <button onClick={onClose} className="text-[#F5F5F5]/40 transition-colors hover:text-[#C9A96E]" aria-label="Cerrar">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 space-y-8 overflow-y-auto p-6">
          <div className="border border-[#C9A96E]/20 bg-[#C9A96E]/[0.02] p-5 rounded-sm">
            <h3 className="mb-4 font-mono text-[11px] uppercase tracking-[0.15em] text-[#C9A96E]">Datos de oportunidad</h3>
            <div className="grid grid-cols-2 gap-4">
              <DetailRow label="Cloud actual" value={item.provider} />
              <DetailRow label="Gasto mensual" value={fmtCurrency(item.monthlySpend)} />
              <DetailRow label="Periodo" value={item.analysisPeriod} />
              <DetailRow label="Score" value={item.score} />
              <div className="col-span-2">
                <DetailRow label="Aplicacion critica" value={item.criticalApplication} />
              </div>
              <div className="col-span-2">
                <DetailRow label="Objetivo" value={item.objective} />
              </div>
              <div className="col-span-2">
                <DetailRow label="Workload" value={item.workload} />
              </div>
            </div>
          </div>

          {hasBreakdown && breakdown && (
            <div className="border border-[#2A2A2A] bg-[#111] p-5 rounded-sm">
              <h3 className="mb-4 font-mono text-[11px] uppercase tracking-[0.15em] text-[#F5F5F5]/60">Desglose mensual</h3>
              <div className="grid grid-cols-2 gap-4">
                <DetailRow label="Compute" value={fmtCurrency(breakdown.compute)} />
                <DetailRow label="Storage" value={fmtCurrency(breakdown.storage)} />
                <DetailRow label="Database" value={fmtCurrency(breakdown.database)} />
                <DetailRow label="Networking" value={fmtCurrency(breakdown.networking)} />
                <DetailRow label="Otros" value={fmtCurrency(breakdown.other)} />
              </div>
            </div>
          )}

          <div>
            <h3 className="mb-3 font-mono text-[11px] uppercase tracking-[0.15em] text-[#F5F5F5]/60">Contacto</h3>
            <div className="flex flex-wrap gap-4">
              <a href={`mailto:${item.email}`} className="font-mono text-sm text-[#C9A96E] hover:underline">{item.email}</a>
              {item.telefono && <span className="font-mono text-sm text-[#F5F5F5]/80">{item.telefono}</span>}
            </div>
          </div>

          <div className="space-y-6 border-t border-[#2A2A2A] pt-6">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <FieldLabel>Estado comercial</FieldLabel>
                <select
                  value={newStatus}
                  onChange={(event) => setNewStatus(event.target.value as CloudComparatorStatus)}
                  className={`${inputClass} cursor-pointer appearance-none`}
                >
                  {STATUSES.map((status) => (
                    <option key={status} value={status} className="bg-[#0A0A0A]">{status}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleSaveStatus}
                disabled={isSaving || newStatus === item.status}
                className="h-[46px] border border-[#C9A96E] bg-[#C9A96E]/10 px-6 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#C9A96E] transition hover:bg-[#C9A96E] hover:text-black disabled:cursor-not-allowed disabled:opacity-30 rounded-sm"
              >
                Actualizar
              </button>
            </div>

            <div>
              <FieldLabel>Notas del consultor</FieldLabel>
              <textarea
                value={notas}
                onChange={(event) => setNotas(event.target.value)}
                placeholder="Agrega detalles de llamada, contexto financiero o siguiente paso."
                className={`${inputClass} mb-3 min-h-[120px] resize-y`}
              />
              <button
                onClick={handleSaveNotas}
                disabled={isSaving || notas === (item.notas || "")}
                className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#F5F5F5]/60 transition-colors hover:text-[#C9A96E] disabled:cursor-not-allowed disabled:opacity-30"
              >
                Guardar notas
              </button>
            </div>
          </div>

          <div className="border-t border-[#2A2A2A] pt-6">
            <FieldLabel>Trazabilidad</FieldLabel>
            <div className="mt-4 space-y-4">
              {item.historial.map((entry, index) => (
                <div key={`${entry.fecha}-${index}`} className="flex items-center gap-4">
                  <div className="z-10 h-3 w-3 rounded-full border-2 border-[#111] bg-[#C9A96E]" />
                  <div className="flex-1 border border-[#2A2A2A] bg-[#111] p-3 rounded-sm">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-mono text-[10px] uppercase text-[#F5F5F5]/80">{entry.estado}</span>
                      <span className="font-mono text-[9px] text-[#F5F5F5]/40">{entry.fecha}</span>
                    </div>
                    <span className="font-sans text-[11px] text-[#F5F5F5]/50">Por: {entry.autor}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminCloudComparator() {
  const adminApi = useAuthApi();
  const [items, setItems] = useState<CloudComparatorLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<CloudComparatorStatus | "Todos">("Todos");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<CloudComparatorLead | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const limit = 20;

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await adminApi.get(`/cloud-comparator/admin?status=${statusFilter}&page=${page}&limit=${limit}`);
      setItems(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (error) {
      console.error("Error cargando Cloud Comparator", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, page]);

  const openDrawer = (item: CloudComparatorLead) => {
    setSelected(item);
    setIsDrawerOpen(true);
  };

  const handleUpdated = (updated: CloudComparatorLead) => {
    setItems((current) => current.map((item) => (item._id === updated._id ? updated : item)));
    setSelected(updated);
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <section className="min-h-screen bg-[#050505] text-[#F5F5F5] font-sans">
      <div className="mx-auto max-w-[1400px] px-6 py-12">
        <div className="mb-8 flex flex-col justify-between gap-6 border-b border-[#2A2A2A] pb-6 md:flex-row md:items-end">
          <div>
            <div className="mb-3 inline-flex border border-[#C9A96E]/25 bg-[#C9A96E]/10 px-3 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[#C9A96E] rounded-sm">
              Cloud Cost Comparator
            </div>
            <h1 className="font-serif text-3xl tracking-tight text-[#F5F5F5]">Solicitudes Cloud Comparator</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#F5F5F5]/55">
              Pipeline separado de la tabla leads. Aqui solo aparecen las aplicaciones del comparador cloud.
            </p>
            <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.2em] text-[#C9A96E]">
              Total captados: {total}
            </p>
          </div>

          <label className="block w-52">
            <FieldLabel>Filtrar estado</FieldLabel>
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as CloudComparatorStatus | "Todos");
                setPage(1);
              }}
              className={`${inputClass} py-2 text-xs`}
            >
              <option value="Todos">Todos los estados</option>
              {STATUSES.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="overflow-hidden border border-[#2A2A2A] bg-[#0A0A0A] rounded-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[#2A2A2A] bg-[#111]">
                <tr>
                  <th className="p-4 font-mono text-[10px] uppercase tracking-[0.15em] text-[#F5F5F5]/50">Empresa / Contacto</th>
                  <th className="p-4 font-mono text-[10px] uppercase tracking-[0.15em] text-[#F5F5F5]/50">Cloud</th>
                  <th className="p-4 font-mono text-[10px] uppercase tracking-[0.15em] text-[#F5F5F5]/50">Gasto mensual</th>
                  <th className="p-4 font-mono text-[10px] uppercase tracking-[0.15em] text-[#F5F5F5]/50">Score</th>
                  <th className="p-4 font-mono text-[10px] uppercase tracking-[0.15em] text-[#F5F5F5]/50">Estado</th>
                  <th className="p-4 text-right font-mono text-[10px] uppercase tracking-[0.15em] text-[#F5F5F5]/50">Accion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2A]/50">
                {loading ? (
                  <tr><td colSpan={6} className="p-8 text-center font-mono text-xs text-[#F5F5F5]/40 animate-pulse">Cargando datos...</td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center font-mono text-xs text-[#F5F5F5]/40">No hay solicitudes con este filtro.</td></tr>
                ) : (
                  items.map((item) => (
                    <tr key={item._id} className="group transition-colors hover:bg-[#111]/50">
                      <td className="p-4">
                        <div className="font-semibold text-[#F5F5F5]">{item.empresa}</div>
                        <div className="mt-1 text-xs text-[#F5F5F5]/50">{item.nombre} / {item.cargo}</div>
                        <div className="mt-1 font-mono text-[10px] text-[#F5F5F5]/35">{item.email}</div>
                      </td>
                      <td className="p-4 font-mono text-[11px] text-[#C9A96E]">{item.provider}</td>
                      <td className="p-4 font-mono text-[11px] text-[#F5F5F5]/80">{fmtCurrency(item.monthlySpend)}</td>
                      <td className="p-4 w-40"><ScoreBadge score={item.score} /></td>
                      <td className="p-4"><StatusBadge status={item.status} /></td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => openDrawer(item)}
                          className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#C9A96E] opacity-0 transition-opacity hover:underline group-hover:opacity-100"
                        >
                          Revisar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-[#2A2A2A] bg-[#111] p-4">
            <span className="font-mono text-[10px] uppercase text-[#F5F5F5]/50">
              Pagina {page} de {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="border border-[#2A2A2A] px-3 py-1 font-mono text-[10px] uppercase text-[#F5F5F5]/60 transition-colors hover:border-[#C9A96E] hover:text-[#C9A96E] disabled:cursor-not-allowed disabled:opacity-30 rounded-sm"
              >
                Anterior
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((current) => current + 1)}
                className="border border-[#2A2A2A] px-3 py-1 font-mono text-[10px] uppercase text-[#F5F5F5]/60 transition-colors hover:border-[#C9A96E] hover:text-[#C9A96E] disabled:cursor-not-allowed disabled:opacity-30 rounded-sm"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </div>

      <CloudComparatorDrawer
        item={selected}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onUpdate={handleUpdated}
      />
    </section>
  );
}

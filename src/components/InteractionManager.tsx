import { useEffect, useState, useCallback } from "react";
import { api } from "../config/api";
import { applyOfficeHoursFomoToMonth, applyOfficeHoursFomoToSlots, type MonthAvailability } from "../utils/officeHoursFomo";
import { getInteractionTracking } from "../utils/tracking";

type InteractionType = "proof" | "office-hours" | "reference" | "paper" | "waitlist" | "fabric-os" | "benchmark" | "nda-pdf" | "doctrina" | "case-ape" | "case-aplazo" | null;
export type InteractionRequest = {
  type: Exclude<InteractionType, null>;
  date?: string | null;
  paperIndex?: number | null;
  nonce: number;
};

const powDocs = [
  { icon: "SOW",   title: "SOW Fixed-Price firmado",           meta: "28 pp · ES · Cláusulas doctrinales explícitas · dic 2025", size: "2.4 MB", access: "locked" },
  { icon: "ACTA",  title: "Acta de primer cierre contable",    meta: "6 pp · Firmada por CFO + CTO + FABRIC · may 2026",         size: "820 KB", access: "locked" },
  { icon: "KPI",   title: "Tablero KPI · primer ciclo crítico",meta: "Dashboard ejecutivo · Auditado externamente · may 2026",    size: "1.1 MB", access: "locked" },
  { icon: "TRANS", title: "Plan de transición a soporte",      meta: "Documentación viva · 142 pp · En firma · may 2026",        size: "4.2 MB", access: "locked" },
  { icon: "PR",    title: "Comunicado público de go-live",     meta: "2 pp · ES · Aprobado por APE Plazas · 25 may 2026",        size: "340 KB", access: "public" },
];

// days se genera dinámicamente en el componente

const FALLBACK_PAPERS = [
  { num: "Paper 01", paperId: "01", tag: "Research Note · Mercado", title: "Por qué fallan los go-live de Oracle Fusion", abstract: "Análisis de 47 implementaciones LATAM. Tres patrones recurrentes de fracaso, causas raíz documentadas, modelo alternativo de entrega.", meta: "8-10 pp · PDF ES · 15 min · May 2026" },
  { num: "Paper 02", paperId: "02", tag: "Technical Framework · IA", title: "IA aplicada a cierre contable en Fusion Cloud", abstract: "Framework FABRIC con 4 capas operativas. Casos APE Plazas + Aplazo. Benchmarks de reducción de tiempo de cierre.", meta: "10-12 pp · PDF ES · 20 min · May 2026" },
  { num: "Paper 03", paperId: "03", tag: "Doctrina Operativa · SOW", title: "Modelo de entrega en primer ciclo crítico", abstract: "Las 5 cláusulas doctrinales aplicadas. Redacción de RFP con criterios FABRIC. Validación post go-live documentada.", meta: "6-8 pp · PDF ES · 12 min · May 2026" },
];

interface PaperCatalogItem {
  num: string;
  paperId: string;
  tag: string;
  title: string;
  abstract: string;
  meta: string;
}

interface DaySlot { time: string; taken: boolean; fomoBlocked?: boolean; }

// Genera los próximos N días laborables a partir de mañana
function cursorToLocalISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// Días hábiles desde mañana hasta el último día del mes siguiente
function getWorkDaysUntilEndOfNextMonth(): string[] {
  const result: string[] = [];
  const cursor = new Date();
  cursor.setHours(12, 0, 0, 0);
  cursor.setDate(cursor.getDate() + 1); // empezar desde mañana

  // Último día del mes siguiente
  const endOfNextMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 2, 0);
  endOfNextMonth.setHours(12, 0, 0, 0);

  while (cursor <= endOfNextMonth) {
    const dow = cursor.getDay();
    if (dow !== 0 && dow !== 6) result.push(cursorToLocalISO(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
}

function localDateISO(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });
}
const TODAY_ISO = localDateISO();
const NOW_HH_MM = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });

function formatDayLabel(iso: string): string {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('es-MX', { weekday: 'short', day: '2-digit' }).toUpperCase();
}

const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export default function InteractionManager({
  initialRequest,
}: {
  initialRequest?: InteractionRequest | null;
}) {
  const [active, setActive] = useState<InteractionType>(null);
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth() + 1);
  const [monthDbData, setMonthDbData] = useState<Record<string, number>>({});
  const [monthLoading, setMonthLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedPaper, setSelectedPaper] = useState(0);
  const [papersList, setPapersList] = useState<PaperCatalogItem[]>(FALLBACK_PAPERS);
  const [paperDownloadUrl, setPaperDownloadUrl] = useState("");

  useEffect(() => {
    if (active !== 'paper') return;
    api.get('/papers/catalog')
      .then(res => {
        if (res.data?.ok && Array.isArray(res.data.data)) {
          const filtered = res.data.data.filter((p: { visible?: boolean }) => p.visible !== false);
          if (filtered.length > 0) {
            setPapersList(filtered.map((p: { paperId: string; tag: string; titulo: string; abstract: string; meta?: string }) => ({
              num: `Paper ${p.paperId}`,
              paperId: p.paperId,
              tag: p.tag,
              title: p.titulo,
              abstract: p.abstract,
              meta: p.meta || "",
            })));
          }
        }
      })
      .catch(err => {
        console.error('Error loading papers in InteractionManager:', err);
      });
  }, [active]);
  const [formData, setFormData] = useState({ nombre: "", cargo: "", empresa: "", email: "", revenue: "", iniciativa: "", plazo: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const [slots, setSlots] = useState<DaySlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const tracking = (sourceSection: string, interactionType: string) => getInteractionTracking(sourceSection, interactionType);

  const openInteraction = useCallback((request: InteractionRequest) => {
    let type: InteractionType = request.type;
    if (!type) return;
    if (type === "nda-pdf") type = "proof";
    if (type === "doctrina") type = "reference";
    if (type === "benchmark") type = "reference";
    if (type === "waitlist") type = "reference";

    if (type === "office-hours" && request.date) {
      const parts = request.date.split('-');
      if (parts.length === 3) {
        setCalYear(parseInt(parts[0], 10));
        setCalMonth(parseInt(parts[1], 10));
        setSelectedDay(request.date);
      }
    }

    if (type === "paper" && request.paperIndex !== null && request.paperIndex !== undefined) {
      setSelectedPaper(request.paperIndex);
    }

    setActive(type);
    setSubmitted(false);
    setSelectedSlot(null);
    setApiError("");
    setLoading(false);
    setPaperDownloadUrl("");
  }, []);

  // Cargar disponibilidad del mes desde la BD
  useEffect(() => {
    if (active !== 'office-hours') return;
    setMonthLoading(true);
    api.get(`/office-hours/disponibilidad/mes?year=${calYear}&month=${calMonth}`)
      .then(res => {
        const data: Record<string, number> = res.data.data ?? {};
        setMonthDbData(data);
        const availableDates = Object.keys(data).filter(d => (data[d] ?? 0) > 0 && d >= TODAY_ISO).sort();
        if (availableDates.length > 0) {
          setSelectedDay(prev => (prev && availableDates.includes(prev) ? prev : availableDates[0]));
        } else {
          setSelectedDay(null);
          setSlots([]);
        }
      })
      .catch(() => {
        setMonthDbData({});
        setSelectedDay(null);
        setSlots([]);
      })
      .finally(() => setMonthLoading(false));
  }, [active, calYear, calMonth]);

  // Cargar slots del día seleccionado desde la BD
  useEffect(() => {
    if (active !== 'office-hours' || !selectedDay) return;
    setSlotsLoading(true);
    api.get(`/office-hours/disponibilidad/dia?date=${selectedDay}`)
      .then(res => {
        setSlots(res.data.data ?? []);
      })
      .catch(() => {
        setSlots([]);
      })
      .finally(() => setSlotsLoading(false));
  }, [active, selectedDay]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("[data-interaction]") as HTMLElement | null;
      if (!target) return;
      const type = target.getAttribute("data-interaction") as InteractionType;
      if (!type) return;
      e.preventDefault();
      const paperIdx = target.getAttribute("data-paper-index");
      const parsedPaperIndex = paperIdx === null ? null : parseInt(paperIdx, 10);
      openInteraction({
        type: type as Exclude<InteractionType, null>,
        date: target.getAttribute("data-date"),
        paperIndex: Number.isNaN(parsedPaperIndex) ? null : parsedPaperIndex,
        nonce: Date.now(),
      });
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [openInteraction]);

  useEffect(() => {
    if (!initialRequest) return;
    const timer = window.setTimeout(() => openInteraction(initialRequest), 0);
    return () => window.clearTimeout(timer);
  }, [initialRequest, openInteraction]);

  useEffect(() => {
    if (active) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [active]);

  if (!active) return null;

  const close = () => setActive(null);

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(6,6,6,0.88)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px",
        animation: "fadeIn 200ms ease",
      }}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px) scale(0.98); } to { opacity: 1; transform: none; } }
        .im-modal { animation: slideUp 220ms cubic-bezier(0.16,1,0.3,1); }
        .im-doc-row:hover { border-color: var(--accent) !important; }
        .im-slot-btn:hover:not(:disabled) { border-color: var(--accent) !important; color: var(--accent) !important; }
        .im-slot-btn.selected { background: var(--accent) !important; color: var(--bg-base) !important; border-color: var(--accent) !important; }
        .im-day-btn.active { color: var(--accent) !important; border-color: var(--accent) !important; }
        .im-ref-row:hover { border-color: var(--accent) !important; background: rgba(201,169,110,0.04) !important; }
        .im-paper-tab.active { border-bottom: 2px solid var(--accent) !important; color: var(--accent) !important; }
        /* Office Hours modal — responsive */
        .im-oh-body { display: flex; flex: 1; overflow: hidden; min-height: 0; }
        .im-oh-left { width: 240px; border-right: 1px solid var(--border); padding: 24px 20px; overflow-y: auto; flex-shrink: 0; }
        .im-oh-left-inner { display: flex; flex-direction: column; gap: 0; }
        .im-oh-left-avatar { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
        .im-oh-right { flex: 1; padding: 24px 20px; overflow-y: auto; min-width: 0; min-height: 0; }
        @media (max-width: 600px) {
          .im-oh-body { flex-direction: column; overflow-y: auto; overflow-x: hidden; min-height: 0; }
          .im-oh-left { width: 100% !important; border-right: none !important; border-bottom: 1px solid var(--border); padding: 18px; overflow-y: visible; flex-shrink: 0; }
          .im-oh-left-inner { flex-direction: row; flex-wrap: wrap; gap: 12px; align-items: flex-start; }
          .im-oh-left-avatar { width: 100%; margin-bottom: 0; }
          .im-oh-left-criteria { width: 100%; margin-bottom: 0; }
          .im-oh-right { padding: 18px; flex: none; overflow-y: visible; min-height: 0; }
          .im-oh-day-row { overflow-x: auto; -webkit-overflow-scrolling: touch; padding-bottom: 4px; }
          .im-slot-btn { padding: 14px 8px !important; font-size: 13px !important; }
          .im-oh-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .im-oh-selects { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── PROOF OF WORK (I02) ── */}
      {active === "proof" && (
        <div className="im-modal" style={{ background: "var(--bg-panel)", border: "1px solid var(--border-strong)", maxWidth: 720, width: "100%", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "28px 32px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative" }}>
            <div style={{ position: "absolute", top: 0, left: 0, width: 2, height: 48, background: "var(--accent)" }} />
            <div style={{ paddingLeft: 16 }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: 8 }}>Proof of Work · APE Plazas</div>
              <div style={{ fontFamily: "var(--serif)", fontSize: 28, lineHeight: 1.1 }}>Documentación <em style={{ color: "var(--accent)" }}>verificable.</em></div>
            </div>
            <button onClick={close} style={{ width: 36, height: 36, border: "1px solid var(--border-strong)", background: "transparent", color: "var(--text-secondary)", fontFamily: "var(--mono)", fontSize: 18, cursor: "pointer", flexShrink: 0 }}>×</button>
          </div>

          <div style={{ padding: "24px 32px", overflowY: "auto", flex: 1 }}>
            <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>
              Cinco documentos producidos durante el engagement APE Plazas. Acceso público a comunicados; el resto bajo NDA tras evaluación post-admisión.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {powDocs.map((doc) => (
                <div key={doc.icon} className="im-doc-row" style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", border: "1px solid var(--border)", background: "var(--bg-base)", cursor: "pointer", transition: "border-color 200ms" }}>
                  <div style={{ width: 40, height: 48, border: "1px solid rgba(201,169,110,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--mono)", fontSize: 9, color: "var(--accent)", flexShrink: 0, letterSpacing: "0.1em" }}>{doc.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "var(--serif)", fontSize: 16 }}>{doc.title}</div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-tertiary)", marginTop: 3, letterSpacing: "0.05em" }}>{doc.meta}</div>
                  </div>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-tertiary)", flexShrink: 0 }}>{doc.size}</span>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 10, padding: "4px 10px", border: `1px solid ${doc.access === "public" ? "rgba(201,169,110,0.4)" : "var(--border-strong)"}`, color: doc.access === "public" ? "var(--accent)" : "var(--text-tertiary)", flexShrink: 0, letterSpacing: "0.1em" }}>
                    {doc.access === "public" ? "↓ Descargar" : "🔒 NDA"}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 20, padding: "16px 20px", background: "var(--bg-base)", border: "1px solid var(--border)", fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.7 }}>
              <strong style={{ color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.2em", display: "block", marginBottom: 6, fontSize: 10 }}>Proceso de Acceso</strong>
              El acceso a documentos bajo NDA se otorga tras evaluación inicial. FABRIC valida ajuste estratégico (revenue, industria, patrocinio) y envía NDA mutuo. Tiempo típico: 3 días hábiles.
            </div>
          </div>

          {!submitted ? (
            <div style={{ padding: "16px 32px", borderTop: "1px solid var(--border)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 10, marginBottom: 12 }}>
                {(["nombre", "cargo", "empresa", "email"] as const).map((field) => (
                  <div key={field}>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--text-tertiary)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 6 }}>{field === "email" ? "Email corporativo" : field}</div>
                    <input type={field === "email" ? "email" : "text"} value={formData[field]} onChange={e => setFormData(p => ({ ...p, [field]: e.target.value }))}
                      style={{ width: "100%", padding: "10px 12px", background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)", fontFamily: "var(--mono)", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: apiError && active === "proof" ? "#B85450" : "var(--text-tertiary)", letterSpacing: "0.05em" }}>
                  {apiError && active === "proof" ? apiError : "5 documentos · revisión admin · entrega bajo NDA"}
                </span>
                <button
                  disabled={loading}
                  onClick={async () => {
                    setApiError("");
                    if (!formData.nombre || !formData.cargo || !formData.empresa || !formData.email) {
                      setApiError("Completa todos los campos.");
                      return;
                    }
                    setLoading(true);
                    try {
                      await api.post("/nda/solicitar", {
                        nombre: formData.nombre,
                        cargo: formData.cargo,
                        empresa: formData.empresa,
                        email: formData.email,
                        caso: "ape-plazas",
                        documento: "paper-nda",
                        tracking: tracking("S07", "nda-pdf"),
                      });
                      setSubmitted(true);
                    } catch (err: unknown) {
                      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
                      setApiError(msg ?? "Error al registrar solicitud NDA.");
                    } finally {
                      setLoading(false);
                    }
                  }}
                  style={{ padding: "12px 24px", background: loading ? "rgba(201,169,110,0.5)" : "var(--accent)", color: "var(--bg-base)", border: "none", fontFamily: "var(--mono)", fontSize: 11, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", cursor: loading ? "wait" : "pointer" }}>
                  {loading ? "Enviando..." : "Solicitar PDF bajo NDA →"}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ padding: "28px 32px", borderTop: "1px solid var(--border)", textAlign: "center" }}>
              <div style={{ fontFamily: "var(--serif)", fontSize: 24, marginBottom: 8 }}>Solicitud <em style={{ color: "var(--accent)" }}>recibida.</em></div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.7 }}>
                El admin revisar&aacute; el acceso. Si se aprueba, recibir&aacute;s el PDF en {formData.email || "tu email"}.
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── OFFICE HOURS / RESERVAR CONVERSACIÓN (I04) ── */}
      {active === "office-hours" && (
        <div className="im-modal" style={{ background: "var(--bg-panel)", border: "1px solid var(--border-strong)", maxWidth: 780, width: "100%", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative" }}>
            <div style={{ position: "absolute", top: 0, left: 0, width: 3, height: "100%", background: "var(--accent)" }} />
            <div style={{ paddingLeft: 14 }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: 4 }}>FABRIC Office Hours</div>
              <div style={{ fontFamily: "var(--serif)", fontSize: 24 }}>Reservar <em style={{ color: "var(--accent)" }}>Conversación de Ingeniería.</em></div>
            </div>
            <button onClick={close} style={{ width: 36, height: 36, border: "1px solid var(--border-strong)", background: "transparent", color: "var(--text-secondary)", fontFamily: "var(--mono)", fontSize: 18, cursor: "pointer" }}>×</button>
          </div>

          <div className="im-oh-body">
            {/* Left panel info */}
            <div className="im-oh-left">
              <div className="im-oh-left-inner">
                <div className="im-oh-left-avatar">
                  <div style={{ width: 48, height: 48, border: "1px solid var(--accent)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--serif)", fontSize: 24, color: "var(--accent)", fontStyle: "italic", flexShrink: 0 }}>J</div>
                  <div>
                    <div style={{ fontFamily: "var(--serif)", fontSize: 17, marginBottom: 2 }}>Julio Álvarez</div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-secondary)", letterSpacing: "0.1em" }}>Founder · FABRIC</div>
                  </div>
                </div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-tertiary)", letterSpacing: "0.15em", textTransform: "uppercase", width: "100%", marginTop: 4 }}>30 min · Video Call</div>
                <div className="im-oh-left-criteria" style={{ marginBottom: 4 }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 10 }}>Criterios de acceso</div>
                  {["Lunes a Viernes (09:00 AM - 06:00 PM)", "USD 50M+ revenue anual", "CFO / CIO / CTO / Dir. Transformación", "Iniciativa Oracle activa o planeada"].map(c => (
                    <div key={c} style={{ display: "flex", gap: 8, marginBottom: 8, fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-secondary)", lineHeight: 1.4 }}>
                      <span style={{ color: "var(--accent)", flexShrink: 0 }}>·</span>{c}
                    </div>
                  ))}
                </div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-tertiary)", padding: "8px 12px", border: "1px solid var(--border)", letterSpacing: "0.05em", lineHeight: 1.5, width: "100%", boxSizing: "border-box" }}>
                  Confidencial · NDA mutuo al confirmar
                </div>
              </div>
            </div>

            {/* Right panel: Selector de Fecha, Horario y Datos */}
            <div className="im-oh-right">
              {!selectedSlot ? (
                <>
                  {/* Navegación mensual */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingBottom: 12, borderBottom: "1px solid var(--border)" }}>
                    <button
                      type="button"
                      onClick={() => {
                        if (calMonth === 1) { setCalMonth(12); setCalYear(y => y - 1); }
                        else { setCalMonth(m => m - 1); }
                      }}
                      style={{ padding: "6px 12px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-secondary)", fontFamily: "var(--mono)", fontSize: 13, cursor: "pointer" }}
                    >
                      ←
                    </button>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--accent)", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 600 }}>
                      {MONTH_NAMES[calMonth - 1]} DE {calYear} · DÍAS HÁBILES
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (calMonth === 12) { setCalMonth(1); setCalYear(y => y + 1); }
                        else { setCalMonth(m => m + 1); }
                      }}
                      style={{ padding: "6px 12px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-secondary)", fontFamily: "var(--mono)", fontSize: 13, cursor: "pointer" }}
                    >
                      →
                    </button>
                  </div>

                  {monthLoading ? (
                    <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-tertiary)", letterSpacing: "0.14em", padding: "24px 0", textAlign: "center" }}>
                      Consultando disponibilidad en la base de datos...
                    </div>
                  ) : (
                    <>
                      {/* Filtrar estrictamente solo DÍAS HÁBILES (Lunes = 1 .. Viernes = 5) */}
                      {(() => {
                        const availableWeekdayDates = Object.keys(monthDbData)
                          .filter(d => {
                            if (!d || d < TODAY_ISO) return false;
                            const count = monthDbData[d] ?? 0;
                            if (count <= 0) return false;
                            const dow = new Date(d + 'T12:00:00').getDay();
                            return dow >= 1 && dow <= 5; // Solo Lunes (1) a Viernes (5)
                          })
                          .sort();

                        if (availableWeekdayDates.length === 0) {
                          return (
                            <div style={{ padding: "28px 20px", border: "1px dashed var(--border)", textAlign: "center", borderRadius: 4, background: "rgba(255,255,255,0.02)" }}>
                              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 8 }}>
                                Sin días hábiles abiertos en la BD para este mes
                              </div>
                              <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-tertiary)", lineHeight: 1.6 }}>
                                No hay slots aperturados en la base de datos para días hábiles de {MONTH_NAMES[calMonth - 1]} de {calYear}.<br />
                                Usa las flechas ← → para consultar otros meses.
                              </div>
                            </div>
                          );
                        }

                        return (
                          <>
                            <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--text-tertiary)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 10 }}>
                              1. Selecciona un Día Hábil Aperturado (Lunes a Viernes)
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
                              {availableWeekdayDates.map((iso) => {
                                const count = monthDbData[iso] ?? 0;
                                const isSelected = selectedDay === iso;
                                const d = new Date(iso + 'T12:00:00');
                                const label = d.toLocaleDateString('es-MX', { weekday: 'short', day: '2-digit' }).toUpperCase();
                                return (
                                  <button
                                    key={iso}
                                    type="button"
                                    onClick={() => setSelectedDay(iso)}
                                    className={`im-day-btn${isSelected ? " active" : ""}`}
                                    style={{
                                      padding: "8px 12px",
                                      border: isSelected ? "1px solid var(--accent)" : "1px solid var(--border)",
                                      background: isSelected ? "rgba(201,169,110,0.15)" : "transparent",
                                      color: isSelected ? "var(--accent)" : "var(--text-secondary)",
                                      fontFamily: "var(--mono)",
                                      fontSize: 11,
                                      cursor: "pointer",
                                      transition: "all 200ms",
                                      letterSpacing: "0.08em",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 6
                                    }}
                                  >
                                    <span>{label}</span>
                                    <span style={{ fontSize: 9, padding: "2px 5px", background: "rgba(201,169,110,0.2)", color: "var(--accent)", borderRadius: 3 }}>
                                      {count} {count === 1 ? 'slot' : 'slots'}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>

                            {selectedDay && (
                              <div>
                                <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12 }}>
                                  2. Selecciona Horario Disponibles (30 min) · {new Date(selectedDay + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </div>
                                {slotsLoading ? (
                                  <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-tertiary)", padding: "16px 0" }}>
                                    Cargando horarios de la base de datos...
                                  </div>
                                ) : (
                                  <div className="im-oh-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                                    {slots.filter(slot => {
                                      const isPastSlot = selectedDay === TODAY_ISO && slot.time <= NOW_HH_MM;
                                      return !slot.taken && !isPastSlot;
                                    }).length === 0 ? (
                                      <div style={{ gridColumn: 'span 3', fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-tertiary)", padding: "16px 0" }}>
                                        No hay horarios libres para esta fecha en la base de datos.
                                      </div>
                                    ) : (
                                      slots
                                        .filter(slot => {
                                          const isPastSlot = selectedDay === TODAY_ISO && slot.time <= NOW_HH_MM;
                                          return !slot.taken && !isPastSlot;
                                        })
                                        .map((slot) => (
                                          <button
                                            key={slot.time}
                                            type="button"
                                            onClick={() => setSelectedSlot(slot.time)}
                                            className={`im-slot-btn${selectedSlot === slot.time ? " selected" : ""}`}
                                            style={{ padding: "12px 8px", border: "1px solid var(--border)", background: selectedSlot === slot.time ? "rgba(201,169,110,0.15)" : "transparent", fontFamily: "var(--mono)", fontSize: 12, color: selectedSlot === slot.time ? "var(--accent)" : "var(--text-secondary)", cursor: "pointer", transition: "all 200ms", letterSpacing: "0.05em" }}>
                                            {slot.time}
                                          </button>
                                        ))
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </>
                  )}
                </>
              ) : (
                <div>
                  {!submitted ? (
                    <>
                      <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.2em", marginBottom: 16, textTransform: "uppercase" }}>
                        3. Ingresa tus datos para confirmar · {formatDayLabel(selectedDay)} · {selectedSlot}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <div>
                          <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-tertiary)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 6 }}>Nombre completo *</div>
                          <input type="text" value={formData.nombre} onChange={e => setFormData(p => ({ ...p, nombre: e.target.value }))}
                            style={{ width: "100%", padding: "12px 14px", background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)", fontFamily: "var(--mono)", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                        </div>

                        <div className="im-oh-selects" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                          <div>
                            <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-tertiary)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 6 }}>Empresa *</div>
                            <input type="text" value={formData.empresa} onChange={e => setFormData(p => ({ ...p, empresa: e.target.value }))}
                              style={{ width: "100%", padding: "12px 14px", background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)", fontFamily: "var(--mono)", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                          </div>

                          <div>
                            <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-tertiary)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 6 }}>Email Corporativo *</div>
                            <input type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                              style={{ width: "100%", padding: "12px 14px", background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)", fontFamily: "var(--mono)", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                          </div>
                        </div>

                        <div className="im-oh-selects" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                          <div>
                            <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-tertiary)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 6 }}>Cargo / Puesto</div>
                            <input type="text" placeholder="Ej. CFO / CTO" value={formData.cargo} onChange={e => setFormData(p => ({ ...p, cargo: e.target.value }))}
                              style={{ width: "100%", padding: "12px 14px", background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)", fontFamily: "var(--mono)", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
                          </div>

                          <div>
                            <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-tertiary)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 6 }}>Revenue Anual</div>
                            <select value={formData.revenue} onChange={e => setFormData(p => ({ ...p, revenue: e.target.value }))}
                              style={{ width: "100%", padding: "12px 14px", background: "var(--bg-base)", border: "1px solid var(--border)", color: formData.revenue ? "var(--text-primary)" : "var(--text-tertiary)", fontFamily: "var(--mono)", fontSize: 12, outline: "none", boxSizing: "border-box" }}>
                              <option value="">Seleccionar...</option>
                              <option>USD 50M-250M</option>
                              <option>USD 250M-1B</option>
                              <option>Mas de USD 1B</option>
                            </select>
                          </div>
                        </div>

                        <div className="im-oh-selects" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                          <div>
                            <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-tertiary)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 6 }}>Plazo Estimado</div>
                            <select value={formData.plazo} onChange={e => setFormData(p => ({ ...p, plazo: e.target.value }))}
                              style={{ width: "100%", padding: "12px 14px", background: "var(--bg-base)", border: "1px solid var(--border)", color: formData.plazo ? "var(--text-primary)" : "var(--text-tertiary)", fontFamily: "var(--mono)", fontSize: 12, outline: "none", boxSizing: "border-box" }}>
                              <option value="">Seleccionar...</option>
                              <option>{'<3 meses'}</option>
                              <option>3-6 meses</option>
                              <option>6-12 meses</option>
                            </select>
                          </div>

                          <div>
                            <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-tertiary)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 6 }}>Iniciativa Oracle</div>
                            <input placeholder="Ej. Migración Fusion ERP" value={formData.iniciativa} onChange={e => setFormData(p => ({ ...p, iniciativa: e.target.value }))}
                              style={{ width: "100%", padding: "12px 14px", background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)", fontFamily: "var(--mono)", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
                          </div>
                        </div>

                        {apiError && active === "office-hours" && (
                          <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "#B85450", letterSpacing: "0.05em" }}>{apiError}</span>
                        )}

                        <button
                          disabled={loading}
                          onClick={async () => {
                            setApiError("");
                            if (!formData.nombre || !formData.empresa || !formData.email) {
                              setApiError("Completa Nombre, Empresa y Email corporativo.");
                              return;
                            }
                            setLoading(true);
                            try {
                              await api.post("/office-hours/book", {
                                nombre:  formData.nombre,
                                empresa: formData.empresa,
                                email:   formData.email,
                                cargo:   formData.cargo,
                                revenue: formData.revenue,
                                iniciativaOracle: formData.iniciativa,
                                plazo:   formData.plazo,
                                dia:     selectedDay,
                                slot:    selectedSlot,
                                tracking: tracking("S11", "office-hours"),
                              });
                              setSubmitted(true);
                            } catch (err: unknown) {
                              const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
                              setApiError(msg ?? "Error al confirmar. Intenta de nuevo.");
                            } finally {
                              setLoading(false);
                            }
                          }}
                          style={{ marginTop: 8, padding: "14px", background: loading ? "rgba(201,169,110,0.5)" : "var(--accent)", color: "var(--bg-base)", border: "none", fontFamily: "var(--mono)", fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", cursor: loading ? "wait" : "pointer" }}
                        >
                          {loading ? "Confirmando en BD..." : "Confirmar Reserva y Guardar en BD →"}
                        </button>
                        <button onClick={() => setSelectedSlot(null)} style={{ padding: "10px", background: "transparent", color: "var(--text-secondary)", border: "1px solid var(--border)", fontFamily: "var(--mono)", fontSize: 10, cursor: "pointer", letterSpacing: "0.1em" }}>
                          ← Cambiar horario / fecha
                        </button>
                      </div>
                    </>
                  ) : (
                    <div style={{ textAlign: "center", padding: "32px 0" }}>
                      <div style={{ fontFamily: "var(--serif)", fontSize: 48, color: "var(--accent)", marginBottom: 16 }}>✓</div>
                      <div style={{ fontFamily: "var(--serif)", fontSize: 24, marginBottom: 12 }}>Conversación <em>agendada exitosamente.</em></div>
                      <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.7 }}>
                        Tu cita se ha guardado directamente en la base de datos.<br />
                        Recibirás confirmación en <strong style={{ color: "var(--accent)" }}>{formData.email}</strong>.<br />
                        Julio revisará tus criterios y se enviará NDA mutuo 24h antes.
                      </div>
                      <button onClick={close} style={{ marginTop: 24, padding: "12px 24px", background: "transparent", border: "1px solid var(--accent)", color: "var(--accent)", fontFamily: "var(--mono)", fontSize: 10, cursor: "pointer", letterSpacing: "0.2em", textTransform: "uppercase" }}>
                        Cerrar
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div style={{ padding: "12px 28px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-tertiary)", letterSpacing: "0.1em" }}>Solo Días Hábiles (Lunes a Viernes) · CDMX</span>
            <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.1em" }}>Sincronizado con MongoDB Atlas</span>
          </div>
        </div>
      )}

      {/* ── DOCTRINA OPERATIVA MODAL ── */}
      {active === "doctrina" && (
        <div className="im-modal" style={{ background: "var(--bg-panel)", border: "1px solid var(--border-strong)", maxWidth: 760, width: "100%", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative" }}>
            <div style={{ position: "absolute", top: 0, left: 0, width: 2, height: 40, background: "var(--accent)" }} />
            <div style={{ paddingLeft: 16 }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: 6 }}>FABRIC OPERATING PRINCIPLES</div>
              <div style={{ fontFamily: "var(--serif)", fontSize: 26 }}>Nuestra Doctrina de <em style={{ color: "var(--accent)" }}>Ingeniería Crítica.</em></div>
            </div>
            <button onClick={close} style={{ width: 36, height: 36, border: "1px solid var(--border-strong)", background: "transparent", color: "var(--text-secondary)", fontFamily: "var(--mono)", fontSize: 18, cursor: "pointer" }}>×</button>
          </div>

          <div style={{ padding: "24px 28px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-tertiary)", letterSpacing: "0.08em" }}>
              Garantías y compromisos no negociables respaldados legalmente por contrato.
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: 16 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "baseline", marginBottom: 6 }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--accent)", fontWeight: "bold" }}>1.</span>
                  <div style={{ fontFamily: "var(--serif)", fontSize: 17, color: "var(--text-primary)", fontWeight: 600 }}>Entrega en primer ciclo crítico</div>
                </div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6, paddingLeft: 22 }}>
                  El proyecto no se entrega en el go-live. Se entrega cuando tu primer cierre contable, primer ciclo operativo o primer ciclo regulatorio crítico opera en producción con estabilidad documentada.
                </div>
              </div>

              <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: 16 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "baseline", marginBottom: 6 }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--accent)", fontWeight: "bold" }}>2.</span>
                  <div style={{ fontFamily: "var(--serif)", fontSize: 17, color: "var(--text-primary)", fontWeight: 600 }}>Solo seniors. Cero juniors facturables.</div>
                </div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6, paddingLeft: 22 }}>
                  Cada consultor de FABRIC tiene mínimo 8 años de experiencia real en Oracle. Sin excepciones.
                </div>
              </div>

              <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: 16 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "baseline", marginBottom: 6 }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--accent)", fontWeight: "bold" }}>3.</span>
                  <div style={{ fontFamily: "var(--serif)", fontSize: 17, color: "var(--text-primary)", fontWeight: 600 }}>Fixed-Price por fase. Cero sorpresas.</div>
                </div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6, paddingLeft: 22 }}>
                  Operamos con presupuestos cerrados. Si nos atrasamos por nuestra causa, no facturamos las semanas adicionales.
                </div>
              </div>

              <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: 16 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "baseline", marginBottom: 6 }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--accent)", fontWeight: "bold" }}>4.</span>
                  <div style={{ fontFamily: "var(--serif)", fontSize: 17, color: "var(--text-primary)", fontWeight: 600 }}>Cero reportes manuales post go-live.</div>
                </div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6, paddingLeft: 22 }}>
                  Al cierre del primer ciclo crítico, ningún reporte ejecutivo, financiero u operativo debe ejecutarse fuera del ERP. Si subsiste un reporte manual paralelo por causa atribuible a FABRIC, se resuelve sin costo adicional hasta su eliminación.
                </div>
              </div>

              <div style={{ paddingBottom: 8 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "baseline", marginBottom: 6 }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--accent)", fontWeight: "bold" }}>5.</span>
                  <div style={{ fontFamily: "var(--serif)", fontSize: 17, color: "var(--text-primary)", fontWeight: 600 }}>Transición formal con documentación viva.</div>
                </div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6, paddingLeft: 22 }}>
                  El cierre del proyecto se documenta con acta formal firmada por todos los stakeholders del cliente. El acta incluye: tablero de KPIs verificado, incidencias resueltas, adopción de usuarios clave medida, plan de soporte post-transición, y entrega de documentación viva (configuraciones, integraciones, runbooks, procedimientos de cierre, matrices de roles) auditable y actualizable por el cliente sin dependencia de FABRIC.
                </div>
              </div>
            </div>

            <div style={{ padding: "20px", background: "rgba(201,169,110,0.06)", border: "1px solid var(--accent)", borderRadius: 6, marginTop: 8 }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 8 }}>GARANTÍA CONTRACTUAL</div>
              <div style={{ fontFamily: "var(--serif)", fontSize: 15, color: "var(--text-primary)", fontStyle: "italic", lineHeight: 1.5, marginBottom: 10 }}>
                &quot;Si no logramos estabilizar tu primer cierre contable en producción en la fecha acordada por causas de nuestra ingeniería, no facturamos los servicios de estabilización hasta lograrlo.&quot;
              </div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-tertiary)" }}>
                — Cláusula 7.2 de Servicios
              </div>
            </div>

            <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-tertiary)", textAlign: "center", paddingTop: 8 }}>
              Sólo trabajamos con clientes comprometidos con nuestra doctrina técnica de ingeniería.
            </div>
          </div>

          <div style={{ padding: "16px 28px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button
              onClick={() => {
                close();
                openInteraction({ type: "reference", nonce: Date.now() });
              }}
              style={{ padding: "10px 18px", background: "var(--accent)", color: "var(--bg-base)", border: "none", fontFamily: "var(--mono)", fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer" }}
            >
              Iniciar Evaluación →
            </button>
            <button onClick={close} style={{ padding: "8px 16px", background: "transparent", border: "1px solid var(--border)", color: "var(--text-secondary)", fontFamily: "var(--mono)", fontSize: 10, cursor: "pointer", letterSpacing: "0.1em" }}>
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* ── CASO APE PLAZAS MODAL ── */}
      {active === "case-ape" && (
        <div className="im-modal" style={{ background: "rgb(10, 25, 47)", border: "1px solid rgba(201, 169, 110, 0.3)", maxWidth: 840, width: "100%", maxHeight: "90vh", display: "flex", flexDirection: "column", color: "#e6f1ff" }}>
          {/* Header Bar */}
          <div style={{ padding: "20px 28px 16px 28px", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ padding: "4px 12px", border: "1px solid rgba(201, 169, 110, 0.5)", borderRadius: 12, background: "rgba(201, 169, 110, 0.1)", fontFamily: "var(--mono)", fontSize: 10, color: "#C9A96E", letterSpacing: "0.15em", textTransform: "uppercase" }}>
              REAL CASE STUDY · MIGRATION
            </div>
            <button onClick={close} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", color: "#8892b0", fontFamily: "var(--mono)", fontSize: 11, padding: "4px 10px", cursor: "pointer", letterSpacing: "0.1em" }}>
              [CERRAR X]
            </button>
          </div>

          {/* Body content */}
          <div style={{ padding: "28px", overflowY: "auto", flex: 1 }}>
            <h2 style={{ fontFamily: "var(--serif)", fontSize: 28, color: "#ffffff", fontWeight: 400, marginBottom: 8, lineHeight: 1.2 }}>
              Caso APE Plazas: Estabilización de Facturación Masiva
            </h2>
            <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "#8892b0", marginBottom: 24 }}>
              Óptima facturación de arrendamientos comerciales y timbrado SAT masivo sin middlewares.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              {/* Left Column: Text & Evidence */}
              <div className="md:col-span-7 space-y-5" style={{ fontSize: 13, lineHeight: 1.7, color: "#a8b2d1", fontFamily: "var(--sans)" }}>
                <p>
                  APE Plazas, operador líder de centros comerciales con más de 1,200 locales activos en México, enfrentaba el colapso de su ciclo contable mensual debido a la lentitud en la facturación masiva. Su integrador anterior había dejado la configuración inconclusa, obligando a reconciliar el IVA y los folios fiscales del SAT en hojas de cálculo externas.
                </p>

                <blockquote style={{ borderLeft: "2px solid #C9A96E", paddingLeft: 16, margin: "16px 0", color: "#8892b0", fontStyle: "italic", fontFamily: "var(--mono)", fontSize: 11, lineHeight: 1.6 }}>
                  &quot;El Go-Live técnico ya se había celebrado por la consultora anterior, pero en la práctica el equipo de finanzas tardaba 4 días en facturar e inundaba el SAT de folios erróneos.&quot;
                </blockquote>

                <p>
                  FABRIC asumió el control del proyecto e inyectó conectores modularizados para el timbrado masivo SAT CFDI 4.0 directamente mediante bases de datos Oracle Fusion, bajando el tiempo total a solo 4 horas y con <strong style={{ color: "#e6f1ff" }}>cero incidencias críticas de severidad alta</strong> durante el primer cierre contable de abril de 2026.
                </p>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 16, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)", fontFamily: "var(--mono)", fontSize: 11, color: "#8892b0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span>🗓️</span> 06 de Abril 2026
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span>🗄️</span> Oracle Fusion Cloud
                  </div>
                </div>
              </div>

              {/* Right Column: Log Metrics Card */}
              <div className="md:col-span-5" style={{ background: "rgba(16, 33, 60, 0.7)", border: "1px solid rgba(201, 169, 110, 0.2)", borderRadius: 8, padding: "20px" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "#C9A96E", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 16, fontWeight: 700 }}>
                  MÉTRICAS DE LOG:
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 16, fontFamily: "var(--mono)", fontSize: 11 }}>
                  <div>
                    <div style={{ color: "#8892b0", fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase" }}>TIEMPO CICLO:</div>
                    <div style={{ color: "#ffffff", fontSize: 14, fontWeight: 700, marginTop: 2 }}>Reducido a 4 horas</div>
                  </div>

                  <div>
                    <div style={{ color: "#8892b0", fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase" }}>CUMPLIMIENTO:</div>
                    <div style={{ color: "#64ffda", fontSize: 14, fontWeight: 700, marginTop: 2 }}>✓ Cierre sin incidencias</div>
                  </div>

                  <div>
                    <div style={{ color: "#8892b0", fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase" }}>TASA DE TIMBRADO:</div>
                    <div style={{ color: "#ffffff", fontSize: 14, fontWeight: 700, marginTop: 2 }}>99.98% primer intento</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Action Footer */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", background: "rgba(10, 20, 38, 0.9)" }}>
            <button
              onClick={() => {
                close();
                openInteraction({ type: "paper", paperIndex: 0, nonce: Date.now() });
              }}
              style={{ width: "100%", padding: "16px 28px", background: "rgba(16, 33, 60, 0.9)", border: "none", color: "#C9A96E", fontFamily: "var(--mono)", fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
            >
              <span>APLICAR PARA RESCATE DE PROYECTO →</span>
              <span>📄</span>
            </button>
          </div>
        </div>
      )}

      {/* ── CASO APLAZO MODAL ── */}
      {active === "case-aplazo" && (
        <div className="im-modal" style={{ background: "rgb(10, 25, 47)", border: "1px solid rgba(201, 169, 110, 0.3)", maxWidth: 840, width: "100%", maxHeight: "90vh", display: "flex", flexDirection: "column", color: "#e6f1ff" }}>
          {/* Header Bar */}
          <div style={{ padding: "20px 28px 16px 28px", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ padding: "4px 12px", border: "1px solid rgba(201, 169, 110, 0.5)", borderRadius: 12, background: "rgba(201, 169, 110, 0.1)", fontFamily: "var(--mono)", fontSize: 10, color: "#C9A96E", letterSpacing: "0.15em", textTransform: "uppercase" }}>
              REAL CASE STUDY · FINTECH STABILIZATION
            </div>
            <button onClick={close} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", color: "#8892b0", fontFamily: "var(--mono)", fontSize: 11, padding: "4px 10px", cursor: "pointer", letterSpacing: "0.1em" }}>
              [CERRAR X]
            </button>
          </div>

          {/* Body content */}
          <div style={{ padding: "28px", overflowY: "auto", flex: 1 }}>
            <h2 style={{ fontFamily: "var(--serif)", fontSize: 28, color: "#ffffff", fontWeight: 400, marginBottom: 8, lineHeight: 1.2 }}>
              Caso Aplazo: Remediación de Cuentas por Cobrar (AR)
            </h2>
            <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "#8892b0", marginBottom: 24 }}>
              Estabilización y balanceo de subledgers con el Libro Mayor en un plazo récord de 8 semanas.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              {/* Left Column: Text & Evidence */}
              <div className="md:col-span-7 space-y-5" style={{ fontSize: 13, lineHeight: 1.7, color: "#a8b2d1", fontFamily: "var(--sans)" }}>
                <p>
                  Aplazo, la plataforma BNPL líder en México, requería conciliar millones de cobros recurrentes mensuales sin generar inconsistencias de centavos en la contabilidad general de su ERP. Las discrepancias acumulaban descuadres que tardaban hasta 5 días hábiles en corregirse manualmente.
                </p>

                <blockquote style={{ borderLeft: "2px solid #C9A96E", paddingLeft: 16, margin: "16px 0", color: "#8892b0", fontStyle: "italic", fontFamily: "var(--mono)", fontSize: 11, lineHeight: 1.6 }}>
                  &quot;Rediseñamos la capa de agregación del SLA (Subledger Accounting) Engine del ERP para agrupar transacciones en lotes coherentes directamente en la base de datos.&quot;
                </blockquote>

                <p>
                  En solo 8 semanas, el equipo de FABRIC integró reglas customizadas que redujeron el ciclo de cierre contable a solo 4 horas y llevaron los descuadres a un absoluto <strong style={{ color: "#64ffda" }}>0.00%</strong>, logrando erradicar el uso de hojas Excel auxiliares para las conciliaciones de IVA.
                </p>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 16, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)", fontFamily: "var(--mono)", fontSize: 11, color: "#8892b0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span>🗓️</span> 8 Semanas Totales
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span>🗄️</span> Oracle SLA Custom
                  </div>
                </div>
              </div>

              {/* Right Column: Log Metrics Card */}
              <div className="md:col-span-5" style={{ background: "rgba(16, 33, 60, 0.7)", border: "1px solid rgba(201, 169, 110, 0.2)", borderRadius: 8, padding: "20px" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "#C9A96E", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 16, fontWeight: 700 }}>
                  MÉTRICAS DE LOG:
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 16, fontFamily: "var(--mono)", fontSize: 11 }}>
                  <div>
                    <div style={{ color: "#8892b0", fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase" }}>PLAZO DE ENTREGA:</div>
                    <div style={{ color: "#ffffff", fontSize: 14, fontWeight: 700, marginTop: 2 }}>8 Semanas Calendario</div>
                  </div>

                  <div>
                    <div style={{ color: "#8892b0", fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase" }}>VOLUMEN ADMITIDO:</div>
                    <div style={{ color: "#ffffff", fontSize: 14, fontWeight: 700, marginTop: 2 }}>$4.2B MXN mensuales</div>
                  </div>

                  <div>
                    <div style={{ color: "#8892b0", fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase" }}>DESCUADRES AR vs GL:</div>
                    <div style={{ color: "#64ffda", fontSize: 14, fontWeight: 700, marginTop: 2 }}>0.00% (Balanceado)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Action Footer */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", background: "rgba(10, 20, 38, 0.9)" }}>
            <button
              onClick={() => {
                close();
                openInteraction({ type: "paper", paperIndex: 1, nonce: Date.now() });
              }}
              style={{ width: "100%", padding: "16px 28px", background: "rgba(16, 33, 60, 0.9)", border: "none", color: "#C9A96E", fontFamily: "var(--mono)", fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
            >
              <span>APLICAR PARA RESCATE DE PROYECTO →</span>
              <span>📄</span>
            </button>
          </div>
        </div>
      )}

      {/* ── REFERENCIAS / INICIAR EVALUACIÓN (I05) ── */}
      {active === "reference" && (
        <div className="im-modal" style={{ background: "var(--bg-panel)", border: "1px solid var(--border-strong)", maxWidth: 640, width: "100%", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative" }}>
            <div style={{ position: "absolute", top: 0, left: 0, width: 2, height: 40, background: "var(--accent)" }} />
            <div style={{ paddingLeft: 16 }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: 6 }}>Referencias · Acceso verificado</div>
              <div style={{ fontFamily: "var(--serif)", fontSize: 26 }}>Iniciar <em style={{ color: "var(--accent)" }}>evaluación.</em></div>
            </div>
            <button onClick={close} style={{ width: 36, height: 36, border: "1px solid var(--border-strong)", background: "transparent", color: "var(--text-secondary)", fontFamily: "var(--mono)", fontSize: 18, cursor: "pointer" }}>×</button>
          </div>
          <div style={{ padding: "24px 28px", overflowY: "auto", flex: 1 }}>
            {!submitted ? (
              <>
                <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>
                  Las referencias ejecutivas se facilitan únicamente durante el proceso de evaluación post-admisión. FABRIC valida ajuste antes de facilitar el contacto directo.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {/* Fila nombre + cargo */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {(["nombre", "cargo"] as const).map(field => (
                      <div key={field}>
                        <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-tertiary)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 6 }}>{field === "nombre" ? "Nombre completo *" : "Cargo *"}</div>
                        {field === "cargo" ? (
                          <select value={formData.cargo} onChange={e => setFormData(p => ({ ...p, cargo: e.target.value }))}
                            style={{ width: "100%", padding: "12px 14px", background: "var(--bg-base)", border: "1px solid var(--border)", color: formData.cargo ? "var(--text-primary)" : "var(--text-tertiary)", fontFamily: "var(--mono)", fontSize: 12, outline: "none", boxSizing: "border-box" }}>
                            <option value="">Seleccionar...</option>
                            <option value="CFO">CFO</option>
                            <option value="CTO">CTO</option>
                            <option value="CIO">CIO</option>
                            <option value="Director Transformación">Director Transformación</option>
                            <option value="Otro">Otro</option>
                          </select>
                        ) : (
                          <input type="text" value={formData.nombre} onChange={e => setFormData(p => ({ ...p, nombre: e.target.value }))}
                            style={{ width: "100%", padding: "12px 14px", background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)", fontFamily: "var(--mono)", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Empresa */}
                  <div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-tertiary)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 6 }}>Empresa *</div>
                    <input type="text" value={formData.empresa} onChange={e => setFormData(p => ({ ...p, empresa: e.target.value }))}
                      style={{ width: "100%", padding: "12px 14px", background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)", fontFamily: "var(--mono)", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                  </div>

                  {/* Fila email + revenue */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-tertiary)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 6 }}>Email corporativo *</div>
                      <input type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                        style={{ width: "100%", padding: "12px 14px", background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)", fontFamily: "var(--mono)", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                    </div>
                    <div>
                      <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-tertiary)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 6 }}>Revenue anual</div>
                      <select value={formData.revenue} onChange={e => setFormData(p => ({ ...p, revenue: e.target.value }))}
                        style={{ width: "100%", padding: "12px 14px", background: "var(--bg-base)", border: "1px solid var(--border)", color: formData.revenue ? "var(--text-primary)" : "var(--text-tertiary)", fontFamily: "var(--mono)", fontSize: 12, outline: "none", boxSizing: "border-box" }}>
                        <option value="">Seleccionar...</option>
                        <option value="USD 50M–100M">USD 50M – 100M</option>
                        <option value="USD 100M–500M">USD 100M – 500M</option>
                        <option value="USD 500M+">USD 500M+</option>
                      </select>
                    </div>
                  </div>

                  {/* Iniciativa Oracle */}
                  <div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-tertiary)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 6 }}>Iniciativa Oracle actual o planeada *</div>
                    <input type="text" value={formData.iniciativa} onChange={e => setFormData(p => ({ ...p, iniciativa: e.target.value }))}
                      placeholder="Ej. implementación Fusion Cloud, migración OCI, soporte post go-live..."
                      style={{ width: "100%", padding: "12px 14px", background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)", fontFamily: "var(--mono)", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
                  </div>

                  <div style={{ padding: "12px 16px", background: "var(--bg-base)", border: "1px solid var(--border)", borderLeft: "2px solid var(--accent)", fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-secondary)", lineHeight: 1.7 }}>
                    Respuesta en 3 días hábiles · Proceso bajo NDA mutuo
                  </div>
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <div style={{ fontFamily: "var(--serif)", fontSize: 48, color: "var(--accent)", marginBottom: 16 }}>✓</div>
                <div style={{ fontFamily: "var(--serif)", fontSize: 24, marginBottom: 12 }}>Evaluación <em>registrada exitosamente.</em></div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.8, marginBottom: 24 }}>
                  Tus datos han sido registrados en la consola de Leads.<br />
                  <span style={{ color: "var(--accent)" }}>{formData.email}</span><br />
                  Respuesta en 3 días hábiles · Proceso bajo NDA mutuo.
                </div>
                <button onClick={close} style={{ padding: "12px 24px", background: "transparent", border: "1px solid var(--accent)", color: "var(--accent)", fontFamily: "var(--mono)", fontSize: 10, cursor: "pointer", letterSpacing: "0.2em", textTransform: "uppercase" }}>
                  Cerrar
                </button>
              </div>
            )}
          </div>

          {!submitted && (
            <div style={{ padding: "16px 28px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end", flexDirection: "column", gap: 8 }}>
              {apiError && active === "reference" && (
                <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "#B85450", letterSpacing: "0.05em" }}>{apiError}</span>
              )}
              <button
                disabled={loading}
                onClick={async () => {
                  setApiError("");
                  if (!formData.nombre || !formData.cargo || !formData.empresa || !formData.email || !formData.iniciativa) {
                    setApiError("Completa todos los campos obligatorios.");
                    return;
                  }
                  setLoading(true);
                  try {
                    await api.post("/leads/referencia", {
                      nombre:     formData.nombre,
                      cargo:      formData.cargo,
                      empresa:    formData.empresa,
                      email:      formData.email,
                      revenue:    formData.revenue,
                      iniciativa: formData.iniciativa,
                      iniciativaOracle: formData.iniciativa,
                      tracking:   tracking("S12", "reference"),
                    });
                    setSubmitted(true);
                  } catch (err: unknown) {
                    const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
                    setApiError(msg ?? "Error al enviar. Intenta de nuevo.");
                  } finally {
                    setLoading(false);
                  }
                }}
                style={{ alignSelf: "flex-end", padding: "13px 28px", background: loading ? "rgba(201,169,110,0.5)" : "var(--accent)", color: "var(--bg-base)", border: "none", fontFamily: "var(--mono)", fontSize: 11, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", cursor: loading ? "wait" : "pointer" }}
              >
                {loading ? "Enviando..." : "Iniciar evaluación →"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── DESCARGAR PAPER (I06) ── */}
      {active === "paper" && (
        <div className="im-modal" style={{ background: "var(--bg-panel)", border: "1px solid var(--border-strong)", maxWidth: 680, width: "100%", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative" }}>
            <div style={{ position: "absolute", top: 0, left: 0, width: 2, height: 40, background: "var(--accent)" }} />
            <div style={{ paddingLeft: 16 }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: 6 }}>Investigación FABRIC · Acceso gated</div>
              <div style={{ fontFamily: "var(--serif)", fontSize: 26 }}>Descargar <em style={{ color: "var(--accent)" }}>paper.</em></div>
            </div>
            <button onClick={close} style={{ width: 36, height: 36, border: "1px solid var(--border-strong)", background: "transparent", color: "var(--text-secondary)", fontFamily: "var(--mono)", fontSize: 18, cursor: "pointer" }}>×</button>
          </div>

          {!submitted ? (
            <>
              <div style={{ padding: "24px 28px", flex: 1, overflowY: "auto" }}>
                <p style={{ color: "var(--text-secondary)", fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
                  Ingresa tus datos corporativos para solicitar el paper técnico o la ficha de rescate de proyecto.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-tertiary)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 6 }}>Nombre Completo *</div>
                      <input type="text" value={formData.nombre} onChange={e => setFormData(p => ({ ...p, nombre: e.target.value }))}
                        style={{ width: "100%", padding: "12px 14px", background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)", fontFamily: "var(--mono)", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                    </div>
                    <div>
                      <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-tertiary)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 6 }}>Cargo / Puesto *</div>
                      <input type="text" value={formData.cargo} onChange={e => setFormData(p => ({ ...p, cargo: e.target.value }))}
                        style={{ width: "100%", padding: "12px 14px", background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)", fontFamily: "var(--mono)", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-tertiary)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 6 }}>Empresa *</div>
                      <input type="text" value={formData.empresa} onChange={e => setFormData(p => ({ ...p, empresa: e.target.value }))}
                        style={{ width: "100%", padding: "12px 14px", background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)", fontFamily: "var(--mono)", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                    </div>
                    <div>
                      <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-tertiary)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 6 }}>Email Corporativo *</div>
                      <input type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                        style={{ width: "100%", padding: "12px 14px", background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)", fontFamily: "var(--mono)", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ padding: "16px 28px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                {apiError && (
                  <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "#B85450", letterSpacing: "0.05em" }}>{apiError}</span>
                )}
                <button
                  disabled={loading}
                  onClick={async () => {
                    setApiError("");
                    const pObj = papersList[selectedPaper] || papersList[0];
                    const paperId = pObj?.title ? `${pObj.num} - ${pObj.title}` : (pObj?.paperId || "Paper 01 - Fórmulas Oracle Fusion");
                    if (!paperId) {
                      setApiError("ID de paper no válido.");
                      return;
                    }
                    if (!formData.nombre || !formData.cargo || !formData.empresa || !formData.email) {
                      setApiError("Completa todos los campos.");
                      return;
                    }
                    setLoading(true);
                    try {
                      const res = await api.post("/papers/solicitar", {
                        paperId,
                        nombre:  formData.nombre,
                        cargo:   formData.cargo,
                        empresa: formData.empresa,
                        email:   formData.email,
                        tracking: tracking("S14", "paper"),
                      });
                      if (res.data?.downloadUrl) {
                        setPaperDownloadUrl(`${api.defaults.baseURL || ''}${res.data.downloadUrl}`);
                      }
                      setSubmitted(true);
                    } catch (err: unknown) {
                      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
                      setApiError(msg ?? "Error al enviar. Intenta de nuevo.");
                    } finally {
                      setLoading(false);
                    }
                  }}
                  style={{ marginLeft: "auto", padding: "13px 28px", background: loading ? "rgba(201,169,110,0.5)" : "var(--accent)", color: "var(--bg-base)", border: "none", fontFamily: "var(--mono)", fontSize: 11, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", cursor: loading ? "wait" : "pointer" }}
                >
                  {loading ? "Enviando..." : "Recibir paper →"}
                </button>
              </div>
            </>
          ) : (
            <div style={{ padding: "48px 28px", textAlign: "center" }}>
              <div style={{ fontFamily: "var(--serif)", fontSize: 48, color: "var(--accent)", marginBottom: 16 }}>✓</div>
              <div style={{ fontFamily: "var(--serif)", fontSize: 24, marginBottom: 12 }}>{papersList[selectedPaper]?.num} <em>enviado.</em></div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.7 }}>
                Datos registrados para {formData.email || "tu email"}.<br />PDF disponible para descarga inmediata.
              </div>
              {paperDownloadUrl && (
                <a
                  href={paperDownloadUrl}
                  style={{ display: "inline-block", marginTop: 22, padding: "12px 24px", background: "var(--accent)", color: "var(--bg-base)", textDecoration: "none", fontFamily: "var(--mono)", fontSize: 10, cursor: "pointer", letterSpacing: "0.2em", textTransform: "uppercase" }}
                >
                  Descargar PDF →
                </a>
              )}
              <button onClick={close} style={{ marginTop: 24, padding: "10px 24px", background: "transparent", border: "1px solid var(--accent)", color: "var(--accent)", fontFamily: "var(--mono)", fontSize: 10, cursor: "pointer", letterSpacing: "0.2em", textTransform: "uppercase" }}>Cerrar</button>
            </div>
          )}
        </div>
      )}

      {/* ── BENCHMARK INDEX — early access ── */}
      {active === "benchmark" && (
        <div className="im-modal" style={{ background: "var(--bg-panel)", border: "1px solid var(--border-strong)", maxWidth: 600, width: "100%", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative" }}>
            <div style={{ position: "absolute", top: 0, left: 0, width: 2, height: 40, background: "var(--accent)" }} />
            <div style={{ paddingLeft: 16 }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: 6 }}>FABRIC Benchmark Index · Anual · Q4 2026</div>
              <div style={{ fontFamily: "var(--serif)", fontSize: 26 }}>Early access al <em style={{ color: "var(--accent)" }}>reporte.</em></div>
            </div>
            <button onClick={close} style={{ width: 36, height: 36, border: "1px solid var(--border-strong)", background: "transparent", color: "var(--text-secondary)", fontFamily: "var(--mono)", fontSize: 18, cursor: "pointer" }}>×</button>
          </div>

          <div style={{ padding: "24px 28px", flex: 1 }}>
            <div style={{ padding: "16px 20px", border: "1px solid var(--border)", marginBottom: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 24px" }}>
              {[
                "% de implementaciones Oracle que fallan",
                "Razones más comunes de fracaso",
                "Tiempo promedio de cierre post go-live",
                "Comparativo de consultoras (sin nombrar)",
                "Best practices para CFO/CTO en RFP Oracle",
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 8, fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  <span style={{ color: "var(--accent)", flexShrink: 0 }}>·</span>{item}
                </div>
              ))}
            </div>

            {!submitted ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {(["nombre", "empresa", "email"] as const).map((field) => (
                  <div key={field}>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-tertiary)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 6 }}>
                      {field === "email" ? "Email corporativo" : field}
                    </div>
                    <input
                      type={field === "email" ? "email" : "text"}
                      value={formData[field]}
                      onChange={e => setFormData(p => ({ ...p, [field]: e.target.value }))}
                      style={{ width: "100%", padding: "12px 14px", background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)", fontFamily: "var(--mono)", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                    />
                  </div>
                ))}
                <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-tertiary)", lineHeight: 1.6, marginTop: 4 }}>
                  Reporte gratuito. Acceso gateado por email corporativo — no gmail, hotmail, yahoo.
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <div style={{ fontFamily: "var(--serif)", fontSize: 42, color: "var(--accent)", marginBottom: 12 }}>✓</div>
                <div style={{ fontFamily: "var(--serif)", fontSize: 22, marginBottom: 10 }}>Lugar <em>reservado.</em></div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.7 }}>
                  Recibirás el reporte en {formData.email || "tu email"} al lanzamiento Q4 2026.<br />
                  Solo correos corporativos verificados.
                </div>
              </div>
            )}
          </div>

          {!submitted && (
            <div style={{ padding: "16px 28px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              {apiError && active === "benchmark" && (
                <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "#B85450", letterSpacing: "0.05em" }}>{apiError}</span>
              )}
              <button
                disabled={loading}
                onClick={async () => {
                  setApiError("");
                  if (!formData.nombre || !formData.empresa || !formData.email) {
                    setApiError("Completa todos los campos.");
                    return;
                  }
                  setLoading(true);
                  try {
                    await api.post("/papers/benchmark", {
                      nombre:  formData.nombre,
                      empresa: formData.empresa,
                      email:   formData.email,
                      tracking: tracking("S14", "benchmark"),
                    });
                    setSubmitted(true);
                  } catch (err: unknown) {
                    const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
                    setApiError(msg ?? "Error al registrar. Intenta de nuevo.");
                  } finally {
                    setLoading(false);
                  }
                }}
                style={{ marginLeft: "auto", padding: "13px 28px", background: loading ? "rgba(201,169,110,0.5)" : "var(--accent)", color: "var(--bg-base)", border: "none", fontFamily: "var(--mono)", fontSize: 11, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", cursor: loading ? "wait" : "pointer" }}
              >
                {loading ? "Registrando..." : "Reservar early access →"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── WAIT LIST Q3 2026 ── */}
      {active === "waitlist" && (
        <div className="im-modal" style={{ background: "var(--bg-panel)", border: "1px solid var(--border-strong)", maxWidth: 560, width: "100%", display: "flex", flexDirection: "column" }}>
          {/* Header */}
          <div style={{ padding: "28px 32px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative" }}>
            <div style={{ position: "absolute", top: 0, left: 0, width: 2, height: "100%", background: "linear-gradient(to bottom, var(--accent), transparent)" }} />
            <div style={{ paddingLeft: 20 }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--accent)", letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 10 }}>Wait List · Q3 2026</div>
              <div style={{ fontFamily: "var(--serif)", fontSize: 30, lineHeight: 1.1, fontWeight: 300 }}>
                Reservar lugar <em style={{ color: "var(--accent)" }}>en lista.</em>
              </div>
            </div>
            <button onClick={close} style={{ width: 36, height: 36, border: "1px solid var(--border-strong)", background: "transparent", color: "var(--text-secondary)", fontFamily: "var(--mono)", fontSize: 18, cursor: "pointer", flexShrink: 0 }}>×</button>
          </div>

          <div style={{ padding: "28px 32px", flex: 1 }}>
            {!submitted ? (
              <>
                {/* Contexto editorial */}
                <div style={{ padding: "16px 20px", border: "1px solid var(--border)", background: "var(--bg-base)", marginBottom: 28 }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--accent)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 10 }}>Capacidad · Q3 2026</div>
                  <div style={{ display: "flex", gap: 24 }}>
                    {[
                      { num: "12", lbl: "Slots totales" },
                      { num: "Q3", lbl: "Próxima ventana" },
                      { num: "30 jul", lbl: "Cierre admisión" },
                    ].map((s) => (
                      <div key={s.lbl}>
                        <div style={{ fontFamily: "var(--serif)", fontSize: 28, color: "var(--accent)", fontWeight: 300, lineHeight: 1 }}>{s.num}</div>
                        <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--text-tertiary)", letterSpacing: "0.15em", textTransform: "uppercase", marginTop: 4 }}>{s.lbl}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Nota de selectividad */}
                <div style={{ borderLeft: "2px solid rgba(201,169,110,0.35)", paddingLeft: 16, marginBottom: 28 }}>
                  <p style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.75, margin: 0, fontStyle: "italic" }}>
                    FABRIC mantiene capacidad máxima de 12 proyectos simultáneos. La lista de espera notifica cuando se abre un slot. No hay garantía de admisión — cada proyecto pasa por evaluación.
                  </p>
                </div>

                {/* Formulario */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {([
                    { field: "nombre", label: "Nombre completo", type: "text" },
                    { field: "cargo", label: "Cargo", type: "text" },
                    { field: "empresa", label: "Empresa", type: "text" },
                    { field: "email", label: "Email corporativo", type: "email" },
                  ] as { field: "nombre" | "cargo" | "empresa" | "email"; label: string; type: string }[]).map(({ field, label, type }) => (
                    <div key={field}>
                      <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--text-tertiary)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
                      <input
                        type={type}
                        value={formData[field]}
                        onChange={e => setFormData(p => ({ ...p, [field]: e.target.value }))}
                        placeholder={field === "email" ? "nombre@empresa.com" : ""}
                        style={{ width: "100%", padding: "13px 14px", background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)", fontFamily: "var(--mono)", fontSize: 13, outline: "none", boxSizing: "border-box", transition: "border-color 200ms" }}
                        onFocus={e => { e.currentTarget.style.borderColor = "rgba(201,169,110,0.5)"; }}
                        onBlur={e => { e.currentTarget.style.borderColor = "var(--border)"; }}
                      />
                    </div>
                  ))}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <select value={formData.revenue} onChange={e => setFormData(p => ({ ...p, revenue: e.target.value }))}
                      style={{ width: "100%", padding: "13px 14px", background: "var(--bg-base)", border: "1px solid var(--border)", color: formData.revenue ? "var(--text-primary)" : "var(--text-tertiary)", fontFamily: "var(--mono)", fontSize: 12, outline: "none", boxSizing: "border-box" }}>
                      <option value="">Revenue</option>
                      <option>USD 50M-250M</option>
                      <option>USD 250M-1B</option>
                      <option>Mas de USD 1B</option>
                    </select>
                    <select value={formData.plazo} onChange={e => setFormData(p => ({ ...p, plazo: e.target.value }))}
                      style={{ width: "100%", padding: "13px 14px", background: "var(--bg-base)", border: "1px solid var(--border)", color: formData.plazo ? "var(--text-primary)" : "var(--text-tertiary)", fontFamily: "var(--mono)", fontSize: 12, outline: "none", boxSizing: "border-box" }}>
                      <option value="">Plazo</option>
                      <option>{'<3 meses'}</option>
                      <option>3-6 meses</option>
                      <option>6-12 meses</option>
                    </select>
                  </div>
                  <input
                    value={formData.iniciativa}
                    onChange={e => setFormData(p => ({ ...p, iniciativa: e.target.value }))}
                    placeholder="Iniciativa Oracle / contexto"
                    style={{ width: "100%", padding: "13px 14px", background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)", fontFamily: "var(--mono)", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                  />
                </div>

                {apiError && active === "waitlist" && (
                  <div style={{ marginTop: 14, fontFamily: "var(--mono)", fontSize: 10, color: "#B85450", letterSpacing: "0.05em" }}>{apiError}</div>
                )}
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "32px 0 24px" }}>
                <div style={{ fontFamily: "var(--serif)", fontSize: 52, color: "var(--accent)", fontWeight: 300, lineHeight: 1, marginBottom: 20 }}>I.</div>
                <div style={{ fontFamily: "var(--serif)", fontSize: 26, marginBottom: 12, fontWeight: 300 }}>
                  Lugar <em style={{ color: "var(--accent)" }}>reservado.</em>
                </div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.9, marginBottom: 24 }}>
                  Recibirás notificación en<br />
                  <span style={{ color: "var(--accent)" }}>{formData.email || "tu email"}</span><br />
                  cuando se abra un slot en Q3 2026.
                </div>
                <div style={{ width: 48, height: 1, background: "var(--border)", margin: "0 auto 20px" }} />
                <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-tertiary)", letterSpacing: "0.1em", lineHeight: 1.7 }}>
                  FABRIC valida cada perfil antes de confirmar acceso.<br />Si califica, se envía NDA mutuo.
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: "16px 32px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            {!submitted ? (
              <>
                <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-tertiary)", letterSpacing: "0.05em" }}>
                  No gmail · hotmail · yahoo
                </span>
                <button
                  disabled={loading}
                  onClick={async () => {
                    setApiError("");
                    if (!formData.nombre.trim() || !formData.empresa.trim() || !formData.email.trim()) {
                      setApiError("Completa todos los campos.");
                      return;
                    }
                    setLoading(true);
                    try {
                      await api.post("/leads/waitlist", {
                        nombre:  formData.nombre.trim(),
                        cargo:   formData.cargo.trim(),
                        empresa: formData.empresa.trim(),
                        email:   formData.email.trim(),
                        revenue: formData.revenue.trim(),
                        iniciativa: formData.iniciativa.trim(),
                        plazo:   formData.plazo.trim(),
                        tracking: tracking("S15", "waitlist"),
                      });
                      setSubmitted(true);
                    } catch (err: unknown) {
                      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
                      setApiError(msg ?? "Error al registrar. Intenta de nuevo.");
                    } finally {
                      setLoading(false);
                    }
                  }}
                  style={{ padding: "13px 28px", background: loading ? "rgba(201,169,110,0.5)" : "var(--accent)", color: "var(--bg-base)", border: "none", fontFamily: "var(--mono)", fontSize: 11, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", cursor: loading ? "wait" : "pointer", transition: "background 200ms" }}
                >
                  {loading ? "Registrando..." : "Solicitar lugar →"}
                </button>
              </>
            ) : (
              <button onClick={close} style={{ marginLeft: "auto", padding: "11px 24px", background: "transparent", border: "1px solid var(--accent)", color: "var(--accent)", fontFamily: "var(--mono)", fontSize: 10, cursor: "pointer", letterSpacing: "0.2em", textTransform: "uppercase" }}>
                Cerrar
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── FABRIC OS (I03) — redirige internamente ── */}
      {active === "fabric-os" && (
        <div className="im-modal" style={{ background: "var(--bg-panel)", border: "1px solid var(--border-strong)", maxWidth: 520, width: "100%", padding: "40px 36px" }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: 16 }}>FABRIC OS · Arquitectura completa</div>
          <div style={{ fontFamily: "var(--serif)", fontSize: 30, marginBottom: 16 }}>El manual técnico <em style={{ color: "var(--accent)" }}>completo.</em></div>
          <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
            La página /fabric-os documenta las 4 capas en detalle con stack técnico, catálogo FSO extendido y roadmap de agentes IA. Disponible en Q3 2026.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button onClick={() => setActive("waitlist")} style={{ padding: "12px 24px", background: "var(--accent)", color: "var(--bg-base)", border: "none", fontFamily: "var(--mono)", fontSize: 11, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer" }}>
              Solicitar acceso anticipado →
            </button>
            <button onClick={close} style={{ padding: "12px 20px", background: "transparent", border: "1px solid var(--border-strong)", color: "var(--text-secondary)", fontFamily: "var(--mono)", fontSize: 11, cursor: "pointer", letterSpacing: "0.1em" }}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

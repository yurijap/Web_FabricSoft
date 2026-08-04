import { useEffect, useState, useCallback } from "react";
import { api } from "../config/api";
import { getInteractionTracking } from "../utils/tracking";

type InteractionType = "proof" | "office-hours" | "reference" | "paper" | "waitlist" | "fabric-os" | "benchmark" | "nda-pdf" | null;

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

interface DaySlot { time: string; taken: boolean; }

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
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
const TODAY_ISO = localDateISO();
const NOW_HH_MM = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });

function formatDayLabel(iso: string): string {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('es-MX', { weekday: 'short', day: '2-digit' }).toUpperCase();
}

export default function InteractionManager() {
  const [active, setActive] = useState<InteractionType>(null);
  const [selectedDay, setSelectedDay] = useState<string>(() => getWorkDaysUntilEndOfNextMonth()[0]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedPaper, setSelectedPaper] = useState(0);
  const [papersList, setPapersList] = useState<PaperCatalogItem[]>(FALLBACK_PAPERS);
  const [paperDownloadUrl, setPaperDownloadUrl] = useState("");

  useEffect(() => {
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
  }, []);
  const [formData, setFormData] = useState({ nombre: "", cargo: "", empresa: "", email: "", revenue: "", iniciativa: "", plazo: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const [days] = useState<string[]>(() => getWorkDaysUntilEndOfNextMonth());
  const [weekOffset, setWeekOffset] = useState(0);
  const [slots, setSlots] = useState<DaySlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [monthBooked, setMonthBooked] = useState<Record<string, number>>({}); // "YYYY-MM" → booked count
  const tracking = (sourceSection: string, interactionType: string) => getInteractionTracking(sourceSection, interactionType);

  const MONTHLY_LIMIT = 4;

  const getMonthKey = (dateISO: string) => dateISO.slice(0, 7);

  const isMonthFull = (dateISO: string) => (monthBooked[getMonthKey(dateISO)] ?? 0) >= MONTHLY_LIMIT;

  const fetchSlots = useCallback(async (dateISO: string) => {
    setSlotsLoading(true);
    const monthKey = getMonthKey(dateISO);
    try {
      // Consultar disponibilidad mensual si no la tenemos aún
      if (monthBooked[monthKey] === undefined) {
        const [year, month] = monthKey.split('-');
        const mesRes = await api.get(`/office-hours/disponibilidad/mes?year=${year}&month=${month}`);
        const booked = mesRes.data.booked ?? 0;
        setMonthBooked(prev => ({ ...prev, [monthKey]: booked }));
        if (booked >= MONTHLY_LIMIT) {
          setSlots([]);
          setSlotsLoading(false);
          return;
        }
      } else if ((monthBooked[monthKey] ?? 0) >= MONTHLY_LIMIT) {
        setSlots([]);
        setSlotsLoading(false);
        return;
      }
      const res = await api.get(`/office-hours/disponibilidad/dia?date=${dateISO}`);
      setSlots(res.data.data ?? []);
    } catch {
      setSlots(['09:00','09:30','10:00','10:30','11:00','11:30','14:00','14:30','15:00','16:00']
        .map(time => ({ time, taken: false })));
    } finally {
      setSlotsLoading(false);
    }
  }, [monthBooked]);

  useEffect(() => {
    if (active === 'office-hours' && selectedDay) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchSlots(selectedDay);
    }
  }, [active, selectedDay, fetchSlots]);

  // Cuando selectedDay cambia (ej. click desde el calendario s11), saltar a la semana correcta
  useEffect(() => {
    const idx = days.indexOf(selectedDay);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (idx !== -1) setWeekOffset(Math.floor(idx / 5));
  }, [selectedDay, days]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("[data-interaction]") as HTMLElement | null;
      if (!target) return;
      let type = target.getAttribute("data-interaction") as InteractionType;
      if (!type) return;
      // nda-pdf redirige al modal de proof (mismo flujo de acceso NDA)
      if (type === "nda-pdf") type = "proof";
      e.preventDefault();
      if (type === "office-hours") {
        const clickedDate = target.getAttribute("data-date");
        setSelectedDay(clickedDate || days[0]);
      }
      if (type === "paper") {
        const paperIdx = target.getAttribute("data-paper-index");
        if (paperIdx !== null) {
          const parsedIdx = parseInt(paperIdx, 10);
          if (!isNaN(parsedIdx)) setSelectedPaper(parsedIdx);
        }
      }
      setActive(type);
      setSubmitted(false);
      setSelectedSlot(null);
      setApiError("");
      setLoading(false);
      setPaperDownloadUrl("");
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [days]);

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
        <div className="im-modal" style={{ background: "var(--bg-panel)", border: "1px solid var(--border-strong)", maxWidth: 760, width: "100%", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative" }}>
            <div style={{ position: "absolute", top: 0, left: 0, width: 2, height: 40, background: "var(--accent)" }} />
            <div style={{ paddingLeft: 16 }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: 6 }}>FABRIC Office Hours</div>
              <div style={{ fontFamily: "var(--serif)", fontSize: 26 }}>Reservar <em style={{ color: "var(--accent)" }}>conversación.</em></div>
            </div>
            <button onClick={close} style={{ width: 36, height: 36, border: "1px solid var(--border-strong)", background: "transparent", color: "var(--text-secondary)", fontFamily: "var(--mono)", fontSize: 18, cursor: "pointer" }}>×</button>
          </div>

          <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>
            {/* Left panel */}
            <div style={{ width: 240, borderRight: "1px solid var(--border)", padding: "24px 20px", overflowY: "auto", flexShrink: 0 }}>
              <div style={{ width: 48, height: 48, border: "1px solid var(--accent)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--serif)", fontSize: 24, color: "var(--accent)", fontStyle: "italic", marginBottom: 16 }}>J</div>
              <div style={{ fontFamily: "var(--serif)", fontSize: 18, marginBottom: 4 }}>Julio Álvarez</div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-secondary)", letterSpacing: "0.1em", marginBottom: 20 }}>Founder · FABRIC</div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-tertiary)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 10 }}>30 min · Video call</div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 10 }}>Criterios de acceso</div>
                {["USD 50M+ revenue anual", "CFO / CIO / CTO / Dir. Transformación", "Iniciativa Oracle activa o planeada", "Decisión en menos de 12 meses"].map(c => (
                  <div key={c} style={{ display: "flex", gap: 8, marginBottom: 8, fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.4 }}>
                    <span style={{ color: "var(--accent)", flexShrink: 0 }}>·</span>{c}
                  </div>
                ))}
              </div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-tertiary)", padding: "8px 12px", border: "1px solid var(--border)", letterSpacing: "0.05em", lineHeight: 1.5 }}>
                Confidencial · NDA mutuo al confirmar
              </div>
            </div>

            {/* Right: slot picker */}
            <div className="im-scroll-panel" style={{ flex: 1, padding: "24px 20px", overflowY: "auto", minWidth: 0, minHeight: 0 }}>
              {!selectedSlot ? (
                <>
                  {/* Navegación semanal */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20 }}>
                    <button
                      onClick={() => setWeekOffset(w => Math.max(0, w - 1))}
                      disabled={weekOffset === 0}
                      style={{ padding: "8px 10px", border: "1px solid var(--border)", background: "transparent", fontFamily: "var(--mono)", fontSize: 12, color: weekOffset === 0 ? "var(--text-quaternary)" : "var(--text-secondary)", cursor: weekOffset === 0 ? "default" : "pointer", opacity: weekOffset === 0 ? 0.3 : 1, flexShrink: 0 }}>
                      ←
                    </button>
                    <div style={{ display: "flex", gap: 6, flex: 1 }}>
                      {days.slice(weekOffset * 5, weekOffset * 5 + 5).map((iso) => {
                        const isPast = iso < TODAY_ISO;
                        return (
                          <button
                            key={iso}
                            disabled={isPast}
                            className={`im-day-btn${selectedDay === iso ? " active" : ""}`}
                            onClick={() => !isPast && setSelectedDay(iso)}
                            style={{ flex: 1, padding: "8px 4px", border: "1px solid var(--border)", background: "transparent", fontFamily: "var(--mono)", fontSize: 10, color: isPast ? "var(--text-tertiary)" : selectedDay === iso ? "var(--accent)" : "var(--text-secondary)", cursor: isPast ? "not-allowed" : "pointer", transition: "all 200ms", letterSpacing: "0.08em", textDecoration: isPast ? "line-through" : "none", opacity: isPast ? 0.4 : 1, textAlign: "center" }}>
                            {formatDayLabel(iso)}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => setWeekOffset(w => Math.min(Math.floor((days.length - 1) / 5), w + 1))}
                      disabled={weekOffset >= Math.floor((days.length - 1) / 5)}
                      style={{ padding: "8px 10px", border: "1px solid var(--border)", background: "transparent", fontFamily: "var(--mono)", fontSize: 12, color: weekOffset >= Math.floor((days.length - 1) / 5) ? "var(--text-quaternary)" : "var(--text-secondary)", cursor: weekOffset >= Math.floor((days.length - 1) / 5) ? "default" : "pointer", opacity: weekOffset >= Math.floor((days.length - 1) / 5) ? 0.3 : 1, flexShrink: 0 }}>
                      →
                    </button>
                  </div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-tertiary)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12 }}>
                    {selectedDay ? new Date(selectedDay + 'T12:00:00').toLocaleDateString('es-MX', { month: 'long', year: 'numeric' }).toUpperCase() : ''} · CDMX
                  </div>
                  {slotsLoading ? (
                    <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-tertiary)", letterSpacing: "0.14em", padding: "20px 0" }}>
                      Consultando disponibilidad...
                    </div>
                  ) : isMonthFull(selectedDay) ? (
                    <div style={{ padding: "20px 0 10px" }}>
                      <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 8 }}>
                        Mes completo
                      </div>
                      <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.7, margin: 0 }}>
                        Las 4 sesiones de este mes ya están reservadas.<br />
                        Navega al mes siguiente para ver disponibilidad.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                      {slots.map((slot) => {
                        const isPastSlot = selectedDay === TODAY_ISO && slot.time <= NOW_HH_MM;
                        const disabled = slot.taken || isPastSlot;
                        return (
                          <button key={slot.time} disabled={disabled} onClick={() => setSelectedSlot(slot.time)}
                            className={`im-slot-btn${selectedSlot === slot.time ? " selected" : ""}`}
                            style={{ padding: "12px 8px", border: "1px solid var(--border)", background: "transparent", fontFamily: "var(--mono)", fontSize: 12, color: disabled ? "var(--text-tertiary)" : "var(--text-secondary)", cursor: disabled ? "not-allowed" : "pointer", textDecoration: disabled ? "line-through" : "none", transition: "all 200ms", letterSpacing: "0.05em", opacity: isPastSlot ? 0.35 : 1 }}>
                            {slot.time}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <div>
                  {!submitted ? (
                    <>
                      <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.2em", marginBottom: 16, textTransform: "uppercase" }}>
                        Slot seleccionado · {formatDayLabel(selectedDay)} · {selectedSlot}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {(["nombre", "cargo", "empresa", "email"] as const).map((field) => (
                          <div key={field}>
                            <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-tertiary)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 6 }}>{field === "email" ? "Email corporativo" : field}</div>
                            <input type={field === "email" ? "email" : "text"} value={formData[field]} onChange={e => setFormData(p => ({ ...p, [field]: e.target.value }))}
                              style={{ width: "100%", padding: "12px 14px", background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)", fontFamily: "var(--mono)", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                          </div>
                        ))}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                          <div>
                            <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-tertiary)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 6 }}>Revenue</div>
                            <select value={formData.revenue} onChange={e => setFormData(p => ({ ...p, revenue: e.target.value }))}
                              style={{ width: "100%", padding: "12px 14px", background: "var(--bg-base)", border: "1px solid var(--border)", color: formData.revenue ? "var(--text-primary)" : "var(--text-tertiary)", fontFamily: "var(--mono)", fontSize: 12, outline: "none", boxSizing: "border-box" }}>
                              <option value="">Seleccionar...</option>
                              <option>USD 50M-250M</option>
                              <option>USD 250M-1B</option>
                              <option>Mas de USD 1B</option>
                            </select>
                          </div>
                          <div>
                            <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-tertiary)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 6 }}>Plazo</div>
                            <select value={formData.plazo} onChange={e => setFormData(p => ({ ...p, plazo: e.target.value }))}
                              style={{ width: "100%", padding: "12px 14px", background: "var(--bg-base)", border: "1px solid var(--border)", color: formData.plazo ? "var(--text-primary)" : "var(--text-tertiary)", fontFamily: "var(--mono)", fontSize: 12, outline: "none", boxSizing: "border-box" }}>
                              <option value="">Seleccionar...</option>
                              <option>{'<3 meses'}</option>
                              <option>3-6 meses</option>
                              <option>6-12 meses</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-tertiary)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 6 }}>Iniciativa Oracle</div>
                          <input value={formData.iniciativa} onChange={e => setFormData(p => ({ ...p, iniciativa: e.target.value }))}
                            style={{ width: "100%", padding: "12px 14px", background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)", fontFamily: "var(--mono)", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                        </div>
                        {apiError && active === "office-hours" && (
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
                          style={{ marginTop: 8, padding: "13px", background: loading ? "rgba(201,169,110,0.5)" : "var(--accent)", color: "var(--bg-base)", border: "none", fontFamily: "var(--mono)", fontSize: 11, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", cursor: loading ? "wait" : "pointer" }}
                        >
                          {loading ? "Confirmando..." : "Confirmar reserva →"}
                        </button>
                        <button onClick={() => setSelectedSlot(null)} style={{ padding: "10px", background: "transparent", color: "var(--text-secondary)", border: "1px solid var(--border)", fontFamily: "var(--mono)", fontSize: 10, cursor: "pointer", letterSpacing: "0.1em" }}>
                          ← Cambiar horario
                        </button>
                      </div>
                    </>
                  ) : (
                    <div style={{ textAlign: "center", padding: "32px 0" }}>
                      <div style={{ fontFamily: "var(--serif)", fontSize: 48, color: "var(--accent)", marginBottom: 16 }}>✓</div>
                      <div style={{ fontFamily: "var(--serif)", fontSize: 24, marginBottom: 12 }}>Conversación <em>agendada.</em></div>
                      <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.7 }}>
                        Recibirás confirmación en {formData.email || "tu email"}.<br />
                        Julio revisará tus criterios antes de la llamada.<br />
                        NDA mutuo se enviará 24h antes.
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
            <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-tertiary)", letterSpacing: "0.1em" }}>America/Mexico_City · 4 slots / mes</span>
            <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.1em" }}>Confidencial · NDA</span>
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
            <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>
              Las referencias ejecutivas se facilitan únicamente durante el proceso de evaluación post-admisión. FABRIC valida ajuste antes de facilitar el contacto directo.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

              {/* Fila nombre + cargo */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {(["nombre", "cargo"] as const).map(field => (
                  <div key={field}>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-tertiary)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 6 }}>{field}</div>
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
                <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-tertiary)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 6 }}>Empresa</div>
                <input type="text" value={formData.empresa} onChange={e => setFormData(p => ({ ...p, empresa: e.target.value }))}
                  style={{ width: "100%", padding: "12px 14px", background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)", fontFamily: "var(--mono)", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              </div>

              {/* Fila email + revenue */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-tertiary)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 6 }}>Email corporativo</div>
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
                <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-tertiary)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 6 }}>Iniciativa Oracle actual o planeada</div>
                <input type="text" value={formData.iniciativa} onChange={e => setFormData(p => ({ ...p, iniciativa: e.target.value }))}
                  placeholder="Ej. implementación Fusion Cloud, migración OCI, soporte post go-live..."
                  style={{ width: "100%", padding: "12px 14px", background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)", fontFamily: "var(--mono)", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
              </div>

              <div style={{ padding: "12px 16px", background: "var(--bg-base)", border: "1px solid var(--border)", borderLeft: "2px solid var(--accent)", fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-secondary)", lineHeight: 1.7 }}>
                Respuesta en 3 días hábiles · Proceso bajo NDA mutuo
              </div>
            </div>
          </div>
          <div style={{ padding: "16px 28px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end", flexDirection: "column", gap: 8 }}>
            {!submitted ? (
              <>
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
              </>
            ) : (
              <div style={{ textAlign: "center", width: "100%" }}>
                <div style={{ fontFamily: "var(--serif)", fontSize: 20, marginBottom: 8 }}>Solicitud <em style={{ color: "var(--accent)" }}>recibida.</em></div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-secondary)" }}>Respuesta en 3 días hábiles · Proceso bajo NDA mutuo</div>
                <button onClick={close} style={{ marginTop: 16, padding: "10px 20px", background: "transparent", border: "1px solid var(--accent)", color: "var(--accent)", fontFamily: "var(--mono)", fontSize: 10, cursor: "pointer", letterSpacing: "0.15em", textTransform: "uppercase" }}>Cerrar</button>
              </div>
            )}
          </div>
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
              <div style={{ display: "flex", borderBottom: "1px solid var(--border)" }}>
                {papersList.map((p, i) => (
                  <button key={i} className={`im-paper-tab${selectedPaper === i ? " active" : ""}`} onClick={() => setSelectedPaper(i)}
                    style={{ flex: 1, padding: "12px 8px", background: "transparent", border: "none", borderBottom: selectedPaper === i ? "2px solid var(--accent)" : "2px solid transparent", fontFamily: "var(--mono)", fontSize: 10, color: selectedPaper === i ? "var(--accent)" : "var(--text-tertiary)", cursor: "pointer", letterSpacing: "0.1em", transition: "all 200ms" }}>
                    {p.num}
                  </button>
                ))}
              </div>
              <div style={{ padding: "24px 28px", flex: 1, overflowY: "auto" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 8 }}>{papersList[selectedPaper]?.tag}</div>
                <div style={{ fontFamily: "var(--serif)", fontSize: 22, lineHeight: 1.15, marginBottom: 12 }}>{papersList[selectedPaper]?.title}</div>
                <p style={{ color: "var(--text-secondary)", fontSize: 13, lineHeight: 1.7, marginBottom: 16 }}>{papersList[selectedPaper]?.abstract}</p>
                <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-tertiary)", letterSpacing: "0.1em", marginBottom: 24 }}>{papersList[selectedPaper]?.meta}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {(["nombre", "cargo", "empresa", "email"] as const).map((field) => (
                    <div key={field}>
                      <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-tertiary)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 6 }}>{field === "email" ? "Email corporativo" : field}</div>
                      <input type={field === "email" ? "email" : "text"} value={formData[field]} onChange={e => setFormData(p => ({ ...p, [field]: e.target.value }))}
                        style={{ width: "100%", padding: "11px 14px", background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)", fontFamily: "var(--mono)", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                    </div>
                  ))}
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
                    const paperId = papersList[selectedPaper]?.paperId;
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

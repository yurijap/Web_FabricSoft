import { useEffect, useState } from 'react';
import { useInViewOnce } from '../../../hooks/useInViewOnce';
import { useCapacidad, useMetrica } from '../../../store/FabricContext';
import { countSlots, type AdmissionQuarter, type QuarterStatus, type SlotStatus } from '../../../store/fabricStore';
import { api } from '../../../config/api';

interface ApiSlot {
  id: number;
  status: 'disponible' | 'activo' | 'reservado' | string;
}

const DEFAULT_ADMISSION_QUARTERS: AdmissionQuarter[] = [
  { quarter: 'Q1 2026', status: 'closed',   label: 'Cerrado',  description: '3 proyectos aceptados',      deadline: 'Completo' },
  { quarter: 'Q2 2026', status: 'closed',   label: 'Cerrado',  description: '2 proyectos aceptados',      deadline: 'Completo' },
  { quarter: 'Q3 2026', status: 'open',     label: 'Abierto',  description: 'Evaluando aplicaciones',     deadline: 'Plazo · 30 julio' },
  { quarter: 'Q4 2026', status: 'upcoming', label: 'Próximo',  description: 'Aplicaciones desde 01 sept', deadline: 'Próximo' },
];

function normalizeSlotStatus(status: string): SlotStatus {
  if (status === 'activo' || status === 'reservado') return status;
  return 'libre';
}

function normalizeApiSlots(slots?: ApiSlot[]): SlotStatus[] | null {
  if (!Array.isArray(slots) || slots.length === 0) return null;
  return slots.map(slot => normalizeSlotStatus(slot.status));
}

function normalizeAdmissionQuarters(value: unknown): AdmissionQuarter[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;

  if (typeof value[0] === 'string') {
    return DEFAULT_ADMISSION_QUARTERS;
  }

  return value.map((item, index) => {
    const q = item as Partial<AdmissionQuarter>;
    const fallback = DEFAULT_ADMISSION_QUARTERS[index] ?? DEFAULT_ADMISSION_QUARTERS[DEFAULT_ADMISSION_QUARTERS.length - 1];
    const status = ['closed', 'open', 'upcoming'].includes(String(q.status)) ? q.status as QuarterStatus : fallback.status;

    return {
      quarter: q.quarter ?? fallback.quarter,
      status,
      label: q.label ?? fallback.label,
      description: q.description ?? fallback.description,
      deadline: q.deadline ?? fallback.deadline,
    };
  });
}

function normalizeDeadline(value: unknown, fallback: string) {
  if (typeof value !== 'string') return fallback;
  return Number.isNaN(new Date(value).getTime()) ? fallback : value;
}

function useCountdown(isoDate: string) {
  const calc = () => {
    const diff = new Date(isoDate).getTime() - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    return {
      days:    Math.floor(diff / 86400000),
      hours:   Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
    };
  };
  const [time, setTime] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, [isoDate]);
  return time;
}

function CountdownBanner({ isoDate }: { isoDate: string }) {
  const { days, hours, minutes, seconds } = useCountdown(isoDate);
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    <div className="countdown-banner">
      <span className="countdown-label">Cierre Q3 2026:</span>
      <span className="countdown-time">
        {pad(days)}d {pad(hours)}h {pad(minutes)}m {pad(seconds)}s
      </span>
      <span className="countdown-sub">restantes · 30 julio</span>
    </div>
  );
}

export default function S15Founder() {
  const [ref, isInView] = useInViewOnce<HTMLElement>();

  // Fallback: datos del store (in-memory)
  const { slots: ctxSlots, waitlist, admissionQuarters, deadlineQ3: ctxDeadline } = useCapacidad();
  const metricaSlots    = useMetrica('slots');
  const metricaWaitlist = useMetrica('waitlist');

  // Override desde API cuando esté disponible
  const [apiSlots, setApiSlots]       = useState<SlotStatus[] | null>(null);
  const [apiDeadline, setApiDeadline] = useState<string | null>(null);
  const [apiAdmissionQuarters, setApiAdmissionQuarters] = useState<AdmissionQuarter[] | null>(null);
  const [apiWaitlistCount, setApiWaitlistCount] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      api.get('/capacidad'),
      api.get('/stats'),
    ])
      .then(([capRes, statsRes]) => {
        const d = capRes.data.data;
        const normalizedSlots = normalizeApiSlots(d.slots);
        const normalizedQuarters = normalizeAdmissionQuarters(d.admissionQuarters);
        if (normalizedSlots) setApiSlots(normalizedSlots);
        if (normalizedQuarters) setApiAdmissionQuarters(normalizedQuarters);
        if (d.deadlineQ3) setApiDeadline(normalizeDeadline(d.deadlineQ3, ctxDeadline));

        const waitlistCount = statsRes.data.data?.enListaEspera;
        if (typeof waitlistCount === 'number') setApiWaitlistCount(waitlistCount);
      })
      .catch(() => {});
  }, [ctxDeadline]);

  const slots    = apiSlots ?? ctxSlots;
  const deadlineQ3 = apiDeadline ?? ctxDeadline;
  const quarters = apiAdmissionQuarters ?? admissionQuarters;

  const { activos, reservados } = countSlots(slots);
  const proyectosActivos = apiSlots ? activos : metricaSlots?.value ?? activos;
  const enListaEspera    = apiWaitlistCount ?? metricaWaitlist?.value ?? waitlist.length;

  // Próxima ventana abierta
  const proximaVentana = quarters.find(q => q.status === 'open')?.quarter ?? 'Q3 2026';

  return (
    <section ref={ref} id="s15" className={`demo-section s15 transition-all duration-1000 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
      <div className="container">
        <div className="founder-manifesto">
          <div className="label" style={{ marginBottom: 24 }}>Manifiesto del Fundador</div>
          <blockquote>
            No construimos sitios bonitos.<br />
            Construimos <span className="text-[#C9A96E]">la firma de Oracle Critical Engineering</span><br />
            más seria de México y LATAM.
          </blockquote>
          <cite className="notranslate" translate="no">— Julio Álvarez</cite>
        </div>

        {/* ── Bloque Founder ── */}
        <div className="founder-profile-grid" style={{
          display: "grid",
          gridTemplateColumns: "340px 1fr",
          gap: 80,
          alignItems: "start",
          maxWidth: 1080,
          marginInline: "auto",
          marginBottom: 80,
        }}>

          {/* Foto */}
          <div className="founder-profile-photo" style={{ position: "relative" }}>
            {/* Línea decorativa izquierda */}
            <div style={{
              position: "absolute",
              left: -24,
              top: 0,
              bottom: 0,
              width: 1,
              background: "linear-gradient(to bottom, transparent, var(--accent), transparent)",
              opacity: 0.4,
            }} />
            <img
              src="/julio_alvarez.jpeg"
              alt="Julio Álvarez — Founder FABRIC"
              style={{
                width: "100%",
                aspectRatio: "4/5",
                objectFit: "cover",
                objectPosition: "center top",
                filter: "grayscale(100%) contrast(1.05)",
                display: "block",
              }}
            />
            {/* Caption bajo la foto */}
            <div className="notranslate" translate="no" data-no-translate style={{
              marginTop: 16,
              paddingTop: 16,
              borderTop: "1px solid var(--border)",
              fontFamily: "var(--mono)",
              fontSize: 8,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "var(--text-tertiary)",
              display: "flex",
              justifyContent: "space-between",
            }}>
              <span>Ciudad de México · México</span>
              <span>Founder · 2026</span>
            </div>
          </div>

          {/* Bio */}
          <div className="founder-profile-bio" style={{ paddingTop: 8 }}>
            {/* Eyebrow */}
            <div style={{
              fontFamily: "var(--mono)",
              fontSize: 9,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "var(--accent)",
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}>
              <span style={{ display: "inline-block", width: 24, height: 1, background: "var(--accent)" }} />
              Founder · FABRIC
            </div>

            {/* Nombre */}
            <div style={{
              fontFamily: "var(--serif)",
              fontSize: "clamp(48px, 5vw, 72px)",
              fontWeight: 300,
              color: "var(--text-primary)",
              lineHeight: 1.0,
              letterSpacing: "-0.02em",
              marginBottom: 32,
            }}>
              Julio<br />Álvarez
            </div>

            {/* Bio */}
            <p style={{
              fontFamily: "var(--sans)",
              fontSize: 16,
              color: "var(--text-secondary)",
              lineHeight: 1.85,
              marginBottom: 28,
              maxWidth: 480,
            }}>
              20+ años en arquitectura Oracle, ERP empresarial y transformación de operaciones críticas. Liderando la firma de Oracle Critical Engineering en México con expansión hacia USA.
            </p>

            {/* Nota NDA */}
            <div style={{
              borderLeft: "2px solid var(--accent)",
              paddingLeft: 16,
              marginBottom: 48,
            }}>
              <p style={{
                fontFamily: "var(--sans)",
                fontSize: 13,
                fontStyle: "italic",
                color: "var(--text-tertiary)",
                lineHeight: 1.7,
              }}>
                Equipo senior bajo NDA hasta el primer engagement. Acceso a equipo directo se otorga tras admisión inicial.
              </p>
            </div>

            {/* Credenciales */}
            <div className="founder-profile-credentials" style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              borderTop: "1px solid var(--border)",
            }}>
              {[
                { num: "20+", lbl: "Años Oracle" },
                { num: "100%", lbl: "Senior team" },
                { num: "15+", lbl: "Certificaciones vigentes" },
              ].map((c, i) => (
                <div key={i} className="founder-profile-credential" style={{
                  padding: "28px 0",
                  borderRight: i < 2 ? "1px solid var(--border)" : "none",
                  paddingRight: i < 2 ? 32 : 0,
                  paddingLeft: i > 0 ? 32 : 0,
                }}>
                  <div style={{
                    fontFamily: "var(--serif)",
                    fontSize: 40,
                    fontWeight: 300,
                    color: "var(--accent)",
                    lineHeight: 1,
                    marginBottom: 6,
                  }}>{c.num}</div>
                  <div style={{
                    fontFamily: "var(--mono)",
                    fontSize: 8,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "var(--text-tertiary)",
                  }}>{c.lbl}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="waitlist">
          <CountdownBanner isoDate={deadlineQ3} />

          <div className="waitlist-head">
            <div>
              <div className="label" style={{ marginBottom: 16 }}>Wait List · Q3 2026</div>
              <h3>FABRIC opera con un máximo de <span className="text-[#C9A96E]">12 proyectos simultáneos.</span></h3>
            </div>

            {/* Slots en vivo desde el store */}
            <div className="waitlist-capacity" title={`Capacidad: ${activos} ocupados · ${reservados} reservados · ${12 - activos - reservados} disponible`}>
              {slots.map((s, i) => (
                <span
                  key={i}
                  className={`slot${s === 'activo' ? ' filled' : s === 'reservado' ? ' reserved' : ''}`}
                />
              ))}
            </div>
          </div>

          <p style={{ color: "var(--text-secondary)", fontSize: 16, lineHeight: 1.7, marginBottom: 32, maxWidth: 720 }}>
            Para garantizar entrega en primer ciclo crítico, mantenemos disciplina de capacidad. La selectividad protege la calidad operativa.
          </p>

          {/* Estadísticas en vivo */}
          <div className="waitlist-stats">
            <div className="waitlist-stat">
              <div className="num">{proyectosActivos}</div>
              <div className="lbl">Proyectos activos</div>
            </div>
            <div className="waitlist-stat">
              <div className="num small">{proximaVentana}</div>
              <div className="lbl">Próxima ventana</div>
            </div>
            <div className="waitlist-stat">
              <div className="num">{enListaEspera}</div>
              <div className="lbl">En lista de espera</div>
            </div>
          </div>

          {/* Ciclo de admisión en vivo */}
          <div className="admission">
            <div className="admission-head">Ciclo de Admisión 2026</div>
            {quarters.map(q => (
              <div className="admission-row" key={q.quarter}>
                <span className="admission-q">{q.quarter}</span>
                <span className={`admission-status ${q.status}`}>{q.label}</span>
                <span style={{ color: q.status === 'open' ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                  {q.description}
                </span>
                <span className={`admission-deadline${q.status === 'open' ? ' active' : ''}`}>
                  {q.deadline}
                </span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 40, display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
            <button data-interaction="waitlist" className="btn-primary" style={{ cursor: "pointer" }}>
              Solicitar lugar en lista →
            </button>
            <span className="nda-seal">Aplicación bajo NDA</span>
          </div>
        </div>

      </div>
    </section>
  );
}

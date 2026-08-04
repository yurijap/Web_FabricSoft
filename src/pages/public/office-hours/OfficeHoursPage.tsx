import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import BackButton from '../../../components/BackButton';
import { api } from '../../../config/api';
import { getInteractionTracking } from '../../../utils/tracking';

// ── tipos ──────────────────────────────────────────────────────────────────
type MonthData = Record<string, number>;
interface Slot { time: string; taken: boolean; }

// ── helpers ────────────────────────────────────────────────────────────────
function localDateISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function buildCalendarGrid(year: number, month: number, monthData: MonthData, selectedDay: string | null) {
  const firstDow = new Date(year, month - 1, 1).getDay();
  const offset   = (firstDow + 6) % 7;
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = localDateISO();
  const cells: Array<{ day: number|null; dateStr: string|null; className: string; available: number }> = [];

  for (let i = 0; i < offset; i++) cells.push({ day: null, dateStr: null, className: 'muted', available: 0 });

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dow       = new Date(dateStr + 'T12:00:00').getDay();
    const isWeekend = dow === 0 || dow === 6;
    const isPast    = dateStr <= today;
    const available = monthData[dateStr] ?? 0;
    const isSelected = dateStr === selectedDay;

    let className = 'muted';
    if (!isWeekend && !isPast) {
      if (isSelected)      className = 'slot selected-day';
      else if (available === 0) className = 'active';
      else                      className = `slot${available <= 1 ? ' critical' : ''}`;
    } else if (!isWeekend && isPast) {
      className = 'past';
    }
    cells.push({ day: d, dateStr, className, available: isPast ? 0 : available });
  }

  while (cells.length % 7 !== 0) cells.push({ day: null, dateStr: null, className: 'muted', available: 0 });
  return cells;
}

const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const PUBLIC_DOMAINS = ['gmail','hotmail','yahoo','outlook','icloud','live','msn','me','proton'];

const CRITERIOS = [
  { num: '01', criterio: 'Empresa USD 50M+ de revenue anual' },
  { num: '02', criterio: 'Cargo CFO / CIO / CTO / Director de Transformación' },
  { num: '03', criterio: 'Iniciativa Oracle activa o planeada en los próximos 12 meses' },
  { num: '04', criterio: 'Plazo de decisión menor a 12 meses' },
];

const QUE_ESPERAR = [
  { fase: 'Antes',    descripcion: 'Sintetiza tu situación Oracle actual: módulos en uso, problemática principal, plazo objetivo. La conversación empieza donde tú estás, no desde cero.' },
  { fase: 'Durante',  descripcion: '30 minutos con Julio Álvarez. Sin pitch, sin presentación comercial. Diagnóstico directo, honestidad absoluta. Si FABRIC no es la solución correcta para tu caso, lo dirá.' },
  { fase: 'Después',  descripcion: 'Si hay fit, recibirás una propuesta de evaluación formal. Si no lo hay, saldrás con claridad sobre qué tipo de proveedor necesitas y qué preguntas hacer.' },
];

// ── componente ─────────────────────────────────────────────────────────────
export default function OfficeHoursPage() {
  const now = new Date();

  // Calendario
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [monthData,   setMonthData]   = useState<MonthData>({});
  const [monthFull,   setMonthFull]   = useState(false);
  const [monthBooked, setMonthBooked] = useState(0);
  const [loadingCal,  setLoadingCal]  = useState(false);

  // Selección
  const [selectedDay,  setSelectedDay]  = useState<string | null>(null);
  const [slots,        setSlots]        = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // Formulario
  const [form, setForm] = useState({ nombre: '', cargo: '', empresa: '', email: '', revenue: '', plazo: '', situacion: '' });
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState('');

  const nowYear  = now.getFullYear();
  const nowMonth = now.getMonth() + 1;
  const maxYear  = nowMonth === 12 ? nowYear + 1 : nowYear;
  const maxMonth = nowMonth === 12 ? 1 : nowMonth + 1;
  const isAtMin  = year === nowYear  && month === nowMonth;
  const isAtMax  = year === maxYear  && month === maxMonth;

  // Cargar disponibilidad mensual
  useEffect(() => {
    setLoadingCal(true);
    api.get(`/office-hours/disponibilidad/mes?year=${year}&month=${month}`)
      .then(res => {
        setMonthData(res.data.data ?? {});
        setMonthFull(res.data.monthFull ?? false);
        setMonthBooked(res.data.booked ?? 0);
      })
      .catch(() => { setMonthData({}); setMonthFull(false); setMonthBooked(0); })
      .finally(() => setLoadingCal(false));
  }, [year, month]);

  // Cargar slots del día seleccionado
  useEffect(() => {
    if (!selectedDay) return;
    setSelectedSlot(null);
    setSlots([]);
    setLoadingSlots(true);
    api.get(`/office-hours/disponibilidad/dia?date=${selectedDay}`)
      .then(res => setSlots(res.data.data ?? []))
      .catch(() => setSlots(['09:00','09:30','10:00','10:30','11:00','11:30','14:00','14:30','15:00','16:00'].map(t => ({ time: t, taken: false }))))
      .finally(() => setLoadingSlots(false));
  }, [selectedDay]);

  const handleDayClick = (dateStr: string, available: number) => {
    if (available <= 0) return;
    setSelectedDay(dateStr);
  };

  const prevMonth = () => { if (isAtMin) return; month === 1 ? (setMonth(12), setYear(y => y-1)) : setMonth(m => m-1); };
  const nextMonth = () => { if (isAtMax) return; month === 12 ? (setMonth(1), setYear(y => y+1)) : setMonth(m => m+1); };

  const cells = buildCalendarGrid(year, month, monthData, selectedDay);

  const formatDayLabel = (iso: string) =>
    new Date(iso + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });

  const enviar = async () => {
    setError('');
    if (!form.nombre.trim() || !form.cargo.trim() || !form.empresa.trim() || !form.email.trim() || !form.situacion.trim()) {
      setError('Completa todos los campos.'); return;
    }
    if (!form.email.includes('@')) { setError('Email inválido.'); return; }
    const dominio = form.email.split('@')[1]?.split('.')[0]?.toLowerCase() ?? '';
    if (PUBLIC_DOMAINS.includes(dominio)) { setError('Usa tu correo corporativo.'); return; }

    if (selectedDay && selectedSlot) {
      // Reserva con fecha y hora
      setLoading(true);
      try {
        await api.post('/office-hours/book', {
          nombre: form.nombre, cargo: form.cargo, empresa: form.empresa,
          email: form.email, revenue: form.revenue, plazo: form.plazo,
          iniciativaOracle: form.situacion,
          dia: selectedDay, slot: selectedSlot,
          tracking: getInteractionTracking('office-hours', 'office-hours-page'),
        });
        setSent(true);
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
        setError(msg ?? 'No se pudo registrar. Intenta de nuevo.');
      } finally { setLoading(false); }
    } else {
      // Solicitud sin slot
      setLoading(true);
      try {
        await api.post('/office-hours/solicitar', {
          nombre: form.nombre, cargo: form.cargo, empresa: form.empresa,
          email: form.email, revenue: form.revenue, plazo: form.plazo,
          iniciativaOracle: form.situacion,
          tracking: getInteractionTracking('office-hours', 'office-hours-page'),
        });
        setSent(true);
      } catch {
        setError('No se pudo registrar. Intenta de nuevo.');
      } finally { setLoading(false); }
    }
  };

  const hasSlot = !!(selectedDay && selectedSlot);

  return (
    <div style={{ background: 'var(--bg-base)', paddingTop: 100, minHeight: '100vh' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 56px 0' }}>
        <BackButton />
      </div>

      {/* Header */}
      <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 64 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 56px' }}>
          <div className="label" style={{ marginBottom: 20 }}>FABRIC Office Hours</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 80px', alignItems: 'end' }}>
            <div>
              <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(40px, 5vw, 72px)', fontWeight: 300, color: 'var(--text-primary)', lineHeight: 1.02, marginBottom: 24 }}>
                Conversación directa<br /><em style={{ color: 'var(--accent)', fontStyle: 'italic' }}>con el fundador.</em>
              </h1>
            </div>
            <div>
              <p style={{ fontFamily: 'var(--sans)', fontSize: 17, color: 'var(--text-secondary)', lineHeight: 1.75 }}>
                Una vez al mes, Julio Álvarez recibe cuatro conversaciones de 30 minutos con CFOs y CTOs evaluando iniciativas Oracle. Sin pitch. Sin presentación. Diagnóstico directo.
              </p>
              <div style={{ marginTop: 24, display: 'flex', gap: 24 }}>
                {[['4','Sesiones / mes'],["30'",'Por sesión'],['NDA','Mutuo · Día 1']].map(([val, lbl], i, arr) => (
                  <>
                    <div key={val}>
                      <div style={{ fontFamily: 'var(--serif)', fontSize: 32, color: 'var(--accent)', lineHeight: 1 }}>{val}</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-tertiary)', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 4 }}>{lbl}</div>
                    </div>
                    {i < arr.length - 1 && <div key={`sep-${i}`} style={{ width: 1, background: 'var(--border)' }} />}
                  </>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sección principal: calendario + formulario */}
      <div style={{ borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '64px 56px', display: 'grid', gridTemplateColumns: '1.3fr 0.7fr', gap: '0 64px', alignItems: 'start' }}>

          {/* Izquierda: calendario + slots */}
          <div>
            {sent ? (
              // Confirmación centrada al lado izquierdo tras enviar
              <div style={{ paddingTop: 40 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 24 }}>
                  {hasSlot ? 'Sesión registrada' : 'Solicitud registrada'}
                </div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(28px,4vw,48px)', fontWeight: 300, color: 'var(--text-primary)', lineHeight: 1.1, marginBottom: 20 }}>
                  {hasSlot
                    ? <>{formatDayLabel(selectedDay!)} · <em style={{ color: 'var(--accent)' }}>{selectedSlot}</em></>
                    : <>Tu solicitud está <em style={{ color: 'var(--accent)' }}>en revisión.</em></>}
                </div>
                <p style={{ fontFamily: 'var(--sans)', fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 480 }}>
                  {hasSlot
                    ? 'Recibirás la confirmación y el link de videollamada en tu correo. Julio revisará tu perfil antes de la sesión.'
                    : 'Revisaremos tu perfil y te confirmaremos disponibilidad en 24 horas hábiles.'}
                </p>
                <div style={{ marginTop: 32, display: 'flex', gap: 16 }}>
                  <Link to="/" style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)', letterSpacing: '0.15em', textTransform: 'uppercase', textDecoration: 'none' }}>
                    ← Volver al inicio
                  </Link>
                </div>
              </div>
            ) : (
            <>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 24 }}>
              1 · Selecciona un día disponible
            </div>

            {/* Calendario inline */}
            <div className="calendar">
              <div className="calendar-head">
                <div className="calendar-month" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {MONTH_NAMES[month-1]} · {year}
                  {loadingCal && <span style={{ fontSize: 8, color: 'var(--text-tertiary)' }}>↻</span>}
                </div>
                <div className="calendar-nav">
                  <span style={{ cursor: isAtMin ? 'default' : 'pointer', opacity: isAtMin ? 0.25 : 1 }} onClick={prevMonth}>←</span>
                  <span style={{ cursor: 'pointer' }} onClick={() => { setYear(nowYear); setMonth(nowMonth); }}>Hoy</span>
                  <span style={{ cursor: isAtMax ? 'default' : 'pointer', opacity: isAtMax ? 0.25 : 1 }} onClick={nextMonth}>→</span>
                </div>
              </div>
              <div className="calendar-grid">
                {['L','M','X','J','V','S','D'].map(d => <div className="cal-dow" key={d}>{d}</div>)}
                {cells.map((cell, idx) => (
                  <div
                    key={idx}
                    className={`cal-day ${cell.className}`}
                    style={{ cursor: cell.available > 0 ? 'pointer' : 'default', outline: cell.dateStr && cell.dateStr === selectedDay ? '2px solid var(--accent)' : 'none', outlineOffset: -2 }}
                    onClick={() => cell.dateStr && handleDayClick(cell.dateStr, cell.available)}
                  >
                    {cell.day ?? ''}
                  </div>
                ))}
              </div>
              {monthFull ? (
                <div style={{ marginTop: 14, padding: '10px 14px', border: '1px solid rgba(201,169,110,0.2)', background: 'rgba(201,169,110,0.05)', color: 'var(--text-secondary)', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', lineHeight: 1.7 }}>
                  SESIONES AGOTADAS · {MONTH_NAMES[month-1].toUpperCase()} · Navega al mes siguiente →
                </div>
              ) : (
                <div style={{ marginTop: 12, fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-tertiary)', letterSpacing: '0.12em' }}>
                  {4 - monthBooked} / 4 sesiones disponibles en {MONTH_NAMES[month-1]}
                </div>
              )}
              <div className="calendar-legend">
                <span><span className="legend-swatch available"></span>Slot disponible</span>
                <span><span className="legend-swatch full"></span>Sin slots</span>
              </div>
            </div>

            {/* Selector de hora */}
            {selectedDay && (
              <div style={{ marginTop: 32 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>
                  2 · Elige un horario · <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>{formatDayLabel(selectedDay)}</span>
                </div>
                {loadingSlots ? (
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-tertiary)', letterSpacing: '0.12em' }}>Consultando disponibilidad...</div>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {slots.length === 0 ? (
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-tertiary)' }}>Sin horarios disponibles para este día.</div>
                    ) : slots.map(s => (
                      <button
                        key={s.time}
                        disabled={s.taken}
                        onClick={() => setSelectedSlot(s.taken ? null : s.time)}
                        style={{
                          padding: '10px 16px',
                          border: selectedSlot === s.time ? '1px solid var(--accent)' : '1px solid var(--border)',
                          background: s.taken ? 'transparent' : selectedSlot === s.time ? 'rgba(201,169,110,0.12)' : 'var(--bg-panel)',
                          color: s.taken ? 'var(--text-quaternary)' : selectedSlot === s.time ? 'var(--accent)' : 'var(--text-secondary)',
                          fontFamily: 'var(--mono)', fontSize: 12, letterSpacing: '0.08em',
                          cursor: s.taken ? 'not-allowed' : 'pointer',
                          textDecoration: s.taken ? 'line-through' : 'none',
                          opacity: s.taken ? 0.4 : 1,
                          transition: 'all 150ms',
                        }}
                      >
                        {s.time}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            </>
            )}
          </div>

          {/* Derecha: formulario — oculto tras confirmar */}
          {!sent && <div style={{ position: 'sticky', top: 100, alignSelf: 'start' }}>
            <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-strong)', padding: 32 }}>
              {!sent ? (
                <>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8 }}>
                    3 · Tus datos
                  </div>

                  {/* Resumen de selección */}
                  <div style={{ marginBottom: 20, padding: '10px 14px', background: hasSlot ? 'rgba(201,169,110,0.06)' : 'transparent', border: `1px solid ${hasSlot ? 'rgba(201,169,110,0.3)' : 'var(--border)'}`, fontFamily: 'var(--mono)', fontSize: 10, color: hasSlot ? 'var(--accent)' : 'var(--text-tertiary)', letterSpacing: '0.1em', lineHeight: 1.7 }}>
                    {hasSlot
                      ? `${formatDayLabel(selectedDay!)} · ${selectedSlot}`
                      : selectedDay
                        ? 'Selecciona un horario ←'
                        : 'Selecciona día y hora ←'}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {([
                      ['nombre',   'Nombre completo',  'text'],
                      ['cargo',    'Cargo',             'text'],
                      ['empresa',  'Empresa',           'text'],
                      ['email',    'Email corporativo', 'email'],
                    ] as const).map(([f, label, type]) => (
                      <div key={f}>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-tertiary)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
                        <input
                          type={type}
                          value={form[f]}
                          onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))}
                          style={{ width: '100%', padding: '11px 14px', background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontFamily: 'var(--mono)', fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
                        />
                      </div>
                    ))}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-tertiary)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 6 }}>Revenue</div>
                        <select value={form.revenue} onChange={e => setForm(p => ({ ...p, revenue: e.target.value }))}
                          style={{ width: '100%', padding: '11px 14px', background: 'var(--bg-base)', border: '1px solid var(--border)', color: form.revenue ? 'var(--text-primary)' : 'var(--text-tertiary)', fontFamily: 'var(--mono)', fontSize: 11, outline: 'none', boxSizing: 'border-box' }}>
                          <option value="">Seleccionar</option>
                          <option>USD 50M-250M</option>
                          <option>USD 250M-1B</option>
                          <option>Más de USD 1B</option>
                        </select>
                      </div>
                      <div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-tertiary)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 6 }}>Plazo</div>
                        <select value={form.plazo} onChange={e => setForm(p => ({ ...p, plazo: e.target.value }))}
                          style={{ width: '100%', padding: '11px 14px', background: 'var(--bg-base)', border: '1px solid var(--border)', color: form.plazo ? 'var(--text-primary)' : 'var(--text-tertiary)', fontFamily: 'var(--mono)', fontSize: 11, outline: 'none', boxSizing: 'border-box' }}>
                          <option value="">Seleccionar</option>
                          <option>{'<3 meses'}</option>
                          <option>3-6 meses</option>
                          <option>6-12 meses</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-tertiary)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 6 }}>Situación Oracle (breve)</div>
                      <textarea
                        value={form.situacion}
                        onChange={e => setForm(p => ({ ...p, situacion: e.target.value }))}
                        rows={3}
                        placeholder="Módulos en uso, problemática principal, plazo objetivo..."
                        style={{ width: '100%', padding: '11px 14px', background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontFamily: 'var(--mono)', fontSize: 12, outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
                      />
                    </div>

                    {error && <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#B85450' }}>{error}</div>}

                    <button
                      onClick={enviar}
                      disabled={loading}
                      style={{ marginTop: 4, padding: '13px 18px', background: loading ? 'rgba(201,169,110,0.5)' : 'var(--accent)', color: 'var(--bg-base)', border: 'none', fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: loading ? 'wait' : 'pointer' }}
                    >
                      {loading ? 'Registrando...' : hasSlot ? `Confirmar reserva · ${selectedSlot} →` : 'Solicitar sesión →'}
                    </button>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-tertiary)', letterSpacing: '0.12em', lineHeight: 1.8 }}>
                      {hasSlot ? 'Reserva directa · NDA mutuo desde el inicio' : 'Sin slot seleccionado · Confirmaremos fecha en 24h hábiles'}
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 28, color: 'var(--accent)', marginBottom: 12 }}>
                    {hasSlot ? 'Reserva confirmada.' : 'Solicitud recibida.'}
                  </div>
                  <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                    {hasSlot
                      ? `Tu sesión del ${formatDayLabel(selectedDay!)} a las ${selectedSlot} está registrada. Recibirás confirmación en ${form.email}.`
                      : `Revisaremos tu perfil y confirmaremos disponibilidad en ${form.email} en 24 horas hábiles.`}
                  </p>
                  <div style={{ marginTop: 24 }}>
                    <Link to="/" style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)', letterSpacing: '0.15em', textTransform: 'uppercase', textDecoration: 'none' }}>
                      ← Volver al inicio
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginTop: 24, padding: '20px 24px', border: '1px solid var(--border)', background: 'rgba(201,169,110,0.04)' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--accent)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 10 }}>Confidencialidad</div>
              <p style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.7, margin: 0 }}>
                Todas las conversaciones están cubiertas por NDA mutuo desde el primer contacto. Lo que se discute en la sesión no sale de la sesión.
              </p>
            </div>

            <div style={{ marginTop: 12, padding: '20px 24px', border: '1px solid var(--border)' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-tertiary)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 10 }}>¿Prefieres evaluación formal?</div>
              <Link to="/aplicar" style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)', letterSpacing: '0.12em', textTransform: 'uppercase', textDecoration: 'none' }}>
                Iniciar proceso de admisión →
              </Link>
            </div>
          </div>}
        </div>
      </div>

      {/* Criterios + Qué esperar */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '80px 56px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 80px' }}>
        <div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 32 }}>Criterios de acceso</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {CRITERIOS.map(c => (
              <div key={c.num} style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', padding: '20px 28px', display: 'flex', gap: 20, alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--accent)', letterSpacing: '0.12em', flexShrink: 0 }}>{c.num}</span>
                <span style={{ fontFamily: 'var(--sans)', fontSize: 15, color: 'var(--text-primary)', lineHeight: 1.5 }}>{c.criterio}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-tertiary)', letterSpacing: '0.15em', lineHeight: 1.8 }}>
            Si cumples los criterios, recibirás confirmación y fecha disponible en 24 horas hábiles.
          </div>
        </div>
        <div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 32 }}>Qué esperar</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {QUE_ESPERAR.map(q => (
              <div key={q.fase} style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', padding: '28px 24px' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16 }}>{q.fase}</div>
                <p style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>{q.descripcion}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

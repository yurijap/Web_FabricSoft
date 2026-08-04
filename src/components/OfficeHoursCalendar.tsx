import { useState, useEffect } from 'react';
import { api } from '../config/api';
import { applyOfficeHoursFomoToMonth } from '../utils/officeHoursFomo';
import './office-hours-calendar.css';


type MonthData = Record<string, number>;

function localDateISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function buildCalendarGrid(year: number, month: number, monthData: MonthData) {
  const firstDow = new Date(year, month - 1, 1).getDay();
  const offset = (firstDow + 6) % 7;
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = localDateISO();

  const cells: Array<{ day: number | null; dateStr: string | null; className: string; available: number }> = [];

  for (let i = 0; i < offset; i++) {
    cells.push({ day: null, dateStr: null, className: 'muted', available: 0 });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dow = new Date(dateStr + 'T12:00:00').getDay();
    const isWeekend = dow === 0 || dow === 6;
    const isToday = dateStr === today;
    const isPast = dateStr <= today;
    const available = monthData[dateStr] ?? 0;

    let className = 'muted';
    if (!isWeekend) {
      if (isPast)               className = 'past';
      else if (available === 0) className = isToday ? 'active today' : 'active';
      else                      className = `slot${available <= 1 ? ' critical' : ''}${isToday ? ' today' : ''}`;
    }

    cells.push({ day: d, dateStr, className, available: isPast ? 0 : available });
  }

  while (cells.length % 7 !== 0) {
    cells.push({ day: null, dateStr: null, className: 'muted', available: 0 });
  }

  return cells;
}

const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

interface Props {
  onDayClick?: (dateStr: string) => void;
}

export default function OfficeHoursCalendar({ onDayClick }: Props) {
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [monthData,   setMonthData]   = useState<MonthData>({});
  const [monthFull,   setMonthFull]   = useState(false);
  const [loadingCal,  setLoadingCal]  = useState(false);

  useEffect(() => {
    setLoadingCal(true);
    api.get(`/office-hours/disponibilidad/mes?year=${year}&month=${month}`)
      .then(res => {
        setMonthData(res.data.data ?? {});
        setMonthFull(res.data.monthFull ?? false);
      })
      .catch(() => { setMonthData({}); setMonthFull(false); })
      .finally(() => setLoadingCal(false));
  }, [year, month]);

  const nowYear  = now.getFullYear();
  const nowMonth = now.getMonth() + 1;
  const maxYear  = nowMonth === 12 ? nowYear + 1 : nowYear;
  const maxMonth = nowMonth === 12 ? 1 : nowMonth + 1;
  const isAtMin  = year === nowYear  && month === nowMonth;
  const isAtMax  = year === maxYear  && month === maxMonth;

  const prevMonth = () => {
    if (isAtMin) return;
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (isAtMax) return;
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };
  const goToday = () => { setYear(nowYear); setMonth(nowMonth); };

  const visibleMonthData = applyOfficeHoursFomoToMonth(year, month, monthData);
  const cells = buildCalendarGrid(year, month, visibleMonthData);

  const handleDayClick = (cell: typeof cells[0]) => {
    if (cell.available <= 0 || !cell.dateStr) return;
    if (onDayClick) onDayClick(cell.dateStr);
    // Sin onDayClick: el bubble nativo del click llega al InteractionManager en document
  };

  return (
    <div className="calendar">
      <div className="calendar-head">
        <div className="calendar-month" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {MONTH_NAMES[month - 1]} · {year}
          {loadingCal && <span style={{ fontSize: 8, color: 'var(--text-tertiary)', letterSpacing: '0.1em' }}>↻</span>}
        </div>
        <div className="calendar-nav">
          <span style={{ cursor: isAtMin ? 'default' : 'pointer', opacity: isAtMin ? 0.25 : 1 }} onClick={prevMonth}>←</span>
          <span style={{ cursor: 'pointer' }} onClick={goToday}>Hoy</span>
          <span style={{ cursor: isAtMax ? 'default' : 'pointer', opacity: isAtMax ? 0.25 : 1 }} onClick={nextMonth}>→</span>
        </div>
      </div>

      <div className="calendar-grid">
        {['L','M','X','J','V','S','D'].map(d => (
          <div className="cal-dow" key={d}>{d}</div>
        ))}
        {cells.map((cell, idx) => (
          <div
            key={idx}
            className={`cal-day ${cell.className}`}
            data-interaction={cell.available > 0 ? 'office-hours' : undefined}
            data-date={cell.available > 0 ? cell.dateStr : undefined}
            onClick={() => handleDayClick(cell)}
          >
            {cell.day ?? ''}
          </div>
        ))}
      </div>

      {monthFull ? (
        <div style={{ marginTop: 14, padding: '10px 14px', border: '1px solid rgba(201,169,110,0.2)', background: 'rgba(201,169,110,0.05)', color: 'var(--text-secondary)', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', lineHeight: 1.7 }}>
          SESIONES AGOTADAS · {MONTH_NAMES[month - 1].toUpperCase()} · Navega al mes siguiente →
        </div>
      ) : (
        null
      )}

      <div className="calendar-legend">
        <span><span className="legend-swatch available"></span>Disponible</span>
        <span><span className="legend-swatch full"></span>Sin disponibilidad</span>
      </div>
    </div>
  );
}

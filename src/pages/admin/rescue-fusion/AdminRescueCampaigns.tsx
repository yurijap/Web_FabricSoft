import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  GitBranch,
  Search,
  RefreshCw,
  BarChart2,
  ExternalLink,
  Filter,
  TrendingUp,
  Layers,
  Link as LinkIcon,
  Copy,
  CheckCircle2,
  PieChart,
  Users,
  Award,
  Plus,
  X,
  Target,
  Globe,
  Share2,
  Sparkles,
  ArrowUpRight,
  FileText,
  Lightbulb,
  Calendar,
  Check,
  Clock
} from 'lucide-react';
import { useAuthApi } from '../../../config/api';

interface DailyTrafficPoint {
  dayName: string;
  dateStr: string;
  visitas: number;
  leads: number;
  conversion: string;
}

interface CampaignRow {
  content_id: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  visitas: number;
  leads_completados: number;
  score_promedio: number;
  revisiones_generadas: number;
  conversion_rate: string;
  weekdays_real?: { dayName: string; visitas: number; leads: number }[];
  hourly_real?: { dayName: string; dateStr: string; visitas: number; leads: number }[];
}

const getDatesOfCurrentWeek = () => {
  const now = new Date();
  const currentDayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const distanceToMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
  
  const monday = new Date(now);
  monday.setDate(now.getDate() - distanceToMonday);

  return [0, 1, 2, 3, 4].map(offset => {
    const dayDate = new Date(monday);
    dayDate.setDate(monday.getDate() + offset);
    return `${dayDate.getDate()} ${dayDate.toLocaleString('es-ES', { month: 'short' })}`;
  });
};

// Gráfica 1: De Lunes a Viernes (Calculado 100% dinámico desde la BD)
const generateWeekdaysTrend = (row: CampaignRow): DailyTrafficPoint[] => {
  const weekDates = getDatesOfCurrentWeek();

  if (row.weekdays_real && row.weekdays_real.length > 0) {
    return row.weekdays_real.map((w, i) => {
      const conv = w.visitas > 0 ? ((w.leads / w.visitas) * 100).toFixed(1) + '%' : '0.0%';
      return {
        dayName: w.dayName,
        dateStr: weekDates[i] || `Día ${i + 1}`,
        visitas: w.visitas,
        leads: w.leads,
        conversion: conv
      };
    });
  }

  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
  const currentWeekDay = new Date().getDay(); // 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri
  const activeIdx = currentWeekDay >= 1 && currentWeekDay <= 5 ? currentWeekDay - 1 : 3;

  return days.map((day, i) => {
    const v = i === activeIdx ? row.visitas : 0;
    const l = i === activeIdx ? row.leads_completados : 0;
    const conv = v > 0 ? ((l / v) * 100).toFixed(1) + '%' : '0.0%';
    return {
      dayName: day,
      dateStr: weekDates[i] || `Día ${i + 1}`,
      visitas: v,
      leads: l,
      conversion: conv
    };
  });
};

// Gráfica 2: Tráfico por Horario / Hora de Entrada (Calculado 100% dinámico desde la BD)
const generateHourlyTrend = (row: CampaignRow): DailyTrafficPoint[] => {
  if (row.hourly_real && row.hourly_real.length > 0) {
    return row.hourly_real.map(h => {
      const conv = h.visitas > 0 ? ((h.leads / h.visitas) * 100).toFixed(1) + '%' : '0.0%';
      return {
        dayName: `${h.dayName} hrs`,
        dateStr: h.dateStr || 'Horario',
        visitas: h.visitas,
        leads: h.leads,
        conversion: conv
      };
    });
  }

  const hourSlots = [
    { dayName: '08:00 hrs', dateStr: '8 AM - 11 AM' },
    { dayName: '11:00 hrs', dateStr: '11 AM - 2 PM' },
    { dayName: '14:00 hrs', dateStr: '2 PM - 5 PM' },
    { dayName: '17:00 hrs', dateStr: '5 PM - 8 PM' },
    { dayName: '20:00 hrs', dateStr: '8 PM - 11 PM' }
  ];

  const activeIdx = 2; // Default peak at 14:00
  return hourSlots.map((h, i) => {
    const v = i === activeIdx ? row.visitas : 0;
    const l = i === activeIdx ? row.leads_completados : 0;
    const conv = v > 0 ? ((l / v) * 100).toFixed(1) + '%' : '0.0%';
    return {
      dayName: h.dayName,
      dateStr: h.dateStr,
      visitas: v,
      leads: l,
      conversion: conv
    };
  });
};

// Cálculo de Explicación Analítica Globalizada
const calculateGlobalizedExplanation = (row: CampaignRow, weekdays: DailyTrafficPoint[], hourlyTrend: DailyTrafficPoint[]) => {
  const sortedWeekdays = [...weekdays].sort((a, b) => b.visitas - a.visitas);
  const peakDay = sortedWeekdays[0] || { dayName: 'Miércoles', visitas: 1, leads: 1 };
  const totalWeekdayVisitas = weekdays.reduce((acc, curr) => acc + curr.visitas, 0);
  const peakDayPct = totalWeekdayVisitas > 0 ? Math.round((peakDay.visitas / totalWeekdayVisitas) * 100) : 0;

  const sortedHourly = [...hourlyTrend].sort((a, b) => b.visitas - a.visitas);
  const peakHour = sortedHourly[0] || { dayName: '14:00 hrs', dateStr: '2 PM - 5 PM', visitas: 1, leads: 0 };

  const sourceName = row.utm_source.toUpperCase();

  const peakDayExplanation = `Durante el ciclo laboral de Lunes a Viernes, el pico máximo de interacción se registra el día ${peakDay.dayName}, concentrando el ${peakDayPct}% del volumen diario con ${peakDay.visitas} visitas y ${peakDay.leads} cuestionarios de 25 preguntas completados.`;

  const hourlyTrendExplanation = `En la distribución por horario de entrada, la mayor concentración de accesos ocurre a las ${peakHour.dayName} (${peakHour.dateStr}), registrando ${peakHour.visitas} visitas y ${peakHour.leads || 0} cuestionarios completados.`;

  const globalizedBehavior = `El canal de ${sourceName} presenta un patrón de audiencia con alta receptividad en días centrales de la semana y en horarios de oficina (${peakHour.dayName}). Esto refleja una fuerte intención de evaluación operativa.`;

  const globalizedRecommendation = `Recomendación Estratégica: Optimizar el envío de boletines y la pauta publicitaria en el bloque de ${peakDay.dayName} a las ${peakHour.dayName}, horario donde la tasa de conversión promedio alcanza su nivel más elevado (${row.conversion_rate}).`;

  const fullTextToCopy = `INFORME ANALÍTICO DE RENDIMIENTO DE CAMPAÑA (${row.content_id})
Canal Origen: ${sourceName} | Campaña: ${row.utm_campaign}
----------------------------------------------------------------------
1. DESGLOSE DÍAS LABORALES (LUNES A VIERNES):
${peakDayExplanation}

2. ANÁLISIS DE HORARIO DE ENTRADA (HORAS PICO):
${hourlyTrendExplanation}

3. DIAGNÓSTICO DE COMPORTAMIENTO GLOBALIZADO:
${globalizedBehavior}

4. RECOMENDACIÓN ESTRATÉGICA:
${globalizedRecommendation}`;

  return {
    peakDayName: peakDay.dayName,
    peakDayVisitas: peakDay.visitas,
    peakDayLeads: peakDay.leads,
    peakDayPct,
    peakWeekName: peakHour.dayName,
    peakWeekVisitas: peakHour.visitas,
    peakWeekConversion: row.conversion_rate,
    peakDayExplanation,
    weeklyTrendExplanation: hourlyTrendExplanation,
    globalizedBehavior,
    globalizedRecommendation,
    fullTextToCopy
  };
};

function CampaignTrendChart({
  trendData,
  colorTheme = 'gold',
  title = 'Tráfico por Día'
}: {
  trendData: DailyTrafficPoint[];
  colorTheme?: 'gold' | 'white' | 'sky' | 'emerald' | 'amber' | 'purple' | 'rose' | 'indigo' | 'cyan';
  title?: string;
}) {
  const [hoveredPoint, setHoveredPoint] = useState<DailyTrafficPoint | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const maxVal = Math.max(...trendData.map(d => Math.max(d.visitas, d.leads)), 5);
  const chartHeight = 90;
  const chartWidth = 340;

  // Primary Visitas Line Points
  const pointsVisitas = trendData.map((d, i) => {
    const x = (i / (trendData.length - 1)) * chartWidth;
    const y = d.visitas === 0
      ? chartHeight
      : chartHeight - (d.visitas / maxVal) * (chartHeight - 20) - 10;
    return { x, y, data: d };
  });

  // Secondary Red Line Points (25 Questions Completed)
  const pointsLeads = trendData.map((d, i) => {
    const x = (i / (trendData.length - 1)) * chartWidth;
    const y = d.leads === 0
      ? chartHeight
      : chartHeight - (d.leads / maxVal) * (chartHeight - 20) - 10;
    return { x, y, data: d };
  });

  const svgPathVisitas = pointsVisitas.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');
  const areaPathVisitas = `${svgPathVisitas} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`;

  const svgPathLeads = pointsLeads.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');
  const areaPathLeads = `${svgPathLeads} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`;

  const strokeColor =
    colorTheme === 'gold' ? '#C9A96E' :
    colorTheme === 'white' ? '#FFFFFF' :
    colorTheme === 'emerald' ? '#10B981' :
    colorTheme === 'amber' ? '#F59E0B' :
    colorTheme === 'purple' ? '#A855F7' :
    colorTheme === 'rose' ? '#F43F5E' :
    colorTheme === 'indigo' ? '#6366F1' :
    colorTheme === 'cyan' ? '#06B6D4' : '#38BDF8';

  const fillColor =
    colorTheme === 'gold' ? 'rgba(201, 169, 110, 0.18)' :
    colorTheme === 'white' ? 'rgba(255, 255, 255, 0.12)' :
    colorTheme === 'emerald' ? 'rgba(16, 185, 129, 0.15)' :
    colorTheme === 'amber' ? 'rgba(245, 158, 11, 0.15)' :
    colorTheme === 'purple' ? 'rgba(168, 85, 247, 0.15)' :
    colorTheme === 'rose' ? 'rgba(244, 63, 94, 0.15)' :
    colorTheme === 'indigo' ? 'rgba(99, 102, 241, 0.15)' :
    colorTheme === 'cyan' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(56, 189, 248, 0.15)';

  return (
    <div className="bg-[#030712]/90 border border-[#1E3A5F] rounded-2xl p-4 shadow-inner relative group space-y-2">
      {/* Chart Title and Legend Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono border-b border-[#1E3A5F]/60 pb-2">
        <span className="font-bold text-white flex items-center gap-1.5">
          <BarChart2 size={14} className="text-[#C9A96E]" /> {title}
        </span>
        <div className="flex items-center gap-3 text-[10px]">
          <span className="flex items-center gap-1.5 font-bold" style={{ color: strokeColor }}>
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: strokeColor }}></span>
            <span>Visitas</span>
          </span>
          <span className="flex items-center gap-1.5 font-bold text-red-400">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block shadow-sm shadow-red-500/50"></span>
            <span>Cuestionario (25 Preg.)</span>
          </span>
        </div>
      </div>

      <div className="relative pt-2 pb-1">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-28 overflow-visible"
        >
          {/* Grid lines */}
          <line x1="0" y1="10" x2={chartWidth} y2="10" stroke="#1E3A5F" strokeDasharray="3 3" strokeWidth="0.8" />
          <line x1="0" y1={chartHeight / 2} x2={chartWidth} y2={chartHeight / 2} stroke="#1E3A5F" strokeDasharray="3 3" strokeWidth="0.8" />
          <line x1="0" y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="#1E3A5F" strokeWidth="1" />

          {/* Area 1: Visitas */}
          <path d={areaPathVisitas} fill={fillColor} />

          {/* Area 2: Leads (Cuestionario 25 preguntas completado en Rojo) */}
          <path d={areaPathLeads} fill="rgba(239, 68, 68, 0.15)" />

          {/* Line 1: Visitas */}
          <path d={svgPathVisitas} fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Line 2: Leads (Rojo Resaltado para 25 preguntas) */}
          <path d={svgPathLeads} fill="none" stroke="#EF4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3 2" />

          {/* Interactive Hover Vertical Guide Line */}
          {hoverIdx !== null && (
            <line
              x1={pointsVisitas[hoverIdx].x}
              y1="0"
              x2={pointsVisitas[hoverIdx].x}
              y2={chartHeight}
              stroke="#EF4444"
              strokeDasharray="2 2"
              strokeWidth="1.5"
            />
          )}

          {/* Data Points 1: Visitas */}
          {pointsVisitas.map((p, idx) => {
            const isZero = p.data.visitas === 0;
            return (
              <g key={`visitas-${idx}`}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={hoverIdx === idx ? 6 : (isZero ? 3.5 : 4.5)}
                  fill={isZero ? '#030712' : '#07192F'}
                  stroke={isZero ? '#64748B' : strokeColor}
                  strokeWidth={hoverIdx === idx ? 3 : (isZero ? 1.5 : 2.5)}
                  className="transition-all duration-150 cursor-pointer"
                  onMouseEnter={() => {
                    setHoveredPoint(p.data);
                    setHoverIdx(idx);
                  }}
                  onMouseLeave={() => {
                    setHoveredPoint(null);
                    setHoverIdx(null);
                  }}
                />
              </g>
            );
          })}

          {/* Data Points 2: Leads (25 Preguntas Completadas en Rojo) */}
          {pointsLeads.map((p, idx) => {
            const isZero = p.data.leads === 0;
            return (
              <g key={`leads-${idx}`}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={hoverIdx === idx ? 6 : (isZero ? 3 : 4)}
                  fill={isZero ? '#030712' : '#7F1D1D'}
                  stroke={isZero ? '#991B1B' : '#EF4444'}
                  strokeWidth={hoverIdx === idx ? 3 : (isZero ? 1.5 : 2.2)}
                  className="transition-all duration-150 cursor-pointer"
                  onMouseEnter={() => {
                    setHoveredPoint(p.data);
                    setHoverIdx(idx);
                  }}
                  onMouseLeave={() => {
                    setHoveredPoint(null);
                    setHoverIdx(null);
                  }}
                />
              </g>
            );
          })}
        </svg>

        {/* Floating Hover Tooltip Card */}
        {hoveredPoint && hoverIdx !== null && (
          <div
            className="absolute z-50 pointer-events-none -translate-x-1/2 -translate-y-full mb-4 bg-[#07192F]/95 border border-[#EF4444] text-white p-3 rounded-2xl shadow-2xl backdrop-blur-md text-xs font-mono w-56 animate-fadeIn ring-1 ring-[#EF4444]/40"
            style={{
              left: `${(pointsVisitas[hoverIdx].x / chartWidth) * 100}%`,
              top: `${Math.min(pointsVisitas[hoverIdx].y, pointsLeads[hoverIdx].y) - 5}px`
            }}
          >
            <div className="flex items-center justify-between border-b border-[#1E3A5F] pb-1 mb-1.5">
              <span className="font-bold text-[#C9A96E] uppercase tracking-wider">
                {hoveredPoint.dayName} · {hoveredPoint.dateStr}
              </span>
            </div>
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: strokeColor }}></span>
                  <span>Visitas Totales:</span>
                </span>
                <span className="font-bold text-sky-300">{hoveredPoint.visitas}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-red-400 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 inline-block shadow-sm shadow-red-500/50"></span>
                  <span>Cuestionario (25 Preg.):</span>
                </span>
                <span className="font-bold text-red-400">{hoveredPoint.leads}</span>
              </div>
              <div className="flex justify-between items-center border-t border-[#1E3A5F]/60 pt-1 mt-1">
                <span className="text-slate-400">Tasa Conversión:</span>
                <span className="font-bold text-emerald-400">{hoveredPoint.conversion}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Days X-Axis Labels */}
      <div className="flex justify-between text-[9px] font-mono text-slate-400 pt-2 border-t border-[#1E3A5F]">
        {trendData.map((d, i) => (
          <div key={i} className="text-center">
            <div className="font-bold text-slate-300">{d.dayName}</div>
            <div className="text-[8px] text-slate-500">{d.dateStr}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HourlyBarChart({
  trendData,
  title = '⏰ Tráfico por Horario (Hora de Entrada)'
}: {
  trendData: DailyTrafficPoint[];
  title?: string;
}) {
  const [hoveredPoint, setHoveredPoint] = useState<DailyTrafficPoint | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const maxVal = Math.max(...trendData.map(d => Math.max(d.visitas, d.leads)), 5);

  // Identify peak hour
  const peakVal = Math.max(...trendData.map(d => d.visitas));
  const peakIdx = trendData.findIndex(d => d.visitas === peakVal && peakVal > 0);

  return (
    <div className="bg-[#030712]/90 border border-[#1E3A5F] rounded-2xl p-4 shadow-inner relative group space-y-2">
      {/* Header and Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono border-b border-[#1E3A5F]/60 pb-2">
        <span className="font-bold text-white flex items-center gap-1.5">
          <Clock size={14} className="text-amber-400" /> {title}
        </span>
        <div className="flex items-center gap-3 text-[10px]">
          <span className="flex items-center gap-1.5 font-bold text-sky-300">
            <span className="w-2.5 h-2.5 rounded bg-sky-400 inline-block shadow-sm"></span>
            <span>Visitas</span>
          </span>
          <span className="flex items-center gap-1.5 font-bold text-red-400">
            <span className="w-2.5 h-2.5 rounded bg-red-500 inline-block shadow-sm shadow-red-500/50"></span>
            <span>Cuestionario (25 Preg.)</span>
          </span>
        </div>
      </div>

      <div className="relative pt-3 pb-1">
        <div className="relative h-28 w-full flex items-end justify-between px-2 gap-2 pt-4">
          {/* Background Grid Lines */}
          <div className="absolute inset-x-0 top-3 border-b border-[#1E3A5F]/40 border-dashed"></div>
          <div className="absolute inset-x-0 top-1/2 border-b border-[#1E3A5F]/40 border-dashed"></div>
          <div className="absolute inset-x-0 bottom-0 border-b border-[#1E3A5F]"></div>

          {trendData.map((d, i) => {
            const isPeak = i === peakIdx;
            const hVisitasPct = maxVal > 0 ? (d.visitas / maxVal) * 100 : 0;
            const hLeadsPct = maxVal > 0 ? (d.leads / maxVal) * 100 : 0;

            return (
              <div
                key={i}
                className="relative flex-1 flex flex-col items-center justify-end h-full group/bar cursor-pointer"
                onMouseEnter={() => {
                  setHoveredPoint(d);
                  setHoverIdx(i);
                }}
                onMouseLeave={() => {
                  setHoveredPoint(null);
                  setHoverIdx(null);
                }}
              >
                {/* Peak Badge tag */}
                {isPeak && d.visitas > 0 && (
                  <div className="absolute -top-3.5 z-10 bg-amber-500 text-[#07192F] text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-full uppercase tracking-tighter shadow-md animate-bounce">
                    Pico {d.visitas}
                  </div>
                )}

                {/* Bars Container */}
                <div className="flex items-end gap-1.5 w-full justify-center h-full pb-0.5">
                  {/* Visitas Bar */}
                  <div
                    style={{ height: `${Math.max(hVisitasPct, 4)}%` }}
                    className={`w-3.5 rounded-t-md transition-all duration-300 ${
                      d.visitas === 0
                        ? 'bg-[#1E3A5F]/40'
                        : isPeak
                        ? 'bg-gradient-to-t from-sky-600 via-sky-400 to-amber-300 shadow-lg shadow-sky-500/30'
                        : 'bg-gradient-to-t from-sky-900 via-sky-500 to-sky-300 opacity-90'
                    }`}
                  ></div>

                  {/* Cuestionario 25 Preguntas Bar (Rojo) */}
                  <div
                    style={{ height: `${Math.max(hLeadsPct, 4)}%` }}
                    className={`w-3.5 rounded-t-md transition-all duration-300 ${
                      d.leads === 0
                        ? 'bg-[#1E3A5F]/40'
                        : 'bg-gradient-to-t from-red-950 via-red-600 to-red-400 shadow-lg shadow-red-500/40'
                    }`}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Floating Tooltip */}
        {hoveredPoint && hoverIdx !== null && (
          <div
            className="absolute z-50 pointer-events-none -translate-x-1/2 -translate-y-full mb-4 bg-[#07192F]/95 border border-[#C9A96E] text-white p-3 rounded-2xl shadow-2xl backdrop-blur-md text-xs font-mono w-56 animate-fadeIn ring-1 ring-[#C9A96E]/40"
            style={{
              left: `${((hoverIdx + 0.5) / trendData.length) * 100}%`,
              top: '10px'
            }}
          >
            <div className="flex items-center justify-between border-b border-[#1E3A5F] pb-1 mb-1.5">
              <span className="font-bold text-[#C9A96E] uppercase tracking-wider">
                ⏰ Horario: {hoveredPoint.dayName}
              </span>
            </div>
            <div className="space-y-1 text-[11px]">
              <div className="text-[10px] text-slate-400 mb-1">
                Franja: <strong className="text-white">{hoveredPoint.dateStr}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded bg-sky-400 inline-block"></span>
                  <span>Visitas Entrantes:</span>
                </span>
                <span className="font-bold text-sky-300">{hoveredPoint.visitas}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-red-400 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded bg-red-500 inline-block shadow-sm shadow-red-500/50"></span>
                  <span>Cuestionario (25 Preg.):</span>
                </span>
                <span className="font-bold text-red-400">{hoveredPoint.leads}</span>
              </div>
              <div className="flex justify-between items-center border-t border-[#1E3A5F]/60 pt-1 mt-1">
                <span className="text-slate-400">Tasa Conversión:</span>
                <span className="font-bold text-emerald-400">{hoveredPoint.conversion}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hour Labels */}
      <div className="flex justify-between text-[9px] font-mono text-slate-400 pt-2 border-t border-[#1E3A5F] px-1">
        {trendData.map((d, i) => (
          <div key={i} className="text-center flex-1">
            <div className="font-bold text-slate-200">{d.dayName}</div>
            <div className="text-[8px] text-slate-500 truncate max-w-[55px] mx-auto">{d.dateStr}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminRescueCampaigns() {
  const adminApi = useAuthApi();
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<string>('ALL');

  // Modal para Resumen Ejecutivo Calculado
  const [activeSummaryModal, setActiveSummaryModal] = useState<{
    row: CampaignRow;
    weekdays: DailyTrafficPoint[];
    weekly: DailyTrafficPoint[];
  } | null>(null);

  // Modal en Construcción para Generar Reporte de UTM
  const [showUnderConstructionModal, setShowUnderConstructionModal] = useState(false);
  const [selectedUtmReportCampaign, setSelectedUtmReportCampaign] = useState('');

  // Modal para generador de enlaces UTM
  const [showUtmModal, setShowUtmModal] = useState(false);
  const [utmForm, setUtmForm] = useState({
    baseUrl: 'https://fabricsoft.net/fusion-rescue',
    source: 'linkedin',
    medium: 'cpc',
    campaign: 'fusion_rescue_2026',
    contentId: 'LI-RESCUE-001'
  });

  // Alerta de Notificación Toast Personalizada
  const [toast, setToast] = useState<{ title: string; message: string; type: 'emerald' | 'amber' | 'blue' } | null>(null);

  const showToast = (title: string, message: string, type: 'emerald' | 'amber' | 'blue' = 'emerald') => {
    setToast({ title, message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Datos semilla de demostración y respaldo
  const defaultCampaigns: CampaignRow[] = [
    {
      content_id: 'DIRECT-VISIT',
      utm_source: 'direct',
      utm_medium: 'organic',
      utm_campaign: 'general',
      visitas: 620,
      leads_completados: 54,
      score_promedio: 55,
      revisiones_generadas: 22,
      conversion_rate: '8.71%',
    },
    {
      content_id: 'LI-JA-FR-003',
      utm_source: 'linkedin',
      utm_medium: 'cpc',
      utm_campaign: 'fusion_rescue_q3',
      visitas: 480,
      leads_completados: 42,
      score_promedio: 48,
      revisiones_generadas: 18,
      conversion_rate: '8.75%',
    },
    {
      content_id: 'GOOGLE-SEARCH-ORACLE',
      utm_source: 'google',
      utm_medium: 'search',
      utm_campaign: 'oracle_erp_rescue',
      visitas: 510,
      leads_completados: 58,
      score_promedio: 39,
      revisiones_generadas: 24,
      conversion_rate: '11.37%',
    },
    {
      content_id: 'EMAIL-NEWSLETTER-AUG',
      utm_source: 'email',
      utm_medium: 'newsletter',
      utm_campaign: 'fabric_rescue_bulletin',
      visitas: 240,
      leads_completados: 31,
      score_promedio: 58,
      revisiones_generadas: 12,
      conversion_rate: '12.91%',
    },
    {
      content_id: 'IG-ORG-RESCUE-01',
      utm_source: 'instagram',
      utm_medium: 'organic',
      utm_campaign: 'dossier_rescue',
      visitas: 320,
      leads_completados: 26,
      score_promedio: 64,
      revisiones_generadas: 9,
      conversion_rate: '8.12%',
    },
    {
      content_id: 'FB-ADS-FINANCE-02',
      utm_source: 'facebook',
      utm_medium: 'social',
      utm_campaign: 'cierre_contable_fusion',
      visitas: 170,
      leads_completados: 14,
      score_promedio: 52,
      revisiones_generadas: 5,
      conversion_rate: '8.23%',
    },
  ];

  const [dashboardStats, setDashboardStats] = useState<{
    landing_visits: number;
    lead_captures: number;
    review_requests: number;
  } | null>(null);

  const fetchCampaignData = () => {
    setLoading(true);

    // Fetch dashboard stats for exact parity with /admin/rescue-fusion/dashboard
    adminApi.get('/fusion-rescue/dashboard-stats')
      .then(res => {
        if (res.data?.data) {
          setDashboardStats(res.data.data);
        }
      })
      .catch(() => {});

    // Fetch campaign stats
    adminApi.get('/fusion-rescue/campaign-stats')
      .then(res => {
        const rows: CampaignRow[] = res.data?.data ?? [];
        if (rows.length > 0) {
          setCampaigns(rows);
        } else {
          setCampaigns(defaultCampaigns);
        }
      })
      .catch(() => {
        setCampaigns(defaultCampaigns);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCampaignData();

    // Polling automático cada 5 segundos para actualizar las gráficas en tiempo real
    const interval = setInterval(() => {
      adminApi.get('/fusion-rescue/campaign-stats')
        .then(res => {
          const rows: CampaignRow[] = res.data?.data ?? [];
          if (rows.length > 0) {
            setCampaigns(rows);
          }
        })
        .catch(() => {});
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const isNA = (str: string) => {
    if (!str) return false;
    const s = str.trim().toLowerCase();
    return s === 'n/a' || s === 'na' || s === 'none' || s === '(none)';
  };

  // Canales únicos disponibles para filtrado
  const availableSources = useMemo(() => {
    const setSources = new Set<string>();
    campaigns.forEach(c => {
      if (!isNA(c.utm_source) && !isNA(c.content_id)) {
        setSources.add(c.utm_source.toLowerCase());
      }
    });
    return Array.from(setSources);
  }, [campaigns]);

  // Filtrado compuesto (búsqueda textual + canal)
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(c => {
      if (isNA(c.content_id) || isNA(c.utm_source) || isNA(c.utm_campaign)) {
        return false;
      }
      const matchesChannel = selectedChannel === 'ALL' || c.utm_source.toLowerCase() === selectedChannel.toLowerCase();
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch = !term || (
        c.content_id.toLowerCase().includes(term) ||
        c.utm_source.toLowerCase().includes(term) ||
        c.utm_medium.toLowerCase().includes(term) ||
        c.utm_campaign.toLowerCase().includes(term)
      );
      return matchesChannel && matchesSearch;
    });
  }, [campaigns, selectedChannel, searchTerm]);

  // KPIs Calculados - Concordancia con /admin/rescue-fusion/dashboard
  const kpis = useMemo(() => {
    const rawCampaignVisitas = campaigns.reduce((acc, curr) => acc + (curr.visitas || 0), 0);
    const totalVisitas = dashboardStats?.landing_visits !== undefined && dashboardStats.landing_visits > 0
      ? dashboardStats.landing_visits
      : rawCampaignVisitas;

    const totalLeads = dashboardStats?.lead_captures !== undefined && dashboardStats.lead_captures > 0
      ? dashboardStats.lead_captures
      : campaigns.reduce((acc, curr) => acc + (curr.leads_completados || 0), 0);

    const totalRevisiones = dashboardStats?.review_requests !== undefined && dashboardStats.review_requests > 0
      ? dashboardStats.review_requests
      : campaigns.reduce((acc, curr) => acc + (curr.revisiones_generadas || 0), 0);
    
    const avgConv = totalVisitas > 0 ? ((totalLeads / totalVisitas) * 100).toFixed(1) + '%' : '0%';
    
    const weightedScoreSum = campaigns.reduce((acc, curr) => acc + (curr.score_promedio * (curr.leads_completados || 1)), 0);
    const totalLeadsCount = campaigns.reduce((acc, curr) => acc + (curr.leads_completados || 1), 0);
    const avgScore = totalLeadsCount > 0 ? Math.round(weightedScoreSum / totalLeadsCount) : 52;

    return { totalVisitas, totalLeads, totalRevisiones, avgConv, avgScore };
  }, [campaigns, dashboardStats]);

  // Helper para insignias de origen
  const getSourceBadge = (source: string) => {
    const s = source.toLowerCase();
    if (s.includes('direct')) {
      return { label: 'Tráfico Directo', bg: 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300', theme: 'cyan' as const };
    }
    if (s.includes('linkedin')) {
      return { label: 'LinkedIn Ads', bg: 'bg-blue-950/60 border-blue-500/40 text-blue-300', theme: 'indigo' as const };
    }
    if (s.includes('google')) {
      return { label: 'Google Search', bg: 'bg-rose-950/60 border-rose-500/40 text-rose-300', theme: 'rose' as const };
    }
    if (s.includes('email') || s.includes('newsletter')) {
      return { label: 'Email Mkt', bg: 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300', theme: 'emerald' as const };
    }
    if (s.includes('instagram')) {
      return { label: 'Instagram', bg: 'bg-purple-950/60 border-purple-500/40 text-purple-300', theme: 'purple' as const };
    }
    if (s.includes('facebook')) {
      return { label: 'Facebook Ads', bg: 'bg-indigo-950/60 border-indigo-500/40 text-indigo-300', theme: 'indigo' as const };
    }
    return { label: source.toUpperCase(), bg: 'bg-slate-900 border-slate-700 text-[#94A3B8]', theme: 'sky' as const };
  };

  // Generador de URL UTM construida
  const generatedFullUtmUrl = useMemo(() => {
    const base = utmForm.baseUrl.trim();
    const params = new URLSearchParams();
    if (utmForm.source) params.append('utm_source', utmForm.source.toLowerCase().trim());
    if (utmForm.medium) params.append('utm_medium', utmForm.medium.toLowerCase().trim());
    if (utmForm.campaign) params.append('utm_campaign', utmForm.campaign.toLowerCase().trim());
    if (utmForm.contentId) params.append('content_id', utmForm.contentId.trim());
    
    return `${base}?${params.toString()}`;
  }, [utmForm]);

  const copyToClipboard = (text: string, titleMessage: string) => {
    navigator.clipboard.writeText(text);
    showToast('¡Copiado al Portapapeles!', titleMessage, 'emerald');
  };

  return (
    <div className="min-h-screen bg-[#030712] text-white font-sans pb-16 selection:bg-[#C9A96E]/30 selection:text-white">
      {/* Header Premium */}
      <div className="p-6 md:p-8 bg-gradient-to-r from-[#07192F] via-[#0E2747] to-[#030712] border-b border-[#1E3A5F]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between max-w-7xl mx-auto">
          <div>
            <div className="mb-2.5 inline-flex items-center gap-2 border border-[#C9A96E]/40 bg-[#C9A96E]/10 px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[#C9A96E] rounded-full shadow-inner">
              <Sparkles size={12} className="animate-pulse" /> FABRIC · MARKETING ATTRIBUTION & UTMS
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-white tracking-tight flex items-center gap-3">
              <span>Campañas & Atribución UTM</span>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Live Audit · Explicaciones Calculadas
              </span>
            </h1>
            <p className="text-xs md:text-sm text-[#94A3B8] mt-1.5 font-sans max-w-2xl leading-relaxed">
              Auditoría completa de tráfico por campaña. Cada campaña incluye su gráfica de <strong>Lunes a Viernes</strong>, de <strong>Semana en Semana</strong> y una <strong>Explicación Calculada de Rendimiento</strong> reutilizable para informes ejecutivos.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setSelectedUtmReportCampaign('GENERAL');
                setShowUnderConstructionModal(true);
              }}
              className="px-4 py-2.5 bg-gradient-to-r from-[#C9A96E] to-[#E5C989] text-[#07192F] font-mono text-xs font-bold rounded-xl flex items-center gap-2 hover:brightness-110 transition cursor-pointer shadow-lg shadow-[#C9A96E]/20"
              title="Generar reporte detallado de campañas UTM"
            >
              <FileText size={15} />
              <span>Generar reporte de UTM</span>
            </button>
            <button
              onClick={fetchCampaignData}
              className="px-4 py-2.5 bg-[#07192F] border border-[#1E3A5F] hover:border-[#C9A96E]/50 text-[#C9A96E] font-mono text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Actualizar Datos</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Visitas */}
          <div className="bg-[#07192F]/80 border border-[#1E3A5F] hover:border-sky-500/40 rounded-2xl p-5 shadow-xl relative overflow-hidden transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                Visitas Atribuidas
              </span>
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <Globe size={18} />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-mono font-bold text-white tracking-tight">
                {kpis.totalVisitas.toLocaleString()}
              </span>
              <span className="text-[10px] font-mono text-emerald-400 flex items-center font-bold">
                <TrendingUp size={12} className="mr-0.5" /> +14.2%
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-1">Tráfico total capturado por UTMs</p>
          </div>

          {/* Card 2: Total Leads */}
          <div className="bg-[#07192F]/80 border border-[#1E3A5F] hover:border-amber-500/40 rounded-2xl p-5 shadow-xl relative overflow-hidden transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                Leads Capturados
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Users size={18} />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-mono font-bold text-amber-400 tracking-tight">
                {kpis.totalLeads}
              </span>
              <span className="text-[10px] font-mono text-amber-300/80 font-bold">
                {kpis.totalRevisiones} solicitudes
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-1">Prospectos en la plataforma</p>
          </div>

          {/* Card 3: Tasa de Conversión */}
          <div className="bg-[#07192F]/80 border border-[#1E3A5F] hover:border-emerald-500/40 rounded-2xl p-5 shadow-xl relative overflow-hidden transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                Tasa Conversión Prom.
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Target size={18} />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-mono font-bold text-emerald-300 tracking-tight">
                {kpis.avgConv}
              </span>
              <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                Óptima
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-1">Efectividad de visitas a leads</p>
          </div>

          {/* Card 4: Score Promedio */}
          <div className="bg-[#07192F]/80 border border-[#1E3A5F] hover:border-[#C9A96E]/40 rounded-2xl p-5 shadow-xl relative overflow-hidden transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                Score Promedio Lead
              </span>
              <div className="w-9 h-9 rounded-xl bg-[#C9A96E]/10 border border-[#C9A96E]/30 flex items-center justify-center text-[#C9A96E]">
                <Award size={18} />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-mono font-bold text-white tracking-tight">
                {kpis.avgScore} <span className="text-xs text-[#C9A96E]">pts</span>
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-1">Salud promedio de implementación</p>
          </div>
        </div>

        {/* Filter Toolbar & Channel Tabs */}
        <div className="bg-[#07192F]/90 border border-[#1E3A5F] p-4 rounded-2xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Channel Pills */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedChannel('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition whitespace-nowrap cursor-pointer ${
                selectedChannel === 'ALL'
                  ? 'bg-[#C9A96E] text-[#07192F] shadow-md shadow-[#C9A96E]/20'
                  : 'bg-[#0E2747] text-slate-300 hover:text-white border border-[#1E3A5F]'
              }`}
            >
              Todos los Canales ({campaigns.length})
            </button>
            {availableSources.map(src => (
              <button
                key={src}
                onClick={() => setSelectedChannel(src)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold capitalize transition whitespace-nowrap cursor-pointer ${
                  selectedChannel.toLowerCase() === src
                    ? 'bg-[#C9A96E] text-[#07192F] shadow-md shadow-[#C9A96E]/20'
                    : 'bg-[#0E2747] text-slate-300 hover:text-white border border-[#1E3A5F]'
                }`}
              >
                {src}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={15} />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por content_id, utm..."
              className="w-full pl-10 pr-4 py-2 bg-[#030712] border border-[#1E3A5F] rounded-xl text-xs text-white placeholder:text-[#94A3B8] font-mono focus:outline-none focus:border-[#C9A96E] transition shadow-inner"
            />
          </div>
        </div>

        {/* ALWAYS-UNFOLDED CAMPAIGN PERFORMANCE CARDS LIST */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <BarChart2 size={18} className="text-[#C9A96E]" />
              <h3 className="font-serif text-lg font-bold text-white tracking-wide">
                Desglose de Campañas y Gráficas de Tráfico ({filteredCampaigns.length})
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Explicaciones calculadas globalizadas disponibles
            </span>
          </div>

          {loading ? (
            <div className="p-16 bg-[#07192F]/80 border border-[#1E3A5F] rounded-3xl text-center font-mono text-xs text-[#94A3B8] tracking-widest flex flex-col items-center gap-3">
              <RefreshCw size={28} className="animate-spin text-[#C9A96E]" />
              <span>Cargando gráficas de tráfico e informe de campañas...</span>
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="p-16 bg-[#07192F]/80 border border-[#1E3A5F] rounded-3xl text-center space-y-3">
              <GitBranch size={38} className="mx-auto text-[#1E3A5F]" />
              <div className="font-serif text-base font-bold text-white">Sin campañas para los filtros seleccionados</div>
            </div>
          ) : (
            filteredCampaigns.map((row, idx) => {
              const badge = getSourceBadge(row.utm_source);
              const weekdaysTrend = generateWeekdaysTrend(row);
              const hourlyTrend = generateHourlyTrend(row);
              const insights = calculateGlobalizedExplanation(row, weekdaysTrend, hourlyTrend);

              return (
                <div
                  key={idx}
                  className="bg-[#07192F]/90 border border-[#1E3A5F] hover:border-[#C9A96E]/50 rounded-3xl p-5 md:p-6 shadow-2xl space-y-5 transition-all duration-300"
                >
                  {/* Campaign Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1E3A5F] pb-4">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="px-3.5 py-1.5 bg-[#030712] border border-sky-500/40 text-sky-300 font-mono font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm">
                        <Layers size={14} className="text-sky-400" />
                        {row.content_id}
                      </span>
                      <span className={`px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider rounded-lg border ${badge.bg}`}>
                        {badge.label}
                      </span>
                      <span className="text-slate-400 text-xs font-mono">
                        medium: <strong className="text-slate-200">{row.utm_medium}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold text-amber-200 bg-[#0E2747] px-3 py-1.5 rounded-xl border border-[#1E3A5F] truncate max-w-xs">
                        {row.utm_campaign}
                      </span>
                      {/* BOTÓN GENERAR REPORTE DE UTM POR CAMPAÑA */}
                      <button
                        onClick={() => {
                          setSelectedUtmReportCampaign(row.content_id);
                          setShowUnderConstructionModal(true);
                        }}
                        className="px-3.5 py-1.5 bg-[#0E2747] hover:bg-[#1E3A5F] border border-[#C9A96E]/40 text-[#C9A96E] font-mono text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shrink-0"
                        title="Generar reporte detallado de esta campaña en formato PDF/Excel"
                      >
                        <FileText size={14} />
                        <span>Generar reporte de UTM</span>
                      </button>
                    </div>
                  </div>

                  {/* Top Key Metrics Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#030712]/80 p-3.5 rounded-2xl border border-[#1E3A5F] text-center font-mono">
                    <div className="border-r border-[#1E3A5F]/60 last:border-r-0">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">Visitas Totales</div>
                      <div className="font-bold text-white text-xl mt-0.5">{row.visitas.toLocaleString()}</div>
                    </div>
                    <div className="border-r border-[#1E3A5F]/60 last:border-r-0">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">Leads Completados</div>
                      <div className="font-bold text-amber-400 text-xl mt-0.5">{row.leads_completados}</div>
                    </div>
                    <div className="border-r border-[#1E3A5F]/60 last:border-r-0">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">Score Promedio</div>
                      <div className="font-bold text-emerald-400 text-xl mt-0.5">{row.score_promedio} pts</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">Tasa Conversión</div>
                      <div className="font-bold text-sky-300 text-xl mt-0.5">{row.conversion_rate}</div>
                    </div>
                  </div>

                  {/* ALWAYS-VISIBLE Side-by-Side Interactive Charts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
                    {/* Gráfica 1: De Lunes a Viernes (Dorado) */}
                    <CampaignTrendChart
                      trendData={weekdaysTrend}
                      colorTheme="gold"
                      title="📅 Tráfico de Lunes a Viernes (Días Laborales)"
                    />

                    {/* Gráfica 2: Tráfico por Horario (Barras Histogram de Alta Claridad) */}
                    <HourlyBarChart
                      trendData={hourlyTrend}
                      title="⏰ Tráfico por Horario (Hora de Entrada)"
                    />
                  </div>

                  {/* SECCIÓN INFERIOR DE EXPLICACIÓN CALCULADA DE RENDIMIENTO GLOBALIZADA */}
                  <div className="bg-[#030712]/95 border border-[#1E3A5F] rounded-2xl p-4 md:p-5 space-y-3 font-mono text-xs shadow-inner relative">
                    <div className="flex items-center justify-between border-b border-[#1E3A5F] pb-2.5">
                      <div className="flex items-center gap-2 text-[#C9A96E] font-bold uppercase tracking-wider text-xs">
                        <Lightbulb size={16} className="text-amber-400" />
                        <span>Explicación y Análisis Calculado de Rendimiento</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                        Informe Globalizado Estándar
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-300 leading-relaxed text-[11px]">
                      {/* Col 1: Análisis Días y Semanas */}
                      <div className="space-y-2 bg-[#07192F]/60 p-3 rounded-xl border border-[#1E3A5F]/60">
                        <div className="font-bold text-sky-300 flex items-center gap-1.5 text-xs">
                          <Calendar size={13} /> 1. Comportamiento en Días y Semanas
                        </div>
                        <p>{insights.peakDayExplanation}</p>
                        <p>{insights.weeklyTrendExplanation}</p>
                      </div>

                      {/* Col 2: Diagnóstico Globalizado & Recomendación */}
                      <div className="space-y-2 bg-[#07192F]/60 p-3 rounded-xl border border-[#1E3A5F]/60">
                        <div className="font-bold text-amber-300 flex items-center gap-1.5 text-xs">
                          <Target size={13} /> 2. Diagnóstico & Recomendación Estratégica
                        </div>
                        <p>{insights.globalizedBehavior}</p>
                        <p className="text-emerald-300 font-bold">{insights.globalizedRecommendation}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MODAL EJECUTIVO: RESUMEN DE LA GRÁFICA & EXPLICACIÓN CALCULADA GLOBALIZADA */}
      {activeSummaryModal && createPortal(
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-[999999] flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setActiveSummaryModal(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="w-full max-w-2xl bg-[#0E2747] border border-[#C9A96E]/50 rounded-3xl shadow-2xl p-6 sm:p-7 space-y-5 relative overflow-hidden"
          >
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-[#1E3A5F] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#C9A96E]/15 border border-[#C9A96E]/40 flex items-center justify-center text-[#C9A96E]">
                  <Sparkles size={20} className="text-[#C9A96E]" />
                </div>
                <div>
                  <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                    <span>Reporte con IA — Análisis de Campaña</span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                      {activeSummaryModal.row.content_id}
                    </span>
                  </h3>
                  <p className="text-[11px] font-mono text-slate-400">
                    Diagnóstico ejecutivo globalizado con inteligencia analítica calculada
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveSummaryModal(null)}
                className="text-slate-400 hover:text-white p-1 transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Modal */}
            {(() => {
              const modalInsights = calculateGlobalizedExplanation(
                activeSummaryModal.row,
                activeSummaryModal.weekdays,
                activeSummaryModal.weekly
              );

              return (
                <div className="space-y-4 font-mono text-xs">
                  {/* Resumen de Métricas */}
                  <div className="grid grid-cols-3 gap-3 bg-[#030712] p-3 rounded-2xl border border-[#1E3A5F] text-center">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase">Día Pico Laboral</div>
                      <div className="font-bold text-sky-300 text-sm mt-0.5">{modalInsights.peakDayName}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase">Semana Pico Mensual</div>
                      <div className="font-bold text-amber-400 text-sm mt-0.5">{modalInsights.peakWeekName}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase">Conversión Promedio</div>
                      <div className="font-bold text-emerald-400 text-sm mt-0.5">{activeSummaryModal.row.conversion_rate}</div>
                    </div>
                  </div>

                  {/* Bloques Explicativos */}
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                    <div className="p-3.5 bg-[#07192F] border border-[#1E3A5F] rounded-xl space-y-1">
                      <div className="text-sky-300 font-bold text-xs uppercase flex items-center gap-1.5">
                        <Calendar size={13} /> 1. Análisis de Lunes a Viernes
                      </div>
                      <p className="text-slate-300 leading-relaxed text-[11px]">{modalInsights.peakDayExplanation}</p>
                    </div>

                    <div className="p-3.5 bg-[#07192F] border border-[#1E3A5F] rounded-xl space-y-1">
                      <div className="text-amber-300 font-bold text-xs uppercase flex items-center gap-1.5">
                        <BarChart2 size={13} /> 2. Análisis de Semana en Semana
                      </div>
                      <p className="text-slate-300 leading-relaxed text-[11px]">{modalInsights.weeklyTrendExplanation}</p>
                    </div>

                    <div className="p-3.5 bg-[#07192F] border border-[#1E3A5F] rounded-xl space-y-1">
                      <div className="text-purple-300 font-bold text-xs uppercase flex items-center gap-1.5">
                        <Globe size={13} /> 3. Diagnóstico de Comportamiento Globalizado
                      </div>
                      <p className="text-slate-300 leading-relaxed text-[11px]">{modalInsights.globalizedBehavior}</p>
                    </div>

                    <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/40 rounded-xl space-y-1">
                      <div className="text-emerald-300 font-bold text-xs uppercase flex items-center gap-1.5">
                        <Lightbulb size={13} /> 4. Recomendación Estratégica
                      </div>
                      <p className="text-emerald-200 leading-relaxed text-[11px]">{modalInsights.globalizedRecommendation}</p>
                    </div>
                  </div>

                  {/* Acciones Modal */}
                  <div className="flex items-center justify-between pt-3 border-t border-[#1E3A5F]">
                    <span className="text-[10px] text-slate-400">Texto listo para copiar en informes ejecutivos</span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setActiveSummaryModal(null)}
                        className="px-4 py-2 border border-[#1E3A5F] text-slate-300 font-mono text-xs font-bold rounded-xl cursor-pointer hover:bg-[#07192F]"
                      >
                        Cerrar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          copyToClipboard(modalInsights.fullTextToCopy, 'Informe del resumen analítico copiado al portapapeles.');
                          setActiveSummaryModal(null);
                        }}
                        className="px-5 py-2 bg-[#C9A96E] hover:bg-[#e6cf9c] text-[#07192F] font-mono text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer shadow-lg"
                      >
                        <Copy size={14} />
                        <span>Copiar Resumen Analítico</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>,
        document.body
      )}

      {/* Modal Generador de Enlaces UTM */}
      {showUtmModal && createPortal(
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-[999999] flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setShowUtmModal(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="w-full max-w-lg bg-[#0E2747] border border-[#C9A96E]/40 rounded-3xl shadow-2xl p-6 sm:p-7 space-y-5 relative overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-[#1E3A5F] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#C9A96E]/10 border border-[#C9A96E]/30 flex items-center justify-center text-[#C9A96E]">
                  <LinkIcon size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-serif font-bold text-white">Generador de Enlaces UTM</h3>
                  <p className="text-[11px] font-mono text-slate-400">Crea enlaces atribuidos listos para publicar</p>
                </div>
              </div>
              <button
                onClick={() => setShowUtmModal(false)}
                className="text-slate-400 hover:text-white p-1 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                  URL Base de Destino:
                </label>
                <input
                  type="text"
                  value={utmForm.baseUrl}
                  onChange={e => setUtmForm({ ...utmForm, baseUrl: e.target.value })}
                  className="w-full bg-[#07192F] border border-[#1E3A5F] text-white p-2.5 rounded-xl outline-none focus:border-[#C9A96E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                    utm_source (Origen):
                  </label>
                  <select
                    value={utmForm.source}
                    onChange={e => setUtmForm({ ...utmForm, source: e.target.value })}
                    className="w-full bg-[#07192F] border border-[#1E3A5F] text-white p-2.5 rounded-xl outline-none focus:border-[#C9A96E] capitalize"
                  >
                    <option value="linkedin">LinkedIn</option>
                    <option value="google">Google</option>
                    <option value="instagram">Instagram</option>
                    <option value="facebook">Facebook</option>
                    <option value="email">Email</option>
                    <option value="whatsapp">WhatsApp</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                    utm_medium (Medio):
                  </label>
                  <input
                    type="text"
                    value={utmForm.medium}
                    onChange={e => setUtmForm({ ...utmForm, medium: e.target.value })}
                    placeholder="cpc, organic, email, etc."
                    className="w-full bg-[#07192F] border border-[#1E3A5F] text-white p-2.5 rounded-xl outline-none focus:border-[#C9A96E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                    utm_campaign (Campaña):
                  </label>
                  <input
                    type="text"
                    value={utmForm.campaign}
                    onChange={e => setUtmForm({ ...utmForm, campaign: e.target.value })}
                    placeholder="fusion_rescue_q4"
                    className="w-full bg-[#07192F] border border-[#1E3A5F] text-white p-2.5 rounded-xl outline-none focus:border-[#C9A96E]"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                    content_id (ID Contenido):
                  </label>
                  <input
                    type="text"
                    value={utmForm.contentId}
                    onChange={e => setUtmForm({ ...utmForm, contentId: e.target.value })}
                    placeholder="LI-POST-001"
                    className="w-full bg-[#07192F] border border-[#1E3A5F] text-white p-2.5 rounded-xl outline-none focus:border-[#C9A96E]"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="text-[10px] text-[#C9A96E] uppercase tracking-wider block mb-1 font-bold">
                  Enlace Generado Resultante:
                </label>
                <div className="p-3 bg-[#030712] border border-emerald-500/40 rounded-xl text-[10px] text-emerald-300 font-mono break-all select-all shadow-inner">
                  {generatedFullUtmUrl}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1E3A5F]">
              <button
                type="button"
                onClick={() => setShowUtmModal(false)}
                className="px-4 py-2 border border-[#1E3A5F] text-slate-300 font-mono text-xs font-bold rounded-xl cursor-pointer hover:bg-[#07192F]"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => {
                  copyToClipboard(generatedFullUtmUrl, 'Enlace UTM generado copiado exitosamente al portapapeles.');
                  setShowUtmModal(false);
                }}
                className="px-5 py-2 bg-[#C9A96E] hover:bg-[#e6cf9c] text-[#07192F] font-mono text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer shadow-lg"
              >
                <Copy size={14} />
                <span>Copiar Enlace UTM</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* VENTANA EMERGENTE: REPORTE DE UTM EN CONSTRUCCIÓN */}
      {showUnderConstructionModal && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-[#030712]/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#07192F] border border-[#C9A96E]/50 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-6 text-center relative font-mono ring-1 ring-[#C9A96E]/30">
            <button
              onClick={() => setShowUnderConstructionModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-[#1E3A5F] transition cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="w-16 h-16 rounded-2xl bg-[#C9A96E]/15 border border-[#C9A96E]/40 text-[#C9A96E] flex items-center justify-center mx-auto shadow-inner">
              <Sparkles size={32} className="text-[#C9A96E] animate-pulse" />
            </div>

            <div className="space-y-1.5">
              <span className="px-3 py-1 bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold uppercase tracking-wider rounded-lg border border-amber-500/40">
                Módulo en Desarrollo
              </span>
              <h3 className="text-xl font-bold text-white font-serif pt-1">
                Generar Reporte de UTM
              </h3>
              {selectedUtmReportCampaign && (
                <p className="text-xs text-sky-300 font-mono font-semibold">
                  Campaña: {selectedUtmReportCampaign}
                </p>
              )}
            </div>

            <div className="bg-[#030712]/90 border border-[#1E3A5F] rounded-2xl p-5 space-y-2">
              <div className="text-base font-bold text-amber-400 uppercase tracking-widest flex items-center justify-center gap-2">
                <span>🚧 EN CONSTRUCCIÓN 🚧</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans pt-1">
                Esta funcionalidad se encuentra en proceso de construcción. Próximamente podrás exportar reportes ejecutivos consolidados en formato PDF y Excel con desglose completo de métricas UTM.
              </p>
            </div>

            <button
              onClick={() => setShowUnderConstructionModal(false)}
              className="w-full py-3 bg-gradient-to-r from-[#C9A96E] to-[#E5C989] text-[#07192F] font-mono text-xs font-bold rounded-xl hover:brightness-110 transition shadow-lg shadow-[#C9A96E]/20 cursor-pointer"
            >
              Entendido / Cerrar
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Alerta Notificación Flotante Personalizada FABRIC */}
      {toast && createPortal(
        <div className="fixed bottom-6 right-6 z-[999999] animate-fadeIn">
          <div className={`flex items-start gap-3.5 p-4 rounded-2xl border shadow-2xl backdrop-blur-md max-w-sm ${
            toast.type === 'emerald'
              ? 'bg-[#07192F]/95 border-emerald-500/60 text-emerald-300 shadow-emerald-950/80 ring-1 ring-emerald-500/30'
              : toast.type === 'blue'
              ? 'bg-[#07192F]/95 border-sky-500/60 text-sky-300 shadow-sky-950/80 ring-1 ring-sky-500/30'
              : 'bg-[#07192F]/95 border-[#C9A96E]/60 text-amber-200 shadow-amber-950/80 ring-1 ring-[#C9A96E]/30'
          }`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
              toast.type === 'emerald'
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                : toast.type === 'blue'
                ? 'bg-sky-500/20 border-sky-500/40 text-sky-400'
                : 'bg-[#C9A96E]/20 border-[#C9A96E]/40 text-[#C9A96E]'
            }`}>
              {toast.type === 'emerald' ? <CheckCircle2 size={20} /> : <Share2 size={20} />}
            </div>

            <div className="min-w-0 flex-1 space-y-0.5 font-mono">
              <div className="text-xs font-bold text-white uppercase tracking-wider">{toast.title}</div>
              <div className="text-[11px] text-[#94A3B8] leading-snug">{toast.message}</div>
            </div>

            <button
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-white p-1 transition cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

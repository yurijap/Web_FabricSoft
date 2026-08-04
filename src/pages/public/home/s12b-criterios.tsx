const admissions = [
  ["Empresa con revenue USD 50M+ anuales", "Umbral mínimo · Verificado en SOW", "Mandatory"],
  ["Industria: Servicios Financieros, Inmobiliario o Logística", "Verticales con FSOs aplicables", "Mandatory"],
  ["Patrocinio ejecutivo CFO + CTO confirmado", "Patrocinio dual no negociable", "Mandatory"],
  ["Plazo realista (mínimo 4 meses)", "Doctrina requiere primer ciclo crítico operado", "Mandatory"],
  ["Disponibilidad de equipo interno del cliente", "Mínimo 1 PM + 2 SMEs full-time durante Deploy", "Preferred"],
  ["Presupuesto alineado con alcance real", "FABRIC publica rangos antes de SOW", "Preferred"]
] as const;

const rejections = [
  ["Plazos imposibles de cumplir con calidad", "Ej. go-live + cierre en menos de 16 semanas", "Hard"],
  ["Sin patrocinio C-level confirmado", "Sin CFO o CTO firmando · No procede", "Hard"],
  ["Alcance no estabilizable en primer ciclo crítico", "Doctrina contractual no es viable", "Hard"],
  ["Industrias fuera de especialización", "Manufactura discreta, retail B2C, healthcare", "Hard"],
  ["Presupuesto desalineado del alcance real", "No renegociamos · No comprometemos calidad", "Hard"]
] as const;

import { useInViewOnce } from '../../../hooks/useInViewOnce';
import { useState, useEffect } from 'react';
import { api } from '../../../config/api';

export default function S12bCriterios() {
  const [ref, isInView] = useInViewOnce<HTMLElement>();
  const [proyectosActivos, setProyectosActivos] = useState<number | null>(null);
  const [solicitudesEvaluadas, setSolicitudesEvaluadas] = useState<number | null>(null);

  useEffect(() => {
    api.get('/stats')
      .then(res => {
        setProyectosActivos(res.data.data.proyectosActivos);
        setSolicitudesEvaluadas(res.data.data.solicitudesEvaluadas);
      })
      .catch(() => { /* mantiene null → muestra — */ });
  }, []);

  return (
    <section ref={ref} id="criterios" className={`demo-section s07 transition-all duration-1000 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
      <div className="container">
        <div style={{ maxWidth: 820 }}>
          <div className="label">Criterios de Evaluación</div>
          <h2 style={{ fontWeight: 300 }}><span className="text-[#C9A96E]">No somos para todos.</span></h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 17, lineHeight: 1.7, marginTop: 24 }}>
            FABRIC opera con criterios claros de admisión. Aceptamos proyectos donde podemos cumplir nuestra doctrina contractual. Rechazamos los demás.
          </p>
        </div>

        <div className="criterios-grid">
          <div className="criterios-block admit">
            <div className="criterios-head">
              <h3>Criterios de Admisión</h3>
              <div className="criterios-count">06<small>Criterios</small></div>
            </div>
            <ul className="criterios-list">
              {admissions.map(([title, subtitle, weight]) => (
                <li key={title}>
                  <span className="crit-mark check">✓</span>
                  <div className="crit-text">
                    {title}
                    <small>{subtitle}</small>
                  </div>
                  <span className={`crit-weight ${weight === "Mandatory" ? "mandatory" : "preferred"}`}>{weight}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="criterios-block reject">
            <div className="criterios-head">
              <h3>Razones de Rechazo</h3>
              <div className="criterios-count" style={{ color: "var(--danger)" }}>05<small>Disqualifiers</small></div>
            </div>
            <ul className="criterios-list">
              {rejections.map(([title, subtitle, weight]) => (
                <li key={title}>
                  <span className="crit-mark x">×</span>
                  <div className="crit-text">
                    {title}
                    <small>{subtitle}</small>
                  </div>
                  <span className="crit-weight disqualifying">{weight}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* BACKEND TODO: estos números deben venir de DB en tiempo real.
            proyectosAceptados: store.capacidad.activos (máx 12 según brief)
            solicitudesEvaluadas: total de aplicaciones recibidas en el año
            El FOMO es real solo si los números son reales — no hardcodear. */}
        <div className="acceptance-banner">
          <div className="acceptance-stat">
            <div className="num">{proyectosActivos !== null ? proyectosActivos : '—'}</div>
            <div className="lbl">Proyectos activos · 2026</div>
          </div>
          <div className="acceptance-divider"></div>
          <div className="acceptance-stat">
            <div className="num">{solicitudesEvaluadas !== null ? solicitudesEvaluadas : '—'}</div>
            <div className="lbl">Solicitudes evaluadas</div>
          </div>
          <div className="acceptance-divider"></div>
          <div className="acceptance-quote">Nuestra selectividad protege la calidad operativa para los clientes que sí aceptamos.</div>
        </div>
      </div>
    </section>
  );
}

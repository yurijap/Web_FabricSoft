import { useEffect, useState } from 'react';
import BackButton from '../../../components/BackButton';
import { Link } from 'react-router-dom';
import { api } from '../../../config/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Publicada {
  id: string;
  label: string;
  valor: string;
  unidad: string;
  metodologia: string;
  definicion: string;
  universo: string;
  n: string;
  formula: string;
  validacion: string;
  auditoria: string;
  periodo: string;
  fuente: { tipo: string; descripcion: string };
  verificadoPor: string;
  ultimaActualizacion: string;
}

interface Compromiso {
  id: string;
  titulo: string;
  cuerpo: string;
}

// ---------------------------------------------------------------------------
// Fallback editorial — idéntico al contenido hardcodeado original.
// ---------------------------------------------------------------------------

const FALLBACK_PUBLICADAS: Publicada[] = [
  {
    id: '01', label: 'Go-live APE Plazas en fecha contractual',
    valor: '✓', unidad: 'Verificable',
    metodologia: 'Go-live planeado 06 abril 2026 · Ejecutado 06 abril 2026 · Verificable bajo NDA',
    definicion: 'Cumplimiento del hito contractual de salida a producción en la fecha planeada para APE Plazas.',
    universo: 'Proyecto APE Plazas · Implementación Oracle Fusion Cloud · Abril 2026.',
    n: '1 proyecto',
    formula: 'Go-live ejecutado en fecha contractual = Sí/No.',
    validacion: 'Acta de go-live y bitácora de despliegue disponibles bajo NDA mutuo.',
    auditoria: 'Revisión interna formal FABRIC + validación del responsable financiero del cliente.',
    periodo: 'abr 2026',
    fuente: { tipo: 'cliente', descripcion: 'CFO APE Plazas' },
    verificadoPor: 'CFO APE Plazas',
    ultimaActualizacion: '2026-04-30',
  },
  {
    id: '02', label: 'Primer cierre contable APE Plazas',
    valor: '✓', unidad: 'Verificable',
    metodologia: 'Cierre planeado abril 2026 · Ejecutado 30 abril 2026 · Acta en firma mayo 2026',
    definicion: 'Ejecución del primer cierre contable completo en producción después del go-live.',
    universo: 'Primer ciclo contable de APE Plazas operado en Oracle Fusion Cloud.',
    n: '1 cierre contable',
    formula: 'Cierre ejecutado dentro del mes operativo comprometido = Sí/No.',
    validacion: 'Acta de transición, evidencia de cierre y confirmación ejecutiva disponibles bajo NDA.',
    auditoria: 'Revisión interna formal FABRIC + validación del responsable financiero del cliente.',
    periodo: 'abr–may 2026',
    fuente: { tipo: 'cliente', descripcion: 'CFO APE Plazas' },
    verificadoPor: 'CFO APE Plazas',
    ultimaActualizacion: '2026-05-01',
  },
  {
    id: '03', label: 'Sin incidencias críticas post go-live',
    valor: '✓', unidad: 'APE Plazas',
    metodologia: 'Cero incidencias bloqueantes al cierre del primer ciclo · Verificable bajo NDA',
    definicion: 'Ausencia de incidencias críticas bloqueantes abiertas al completar el primer ciclo contable.',
    universo: 'Incidencias clasificadas como críticas durante la fase STABILIZE de APE Plazas.',
    n: '1 proyecto / fase STABILIZE abril 2026',
    formula: 'Incidencias críticas bloqueantes abiertas al cierre del ciclo = 0.',
    validacion: 'Bitácora operativa de incidencias y reporte FABRIC del ciclo disponibles bajo NDA.',
    auditoria: 'Revisión interna formal FABRIC + validación del responsable financiero del cliente.',
    periodo: 'abr 2026',
    fuente: { tipo: 'cliente', descripcion: 'CFO APE Plazas' },
    verificadoPor: 'CFO APE Plazas',
    ultimaActualizacion: '2026-04-30',
  },
  {
    id: '04', label: 'Experiencia Oracle promedio del equipo',
    valor: '15+', unidad: 'años',
    metodologia: 'Promedio de años de experiencia Oracle por consultor senior facturable',
    definicion: 'Experiencia promedio mínima documentada del equipo senior facturable asignado a proyectos Oracle.',
    universo: 'Consultores senior facturables FABRIC activos al cierre de enero 2026.',
    n: 'Plantilla senior facturable vigente',
    formula: 'Suma de años documentados de experiencia Oracle / total de consultores senior facturables.',
    validacion: 'CVs, historial de proyectos y perfiles profesionales verificables.',
    auditoria: 'Revisión interna formal de Dirección FABRIC.',
    periodo: 'auditado',
    fuente: { tipo: 'interna', descripcion: 'Currículum + certificaciones verificadas' },
    verificadoPor: 'Dirección FABRIC',
    ultimaActualizacion: '2026-01-01',
  },
  {
    id: '05', label: 'Plantilla 100% senior Oracle',
    valor: '100%', unidad: 'del equipo',
    metodologia: 'Cero juniors facturables · Condición contractual en cada SOW · Verificable',
    definicion: 'Porcentaje de personal facturable de proyecto que cumple criterio senior FABRIC.',
    universo: 'Roles facturables incluidos en SOWs Oracle activos.',
    n: 'SOWs vigentes bajo doctrina FABRIC',
    formula: '(Roles senior facturables / total roles facturables de proyecto) × 100.',
    validacion: 'SOWs y staffing plan por proyecto disponibles bajo NDA.',
    auditoria: 'Revisión interna formal de Dirección FABRIC.',
    periodo: 'SOW',
    fuente: { tipo: 'interna', descripcion: 'Contratos SOW vigentes' },
    verificadoPor: 'Dirección FABRIC',
    ultimaActualizacion: '2026-01-01',
  },
  {
    id: '06', label: 'Certificaciones Oracle vigentes',
    valor: '100%', unidad: 'del equipo',
    metodologia: 'Certificaciones activas verificables por consultor facturable',
    definicion: 'Porcentaje de consultores facturables con certificaciones Oracle vigentes o evidencia equivalente validada.',
    universo: 'Consultores facturables asignables a proyectos Oracle.',
    n: 'Plantilla facturable vigente',
    formula: '(Consultores con certificación vigente / total consultores facturables Oracle) × 100.',
    validacion: 'Oracle Certification Portal y evidencia individual verificable.',
    auditoria: 'Revisión interna formal de Dirección FABRIC.',
    periodo: 'vigente',
    fuente: { tipo: 'interna', descripcion: 'Oracle Certification Portal' },
    verificadoPor: 'Dirección FABRIC',
    ultimaActualizacion: '2026-01-01',
  },
];

const FALLBACK_COMPROMISOS: Compromiso[] = [
  {
    id: '01',
    titulo: 'Publicamos solo números reales',
    cuerpo: 'Las métricas de esta página reflejan proyectos reales documentados. No proyectamos tasas de éxito ni publicamos benchmarks de mercado como si fueran propios. Si no tenemos el número, no lo publicamos.',
  },
  {
    id: '02',
    titulo: 'Metodología pública por cada métrica',
    cuerpo: 'Cada número de la sección anterior tiene una definición, un universo, y un método de cálculo documentado. Ninguna métrica es un claim sin sustento.',
  },
  {
    id: '03',
    titulo: 'Actualización trimestral',
    cuerpo: 'Las métricas se actualizan al cierre de cada trimestre. La fecha de última actualización aparece en cada dato. Preferimos retrasar una publicación a publicar un número sin validar.',
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatFecha(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
}

function metricDetail(m: Publicada, key: keyof Pick<Publicada, 'definicion' | 'universo' | 'n' | 'formula' | 'validacion' | 'auditoria'>, fallback: string): string {
  return String(m[key] || fallback).trim();
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TransparenciaPage() {
  const [publicadas, setPublicadas]     = useState<Publicada[]>(FALLBACK_PUBLICADAS);
  const [compromisos, setCompromisos]   = useState<Compromiso[]>(FALLBACK_COMPROMISOS);
  const [ultimaActualizacion, setUltimaActualizacion] = useState('Mayo 2026');
  const [universo, setUniverso]         = useState('2 proyectos bajo doctrina formal');

  useEffect(() => {
    api.get('/transparencia')
      .then(res => {
        const d = res.data?.data;
        if (!d) return;

        if (Array.isArray(d.publicadas) && d.publicadas.length) {
          setPublicadas(d.publicadas);
          if (d.ultimaActualizacion) {
            setUltimaActualizacion(formatFecha(d.ultimaActualizacion));
          }
          setUniverso(`${d.publicadas.length} métricas verificadas`);
        }

        if (Array.isArray(d.compromisos) && d.compromisos.length) {
          setCompromisos(d.compromisos);
        }
      })
      .catch(() => {
        // Fallback editorial ya está en el estado inicial
      });
  }, []);

  return (
    <div className="transparency-page">

      {/* Back */}
      <div className="transparency-container transparency-back">
        <BackButton />
      </div>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="transparency-hero">
        <div className="transparency-container">
          <div className="label" style={{ marginBottom: 20 }}>Transparencia · FABRIC</div>
          <div className="transparency-hero-grid">
            <div>
              <h1 className="transparency-title-main">
                Datos verificables.<br />
                <em style={{ color: 'var(--accent)', fontStyle: 'italic' }}>Metodología pública.</em>
              </h1>
            </div>
            <div>
              <p style={{ fontFamily: 'var(--sans)', fontSize: 17, color: 'var(--text-secondary)', lineHeight: 1.75 }}>
                En FABRIC no publicamos proyecciones comerciales como si fueran resultados. Publicamos números de proyectos reales, con metodología documentada y fecha de actualización.
              </p>
              <div style={{ marginTop: 24, fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                Última actualización · {ultimaActualizacion} · Universo · {universo}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Métricas por caso real — Nivel 1 ───────────────────────────────── */}
      <section className="transparency-section">
        <div className="transparency-container">
          <div className="label" style={{ marginBottom: 40 }}>Nivel 1 · Métricas por caso real</div>

          <div style={{ borderTop: '1px solid var(--border)' }}>
            {publicadas.map(m => (
              <div key={m.id} className="transparency-metric-row">
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', letterSpacing: '0.2em' }}>{m.id}</div>
                <div>
                  <div className="transparency-metric-label">{m.label}</div>
                  {m.fuente?.descripcion && (
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: '0.1em', marginTop: 6 }}>
                      Fuente · {m.fuente.descripcion}
                    </div>
                  )}
                </div>
                <div>
                  <div className="transparency-metric-value">{m.valor}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: '0.14em', marginTop: 4 }}>{m.unidad}</div>
                  {m.periodo && (
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-tertiary)', letterSpacing: '0.1em', marginTop: 4 }}>{m.periodo}</div>
                  )}
                </div>
                <div>
                  <div className="transparency-methodology">
                    {m.metodologia}
                  </div>
                  <div className="transparency-detail-grid">
                    {[
                      ['Definición', metricDetail(m, 'definicion', m.metodologia)],
                      ['Universo', metricDetail(m, 'universo', 'Universo documentado por fuente y período.')],
                      ['N', metricDetail(m, 'n', 'N documentado bajo NDA')],
                      ['Fórmula', metricDetail(m, 'formula', m.metodologia)],
                      ['Validación', metricDetail(m, 'validacion', 'Evidencia disponible bajo NDA mutuo.')],
                      ['Auditoría', metricDetail(m, 'auditoria', 'Revisión interna formal FABRIC.')],
                    ].map(([label, value]) => (
                      <div key={label} className="transparency-detail-card">
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--accent)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 5 }}>
                          {label}
                        </div>
                        <div style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>
                  {m.verificadoPor && (
                    <div style={{ marginTop: 12, fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: '0.1em' }}>
                      Verificado por · {m.verificadoPor}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 32, padding: '16px 24px', border: '1px solid var(--border)', borderLeft: '2px solid var(--accent)', fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: '0.1em', lineHeight: 1.8 }}>
            Universo actual: métricas verificadas por caso publicado y datos factuales del equipo FABRIC. La evidencia respaldatoria se comparte bajo NDA mutuo con prospectos calificados.
            {' '}Consultas sobre metodología: <a href="mailto:metodologia@fabricsoft.com.mx" style={{ color: 'var(--accent)' }}>metodologia@fabricsoft.com.mx</a>
          </div>
        </div>
      </section>

      {/* ── Compromisos de medición — Nivel 2 ──────────────────────────────── */}
      <section className="transparency-section">
        <div className="transparency-container">
          <div className="label" style={{ marginBottom: 40 }}>Nivel 2 · Compromisos de medición</div>

          <div className="grid-3col">
            {compromisos.map(c => (
              <div key={c.id} style={{ border: '1px solid var(--border)', padding: '32px 28px' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', letterSpacing: '0.25em', marginBottom: 16 }}>{c.id}</div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 22, color: 'var(--text-primary)', fontWeight: 400, lineHeight: 1.2, marginBottom: 16 }}>{c.titulo}</div>
                <div style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{c.cuerpo}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 48, padding: '28px 32px', border: '1px solid var(--border)', background: 'var(--bg-panel)' }}>
            <div className="label" style={{ marginBottom: 16 }}>Proyección de publicación</div>
            <p style={{ fontFamily: 'var(--sans)', fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 720 }}>
              FABRIC publicará métricas agregadas con universo estadístico a partir de{' '}
              <strong style={{ color: 'var(--text-primary)', fontWeight: 400 }}>Q4 2026</strong>,
              una vez completados los primeros 10 proyectos bajo Doctrina formal, con metodología auditada externamente.
            </p>
          </div>
        </div>
      </section>

      {/* ── Datos del equipo — Nivel 3 (editorial, no conectado a DB) ───────── */}
      <section className="transparency-section transparency-section-final">
        <div className="transparency-container">
          <div className="label" style={{ marginBottom: 40 }}>Nivel 3 · Datos del equipo</div>

          <div className="grid-3col" style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
            {[
              { num: '8+',   label: 'Años de experiencia Oracle', sub: 'Mínimo por consultor' },
              { num: '100%', label: 'Plantilla senior',           sub: 'Cero juniors facturables · Por contrato' },
              { num: '20+',  label: 'Años de Julio Álvarez',      sub: 'Experiencia Oracle / ERP empresarial' },
            ].map((s, i) => (
              <div key={i} style={{ padding: '40px 40px', borderRight: i < 2 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 56, color: 'var(--accent)', lineHeight: 1, fontWeight: 400, marginBottom: 12 }}>{s.num}</div>
                <div style={{ fontFamily: 'var(--sans)', fontSize: 15, color: 'var(--text-primary)', marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>{s.sub}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 64, display: 'flex', gap: 24, alignItems: 'center' }}>
            <Link to="/aplicar" className="btn-primary">
              Aplicar a FABRIC →
            </Link>
            <Link to="/" className="cta">
              Volver al inicio <span className="cta-arrow">→</span>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}


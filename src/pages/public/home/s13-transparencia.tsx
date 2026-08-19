import { useEffect, useState } from 'react';
import { api } from '../../../config/api';
import { useInViewOnce } from '../../../hooks/useInViewOnce';
import './s13-transparencia.css';


// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Publicada {
  id: string;
  label: string;
  valor: string;
  unidad: string;
  periodo: string;
}

interface Proxima {
  id: string;
  label: string;
  fechaObjetivo: string;
}

interface Compromiso {
  id: string;
  titulo: string;
  cuerpo: string;
}

function metricMeta(p: Publicada) {
  const value = p.valor?.trim() === '✓' ? '' : `${p.valor} `;
  return `${value}${p.unidad} · ${p.periodo}`.trim();
}

// ---------------------------------------------------------------------------
// Fallback editorial — refleja el contenido hardcodeado original.
// Se usa si la API no responde.
// ---------------------------------------------------------------------------

const FALLBACK_PUBLICADAS: Publicada[] = [
  { id: '01', label: 'Go-live en fecha contractual',                  valor: '✓',   unidad: 'Verificable', periodo: 'abr 2026' },
  { id: '02', label: 'Primer cierre contable',                        valor: '✓',   unidad: 'Verificable', periodo: 'abr–may 2026' },
  { id: '03', label: 'Sin incidencias críticas post go-live',         valor: '✓',   unidad: 'Cliente',     periodo: 'abr 2026' },
  { id: '04', label: 'Experiencia Oracle promedio del equipo',        valor: '15+', unidad: 'años',         periodo: 'auditado' },
  { id: '05', label: 'Plantilla 100% senior Oracle',                  valor: '100%', unidad: 'del equipo',  periodo: 'SOW' },
];

const FALLBACK_PROXIMAS: Proxima[] = [
  { id: '01', label: 'NPS clientes activos',                  fechaObjetivo: 'Oct 2026' },
  { id: '02', label: 'Retención a 24 meses',                  fechaObjetivo: 'Nov 2026' },
  { id: '03', label: 'Tiempo medio respuesta crítica',         fechaObjetivo: 'Q4 2026'  },
  { id: '04', label: 'Cumplimiento Fixed-Price contractual',   fechaObjetivo: 'Dic 2026' },
  { id: '05', label: 'Tasa de proyectos completados en ciclo', fechaObjetivo: 'Anual'    },
];

const FALLBACK_COMPROMISO: Compromiso = {
  id:     '01',
  titulo: 'Nuestra promesa',
  cuerpo: 'Cuando publiquemos métricas, serán reales, verificables y auditadas. Hasta entonces, no inventamos números para verse bien.',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function S13Transparencia() {
  const [ref, isInView] = useInViewOnce<HTMLElement>();

  const [publicadas, setPublicadas]     = useState<Publicada[]>(FALLBACK_PUBLICADAS);
  const [proximas, setProximas]         = useState<Proxima[]>(FALLBACK_PROXIMAS);
  const [compromiso, setCompromiso]     = useState<Compromiso>(FALLBACK_COMPROMISO);

  useEffect(() => {
    api.get('/transparencia')
      .then(res => {
        const d = res.data?.data;
        if (!d) return;

        if (Array.isArray(d.publicadas) && d.publicadas.length) {
          setPublicadas(d.publicadas.map((p: { id: string; label: string; valor: string; unidad: string; periodo: string }) => ({
            id:     p.id,
            label:  p.label,
            valor:  p.valor,
            unidad: p.unidad,
            periodo: p.periodo,
          })));
        }

        if (Array.isArray(d.proximas) && d.proximas.length) {
          setProximas(d.proximas.map((p: { id: string; label: string; fechaObjetivo: string }) => ({
            id:            String(p.id),
            label:         p.label,
            fechaObjetivo: p.fechaObjetivo,
          })));
        }

        if (Array.isArray(d.compromisos) && d.compromisos.length) {
          const first = d.compromisos[0];
          setCompromiso({ id: first.id, titulo: first.titulo, cuerpo: first.cuerpo });
        }
      })
      .catch(() => {
        // Fallback editorial ya está en el estado inicial — no hacer nada
      });
  }, []);

  return (
    <section
      ref={ref}
      className={`demo-section s13 transition-all duration-1000 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
    >
      <div className="container">
        <div className="s13-intro">
          <div className="label">Transparencia Honesta</div>
          <h2>
            Lo que medimos hoy.<br />
            Lo que <span className="text-[#C9A96E]">publicaremos mañana.</span>
          </h2>
        </div>

        <div className="transparency-grid">

          {/* Bloque 1 — Publicado ahora */}
          <div className="transparency-block">
            <div className="transparency-tag">Hoy · 2026</div>
            <div className="transparency-title">Lo que publicamos ahora</div>
            <ul className="transparency-list">
              {publicadas.map(p => (
                <li key={p.id}>
                  <span>{p.label}</span>
                  <span className="meta verified">
                    {metricMeta(p)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="methodology-note">
              <strong>Metodología</strong>
              Métricas verificables bajo NDA con revisión interna formal. Auditoría externa para métricas agregadas a partir de Q4 2026.
              <a href="/transparencia" className="methodology-link">Metodología pública: /transparencia</a>
            </div>
          </div>

          {/* Bloque 2 — Próximas publicaciones */}
          <div className="transparency-block">
            <div className="transparency-tag">Q4 · 2026</div>
            <div className="transparency-title">Próximas publicaciones</div>
            <ul className="transparency-list">
              {proximas.map(p => (
                <li key={p.id}>
                  <span>{p.label}</span>
                  <span className="meta">{p.fechaObjetivo}</span>
                </li>
              ))}
            </ul>
            <div className="methodology-note">
              <strong>Plazo de publicación</strong>
              Cada métrica se publica con metodología, periodo medido, método de cálculo y responsable de validación.
            </div>
          </div>

          {/* Bloque 3 — Compromiso */}
          <div className="transparency-block compromise">
            <div className="transparency-tag">Compromiso</div>
            <div className="transparency-title">Nuestra promesa</div>
            <p className="transparency-quote">{compromiso.cuerpo}</p>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 16 }}>
              — Doctrina FABRIC
            </div>
            <div className="methodology-note">
              <strong>Vinculación contractual</strong>
              Esta cláusula está en cada SOW que FABRIC firma. La transparencia es contractual, no editorial.
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

import { useState } from 'react';
import { useInViewOnce } from '../../../hooks/useInViewOnce';
import './s09-fabric-os.css';

const layers: {
  num: string;
  name: string;
  tag: string;
  desc: string;
}[] = [
  {
    num: "04",
    name: "Agentes IA propios",
    tag: "Capacidad técnica diferencial propia.",
    desc: "Agentes de diagnóstico, lectura contractual y priorización técnica entrenados sobre doctrina FABRIC. No sustituyen al senior: aceleran la primera hipótesis y reducen ruido en la evaluación.",
  },
  {
    num: "03",
    name: "Frameworks aplicados",
    tag: "Metodologías propias aplicadas en proyecto.",
    desc: "Playbooks de rescate, estabilización y migración diseñados para operar con hitos contractuales, evidencia de avance y toma de decisiones ejecutiva.",
  },
  {
    num: "02",
    name: "FSOs paquetizados",
    tag: "Soluciones paquetizadas reutilizables.",
    desc: "Soluciones reutilizables para cierres contables, operación multi-entidad, controles fintech y migraciones legacy. Cada FSO reduce tiempo de diseño y riesgo de ejecución.",
  },
  {
    num: "01",
    name: "Doctrina de entrega",
    tag: "Cómo trabajamos. Contractualizable.",
    desc: "La entrega se mide en operación real: primer ciclo crítico, evidencia documental, ownership senior y transición formal. Go-live no es el final del proyecto.",
  },
] as const;

interface FSOItem {
  id: string;
  status: string;
  statusClass: string;
  name: string;
  desc: string;
  validation: string;
  version: string;
  tiempo: string;
  costo: string;
}

const fsos: FSOItem[] = [
  {
    id: "FSO-01",
    status: "Available",
    statusClass: "available",
    name: "Rapid GL Close",
    desc: "Cierre contable acelerado · 10-15 días → 3-5 días",
    validation: "Validado en Producción",
    version: "v1.2",
    tiempo: "4 semanas",
    costo: "USD 35K"
  },
  {
    id: "FSO-02",
    status: "Available",
    statusClass: "available",
    name: "Multi-Entity Retail Ops",
    desc: "Operación multi-plaza · Consolidación multi-entidad",
    validation: "Validado en Producción",
    version: "v1.0",
    tiempo: "6 semanas",
    costo: "USD 45K"
  },
  {
    id: "FSO-03",
    status: "Building",
    statusClass: "building",
    name: "Fintech Controls Pack",
    desc: "Compliance regulatorio · CNBV / CONDUSEF",
    validation: "Aplicado en Fintech",
    version: "v0.9 beta",
    tiempo: "8 semanas",
    costo: "USD 55K"
  },
  {
    id: "FSO-04",
    status: "Building",
    statusClass: "building",
    name: "Legacy Migration Engine",
    desc: "Migración SAP / EBS / JDE / PS · Zero-downtime",
    validation: "En desarrollo",
    version: "v0.7 beta",
    tiempo: "12 semanas",
    costo: "USD 85K"
  },
  {
    id: "FSO-05",
    status: "Concept",
    statusClass: "concept",
    name: "Logistics Multi-CD Ops",
    desc: "Operación multi-CD multi-país · Trazabilidad fiscal",
    validation: "Diseño · Q3 2026",
    version: "spec",
    tiempo: "10 semanas",
    costo: "USD 75K"
  },
  {
    id: "FSO-06",
    status: "Concept",
    statusClass: "concept",
    name: "DR & Business Continuity",
    desc: "Disaster Recovery · RPO/RTO contractuales",
    validation: "Diseño · Q4 2026",
    version: "spec",
    tiempo: "6 semanas",
    costo: "USD 40K"
  }
];

export default function S09FabricOS() {
  const [ref, isInView] = useInViewOnce<HTMLElement>();
  const [openLayer, setOpenLayer] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const filteredFsos = activeFilter
    ? fsos.filter((fso) => fso.status === activeFilter)
    : fsos;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <section
      ref={ref}
      className={`demo-section s09 ${isInView ? 'is-in-view' : ''}`}
    >
      <div className="container">

        <div className="s09-intro">
          <div className="label">FABRIC OS</div>
          <h2>El sistema operativo de <em>cada proyecto.</em></h2>
          <p>Cuatro capas integradas. IP institucionalizada. Cada proyecto opera sobre la misma arquitectura — la entrega no depende del consultor.</p>
        </div>

        {/* Stack architecture */}
        <div className="os-stack-wrapper">
          <div className="os-stack">
            {layers.map((layer, index) => {
              const isOpen = openLayer === layer.num;
              return (
                <div
                  key={layer.num}
                  className={`os-stack-layer ${isOpen ? 'os-stack-layer--open' : ''}`}
                  onClick={() => setOpenLayer(isOpen ? null : layer.num)}
                  onMouseMove={handleMouseMove}
                  style={{ '--layer-index': index } as React.CSSProperties}
                >
                  {/* Spotlight */}
                  <div className="os-spotlight" />

                  {/* Left: number + dot */}
                  <div className="os-stack-num-col">
                    <span className="os-stack-num">{layer.num}</span>
                    <div className="os-stack-spine-dot" />
                  </div>

                  {/* Center: content */}
                  <div className="os-stack-content">
                    <div className="os-stack-header">
                      <div className="os-stack-name">{layer.name}</div>
                      <div className="os-stack-tag">{layer.tag}</div>
                    </div>

                    {isOpen && (
                      <div className="os-stack-detail">
                        {layer.desc}
                      </div>
                    )}
                  </div>

                  {/* Right: toggle — collapsed state */}
                  {!isOpen && (
                    <div className="os-stack-toggle">
                      <span className="os-toggle-arrow">▼</span>
                      <span className="os-toggle-label">Ver más</span>
                    </div>
                  )}

                  {/* Full-width close bar — open state */}
                  {isOpen && (
                    <div className="os-stack-close-bar">
                      <span>▲ Cerrar</span>
                    </div>
                  )}

                  {/* Depth decorators (top layer only) */}
                  <div className="os-stack-depth-1" />
                  <div className="os-stack-depth-2" />
                </div>
              );
            })}
          </div>
        </div>

        {/* FSO Engine */}
        <div id="fso-engine" className="fso-section">
          <div className="fso-section-header">
            <div>
              <div className="label" style={{ marginBottom: 12 }}>FSO Engine · Soluciones paquetizadas</div>
              <h3>IP nombrada y reutilizable. <em>Cada FSO, validable.</em></h3>
            </div>
            <div className="fso-legend">
              <button
                className={`fso-filter-tab all ${activeFilter === null ? 'active' : ''}`}
                onClick={() => setActiveFilter(null)}
              >
                Todos
              </button>
              <button
                className={`fso-filter-tab available ${activeFilter === 'Available' ? 'active' : ''}`}
                onClick={() => setActiveFilter('Available')}
              >
                Available
              </button>
              <button
                className={`fso-filter-tab building ${activeFilter === 'Building' ? 'active' : ''}`}
                onClick={() => setActiveFilter('Building')}
              >
                Building
              </button>
              <button
                className={`fso-filter-tab concept ${activeFilter === 'Concept' ? 'active' : ''}`}
                onClick={() => setActiveFilter('Concept')}
              >
                Concept
              </button>
            </div>
          </div>

          <div className="fso-grid">
            {filteredFsos.map((fso, index) => (
              <div
                className="fso-card"
                key={fso.id}
                onMouseMove={handleMouseMove}
                style={{ '--index': index } as React.CSSProperties}
              >
                <div className="fso-card-head">
                  <span className="fso-num">{fso.id}</span>
                  <span className={`status-badge ${fso.statusClass}`}>{fso.status}</span>
                </div>
                <div className="fso-name">{fso.name}</div>
                <div className="fso-desc">{fso.desc}</div>

                <div className="fso-card-meta">
                  <div className="fso-meta-item-clean">
                    <span className="fso-meta-label-clean">PLAZO:</span>
                    <span className="fso-meta-val-clean">{fso.tiempo}</span>
                  </div>
                  <div className="fso-meta-divider" />
                  <div className="fso-meta-item-clean">
                    <span className="fso-meta-label-clean">COSTO:</span>
                    <span className="fso-meta-val-clean fso-meta-val-accent">{fso.costo}</span>
                  </div>
                </div>

                <div className="fso-card-foot">
                  <span>{fso.validation}</span>
                  <span>{fso.version}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}

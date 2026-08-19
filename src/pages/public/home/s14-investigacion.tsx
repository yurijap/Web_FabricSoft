
import { useEffect, useState } from 'react';
import { api } from '../../../config/api';
import { useInViewOnce } from '../../../hooks/useInViewOnce';
import './s14-investigacion.css';


interface HomePaper {
  num: string;
  paperId: string;
  tag: string;
  title: string;
  abstract: string;
  toc: string[];
  meta: [string, string][];
}

const FALLBACK_PAPERS: HomePaper[] = [
  {
    num: "Paper 01",
    paperId: "01",
    tag: "Research Note · Mercado",
    title: "Por qué fallan los go-live de Oracle Fusion",
    abstract: "Análisis de 47 implementaciones LATAM. Tres patrones recurrentes de fracaso, causas raíz documentadas, modelo alternativo de entrega.",
    toc: ["El patrón \"abandono post go-live\"", "Los tres síntomas iniciales", "Modelo de entrega FABRIC"],
    meta: [["8-10 pp", "Páginas"], ["PDF · ES", "Formato"], ["15 min", "Lectura"], ["May 2026", "Publicado"]]
  },
  {
    num: "Paper 02",
    paperId: "02",
    tag: "Technical Framework · IA",
    title: "IA aplicada a cierre contable en Fusion Cloud",
    abstract: "Framework FABRIC con cuatro capas operativas. Casos de aplicación por industria. Arquitectura técnica reutilizable.",
    toc: ["Anatomía del cierre contable", "Capa de agentes IA aplicables", "Casos de éxito reales"],
    meta: [["10-12 pp", "Páginas"], ["PDF · ES", "Formato"], ["20 min", "Lectura"], ["May 2026", "Publicado"]]
  },
  {
    num: "Paper 03",
    paperId: "03",
    tag: "Doctrina Operativa · SOW",
    title: "Modelo de entrega en primer ciclo crítico",
    abstract: "La doctrina contractual de FABRIC, en cláusulas modelo. Aplicación práctica para CFO / CIO evaluando un RFP Oracle.",
    toc: ["Las 5 cláusulas doctrinales", "Cómo redactarlas en RFP", "Validación legal y contractual"],
    meta: [["6-8 pp", "Páginas"], ["PDF · ES", "Formato"], ["12 min", "Lectura"], ["May 2026", "Publicado"]]
  }
];

interface ApiCatalogPaper {
  paperId: string;
  titulo: string;
  subtitulo: string;
  tag: string;
  abstract: string;
  meta: string;
  visible?: boolean;
  orden: number;
  toc: string[];
}

export default function S14Investigacion() {
  const [ref, isInView] = useInViewOnce<HTMLElement>();
  const [papers, setPapers] = useState<HomePaper[]>(FALLBACK_PAPERS);

  useEffect(() => {
    if (!isInView) return;
    api.get('/papers/catalog')
      .then(res => {
        if (res.data?.ok && Array.isArray(res.data.data)) {
          // Filtrar los que están marcados como visibles
          const filtered = (res.data.data as ApiCatalogPaper[]).filter((p: ApiCatalogPaper) => p.visible !== false);
          if (filtered.length > 0) {
            setPapers(filtered.map((p: ApiCatalogPaper) => {
              const metaParts = p.meta ? p.meta.split('·').map((s: string) => s.trim()) : [];
              const metaLabels = ["Páginas", "Formato", "Lectura", "Publicado"];
              return {
                num: `Paper ${p.paperId}`,
                paperId: p.paperId,
                tag: p.tag,
                title: p.titulo,
                abstract: p.abstract,
                toc: Array.isArray(p.toc) ? p.toc : [],
                meta: metaParts.map((val: string, idx: number) => [val, metaLabels[idx] || "Info"] as [string, string]),
              };
            }));
          }
        }
      })
      .catch(err => {
        console.error('Error loading papers dynamic catalog:', err);
      });
  }, [isInView]);

  return (
    <section ref={ref} className={`demo-section s14 transition-all duration-1000 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
      <div className="container">
        <div className="s14-intro">
          <div className="label">Investigación</div>
          <h2>Lo que aprendemos en producción.<br /><span className="text-[#C9A96E]">Lo publicamos.</span></h2>
          <p>Papers técnicos descargables. Acceso requiere registro corporativo — no formulario marketing.</p>
        </div>

        <div className="research-grid">
          {papers.map((paper, index) => (
            <div className="research-card" data-interaction="paper" data-paper-index={index} role="button" tabIndex={0} key={paper.num}>
              <div className="research-num">{paper.num}</div>
              <div className="research-tag">{paper.tag}</div>
              <h4 className="research-title">{paper.title}</h4>
              <div className="research-abstract">{paper.abstract}</div>
              <ul className="research-toc">
                {paper.toc.map((item, idx) => <li data-n={`0${idx + 1}`} key={item}>{item}</li>)}
              </ul>
              <div className="research-meta">
                {paper.meta.map(([value, label]: [string, string]) => (
                  <div key={`${paper.num}-${label}`}><strong>{value}</strong>{label}</div>
                ))}
              </div>
              <button type="button" className="research-cta w-full cursor-pointer text-center" data-interaction="paper" data-paper-index={index}>
                Descargar paper →
              </button>
            </div>
          ))}
        </div>

        <div className="research-banner">
          <div>
            <div className="label">FABRIC Benchmark Index · Anual</div>
            <h3>El Estado de las Implementaciones Oracle Fusion en <span className="text-[#C9A96E]">México y LATAM 2026</span></h3>
            <p>Reporte anual. Tasa de fracaso real del mercado, razones más comunes, best practices para CFO/CTO en RFP de Oracle. Lanzamiento Q4 2026: registro abierto para early access.</p>
          </div>
          <button data-interaction="reference" className="btn-secondary cursor-pointer">Reservar early access →</button>
        </div>
      </div>
    </section>
  );
}

import { useEffect, useState } from 'react';
import { useInViewOnce } from '../../../hooks/useInViewOnce';
import { api } from '../../../config/api';

interface ReferenceItem {
  id?: string;
  numero: string;
  title: string;
  subtitle: string;
  vertical: string;
  langs: string[];
}

const fallbackReferences: ReferenceItem[] = [
  { numero: '01', title: 'CFO de operadora de centros comerciales', subtitle: 'México - USD 100M+ revenue - Multi-plaza', vertical: 'Inmobiliario', langs: ['ES'] },
  { numero: '02', title: 'CTO de institución financiera', subtitle: 'México - USD 300M+ revenue - Regulada', vertical: 'Serv. Financieros', langs: ['ES', 'EN'] },
  { numero: '03', title: 'CFO Controller de fintech regulada', subtitle: 'México - USD 80M+ revenue - Crédito al consumo', vertical: 'Serv. Financieros', langs: ['ES'] },
  { numero: '04', title: 'CISO / CTO de fintech de crédito al consumo', subtitle: 'México - USD 60M+ revenue - CNBV', vertical: 'Serv. Financieros', langs: ['ES', 'EN'] },
  { numero: '05', title: 'Director de Consultoría - Oracle ACS', subtitle: 'LATAM - Partner Oracle senior - Externo', vertical: 'Partner Oracle', langs: ['ES', 'EN'] },
];

export default function S12Referencias() {
  const [ref, isInView] = useInViewOnce<HTMLElement>();
  const [references, setReferences] = useState<ReferenceItem[]>(fallbackReferences);

  useEffect(() => {
    api.get('/referencias')
      .then(res => {
        if (Array.isArray(res.data.data) && res.data.data.length > 0) {
          setReferences(res.data.data);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <section ref={ref} id="s12" className={`demo-section s12 transition-all duration-1000 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
      <div className="container">
        <div className="s12-intro">
          <div className="label">Referencias Disponibles</div>
          <h2>Habla directamente con <span className="text-[#C9A96E]">ejecutivos</span><br />que operan con FABRIC.</h2>
          <p>La decisión de contratar Oracle Critical Engineering requiere validación directa. Cada semana abrimos una ventana limitada de referencias para prospectos calificados:</p>
        </div>

        <div className="refs-table">
          {references.map(({ id, numero, title, subtitle, vertical, langs }) => (
            <div className="refs-row" data-interaction="reference" role="button" tabIndex={0} key={id ?? numero}>
              <span className="refs-num">{numero}</span>
              <div className="refs-desc">
                {title}
                <small>{subtitle}</small>
              </div>
              <div className="refs-meta-group">
                <span className="refs-vertical">{vertical}</span>
                <div className="refs-lang">
                  <span className="active">ES</span>
                  <span className={langs.includes('EN') ? 'active' : undefined}>EN</span>
                </div>
                <span className="refs-action">Disponible</span>
              </div>
            </div>
          ))}
        </div>

        <div className="refs-footnote">
          El acceso a referencias forma parte del proceso de evaluación post-admisión inicial. La disponibilidad rota semanalmente y FABRIC realiza la introducción tras validar el ajuste estratégico de la conversación.
        </div>

        <div style={{ textAlign: 'center', marginTop: 48 }}>
          <button data-interaction="reference" className="btn-secondary">Iniciar evaluación</button>
        </div>
      </div>
    </section>
  );
}

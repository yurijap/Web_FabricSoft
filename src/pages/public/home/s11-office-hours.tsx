import { useInViewOnce } from '../../../hooks/useInViewOnce';
import OfficeHoursCalendar from '../../../components/OfficeHoursCalendar';

export default function S11OfficeHours() {
  const [ref, isInView] = useInViewOnce<HTMLElement>();

  return (
    <section ref={ref} id="s11" className={`demo-section s11 transition-all duration-1000 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
      <div className="container">
        <div className="office-hours">
          <div className="office-hours-text">
            <div className="label">FABRIC Office Hours</div>
            <h2 className="s11-heading-desktop">Conversaciones directas con <span className="text-[#C9A96E]">el fundador.</span></h2>
            <h2 className="s11-heading-mobile">Con <span className="text-[#C9A96E]">el fundador.</span></h2>
            <p className="s11-para-desktop">Una vez al mes, Julio Álvarez recibe cuatro conversaciones de 30 minutos con CFO/CTO de empresas evaluando iniciativas Oracle.</p>
            <p className="s11-para-mobile" style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>4 slots al mes. 30 min. CFO / CTO con iniciativa Oracle activa.</p>

            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--accent)', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 16 }}>
              Criterios de Acceso
            </div>
            <ul className="criteria-list">
              <li>Empresa USD 50M+ revenue anual</li>
              <li>Cargo CFO / CIO / CTO / Director Transformación</li>
              <li>Iniciativa Oracle activa o planeada</li>
              <li>Plazo de decisión menor a 12 meses</li>
            </ul>

            <div className="office-hours-prep">
              <strong>Preparación previa</strong>
              Llega con tu situación Oracle actual sintetizada: módulos en uso, problemática principal, plazo. Treinta minutos · honestidad absoluta.
            </div>

            <div style={{ marginTop: 32 }}>
              <span className="nda-seal">Confidencial · NDA mutuo</span>
            </div>
          </div>

          {isInView && <OfficeHoursCalendar />}
        </div>
      </div>
    </section>
  );
}

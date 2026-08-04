const industries = [
  {
    monogram: "S",
    num: "01 / Industria",
    name: <>Servicios<br />Financieros</>,
    desc: "Bancos, fintech y crédito al consumo. Compliance, continuidad operativa, cierre contable regulatorio.",
    pillars: [
      "Compliance CNBV / CONDUSEF / Banxico",
      "Cierre contable diario regulatorio",
      "Reportes regulatorios automatizados",
      "Continuidad operativa · RPO/RTO contractuales"
    ],
    client: "USD 100M – 500M+"
  },
  {
    monogram: "I",
    num: "02 / Industria",
    name: <>Inmobiliario y<br />Centros Comerciales</>,
    desc: "Operadores multi-plaza, multi-entidad. Revenue management, gestión de espacios, conciliación de rentas variables.",
    pillars: [
      "Multi-entidad · Multi-plaza consolidada",
      "Revenue management y rentas variables",
      "Conciliación de tenant billing",
      "Reportería ejecutiva por plaza / portafolio"
    ],
    client: "USD 50M – 300M"
  },
  {
    monogram: "L",
    num: "03 / Industria",
    name: <>Logística y<br />Distribución</>,
    desc: "Multi-CD, multi-país, multi-modal. Supply chain, trazabilidad fiscal, conciliación de transportes.",
    pillars: [
      "Multi-CD · Multi-país · Multi-modal",
      "Trazabilidad fiscal SAT/CFDI 4.0",
      "Conciliación de transportes y fletes",
      "Supply chain integrado a Fusion SCM"
    ],
    client: "USD 80M – 400M"
  }
];

import { useInViewOnce } from '../../../hooks/useInViewOnce';

export default function S08Industrias() {
  const [ref, isInView] = useInViewOnce<HTMLElement>();
  return (
    <section ref={ref} id="s08" className={`demo-section s08 transition-all duration-1000 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
      <div className="container">
        <div className="s08-intro">
          <div className="label">Industrias Focales</div>
          <h2>Tres verticales donde el ERP es <span className="text-[#C9A96E]">columna vertebral</span> de la operación crítica.</h2>
        </div>

        <div className="industries-grid">
          {industries.map((industry) => (
            <div className="industry-card" key={industry.num}>
              <div className="industry-monogram">{industry.monogram}</div>
              <div className="industry-num">{industry.num}</div>
              <div className="industry-name">{industry.name}</div>
              <div className="industry-desc">{industry.desc}</div>
              <ul className="industry-pillars">
                {industry.pillars.map((pillar) => <li key={pillar}>{pillar}</li>)}
              </ul>
              <div className="industry-footer">
                <span>Cliente típico</span>
                <span className="stat-val">{industry.client}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

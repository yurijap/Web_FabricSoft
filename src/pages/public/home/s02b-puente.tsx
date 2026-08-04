import { useState } from 'react';
import { useInViewOnce } from '../../../hooks/useInViewOnce';

const insights = [
  {
    id: '01',
    label: 'Go-live',
    title: 'El go-live no prueba estabilidad.',
    short: 'Solo prueba que el sistema encendió.',
    detail:
      'La mayoría celebra la salida a producción, pero el riesgo real aparece después: cierres pesados, reportes manuales, usuarios confundidos e incidencias abiertas.',
  },
  {
    id: '02',
    label: 'Operación',
    title: 'El primer cierre revela la verdad.',
    short: 'Ahí se ve si Oracle realmente opera.',
    detail:
      'FABRIC no mide éxito por pantallas entregadas. Lo mide cuando el primer ciclo crítico corre en producción sin improvisación, dependencia manual ni bloqueos ejecutivos.',
  },
  {
    id: '03',
    label: 'Contrato',
    title: 'La responsabilidad debe quedar escrita.',
    short: 'No como promesa. Como cláusula.',
    detail:
      'Nos quedamos hasta el primer cierre contable operado en producción. Si una falla operativa es atribuible a FABRIC, no la convertimos en una nueva venta.',
  },
];

export default function S02bPuente() {
  const [ref, isInView] = useInViewOnce<HTMLElement>();
  const [activeIndex, setActiveIndex] = useState(1);

  const active = insights[activeIndex];

  return (
    <section
      ref={ref}
      id="puente"
      style={{
        position: 'relative',
        overflow: 'hidden',
        background:
          'radial-gradient(circle at 18% 14%, rgba(201,169,110,0.055), transparent 32%), radial-gradient(circle at 84% 72%, rgba(82,161,218,0.09), transparent 34%), var(--bg-base)',
        borderTop: '1px solid rgba(255,255,255,0.075)',
        borderBottom: '1px solid rgba(255,255,255,0.075)',
        padding: 'clamp(88px, 9vw, 132px) 0',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          opacity: 0.22,
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.055) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.055) 1px, transparent 1px)',
          backgroundSize: '78px 78px',
        }}
      />

      <div
        style={{
          position: 'absolute',
          right: '7%',
          top: '12%',
          width: 260,
          height: 260,
          borderRadius: 999,
          background: 'rgba(201,169,110,0.055)',
          filter: 'blur(58px)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative',
          maxWidth: 1180,
          marginInline: 'auto',
          paddingInline: 'clamp(22px, 5vw, 56px)',
          opacity: isInView ? 1 : 0,
          transform: isInView ? 'translateY(0)' : 'translateY(36px)',
          transition: 'opacity 1000ms ease, transform 1000ms ease',
        }}
      >
        <div className="fabric-puente-grid">
          <div>
            <p className="fabric-puente-kicker">
              <span />
              Por qué FABRIC
            </p>

            <h2 className="fabric-puente-title">
              La mayoría entrega Oracle.
              <br />
              <em>FABRIC se queda cuando empieza el riesgo.</em>
            </h2>

            <p className="fabric-puente-copy">
              Una implementación no fracasa el día del go-live. Fracasa cuando el
              negocio intenta cerrar, reportar y operar sin depender de hojas
              paralelas, tickets urgentes o consultores que ya se fueron.
            </p>

            <div className="fabric-puente-proof">
              <div>
                <strong>90d</strong>
                <span>estabilización post go-live</span>
              </div>
              <div>
                <strong>1er</strong>
                <span>cierre crítico validado</span>
              </div>
              <div>
                <strong>0</strong>
                <span>riesgo sin dueño</span>
              </div>
            </div>
          </div>

          <div className="fabric-puente-panel">
            <div className="fabric-puente-panel-glow" />

            <div className="fabric-puente-tabs">
              {insights.map((item, index) => {
                const selected = activeIndex === index;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    className={selected ? 'is-active' : ''}
                  >
                    <span>{item.id}</span>
                    {item.label}
                  </button>
                );
              })}
            </div>

            <div key={active.id} className="fabric-puente-reveal">
              <p className="fabric-puente-eyebrow">
                {active.id} · {active.label}
              </p>

              <h3>{active.title}</h3>

              <p className="fabric-puente-short">{active.short}</p>

              <p className="fabric-puente-detail">{active.detail}</p>
            </div>

            <div className="fabric-puente-footer">
              <span>Primer cierre crítico</span>
              <span>Producción real</span>
              <span>Responsabilidad contractual</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .fabric-puente-grid {
          display: grid;
          grid-template-columns: minmax(0, 0.92fr) minmax(0, 1.08fr);
          gap: clamp(40px, 7vw, 96px);
          align-items: center;
        }

        .fabric-puente-kicker {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          margin: 0 0 30px;
          font-family: var(--mono);
          font-size: 9px;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: rgba(201,169,110,0.9);
        }

        .fabric-puente-kicker span {
          width: 7px;
          height: 7px;
          border-radius: 999px;
          background: #C9A96E;
          box-shadow: 0 0 16px rgba(201,169,110,0.55);
        }

        .fabric-puente-title {
          max-width: 760px;
          margin: 0;
          font-family: var(--serif);
          font-size: clamp(40px, 5.2vw, 78px);
          font-weight: 400;
          line-height: 0.95;
          letter-spacing: -0.06em;
          color: #F5F5F5;
        }

        .fabric-puente-title em {
          font-style: normal;
          color: #C9A96E;
          text-shadow: 0 0 26px rgba(201,169,110,0.12);
        }

        .fabric-puente-copy {
          max-width: 650px;
          margin: 30px 0 0;
          font-family: var(--sans);
          font-size: clamp(15px, 1.35vw, 18px);
          line-height: 1.85;
          color: rgba(245,245,245,0.66);
        }

        .fabric-puente-proof {
          margin-top: 36px;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          border: 1px solid rgba(255,255,255,0.095);
          background: rgba(7,25,47,0.82);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.035);
        }

        .fabric-puente-proof div {
          padding: 18px 16px;
          border-right: 1px solid rgba(255,255,255,0.075);
        }

        .fabric-puente-proof div:last-child {
          border-right: 0;
        }

        .fabric-puente-proof strong {
          display: block;
          font-family: var(--serif);
          font-size: 34px;
          font-weight: 400;
          line-height: 1;
          color: #C9A96E;
        }

        .fabric-puente-proof span {
          display: block;
          margin-top: 10px;
          font-family: var(--mono);
          font-size: 8px;
          line-height: 1.6;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(245,245,245,0.38);
        }

        .fabric-puente-panel {
          position: relative;
          overflow: hidden;
          min-height: 470px;
          border: 1px solid rgba(201,169,110,0.18);
          background:
            linear-gradient(145deg, rgba(201,169,110,0.06), rgba(14,39,71,0.96) 32%, rgba(7,25,47,0.99)),
            repeating-linear-gradient(90deg, rgba(255,255,255,0.018) 0, rgba(255,255,255,0.018) 1px, transparent 1px, transparent 72px);
          box-shadow:
            0 34px 90px rgba(3,12,26,0.42),
            inset 0 1px 0 rgba(255,255,255,0.04);
        }

        .fabric-puente-panel::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(circle at 78% 18%, rgba(201,169,110,0.095), transparent 30%),
            linear-gradient(90deg, transparent, rgba(201,169,110,0.045), transparent);
          opacity: 1;
        }

        .fabric-puente-panel::after {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          border: 1px solid rgba(255,255,255,0.035);
        }

        .fabric-puente-panel-glow {
          position: absolute;
          top: -130px;
          right: -120px;
          width: 320px;
          height: 320px;
          border-radius: 999px;
          background: rgba(201,169,110,0.08);
          filter: blur(54px);
          pointer-events: none;
        }

        .fabric-puente-tabs {
          position: relative;
          z-index: 2;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          border-bottom: 1px solid rgba(255,255,255,0.075);
          background: rgba(7,25,47,0.36);
        }

        .fabric-puente-tabs button {
          min-height: 86px;
          border: 0;
          border-right: 1px solid rgba(255,255,255,0.07);
          background: transparent;
          cursor: pointer;
          padding: 18px 16px;
          text-align: left;
          font-family: var(--mono);
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(245,245,245,0.42);
          transition:
            background 260ms ease,
            color 260ms ease,
            transform 260ms ease;
        }

        .fabric-puente-tabs button:last-child {
          border-right: 0;
        }

        .fabric-puente-tabs button:hover {
          color: rgba(245,245,245,0.86);
          background: rgba(255,255,255,0.032);
        }

        .fabric-puente-tabs button.is-active {
          color: #F5F5F5;
          background: linear-gradient(180deg, rgba(201,169,110,0.105), rgba(201,169,110,0.025));
        }

        .fabric-puente-tabs button span {
          display: block;
          margin-bottom: 12px;
          font-family: var(--serif);
          font-size: 28px;
          font-weight: 400;
          line-height: 1;
          color: #C9A96E;
        }

        .fabric-puente-reveal {
          position: relative;
          z-index: 2;
          padding: clamp(30px, 4.6vw, 58px);
          animation: fabricPuenteReveal 420ms cubic-bezier(.16,1,.3,1) both;
        }

        .fabric-puente-eyebrow {
          margin: 0 0 34px;
          font-family: var(--mono);
          font-size: 9px;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: rgba(201,169,110,0.92);
        }

        .fabric-puente-reveal h3 {
          max-width: 620px;
          margin: 0;
          font-family: var(--serif);
          font-size: clamp(32px, 4vw, 58px);
          font-weight: 400;
          line-height: 1.02;
          letter-spacing: -0.052em;
          color: #F5F5F5;
        }

        .fabric-puente-short {
          margin: 24px 0 0;
          font-family: var(--serif);
          font-size: clamp(21px, 2.4vw, 31px);
          line-height: 1.35;
          color: #C9A96E;
        }

        .fabric-puente-detail {
          max-width: 620px;
          margin: 22px 0 0;
          font-family: var(--sans);
          font-size: clamp(14px, 1.2vw, 17px);
          line-height: 1.85;
          color: rgba(245,245,245,0.62);
        }

        .fabric-puente-footer {
          position: absolute;
          z-index: 2;
          left: clamp(30px, 4.6vw, 58px);
          right: clamp(30px, 4.6vw, 58px);
          bottom: 28px;
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          padding-top: 22px;
          border-top: 1px solid rgba(255,255,255,0.075);
        }

        .fabric-puente-footer span {
          font-family: var(--mono);
          font-size: 8px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(245,245,245,0.36);
        }

        @keyframes fabricPuenteReveal {
          from {
            opacity: 0;
            transform: translateY(18px);
            filter: blur(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }

        @media (max-width: 960px) {
          .fabric-puente-grid {
            grid-template-columns: 1fr;
          }

          .fabric-puente-panel {
            min-height: 520px;
          }
        }

        @media (max-width: 640px) {
          .fabric-puente-proof {
            grid-template-columns: 1fr;
          }

          .fabric-puente-proof div {
            border-right: 0;
            border-bottom: 1px solid rgba(255,255,255,0.075);
          }

          .fabric-puente-proof div:last-child {
            border-bottom: 0;
          }

          .fabric-puente-tabs {
            grid-template-columns: 1fr;
          }

          .fabric-puente-tabs button {
            min-height: 72px;
            border-right: 0;
            border-bottom: 1px solid rgba(255,255,255,0.075);
          }

          .fabric-puente-tabs button:last-child {
            border-bottom: 0;
          }

          .fabric-puente-panel {
            min-height: 620px;
          }

          .fabric-puente-footer {
            position: relative;
            left: auto;
            right: auto;
            bottom: auto;
            margin: 0 clamp(30px, 4.6vw, 58px) 32px;
          }
        }
      `}</style>
    </section>
  );
}

import BackButton from '../../../components/BackButton';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../../config/api';

// ─── TIPOS ────────────────────────────────────────────────────────────────────

type Industria = 'financiero' | 'inmobiliario' | 'logistica' | '';
type PlazoDecision = '<3 meses' | '3-6 meses' | '6-12 meses' | '>12 meses' | '';

type FormData = {
  nombre: string;
  cargo: string;
  empresa: string;
  revenue: string;
  email: string;
  industria: Industria;
  iniciativa: string;
  plazo: PlazoDecision;
};

type Step = 1 | 2 | 3 | 4 | 5;

const INDUSTRIAS: { value: Industria; label: string; desc: string }[] = [
  { value: 'financiero',    label: 'Servicios Financieros / Fintech',       desc: 'Bancos, fintech, crédito al consumo, compliance CNBV' },
  { value: 'inmobiliario',  label: 'Inmobiliario / Centros Comerciales',    desc: 'Operadores multi-plaza, gestión de espacios, rentas variables' },
  { value: 'logistica',     label: 'Logística / Distribución / Transporte', desc: 'Multi-CD, trazabilidad fiscal, supply chain integrado' },
];

const PLAZOS: { value: PlazoDecision; label: string }[] = [
  { value: '<3 meses',   label: 'Menos de 3 meses — decisión inminente' },
  { value: '3-6 meses',  label: '3 a 6 meses' },
  { value: '6-12 meses', label: '6 a 12 meses' },
  { value: '>12 meses',  label: 'Más de 12 meses' },
];

const PUBLIC_DOMAINS = ['gmail', 'hotmail', 'yahoo', 'outlook', 'icloud', 'live', 'msn', 'me', 'proton'];

function isPublicEmail(email: string) {
  const domain = email.split('@')[1]?.split('.')[0]?.toLowerCase();
  return PUBLIC_DOMAINS.includes(domain ?? '');
}

// ─── COMPONENTES DE UI ────────────────────────────────────────────────────────

function ProgressBar({ step, total }: { step: Step; total: number }) {
  return (
    <div style={{ marginBottom: 48 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', letterSpacing: '0.22em', textTransform: 'uppercase' }}>
          {String(step).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-tertiary)', letterSpacing: '0.12em' }}>
          {step === total ? 'Último paso' : `${total - step} paso${total - step !== 1 ? 's' : ''} restante${total - step !== 1 ? 's' : ''}`}
        </span>
      </div>
      <div style={{ height: 1, background: 'var(--border)' }}>
        <div style={{ height: '100%', width: `${((step - 1) / (total - 1)) * 100}%`, background: 'var(--accent)', transition: 'width .4s ease' }} />
      </div>
    </div>
  );
}

function StepLabel({ children }: { children: string }) {
  return (
    <div className="label" style={{ marginBottom: 16 }}>{children}</div>
  );
}

function StepTitle({ children }: { children: string }) {
  return (
    <p style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(28px, 3.5vw, 42px)', lineHeight: 1.15, color: 'var(--text-primary)', marginBottom: 40, fontWeight: 400 }}>
      {children}
    </p>
  );
}

function TextInput({ label, value, onChange, placeholder, type = 'text', error }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; error?: string;
}) {
  return (
    <label style={{ display: 'block', marginBottom: 20 }}>
      <span style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 10 }}>
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          background: 'rgba(255,255,255,0.03)',
          border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
          padding: '14px 16px',
          fontFamily: 'var(--sans)',
          fontSize: 15,
          color: 'var(--text-primary)',
          outline: 'none',
          transition: 'border-color .2s',
        }}
        onFocus={e => { e.target.style.borderColor = error ? 'var(--danger)' : 'var(--accent)'; }}
        onBlur={e => { e.target.style.borderColor = error ? 'var(--danger)' : 'var(--border)'; }}
      />
      {error && (
        <span style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--danger)', letterSpacing: '0.15em', marginTop: 8 }}>
          {error}
        </span>
      )}
    </label>
  );
}

function Textarea({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <label style={{ display: 'block', marginBottom: 20 }}>
      <span style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 10 }}>
        {label}
      </span>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        style={{
          width: '100%',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid var(--border)',
          padding: '14px 16px',
          fontFamily: 'var(--sans)',
          fontSize: 15,
          color: 'var(--text-primary)',
          outline: 'none',
          resize: 'vertical',
          transition: 'border-color .2s',
        }}
        onFocus={e => { e.target.style.borderColor = 'var(--accent)'; }}
        onBlur={e => { e.target.style.borderColor = 'var(--border)'; }}
      />
    </label>
  );
}

function NavButtons({ onBack, onNext, nextLabel, disabled, showBack }: {
  onBack?: () => void; onNext: () => void; nextLabel?: string; disabled?: boolean; showBack?: boolean;
}) {
  return (
    <div style={{ display: 'flex', gap: 12, marginTop: 40 }}>
      {showBack && (
        <button onClick={onBack} style={{
          padding: '13px 24px', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.18em',
          textTransform: 'uppercase', background: 'transparent', border: '1px solid var(--border)',
          color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all .2s',
        }}>
          ← Anterior
        </button>
      )}
      <button onClick={onNext} disabled={disabled} style={{
          padding: '14px 36px', fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700,
          letterSpacing: '0.22em', textTransform: 'uppercase',
          background: disabled ? 'transparent' : 'var(--accent)',
          border: disabled ? '1px solid var(--border)' : 'none',
          color: disabled ? 'var(--text-tertiary)' : '#0A0A0A',
          cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all .2s',
          flexWrap: 'wrap'
        }}>
        {nextLabel ?? 'Continuar →'}
      </button>
    </div>
  );
}

// ─── PASOS ────────────────────────────────────────────────────────────────────

function Step1({ data, onChange, onNext }: { data: FormData; onChange: (k: keyof FormData, v: string) => void; onNext: () => void }) {
  const [error, setError] = useState('');
  const valid = data.nombre.trim().length >= 2 && data.cargo.trim().length >= 2;

  const handleNext = () => {
    if (!valid) { setError('Completa tu nombre y cargo para continuar.'); return; }
    setError('');
    onNext();
  };

  return (
    <div style={{ animation: 'fadeIn .3s ease' }}>
      <StepLabel>Paso 1 de 5 — Identidad</StepLabel>
      <StepTitle>¿Quién inicia esta conversación?</StepTitle>
      <div style={{ maxWidth: 560 }}>
        <TextInput label="Nombre completo" value={data.nombre} onChange={v => onChange('nombre', v)} placeholder="Julio Álvarez" />
        <TextInput label="Cargo" value={data.cargo} onChange={v => onChange('cargo', v)} placeholder="CFO · Director de Transformación · CTO" />
        {error && <p style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--danger)', letterSpacing: '0.15em', marginTop: -10, marginBottom: 16 }}>{error}</p>}
      </div>
      <NavButtons onNext={handleNext} disabled={!valid} />
    </div>
  );
}

function Step2({ data, onChange, onNext, onBack }: { data: FormData; onChange: (k: keyof FormData, v: string) => void; onNext: () => void; onBack: () => void }) {
  const [emailError, setEmailError] = useState('');
  const valid = data.empresa.trim().length >= 2 && data.email.trim().includes('@') && !emailError;


  const handleNext = () => {
    if (isPublicEmail(data.email)) {
      setEmailError('FABRIC trabaja con organizaciones. Usa tu correo corporativo.');
      return;
    }
    if (!valid) return;
    onNext();
  };

  return (
    <div style={{ animation: 'fadeIn .3s ease' }}>
      <StepLabel>Paso 2 de 5 — Organización</StepLabel>
      <StepTitle>¿Desde qué organización nos escribes?</StepTitle>
      <div style={{ maxWidth: 560 }}>
        <TextInput label="Empresa" value={data.empresa} onChange={v => onChange('empresa', v)} placeholder="APE Plazas · Aplazo · ALMEX" />
        <TextInput label="Revenue anual aproximado (USD)" value={data.revenue} onChange={v => onChange('revenue', v)} placeholder="USD 100M · USD 250M · USD 500M+" />
        <TextInput
          label="Correo corporativo"
          type="email"
          value={data.email}
          onChange={v => { onChange('email', v); setEmailError(''); }}
          placeholder="julio@tuempresa.com"
          error={emailError}
        />
        <p style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: '0.12em', marginTop: -12 }}>
          Solo dominios corporativos. Sin gmail, hotmail ni yahoo.
        </p>
      </div>
      <NavButtons onBack={onBack} onNext={handleNext} disabled={!valid} showBack />
    </div>
  );
}

function Step3({ data, onChange, onNext, onBack }: { data: FormData; onChange: (k: keyof FormData, v: string) => void; onNext: () => void; onBack: () => void }) {
  return (
    <div style={{ animation: 'fadeIn .3s ease' }}>
      <StepLabel>Paso 3 de 5 — Industria</StepLabel>
      <StepTitle>¿En qué vertical opera tu organización?</StepTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 640 }}>
        {INDUSTRIAS.map(ind => {
          const selected = data.industria === ind.value;
          return (
            <button key={ind.value} onClick={() => onChange('industria', ind.value)} style={{
              textAlign: 'left', padding: '20px 24px',
              background: selected ? 'rgba(201,169,110,0.08)' : 'rgba(255,255,255,0.02)',
              border: selected ? '1px solid var(--accent)' : '1px solid var(--border)',
              cursor: 'pointer', transition: 'all .2s',
            }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: selected ? 'var(--accent)' : 'var(--text-primary)', marginBottom: 6 }}>
                {ind.label}
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-tertiary)', letterSpacing: '0.06em' }}>
                {ind.desc}
              </div>
            </button>
          );
        })}
        <button key="otro" onClick={() => onChange('industria', 'otro' as Industria)} style={{
          textAlign: 'left', padding: '16px 24px',
          background: !['financiero','inmobiliario','logistica',''].includes(data.industria) ? 'rgba(201,169,110,0.05)' : 'rgba(255,255,255,0.01)',
          border: !['financiero','inmobiliario','logistica',''].includes(data.industria) ? '1px solid var(--accent)' : '1px solid var(--border-strong)',
          cursor: 'pointer', transition: 'all .2s',
        }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-secondary)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Otro sector
          </div>
        </button>
      </div>
      <NavButtons onBack={onBack} onNext={onNext} disabled={!data.industria} showBack />
    </div>
  );
}

function Step4({ data, onChange, onNext, onBack }: { data: FormData; onChange: (k: keyof FormData, v: string) => void; onNext: () => void; onBack: () => void }) {
  return (
    <div style={{ animation: 'fadeIn .3s ease' }}>
      <StepLabel>Paso 4 de 5 — Iniciativa Oracle</StepLabel>
      <StepTitle>¿Qué iniciativa Oracle está evaluando tu organización?</StepTitle>
      <div style={{ maxWidth: 640 }}>
        <Textarea
          label="Describe la iniciativa"
          value={data.iniciativa}
          onChange={v => onChange('iniciativa', v)}
          placeholder="Ejemplo: Rescate de implementación Oracle Fusion Cloud post go-live con incidencias críticas. Migración desde SAP EBS. Greenfield Oracle Fusion para nueva operación."
        />
        <p style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: '0.1em', marginTop: -8 }}>
          Más detalle = mejor calificación de tu caso.
        </p>
      </div>
      <NavButtons onBack={onBack} onNext={onNext} disabled={data.iniciativa.trim().length < 10} showBack />
    </div>
  );
}

function Step5({ data, onChange, onSubmit, onBack, submitting, submitError }: {
  data: FormData; onChange: (k: keyof FormData, v: string) => void;
  onSubmit: () => void; onBack: () => void;
  submitting?: boolean; submitError?: string;
}) {
  return (
    <div style={{ animation: 'fadeIn .3s ease' }}>
      <StepLabel>Paso 5 de 5 — Plazo</StepLabel>
      <StepTitle>¿En qué plazo toma tu organización la decisión?</StepTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 560 }}>
        {PLAZOS.map(p => {
          const selected = data.plazo === p.value;
          return (
            <button key={p.value} onClick={() => onChange('plazo', p.value)} style={{
              textAlign: 'left', padding: '16px 20px',
              background: selected ? 'rgba(201,169,110,0.08)' : 'rgba(255,255,255,0.02)',
              border: selected ? '1px solid var(--accent)' : '1px solid var(--border)',
              fontFamily: 'var(--mono)', fontSize: 12, letterSpacing: '0.1em',
              color: selected ? 'var(--accent)' : 'var(--text-secondary)',
              cursor: 'pointer', transition: 'all .2s', display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <span style={{ width: 14, height: 14, borderRadius: '50%', border: `1px solid ${selected ? 'var(--accent)' : 'var(--border)'}`, background: selected ? 'var(--accent)' : 'transparent', flexShrink: 0, transition: 'all .2s' }} />
              {p.label}
            </button>
          );
        })}
      </div>
      {submitError && (
        <p style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--danger)', letterSpacing: '0.15em', marginTop: 16 }}>
          {submitError}
        </p>
      )}
      <NavButtons onBack={onBack} onNext={onSubmit} nextLabel={submitting ? 'Enviando...' : 'Enviar solicitud →'} disabled={!data.plazo || submitting} showBack />
    </div>
  );
}

// ─── ESTADO FINAL ─────────────────────────────────────────────────────────────

function SuccessState({ data }: { data: FormData }) {
  const isPriority = ['financiero','inmobiliario','logistica'].includes(data.industria) && data.plazo === '<3 meses';

  return (
    <div style={{ maxWidth: 720, animation: 'fadeIn .5s ease' }}>
      <div className="label" style={{ marginBottom: 24 }}>Solicitud recibida</div>

      <p style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(32px, 4vw, 48px)', lineHeight: 1.1, color: 'var(--text-primary)', fontWeight: 400, marginBottom: 32 }}>
        {data.nombre.split(' ')[0]}, revisaremos tu caso en las próximas{' '}
        <span style={{ color: 'var(--accent)' }}>24 horas hábiles.</span>
      </p>

      <div style={{ border: '1px solid var(--border)', padding: '32px 40px', marginBottom: 40 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px 40px' }}>
          {[
            ['Nombre', data.nombre],
            ['Cargo', data.cargo],
            ['Empresa', data.empresa],
            ['Correo', data.email],
            ['Industria', INDUSTRIAS.find(i => i.value === data.industria)?.label ?? data.industria],
            ['Plazo', data.plazo],
          ].map(([k, v]) => (
            <div key={k}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 4 }}>{k}</div>
              <div style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--text-primary)' }}>{v}</div>
            </div>
          ))}
        </div>
        {data.iniciativa && (
          <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8 }}>Iniciativa</div>
            <div style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{data.iniciativa}</div>
          </div>
        )}
      </div>

      {isPriority && (
        <div style={{ border: '1px solid var(--accent)', borderLeft: '3px solid var(--accent)', padding: '16px 24px', marginBottom: 32, fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          ◆ Prioridad alta — iniciativa con plazo inmediato
        </div>
      )}

      <p style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-tertiary)', letterSpacing: '0.12em', lineHeight: 1.8 }}>
        Conversación bajo NDA mutuo desde el primer contacto. Si tu caso califica, agendaremos una sesión técnica directamente con Julio Álvarez.
      </p>

      <div style={{ marginTop: 40 }}>
        <Link to="/" className="btn-secondary" style={{ display: 'inline-flex' }}>
          ← Volver al inicio
        </Link>
      </div>
    </div>
  );
}

// ─── PÁGINA PRINCIPAL ─────────────────────────────────────────────────────────

const INITIAL: FormData = { nombre: '', cargo: '', empresa: '', revenue: '', email: '', industria: '', iniciativa: '', plazo: '' };

export default function AplicarPage() {
  const [step, setStep] = useState<Step>(1);
  const [data, setData] = useState<FormData>(INITIAL);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const update = (k: keyof FormData, v: string) => setData(d => ({ ...d, [k]: v }));
  const next = () => setStep(s => Math.min(s + 1, 5) as Step);
  const back = () => setStep(s => Math.max(s - 1, 1) as Step);

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError('');
    try {
      await api.post('/leads/solicitar', data);
      setSubmitted(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setSubmitError(msg || 'Error al enviar la solicitud. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 64 }}>
      <div className="apply-back-row" style={{ maxWidth: 1280, margin: '0 auto', padding: '0 56px' }}>
        <BackButton />
      </div>
      {/* Header de la página */}
      <div className="apply-page-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 48, marginBottom: 64, textAlign: 'center' }}>
        <div className="label" style={{ marginBottom: 20 }}>Wait List · FABRIC</div>
        <div className="grid-2col" style={{ alignItems: 'end' }}>
          <div>
            <h1 className="apply-page-title" style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: 300, lineHeight: 1.05, color: 'var(--text-primary)', marginBottom: 20 }}>Aplicar a FABRIC</h1>
            <p className="apply-page-copy" style={{ fontFamily: 'var(--sans)', fontSize: 16, color: 'var(--text-secondary)', maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>Operamos con un máximo de 12 proyectos simultáneos. Si tu organización califica, conversamos.</p>
          </div>
          <div></div>
        </div>
      </div>

      <div className="apply-page-main grid-2col" style={{ gap: '48px' }}>

        {/* Formulario wizard */}
        <div>
          {!submitted ? (
            <>
              <ProgressBar step={step} total={5} />
              {step === 1 && <Step1 data={data} onChange={update} onNext={next} />}
              {step === 2 && <Step2 data={data} onChange={update} onNext={next} onBack={back} />}
              {step === 3 && <Step3 data={data} onChange={update} onNext={next} onBack={back} />}
              {step === 4 && <Step4 data={data} onChange={update} onNext={next} onBack={back} />}
              {step === 5 && <Step5 data={data} onChange={update} onSubmit={handleSubmit} onBack={back} submitting={submitting} submitError={submitError} />}
            </>
          ) : (
            <SuccessState data={data} />
          )}
        </div>

        {/* Panel lateral — criterios de admisión */}
        <aside style={{ position: 'sticky', top: 120, border: '1px solid var(--border)', padding: '32px 28px' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 24 }}>
            Criterios de admisión
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, borderTop: '1px solid var(--border)' }}>
            {[
              'Facturación > USD 50M anuales',
              'Industria: Financiero, Inmobiliario o Logística',
              'Iniciativa Oracle con decisión en < 6 meses',
              'Patrocinio activo CFO + CTO',
            ].map((c, i) => (
              <div key={i} style={{ padding: '14px 0', borderBottom: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--accent)', fontFamily: 'var(--mono)', fontSize: 12, marginTop: 2, flexShrink: 0 }}>✓</span>
                <span style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>{c}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 28, padding: '16px 20px', background: 'rgba(201,169,110,0.04)', border: '1px solid rgba(201,169,110,0.2)' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8 }}>
              Respuesta
            </div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 20, color: 'var(--text-primary)' }}>
              24 horas hábiles
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: '0.12em', marginTop: 6 }}>
              Conversación bajo NDA mutuo desde el primer contacto
            </div>
          </div>

          <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 12 }}>
              Criterios de exclusión
            </div>
            {[
              'Sin compliance regulatorio formal',
              'Staff augmentation o body shopping',
              'Soporte preventivo simple',
              'Sin patrocinio ejecutivo activo',
            ].map((e, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
                <span style={{ color: 'var(--danger)', fontFamily: 'var(--mono)', fontSize: 11, flexShrink: 0 }}>⊗</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: '0.06em', lineHeight: 1.6 }}>{e}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

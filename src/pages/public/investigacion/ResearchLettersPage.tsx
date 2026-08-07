import { useState } from 'react';
import BackButton from '../../../components/BackButton';
import { api } from '../../../config/api';
import { getInteractionTracking } from '../../../utils/tracking';

const initialForm = {
  nombre: '',
  cargo: '',
  empresa: '',
  email: '',
  revenueAprox: 'No especificado',
  iniciativaOracle: 'evaluando',
  industria: '',
};

export default function ResearchLettersPage() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    if (!form.nombre.trim() || !form.cargo.trim() || !form.empresa.trim() || !form.email.trim()) {
      setError('Completa nombre, cargo, empresa y email.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/research-letters/solicitar', {
        ...form,
        tracking: getInteractionTracking('S14', 'research-letter'),
      });
      setSent(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg ?? 'No se pudo registrar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: 'var(--bg-base)', paddingTop: 100 }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 56px 0' }}>
        <BackButton />
      </div>

      <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 64 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 56px' }}>
          <div className="label" style={{ marginBottom: 20 }}>Editorial · FABRIC</div>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(40px, 5vw, 72px)', fontWeight: 300, color: 'var(--text-primary)', lineHeight: 1.02, marginBottom: 24 }}>
            Research Letters.<br /><em style={{ color: 'var(--accent)', fontStyle: 'italic' }}>Membresía editorial cerrada.</em>
          </h1>
          <p style={{ fontFamily: 'var(--sans)', fontSize: 17, color: 'var(--text-secondary)', lineHeight: 1.75, maxWidth: 560 }}>
            Cartas ejecutivas para CFO, CIO y CTO evaluando rescates, migraciones y gobierno Oracle. Cupo cerrado, distribución privada y acceso solo con correo corporativo.
          </p>
          <div style={{ marginTop: 16, fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            Membresía cerrada · Solicitud calificada
          </div>
        </div>
      </div>

      <div className="container grid-2col" style={{ gap: 36, padding: '48px 56px 96px' }}>
        <div style={{ border: '1px solid var(--border)', padding: 28, background: 'rgba(255,255,255,0.01)' }}>
          <div className="label" style={{ marginBottom: 18 }}>Admission Gate</div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 28, color: 'var(--text-primary)', marginBottom: 14 }}>
            Acceso por perfil operativo.
          </div>
          <p style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.8, margin: 0 }}>
            La solicitud registra datos de calificación para que el admin pueda aprobar, rechazar o mantener en espera sin perder contexto: cargo, tamaño de compañía, tipo de iniciativa Oracle e industria.
          </p>
        </div>

        <div style={{ border: '1px solid var(--border-strong)', padding: 28, background: 'var(--bg-panel)' }}>
          {!sent ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {([
                ['nombre', 'Nombre completo', 'text'],
                ['cargo', 'Cargo', 'text'],
                ['empresa', 'Empresa', 'text'],
                ['email', 'Email corporativo', 'email'],
                ['industria', 'Industria', 'text'],
              ] as const).map(([field, label, type]) => (
                <div key={field}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
                  <input
                    type={type}
                    value={form[field]}
                    onChange={e => setForm(prev => ({ ...prev, [field]: e.target.value }))}
                    style={{ width: '100%', padding: '12px 14px', background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontFamily: 'var(--mono)', fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              ))}

              <div className="grid-2col" style={{ gap: 10 }}>
                <select value={form.revenueAprox} onChange={e => setForm(prev => ({ ...prev, revenueAprox: e.target.value }))}
                  style={{ padding: '12px 14px', background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontFamily: 'var(--mono)', fontSize: 12 }}>
                  <option>No especificado</option>
                  <option>USD 50M-250M</option>
                  <option>USD 250M-1B</option>
                  <option>Más de USD 1B</option>
                </select>
                <select value={form.iniciativaOracle} onChange={e => setForm(prev => ({ ...prev, iniciativaOracle: e.target.value }))}
                  style={{ padding: '12px 14px', background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontFamily: 'var(--mono)', fontSize: 12 }}>
                  <option value="activa">Activa</option>
                  <option value="planeada">Planeada</option>
                  <option value="evaluando">Evaluando</option>
                </select>
              </div>

              {error && <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#B85450' }}>{error}</div>}
              <button disabled={loading} onClick={submit} style={{ marginTop: 4, padding: '13px 18px', background: loading ? 'rgba(201,169,110,0.5)' : 'var(--accent)', color: 'var(--bg-base)', border: 'none', fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: loading ? 'wait' : 'pointer' }}>
                {loading ? 'Registrando...' : 'Solicitar acceso'}
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 32, color: 'var(--accent)', marginBottom: 12 }}>Solicitud recibida.</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                El admin revisará el perfil y responderá en {form.email || 'tu email corporativo'}.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

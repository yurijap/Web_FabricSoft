import BackButton from '../../../components/BackButton';
import { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { api } from '../../../config/api';

const FALLBACK_PAPERS = [
  {
    paperId: '01',
    num: '01',
    titulo: 'Por qué fallan los go-live de Oracle Fusion',
    subtitulo: 'Research Note · FABRIC · 2026',
  },
  {
    paperId: '02',
    num: '02',
    titulo: 'IA aplicada a cierre contable en Fusion Cloud',
    subtitulo: 'Research Note · FABRIC · 2026',
  },
  {
    paperId: '03',
    num: '03',
    titulo: 'Modelo de entrega en primer ciclo crítico',
    subtitulo: 'Research Note · FABRIC · 2026',
  },
];

interface Paper {
  paperId: string;
  num: string;
  titulo: string;
  subtitulo: string;
  tag?: string;
  abstract?: string;
  meta?: string;
  toc?: string[];
}

export default function PaperPage() {
  const { num } = useParams<{ num: string }>();
  const [prevNum, setPrevNum] = useState<string | undefined>(undefined);
  const [paper, setPaper] = useState<Paper | null>(null);
  const [loadingPaper, setLoadingPaper] = useState(true);
  const [form, setForm] = useState({ nombre: '', cargo: '', empresa: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  if (num !== prevNum) {
    setPrevNum(num);
    setLoadingPaper(true);
    setPaper(null);
    setError('');
    setMessage('');
  }

  useEffect(() => {
    api.get(`/papers/catalog/${num}`)
      .then(res => {
        if (res.data?.ok && res.data.data) {
          setPaper({
            ...res.data.data,
            num: res.data.data.paperId,
          });
        } else {
          const fallback = FALLBACK_PAPERS.find(p => p.paperId === num);
          if (fallback) setPaper(fallback);
        }
      })
      .catch(() => {
        const fallback = FALLBACK_PAPERS.find(p => p.paperId === num);
        if (fallback) setPaper(fallback);
      })
      .finally(() => {
        setLoadingPaper(false);
      });
  }, [num]);

  if (loadingPaper) {
    return (
      <div style={{ background: 'var(--bg-base)', paddingTop: 100, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Cargando paper...</div>
      </div>
    );
  }

  if (!paper) return <Navigate to="/#investigacion" replace />;

  async function requestPaper() {
    if (!paper) return;
    setError('');
    setMessage('');
    if (!form.cargo.trim() || !form.empresa.trim() || !form.email.trim()) {
      setError('Cargo, empresa y email corporativo son requeridos.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/papers/solicitar', {
        paperId: paper.paperId || paper.num,
        nombre: form.nombre,
        cargo: form.cargo,
        empresa: form.empresa,
        email: form.email,
        tracking: {
          sourceSection: 'PaperPage',
          interactionType: 'paper-download',
          pagePath: `/papers/${paper.paperId || paper.num}`,
        },
      });

      const downloadUrl = res.data?.downloadUrl;
      if (downloadUrl) {
        window.location.href = `${api.defaults.baseURL}${downloadUrl}`;
      }
      setMessage('Datos registrados. La descarga del PDF debe iniciar automáticamente.');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg ?? 'No pudimos registrar la solicitud. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ background: 'var(--bg-base)', paddingTop: 100 }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 56px 0' }}>
        <BackButton />
      </div>
      <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 64 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 56px' }}>
          <div className="label" style={{ marginBottom: 20 }}>Paper {paper.paperId || paper.num} · FABRIC Research</div>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(40px, 5vw, 64px)', fontWeight: 300, color: 'var(--text-primary)', lineHeight: 1.1, marginBottom: 24 }}>
            {paper.titulo}
          </h1>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 24 }}>
            {paper.subtitulo}
          </div>
          <p style={{ fontFamily: 'var(--sans)', fontSize: 17, color: 'var(--text-secondary)', lineHeight: 1.75, maxWidth: 560 }}>
            {paper.abstract || 'Nota técnica para equipos ejecutivos que necesitan decidir con evidencia, no con promesas de implementación. El acceso completo requiere registro corporativo.'}
          </p>
          <div style={{ marginTop: 16, fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            Descarga inmediata con registro · Correo corporativo requerido
          </div>
        </div>
      </div>
      <div style={{ maxWidth: 760, margin: '80px auto', padding: '0 56px' }}>
        <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', padding: 40 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 24 }}>
            Solicitar descarga
          </div>
          <p style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: 24 }}>
            El PDF se descarga al registrar tus datos. La solicitud queda visible en el admin para seguimiento comercial y control de acceso.
          </p>
          <div style={{ display: 'grid', gap: 12 }}>
            {([
              ['nombre', 'Nombre'],
              ['cargo', 'Cargo'],
              ['empresa', 'Empresa'],
              ['email', 'Email corporativo'],
            ] as const).map(([key, label]) => (
              <label key={key} style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                  {label}
                </span>
                <input
                  type={key === 'email' ? 'email' : 'text'}
                  value={form[key]}
                  onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                  style={{ width: '100%', padding: '12px 14px', background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontFamily: 'var(--mono)', fontSize: 12, outline: 'none' }}
                />
              </label>
            ))}
          </div>
          {error && <div style={{ marginTop: 16, fontFamily: 'var(--mono)', fontSize: 10, color: '#B85450', letterSpacing: '0.08em' }}>{error}</div>}
          {message && <div style={{ marginTop: 16, fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', letterSpacing: '0.08em', lineHeight: 1.6 }}>{message}</div>}
          <button
            disabled={loading}
            onClick={requestPaper}
            style={{ marginTop: 22, display: 'inline-block', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--bg-base)', background: loading ? 'rgba(201,169,110,0.55)' : 'var(--accent)', padding: '14px 32px', border: 'none', cursor: loading ? 'wait' : 'pointer' }}
          >
            {loading ? 'Registrando...' : 'Descargar PDF →'}
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useAuthApi } from '../../config/api';

type PaperStatus = 'descargado' | 'pendiente' | 'enviado' | 'bloqueado';
type Tab = 'papers' | 'benchmark' | 'catalog';

interface PaperAccess {
  _id: string;
  paperId: string;
  nombre?: string;
  email: string;
  cargo: string;
  empresa: string;
  tracking?: { sourceSection?: string; interactionType?: string; pagePath?: string };
  status: PaperStatus;
  emailSent: boolean;
  createdAt: string;
}

interface BenchmarkAccess {
  _id: string;
  nombre: string;
  empresa: string;
  email: string;
  tracking?: { sourceSection?: string; interactionType?: string; pagePath?: string };
  status: string;
  createdAt: string;
}

interface CatalogPaper {
  paperId: string;
  titulo: string;
  subtitulo: string;
  tag: string;
  abstract: string;
  meta: string;
  visible: boolean;
  orden: number;
  toc: string[];
}

const STATUS_COLOR: Record<PaperStatus, string> = {
  descargado: '#C9A96E',
  pendiente: '#C9A96E',
  enviado:   '#4ade80',
  bloqueado: '#B85450',
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function AdminPapers() {
  const adminApi = useAuthApi();
  const [tab, setTab]               = useState<Tab>('papers');
  const [papers, setPapers]         = useState<PaperAccess[]>([]);
  const [benchmark, setBenchmark]   = useState<BenchmarkAccess[]>([]);
  const [catalogPapers, setCatalogPapers] = useState<CatalogPaper[]>([]);
  const [editingPaper, setEditingPaper] = useState<CatalogPaper | null>(null);
  const [isNewPaper, setIsNewPaper] = useState(false);
  const [savingCatalog, setSavingCatalog] = useState(false);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(true);
  const [filterPaper, setFilterPaper] = useState<string>('Todos');
  const [filterStatus, setFilterStatus] = useState<string>('Todos');
  const [updating, setUpdating]     = useState<string | null>(null);
  const [uploadingPaper, setUploadingPaper] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState('');

  useEffect(() => {
    fetchPapers();
    fetchBenchmark();
    fetchCatalog();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchPapers() {
    setLoading(true);
    try {
      const res = await adminApi.get('/papers/admin');
      setPapers(res.data.data);
      setTotal(res.data.total);
    } catch {
      console.error('Error cargando papers');
    } finally {
      setLoading(false);
    }
  }

  async function fetchBenchmark() {
    try {
      const res = await adminApi.get('/papers/admin/benchmark');
      setBenchmark(res.data.data);
    } catch {
      console.error('Error cargando benchmark');
    }
  }

  async function fetchCatalog() {
    try {
      const res = await adminApi.get('/papers/admin/catalog');
      setCatalogPapers(res.data.data);
    } catch {
      console.error('Error cargando catálogo');
    }
  }

  async function handleStatusChange(id: string, status: PaperStatus) {
    setUpdating(id);
    try {
      const res = await adminApi.patch(`/papers/admin/${id}/status`, { status });
      setPapers(prev => prev.map(p => p._id === id ? res.data.data : p));
    } catch {
      console.error('Error actualizando status');
    } finally {
      setUpdating(null);
    }
  }

  async function handlePdfUpload(paperId: string, file?: File) {
    if (!file) return;
    setUploadingPaper(paperId);
    setUploadMessage('');
    try {
      const form = new FormData();
      form.append('pdf', file);
      await adminApi.post(`/papers/admin/${paperId}/pdf`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadMessage(`PDF del Paper ${paperId} actualizado.`);
    } catch {
      setUploadMessage(`No se pudo subir el PDF del Paper ${paperId}.`);
    } finally {
      setUploadingPaper(null);
    }
  }

  async function handleSavePaper(e: React.FormEvent) {
    e.preventDefault();
    if (!editingPaper) return;
    if (!editingPaper.paperId || !editingPaper.titulo) {
      alert('El ID y el Título son requeridos.');
      return;
    }
    setSavingCatalog(true);
    try {
      let newCatalog = [];
      const cleanPaper = {
        ...editingPaper,
        toc: Array.isArray(editingPaper.toc) 
          ? editingPaper.toc.map((t: string) => t.trim()).filter(Boolean)
          : []
      };

      if (isNewPaper) {
        if (catalogPapers.some(p => p.paperId === cleanPaper.paperId)) {
          alert(`El ID de paper "${cleanPaper.paperId}" ya existe.`);
          setSavingCatalog(false);
          return;
        }
        newCatalog = [...catalogPapers, cleanPaper];
      } else {
        newCatalog = catalogPapers.map(p => p.paperId === cleanPaper.paperId ? cleanPaper : p);
      }
      
      const res = await adminApi.put('/papers/admin/catalog', { papers: newCatalog });
      setCatalogPapers(res.data.data);
      setEditingPaper(null);
      setUploadMessage('Catálogo guardado correctamente.');
    } catch (err) {
      console.error('Error al guardar el catálogo', err);
      alert('Error al guardar el catálogo.');
    } finally {
      setSavingCatalog(false);
    }
  }

  async function handleDeletePaper(paperId: string) {
    if (!confirm(`¿Estás seguro de eliminar el Paper ${paperId}?`)) return;
    setSavingCatalog(true);
    try {
      const newCatalog = catalogPapers.filter(p => p.paperId !== paperId);
      const res = await adminApi.put('/papers/admin/catalog', { papers: newCatalog });
      setCatalogPapers(res.data.data);
      setUploadMessage('Paper eliminado del catálogo.');
    } catch (err) {
      console.error('Error al eliminar paper', err);
      alert('Error al eliminar paper.');
    } finally {
      setSavingCatalog(false);
    }
  }

  const getPaperLabel = (id: string) => {
    const found = catalogPapers.find(p => p.paperId === id);
    return found ? `Paper ${id} — ${found.titulo}` : `Paper ${id}`;
  };

  const visiblePapers = papers.filter(p => {
    const byPaper  = filterPaper  === 'Todos' || p.paperId === filterPaper;
    const byStatus = filterStatus === 'Todos' || p.status  === filterStatus;
    return byPaper && byStatus;
  });

  return (
      <div className="fabric-admin-page">
      <div className="fabric-admin-hero">
        <div className="fabric-admin-hero-inner">
          <div>
            <div className="fabric-admin-eyebrow">FABRIC · ADMIN · INVESTIGACION</div>
            <h1 className="fabric-admin-title">Papers</h1>
            <div className="fabric-admin-subtitle">{total} solicitudes · entregas bajo tracking · benchmark early access separado.</div>
          </div>
          <div className="fabric-admin-actions">
            <span className="fabric-admin-pill">{papers.length} papers · {benchmark.length} benchmark · {catalogPapers.length} catálogo</span>
            <button
              onClick={() => {
                fetchPapers();
                fetchBenchmark();
                fetchCatalog();
              }}
              style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', padding: '9px 18px', background: 'transparent', border: '1px solid #252525', color: '#8A8A8A', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Actualizar
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid #1a1a1a' }}>
        {(['papers', 'benchmark', 'catalog'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '14px 28px', background: 'transparent', border: 'none',
              fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase',
              color: tab === t ? '#C9A96E' : '#5A5A5A',
              borderBottom: `2px solid ${tab === t ? '#C9A96E' : 'transparent'}`,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            {t === 'papers' ? `Solicitudes (${papers.length})` : t === 'benchmark' ? `Benchmark Early Access (${benchmark.length})` : `Catálogo de Papers (${catalogPapers.length})`}
          </button>
        ))}
      </div>

      {tab === 'papers' && (
        <>
          <div style={{ padding: '16px 36px', display: 'flex', gap: 16, borderBottom: '1px solid #1a1a1a', flexWrap: 'wrap', alignItems: 'center' }}>
            {['Todos', ...catalogPapers.map(p => p.paperId)].map(f => (
              <button
                key={f}
                onClick={() => setFilterPaper(f)}
                style={{
                  fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', padding: '5px 12px',
                  background: filterPaper === f ? 'rgba(201,169,110,0.1)' : 'transparent',
                  border: `1px solid ${filterPaper === f ? '#C9A96E' : '#252525'}`,
                  color: filterPaper === f ? '#C9A96E' : '#5A5A5A', cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                {f === 'Todos' ? 'Todos los papers' : getPaperLabel(f).split(' — ')[0]}
              </button>
            ))}
            <div style={{ width: 1, background: '#1e1e1e', height: 20 }} />
            {(['Todos', 'descargado', 'pendiente', 'enviado', 'bloqueado'] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                style={{
                  fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', padding: '5px 12px',
                  background: 'transparent', border: 'none',
                  color: filterStatus === s ? '#F5F5F5' : '#3A3A3A',
                  borderBottom: `1px solid ${filterStatus === s ? '#C9A96E' : 'transparent'}`,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                {s}
              </button>
            ))}
          </div>

          <div style={{ padding: '16px 36px', borderBottom: '1px solid #1a1a1a', display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 9, letterSpacing: '0.16em', color: '#5A5A5A', textTransform: 'uppercase' }}>
              PDFs de entrega
            </span>
            {catalogPapers.map(p => (
              <label key={p.paperId} style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', padding: '7px 12px', border: '1px solid #252525', color: uploadingPaper === p.paperId ? '#C9A96E' : '#8A8A8A', cursor: uploadingPaper ? 'wait' : 'pointer' }}>
                {uploadingPaper === p.paperId ? 'Subiendo...' : `Subir/Reemplazar PDF ${p.paperId}`}
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  disabled={Boolean(uploadingPaper)}
                  onChange={e => handlePdfUpload(p.paperId, e.target.files?.[0])}
                  style={{ display: 'none' }}
                />
              </label>
            ))}
            {uploadMessage && (
              <span style={{ fontSize: 9, letterSpacing: '0.1em', color: uploadMessage.startsWith('No') ? '#B85450' : '#C9A96E' }}>
                {uploadMessage}
              </span>
            )}
          </div>

          <div className="fabric-admin-content" style={{ overflowX: 'auto' }}>
            {loading ? (
              <div style={{ padding: '48px 0', textAlign: 'center', fontSize: 11, color: '#5A5A5A' }}>Cargando...</div>
            ) : visiblePapers.length === 0 ? (
              <div style={{ padding: '48px 0', textAlign: 'center', fontSize: 11, color: '#5A5A5A' }}>Sin solicitudes con este filtro.</div>
            ) : (
              <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1a1a1a' }}>
                    {['Fecha', 'Paper', 'Empresa', 'Contacto', 'Cargo', 'Origen', 'Estado', 'Acciones'].map(h => (
                      <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: 8, letterSpacing: '0.2em', color: '#3A3A3A', textTransform: 'uppercase', fontWeight: 400 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visiblePapers.map(p => (
                    <tr key={p._id} style={{ borderBottom: '1px solid #111' }}>
                      <td style={{ padding: '12px 16px', fontSize: 10, color: '#5A5A5A', whiteSpace: 'nowrap' }}>{fmt(p.createdAt)}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: 9, padding: '3px 8px', border: '1px solid #252525', color: '#C9A96E', letterSpacing: '0.1em' }}>
                          Paper {p.paperId}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 11, color: '#F5F5F5' }}>{p.empresa}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontSize: 10, color: '#F5F5F5' }}>{p.nombre || 'Sin nombre'}</div>
                        <div style={{ fontSize: 9, color: '#5A5A5A' }}>{p.email}</div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 10, color: '#8A8A8A' }}>{p.cargo}</td>
                      <td style={{ padding: '12px 16px', fontSize: 10, color: '#8A8A8A' }}>{[p.tracking?.sourceSection, p.tracking?.interactionType].filter(Boolean).join(' · ') || p.email}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: 8, letterSpacing: '0.16em', textTransform: 'uppercase', padding: '3px 10px', border: `1px solid ${STATUS_COLOR[p.status]}44`, color: STATUS_COLOR[p.status], background: `${STATUS_COLOR[p.status]}10` }}>
                          {p.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {p.status !== 'enviado' && (
                            <button
                              disabled={updating === p._id}
                              onClick={() => handleStatusChange(p._id, 'enviado')}
                              style={{ fontSize: 8, padding: '4px 10px', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', color: '#4ade80', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.1em' }}
                            >
                              Marcar enviado
                            </button>
                          )}
                          {p.status !== 'bloqueado' && (
                            <button
                              disabled={updating === p._id}
                              onClick={() => handleStatusChange(p._id, 'bloqueado')}
                              style={{ fontSize: 8, padding: '4px 10px', background: 'transparent', border: '1px solid #B85450', color: '#B85450', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.1em' }}
                            >
                              Bloquear
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {tab === 'benchmark' && (
        <div className="fabric-admin-content" style={{ overflowX: 'auto' }}>
          <div style={{ padding: '20px 0 16px', fontSize: 10, color: '#5A5A5A', letterSpacing: '0.14em' }}>
            {benchmark.length} registros para Benchmark Index · Q4 2026
          </div>
          {benchmark.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', fontSize: 11, color: '#5A5A5A' }}>Sin registros aún.</div>
          ) : (
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1a1a1a' }}>
                  {['Fecha', 'Nombre', 'Empresa', 'Email', 'Origen', 'Estado'].map(h => (
                    <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: 8, letterSpacing: '0.2em', color: '#3A3A3A', textTransform: 'uppercase', fontWeight: 400 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {benchmark.map(b => (
                  <tr key={b._id} style={{ borderBottom: '1px solid #111' }}>
                    <td style={{ padding: '12px 16px', fontSize: 10, color: '#5A5A5A', whiteSpace: 'nowrap' }}>{fmt(b.createdAt)}</td>
                    <td style={{ padding: '12px 16px', fontSize: 11, color: '#F5F5F5' }}>{b.nombre}</td>
                    <td style={{ padding: '12px 16px', fontSize: 11, color: '#F5F5F5' }}>{b.empresa}</td>
                    <td style={{ padding: '12px 16px', fontSize: 10, color: '#8A8A8A' }}>{b.email}</td>
                    <td style={{ padding: '12px 16px', fontSize: 9, color: '#5A5A5A' }}>{[b.tracking?.sourceSection, b.tracking?.interactionType].filter(Boolean).join(' · ') || 'Sin tracking'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 8, padding: '3px 8px', border: '1px solid #C9A96E44', color: '#C9A96E', letterSpacing: '0.1em' }}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'catalog' && (
        <div className="fabric-admin-content" style={{ overflowX: 'auto', padding: '16px 36px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ fontSize: 10, color: '#5A5A5A', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              Gestión de papers disponibles en la web pública
            </div>
            <button
              onClick={() => {
                setEditingPaper({
                  paperId: '',
                  titulo: '',
                  subtitulo: 'Research Note · FABRIC · 2026',
                  tag: 'Research Note',
                  abstract: '',
                  meta: '8-10 pp · PDF ES · 15 min · May 2026',
                  visible: true,
                  orden: catalogPapers.length + 1,
                  toc: []
                });
                setIsNewPaper(true);
              }}
              style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', padding: '9px 18px', background: '#C9A96E', border: 'none', color: '#050505', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}
            >
              + Añadir Paper
            </button>
          </div>

          {catalogPapers.length === 0 ? (
            <div style={{ padding: '48px 0', textAlign: 'center', fontSize: 11, color: '#5A5A5A' }}>Catálogo vacío o cargando...</div>
          ) : (
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1a1a1a' }}>
                  {['Orden', 'ID', 'Título', 'Categoría / Tag', 'Metadata', 'Visible', 'Acciones'].map(h => (
                    <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: 8, letterSpacing: '0.2em', color: '#3A3A3A', textTransform: 'uppercase', fontWeight: 400 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {catalogPapers.map(p => (
                  <tr key={p.paperId} style={{ borderBottom: '1px solid #111' }}>
                    <td style={{ padding: '12px 16px', fontSize: 10, color: '#8A8A8A' }}>{p.orden}</td>
                    <td style={{ padding: '12px 16px', fontSize: 10, color: '#C9A96E', fontFamily: 'var(--mono)' }}>{p.paperId}</td>
                    <td style={{ padding: '12px 16px', fontSize: 11, color: '#F5F5F5' }}>
                      <div>{p.titulo}</div>
                      <div style={{ fontSize: 9, color: '#5A5A5A', marginTop: 4 }}>{p.subtitulo}</div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 10, color: '#8A8A8A' }}>{p.tag}</td>
                    <td style={{ padding: '12px 16px', fontSize: 10, color: '#8A8A8A' }}>{p.meta}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 8, letterSpacing: '0.16em', textTransform: 'uppercase', padding: '3px 8px', border: `1px solid ${p.visible ? '#6A8A6E' : '#B85450'}44`, color: p.visible ? '#6A8A6E' : '#B85450', background: `${p.visible ? '#6A8A6E' : '#B85450'}10` }}>
                        {p.visible ? 'Visible' : 'Oculto'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => {
                            setEditingPaper(p);
                            setIsNewPaper(false);
                          }}
                          style={{ fontSize: 8, padding: '4px 10px', background: 'transparent', border: '1px solid #C9A96E', color: '#C9A96E', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.1em' }}
                        >
                          Editar
                        </button>
                        <label style={{ fontSize: 8, padding: '4px 10px', background: 'transparent', border: '1px solid #252525', color: '#8A8A8A', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.1em' }}>
                          Subir PDF
                          <input
                            type="file"
                            accept="application/pdf,.pdf"
                            onChange={e => handlePdfUpload(p.paperId, e.target.files?.[0])}
                            style={{ display: 'none' }}
                          />
                        </label>
                        <button
                          onClick={() => handleDeletePaper(p.paperId)}
                          style={{ fontSize: 8, padding: '4px 10px', background: 'transparent', border: '1px solid #B85450', color: '#B85450', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.1em' }}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {editingPaper && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(6,6,6,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: 20 }}>
          <div style={{ background: '#0a0a0a', border: '1px solid #252525', width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', padding: '30px 40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, borderBottom: '1px solid #1a1a1a', paddingBottom: 16 }}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 20, color: '#C9A96E' }}>
                {isNewPaper ? 'Añadir Nuevo Paper' : `Editar Paper ${editingPaper.paperId}`}
              </div>
              <button
                onClick={() => setEditingPaper(null)}
                style={{ background: 'transparent', border: 'none', color: '#8A8A8A', fontSize: 18, cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSavePaper} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 9, letterSpacing: '0.18em', color: '#5A5A5A', textTransform: 'uppercase', marginBottom: 6 }}>ID del Paper</label>
                  <input
                    type="text"
                    disabled={!isNewPaper}
                    value={editingPaper.paperId}
                    onChange={e => setEditingPaper(prev => prev ? ({ ...prev, paperId: e.target.value }) : null)}
                    placeholder="Ej: 04"
                    style={{ width: '100%', padding: '10px 12px', background: '#050505', border: '1px solid #252525', color: '#F5F5F5', fontFamily: 'var(--mono)', fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 9, letterSpacing: '0.18em', color: '#5A5A5A', textTransform: 'uppercase', marginBottom: 6 }}>Orden de visualización</label>
                  <input
                    type="number"
                    value={editingPaper.orden}
                    onChange={e => setEditingPaper(prev => prev ? ({ ...prev, orden: parseInt(e.target.value) || 0 }) : null)}
                    style={{ width: '100%', padding: '10px 12px', background: '#050505', border: '1px solid #252525', color: '#F5F5F5', fontFamily: 'var(--mono)', fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 9, letterSpacing: '0.18em', color: '#5A5A5A', textTransform: 'uppercase', marginBottom: 6 }}>Título</label>
                <input
                  type="text"
                  value={editingPaper.titulo}
                  onChange={e => setEditingPaper(prev => prev ? ({ ...prev, titulo: e.target.value }) : null)}
                  placeholder="Ej: Por qué fallan los go-live"
                  style={{ width: '100%', padding: '10px 12px', background: '#050505', border: '1px solid #252525', color: '#F5F5F5', fontFamily: 'inherit', fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 9, letterSpacing: '0.18em', color: '#5A5A5A', textTransform: 'uppercase', marginBottom: 6 }}>Subtítulo</label>
                <input
                  type="text"
                  value={editingPaper.subtitulo}
                  onChange={e => setEditingPaper(prev => prev ? ({ ...prev, subtitulo: e.target.value }) : null)}
                  placeholder="Ej: Research Note · FABRIC · 2026"
                  style={{ width: '100%', padding: '10px 12px', background: '#050505', border: '1px solid #252525', color: '#F5F5F5', fontFamily: 'inherit', fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 9, letterSpacing: '0.18em', color: '#5A5A5A', textTransform: 'uppercase', marginBottom: 6 }}>Tag de Categoría</label>
                  <input
                    type="text"
                    value={editingPaper.tag}
                    onChange={e => setEditingPaper(prev => prev ? ({ ...prev, tag: e.target.value }) : null)}
                    placeholder="Ej: Research Note · Mercado"
                    style={{ width: '100%', padding: '10px 12px', background: '#050505', border: '1px solid #252525', color: '#F5F5F5', fontFamily: 'inherit', fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 9, letterSpacing: '0.18em', color: '#5A5A5A', textTransform: 'uppercase', marginBottom: 6 }}>Metadata (Páginas · Formato · Lectura · Publicación)</label>
                  <input
                    type="text"
                    value={editingPaper.meta}
                    onChange={e => setEditingPaper(prev => prev ? ({ ...prev, meta: e.target.value }) : null)}
                    placeholder="Ej: 8-10 pp · PDF ES · 15 min · May 2026"
                    style={{ width: '100%', padding: '10px 12px', background: '#050505', border: '1px solid #252525', color: '#F5F5F5', fontFamily: 'inherit', fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 9, letterSpacing: '0.18em', color: '#5A5A5A', textTransform: 'uppercase', marginBottom: 6 }}>Abstract / Resumen</label>
                <textarea
                  value={editingPaper.abstract}
                  onChange={e => setEditingPaper(prev => prev ? ({ ...prev, abstract: e.target.value }) : null)}
                  placeholder="Escribe el resumen ejecutivo..."
                  rows={3}
                  style={{ width: '100%', padding: '10px 12px', background: '#050505', border: '1px solid #252525', color: '#F5F5F5', fontFamily: 'inherit', fontSize: 12, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 9, letterSpacing: '0.18em', color: '#5A5A5A', textTransform: 'uppercase', marginBottom: 6 }}>Tabla de Contenidos (TOC) - Un tema por línea</label>
                <textarea
                  value={Array.isArray(editingPaper.toc) ? editingPaper.toc.join('\n') : ''}
                  onChange={e => setEditingPaper(prev => prev ? ({ ...prev, toc: e.target.value.split('\n') }) : null)}
                  placeholder="Tema 1&#10;Tema 2&#10;Tema 3"
                  rows={4}
                  style={{ width: '100%', padding: '10px 12px', background: '#050505', border: '1px solid #252525', color: '#F5F5F5', fontFamily: 'inherit', fontSize: 12, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                <input
                  type="checkbox"
                  id="visibleCheckbox"
                  checked={editingPaper.visible}
                  onChange={e => setEditingPaper(prev => prev ? ({ ...prev, visible: e.target.checked }) : null)}
                  style={{ accentColor: '#C9A96E', cursor: 'pointer' }}
                />
                <label htmlFor="visibleCheckbox" style={{ fontSize: 10, color: '#8A8A8A', cursor: 'pointer', letterSpacing: '0.05em' }}>
                  Hacer este paper visible en la web pública
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
                <button
                  type="button"
                  onClick={() => setEditingPaper(null)}
                  style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', padding: '10px 20px', background: 'transparent', border: '1px solid #252525', color: '#8A8A8A', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingCatalog}
                  style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', padding: '10px 20px', background: '#C9A96E', border: 'none', color: '#050505', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}
                >
                  {savingCatalog ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
  );
}

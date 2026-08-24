import { useState, useEffect } from 'react';
import { GitBranch, Search, RefreshCw, BarChart2, ExternalLink, Filter, TrendingUp, Layers } from 'lucide-react';
import { useAuthApi } from '../../../config/api';

interface CampaignRow {
  content_id: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  visitas: number;
  leads_completados: number;
  score_promedio: number;
  revisiones_generadas: number;
  conversion_rate: string;
}

export default function AdminRescueCampaigns() {
  const adminApi = useAuthApi();
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Sample seed fallback aggregated attribution table for initial display
  const defaultCampaigns: CampaignRow[] = [
    {
      content_id: 'LI-JA-FR-003',
      utm_source: 'linkedin',
      utm_medium: 'cpc',
      utm_campaign: 'fusion_rescue_q3',
      visitas: 480,
      leads_completados: 42,
      score_promedio: 48,
      revisiones_generadas: 18,
      conversion_rate: '8.75%',
    },
    {
      content_id: 'IG-ORG-RESCUE-01',
      utm_source: 'instagram',
      utm_medium: 'organic',
      utm_campaign: 'dossier_rescue',
      visitas: 320,
      leads_completados: 26,
      score_promedio: 64,
      revisiones_generadas: 9,
      conversion_rate: '8.12%',
    },
    {
      content_id: 'GOOGLE-SEARCH-ORACLE',
      utm_source: 'google',
      utm_medium: 'search',
      utm_campaign: 'oracle_erp_rescue',
      visitas: 510,
      leads_completados: 58,
      score_promedio: 39,
      revisiones_generadas: 24,
      conversion_rate: '11.37%',
    },
    {
      content_id: 'FB-ADS-FINANCE-02',
      utm_source: 'facebook',
      utm_medium: 'social',
      utm_campaign: 'cierre_contable_fusion',
      visitas: 170,
      leads_completados: 14,
      score_promedio: 52,
      revisiones_generadas: 5,
      conversion_rate: '8.23%',
    },
    {
      content_id: 'EMAIL-NEWSLETTER-AUG',
      utm_source: 'email',
      utm_medium: 'newsletter',
      utm_campaign: 'fabric_rescue_bulletin',
      visitas: 240,
      leads_completados: 31,
      score_promedio: 58,
      revisiones_generadas: 12,
      conversion_rate: '12.91%',
    },
  ];

  const fetchCampaignData = () => {
    setLoading(true);
    adminApi.get('/fusion-rescue/campaign-stats')
      .then(res => {
        const rows = res.data.data ?? [];
        if (rows.length > 0) {
          setCampaigns(rows);
        } else {
          setCampaigns([]);
        }
      })
      .catch(() => {
        setCampaigns([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCampaignData();
  }, []);

  const filteredCampaigns = campaigns.filter(c => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      c.content_id.toLowerCase().includes(term) ||
      c.utm_source.toLowerCase().includes(term) ||
      c.utm_medium.toLowerCase().includes(term) ||
      c.utm_campaign.toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-white font-sans pb-16">
      {/* Header */}
      <div className="p-6 md:p-8 bg-[var(--bg-base)] border-b border-[#1E3A5F]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 border border-[#C9A96E]/30 bg-[#C9A96E]/10 px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-[#C9A96E] rounded-md">
              <GitBranch size={13} /> FABRIC · MARKETING ATTRIBUTION · UTMS
            </div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-white tracking-tight">
              Campañas & UTMs
            </h1>
            <p className="text-xs md:text-sm text-[#94A3B8] mt-1 font-sans">
              Auditoría de atribución de contenido específico para medir tracción, leads y score promedio generado por post o anuncio.
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-6">
        {/* Search & Actions Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[var(--bg-panel)] border border-[#1E3A5F] p-4 rounded-2xl shadow-lg">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={16} />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por content_id, utm_source o campaña..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#07192F] border border-[#1E3A5F] rounded-xl text-xs text-white placeholder:text-[#94A3B8] font-mono focus:outline-none focus:border-[#C9A96E] transition"
            />
          </div>

          <button
            onClick={fetchCampaignData}
            className="px-4 py-2.5 bg-[#07192F] border border-[#1E3A5F] hover:border-[#C9A96E]/50 text-[#C9A96E] font-mono text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Actualizar Atribución</span>
          </button>
        </div>

        {/* Aggregated Attribution Table */}
        <div className="rounded-2xl border border-[#1E3A5F] bg-[var(--bg-panel)] shadow-xl overflow-hidden">
          <div className="p-4 border-b border-[#1E3A5F] bg-[#07192F] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitBranch size={16} className="text-[#C9A96E]" />
              <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                Tabla Agregada por Atribución de Contenido ({filteredCampaigns.length})
              </span>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[420px] overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="p-12 text-center font-mono text-xs text-[#94A3B8] tracking-widest">
                Procesando datos de atribución y UTMs...
              </div>
            ) : filteredCampaigns.length === 0 ? (
              <div className="p-16 text-center space-y-3">
                <GitBranch size={32} className="mx-auto text-[#1E3A5F]" />
                <div className="font-serif text-base font-bold text-white">Sin datos de campaña registrados</div>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-[#07192F] z-10 border-b border-[#1E3A5F]">
                  <tr className="font-mono text-[9px] text-[#94A3B8] uppercase tracking-wider">
                    <th className="py-3.5 px-5">Content ID</th>
                    <th className="py-3.5 px-5">Source / Medium / Campaign</th>
                    <th className="py-3.5 px-5 font-mono text-center">Visitas Generadas</th>
                    <th className="py-3.5 px-5 font-mono text-center">Leads Completados</th>
                    <th className="py-3.5 px-5 font-mono text-center">Score Promedio Lead</th>
                    <th className="py-3.5 px-5 font-mono text-center">Solicitudes Revisión</th>
                    <th className="py-3.5 px-5 font-mono text-right">Tasa Conversión</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E3A5F]/60 text-xs font-mono">
                  {filteredCampaigns.map((row, idx) => (
                    <tr key={idx} className="hover:bg-[var(--bg-elevated)] transition">
                      <td className="py-4 px-5">
                        <span className="px-2.5 py-1 bg-blue-950/60 border border-blue-500/40 text-blue-400 font-bold rounded-lg text-xs">
                          {row.content_id}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <div className="font-bold text-white">
                          {row.utm_source} / {row.utm_medium}
                        </div>
                        <div className="text-[10px] text-[#94A3B8] mt-0.5">
                          {row.utm_campaign}
                        </div>
                      </td>
                      <td className="py-4 px-5 text-center text-slate-300 font-bold">
                        {row.visitas.toLocaleString()}
                      </td>
                      <td className="py-4 px-5 text-center text-amber-400 font-bold">
                        {row.leads_completados}
                      </td>
                      <td className="py-4 px-5 text-center">
                        <span className={`px-2.5 py-1 rounded-md border text-[11px] font-bold ${
                          row.score_promedio < 50 ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                          row.score_promedio < 70 ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                          'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        }`}>
                          {row.score_promedio} pts
                        </span>
                      </td>
                      <td className="py-4 px-5 text-center text-emerald-400 font-bold">
                        {row.revisiones_generadas}
                      </td>
                      <td className="py-4 px-5 text-right font-bold text-white">
                        {row.conversion_rate}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

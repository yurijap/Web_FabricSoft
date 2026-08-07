import { Link } from 'react-router-dom';
// Traductor desactivado temporalmente por rendimiento.
// import LanguageToggle from '../../../components/LanguageToggle';

type FooterLink = {
  label: string;
  path?: string;
  isFuture?: boolean;
};

const showComingSoon = () => {
  window.alert('Acceso privado. Solicita admisión para recibir disponibilidad.');
};

const footerLinks: Record<string, FooterLink[]> = {
  sitio: [
    { label: 'Inicio',            path: '/#inicio' },
    { label: 'Doctrina',          path: '/#doctrina-operativa' },
    { label: 'Industrias',        path: '/#industrias-focales' },
    { label: 'Transparencia',     path: '/transparencia' },
    { label: 'Investigación',     path: '/#investigacion-section' },
    { label: 'Modelos',           path: '/modelos' },
    { label: 'Aplicar',           path: '/aplicar' },
  ],
  casos: [
    { label: 'Historial de casos',        path: '/#casos-ancla' },
    { label: 'APE Plazas',               path: '/casos/ape-plazas' },
    { label: 'Aplazo',                   path: '/casos/aplazo' },
    { label: 'Referencias',              path: '/#referencias' },
    { label: 'Rescue Assessment',        path: '/#rescue-assessment-section' },
    { label: 'Apply Reverse',             path: '/rechazados' },
  ],
  herramientas: [
    { label: 'Optimizador OCI',          path: '/optimizador-oci' },
    { label: 'ERP TCO Comparator',       path: '/#comparadores' },
    { label: 'Cloud Cost Comparator',    path: '/#infra-cost-simulator' },
    { label: 'Migration Roadmap',      path: '/roadmap' },
    { label: 'Readiness Score',        path: '/readiness' },
    { label: 'RFP Template',           path: '/rfp-template' },
    { label: 'Benchmark Index',        path: '/benchmark' },
  ],
  engagement: [
    { label: 'Aplicar',                  path: '/aplicar' },
    { label: 'Founder · Wait List',      path: '/#waitlist-section' },
    { label: 'Office Hours',             path: '/office-hours' },
    { label: 'Post-Mortem Privado',      path: '/post-mortem' },
    { label: 'Confidential Roundtable',   path: '/roundtable' },
    { label: 'Research Letters',          path: '/research-letters' },
  ],
  recursos: [
    { label: 'Paper 01 — Go-live failures',         path: '/investigacion/paper/01' },
    { label: 'Paper 02 — IA en Fusion',             path: '/investigacion/paper/02' },
    { label: 'Paper 03 — Primer ciclo crítico',     path: '/investigacion/paper/03' },
  ],
};

function FooterNavItem({ link }: { link: FooterLink }) {
  const className =
    'min-w-0 text-[#F5F5F5]/60 hover:text-[#C9A96E] transition-all duration-300 text-sm flex items-start gap-2 group text-left bg-transparent border-0 p-0 m-0 cursor-pointer font-sans leading-normal focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#C9A96E]/60 focus-visible:rounded-sm';
  const content = (
    <>
      <span className="min-w-0 break-words transform group-hover:translate-x-1 transition-transform duration-300">
        {link.label}
      </span>
      {link.isFuture && (
        <span className="text-[8px] text-[#C9A96E]/40 group-hover:text-[#C9A96E]">◆</span>
      )}
    </>
  );

  if (link.isFuture || !link.path) {
    return (
      <button type="button" onClick={showComingSoon} className={className}>
        {content}
      </button>
    );
  }

  return (
    <Link to={link.path} className={className}>
      {content}
    </Link>
  );
}

const SocialIcons = {
  Facebook: () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/>
    </svg>
  ),
  YouTube: () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M23.498 6.163a3.003 3.003 0 00-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.507a3.003 3.003 0 00-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 002.11 2.11c1.87.507 9.388.507 9.388.507s7.518 0 9.388-.507a3.003 3.003 0 002.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  ),
  Instagram: () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
    </svg>
  ),
  Twitter: () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.004 3.974H5.078z" />
    </svg>
  ),
  TikTok: () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.06-2.89-.53-4.09-1.37-.76-.53-1.39-1.27-1.77-2.11-.07-.15-.12-.3-.17-.46-.01 1.93-.01 3.86-.01 5.79 0 2.22-.38 4.49-1.57 6.36-1.44 2.34-4.11 3.86-6.9 3.82-3.15-.05-6.13-2.13-7.14-5.11-1.16-3.32-.21-7.29 2.45-9.61 2.05-1.84 5.01-2.42 7.64-1.52.01 1.34.01 2.68.01 4.02-1.44-.48-3.08-.22-4.24.71-.97.77-1.4 2.05-1.16 3.27.2 1.15.99 2.14 2.06 2.58 1.25.53 2.76.24 3.73-.67.7-.65 1.07-1.63 1.07-2.58.02-3.52.01-7.05.02-10.57z"/>
    </svg>
  ),
};

const titleTranslations: Record<string, string> = {
  sitio: 'Sitio',
  casos: 'Portafolio',
  herramientas: 'Herramientas',
  engagement: 'Admisión',
  recursos: 'Recursos',
};

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="fabric-footer bg-[#050203] text-[#F5F5F5]/90 border-t border-[#2A2A2A] pt-16 pb-10 font-sans md:pt-24 md:pb-12">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12">
        <div className="footer-grid">
          <div className="min-w-0 sm:col-span-2 lg:col-span-1 flex flex-col">
            <h2 className="text-[#F5F5F5] font-serif text-4xl tracking-wide mb-4 transition-colors duration-300 hover:text-[#C9A96E] md:text-5xl">
              FABRIC
            </h2>
            <p className="text-[#C9A96E] text-xs font-bold tracking-[0.2em] uppercase mb-10">
              Oracle Critical Engineering
            </p>

            <div className="space-y-3 font-mono text-sm mb-8 text-[#F5F5F5]/80 break-words">
              <p>Ciudad de México · México</p>
            </div>

            <div className="flex items-center gap-6 mb-10">
              <a href="https://www.facebook.com/profile.php?id=61586919775724" target="_blank" rel="noopener noreferrer" className="text-[#F5F5F5]/50 hover:text-[#C9A96E] transition-colors duration-300 hover:scale-110">
                <span className="sr-only">Facebook</span>
                <SocialIcons.Facebook />
              </a>
              <a href="https://www.youtube.com/@FabricSoft-1" target="_blank" rel="noopener noreferrer" className="text-[#F5F5F5]/50 hover:text-[#C9A96E] transition-colors duration-300 hover:scale-110">
                <span className="sr-only">YouTube</span>
                <SocialIcons.YouTube />
              </a>
              <a href="https://www.instagram.com/fabricsoft_mexico/" target="_blank" rel="noopener noreferrer" className="text-[#F5F5F5]/50 hover:text-[#C9A96E] transition-colors duration-300 hover:scale-110">
                <span className="sr-only">Instagram</span>
                <SocialIcons.Instagram />
              </a>
              <a href="https://x.com/FabriSoft01" target="_blank" rel="noopener noreferrer" className="text-[#F5F5F5]/50 hover:text-[#C9A96E] transition-colors duration-300 hover:scale-110">
                <span className="sr-only">Twitter / X</span>
                <SocialIcons.Twitter />
              </a>
              <a href="https://www.tiktok.com/@fabricsoft_" target="_blank" rel="noopener noreferrer" className="text-[#F5F5F5]/50 hover:text-[#C9A96E] transition-colors duration-300 hover:scale-110">
                <span className="sr-only">TikTok</span>
                <SocialIcons.TikTok />
              </a>
            </div>

            <div className="pt-6 border-t border-[#2A2A2A]">
              <p className="text-xs text-[#F5F5F5]/70 flex items-start gap-2">
                <span className="text-[#C9A96E]/60 animate-pulse">◆</span> Acceso selectivo · cupos limitados
              </p>
            </div>
          </div>

          {Object.entries(footerLinks).map(([key, links]) => {
            const displayTitle = titleTranslations[key] || key;
            return (
              <div className="min-w-0 flex flex-col mt-12 md:mt-0" key={key}>
                <h3 className="text-fabric-gold font-mono text-sm md:text-base font-bold tracking-[0.25em] uppercase mb-6" style={{ color: 'var(--accent)' }}>
                  {displayTitle}
                </h3>
                <ul className="space-y-4">
                  {links.map((link) => (
                    <li key={link.label}>
                      <FooterNavItem link={link} />
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="pt-8 border-t border-[#2A2A2A] flex flex-col md:flex-row justify-between items-center gap-4 text-[11px] font-mono text-[#F5F5F5]/70">
          {/* Traductor desactivado temporalmente por rendimiento. */}
          {/* <LanguageToggle compact /> */}

          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <Link to="/terminos" className="text-[#F5F5F5]/50 hover:text-[#C9A96E] transition-colors duration-300 tracking-[0.12em] uppercase text-[10px]">
              Términos de uso
            </Link>
            <span className="text-[#2A2A2A]">·</span>
            <Link to="/privacidad" className="text-[#F5F5F5]/50 hover:text-[#C9A96E] transition-colors duration-300 tracking-[0.12em] uppercase text-[10px]">
              Aviso de privacidad
            </Link>
            <span className="text-[#2A2A2A]">·</span>
            <p className="footer-copyright" aria-label={`© ${currentYear} FABRIC SOFT MEXICO SA DE CV`}>
              <span>©</span>
              <span>{currentYear}</span>
              <span>FABRIC SOFT MEXICO SA DE CV</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

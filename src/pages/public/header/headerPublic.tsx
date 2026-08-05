import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
// Traductor desactivado temporalmente por rendimiento.
// import LanguageToggle from '../../../components/LanguageToggle';
import { useI18n } from '../../../i18n/I18nProvider';
import type { TranslationKey } from '../../../i18n/translations';
import { useTheme } from '../../../theme/ThemeProvider';

const NAV: Array<{ key: TranslationKey; href: string; sectionId: string; page?: boolean }> = [
  { key: 'nav.hero',         href: '/#inicio',       sectionId: 'inicio' },
  { key: 'nav.tco',          href: '/#tco',          sectionId: 'tco' },
  { key: 'nav.fabricAi',     href: '/#fabric-ai',    sectionId: 'fabric-ai' },
  { key: 'nav.diagnostic',   href: '/#rescue-diagnostic', sectionId: 'rescue-diagnostic' },
  { key: 'nav.doctrine',     href: '/#doctrina',     sectionId: 'doctrina' },
  { key: 'nav.cases',        href: '/#casos',        sectionId: 'casos' },
  { key: 'nav.industries',   href: '/#industrias',   sectionId: 'industrias' },
  { key: 'nav.fabricOs',     href: '/#fabric-os',    sectionId: 'fabric-os' },
  { key: 'nav.lifecycle',    href: '/#lifecycle',    sectionId: 'lifecycle' },
  { key: 'nav.officeHours',  href: '/#office-hours', sectionId: 'office-hours' },
  { key: 'nav.research',     href: '/#investigacion', sectionId: 'investigacion' },
  { key: 'nav.founder',      href: '/#founder-wait-list', sectionId: 'founder-wait-list' },
  { key: 'nav.transparency', href: '/transparencia', sectionId: '', page: true },
  { key: 'nav.apply',        href: '/aplicar',       sectionId: '', page: true },
];

function scrollCurrentSection(sectionId: string) {
  const target = document.getElementById(sectionId);
  if (!target) return;

  const header = document.querySelector<HTMLElement>('header[data-no-translate]');
  const headerOffset = (header?.offsetHeight ?? 0) + 12;
  const visualInset = sectionId === 'inicio' ? 0 : Math.min(88, Math.max(48, window.innerHeight * 0.08));
  const top = target.getBoundingClientRect().top + window.scrollY - headerOffset + visualInset;
  window.scrollTo({ top, behavior: 'smooth' });
}

function ThemeToggle({ mobile = false }: { mobile?: boolean }) {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';
  const Icon = isLight ? Moon : Sun;

  return (
    <button
      type="button"
      onClick={(event) => toggleTheme({ origin: { x: event.clientX, y: event.clientY } })}
      aria-label={isLight ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
      title={isLight ? 'Modo oscuro' : 'Modo claro'}
      className={`
        group inline-flex items-center justify-center border font-mono uppercase
        transition-all duration-200 active:scale-95
        ${mobile ? 'h-11 w-full gap-3 rounded-full text-[10px] tracking-[0.2em]' : 'h-9 w-9 rounded-full'}
      `}
      style={{
        color: 'var(--accent)',
        borderColor: 'var(--accent-deep)',
        background: 'var(--accent-soft)',
        boxShadow: '0 10px 30px rgba(var(--accent-rgb), 0.08)',
      }}
    >
      <Icon className="h-4 w-4 transition-transform duration-200 group-hover:rotate-12" strokeWidth={1.7} />
      {mobile ? <span>{isLight ? 'Oscuro' : 'Claro'}</span> : null}
    </button>
  );
}

export default function Header() {
  const { t } = useI18n();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const ticking = useRef(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      if (!ticking.current) {
        requestAnimationFrame(() => {
          setScrolled(window.scrollY > 8);
          ticking.current = false;
        });
        ticking.current = true;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location.pathname, location.hash]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleSectionNavigation = (
    event: MouseEvent<HTMLAnchorElement>,
    sectionId: string,
  ) => {
    event.preventDefault();
    setMobileOpen(false);
    const targetHash = `#${sectionId}`;

    if (location.pathname === '/' && location.hash === targetHash) {
      scrollCurrentSection(sectionId);
      return;
    }

    navigate({ pathname: '/', hash: targetHash });
  };

  const startLink = (
    <Link
      to="/#radar-admision"
      onClick={(event) => handleSectionNavigation(event, 'radar-admision')}
      className="hidden sm:inline-flex items-center gap-2 relative group font-mono font-semibold text-[10px] tracking-[0.22em] uppercase px-0 py-2 transition-colors duration-300 active:scale-[0.98]"
      style={{ color: 'var(--accent)' }}
    >
      <span className="relative">
        {t('cta.start')}
        <span aria-hidden="true" className="absolute left-0 -bottom-1 h-px w-full origin-right scale-x-100 transition-transform duration-300 ease-out group-hover:scale-x-0" style={{ background: 'var(--accent)' }} />
      </span>
      <span className="transition-transform duration-300 group-hover:translate-x-1">-&gt;</span>
    </Link>
  );

  return (
    <>
      <header
        data-no-translate
        className={`
          fixed top-0 left-0 right-0 z-50
          flex justify-center px-6 md:px-12
          transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
          ${scrolled ? 'backdrop-blur-xl border-b shadow-md py-1.5' : 'bg-transparent border-b border-transparent py-3'}
          ${mounted ? 'opacity-100' : 'opacity-0'}
        `}
        style={scrolled ? {
          background: 'color-mix(in srgb, var(--bg-base) 90%, transparent)',
          borderColor: 'var(--border)',
          boxShadow: 'var(--shadow-float)',
        } : undefined}
      >
        <div className="relative w-full max-w-[1440px] flex items-center justify-between">
          <Link
            to="/"
            className={`
              shrink-0 group
              transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]
              ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}
            `}
            style={{ transitionDelay: '60ms' }}
          >
            {/* LOGO ESCRITORIO: Logo_FabricSoft.webp */}
            <img 
              src="/Logo_FabricSoft.webp" 
              alt="FABRIC" 
              className={`w-auto object-contain transition-all duration-300 ${scrolled ? 'h-[42px] md:h-[52px]' : 'h-[72px] md:h-[86px]'}`}
              style={{ filter: 'drop-shadow(0 1px 10px rgba(var(--accent-rgb),0.22))' }}
            />
          </Link>

          <div
            className={`
              flex items-center gap-4 shrink-0
              transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]
              ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}
            `}
            style={{ transitionDelay: '180ms' }}
          >
            {startLink}
            <ThemeToggle />
            {/* Traductor desactivado temporalmente por rendimiento. */}
            {/* <div className="hidden translate-y-[1px] sm:flex sm:pl-8">
              <LanguageToggle compact />
            </div> */}

            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menu"
              className="lg:hidden p-2 -mr-1 text-[#F5F5F5]/60 hover:text-[#C9A96E] transition-colors duration-300 active:scale-90"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div
        onClick={() => setMobileOpen(false)}
        className={`fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm lg:hidden transition-opacity duration-500 ${mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />
      <aside className={`fixed right-0 top-0 bottom-0 z-[110] w-full sm:w-[380px] bg-[#050203]/95 backdrop-blur-2xl border-l border-[#2A2A2A] flex flex-col transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${mobileOpen ? 'translate-x-0' : 'translate-x-full'} lg:hidden`}>
        <div className="flex items-center justify-between px-8 py-2 border-b border-[#2A2A2A]/40">
          
          <div className="flex items-center">
            {/* LOGO MÓVIL: Logo_FabricSoft.webp */}
            <img 
              src="/Logo_FabricSoft.webp" 
              alt="FABRIC" 
              className="h-[50px] w-auto object-contain" 
            />
          </div>

          <button onClick={() => setMobileOpen(false)} aria-label="Cerrar menu" className="text-[#F5F5F5]/40 hover:text-[#C9A96E] p-2 -mr-2 rounded-full transition-all duration-500 hover:rotate-90 active:scale-90">
            <svg className="w-6 h-6 stroke-[1.2px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="fabric-mobile-menu-nav flex-1 flex flex-col justify-start px-10 py-10 gap-2 overflow-y-auto overscroll-contain">
          {NAV.map((item, i) => {
            const isActive = item.page
              ? location.pathname === item.href
              : location.pathname === '/' && location.hash === `#${item.sectionId}`;
            return (
              <Link
                key={item.key}
                to={item.href}
                onClick={item.page ? () => setMobileOpen(false) : (event) => handleSectionNavigation(event, item.sectionId)}
                style={{ transitionDelay: mobileOpen ? `${i * 35}ms` : '0ms' }}
                className={`
                  group relative flex items-center w-full py-2.5
                  transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]
                  ${mobileOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}
                `}
              >
                <div className={`
                  absolute left-0 h-[1px] bg-[#C9A96E] transition-all duration-500 ease-out
                  ${isActive ? 'w-5 opacity-100' : 'w-0 opacity-0 group-hover:w-3 group-hover:opacity-60'}
                `} />
                <span className={`
                  font-sans text-[11px] tracking-[0.25em] uppercase font-medium
                  transition-all duration-500 ease-out
                  ${isActive ? 'pl-9 text-[#C9A96E]' : 'pl-0 text-[#F5F5F5]/50 group-hover:pl-6 group-hover:text-[#F5F5F5]'}
                `}>
                  {t(item.key)}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className={`px-8 py-8 border-t border-[#2A2A2A]/40 transition-all duration-700 ${mobileOpen ? 'opacity-100 translate-y-0 delay-[500ms]' : 'opacity-0 translate-y-8'}`}>
          {/* Traductor desactivado temporalmente por rendimiento. */}
          {/* <div className="mb-6 flex justify-center">
            <LanguageToggle />
          </div> */}
          <div className="mb-3">
            <ThemeToggle mobile />
          </div>
          <Link
            to="/#radar-admision"
            onClick={(event) => handleSectionNavigation(event, 'radar-admision')}
            className="flex items-center justify-center gap-3 w-full py-3.5 relative overflow-hidden group bg-transparent border border-[#C9A96E]/30 hover:border-[#C9A96E] hover:bg-[#C9A96E]/5 text-[#C9A96E] font-mono font-bold text-[10px] tracking-[0.2em] uppercase rounded-full transition-all duration-500 active:scale-[0.98]"
          >
            <span className="relative">{t('cta.start')}</span>
            <span className="relative transition-transform duration-500 group-hover:translate-x-1">-&gt;</span>
          </Link>
        </div>
      </aside>
    </>
  );
}

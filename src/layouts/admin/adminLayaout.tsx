import { useEffect, useRef, useState, Suspense, type ReactNode } from 'react';
import { useClerk, useUser } from '@clerk/clerk-react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  Activity,
  BarChart3,
  Bot,
  CalendarClock,
  Cloud,
  ChevronRight,
  ClipboardList,
  Eye,
  FileText,
  Gauge,
  GitBranch,
  LayoutDashboard,
  Link2,
  LogOut,
  Mail,
  Menu,
  MessageSquareText,
  PanelLeftClose,
  ShieldCheck,
  UsersRound,
  Sliders,
} from 'lucide-react';

// ─── Tipos ───────────────────────────────────────────────────────────────────

type NavItem = {
  path: string;
  label: string;
  badge?: string | null;
  icon: React.ElementType;
};

type NavGroup = {
  group: string;
  defaultOpen?: boolean;
  items: NavItem[];
};

// ─── Estructura de navegación ────────────────────────────────────────────────

const NAV_GROUPS: NavGroup[] = [
  {
    group: 'Principal',
    defaultOpen: true,
    items: [
      { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/admin/leads', label: 'Leads', icon: UsersRound },
      { path: '/admin/office-hours', label: 'Generar Citas', icon: CalendarClock },
      { path: '/admin/documentos', label: 'Solicitudes de Documentos', icon: FileText },
      { path: '/admin/validacion-directa', label: 'VALIDACIÓN DIRECTA', icon: ShieldCheck },
      { path: '/admin/waitlist', label: 'Wait List', icon: Sliders },
    ],
  },
  {
    group: 'Sistema',
    defaultOpen: false,
    items: [
      { path: '/admin/logs', label: 'Logs', badge: '∞', icon: Activity },
    ],
  },
];

const NestedLoader = () => (
  <div className="flex min-h-[60vh] w-full flex-col items-center justify-center bg-transparent">
    <div className="relative mb-4 flex h-10 w-10 items-center justify-center">
      <div className="absolute inset-0 rounded-full border border-[#2A2A2A]" />
      <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-[#C9A96E]" />
    </div>
    <div className="font-mono text-[9px] font-bold text-[#C9A96E] uppercase tracking-[0.2em] animate-pulse">
      Cargando sección...
    </div>
  </div>
);

// ─── Componente principal ────────────────────────────────────────────────────

export default function AdminLayout({ children }: { children?: ReactNode }) {
  const location = useLocation();
  const { signOut } = useClerk();
  const { user } = useUser();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(NAV_GROUPS.map((g) => [g.group, g.defaultOpen ?? false]))
  );

  const toggleGroup = (group: string) =>
    setOpenGroups((prev) => ({ ...prev, [group]: !prev[group] }));

  useEffect(() => {
    setMobileOpen(false);
    NAV_GROUPS.forEach((g) => {
      const hasActive = g.items.some(
        (item) =>
          location.pathname === item.path ||
          (item.path !== '/admin' && location.pathname.startsWith(item.path))
      );
      if (hasActive) setOpenGroups((prev) => ({ ...prev, [g.group]: true }));
    });
  }, [location.pathname]);

  const displayName = user?.fullName || user?.firstName || 'Admin';
  const email = user?.primaryEmailAddress?.emailAddress || '';
  const initials = displayName
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    await signOut({ redirectUrl: '/acceso' });
  };

  // ─── Sidebar ──────────────────────────────────────────────────────────────

  const Sidebar = () => {
    const navRef = useRef<HTMLDivElement>(null);

    return (
      <aside
        className="fabric-admin-sidebar"
        style={{
          width: 276,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#0E2747',
          borderRight: '1px solid #1E3A5F',
          boxShadow: '4px 0 24px rgba(0,0,0,0.25)',
        }}
      >
        {/* ── Logo ── */}
        <div
          className="fabric-admin-sidebar-brand"
          style={{
            padding: '18px 18px 16px',
            borderBottom: '1px solid #1E3A5F',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              className="fabric-admin-sidebar-logo"
              style={{
                width: 52,
                height: 52,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(201,169,110,0.3)',
                background: 'rgba(201,169,110,0.08)',
                flexShrink: 0,
                position: 'relative',
                borderRadius: 8,
              }}
            >
              <img
                src="/Logo_FabricSoft.webp"
                alt="F"
                style={{ width: '85%', height: '85%', objectFit: 'contain' }}
              />
            </div>

            <div>
              <div
                style={{
                  fontFamily: 'var(--mono, monospace)',
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: '0.18em',
                  color: '#FFFFFF',
                  textTransform: 'uppercase',
                }}
              >
                FABRIC
              </div>
              <div
                style={{
                  fontFamily: 'var(--mono, monospace)',
                  fontSize: 9,
                  letterSpacing: '0.12em',
                  color: '#94A3B8',
                  textTransform: 'uppercase',
                  marginTop: 2,
                }}
              >
                Admin Console
              </div>
            </div>
          </div>

          {/* Botón cerrar en mobile */}
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            style={{
              width: 32,
              height: 32,
              border: '1px solid #1E3A5F',
              background: 'transparent',
              color: '#94A3B8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 6,
            }}
            className="lg:hidden"
            aria-label="Cerrar"
          >
            <PanelLeftClose size={15} />
          </button>
        </div>

        {/* ── Nav ── */}
        <div
          ref={navRef}
          data-admin-nav
          className="fabric-admin-sidebar-nav"
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '16px 12px 8px',
            scrollbarWidth: 'none',
          }}
        >
          <style>{`
            [data-admin-nav]::-webkit-scrollbar { display: none; }
            .nav-item-enter { animation: navItemIn 180ms ease both; }
            @keyframes navItemIn {
              from { opacity: 0; transform: translateY(-4px); }
              to   { opacity: 1; transform: translateY(0); }
            }
          `}</style>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {NAV_GROUPS.map(({ group, items }, gi) => {
              const isOpen = openGroups[group] ?? false;
              const groupActive = items.some(
                (item) =>
                  location.pathname === item.path ||
                  (item.path !== '/admin' && location.pathname.startsWith(item.path))
              );

              return (
                <div
                  key={group}
                  style={{ marginBottom: gi < NAV_GROUPS.length - 1 ? 8 : 0 }}
                >
                  {/* ── Cabecera de grupo ── */}
                  <button
                    type="button"
                    onClick={() => toggleGroup(group)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 8px',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      marginBottom: 4,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span
                        style={{
                          display: 'block',
                          width: 12,
                          height: 1.5,
                          background: groupActive
                            ? '#C9A96E'
                            : '#1E3A5F',
                          transition: 'background 200ms',
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          fontFamily: 'var(--mono, monospace)',
                          fontSize: 9.5,
                          fontWeight: 700,
                          letterSpacing: '0.15em',
                          textTransform: 'uppercase',
                          color: groupActive
                            ? '#C9A96E'
                            : '#64748b',
                          transition: 'color 200ms',
                          userSelect: 'none',
                        }}
                      >
                        {group}
                      </span>
                    </div>
                    <ChevronRight
                      size={11}
                      strokeWidth={2}
                      style={{
                        color: groupActive
                          ? '#C9A96E'
                          : '#64748b',
                        transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 200ms ease, color 200ms',
                        flexShrink: 0,
                      }}
                    />
                  </button>

                  {/* ── Items ── */}
                  {isOpen && (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        paddingLeft: 8,
                        paddingBottom: 4,
                        borderLeft: '1px solid #1E3A5F',
                        marginLeft: 10,
                      }}
                    >
                      {items.map(({ path, label, badge, icon: Icon }, ii) => {
                        const active =
                          location.pathname === path ||
                          (path !== '/admin' && location.pathname.startsWith(path));

                        return (
                          <Link
                            key={path}
                            to={path}
                            className="nav-item-enter"
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '16px 1fr auto',
                              alignItems: 'center',
                              gap: 10,
                              padding: '8px 11px',
                              textDecoration: 'none',
                              position: 'relative',
                              overflow: 'hidden',
                              borderRadius: 6,
                              background: active
                                ? 'rgba(201,169,110,0.12)'
                                : 'transparent',
                              borderLeft: active
                                ? '2px solid #C9A96E'
                                : '2px solid transparent',
                              transition: 'background 150ms, border-color 150ms',
                              animationDelay: `${ii * 30}ms`,
                            }}
                            onMouseEnter={(e) => {
                              if (!active) {
                                (e.currentTarget as HTMLElement).style.background =
                                  '#123254';
                                const labelSpan = e.currentTarget.querySelector('span[data-label]') as HTMLElement;
                                if (labelSpan) labelSpan.style.color = '#FFFFFF';
                                const iconSvg = e.currentTarget.querySelector('svg') as HTMLElement;
                                if (iconSvg) iconSvg.style.color = '#C9A96E';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!active) {
                                (e.currentTarget as HTMLElement).style.background =
                                  'transparent';
                                const labelSpan = e.currentTarget.querySelector('span[data-label]') as HTMLElement;
                                if (labelSpan) labelSpan.style.color = '#94A3B8';
                                const iconSvg = e.currentTarget.querySelector('svg') as HTMLElement;
                                if (iconSvg) iconSvg.style.color = '#64748b';
                              }
                            }}
                          >
                            <Icon
                              size={14}
                              strokeWidth={1.8}
                              style={{
                                color: active
                                  ? '#C9A96E'
                                  : '#64748b',
                                transition: 'color 150ms',
                                flexShrink: 0,
                              }}
                            />
                            <span
                              data-label
                              style={{
                                fontFamily: 'var(--mono, monospace)',
                                fontSize: 11.5,
                                letterSpacing: '0.02em',
                                color: active
                                  ? '#FFFFFF'
                                  : '#94A3B8',
                                transition: 'color 150ms',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                fontWeight: active ? 600 : 500,
                              }}
                            >
                              {label}
                            </span>
                            {badge && (
                              <span
                                style={{
                                  fontFamily: 'var(--mono, monospace)',
                                  fontSize: 8,
                                  fontWeight: 700,
                                  letterSpacing: '0.12em',
                                  textTransform: 'uppercase',
                                  padding: '2px 6px',
                                  borderRadius: 4,
                                  border: active
                                    ? '1px solid rgba(201,169,110,0.4)'
                                    : '1px solid #1E3A5F',
                                  color: active
                                    ? '#C9A96E'
                                    : '#94A3B8',
                                  background: active ? 'rgba(201,169,110,0.1)' : '#123254',
                                  flexShrink: 0,
                                  lineHeight: 1.6,
                                }}
                              >
                                {badge}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Footer usuario ── */}
        <div
          className="fabric-admin-sidebar-user"
          style={{
            flexShrink: 0,
            borderTop: '1px solid #1E3A5F',
            padding: '14px 16px',
            background: '#07192F',
          }}
        >
          {/* Avatar + nombre */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 12,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                border: '1px solid rgba(201,169,110,0.3)',
                background: 'rgba(201,169,110,0.12)',
                fontFamily: 'var(--mono, monospace)',
                fontSize: 11,
                fontWeight: 700,
                color: '#C9A96E',
                letterSpacing: '0.05em',
                borderRadius: '50%',
              }}
            >
              {user?.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                initials
              )}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontFamily: 'var(--mono, monospace)',
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#FFFFFF',
                  letterSpacing: '0.02em',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {displayName}
              </div>
              {email && (
                <div
                  style={{
                    fontFamily: 'var(--mono, monospace)',
                    fontSize: 9,
                    color: '#94A3B8',
                    letterSpacing: '0.02em',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    marginTop: 2,
                  }}
                >
                  {email}
                </div>
              )}
            </div>

            {/* Badge sesión activa */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '3px 7px',
                border: '1px solid rgba(16,185,129,0.3)',
                background: 'rgba(16,185,129,0.1)',
                flexShrink: 0,
                borderRadius: 4,
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: '#10B981',
                  boxShadow: '0 0 6px rgba(16,185,129,0.6)',
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: 'var(--mono, monospace)',
                  fontSize: 8,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  color: '#10B981',
                  textTransform: 'uppercase',
                }}
              >
                Activo
              </span>
            </div>
          </div>

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            disabled={isSigningOut}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              height: 34,
              border: '1px solid #1E3A5F',
              background: '#0E2747',
              color: isSigningOut ? 'rgba(201,169,110,0.6)' : '#94A3B8',
              fontFamily: 'var(--mono, monospace)',
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              cursor: isSigningOut ? 'wait' : 'pointer',
              transition: 'all 180ms',
              borderRadius: 6,
            }}
            onMouseEnter={(e) => {
              if (!isSigningOut) {
                (e.currentTarget as HTMLElement).style.borderColor = '#fca5a5';
                (e.currentTarget as HTMLElement).style.color = '#ef4444';
                (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSigningOut) {
                (e.currentTarget as HTMLElement).style.borderColor = '#1E3A5F';
                (e.currentTarget as HTMLElement).style.color = '#94A3B8';
                (e.currentTarget as HTMLElement).style.background = '#0E2747';
              }
            }}
          >
            {isSigningOut ? (
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  border: '1.5px solid rgba(201,169,110,0.3)',
                  borderTopColor: '#C9A96E',
                  animation: 'spin 600ms linear infinite',
                }}
              />
            ) : (
              <LogOut size={13} strokeWidth={1.6} />
            )}
            {isSigningOut ? 'Cerrando...' : 'Cerrar sesión'}
          </button>
        </div>
      </aside>
    );
  };

  // ─── Layout principal ──────────────────────────────────────────────────────

  return (
    <div
      className="fabric-admin-shell"
      style={{ minHeight: '100vh', background: '#0B1F3A', color: '#F5F5F5' }}
    >
      <style>{`
        @keyframes admin-content-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes gold-sweep {
          0%,100% { opacity: 0.4; transform: scaleX(0.7); }
          50%     { opacity: 0.9; transform: scaleX(1); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .admin-content-shell {
          animation: admin-content-in 300ms ease both;
        }
        .admin-gold-sweep {
          animation: gold-sweep 3s ease-in-out infinite;
          transform-origin: left;
        }
      `}</style>

      {/* Sidebar desktop */}
      <div
        style={{
          position: 'fixed',
          inset: '0 auto 0 0',
          width: 276,
          zIndex: 40,
        }}
        className="hidden lg:block"
      >
        <Sidebar />
      </div>

      {/* Sidebar mobile overlay */}
      {mobileOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 50 }}
          className="lg:hidden"
        >
          <button
            type="button"
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(1.5px)',
              border: 'none',
              cursor: 'pointer',
            }}
            onClick={() => setMobileOpen(false)}
            aria-label="Cerrar menú"
          />
          <div style={{ position: 'absolute', inset: '0 auto 0 0' }}>
            <Sidebar />
          </div>
        </div>
      )}

      {/* Contenido principal */}
      <main
        style={{ minHeight: '100vh' }}
        className="lg:pl-[276px]"
      >
        {/* Top bar mobile */}
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 30,
            height: 56,
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #e2e8f0',
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(12px)',
            padding: '0 20px',
          }}
          className="flex lg:hidden"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img
              src="/Logo_FabricSoft.webp"
              alt="FABRIC"
              style={{ height: 38, width: 'auto', objectFit: 'contain' }}
            />
            <div
              style={{
                fontFamily: 'var(--mono, monospace)',
                fontSize: 9,
                letterSpacing: '0.12em',
                color: '#64748b',
                textTransform: 'uppercase',
              }}
            >
              Admin Console
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            style={{
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #e2e8f0',
              background: 'transparent',
              color: '#C9A96E',
              cursor: 'pointer',
              borderRadius: 6,
            }}
            aria-label="Abrir menú"
          >
            <Menu size={17} />
          </button>
        </header>

        {/* Área de contenido */}
        <section
          style={{ position: 'relative', minHeight: '100vh', background: 'transparent' }}
        >
          {/* Línea dorada superior animada */}
          <div
            className="admin-gold-sweep"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 1,
              background: 'linear-gradient(90deg, rgba(201,169,110,0.4) 0%, rgba(201,169,110,0.15) 40%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />
          {/* Resplandor esquina superior derecha */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 420,
              height: 420,
              background: 'radial-gradient(circle, rgba(201,169,110,0.03) 0%, transparent 68%)',
              pointerEvents: 'none',
            }}
          />
          <div className="admin-content-shell" style={{ position: 'relative' }}>
            <Suspense fallback={<NestedLoader />}>
              {children ?? <Outlet />}
            </Suspense>
          </div>
        </section>
      </main>
    </div>
  );
}

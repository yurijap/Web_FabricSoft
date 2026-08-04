import { useEffect, useRef, useState, type ReactNode } from 'react';
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
      { path: '/admin',       label: 'Dashboard', icon: LayoutDashboard },
      { path: '/admin/leads', label: 'Leads',     icon: UsersRound },
    ],
  },
  {
    group: 'IA & Diagnóstico',
    defaultOpen: true,
    items: [
      { path: '/admin/agente-ia',           label: 'Agente IA',           badge: 'Beta', icon: Bot },
      { path: '/admin/conversaciones-ia',   label: 'Conversaciones',      badge: 'Nuevo', icon: MessageSquareText },
      { path: '/admin/diagnosticos-oracle', label: 'Diagnósticos Oracle',                icon: ClipboardList },
      { path: '/admin/rescue-assessment',   label: 'Rescue Assessment',                  icon: Activity },
      { path: '/admin/oci-audit',           label: 'OCI Cost Audit',                     icon: BarChart3 },
      { path: '/admin/migration-roadmap',   label: 'Migration Roadmap',                  icon: GitBranch },
      { path: '/admin/readiness-score',     label: 'Readiness Score',                    icon: Gauge },
    ],
  },
  {
    group: 'Captación',
    defaultOpen: false,
    items: [
      { path: '/admin/office-hours', label: 'Office Hours', icon: CalendarClock },
      { path: '/admin/capacidad',    label: 'Capacidad',    icon: Gauge },
      { path: '/admin/cloud-comparator', label: 'Cloud Comparator', icon: Cloud },
      { path: '/admin/referencias',  label: 'Referencias',  icon: Link2 },
    ],
  },
  {
    group: 'Contenido',
    defaultOpen: false,
    items: [
      { path: '/admin/papers',           label: 'Papers',          icon: FileText },
      { path: '/admin/nda',              label: 'NDA',             icon: ShieldCheck },
      { path: '/admin/research-letters', label: 'Research Letters', icon: Mail },
      { path: '/admin/transparencia',    label: 'Transparencia',   icon: Eye },
    ],
  },
  {
    group: 'Sistema',
    defaultOpen: false,
    items: [
      { path: '/admin/metricas', label: 'Métricas', icon: BarChart3 },
      { path: '/admin/logs',     label: 'Logs',     badge: '∞', icon: Activity },
    ],
  },
];

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
        style={{
          width: 264,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#0D0E10',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '4px 0 32px rgba(0,0,0,0.5)',
        }}
      >
        {/* ── Logo ── */}
        <div
          style={{
            padding: '20px 20px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Monograma F */}
            <div
              style={{
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(201,169,110,0.3)',
                background: 'rgba(201,169,110,0.06)',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: 20,
                  color: '#C9A96E',
                  lineHeight: 1,
                  fontWeight: 300,
                  letterSpacing: '-0.01em',
                }}
              >
                F
              </span>
            </div>

            <div>
              <div
                style={{
                  fontFamily: 'var(--mono, monospace)',
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.22em',
                  color: '#E8E8E8',
                  textTransform: 'uppercase',
                }}
              >
                FABRIC
              </div>
              <div
                style={{
                  fontFamily: 'var(--mono, monospace)',
                  fontSize: 9,
                  letterSpacing: '0.18em',
                  color: 'rgba(255,255,255,0.3)',
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
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'transparent',
              color: 'rgba(255,255,255,0.4)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
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
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '12px 12px 8px',
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
                  style={{ marginBottom: gi < NAV_GROUPS.length - 1 ? 4 : 0 }}
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
                      marginBottom: 2,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {/* Línea decorativa izquierda */}
                      <span
                        style={{
                          display: 'block',
                          width: 12,
                          height: 1,
                          background: groupActive
                            ? 'rgba(201,169,110,0.7)'
                            : 'rgba(255,255,255,0.15)',
                          transition: 'background 200ms',
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          fontFamily: 'var(--mono, monospace)',
                          fontSize: 9,
                          fontWeight: 600,
                          letterSpacing: '0.2em',
                          textTransform: 'uppercase',
                          color: groupActive
                            ? 'rgba(201,169,110,0.85)'
                            : 'rgba(255,255,255,0.28)',
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
                          ? 'rgba(201,169,110,0.6)'
                          : 'rgba(255,255,255,0.2)',
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
                        gap: 1,
                        paddingLeft: 8,
                        paddingBottom: 4,
                        borderLeft: '1px solid rgba(255,255,255,0.06)',
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
                              padding: '8px 10px',
                              textDecoration: 'none',
                              position: 'relative',
                              overflow: 'hidden',
                              background: active
                                ? 'rgba(201,169,110,0.08)'
                                : 'transparent',
                              borderLeft: active
                                ? '2px solid rgba(201,169,110,0.7)'
                                : '2px solid transparent',
                              transition: 'background 150ms, border-color 150ms',
                              animationDelay: `${ii * 30}ms`,
                            }}
                            onMouseEnter={(e) => {
                              if (!active) {
                                (e.currentTarget as HTMLElement).style.background =
                                  'rgba(255,255,255,0.04)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!active) {
                                (e.currentTarget as HTMLElement).style.background =
                                  'transparent';
                              }
                            }}
                          >
                            <Icon
                              size={14}
                              strokeWidth={1.6}
                              style={{
                                color: active
                                  ? '#C9A96E'
                                  : 'rgba(255,255,255,0.3)',
                                transition: 'color 150ms',
                                flexShrink: 0,
                              }}
                            />
                            <span
                              style={{
                                fontFamily: 'var(--mono, monospace)',
                                fontSize: 11.5,
                                letterSpacing: '0.04em',
                                color: active
                                  ? '#E8DCC8'
                                  : 'rgba(255,255,255,0.45)',
                                transition: 'color 150ms',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
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
                                  border: active
                                    ? '1px solid rgba(201,169,110,0.4)'
                                    : '1px solid rgba(255,255,255,0.12)',
                                  color: active
                                    ? '#C9A96E'
                                    : 'rgba(255,255,255,0.28)',
                                  background: 'transparent',
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
          style={{
            flexShrink: 0,
            borderTop: '1px solid rgba(255,255,255,0.05)',
            padding: '14px 16px',
            background: '#0A0B0D',
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
                border: '1px solid rgba(201,169,110,0.25)',
                background: 'rgba(201,169,110,0.08)',
                fontFamily: 'var(--mono, monospace)',
                fontSize: 11,
                fontWeight: 700,
                color: '#C9A96E',
                letterSpacing: '0.05em',
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
                  color: 'rgba(255,255,255,0.75)',
                  letterSpacing: '0.04em',
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
                    color: 'rgba(255,255,255,0.22)',
                    letterSpacing: '0.04em',
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
                border: '1px solid rgba(52,211,153,0.2)',
                background: 'rgba(52,211,153,0.05)',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: '#34D399',
                  boxShadow: '0 0 6px rgba(52,211,153,0.7)',
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: 'var(--mono, monospace)',
                  fontSize: 8,
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  color: 'rgba(52,211,153,0.7)',
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
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'transparent',
              color: isSigningOut ? 'rgba(201,169,110,0.6)' : 'rgba(255,255,255,0.28)',
              fontFamily: 'var(--mono, monospace)',
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              cursor: isSigningOut ? 'wait' : 'pointer',
              transition: 'all 180ms',
            }}
            onMouseEnter={(e) => {
              if (!isSigningOut) {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(185,85,80,0.4)';
                (e.currentTarget as HTMLElement).style.color = 'rgba(185,85,80,0.8)';
                (e.currentTarget as HTMLElement).style.background = 'rgba(185,85,80,0.05)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSigningOut) {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
                (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.28)';
                (e.currentTarget as HTMLElement).style.background = 'transparent';
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
            {isSigningOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
          </button>
        </div>
      </aside>
    );
  };

  // ─── Layout principal ──────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', background: '#050505', color: '#E8E8E8' }}>
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
          width: 264,
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
              background: 'rgba(0,0,0,0.65)',
              backdropFilter: 'blur(2px)',
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
        className="lg:pl-[264px]"
      >
        {/* Top bar mobile */}
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 30,
            display: 'flex',
            height: 56,
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            background: 'rgba(13,14,16,0.92)',
            backdropFilter: 'blur(12px)',
            padding: '0 20px',
          }}
          className="lg:hidden"
        >
          <div>
            <div
              style={{
                fontFamily: 'var(--mono, monospace)',
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.22em',
                color: '#E8E8E8',
                textTransform: 'uppercase',
              }}
            >
              FABRIC
            </div>
            <div
              style={{
                fontFamily: 'var(--mono, monospace)',
                fontSize: 9,
                letterSpacing: '0.18em',
                color: 'rgba(255,255,255,0.28)',
                textTransform: 'uppercase',
                marginTop: 2,
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
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'transparent',
              color: '#C9A96E',
              cursor: 'pointer',
            }}
            aria-label="Abrir menú"
          >
            <Menu size={17} />
          </button>
        </header>

        {/* Área de contenido */}
        <section
          style={{ position: 'relative', minHeight: '100vh', background: '#050505' }}
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
              background: 'linear-gradient(90deg, rgba(201,169,110,0.8) 0%, rgba(201,169,110,0.3) 40%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />
          {/* Resplandor esquina superior derecha */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 320,
              height: 320,
              background: 'radial-gradient(circle, rgba(201,169,110,0.04) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />
          <div className="admin-content-shell" style={{ position: 'relative' }}>
            {children ?? <Outlet />}
          </div>
        </section>
      </main>
    </div>
  );
}

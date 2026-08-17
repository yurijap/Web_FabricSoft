import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, Suspense, lazy } from 'react';

import PublicLayout from '../layouts/public/publicLayaout';
import { ProtectorRoles } from '../auth/ProtecteRoles';

// Lazy cargar ClerkBoundary y Pantallas de Login/Acceso
const ClerkBoundary = lazy(() => import('../auth/ClerkBoundary'));
const AccesoScreen = lazy(() =>
  import('../auth/AuthScreens').then((m) => ({ default: m.AccesoScreen })),
);
const CrearCuentaScreen = lazy(() =>
  import('../auth/AuthScreens').then((m) => ({ default: m.CrearCuentaScreen })),
);

// Dashboard principal post-login
const DashboardPage = lazy(() => import('../pages/admin/DashboardPage'));

// Admin Layout y Páginas del Consola Admin FABRIC
const AdminLayout = lazy(() => import('../layouts/admin/adminLayaout'));
const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'));
const AdminLeads = lazy(() => import('../pages/admin/AdminLeads'));
const AdminOfficeHours = lazy(() => import('../pages/admin/AdminOfficeHours'));
const AdminDocumentos = lazy(() => import('../pages/admin/AdminDocumentos'));
const AdminValidacionDirecta = lazy(() => import('../pages/admin/AdminValidacionDirecta'));
const AdminWaitlist = lazy(() => import('../pages/admin/AdminWaitlist'));
const AdminRescueAssessment = lazy(() => import('../pages/admin/AdminRescueAssessment'));
const AdminLogs = lazy(() => import('../pages/admin/AdminLogs'));
const AdminDoctrina = lazy(() => import('../pages/admin/AdminDoctrina'));

// Páginas Públicas
import Home from '../pages/public/home/home';
const CasoPage = lazy(() => import('../pages/public/casos/CasoPage'));
const AplicarPage = lazy(() => import('../pages/public/aplicar/AplicarPage'));
const TransparenciaPage = lazy(() => import('../pages/public/transparencia/TransparenciaPage'));
const RechazadosPage = lazy(() => import('../pages/public/rechazados/RechazadosPage'));
const AuditTrailPage = lazy(() => import('../pages/public/casos/AuditTrailPage'));
const PostMortemPage = lazy(() => import('../pages/public/postmortem/PostMortemPage'));
const RoundtablePage = lazy(() => import('../pages/public/roundtable/RoundtablePage'));
const ModelosPage = lazy(() => import('../pages/public/modelos/ModelosPage'));

// Páginas Legales
const TerminosPage = lazy(() => import('../pages/public/legal/TerminosPage'));
const PrivacidadPage = lazy(() => import('../pages/public/legal/PrivacidadPage'));
const DoctrinaNoAlineacionPage = lazy(() => import('../pages/public/legal/DoctrinaNoAlineacionPage'));

// Páginas de Herramientas
const MigrationRoadmapPage = lazy(() => import('../pages/public/herramientas/MigrationRoadmapPage'));
const ReadinessScorePage = lazy(() => import('../pages/public/herramientas/ReadinessScorePage'));
const RFPTemplatePage = lazy(() => import('../pages/public/herramientas/RFPTemplatePage'));
const BenchmarkIndexPage = lazy(() => import('../pages/public/herramientas/BenchmarkIndexPage'));

// Office Hours
const OfficeHoursPage = lazy(() => import('../pages/public/office-hours/OfficeHoursPage'));

// Optimizador OCI
const OptimizadorOciPage = lazy(() => import('../pages/public/optimizador-oci/OptimizadorOciPage'));

// Páginas de Investigación
const ResearchLettersPage = lazy(() => import('../pages/public/investigacion/ResearchLettersPage'));
const PaperPage = lazy(() => import('../pages/public/investigacion/PaperPage'));

const legacyHashAliases: Record<string, string> = {
  s07: 'casos',
  s08: 'industrias',
  s09: 'fabric-os',
  s10: 'lifecycle',
  s11: 'office-hours',
  s12: 'referencias',
  s13: 'transparencia',
  s14: 'investigacion',
  s15: 'founder-wait-list',
};

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }

    const requestedId = decodeURIComponent(hash.slice(1));
    const canonicalId = legacyHashAliases[requestedId] ?? requestedId;

    if (canonicalId !== requestedId) {
      navigate({ pathname, hash: `#${canonicalId}` }, { replace: true });
      return;
    }

    const viewportHeight = window.innerHeight;
    let didSmoothScroll = false;
    let stableChecks = 0;

    const scrollToHash = (behavior: ScrollBehavior) => {
      const id = canonicalId;
      const sectionEl = document.getElementById(id);
      const headerEl = document.querySelector<HTMLElement>('header[data-no-translate]');
      if (!sectionEl) return true;

      const headerOffset = (headerEl?.offsetHeight ?? 0) + 12;
      const visualInset = id === 'inicio' ? 0 : Math.min(88, Math.max(48, viewportHeight * 0.08));
      const top = sectionEl.getBoundingClientRect().top + window.scrollY - headerOffset + visualInset;
      const distance = Math.abs(top - window.scrollY);

      if (distance < 6) {
        stableChecks += 1;
        return stableChecks >= 2;
      }

      stableChecks = 0;
      window.scrollTo({ top, behavior });
      didSmoothScroll = true;
      return false;
    };

    const timers = [0, 80, 180, 360, 700, 1100, 1600, 2200].map((delay) =>
      window.setTimeout(() => {
        if (stableChecks >= 2) return;
        const behavior: ScrollBehavior = didSmoothScroll ? 'auto' : 'smooth';
        scrollToHash(behavior);
      }, delay),
    );

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [pathname, hash, navigate]);

  return null;
}

const GlobalLoader = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-white text-slate-900 font-sans">
    <div className="relative mb-6 flex h-16 w-16 items-center justify-center">
      <div className="absolute inset-0 rounded-full border border-slate-200" />
      <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-blue-600" />
    </div>
    <p className="text-[10px] font-mono font-bold text-blue-600 uppercase tracking-[0.3em] animate-pulse">
      Cargando Consola Admin...
    </p>
  </div>
);

export const AppRouter = () => {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<GlobalLoader />}>
        <Routes>
          {/* Rutas Públicas */}
          <Route path="/" element={<PublicLayout />}>
            <Route index element={<Home />} />

            {/* Casos y Engagements */}
            <Route path="casos/:slug" element={<CasoPage />} />
            <Route path="casos/:slug/audit-trail" element={<AuditTrailPage />} />
            <Route path="aplicar" element={<AplicarPage />} />
            <Route path="rechazados" element={<RechazadosPage />} />
            <Route path="post-mortem" element={<PostMortemPage />} />
            <Route path="roundtable" element={<RoundtablePage />} />
            <Route path="modelos" element={<ModelosPage />} />
            <Route path="transparencia" element={<TransparenciaPage />} />

            {/* Legal */}
            <Route path="terminos" element={<TerminosPage />} />
            <Route path="privacidad" element={<PrivacidadPage />} />
            <Route path="doctrina/no-alineacion" element={<DoctrinaNoAlineacionPage />} />

            {/* Herramientas */}
            <Route path="roadmap" element={<MigrationRoadmapPage />} />
            <Route path="readiness" element={<ReadinessScorePage />} />
            <Route path="rfp-template" element={<RFPTemplatePage />} />
            <Route path="benchmark" element={<BenchmarkIndexPage />} />

            {/* Office Hours */}
            <Route path="office-hours" element={<OfficeHoursPage />} />

            {/* Optimizador OCI */}
            <Route path="optimizador-oci" element={<OptimizadorOciPage />} />

            {/* Investigación */}
            <Route path="research-letters" element={<ResearchLettersPage />} />
            <Route path="investigacion/paper/:num" element={<PaperPage />} />
          </Route>

          {/* Rutas de Consola de Administración y Login con Clerk */}
          <Route element={<ClerkBoundary />}>
            <Route path="/acceso/*" element={<AccesoScreen />} />
            <Route path="/crear-cuenta/*" element={<CrearCuentaScreen />} />
            <Route path="/login" element={<Navigate to="/acceso" replace />} />
            <Route path="/admin/login" element={<Navigate to="/acceso" replace />} />

            {/* Dashboard General */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectorRoles rolesPermitidos={['admin', 'superadmin']}>
                  <DashboardPage />
                </ProtectorRoles>
              } 
            />

            {/* Consola de Administración FABRIC */}
            <Route 
              path="/admin" 
              element={
                <ProtectorRoles rolesPermitidos={['admin', 'superadmin']}>
                  <AdminLayout />
                </ProtectorRoles>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="leads" element={<AdminLeads />} />
              <Route path="office-hours" element={<AdminOfficeHours />} />
              <Route path="documentos" element={<AdminDocumentos />} />
              <Route path="validacion-directa" element={<AdminValidacionDirecta />} />
              <Route path="waitlist" element={<AdminWaitlist />} />
              <Route path="rescue-assessment" element={<AdminRescueAssessment />} />
              <Route path="logs" element={<AdminLogs />} />
              <Route path="doctrina" element={<AdminDoctrina />} />
            </Route>
          </Route>

          {/* 404 → Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
};

export default AppRouter;

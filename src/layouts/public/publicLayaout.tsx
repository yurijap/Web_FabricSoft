import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../../pages/public/header/headerPublic';
import Footer from '../../pages/public/footer/footerPublic';
import DeferredInteractionManager from '../../components/DeferredInteractionManager';

export default function PublicLayout() {

  return (
    <div className="relative min-h-screen font-sans selection:bg-fabric-gold selection:text-black" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[var(--bg-base)]" />
        <div className="absolute inset-0 bg-grid-pattern mask-radial-faded" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />
        <main className="flex flex-col w-full">
          <Suspense fallback={
            <div className="flex min-h-[60vh] w-full flex-col items-center justify-center bg-transparent">
              <div className="relative mb-4 flex h-10 w-10 items-center justify-center">
                <div className="absolute inset-0 rounded-full border" style={{ borderColor: 'var(--border)' }} />
                <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent" style={{ borderTopColor: 'var(--accent)' }} />
              </div>
            </div>
          }>
            <Outlet />
          </Suspense>
        </main>
        <Footer />
      </div>
      <DeferredInteractionManager />
    </div>
  );
}

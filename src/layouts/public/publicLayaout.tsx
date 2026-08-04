import { Outlet } from 'react-router-dom';
import Header from '../../pages/public/header/headerPublic';
import Footer from '../../pages/public/footer/footerPublic';
import InteractionManager from '../../components/InteractionManager';

export default function PublicLayout() {

  return (
    <div className="relative min-h-screen bg-fabric-base text-fabric-text font-sans selection:bg-fabric-gold selection:text-black">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[#050505]" />
        <div className="absolute inset-0 bg-grid-pattern mask-radial-faded" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />
        <main className="flex flex-col w-full">
          <Outlet />
        </main>
        <Footer />
      </div>
      <InteractionManager />
    </div>
  );
}
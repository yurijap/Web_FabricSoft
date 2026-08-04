import { lazy, Suspense } from 'react';
import S01Hero from './s01-hero';
import SectionNavigator from '../../../components/SectionNavigator';
import ViewportLoader from '../../../components/ViewportLoader';

// Carga perezosa de todo lo que está debajo del hero
const S02bPuente = lazy(() => import('./s02b-puente'));
const RescueCounter = lazy(() => import('./s02-optimizador'));
const S03TcoCalculator = lazy(() => import('./s03-tco-calculator'));
const S04TcoWaitlist = lazy(() => import('./s04-tco-waitlist'));
const ChatIa = lazy(() => import('../chat/chatIa'));
const S05AnalisisFallas = lazy(() => import('./s05-analisis-fallas'));
const S06Doctrina = lazy(() => import('./s06-doctrina'));
const S06bFixedPrice = lazy(() => import('./s06b-fixed-price'));
const S07Casos = lazy(() => import('./s07-casos'));
const S07bRescueAssessment = lazy(() => import('./s07b-rescue-assessment'));
const S08Industrias = lazy(() => import('./s08-industrias'));
const S09FabricOS = lazy(() => import('./s09-fabric-os'));
const S10Lifecycle = lazy(() => import('./s10-lifecycle'));
const S11OfficeHours = lazy(() => import('./s11-office-hours'));
const S12Referencias = lazy(() => import('./s12-referencias'));
const S12bCriterios = lazy(() => import('./s12b-criterios'));
const S13Transparencia = lazy(() => import('./s13-transparencia'));
const S14Investigacion = lazy(() => import('./s14-investigacion'));
const S15Founder = lazy(() => import('./s15-founder'));

export default function Home() {
  return (
    <div className="fabric-home-page w-full flex flex-col">
      <SectionNavigator />
      <S01Hero />

      <ViewportLoader id="puente" height={400}>
        <Suspense fallback={<div className="min-h-[400px]" />}>
          <S02bPuente />
        </Suspense>
      </ViewportLoader>
    </div>
  );
}

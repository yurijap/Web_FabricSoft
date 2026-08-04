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

      <ViewportLoader id="tco" height={600}>
        <Suspense fallback={<div className="min-h-[600px]" />}>
          <S03TcoCalculator />
        </Suspense>
      </ViewportLoader>

      <ViewportLoader id="cloud-tco" height={500}>
        <Suspense fallback={<div className="min-h-[500px]" />}>
          <S04TcoWaitlist />
        </Suspense>
      </ViewportLoader>

      <ViewportLoader id="fabric-ai" height={500}>
        <Suspense fallback={<div className="min-h-[500px]" />}>
          <ChatIa />
        </Suspense>
      </ViewportLoader>

      <ViewportLoader id="rescue-diagnostic" height={600}>
        <Suspense fallback={<div className="min-h-[600px]" />}>
          <S05AnalisisFallas />
        </Suspense>
      </ViewportLoader>

      <ViewportLoader id="doctrina" height={600}>
        <Suspense fallback={<div className="min-h-[600px]" />}>
          <S06Doctrina />
        </Suspense>
      </ViewportLoader>
     
      <ViewportLoader id="fixed-price" height={500}>
        <Suspense fallback={<div className="min-h-[500px]" />}>
          <S06bFixedPrice />
        </Suspense>
      </ViewportLoader>
      
      <ViewportLoader id="casos" height={700}>
        <Suspense fallback={<div className="min-h-[700px]" />}>
          <S07Casos />
        </Suspense>
      </ViewportLoader>

      <Suspense fallback={<div className="min-h-[300px]" />}>
        <RescueCounter />
      </Suspense>

      <ViewportLoader id="rescue-assessment" height={700}>
        <Suspense fallback={<div className="min-h-[700px]" />}>
          <S07bRescueAssessment />
        </Suspense>
      </ViewportLoader>

      <ViewportLoader id="industrias" height={600}>
        <Suspense fallback={<div className="min-h-[600px]" />}>
          <S08Industrias />
        </Suspense>
      </ViewportLoader>

      <ViewportLoader id="fabric-os" height={800}>
        <Suspense fallback={<div className="min-h-[800px]" />}>
          <S09FabricOS />
        </Suspense>
      </ViewportLoader>

      <ViewportLoader id="lifecycle" height={700}>
        <Suspense fallback={<div className="min-h-[700px]" />}>
          <S10Lifecycle />
        </Suspense>
      </ViewportLoader>

      <ViewportLoader id="office-hours" height={600}>
        <Suspense fallback={<div className="min-h-[600px]" />}>
          <S11OfficeHours />
        </Suspense>
      </ViewportLoader>

      <ViewportLoader id="referencias" height={500}>
        <Suspense fallback={<div className="min-h-[500px]" />}>
          <S12Referencias />
        </Suspense>
      </ViewportLoader>

      <ViewportLoader id="criterios" height={600}>
        <Suspense fallback={<div className="min-h-[600px]" />}>
          <S12bCriterios />
        </Suspense>
      </ViewportLoader>

      <ViewportLoader id="transparencia" height={600}>
        <Suspense fallback={<div className="min-h-[600px]" />}>
          <S13Transparencia />
        </Suspense>
      </ViewportLoader>

      <ViewportLoader id="investigacion" height={600}>
        <Suspense fallback={<div className="min-h-[600px]" />}>
          <S14Investigacion />
        </Suspense>
      </ViewportLoader>

      <ViewportLoader id="founder-wait-list" height={600}>
        <Suspense fallback={<div className="min-h-[600px]" />}>
          <S15Founder />
        </Suspense>
      </ViewportLoader>
    </div>
  );
}

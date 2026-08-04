import S01Hero from './s01-hero';
import S02bPuente from './s02b-puente';
import RescueCounter from './s02-optimizador';
import S03TcoCalculator from './s03-tco-calculator';
import S04TcoWaitlist from './s04-tco-waitlist';
import S05AnalisisFallas from './s05-analisis-fallas';
import S06Doctrina from './s06-doctrina';
import SectionNavigator from '../../../components/SectionNavigator';
import ChatIa from '../chat/chatIa';
import S07Casos from './s07-casos';
import S08Industrias from './s08-industrias';
import S09FabricOS from './s09-fabric-os';
import S10Lifecycle from './s10-lifecycle';
import S11OfficeHours from './s11-office-hours';
import S12Referencias from './s12-referencias';
import S12bCriterios from './s12b-criterios';
import S13Transparencia from './s13-transparencia';
import S14Investigacion from './s14-investigacion';
import S15Founder from './s15-founder';
import S06bFixedPrice from './s06b-fixed-price';
import S07bRescueAssessment from './s07b-rescue-assessment';

export default function Home() {
  return (
    <div className="w-full flex flex-col">
      <SectionNavigator />
      <S01Hero />
    
      <S02bPuente />
      <S03TcoCalculator />
      <S04TcoWaitlist />
      <ChatIa />
      <S05AnalisisFallas />
      <S06Doctrina />
     
      <S06bFixedPrice />
      
      <S07Casos />
         <RescueCounter />
      <S07bRescueAssessment />
      <S08Industrias />
      <S09FabricOS />
      <S10Lifecycle />
      <S11OfficeHours />
      <S12Referencias />
      <S12bCriterios />
      <S13Transparencia />
      <S14Investigacion />
      <S15Founder />
    </div>
  );
}

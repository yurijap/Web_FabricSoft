import S01Hero from './s01-hero';
import S02bPuente from './s02b-puente';
import SectionNavigator from '../../../components/SectionNavigator';

export default function Home() {
  return (
    <div className="fabric-home-page w-full flex flex-col">
      <SectionNavigator />
      <S01Hero />
      <S02bPuente />
    </div>
  );
}

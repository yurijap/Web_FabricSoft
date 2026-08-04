import { AppRouter } from './routers/AppRouter';
import { I18nProvider } from './i18n/I18nProvider';
import PageTranslator from './i18n/PageTranslator';
import SeoManager from './seo/SeoManager';

function App() {
  return (
    <I18nProvider>
      <SeoManager />
      <PageTranslator />
      <AppRouter />
    </I18nProvider>
  );
}

export default App;

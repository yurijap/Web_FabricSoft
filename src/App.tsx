import { AppRouter } from './routers/AppRouter';
import { I18nProvider } from './i18n/I18nProvider';
// Traductor desactivado temporalmente por rendimiento.
// import PageTranslator from './i18n/PageTranslator';
import SeoManager from './seo/SeoManager';

function App() {
  return (
    <I18nProvider>
      <SeoManager />
      {/* Traductor desactivado temporalmente por rendimiento. */}
      {/* <PageTranslator /> */}
      <AppRouter />
    </I18nProvider>
  );
}

export default App;

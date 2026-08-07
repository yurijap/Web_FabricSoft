import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

const SITE_URL = 'https://equipo-a-v2.vercel.app';
const SITE_NAME = 'FABRIC';
const DEFAULT_IMAGE = `${SITE_URL}/Logo_FabricSoft.webp`;

type SeoConfig = {
  title: string;
  description: string;
  path: string;
  type?: 'website' | 'article';
  noIndex?: boolean;
};

const defaultSeo: SeoConfig = {
  title: 'FABRIC | Oracle Critical Engineering en Mexico',
  description:
    'FABRIC rescata, estabiliza y blinda proyectos Oracle Fusion, EBS y OCI cuando el riesgo afecta cierres financieros, reportes ejecutivos y continuidad del negocio.',
  path: '/',
};

const seoByPath: Record<string, SeoConfig> = {
  '/': defaultSeo,
  '/modelos': {
    title: 'Modelos de compromiso Oracle | FABRIC',
    description:
      'Conoce los modelos de trabajo de FABRIC para rescate Oracle, migraciones criticas, estabilizacion post go-live y optimizacion OCI.',
    path: '/modelos',
  },
  '/transparencia': {
    title: 'Transparencia operativa Oracle | FABRIC',
    description:
      'Metodologia, criterios y metricas publicas de FABRIC para proyectos Oracle criticos, con datos verificables bajo NDA.',
    path: '/transparencia',
  },
  '/rechazados': {
    title: 'Proyectos rechazados | Transparencia FABRIC',
    description:
      'Consulta los criterios por los que FABRIC rechaza proyectos Oracle cuando no existe ajuste operativo, financiero o tecnico suficiente.',
    path: '/rechazados',
  },
  '/aplicar': {
    title: 'Aplicar a FABRIC | Diagnostico Oracle ejecutivo',
    description:
      'Solicita una evaluacion ejecutiva para rescate, estabilizacion o migracion Oracle con un equipo senior de FABRIC.',
    path: '/aplicar',
  },
  '/office-hours': {
    title: 'FABRIC Office Hours | Diagnostico Oracle privado',
    description:
      'Agenda una sesion privada de 30 minutos para revisar riesgos Oracle, OCI, Fusion Cloud, go-live o estabilizacion post implementacion.',
    path: '/office-hours',
  },
  '/optimizador-oci': {
    title: 'Optimizador OCI | Auditoria de costos Oracle Cloud',
    description:
      'Auditoria gratuita de costos OCI con acceso de solo lectura y reporte ejecutivo de ahorros estimados en USD.',
    path: '/optimizador-oci',
  },
  '/roadmap': {
    title: 'Oracle Migration Roadmap | FABRIC',
    description:
      'Genera un roadmap ejecutivo para migraciones Oracle, con riesgos, plazos estimados y acciones de preparacion.',
    path: '/roadmap',
  },
  '/readiness': {
    title: 'Oracle Readiness Score | FABRIC',
    description:
      'Evalua el nivel de preparacion de tu organizacion antes de iniciar una implementacion o migracion Oracle.',
    path: '/readiness',
  },
  '/rfp-template': {
    title: 'RFP Template Oracle | FABRIC',
    description:
      'Plantilla ejecutiva para evaluar consultoras Oracle y reducir riesgos de abandono despues del go-live.',
    path: '/rfp-template',
  },
  '/benchmark': {
    title: 'FABRIC Benchmark Index | Oracle Fusion 2026',
    description:
      'Reporte ejecutivo con indicadores y benchmarks de implementaciones Oracle Fusion y proyectos criticos.',
    path: '/benchmark',
  },
  '/post-mortem': {
    title: 'Post-Mortem Oracle privado | FABRIC',
    description:
      'Analisis confidencial de implementaciones Oracle que no operaron como se esperaba, con causas raiz y plan ejecutable.',
    path: '/post-mortem',
  },
  '/roundtable': {
    title: 'Confidential Oracle Roundtable | FABRIC',
    description:
      'Mesa privada para CFO, CIO y CTO que evaluan proyectos Oracle criticos, sin agenda comercial y bajo NDA.',
    path: '/roundtable',
  },
  '/research-letters': {
    title: 'FABRIC Research Letters | Investigacion Oracle',
    description:
      'Notas ejecutivas sobre fallas post go-live, IA en Oracle Fusion, primer ciclo critico y gobierno de implementaciones.',
    path: '/research-letters',
    type: 'article',
  },
  '/terminos': {
    title: 'Terminos de uso | FABRIC',
    description:
      'Terminos de uso del sitio de FABRIC SOFT MEXICO SA DE CV.',
    path: '/terminos',
  },
  '/privacidad': {
    title: 'Aviso de privacidad | FABRIC',
    description:
      'Aviso de privacidad de FABRIC SOFT MEXICO SA DE CV para datos recabados en el sitio.',
    path: '/privacidad',
  },
  '/doctrina/no-alineacion': {
    title: 'Doctrina de no alineacion | FABRIC',
    description:
      'Principios de independencia tecnica de FABRIC: no vendemos licencias y no representamos a Oracle.',
    path: '/doctrina/no-alineacion',
  },
};

function upsertMeta(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);

  if (!element) {
    element = document.createElement('meta');
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([name, value]) => {
    element?.setAttribute(name, value);
  });
}

function upsertLink(rel: string, href: string) {
  let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);

  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }

  element.setAttribute('href', href);
}

function normalizePath(pathname: string) {
  if (pathname.startsWith('/casos/')) return '/casos/:slug';
  if (pathname.startsWith('/investigacion/paper/')) return '/investigacion/paper/:num';
  return pathname.replace(/\/$/, '') || '/';
}

function resolveSeo(pathname: string): SeoConfig {
  const normalizedPath = normalizePath(pathname);

  if (normalizedPath === '/casos/:slug') {
    return {
      title: 'Casos Oracle verificables | FABRIC',
      description:
        'Casos de proyectos Oracle estabilizados por FABRIC, con hitos verificables bajo NDA para evaluacion ejecutiva.',
      path: pathname,
      type: 'article',
    };
  }

  if (normalizedPath === '/investigacion/paper/:num') {
    return {
      title: 'Research Note Oracle | FABRIC',
      description:
        'Paper ejecutivo de FABRIC sobre implementaciones Oracle, riesgos post go-live y primer ciclo critico.',
      path: pathname,
      type: 'article',
    };
  }

  if (pathname.startsWith('/admin') || pathname.startsWith('/acceso') || pathname.startsWith('/crear-cuenta')) {
    return {
      title: 'Acceso privado | FABRIC',
      description: 'Acceso privado a FABRIC.',
      path: pathname,
      noIndex: true,
    };
  }

  if (pathname.startsWith('/verificar-acceso')) {
    return {
      title: 'Verificacion de acceso | FABRIC',
      description: 'Verificacion privada de acceso a FABRIC.',
      path: pathname,
      noIndex: true,
    };
  }

  return seoByPath[normalizedPath] ?? defaultSeo;
}

function buildJsonLd(seo: SeoConfig, canonicalUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: 'FABRIC SOFT MEXICO SA DE CV',
        url: SITE_URL,
        logo: `${SITE_URL}/favicon.svg`,
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Ciudad de Mexico',
          addressCountry: 'MX',
        },
      },
      {
        '@type': seo.type === 'article' ? 'Article' : 'WebPage',
        '@id': `${canonicalUrl}#webpage`,
        url: canonicalUrl,
        name: seo.title,
        description: seo.description,
        isPartOf: {
          '@type': 'WebSite',
          '@id': `${SITE_URL}/#website`,
          name: SITE_NAME,
          url: SITE_URL,
        },
        publisher: {
          '@id': `${SITE_URL}/#organization`,
        },
      },
    ],
  };
}

export default function SeoManager() {
  const { pathname } = useLocation();
  const seo = useMemo(() => resolveSeo(pathname), [pathname]);

  useEffect(() => {
    const canonicalUrl = `${SITE_URL}${seo.path === '/' ? '' : seo.path}`;

    document.documentElement.setAttribute('lang', 'es-MX');
    document.title = seo.title;

    upsertMeta('meta[name="description"]', {
      name: 'description',
      content: seo.description,
    });
    upsertMeta('meta[name="robots"]', {
      name: 'robots',
      content: seo.noIndex ? 'noindex,nofollow' : 'index,follow,max-image-preview:large',
    });
    upsertMeta('meta[name="theme-color"]', {
      name: 'theme-color',
      content: document.documentElement.dataset.theme === 'light' ? '#EDE7DA' : '#050203',
    });
    upsertMeta('meta[property="og:site_name"]', {
      property: 'og:site_name',
      content: SITE_NAME,
    });
    upsertMeta('meta[property="og:locale"]', {
      property: 'og:locale',
      content: 'es_MX',
    });
    upsertMeta('meta[property="og:title"]', {
      property: 'og:title',
      content: seo.title,
    });
    upsertMeta('meta[property="og:description"]', {
      property: 'og:description',
      content: seo.description,
    });
    upsertMeta('meta[property="og:type"]', {
      property: 'og:type',
      content: seo.type ?? 'website',
    });
    upsertMeta('meta[property="og:url"]', {
      property: 'og:url',
      content: canonicalUrl,
    });
    upsertMeta('meta[property="og:image"]', {
      property: 'og:image',
      content: DEFAULT_IMAGE,
    });
    upsertMeta('meta[property="og:image:secure_url"]', {
      property: 'og:image:secure_url',
      content: DEFAULT_IMAGE,
    });
    upsertMeta('meta[property="og:image:type"]', {
      property: 'og:image:type',
      content: 'image/webp',
    });
    upsertMeta('meta[property="og:image:width"]', {
      property: 'og:image:width',
      content: '1200',
    });
    upsertMeta('meta[property="og:image:height"]', {
      property: 'og:image:height',
      content: '630',
    });
    upsertMeta('meta[property="og:image:alt"]', {
      property: 'og:image:alt',
      content: 'FABRIC Oracle Critical Engineering',
    });
    upsertMeta('meta[name="twitter:card"]', {
      name: 'twitter:card',
      content: 'summary_large_image',
    });
    upsertMeta('meta[name="twitter:title"]', {
      name: 'twitter:title',
      content: seo.title,
    });
    upsertMeta('meta[name="twitter:description"]', {
      name: 'twitter:description',
      content: seo.description,
    });
    upsertMeta('meta[name="twitter:image"]', {
      name: 'twitter:image',
      content: DEFAULT_IMAGE,
    });
    upsertMeta('meta[name="twitter:image:alt"]', {
      name: 'twitter:image:alt',
      content: 'FABRIC Oracle Critical Engineering',
    });
    upsertLink('canonical', canonicalUrl);

    const scriptId = 'fabric-json-ld';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }

    script.textContent = JSON.stringify(buildJsonLd(seo, canonicalUrl));
  }, [seo]);

  return null;
}

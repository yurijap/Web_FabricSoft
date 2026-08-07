export interface InteractionTracking {
  sourceSection: string;
  interactionType: string;
  pagePath: string;
  referrer: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_term: string;
  utm_content: string;
  locale: string;
}

const UTM_FIELDS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const;

export function getInteractionTracking(sourceSection: string, interactionType: string): InteractionTracking {
  const params = new URLSearchParams(window.location.search);
  const utms = UTM_FIELDS.reduce((acc, field) => {
    acc[field] = params.get(field) ?? '';
    return acc;
  }, {} as Pick<InteractionTracking, typeof UTM_FIELDS[number]>);

  return {
    sourceSection,
    interactionType,
    pagePath: `${window.location.pathname}${window.location.search}`,
    referrer: document.referrer || '',
    locale: document.documentElement.lang || navigator.language || 'es-MX',
    ...utms,
  };
}

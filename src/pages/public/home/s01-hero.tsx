import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../../../i18n/I18nProvider";
import { useTheme } from "../../../theme/ThemeProvider";

type HighlightPhrase = {
  base: string;
  gold: string;
};

type GlobeLabel = {
  number: string;
  title: string;
  eyebrow: string;
  detailTitle: string;
  detailText: string;
  className: string;
};

type GlobeTheme = "dark" | "light";
type GlobeModules = {
  am5: typeof import("@amcharts/amcharts5");
  am5map: typeof import("@amcharts/amcharts5/map");
  continentsLow: typeof import("@amcharts/amcharts5-geodata/continentsLow");
};

let globeModulesPromise: Promise<GlobeModules> | null = null;

function loadGlobeModules() {
  globeModulesPromise ??= Promise.all([
    import("@amcharts/amcharts5"),
    import("@amcharts/amcharts5/map"),
    import("@amcharts/amcharts5-geodata/continentsLow"),
  ]).then(([am5, am5map, continentsLow]) => ({
    am5,
    am5map,
    continentsLow,
  }));

  return globeModulesPromise;
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false,
  );

  useEffect(() => {
    const media = window.matchMedia(query);
    const updateMatches = () => setMatches(media.matches);

    updateMatches();
    media.addEventListener("change", updateMatches);
    return () => media.removeEventListener("change", updateMatches);
  }, [query]);

  return matches;
}

function useDeferredGlobeLoad(enabled: boolean, delayMs = 900) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (shouldLoad) return;

    const element = containerRef.current;
    if (!element) return;

    let timeoutId: number | undefined;
    let observer: IntersectionObserver | undefined;

    const scheduleLoad = () => {
      if (timeoutId || shouldLoad) return;
      timeoutId = window.setTimeout(() => setShouldLoad(true), delayMs);
    };

    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry?.isIntersecting) return;
          scheduleLoad();
          observer?.disconnect();
        },
        { rootMargin: "180px" },
      );
      observer.observe(element);
    } else {
      scheduleLoad();
    }

    return () => {
      observer?.disconnect();
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [delayMs, enabled, shouldLoad]);

  return { containerRef, shouldLoad };
}

const particles = [
  { x: "8%", y: "18%", d: "0s", s: "2px" },
  { x: "18%", y: "72%", d: ".4s", s: "2px" },
  { x: "32%", y: "12%", d: ".8s", s: "3px" },
  { x: "50%", y: "48%", d: "1.2s", s: "2px" },
  { x: "72%", y: "20%", d: "1.6s", s: "2px" },
  { x: "88%", y: "62%", d: "2s", s: "3px" },
  { x: "14%", y: "46%", d: "2.4s", s: "2px" },
  { x: "66%", y: "82%", d: "2.8s", s: "2px" },
  { x: "92%", y: "34%", d: "3.2s", s: "2px" },
  { x: "44%", y: "86%", d: "3.6s", s: "3px" },
];

const BackgroundParticles = memo(function BackgroundParticles() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {particles.map((particle, index) => (
        <span
          key={index}
          className="absolute rounded-full bg-[#F5D98B] opacity-0"
          style={{
            left: particle.x,
            top: particle.y,
            width: particle.s,
            height: particle.s,
            boxShadow: "0 0 10px rgba(201,169,110,0.76)",
            animation: "fabricStar 8s ease-in-out infinite",
            animationDelay: particle.d,
          }}
        />
      ))}
    </div>
  );
});

const TypewriterCarousel = memo(function TypewriterCarousel({
  phrases,
}: {
  phrases: HighlightPhrase[];
}) {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(() => {
    const first = phrases[0];
    return first ? first.base.length + first.gold.length : 0;
  });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const first = phrases[0];
    if (!first) return;

    const timer = window.setTimeout(() => {
      setPhraseIndex(0);
      setDeleting(false);
      setCharIndex(first.base.length + first.gold.length);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [phrases]);

  useEffect(() => {
    if (isMobile) return;

    const phrase = phrases[phraseIndex] ?? phrases[0];
    if (!phrase) return;

    const totalLength = phrase.base.length + phrase.gold.length;

    if (!deleting && charIndex === totalLength) {
      const pause = window.setTimeout(() => setDeleting(true), 2450);
      return () => window.clearTimeout(pause);
    }

    if (deleting && charIndex === 0) {
      const timer = window.setTimeout(() => {
        setDeleting(false);
        setPhraseIndex((current) => (current + 1) % phrases.length);
      }, 0);
      return () => window.clearTimeout(timer);
    }

    const timer = window.setTimeout(() => {
      setCharIndex((current) => current + (deleting ? -1 : 1));
    }, deleting ? 16 : 28);

    return () => window.clearTimeout(timer);
  }, [charIndex, deleting, isMobile, phraseIndex, phrases]);

  const phrase = phrases[phraseIndex] ?? phrases[0];
  if (!phrase) return null;

  const base = isMobile ? phrase.base : phrase.base.slice(0, charIndex);
  const gold = isMobile
    ? phrase.gold
    : charIndex > phrase.base.length
      ? phrase.gold.slice(0, charIndex - phrase.base.length)
      : "";

  return (
    <div className="fabric-typewriter relative mt-6 flex min-h-[66px] w-full max-w-[700px] items-center overflow-hidden border-l-2 border-[#D4AF37] bg-gradient-to-r from-[#D4AF37]/13 via-[#D4AF37]/6 to-transparent px-5 py-4">
      <span className="relative z-10 text-sm font-bold leading-relaxed text-[#F5F5F5] md:text-base">
        {base}
        <span className="text-[#D4AF37]">{gold}</span>
        {!isMobile && (
          <span className="ml-1 inline-block h-[1em] w-[2px] animate-pulse bg-[#D4AF37] align-middle" />
        )}
      </span>
    </div>
  );
});





const globePalette = {
  dark: {
    land: 0xf0cf7a,
    stroke: 0x315a82,
  },
  light: {
    land: 0x9b7138,
    stroke: 0xf7f3ea,
  },
} satisfies Record<GlobeTheme, Record<string, number>>;

function applyGlobeTheme(
  am5: GlobeModules["am5"],
  polygonSeries: import("@amcharts/amcharts5/map").MapPolygonSeries,
  theme: GlobeTheme,
) {
  const palette = globePalette[theme];
  const settings = {
    fill: am5.color(palette.land),
    fillOpacity: theme === "light" ? 0.84 : 0.9,
    stroke: am5.color(palette.stroke),
    strokeOpacity: theme === "light" ? 0.72 : 0.45,
    strokeWidth: 0.35,
    interactive: false,
  };

  polygonSeries.mapPolygons.template.setAll(settings);
  polygonSeries.mapPolygons.each((polygon) => polygon.setAll(settings));
}

const AmChartsGlobe = memo(function AmChartsGlobe({ theme }: { theme: GlobeTheme }) {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const { containerRef, shouldLoad } = useDeferredGlobeLoad(true, isMobile ? 420 : 900);
  const chartRef = useRef<HTMLDivElement>(null);
  const am5Ref = useRef<GlobeModules["am5"] | null>(null);
  const polygonSeriesRef = useRef<import("@amcharts/amcharts5/map").MapPolygonSeries | null>(null);
  const themeRef = useRef(theme);

  useLayoutEffect(() => {
    if (!shouldLoad) return;
    if (!chartRef.current) return;

    const chartElement = chartRef.current;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let disposed = false;
    let chartRoot: { dispose: () => void } | null = null;

    loadGlobeModules().then(({ am5, am5map, continentsLow }) => {
      if (disposed) return;

      am5Ref.current = am5;
      const root = am5.Root.new(chartElement);
      chartRoot = root;

      const chart = root.container.children.push(
        am5map.MapChart.new(root, {
          projection: am5map.geoOrthographic(),
          panX: "none",
          panY: "none",
          wheelX: "none",
          wheelY: "none",
          pinchZoom: false,
          rotationX: -28,
          rotationY: -14,
          maxZoomLevel: 1,
          minZoomLevel: 1,
          paddingBottom: 0,
          paddingLeft: 0,
          paddingRight: 0,
          paddingTop: 0,
        }),
      );

      const polygonSeries = chart.series.push(
        am5map.MapPolygonSeries.new(root, {
          geoJSON: continentsLow.default,
        }),
      );

      polygonSeriesRef.current = polygonSeries;
      applyGlobeTheme(am5, polygonSeries, themeRef.current);

      if (!prefersReducedMotion) {
        chart.animate({
          key: "rotationX",
          from: -28,
          to: 332,
          duration: 52000,
          loops: Infinity,
        });
      }
    });

    return () => {
      disposed = true;
      am5Ref.current = null;
      polygonSeriesRef.current = null;
      chartRoot?.dispose();
    };
  }, [shouldLoad]);

  useEffect(() => {
    themeRef.current = theme;
    if (am5Ref.current && polygonSeriesRef.current) {
      applyGlobeTheme(am5Ref.current, polygonSeriesRef.current, theme);
    }
  }, [theme]);

  return (
    <div ref={containerRef} className="fabric-am-globe-sphere absolute inset-0 rounded-full">
      <div className="fabric-am-globe-fallback pointer-events-none absolute inset-0 rounded-full" />
      {shouldLoad && (
        <div ref={chartRef} className="fabric-am-globe-chart pointer-events-none h-full w-full" />
      )}
      <div className="fabric-am-globe-shade pointer-events-none absolute inset-0 rounded-full" />
    </div>
  );
});

const PremiumGlobe = memo(function PremiumGlobe() {
  const { t } = useI18n();
  const { theme } = useTheme();
  const [activeLabel, setActiveLabel] = useState<number | null>(null);

  const globeStars = useMemo(
    () => [
      { left: "18%", top: "18%", delay: "0s" },
      { left: "76%", top: "14%", delay: ".7s" },
      { left: "86%", top: "58%", delay: "1.2s" },
      { left: "24%", top: "76%", delay: "1.8s" },
    ],
    [],
  );

  const globeLabels = useMemo<GlobeLabel[]>(
    () => [
      {
        number: "01",
        title: t("hero.orb.1"),
        eyebrow: "POST GO-LIVE",
        detailTitle: "El riesgo real aparece después del go-live.",
        detailText:
          "Cuando empiezan cierres financieros, reportes ejecutivos, usuarios críticos y operación diaria, se revela si Oracle quedó estable o solo fue entregado.",
        className: "left-[3%] top-[2%]",
      },
      {
        number: "02",
        title: t("hero.orb.2"),
        eyebrow: "MIGRACIÓN CRÍTICA",
        detailTitle: "Una migración Oracle no debe depender de improvisación.",
        detailText:
          "FABRIC estructura migraciones con gobierno técnico, trazabilidad, validación operativa y responsabilidad por fase para reducir incertidumbre ejecutiva.",
        className: "right-[17%] top-[17%]",
      },
      {
        number: "03",
        title: t("hero.orb.3"),
        eyebrow: "ESTABILIZACIÓN ORACLE",
        detailTitle: "No basta con entregar. Tiene que operar.",
        detailText:
          "El proyecto se considera sólido cuando el primer ciclo crítico funciona sin reportes paralelos, dependencia manual o incidencias bloqueantes.",
        className: "left-[4%] bottom-[33%]",
      },
    ],
    [t],
  );

  const active = activeLabel !== null ? globeLabels[activeLabel] : null;

  return (
    <div className="fabric-orb-stage relative mx-auto flex min-h-[520px] w-full max-w-[620px] items-center justify-center overflow-visible md:min-h-[600px] lg:min-h-[660px]">
      {globeStars.map((star, index) => (
        <span
          key={index}
          className="absolute h-1 w-1 rounded-full bg-white"
          style={{
            left: star.left,
            top: star.top,
            boxShadow:
              "0 0 12px rgba(245,245,245,.78), 0 0 20px rgba(201,169,110,.30)",
            animation: "globeTwinkle 3.4s ease-in-out infinite",
            animationDelay: star.delay,
          }}
        />
      ))}

      <div className="fabric-orb-aura pointer-events-none absolute left-1/2 top-[43%] h-[74%] w-[74%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl" />
      <div className="fabric-orb-field pointer-events-none absolute left-1/2 top-[43%] h-[76%] w-[76%] -translate-x-1/2 -translate-y-1/2 rounded-full" />

      <div
        className="relative z-10"
        style={{ animation: "globeFloat 7s ease-in-out infinite" }}
      >
        <div
          className="fabric-orb-core relative h-[225px] w-[225px] overflow-hidden rounded-full md:h-[300px] md:w-[300px] lg:h-[365px] lg:w-[365px]"
        >
          <AmChartsGlobe theme={theme} />
          <div className="fabric-orb-grade pointer-events-none absolute inset-0 rounded-full" />
          <div className="fabric-orb-rim pointer-events-none absolute inset-0 rounded-full border" />
        </div>
      </div>

      {globeLabels.map((label, index) => {
        const selected = activeLabel === index;

        return (
          <button
            key={`${label.number}-${label.title}`}
            type="button"
            onClick={() => setActiveLabel(index)}
            className={`
              fabric-orb-label absolute z-30 max-w-[190px] border px-4 py-3 text-left
              shadow-[0_14px_38px_rgba(3,12,26,0.32)] backdrop-blur-md
              transition-all duration-300 md:max-w-[205px] xl:max-w-[220px]
              ${label.className}
              ${selected
                ? "border-[#C9A96E] bg-[#C9A96E]/10 shadow-[0_0_34px_rgba(201,169,110,0.12)]"
                : "border-[#353535] bg-[rgba(14,39,71,0.9)] hover:-translate-y-0.5 hover:border-[#C9A96E] hover:bg-[rgba(18,50,84,0.95)]"
              }
            `}
          >
            <p className="font-mono text-[7px] font-black uppercase leading-none tracking-[0.22em] text-[#C9A96E] md:text-[8px]">
              {label.number}
            </p>

            <p className="mt-1.5 truncate font-mono text-[8px] font-black uppercase leading-none tracking-[0.2em] text-[#F5F5F5] md:text-[9px] lg:text-[10px]">
              {label.title}
            </p>
          </button>
        );
      })}

      {active && (
        <div className="fabric-orb-caption absolute bottom-[-5%] left-1/2 z-30 w-[370px] -translate-x-1/2 border border-[rgba(201,169,110,0.28)] bg-[rgba(7,25,47,0.95)] px-6 py-5 text-center shadow-[0_24px_70px_rgba(3,12,26,0.44)] backdrop-blur-md md:w-[500px]">
          <button
            type="button"
            onClick={() => setActiveLabel(null)}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-[#2A2A2A] bg-[#111111] text-sm text-[#C9A96E] transition-all duration-300 hover:border-[#C9A96E] hover:bg-[#1A1A1A] hover:text-[#F5F5F5]"
            aria-label="Cerrar información"
          >
            ×
          </button>

          <p className="font-mono text-[8px] font-black uppercase leading-none tracking-[0.24em] text-[#C9A96E]/90">
            {active.eyebrow}
          </p>

          <h3 className="mt-3 font-serif text-[22px] leading-tight tracking-[-0.03em] text-[#F5F5F5] md:text-[29px]">
            {active.detailTitle}
          </h3>

          <p className="mx-auto mt-3 max-w-[420px] text-[12px] leading-6 text-[#A8A8A8] md:text-sm">
            {active.detailText}
          </p>

          <div className="mt-5 flex items-center justify-center gap-2">
            {globeLabels.map((label, index) => (
              <button
                key={label.number}
                type="button"
                onClick={() => setActiveLabel(index)}
                className={`h-1.5 rounded-full transition-all duration-300 ${activeLabel === index
                    ? "w-8 bg-[#C9A96E]"
                    : "w-3 bg-[#353535] hover:bg-[#C9A96E]/50"
                  }`}
                aria-label={`Ver ${label.title}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
});


export default function S01Hero() {
  const { t, lang } = useI18n();
  const [mounted, setMounted] = useState(false);

  const highlightPhrases = useMemo<HighlightPhrase[]>(
    () => [
      { base: t("hero.type.1.base"), gold: t("hero.type.1.gold") },
      { base: t("hero.type.2.base"), gold: t("hero.type.2.gold") },
      { base: t("hero.type.3.base"), gold: t("hero.type.3.gold") },
    ],
    [t],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 80);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <section
      id="inicio"
      data-no-translate
      className="pre-dossier-section p1-dossier-aligned relative flex min-h-[calc(100vh-72px)] w-full items-center overflow-hidden bg-[var(--bg-base)] px-6 pb-16 pt-28 text-[#F5F5F5] md:px-12 md:pt-32 lg:pb-20 lg:pt-28"
    >
      <style>{`
        @keyframes fabricStar {
          0%, 100% { opacity: 0; transform: translateY(0) scale(.85); }
          45%, 65% { opacity: .9; transform: translateY(-10px) scale(1); }
        }

        @keyframes titleReveal {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }

        @keyframes globeFloat {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-7px) scale(1.006); }
        }

        @keyframes globeTwinkle {
          0%, 100% { opacity: .14; transform: scale(.8); }
          50% { opacity: 1; transform: scale(1.18); }
        }

        .fabric-orb-aura {
          background:
            radial-gradient(circle, rgba(240, 207, 122, 0.18), transparent 62%),
            radial-gradient(circle at 42% 38%, rgba(82, 161, 218, 0.2), transparent 46%),
            radial-gradient(circle at 66% 66%, rgba(255, 255, 255, 0.1), transparent 28%);
        }

        .fabric-orb-field {
          background:
            linear-gradient(rgba(var(--accent-rgb), 0.12), rgba(var(--accent-rgb), 0.12)) 50% 50% / 1px 74% no-repeat,
            linear-gradient(90deg, rgba(var(--accent-rgb), 0.12), rgba(var(--accent-rgb), 0.12)) 50% 50% / 74% 1px no-repeat,
            radial-gradient(circle, transparent 57%, rgba(var(--accent-rgb), 0.16) 58%, transparent 59%);
          opacity: 0.7;
          mask-image: radial-gradient(circle, black 0 58%, transparent 76%);
        }

        .fabric-orb-core {
          background:
            radial-gradient(circle at 32% 22%, rgba(219, 239, 255, 0.28), transparent 20%),
            radial-gradient(circle at 63% 62%, rgba(49, 115, 166, 0.34), transparent 35%),
            linear-gradient(135deg, #153f67, #082445 58%, #0f3158);
          box-shadow:
            0 0 58px rgba(82, 161, 218, 0.22),
            0 26px 82px rgba(3, 12, 26, 0.42),
            inset 0 0 0 1px rgba(240, 207, 122, 0.3),
            inset -32px -8px 58px rgba(3, 12, 26, 0.54),
            inset 18px 8px 38px rgba(255, 255, 255, 0.08);
          isolation: isolate;
        }

        .fabric-am-globe-sphere {
          background:
            radial-gradient(circle at 31% 24%, rgba(226, 243, 255, 0.32), transparent 17%),
            radial-gradient(circle at 58% 48%, rgba(56, 137, 202, 0.32), transparent 42%),
            radial-gradient(circle at center, #164a78, #092747 72%);
        }

        .fabric-am-globe-chart {
          position: relative;
          z-index: 1;
        }

        .fabric-am-globe-fallback {
          z-index: 0;
          background:
            radial-gradient(ellipse 16% 11% at 45% 23%, rgba(var(--accent-rgb), 0.92), transparent 70%),
            radial-gradient(ellipse 12% 18% at 55% 34%, rgba(var(--accent-rgb), 0.86), transparent 70%),
            radial-gradient(ellipse 14% 22% at 50% 54%, rgba(var(--accent-rgb), 0.84), transparent 72%),
            radial-gradient(ellipse 11% 10% at 38% 41%, rgba(var(--accent-rgb), 0.72), transparent 70%),
            radial-gradient(ellipse 10% 18% at 63% 56%, rgba(var(--accent-rgb), 0.68), transparent 72%),
            radial-gradient(ellipse 19% 9% at 47% 72%, rgba(var(--accent-rgb), 0.54), transparent 72%),
            radial-gradient(ellipse 8% 7% at 30% 52%, rgba(var(--accent-rgb), 0.52), transparent 72%);
          opacity: 0.96;
          transform: translateZ(0);
        }

        .fabric-am-globe-chart {
          opacity: 0;
          animation: globeChartIn .42s ease-out forwards;
        }

        @keyframes globeChartIn {
          to { opacity: 1; }
        }

        .fabric-am-globe-chart canvas,
        .fabric-am-globe-chart svg {
          border-radius: 999px;
        }

        .fabric-am-globe-shade {
          z-index: 2;
          background:
            radial-gradient(circle at 30% 22%, rgba(255, 255, 255, 0.24), transparent 18%),
            linear-gradient(90deg, rgba(3, 12, 26, 0.28), transparent 42%, rgba(3, 12, 26, 0.58)),
            linear-gradient(155deg, transparent 42%, rgba(3, 12, 26, 0.34));
          box-shadow:
            inset -20px 0 52px rgba(3, 12, 26, 0.54),
            inset 18px 0 34px rgba(219, 239, 255, 0.1);
        }

        .fabric-orb-grade {
          background:
            radial-gradient(circle at 30% 22%, rgba(255, 255, 255, 0.18), transparent 18%),
            radial-gradient(circle at 70% 72%, rgba(var(--accent-rgb), 0.12), transparent 25%);
          mix-blend-mode: normal;
        }

        .fabric-orb-rim {
          border-color: rgba(240, 207, 122, 0.36);
          box-shadow:
            inset -20px 0 52px rgba(3, 12, 26, 0.62),
            inset 18px 0 34px rgba(219, 239, 255, 0.12),
            0 0 0 1px rgba(255, 255, 255, 0.08);
        }

        .fabric-hero-copy {
          color: rgba(245, 245, 245, 0.82);
        }

        .fabric-hero-migrations {
          color: #8A8A8A;
        }

        .fabric-hero-stats {
          background: rgba(7, 25, 47, 0.82);
          border-color: rgba(240, 207, 122, 0.2);
          box-shadow: 0 18px 52px rgba(3, 12, 26, 0.22);
        }

        .fabric-hero-stat {
          border-color: rgba(240, 207, 122, 0.16);
        }

        .fabric-hero-stat-number {
          color: #C9A96E;
        }

        .fabric-hero-stat-label {
          color: #C2C2C2;
        }

        html[data-theme="light"] .fabric-orb-aura {
          background:
            radial-gradient(circle, rgba(var(--accent-rgb), 0.16), transparent 62%),
            radial-gradient(circle at 42% 38%, rgba(89, 119, 101, 0.16), transparent 44%),
            radial-gradient(circle at 66% 66%, rgba(255, 255, 255, 0.72), transparent 30%);
        }

        html[data-theme="light"] .fabric-orb-field {
          background:
            linear-gradient(rgba(var(--accent-rgb), 0.16), rgba(var(--accent-rgb), 0.16)) 50% 50% / 1px 74% no-repeat,
            linear-gradient(90deg, rgba(var(--accent-rgb), 0.16), rgba(var(--accent-rgb), 0.16)) 50% 50% / 74% 1px no-repeat,
            radial-gradient(circle, transparent 57%, rgba(105, 83, 48, 0.16) 58%, transparent 59%);
          opacity: 0.52;
        }

        html[data-theme="light"] .fabric-orb-core {
          background:
            radial-gradient(circle at 32% 22%, rgba(255, 255, 255, 0.72), transparent 21%),
            radial-gradient(circle at 63% 62%, rgba(110, 137, 111, 0.18), transparent 36%),
            linear-gradient(135deg, #efe5d1, #d5ccba 58%, #f8f4eb);
          box-shadow:
            0 18px 70px rgba(150, 105, 35, 0.14),
            0 4px 18px rgba(88, 72, 48, 0.08),
            inset 0 0 0 1px rgba(var(--accent-rgb), 0.25),
            inset -32px -8px 58px rgba(117, 95, 56, 0.18),
            inset 18px 8px 38px rgba(255, 255, 255, 0.48);
        }

        html[data-theme="light"] .fabric-am-globe-sphere {
          background:
            radial-gradient(circle at 31% 24%, rgba(255, 255, 255, 0.62), transparent 17%),
            radial-gradient(circle at 58% 48%, rgba(95, 126, 109, 0.16), transparent 42%),
            radial-gradient(circle at center, #ece4d5, #d4cab7 72%);
        }

        html[data-theme="light"] .fabric-am-globe-fallback {
          opacity: 0.74;
        }

        html[data-theme="light"] .fabric-orb-grade {
          background:
            radial-gradient(circle at 30% 22%, rgba(255, 255, 255, 0.62), transparent 18%),
            radial-gradient(circle at 72% 72%, rgba(var(--accent-rgb), 0.12), transparent 24%);
        }

        html[data-theme="light"] .fabric-am-globe-shade {
          background:
            radial-gradient(circle at 30% 22%, rgba(255, 255, 255, 0.44), transparent 18%),
            linear-gradient(90deg, rgba(117, 92, 50, 0.2), transparent 44%, rgba(102, 81, 48, 0.26)),
            linear-gradient(155deg, transparent 42%, rgba(89, 119, 101, 0.12));
          box-shadow:
            inset -22px 0 46px rgba(119, 91, 42, 0.16),
            inset 18px 0 30px rgba(255, 255, 255, 0.28);
        }

        html[data-theme="light"] .fabric-orb-rim {
          border-color: rgba(var(--accent-rgb), 0.32);
          box-shadow:
            inset -22px 0 46px rgba(119, 91, 42, 0.18),
            inset 18px 0 30px rgba(255, 255, 255, 0.3),
            0 0 0 1px rgba(255, 255, 255, 0.38);
        }

        html[data-theme="light"] .fabric-hero-copy {
          color: #3F423B;
        }

        html[data-theme="light"] .fabric-hero-migrations {
          color: #5F655C;
        }

        html[data-theme="light"] .fabric-hero-stats {
          background: rgba(247, 243, 234, 0.64);
          border-color: rgba(126, 102, 63, 0.34);
          box-shadow: 0 18px 46px rgba(88, 72, 48, 0.08);
        }

        html[data-theme="light"] .fabric-hero-stat {
          border-color: rgba(126, 102, 63, 0.28);
        }

        html[data-theme="light"] .fabric-hero-stat-number {
          color: #9A6425;
          text-shadow: 0 1px 0 rgba(255, 255, 255, 0.55);
        }

        html[data-theme="light"] .fabric-hero-stat-label {
          color: #6F6B62;
          text-shadow: 0 1px 0 rgba(255, 255, 255, 0.62);
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: .001ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
          }
        }

        @media (max-width: 767px) {
          .fabric-orb-stage,
          .fabric-typewriter {
            content-visibility: auto;
            contain-intrinsic-size: 520px;
          }

          .fabric-orb-stage span,
          .fabric-orb-core,
          .fabric-orb-aura,
          .fabric-orb-field {
            animation: none !important;
          }

          .fabric-hero-badge,
          .fabric-hero-stats,
          .fabric-hero-migrations,
          .fabric-typewriter {
            transform: translateZ(0);
          }
        }
      `}</style>

      <BackgroundParticles />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(201,169,110,0.12),transparent_28%),radial-gradient(circle_at_78%_55%,rgba(201,169,110,0.09),transparent_36%)]" />
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-10" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#050203] to-transparent" />

      <div className="relative z-10 mx-auto grid w-full max-w-[1460px] grid-cols-1 items-center gap-12 lg:grid-cols-[1.16fr_0.84fr] lg:gap-10">
        <div className="relative z-20 max-w-5xl">
          <div
            className={`fabric-hero-badge inline-flex items-center gap-2.5 rounded-full border border-[#C9A96E]/30 bg-[#C9A96E]/5 px-4 py-2 backdrop-blur-md transition-all duration-700 ${mounted ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
              }`}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inset-0 animate-ping rounded-full bg-[#D4AF37] opacity-70" />
              <span className="relative h-1.5 w-1.5 rounded-full bg-[#C9A96E]" />
            </span>

            <span className="font-mono text-[8.5px] font-semibold uppercase tracking-[0.22em] text-[#F5F5F5]">
              {t("hero.badge")}
            </span>
          </div>

          <h1
            className="mt-7 max-w-[1120px] font-serif text-[clamp(44px,5.8vw,98px)] font-light leading-[1.1] tracking-tight text-[#F5F5F5] drop-shadow-[0_2px_20px_rgba(201,169,110,0.22)]"
            style={{
              animation: "titleReveal .9s cubic-bezier(.16,1,.3,1) .18s both",
            }}
          >
            {t("hero.h1")} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F5F5F5] via-[#FFF5E0] to-[#C9A96E] font-normal italic">
              {t("hero.h2.before")}
            </span> <br />
            {t("hero.h2.gold")}
          </h1>

          <div
            className="max-w-3xl mt-8 space-y-4 font-sans font-light"
            style={{
              animation: "titleReveal .9s cubic-bezier(.16,1,.3,1) .5s both",
            }}
          >
            <div className="border-l-2 border-[#C9A96E]/25 pl-4 py-1.5 bg-zinc-950/20 rounded-r-xl text-[#A8A8A8] text-base leading-relaxed md:text-lg">
              {lang === 'es' ? (
                <>
                  El <strong className="text-[#F5F5F5] font-semibold">73% de las implementaciones</strong> Oracle Fusion celebran el "go-live" y abandonan al cliente con cierres contables pesados, reportes manuales paralelos e incidencias críticas abiertas.
                </>
              ) : (
                <>
                  <strong className="text-[#F5F5F5] font-semibold">73% of Oracle Fusion implementations</strong> celebrate the "go-live" and abandon the client with heavy accounting closes, parallel manual reports, and open critical incidents.
                </>
              )}
            </div>
            <p className="text-[#D4D4D8] text-base leading-relaxed md:text-lg">
              {t("hero.body.part2")}{" "}
              <span className="text-[#C9A96E] font-mono font-bold tracking-wider">
                {t("hero.body.contract")}
              </span>.
            </p>
          </div>

          <div
            className="fabric-hero-stats mt-7 grid max-w-3xl grid-cols-3 overflow-hidden border"
            style={{
              animation: "titleReveal .9s cubic-bezier(.16,1,.3,1) .56s both",
            }}
          >
            {[
              [t("hero.stat.1.number"), t("hero.stat.1.label")],
              [t("hero.stat.2.number"), t("hero.stat.2.label")],
              [t("hero.stat.3.number"), t("hero.stat.3.label")],
            ].map(([number, label], index) => (
              <div
                key={label}
                className={`fabric-hero-stat px-4 py-4 ${index !== 2 ? "border-r" : ""
                  }`}
              >
                <p className="fabric-hero-stat-number font-serif text-3xl leading-none md:text-4xl">
                  {number}
                </p>

                <p className="fabric-hero-stat-label mt-2 font-mono text-[10px] font-black uppercase leading-4 tracking-[0.16em] md:text-[11px]">
                  {label}
                </p>
              </div>
            ))}
          </div>

          <p
            className="fabric-hero-migrations mt-4 font-mono text-[11px] font-bold uppercase tracking-[0.18em]"
            style={{
              animation: "titleReveal .9s cubic-bezier(.16,1,.3,1) .6s both",
            }}
          >
            {t("hero.migrations")}
          </p>

          <TypewriterCarousel phrases={highlightPhrases} />

          <div
            className={`mt-9 flex flex-col gap-4 transition-all delay-1000 duration-1000 sm:flex-row sm:items-center ${mounted ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
              }`}
          >
            <Link
              to="/#radar-admision"
              onClick={(e) => {
                if (window.location.pathname === '/') {
                  e.preventDefault();
                  const target = document.getElementById('radar-admision');
                  if (target) {
                    const header = document.querySelector<HTMLElement>('header[data-no-translate]');
                    const headerOffset = (header?.offsetHeight ?? 0) + 12;
                    const top = target.getBoundingClientRect().top + window.scrollY - headerOffset;
                    window.scrollTo({ top, behavior: 'smooth' });
                  }
                }
              }}
              className="relative inline-flex min-w-[250px] items-center justify-center overflow-hidden border border-[#C9A96E]/45 bg-[#C9A96E]/[0.06] px-8 py-4 font-mono text-[11px] font-black uppercase tracking-[0.24em] text-[#F5F5F5] transition-all duration-300 hover:-translate-y-1 hover:border-[#C9A96E] hover:bg-[#C9A96E]/[0.12] hover:text-[#C9A96E] hover:shadow-[0_0_28px_rgba(201,169,110,0.18)] max-sm:min-w-0 max-sm:w-full max-sm:px-5 max-sm:text-[9px]"
            >
              <span className="relative z-10">{t("cta.start")}</span>
              <span className="relative z-10 ml-3">-&gt;</span>
            </Link>

            <Link
              to="/#radar-admision"
              onClick={(e) => {
                if (window.location.pathname === '/') {
                  e.preventDefault();
                  const target = document.getElementById('radar-admision');
                  if (target) {
                    const header = document.querySelector<HTMLElement>('header[data-no-translate]');
                    const headerOffset = (header?.offsetHeight ?? 0) + 12;
                    const top = target.getBoundingClientRect().top + window.scrollY - headerOffset;
                    window.scrollTo({ top, behavior: 'smooth' });
                  }
                }
              }}
              className="btn-primary min-w-[250px] max-sm:min-w-0"
            >
              {t("cta.audit")} <span className="text-[#C9A96E]">-&gt;</span>
            </Link>
          </div>
        </div>

        <div className="relative z-10 mx-auto w-full max-w-[620px] md:mx-auto lg:ml-auto lg:mr-28 xl:mr-36 2xl:mr-40">
          <PremiumGlobe />
        </div>
      </div>
    </section>
  );
}

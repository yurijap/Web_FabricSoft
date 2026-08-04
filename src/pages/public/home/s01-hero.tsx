import { memo, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../../../i18n/I18nProvider";

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
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(() => {
    const first = phrases[0];
    return first ? first.base.length + first.gold.length : 0;
  });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const first = phrases[0];
    if (!first) return;

    setPhraseIndex(0);
    setDeleting(false);
    setCharIndex(first.base.length + first.gold.length);
  }, [phrases]);

  useEffect(() => {
    const phrase = phrases[phraseIndex] ?? phrases[0];
    if (!phrase) return;

    const totalLength = phrase.base.length + phrase.gold.length;

    if (!deleting && charIndex === totalLength) {
      const pause = window.setTimeout(() => setDeleting(true), 2450);
      return () => window.clearTimeout(pause);
    }

    if (deleting && charIndex === 0) {
      setDeleting(false);
      setPhraseIndex((current) => (current + 1) % phrases.length);
      return;
    }

    const timer = window.setTimeout(() => {
      setCharIndex((current) => current + (deleting ? -1 : 1));
    }, deleting ? 16 : 28);

    return () => window.clearTimeout(timer);
  }, [charIndex, deleting, phraseIndex, phrases]);

  const phrase = phrases[phraseIndex] ?? phrases[0];
  if (!phrase) return null;

  const base = phrase.base.slice(0, charIndex);
  const gold =
    charIndex > phrase.base.length
      ? phrase.gold.slice(0, charIndex - phrase.base.length)
      : "";

  return (
    <div className="fabric-typewriter relative mt-6 flex min-h-[66px] w-full max-w-[700px] items-center overflow-hidden border-l-2 border-[#D4AF37] bg-gradient-to-r from-[#D4AF37]/13 via-[#D4AF37]/6 to-transparent px-5 py-4">
      <span className="relative z-10 text-sm font-bold leading-relaxed text-[#F5F5F5] md:text-base">
        {base}
        <span className="text-[#D4AF37]">{gold}</span>
        <span className="ml-1 inline-block h-[1em] w-[2px] animate-pulse bg-[#D4AF37] align-middle" />
      </span>
    </div>
  );
});





const PremiumGlobe = memo(function PremiumGlobe() {
  const { t } = useI18n();
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
        className: "left-[-7%] top-[2%]",
      },
      {
        number: "02",
        title: t("hero.orb.2"),
        eyebrow: "MIGRACIÓN CRÍTICA",
        detailTitle: "Una migración Oracle no debe depender de improvisación.",
        detailText:
          "FABRIC estructura migraciones con gobierno técnico, trazabilidad, validación operativa y responsabilidad por fase para reducir incertidumbre ejecutiva.",
        className: "right-[-9%] top-[17%]",
      },
      {
        number: "03",
        title: t("hero.orb.3"),
        eyebrow: "ESTABILIZACIÓN ORACLE",
        detailTitle: "No basta con entregar. Tiene que operar.",
        detailText:
          "El proyecto se considera sólido cuando el primer ciclo crítico funciona sin reportes paralelos, dependencia manual o incidencias bloqueantes.",
        className: "left-[-5%] bottom-[33%]",
      },
    ],
    [t],
  );

  const active = activeLabel !== null ? globeLabels[activeLabel] : null;

  return (
    <div className="fabric-orb-stage relative mx-auto flex min-h-[520px] w-full max-w-[700px] items-center justify-center overflow-visible md:min-h-[600px] lg:min-h-[660px]">
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

      <div className="pointer-events-none absolute left-1/2 top-[43%] h-[72%] w-[72%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(201,169,110,0.11),transparent_66%)] blur-2xl" />

      <div
        className="pointer-events-none absolute left-1/2 top-[43%] h-[48%] w-[78%] rounded-full border border-[rgba(201,169,110,0.14)]"
        style={{ animation: "orbitRotate 46s linear infinite" }}
      />

      <div
        className="pointer-events-none absolute left-1/2 top-[43%] h-[68%] w-[52%] rounded-full border border-[rgba(201,169,110,0.08)]"
        style={{ animation: "orbitRotate 60s linear infinite reverse" }}
      />

      <div
        className="relative z-10"
        style={{ animation: "globeFloat 7s ease-in-out infinite" }}
      >
        <div
          className="fabric-orb-core relative h-[225px] w-[225px] overflow-hidden rounded-full md:h-[300px] md:w-[300px] lg:h-[365px] lg:w-[365px]"
          style={{
            backgroundImage:
              "url('https://pub-940ccf6255b54fa799a9b01050e6c227.r2.dev/globe.jpeg')",
            backgroundSize: "cover",
            backgroundPosition: "left center",
            animation: "earthRotate 40s linear infinite",
            boxShadow:
              "0 0 54px rgba(201,169,110,.16), -10px 0 18px rgba(195,244,255,.30) inset, 24px 8px 48px rgba(0,0,0,.92) inset, -32px -6px 50px rgba(195,244,255,.12) inset, 185px 0 74px rgba(0,0,0,.72) inset, 116px 0 58px rgba(0,0,0,.84) inset",
          }}
        >
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_22%,rgba(255,255,255,0.22),transparent_24%,transparent_100%)]" />
          <div className="absolute inset-0 rounded-full bg-[linear-gradient(90deg,rgba(0,0,0,.76),transparent_36%,transparent_58%,rgba(0,0,0,.88))]" />
          <div className="absolute inset-0 rounded-full border border-white/10" />
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
              fabric-orb-label absolute z-30 max-w-[230px] border px-4 py-3 text-left
              shadow-[0_14px_38px_rgba(0,0,0,0.42)] backdrop-blur-md
              transition-all duration-300 md:max-w-[250px]
              ${label.className}
              ${selected
                ? "border-[#C9A96E] bg-[#C9A96E]/10 shadow-[0_0_34px_rgba(201,169,110,0.12)]"
                : "border-[#353535] bg-[#080706]/90 hover:-translate-y-0.5 hover:border-[#C9A96E] hover:bg-[#111111]/95"
              }
            `}
          >
            <p className="font-mono text-[7px] font-black uppercase leading-none tracking-[0.22em] text-[#C9A96E] md:text-[8px]">
              {label.number}
            </p>

            <p className="mt-1.5 truncate font-mono text-[8px] font-black uppercase leading-none tracking-[0.24em] text-[#F5F5F5] md:text-[9px] lg:text-[10px]">
              {label.title}
            </p>
          </button>
        );
      })}

      {active && (
        <div className="fabric-orb-caption absolute bottom-[-5%] left-1/2 z-30 w-[370px] -translate-x-1/2 border border-[rgba(201,169,110,0.28)] bg-[#080808]/95 px-6 py-5 text-center shadow-[0_24px_70px_rgba(0,0,0,0.72)] backdrop-blur-md md:w-[500px]">
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
  const { t } = useI18n();
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
      className="pre-dossier-section p1-dossier-aligned relative flex min-h-[calc(100vh-72px)] w-full items-center overflow-hidden bg-[#050203] px-6 pb-16 pt-28 text-[#F5F5F5] md:px-12 md:pt-32 lg:pb-20 lg:pt-28"
    >
      <style>{`
        @keyframes fabricStar {
          0%, 100% { opacity: 0; transform: translateY(0) scale(.85); }
          45%, 65% { opacity: .9; transform: translateY(-10px) scale(1); }
        }

        @keyframes titleReveal {
          0% { opacity: 0; transform: translateY(18px); filter: blur(8px); }
          100% { opacity: 1; transform: translateY(0); filter: blur(0); }
        }

        @keyframes earthRotate {
          0% { background-position: 0 0; }
          100% { background-position: 520px 0; }
        }

        @keyframes globeFloat {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-10px) scale(1.01); }
        }

        @keyframes globeTwinkle {
          0%, 100% { opacity: .14; transform: scale(.8); }
          50% { opacity: 1; transform: scale(1.18); }
        }

        @keyframes orbitRotate {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: .001ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
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
            className="mt-7 max-w-[1120px] font-serif text-[clamp(64px,8vw,132px)] leading-[0.84] tracking-[-0.075em] text-[#F5F5F5]"
            style={{
              animation: "titleReveal .9s cubic-bezier(.16,1,.3,1) .18s both",
            }}
          >
            {t("hero.h1")}
          </h1>

          <h2
            className="mt-6 max-w-5xl font-serif text-[clamp(40px,4.8vw,78px)] font-semibold leading-[0.98] tracking-[-0.055em] text-[#F5F5F5]"
            style={{
              animation: "titleReveal .9s cubic-bezier(.16,1,.3,1) .34s both",
            }}
          >
            {t("hero.h2.before")}
            <span className="text-[#C9A96E]">{t("hero.h2.gold")}</span>
          </h2>

          <p
            className="mt-7 max-w-3xl text-base leading-8 text-[#F5F5F5]/82 md:text-xl"
            style={{
              animation: "titleReveal .9s cubic-bezier(.16,1,.3,1) .5s both",
            }}
          >
            {t("hero.body")}
          </p>

          <div
            className="mt-7 grid max-w-3xl grid-cols-3 overflow-hidden border border-[#2A2A2A] bg-[#080706]/70"
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
                className={`px-4 py-4 ${index !== 2 ? "border-r border-[#2A2A2A]" : ""
                  }`}
              >
                <p className="font-serif text-3xl leading-none text-[#C9A96E] md:text-4xl">
                  {number}
                </p>

                <p className="mt-2 font-mono text-[8px] font-bold uppercase leading-4 tracking-[0.18em] text-[#8A8A8A]">
                  {label}
                </p>
              </div>
            ))}
          </div>

          <p
            className="mt-4 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8A8A8A]"
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
              to="/#fabric-ai"
              className="relative inline-flex min-w-[250px] items-center justify-center overflow-hidden border border-[#353535] bg-transparent px-8 py-4 font-mono text-[11px] font-black uppercase tracking-[0.24em] text-[#F5F5F5] transition-all duration-300 hover:-translate-y-1 hover:border-[#C9A96E] hover:bg-[#C9A96E]/[0.045] hover:text-[#C9A96E] hover:shadow-[0_0_28px_rgba(201,169,110,0.12)] max-sm:min-w-0 max-sm:w-full max-sm:px-5 max-sm:text-[9px]"
            >
              <span className="relative z-10">{t("cta.start")}</span>
              <span className="relative z-10 ml-3">-&gt;</span>
            </Link>

            <Link
              to="/optimizador-oci"
              className="btn-primary min-w-[250px] max-sm:min-w-0"
            >
              {t("cta.audit")} <span className="text-[#C9A96E]">-&gt;</span>
            </Link>
          </div>
        </div>

        <div className="relative z-10 mx-auto w-full max-w-[700px] md:mx-auto lg:ml-auto">
          <PremiumGlobe />
        </div>
      </div>
    </section>
  );
}
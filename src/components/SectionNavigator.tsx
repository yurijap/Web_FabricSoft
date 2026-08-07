import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

type SectionItem = {
  id: string;
  label: string;
  number: string;
};

const sections: SectionItem[] = [
  { id: "inicio", label: "Hero", number: "01" },
  { id: "radar-admision", label: "Radar de Admisión", number: "02" },
  { id: "comparadores", label: "Comparadores", number: "03" },
  { id: "doctrina-operativa", label: "Doctrina Operativa", number: "04" },
  { id: "casos-ancla", label: "Casos Ancla", number: "05" },
  { id: "audit-trail-section", label: "Casos Auditables", number: "06" },
  { id: "industrias-focales", label: "Industrias Focales", number: "07" },
  { id: "rescue-assessment-section", label: "Rescue Assessment", number: "08" },
  { id: "referencias", label: "Validación Directa", number: "09" },
  { id: "transparencia", label: "Transparencia", number: "10" },
  { id: "investigacion-section", label: "Investigación", number: "11" },
  { id: "apply-reverse-section", label: "Evaluación Proyectos", number: "12" },
  { id: "founder-manifesto-section", label: "Manifiesto Fundador", number: "13" },
  { id: "waitlist-section", label: "Wait List 2026", number: "14" },
];

const legacyHashAliases: Record<string, string> = {
  s07: "casos",
  s08: "industrias",
  s09: "fabric-os",
  s10: "lifecycle",
  s11: "office-hours",
  s12: "referencias",
  s13: "transparencia",
  s14: "investigacion",
  s15: "founder-wait-list",
};

const getCanonicalHashId = () => {
  const hashId = decodeURIComponent(window.location.hash.replace("#", ""));
  return legacyHashAliases[hashId] ?? hashId;
};

const isKnownSection = (id: string) => sections.some((section) => section.id === id);

const getHeaderOffset = () => {
  const header = document.querySelector<HTMLElement>("header[data-no-translate]");
  return (header?.offsetHeight ?? 0) + 12;
};

const getVisualSectionInset = (id: string) => {
  if (id === "inicio") return 0;
  return Math.min(88, Math.max(48, window.innerHeight * 0.08));
};

function useDesktopSectionNavigator() {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(min-width: 1024px)").matches : false,
  );

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(media.matches);

    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return isDesktop;
}

function DesktopSectionNavigator() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("inicio");

  useEffect(() => {
    let ticking = false;

    const updateActiveSection = () => {
      const hashId = getCanonicalHashId();
      if (window.location.pathname === "/" && isKnownSection(hashId)) {
        setActiveSection(hashId);
        ticking = false;
        return;
      }

      const scrollPosition = window.scrollY + getHeaderOffset() + 80;
      let nextSection = sections[0].id;

      sections.forEach((section) => {
        const element = document.getElementById(section.id);
        if (!element) return;

        const sectionTop = element.getBoundingClientRect().top + window.scrollY;
        if (sectionTop <= scrollPosition) {
          nextSection = section.id;
        }
      });

      setActiveSection(nextSection);
      ticking = false;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(updateActiveSection);
    };

    updateActiveSection();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    const hashId = legacyHashAliases[decodeURIComponent(location.hash.replace("#", ""))] ?? decodeURIComponent(location.hash.replace("#", ""));
    if (isKnownSection(hashId)) {
      const frame = window.requestAnimationFrame(() => setActiveSection(hashId));
      return () => window.cancelAnimationFrame(frame);
    }
  }, [location.hash]);

  const scrollToSection = (id: string) => {
    setActiveSection(id);

    if (location.pathname === "/" && location.hash === `#${id}`) {
      const section = document.getElementById(id);
      if (!section) return;

      const top = section.getBoundingClientRect().top + window.scrollY - getHeaderOffset() + getVisualSectionInset(id);
      window.scrollTo({ top, behavior: "smooth" });
      return;
    }

    navigate({ pathname: "/", hash: `#${id}` }, { replace: false });
  };

  return (
    <aside className="fixed right-4 lg:right-6 top-1/2 z-50 hidden -translate-y-1/2 lg:block pointer-events-none">
      <nav className="relative flex flex-col items-center gap-4 py-6 pointer-events-auto">
        <div className="absolute left-1/2 top-0 bottom-0 w-[1px] -translate-x-1/2 bg-gradient-to-b from-transparent via-[#2A2A2A] to-transparent opacity-80" />

        {sections.map((section) => {
          const isActive = activeSection === section.id;

          return (
            <div key={section.id} className="relative group flex items-center justify-center w-6 h-6">
              <div
                className={`
                  absolute right-10 top-1/2 -translate-y-1/2 flex items-center gap-3
                  opacity-0 translate-x-2 pointer-events-none transition-all duration-300 ease-out
                  group-hover:opacity-100 group-hover:translate-x-0
                `}
              >
                <div className="bg-[#0A0A0A]/90 backdrop-blur-md border border-[#2A2A2A] px-3 py-2 rounded-sm flex flex-col items-end whitespace-nowrap shadow-[0_5px_15px_rgba(0,0,0,0.5)]">
                  <span className="font-mono text-[8px] text-[#C9A96E] font-bold tracking-[0.2em] uppercase leading-none mb-1.5">
                    {section.number}
                  </span>
                  <span className="font-sans text-[11px] text-[#F5F5F5] leading-none">
                    {section.label}
                  </span>
                </div>
                <div className="w-4 h-[1px] bg-[#2A2A2A]" />
              </div>

              <button
                type="button"
                onClick={() => scrollToSection(section.id)}
                className="relative z-10 flex items-center justify-center w-full h-full outline-none"
                aria-label={`Ir a ${section.label}`}
              >
                <span
                  className={`
                    absolute inset-0 rounded-full border transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
                    ${isActive
                      ? "border-[#C9A96E]/40 scale-100 shadow-[0_0_10px_rgba(201,169,110,0.2)]"
                      : "border-transparent scale-50 group-hover:border-[#555] group-hover:scale-75"
                    }
                  `}
                />

                <span
                  className={`
                    rounded-full transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
                    ${isActive
                      ? "w-1.5 h-1.5 bg-[#C9A96E] shadow-[0_0_8px_rgba(201,169,110,0.8)]"
                      : "w-1 h-1 bg-[#444] group-hover:w-1.5 group-hover:h-1.5 group-hover:bg-[#C9A96E]"
                    }
                  `}
                />
              </button>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

export default function SectionNavigator() {
  const isDesktop = useDesktopSectionNavigator();
  return isDesktop ? <DesktopSectionNavigator /> : null;
}

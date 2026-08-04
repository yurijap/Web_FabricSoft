import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

type SectionItem = {
  id: string;
  label: string;
  number: string;
};

const sections: SectionItem[] = [
  { id: "inicio",           label: "Hero",                       number: "01" },
  { id: "tco",              label: "ERP TCO · AI",               number: "02" },
  { id: "rescue-diagnostic", label: "Rescue Diagnostic",          number: "03" },
  { id: "doctrina",         label: "Doctrina",                   number: "04" },
  { id: "s07",              label: "Casos · Industrias",         number: "05" },
  { id: "rescue-assessment",label: "Rescue Assessment",          number: "06" },
  { id: "s09",              label: "FABRIC OS · Lifecycle",      number: "07" },
  { id: "s11",              label: "Office Hours",               number: "08" },
  { id: "s12",              label: "Referencias",                number: "09" },
  { id: "s13",              label: "Transparencia · Investigación", number: "10" },
  { id: "s15",              label: "Founder · Wait List",        number: "11" },
];

export default function SectionNavigator() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("inicio");

  useEffect(() => {
    let ticking = false;

    const updateActiveSection = () => {
      const scrollPosition = window.scrollY + 180;
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
    const hashId = decodeURIComponent(location.hash.replace("#", ""));
    if (sections.some((section) => section.id === hashId)) {
      setActiveSection(hashId);
    }
  }, [location.hash]);

  const scrollToSection = (id: string) => {
    const section = document.getElementById(id);
    if (!section) return;
    setActiveSection(id);
    navigate({ pathname: "/", hash: `#${id}` }, { replace: false });

    const top = section.getBoundingClientRect().top + window.scrollY - 16;
    window.scrollTo({ top, behavior: "smooth" });
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

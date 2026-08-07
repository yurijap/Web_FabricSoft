import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

type Theme = 'dark' | 'light';
type ThemeTransitionOrigin = { x: number; y: number };
type ThemeTransitionOptions = { origin?: ThemeTransitionOrigin };

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme, options?: ThemeTransitionOptions) => void;
  toggleTheme: (options?: ThemeTransitionOptions) => void;
};

const STORAGE_KEY = 'fabric-theme';
const ThemeContext = createContext<ThemeContextValue | null>(null);
const THEME_TRANSITION_CLASS = 'fabric-theme-changing';
const THEME_TRANSITION_MS = 120;

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => {
    ready: Promise<void>;
    finished: Promise<void>;
  };
};

type PseudoElementAnimationOptions = KeyframeAnimationOptions & {
  pseudoElement?: string;
};

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'dark' || stored === 'light') return stored;

  return 'dark';
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', theme === 'light' ? '#F7F5F0' : '#0B1F3A');
}

function persistTheme(theme: Theme) {
  window.localStorage.setItem(STORAGE_KEY, theme);
  window.dispatchEvent(new CustomEvent('fabric-theme-change', { detail: theme }));
}

function getTransitionOrigin(origin?: ThemeTransitionOrigin) {
  return {
    x: origin?.x ?? window.innerWidth - 40,
    y: origin?.y ?? 40,
  };
}

function getRevealRadius({ x, y }: ThemeTransitionOrigin) {
  return Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  );
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const changeTheme = (nextTheme: Theme, options?: ThemeTransitionOptions) => {
    if (nextTheme === theme) return;

    const root = document.documentElement;
    const viewTransitionDocument = document as ViewTransitionDocument;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const commit = () => {
      applyTheme(nextTheme);
      persistTheme(nextTheme);
      setThemeState(nextTheme);
    };

    if (viewTransitionDocument.startViewTransition && !prefersReducedMotion) {
      const transition = viewTransitionDocument.startViewTransition(commit);
      const origin = getTransitionOrigin(options?.origin);
      const radius = getRevealRadius(origin);

      transition.ready
        .then(() => {
          root.animate(
            {
              clipPath: [
                `circle(0px at ${origin.x}px ${origin.y}px)`,
                `circle(${radius}px at ${origin.x}px ${origin.y}px)`,
              ],
            },
            {
              duration: THEME_TRANSITION_MS,
              easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
              pseudoElement: '::view-transition-new(root)',
            } as PseudoElementAnimationOptions,
          );
        })
        .catch(() => undefined);
      return;
    }

    root.classList.add(THEME_TRANSITION_CLASS);
    commit();
    window.setTimeout(() => root.classList.remove(THEME_TRANSITION_CLASS), THEME_TRANSITION_MS);
  };

  const value = useMemo<ThemeContextValue>(() => ({
    theme,
    setTheme: changeTheme,
    toggleTheme: (options?: ThemeTransitionOptions) => changeTheme(theme === 'dark' ? 'light' : 'dark', options),
  }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return value;
}

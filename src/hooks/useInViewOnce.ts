import { useEffect, useRef, useState } from 'react';

export function useInViewOnce<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === 'undefined') {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.1, rootMargin: '150px 0px 0px 0px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return [ref, isInView] as const;
}

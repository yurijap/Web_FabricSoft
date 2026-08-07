import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

interface ViewportLoaderProps {
  children: React.ReactNode;
  height?: number | string;
  id?: string;
}

export default function ViewportLoader({ children, height = 400, id }: ViewportLoaderProps) {
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === "/" && location.hash) {
      setIsInView(true);
    }
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (isInView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "300px 0px", // Carga anticipadamente a 300px del viewport
        threshold: 0,
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [isInView]);

  return (
    <div
      id={id}
      ref={ref}
      style={!isInView ? { minHeight: height } : undefined}
      className="w-full"
    >
      {isInView ? children : null}
    </div>
  );
}

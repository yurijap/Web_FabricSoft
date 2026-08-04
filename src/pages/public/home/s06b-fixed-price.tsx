import { useEffect, useRef, useState } from 'react';

// =========================================================================
// 1. MOTOR 3D NATIVO (Cero dependencias, 100% optimizado)
// =========================================================================
class Vector2D {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  static random(min: number, max: number): number { return min + Math.random() * (max - min); }
}

class Vector3D {
  x: number;
  y: number;
  z: number;

  constructor(x: number, y: number, z: number) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  static random(min: number, max: number): number { return min + Math.random() * (max - min); }
}

class AnimationController {
  private rafId: number = 0;
  private time = 0;
  private startTime = Date.now();
  private readonly duration = 15000; // 15 segundos por ciclo
  
  private ctx: CanvasRenderingContext2D;
  private size: number;
  private stars: Star[] = [];
  
  private readonly changeEventTime = 0.32;
  private readonly cameraZ = -400;
  private readonly cameraTravelDistance = 3400;
  private readonly startDotYOffset = 28;
  private readonly viewZoom = 100;
  private readonly numberOfStars = 2500; // Optimizado para 60fps constantes
  
  constructor(_canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, size: number) {
    this.ctx = ctx;
    this.size = size;
    
    this.setupRandomGenerator();
    this.createStars();
    this.startLoop();
  }
  
  private setupRandomGenerator() {
    const originalRandom = Math.random;
    const customRandom = () => {
      let seed = 1234;
      return () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
      };
    };
    Math.random = customRandom();
    this.createStars();
    Math.random = originalRandom;
  }
  
  private createStars() {
    this.stars = [];
    for (let i = 0; i < this.numberOfStars; i++) {
      this.stars.push(new Star(this.cameraZ, this.cameraTravelDistance));
    }
  }
  
  // REEMPLAZO NATIVO DE GSAP
  private startLoop() {
    const loop = () => {
      const elapsed = (Date.now() - this.startTime) % this.duration;
      this.time = elapsed / this.duration; // Va de 0 a 1
      this.render();
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }
  
  public ease(p: number, g: number): number {
    if (p < 0.5) return 0.5 * Math.pow(2 * p, g);
    else return 1 - 0.5 * Math.pow(2 * (1 - p), g);
  }
  
  public easeOutElastic(x: number): number {
    const c4 = (2 * Math.PI) / 4.5;
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    return Math.pow(2, -8 * x) * Math.sin((x * 8 - 0.75) * c4) + 1;
  }
  
  public map(value: number, start1: number, stop1: number, start2: number, stop2: number): number {
    return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
  }
  
  public constrain(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }
  
  public lerp(start: number, end: number, t: number): number {
    return start * (1 - t) + end * t;
  }
  
  public spiralPath(p: number): Vector2D {
    p = this.constrain(1.2 * p, 0, 1);
    p = this.ease(p, 1.8);
    const numberOfSpiralTurns = 6;
    const theta = 2 * Math.PI * numberOfSpiralTurns * Math.sqrt(p);
    const r = 170 * Math.sqrt(p);
    return new Vector2D(r * Math.cos(theta), r * Math.sin(theta) + this.startDotYOffset);
  }
  
  public showProjectedDot(position: Vector3D, sizeFactor: number, isGold: boolean = false) {
    const t2 = this.constrain(this.map(this.time, this.changeEventTime, 1, 0, 1), 0, 1);
    const newCameraZ = this.cameraZ + this.ease(Math.pow(t2, 1.2), 1.8) * this.cameraTravelDistance;
    
    if (position.z > newCameraZ) {
      const dotDepthFromCamera = position.z - newCameraZ;
      const x = this.viewZoom * position.x / dotDepthFromCamera;
      const y = this.viewZoom * position.y / dotDepthFromCamera;
      const sw = 400 * sizeFactor / dotDepthFromCamera;
      
      this.ctx.fillStyle = isGold ? '#C9A96E' : 'rgba(245, 245, 245, 0.8)';
      this.ctx.beginPath();
      this.ctx.arc(x, y, sw / 2, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }
  
  public render() {
    const ctx = this.ctx;
    if (!ctx) return;
    
    ctx.clearRect(0, 0, this.size, this.size);
    ctx.save();
    ctx.translate(this.size / 2, this.size / 2);
    
    const t1 = this.constrain(this.map(this.time, 0, this.changeEventTime + 0.25, 0, 1), 0, 1);
    const t2 = this.constrain(this.map(this.time, this.changeEventTime, 1, 0, 1), 0, 1);
    
    ctx.rotate(-Math.PI * this.ease(t2, 2.7));
    
    for (const star of this.stars) {
      star.render(t1, this);
    }
    
    ctx.restore();
  }
  
  public destroy() {
    cancelAnimationFrame(this.rafId);
  }
}

class Star {
  private dx: number; private dy: number;
  private spiralLocation: number; private strokeWeightFactor: number;
  private z: number; private angle: number; private distance: number;
  private rotationDirection: number; private expansionRate: number; private finalScale: number;
  private isGold: boolean;
  
  constructor(cameraZ: number, cameraTravelDistance: number) {
    this.angle = Math.random() * Math.PI * 2;
    this.distance = 30 * Math.random() + 15;
    this.rotationDirection = Math.random() > 0.5 ? 1 : -1;
    this.expansionRate = 1.2 + Math.random() * 0.8;
    this.finalScale = 0.7 + Math.random() * 0.6;
    this.isGold = Math.random() > 0.85; 
    
    this.dx = this.distance * Math.cos(this.angle);
    this.dy = this.distance * Math.sin(this.angle);
    this.spiralLocation = (1 - Math.pow(1 - Math.random(), 3.0)) / 1.3;
    this.z = Vector2D.random(0.5 * cameraZ, cameraTravelDistance + cameraZ);
    
    const lerp = (start: number, end: number, t: number) => start * (1 - t) + end * t;
    this.z = lerp(this.z, cameraTravelDistance / 2, 0.3 * this.spiralLocation);
    this.strokeWeightFactor = Math.pow(Math.random(), 2.0);
  }
  
  render(p: number, controller: AnimationController) {
    const spiralPos = controller.spiralPath(this.spiralLocation);
    const q = p - this.spiralLocation;
    
    if (q > 0) {
      const displacementProgress = controller.constrain(4 * q, 0, 1);
      const elasticEasing = controller.easeOutElastic(displacementProgress);
      const powerEasing = Math.pow(displacementProgress, 2);
      
      let easing;
      if (displacementProgress < 0.3) easing = controller.lerp(displacementProgress, powerEasing, displacementProgress / 0.3);
      else if (displacementProgress < 0.7) easing = controller.lerp(powerEasing, elasticEasing, (displacementProgress - 0.3) / 0.4);
      else easing = elasticEasing;
      
      let screenX, screenY;
      if (displacementProgress < 0.3) {
        screenX = controller.lerp(spiralPos.x, spiralPos.x + this.dx * 0.3, easing / 0.3);
        screenY = controller.lerp(spiralPos.y, spiralPos.y + this.dy * 0.3, easing / 0.3);
      } else if (displacementProgress < 0.7) {
        const midProgress = (displacementProgress - 0.3) / 0.4;
        const curveStrength = Math.sin(midProgress * Math.PI) * this.rotationDirection * 1.5;
        const baseX = spiralPos.x + this.dx * 0.3; const baseY = spiralPos.y + this.dy * 0.3;
        const targetX = spiralPos.x + this.dx * 0.7; const targetY = spiralPos.y + this.dy * 0.7;
        const perpX = -this.dy * 0.4 * curveStrength; const perpY = this.dx * 0.4 * curveStrength;
        screenX = controller.lerp(baseX, targetX, midProgress) + perpX * midProgress;
        screenY = controller.lerp(baseY, targetY, midProgress) + perpY * midProgress;
      } else {
        const finalProgress = (displacementProgress - 0.7) / 0.3;
        const baseX = spiralPos.x + this.dx * 0.7; const baseY = spiralPos.y + this.dy * 0.7;
        const targetDistance = this.distance * this.expansionRate * 1.5;
        const spiralTurns = 1.2 * this.rotationDirection;
        const spiralAngle = this.angle + spiralTurns * finalProgress * Math.PI;
        const targetX = spiralPos.x + targetDistance * Math.cos(spiralAngle);
        const targetY = spiralPos.y + targetDistance * Math.sin(spiralAngle);
        screenX = controller.lerp(baseX, targetX, finalProgress);
        screenY = controller.lerp(baseY, targetY, finalProgress);
      }
      
      // @ts-expect-error - Accediendo a propiedades privadas del controlador para el render
      const vx = (this.z - controller.cameraZ) * screenX / controller.viewZoom;
      // @ts-expect-error - Accediendo a propiedades privadas del controlador para el render
      const vy = (this.z - controller.cameraZ) * screenY / controller.viewZoom;
      const position = new Vector3D(vx, vy, this.z);
      
      let sizeMultiplier = 1.0;
      if (displacementProgress < 0.6) sizeMultiplier = 1.0 + displacementProgress * 0.2;
      else sizeMultiplier = 1.2 * (1.0 - ((displacementProgress - 0.6) / 0.4)) + this.finalScale * ((displacementProgress - 0.6) / 0.4);
      
      const dotSize = 8.5 * this.strokeWeightFactor * sizeMultiplier;
      controller.showProjectedDot(position, dotSize, this.isGold);
    }
  }
}

// =========================================================================
// 2. COMPONENTE REACT PRINCIPAL
// =========================================================================
export default function S06bFixedPrice() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<AnimationController | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isVisible, setIsVisible] = useState(false);

  // Observador para animar la entrada del texto
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.3 });
    
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Manejo del Canvas Resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Inicialización de la Animación Nativa
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dimensions.width === 0) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const dpr = window.devicePixelRatio || 1;
    const size = Math.max(dimensions.width, dimensions.height);
    
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    
    canvas.style.position = 'absolute';
    canvas.style.left = `${(dimensions.width - size) / 2}px`;
    canvas.style.top = `${(dimensions.height - size) / 2}px`;
    
    ctx.scale(dpr, dpr);
    
    animationRef.current = new AnimationController(canvas, ctx, size);
    
    return () => {
      if (animationRef.current) {
        animationRef.current.destroy();
        animationRef.current = null;
      }
    };
  }, [dimensions]);

 return (
  <section
    id="fixed-price"
    ref={containerRef}
    className="
      parte8-section relative w-full overflow-hidden
      bg-[#050203]
      flex items-center justify-center
      border-t border-[#2A2A2A]/50
      py-24 md:py-36
    "
  >
    {/* 1. ANIMACIÓN DE FONDO */}
    <div className="absolute inset-0 z-0 pointer-events-none opacity-45">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>

    {/* Sombras de integración */}
    <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_0%,#050203_72%)] pointer-events-none" />
    <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#050203] via-transparent to-[#050203] pointer-events-none" />

    {/* 2. CONTENIDO */}
    <div
      className={`
        relative z-10 w-full max-w-[1120px] px-6
        transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]
        ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-14 scale-[0.98]'}
      `}
    >
      <div
        className="
          relative mx-auto
          grid grid-cols-1 lg:grid-cols-[0.82fr_1.18fr]
          overflow-hidden
          rounded-[2rem]
          border border-[#2A2A2A]
          bg-[#111111]/72
          backdrop-blur-2xl
          shadow-[0_40px_120px_rgba(0,0,0,0.55)]
        "
      >
        {/* Borde premium suave */}
        <div className="pointer-events-none absolute inset-0 rounded-[2rem] ring-1 ring-inset ring-[#C9A96E]/10" />
        <div className="pointer-events-none absolute -top-32 -right-32 h-80 w-80 rounded-full bg-[#C9A96E]/[0.07] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-[#C9A96E]/[0.045] blur-3xl" />

        {/* Columna izquierda */}
        <aside
          className="
            relative flex flex-col justify-between
            border-b border-[#2A2A2A] lg:border-b-0 lg:border-r
            bg-[#080706]/55
            px-8 py-9 md:px-10 md:py-12
          "
        >
          <div>
            <div className="mb-8 flex items-center gap-3">
              <span className="h-px w-10 bg-[#C9A96E]" />
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-[#C9A96E]">
                Garantía contractual
              </span>
            </div>

           <div className="mb-12 text-center">
  <h3 className="font-serif text-[48px] md:text-[72px] lg:text-[86px] leading-[0.9] tracking-[-0.055em] text-[#F5F5F5]">
    Garantía
    <br />
    <span className="text-[#C9A96E]">FABRIC</span>
  </h3>
</div>
          </div>

          <div className="mt-10 space-y-4">
            <div className="h-px w-full bg-[#2A2A2A]" />

            <p className="max-w-[320px] font-sans text-sm leading-6 text-[#8A8A8A]">
              Diseñada para eliminar el riesgo real después del go-live:
              reportes manuales, operación paralela e incertidumbre ejecutiva.
            </p>

            <div className="inline-flex items-center gap-2 rounded-full border border-[#C9A96E]/25 px-4 py-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#C9A96E]" />
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#C9A96E]">
                Doctrina FABRIC
              </span>
            </div>
          </div>
        </aside>

        {/* Columna derecha */}
        <article className="relative px-8 py-10 md:px-12 md:py-14 lg:px-14 lg:py-16">
          <blockquote className="relative">
            <span className="pointer-events-none absolute -top-8 -left-3 font-serif text-7xl leading-none text-[#C9A96E]/15 select-none">
              “
            </span>

            <p className="relative z-10 max-w-[680px] font-serif text-[28px] leading-[1.25] tracking-[-0.025em] text-[#F5F5F5] md:text-4xl md:leading-[1.28]">
              Si después de 90 días post go-live, tu Oracle Fusion sigue
              requiriendo reportes manuales ejecutivos paralelos por causa
              atribuible a FABRIC,
              <span className="text-[#C9A96E]">
                {' '}devolvemos el 100% de los honorarios
              </span>{' '}
              de la fase de estabilización.
            </p>
          </blockquote>

          <div className="mt-10 grid gap-4 border-t border-[#2A2A2A]/70 pt-8 md:grid-cols-[1fr_auto] md:items-end">
            <p className="max-w-[560px] font-sans text-sm leading-6 text-[#8A8A8A] md:text-base">
              Esto no es marketing. Es una cláusula contractual estándar en cada
              proyecto FABRIC.
            </p>

            <a
              href="#doctrina"
              className="
                group inline-flex w-fit items-center gap-3
                font-mono text-[10px] font-semibold uppercase tracking-[0.22em]
                text-[#C9A96E]
                transition-colors duration-300 hover:text-[#F5F5F5]
              "
            >
              Ver doctrina
              <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[#C9A96E]/35 transition-all duration-300 group-hover:translate-x-1 group-hover:border-[#C9A96E] group-hover:bg-[#C9A96E]/10">
                →
              </span>
            </a>
          </div>
        </article>
      </div>
    </div>
  </section>
);
}

# Contexto de sesión — Tibor
> Para cuando retomes en otra laptop. Dale este archivo a Claude Code (o a quien sea) para que entienda exactamente en qué punto quedamos.

**Fecha de la sesión:** 26 mayo 2026  
**Rama:** `main`  
**Repo:** https://github.com/Tiboryeah/FabricSoftPage

---

## Qué es el proyecto

**FabriSoft** — sitio web de FABRIC, firma de Oracle Critical Engineering en México. Estética premium editorial tipo Bain / Anthropic / Linear: negro profundo, tipografía serif+mono, dorado champagne. El compañero se llama Edilberto.

**Stack:** Vite + React 19 + TypeScript + Tailwind CSS v4 + React Router v7 + Clerk (auth) + Framer Motion + Sonner

---

## División de trabajo

| Secciones | Quién | Archivos |
|---|---|---|
| Hero, Rescue Counter, Calculadora TCO | **Edilberto** | `parte1.home.tsx`, `Parte2.home.tsx`, `parte4.home.tsx` |
| S07–S15 (Casos → Founder) | **Tú (Tibor)** | `s07-casos.tsx` … `s15-founder.tsx` |
| Header, Footer, Interacciones, Router | Compartido | `headerPublic.tsx`, `footerPublic.tsx`, `InteractionManager.tsx`, `AppRouter.tsx` |

Tus secciones (S07-S15) son la referencia visual del proyecto. Las de Edilberto tienen que verse igual.

---

## Lo que se hizo en esta sesión (26 de Mayo)

### 1. Merge Limpio con la Rama `prueba-deploy`
* Se realizó una fusión (merge) libre de conflictos de los cambios remotos de `origin/prueba-deploy` a la rama `main`.
* Se integraron los archivos de la calculadora interactiva ERP TCO (`OpportunityMeter.tsx`, `BreakEvenChart.tsx` y `s03-tco-calculator.tsx`).
* Se unificaron las reglas de redireccionamiento de Vercel en `vercel.json` y las importaciones de componentes perezosos en `AppRouter.tsx`.

### 2. Correcciones de Tipado e Internacionalización (i18n)
* Se resolvió el error de compilación en `I18nProvider.tsx` al añadir la clave `'footer.tagline': 'Oracle Critical Engineering'` en la sección de inglés del archivo `src/i18n/translations.ts`.

### 3. Métricas de Impacto Dinámicas (Rescue Counter)
* En `s02-optimizador.tsx`, se sustituyó la métrica estática de implementaciones rescatadas. Ahora consulta en tiempo real el valor dinámico desde el endpoint del backend (`GET /api/metricas`), consumiendo el registro con id `"rescue"` (configurado originalmente en 14).

### 4. Ajustes Finos de Animaciones al Scroll
* Se homologaron los tiempos y desplazamientos de las animaciones en todo el Home (`s02b`, `s07` a `s15`) utilizando la clase `duration-1000` y un recorrido de `translate-y-12`.

### 5. Lógica Bidireccional de Revelado en Pantalla (Fijando Scroll Up)
* Se rediseñó el hook global `useInViewOnce.ts` para permitir el reinicio de las animaciones al scrollear hacia arriba y hacia abajo (`setIsInView(entry.isIntersecting)`).
* Para evitar retrasos ("pantallas vacías") al subir el scroll, se definió un `rootMargin` asimétrico de `'150px 0px 0px 0px'`, provocando que las secciones comiencen a renderizarse 150px antes de ingresar por la parte superior de la pantalla.
* Se eliminó el hook duplicado local en `s02-optimizador.tsx` para usar la versión global unificada de `useInViewOnce`.

### 6. Implementación de Paleta de Colores Oscuros Uniformes
* Se configuró el tema de Tailwind y variables CSS (`index.css`) con los nuevos tonos premium oscuros solicitados:
  * Fondo base del sitio (`--bg-base`): **Negro profundo** (`#050203`), logrando un fondo uniforme en todas las secciones al eliminar overrides locales.
  * Fondo de Paneles (`--bg-panel`): **Traje de neopreno** (`#080706`).
  * Elementos Elevados (`--bg-elevated`): **Sable** (`#060606`).
* Se mantuvieron los textos legibles de alto contraste (`#F5F5F5` y `#8A8A8A`) y los acentos dorados originales (`#C9A96E`), los cuales no sufrieron cambios.

---

### 4. Fix del bug de cascada CSS (el más importante)

**El problema raíz** de que parte1 y parte2 se veían sin padding (contenido pegado al borde izquierdo):

`maquetado-dossier.css` tenía:
```css
* { margin: 0; padding: 0; box-sizing: border-box; }
```

Este CSS es **sin capa** (unlayered). En CSS Cascade Level 5, el CSS sin capa tiene **mayor prioridad que cualquier `@layer`**, independientemente de especificidad. Tailwind v4 pone sus utilidades en `@layer utilities`, que es capa = menor prioridad.

Consecuencia: `px-6`, `py-24`, `p-3.5` de Tailwind en las secciones de Edilberto → todos sobrescritos a `padding: 0`. Las secciones S07-S15 no se afectaban porque su padding está también en CSS sin capa (`.demo-section { padding: 110px 56px }`).

**Fix en `maquetado-dossier.css` línea 5:**
```css
/* ANTES */
* { margin: 0; padding: 0; box-sizing: border-box; }

/* DESPUÉS */
* { box-sizing: border-box; }
.demo-section *, .demo-section *::before, .demo-section *::after { margin: 0; padding: 0; }
```

El reset de margin/padding ahora solo aplica dentro de `.demo-section` (donde viven S07-S15). Las secciones de Edilberto recuperaron sus paddings de Tailwind.

---

### 5. Fix de los tamaños de h2/h3/h4

`maquetado-dossier.css` también tenía reglas globales de font-size para headings:
```css
h3 { font-size: clamp(28px, 3vw, 36px); }
```

Por el mismo problema de cascada, esto sobreescribía las clases de Tailwind como `text-[11px]` en `h3` elements. En parte4, las FeatureCard tenían `<h3 className="text-[11px]">` pero se renderizaban a 28-36px.

**Fix en `maquetado-dossier.css`:**
```css
/* Antes: globales */
h2 { font-size: clamp(36px, 4.5vw, 56px); }
h3 { font-size: clamp(28px, 3vw, 36px); }
h4 { font-size: 22px; }

/* Después: solo dentro de .demo-section */
.demo-section h2 { font-size: clamp(36px, 4.5vw, 56px); }
.demo-section h3 { font-size: clamp(28px, 3vw, 36px); }
.demo-section h4 { font-size: 22px; }
```

**Además:** en el `FeatureCard` de parte4, el `<h3>` se cambió a `<p>` para evitar que la regla de `.demo-section h3` le aplique (parte4 usa `demo-section`).

---

### 6. Documento de contexto para Edilberto

Se creó `CONTEXTO_EDILBERTO.md` en la raíz del repo. Es la guía que Edilberto le da a GPT al empezar a trabajar. Cubre design system, reglas, cómo estructurar secciones, y qué no hacer.

---

## Estado actual del proyecto

### Página renderizada (en orden)
```
Header
├── parte1  → Hero + Globe animado (Edilberto)
├── Parte2  → Rescue Counter métricas (Edilberto)
├── parte4  → Calculadora TCO ERP (Edilberto) — usa demo-section/s03
├── s07     → Casos APE Plazas + Aplazo (Tibor)
├── s08     → 3 Industrias focales (Tibor)
├── s09     → FABRIC OS (Tibor)
├── s10     → Lifecycle 5 fases (Tibor)
├── s11     → Office Hours + calendario (Tibor)
├── s12     → Referencias (Tibor)
├── ----    → Criterios de evaluación (Tibor)
├── s13     → Transparencia (Tibor)
├── s14     → Papers / Investigación (Tibor)
└── s15     → Founder + Wait List (Tibor)
InteractionManager (modales I01-I07)
Footer
```

### Archivos CSS
```
src/index.css               ← Tokens del design system + overrides pre-dossier
src/maquetado-dossier.css   ← CSS base de S07-S15 + s03
src/maquetado-interacciones.css ← CSS de modales
```

### Rutas activas (`AppRouter.tsx`)
- `/` → Home (todas las secciones)
- `/casos/:slug` → CasoPage (detalle de caso individual)
- `/sign-in` y `/sign-up` → Clerk auth

---

## Qué falta / posibles próximos pasos

- [ ] Parte3 existe en disco (`parte3.home.tsx`) pero no se renderiza. Si Edilberto quiere recuperarla con contenido diferente (por ejemplo el Rescue Assessment original que tenía antes), se puede hacer. Si no, se puede borrar.
- [ ] Revisar parte1 y parte2 visualmente ahora que el bug de cascada CSS está corregido — con el fix, los paddings deberían estar correctos
- [ ] La sección de la calculadora (`parte4`) está integrada al sistema editorial pero puede tener ajustes finos de diseño pendientes
- [ ] Hay interacciones I01-I07 en `InteractionManager.tsx` — revisar que siguen funcionando con los cambios de layout

---

## Comandos para arrancar

```bash
# Clonar si es laptop nueva
git clone https://github.com/Tiboryeah/FabricSoftPage.git
cd FabricSoftPage

# Instalar dependencias
pnpm install

# Dev server
pnpm dev   # http://localhost:5173

# Check TypeScript
npx tsc --noEmit
```

---

## Variables de entorno necesarias

El proyecto usa Clerk para autenticación. Necesitas un `.env.local` con:
```
VITE_CLERK_PUBLISHABLE_KEY=pk_...
```
Sin esto, la app carga pero las rutas `/sign-in` y `/sign-up` no funcionan. El resto del sitio sí.

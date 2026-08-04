# DOCUMENTACIÓN TÉCNICA DEL SISTEMA
## FABRIC — Plataforma Web de Consultoría Oracle Cloud Infrastructure

---

**Nombre del proyecto:** FABRIC — Plataforma Digital de Ingeniería Crítica Oracle  
**Organización:** FABRIC SOFT MEXICO SA DE CV  
**Sitio de producción:** https://equipo-a-v2.vercel.app  
**Versión del documento:** 1.0  
**Fecha de elaboración:** Mayo 2026  
**Equipo de desarrollo:** Equipo A — Concurso FabriSoft 2026  
**Clasificación:** Documento técnico interno  

---

## TABLA DE CONTENIDO

- [Introducción](#introducción)
- [1. Problemática](#1-problemática)
- [2. Marco Teórico](#2-marco-teórico)
- [3. Análisis del Sistema](#3-análisis-del-sistema)
- [4. Diseño del Sistema](#4-diseño-del-sistema)
- [5. Costos](#5-costos)
- [6. Implementación del Sistema](#6-implementación-del-sistema)
- [7. Pruebas](#7-pruebas)
- [Anexo A — Manual de Usuario](#anexo-a--manual-de-usuario)
- [Anexo B — Manual de Instalación y Despliegue](#anexo-b--manual-de-instalación-y-despliegue)

---

## Introducción

El presente documento recoge la documentación técnica completa del sistema **FABRIC**, una plataforma web de alto rendimiento diseñada para posicionar y operar los servicios de consultoría especializada en **Oracle Cloud Infrastructure (OCI)** en el mercado mexicano de empresas grandes y medianas.

FABRIC no es un sitio informativo estático: es un sistema operativo integral que automatiza la calificación de prospectos, gestiona la agenda de consultoría, provee herramientas de diagnóstico en línea, administra contenido de investigación y conecta al cliente con un agente de inteligencia artificial especializado en OCI. Todo ello bajo un modelo de admisión selectiva: no todos los solicitantes son aceptados como clientes.

El sistema fue concebido, diseñado e implementado por el **Equipo A** dentro del marco del concurso de desarrollo web organizado por FabriSoft. La plataforma responde a una necesidad real del mercado: la falta de consultoras mexicanas con credencial técnica visible, operaciones transparentes y capacidad para manejar migraciones críticas a nube de Oracle.

Este documento está organizado de modo que un lector técnico —desarrollador, arquitecto de software o evaluador— pueda comprender el sistema desde la problemática que lo origina hasta los procedimientos de instalación y uso final.

---

## 1. Problemática

### 1.1 Contexto del Mercado

Oracle Cloud Infrastructure (OCI) es la plataforma de nube empresarial de Oracle Corporation, orientada a cargas de trabajo críticas: bases de datos Exadata, sistemas ERP, aplicaciones de misión crítica y migraciones desde on-premise hacia nube. En México, empresas de sectores como financiero, inmobiliario, logística y manufactura operan sobre infraestructura Oracle y enfrentan la necesidad de migrar, optimizar costos o mejorar la disponibilidad de sus sistemas.

Sin embargo, el ecosistema de consultoría Oracle en México presenta múltiples deficiencias:

- **Opacidad operativa:** Las consultoras tradicionales no publican métricas reales de proyectos, tiempos de entrega ni índices de riesgo.
- **Ausencia de credencial técnica verificable:** No existe un mecanismo público que permita a los prospectos evaluar la profundidad técnica de una consultora antes de iniciar una conversación de ventas.
- **Procesos de venta reactivos:** La mayoría de las consultoras no califican a sus clientes; toman cualquier proyecto disponible, lo que genera sobrecontratación y proyectos fallidos.
- **Falta de herramientas de diagnóstico previo:** Los prospectos no pueden estimar el riesgo de su infraestructura actual ni el TCO de una migración sin contratar una consultoría costosa.
- **Baja accesibilidad al conocimiento especializado:** Los documentos técnicos, papers y metodologías de ingeniería Oracle se encuentran detrás de barreras de registro o son inexistentes en español.

### 1.2 Necesidades Identificadas

A partir de este contexto, se identificaron las siguientes necesidades concretas que el sistema FABRIC debe resolver:

| # | Necesidad | Stakeholder |
|---|-----------|-------------|
| N1 | Calificar automáticamente a prospectos según criterios objetivos (industria, ingresos, urgencia) | Equipo de consultoría |
| N2 | Mostrar métricas de capacidad real (slots disponibles, proyectos activos) con actualización en tiempo real | Prospectos |
| N3 | Proveer herramientas de autodiagnóstico Oracle sin requerir interacción humana previa | Prospectos |
| N4 | Gestionar la agenda de *Office Hours* del director con integración real de calendario | Director y prospectos |
| N5 | Publicar contenido de investigación técnica con control de acceso | Comunidad técnica |
| N6 | Controlar internamente el estado de todos los prospectos, leads y proyectos | Administradores |
| N7 | Soportar múltiples idiomas (español/inglés) para alcance regional | Prospectos internacionales |
| N8 | Cumplir estándares SEO para posicionamiento orgánico en buscadores | Marketing |

### 1.3 Limitaciones del Enfoque Tradicional

Un sitio web corporativo estático o un CMS genérico (WordPress, Webflow) no puede resolver estas necesidades porque:

- No permite lógica de negocio compleja (calificación de leads con scoring);
- No integra en tiempo real con Google Calendar, sistemas de email y bases de datos;
- No provee autenticación con roles diferenciados (admin vs. público);
- No soporta agentes de IA con contexto de conversación persistente.

Por estas razones se decidió desarrollar un sistema a medida con arquitectura de aplicación web moderna.

---

## 2. Marco Teórico

### 2.1 Arquitecturas de Aplicaciones Web Modernas

Las aplicaciones web contemporáneas de alto rendimiento se construyen sobre el paradigma de **Aplicación de Página Única (SPA — Single Page Application)** en el frontend, combinada con una **API REST** en el backend. Esta separación permite:

- **Escalabilidad independiente:** El frontend se sirve como archivos estáticos desde una CDN; el backend escala según carga de cómputo.
- **Experiencia de usuario fluida:** No hay recargas completas de página; las transiciones son instantáneas.
- **Separación de responsabilidades:** El backend expone datos; el frontend los presenta.

FABRIC adopta esta arquitectura con un frontend en **React + Vite** y un backend en **Node.js + Express**, conectados mediante llamadas HTTP/JSON autenticadas con tokens Bearer.

### 2.2 React y el Paradigma de Componentes

**React** (desarrollado por Meta) es una biblioteca JavaScript para construir interfaces de usuario mediante componentes reutilizables. La versión 19 —usada en este proyecto— introduce mejoras de rendimiento en el sistema de reconciliación del DOM virtual. Los principios clave que guían el desarrollo en React son:

- **Componentes funcionales con Hooks:** La lógica de estado y efectos se encapsula en funciones, no en clases.
- **Contexto (Context API):** Permite compartir estado entre componentes sin "prop drilling", equivalente a un store liviano.
- **Renderizado declarativo:** El desarrollador describe el estado deseado de la UI; React calcula los cambios mínimos al DOM.

### 2.3 TypeScript como Lenguaje de Tipado Estático

**TypeScript** es un superconjunto tipado de JavaScript que añade verificación de tipos en tiempo de compilación. En proyectos de mediana y gran escala, TypeScript reduce errores de integración entre módulos, provee autocompletado preciso en el IDE y hace explícitas las contratos entre funciones y componentes. FABRIC usa TypeScript 6.0 en el frontend para todos los módulos `.ts` y `.tsx`.

### 2.4 Node.js y Express para APIs REST

**Node.js** es un entorno de ejecución JavaScript del lado del servidor basado en el motor V8 de Chrome. Su modelo de I/O no bloqueante lo hace especialmente eficiente para APIs que manejan múltiples solicitudes concurrentes sin requerir múltiples hilos. **Express.js** (versión 5.2 en este proyecto) es el framework minimalista más utilizado sobre Node.js para construir APIs REST; provee enrutamiento, middleware, manejo de errores y extensibilidad mediante plugins.

### 2.5 MongoDB y Mongoose

**MongoDB** es una base de datos NoSQL orientada a documentos. Los datos se almacenan en formato BSON (Binary JSON), lo que permite estructuras flexibles sin esquema rígido. Es especialmente adecuada cuando los modelos de datos evolucionan frecuentemente durante el desarrollo. **Mongoose** es el ODM (Object Document Mapper) que añade esquemas, validaciones y consultas expresivas sobre MongoDB desde Node.js. FABRIC usa MongoDB Atlas, la versión gestionada en la nube de MongoDB, con conexión SSL y replicación automática.

### 2.6 Autenticación Moderna con Clerk

**Clerk** es una plataforma de autenticación-como-servicio (AuthaaS) que provee gestión de usuarios, sesiones seguras, webhooks y control de metadatos (roles) sin requerir implementar un sistema de auth desde cero. Clerk emite tokens JWT firmados que el backend puede verificar con la clave pública de Clerk, garantizando la autenticidad de cada solicitud. La sincronización entre Clerk y MongoDB se realiza mediante **webhooks Svix**, que envían eventos firmados (user.created, user.updated, user.deleted) al backend cuando cambia el estado de un usuario.

### 2.7 Internacionalización (i18n)

La internacionalización de una aplicación web implica separar el texto visible al usuario del código que lo presenta, permitiendo cargar diferentes versiones según el idioma del visitante. FABRIC implementa un sistema de i18n en dos capas:

1. **Traducciones estáticas:** Cadenas de texto definidas en un archivo de traducciones (`translations.ts`) y servidas mediante un Context de React.
2. **Traducciones dinámicas:** Contenido generado dinámicamente se traduce en tiempo real mediante la API de DeepL, con caché en MongoDB para evitar traducciones repetidas.

### 2.8 SEO Técnico en SPAs

Las aplicaciones SPA presentan desafíos para el SEO porque el contenido se renderiza en JavaScript, no en HTML estático. FABRIC resuelve esto mediante:

- **Meta tags dinámicos:** El componente `SeoManager` inyecta `<title>`, `<meta>`, OpenGraph y Twitter Cards por ruta.
- **JSON-LD:** Datos estructurados en formato Schema.org para que los motores de búsqueda comprendan la jerarquía del contenido.
- **Sitemap XML:** Archivo `/sitemap.xml` con las 46 URLs públicas del sitio, prioridades y frecuencias de actualización.
- **Robots.txt:** Control de indexación que bloquea rutas administrativas y de autenticación.

### 2.9 Google Calendar API y Agendamiento

La integración con **Google Calendar API v3** mediante autenticación por cuenta de servicio (*Service Account*) permite que el sistema cree, lea y elimine eventos en el calendario del director de forma programática, sin requerir autorización interactiva del usuario en cada operación. Los slots de disponibilidad se calculan considerando tanto los eventos existentes en el calendario como las reservaciones almacenadas en MongoDB.

### 2.10 Inteligencia Artificial Conversacional

El sistema integra la **API de OpenAI** para proveer un agente conversacional especializado en diagnósticos Oracle. El agente mantiene contexto de conversación mediante el historial almacenado en MongoDB, responde con *streaming* para reducir la latencia percibida y puede ser configurado y monitoreado desde el panel administrativo.

---

## 3. Análisis del Sistema

### 3.1 Requerimientos Funcionales

| ID | Módulo | Descripción |
|----|--------|-------------|
| RF-01 | Landing pública | Presentar la propuesta de valor de FABRIC con secciones animadas, métricas en tiempo real y casos de estudio |
| RF-02 | Formulario de aplicación | Recibir solicitudes de potenciales clientes con validación, scoring automático y email de confirmación |
| RF-03 | Scoring de leads | Calcular automáticamente la puntuación de cada prospecto según industria, ingresos, urgencia y descripción de iniciativa |
| RF-04 | Gestión de capacidad | Mostrar slots de proyectos disponibles/activos/reservados; controlar apertura de admisión |
| RF-05 | Office Hours | Permitir a prospectos reservar sesiones de 30 minutos con integración a Google Calendar |
| RF-06 | Diagnóstico Oracle | Formulario de autoevaluación de infraestructura Oracle que genera un reporte de riesgo |
| RF-07 | Rescue Assessment | Cuestionario para proyectos Oracle en estado crítico con scoring de rescatabilidad |
| RF-08 | OCI Cost Optimizer | Herramienta de estimación de costos Oracle Cloud Infrastructure |
| RF-09 | Roadmap Generator | Generador de plan de migración a OCI basado en respuestas del usuario |
| RF-10 | Cloud Comparator | Comparativo de costos entre Oracle Cloud y competidores (AWS, Azure, GCP) |
| RF-11 | Papers de investigación | Catálogo de documentos técnicos con control de acceso y registro de descargas |
| RF-12 | Research Letters | Suscripción a boletín de investigación técnica con gestión de lista |
| RF-13 | Casos de estudio | Páginas detalladas de proyectos realizados con audit trail público |
| RF-14 | Transparencia operativa | Métricas públicas con versionado para mostrar el historial de cambios |
| RF-15 | Gestión NDA | Rastreo de solicitudes de acuerdos de confidencialidad |
| RF-16 | Agente de IA | Chat conversacional especializado con historial de conversación persistente |
| RF-17 | Autenticación y roles | Registro, inicio de sesión y control de acceso por roles (admin/usuario) |
| RF-18 | Panel de administración | Dashboard con 20+ vistas para gestionar todos los módulos del sistema |
| RF-19 | Internacionalización | Cambio dinámico entre español e inglés con persistencia en localStorage |
| RF-20 | SEO automático | Gestión dinámica de meta tags, OpenGraph, Twitter Cards y JSON-LD por ruta |

### 3.2 Requerimientos No Funcionales

| ID | Categoría | Descripción |
|----|-----------|-------------|
| RNF-01 | Rendimiento | Tiempo de carga inicial < 3 segundos en conexión de banda ancha |
| RNF-02 | Seguridad | Autenticación con tokens JWT firmados; rutas administrativas protegidas |
| RNF-03 | Disponibilidad | Despliegue en Vercel con CDN global y 99.9% de uptime |
| RNF-04 | Escalabilidad | Arquitectura stateless en backend; MongoDB Atlas con replicación automática |
| RNF-05 | Mantenibilidad | Código TypeScript tipado; separación en componentes y controladores independientes |
| RNF-06 | Internacionalización | Soporte completo ES/EN con detección automática de idioma guardado |
| RNF-07 | SEO | Sitemap, robots.txt, structured data y meta tags para todas las rutas públicas |
| RNF-08 | Compatibilidad | Soporte para navegadores modernos (Chrome, Firefox, Edge, Safari — últimas 2 versiones) |
| RNF-09 | Responsividad | Diseño adaptable a dispositivos móviles, tabletas y escritorio |
| RNF-10 | Auditoría | Registro de logs para todas las acciones críticas del sistema |

### 3.3 Actores del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                       ACTORES DEL SISTEMA                   │
├──────────────────────┬──────────────────────────────────────┤
│  Visitante anónimo   │ Accede a la landing, herramientas     │
│                      │ públicas y formulario de aplicación  │
├──────────────────────┼──────────────────────────────────────┤
│  Prospecto           │ Visitante que ha enviado una          │
│  (lead registrado)   │ solicitud a través del formulario    │
├──────────────────────┼──────────────────────────────────────┤
│  Administrador       │ Usuario autenticado con rol 'admin'  │
│                      │ con acceso al panel de control       │
├──────────────────────┼──────────────────────────────────────┤
│  Sistema externo     │ Clerk (auth), Google Calendar,        │
│                      │ Resend (email), OpenAI, DeepL        │
└──────────────────────┴──────────────────────────────────────┘
```

### 3.4 Casos de Uso Principales

#### CU-01: Aplicar como cliente

**Actor:** Visitante anónimo  
**Precondición:** El período de admisión está abierto  
**Flujo principal:**
1. El visitante navega a `/aplicar`
2. Completa el formulario con datos de empresa, industria, ingresos anuales y descripción de la iniciativa Oracle
3. El sistema valida que el email sea corporativo (rechaza Gmail, Yahoo, Hotmail, etc.)
4. El sistema calcula el *score* del prospecto (0–95 puntos) basándose en industria, ingresos, urgencia y descripción
5. Si la industria es calificada (Financiero, Inmobiliario, Logística, etc.), el lead recibe estado "Nuevo"; de lo contrario, "WaitList"
6. El sistema envía un email de confirmación al prospecto
7. El prospecto queda registrado en el panel de administración

**Flujo alternativo:** Si el email es de dominio público, se muestra error de validación.

---

#### CU-02: Reservar Office Hours

**Actor:** Visitante / Prospecto  
**Precondición:** Existen slots disponibles en el calendario  
**Flujo principal:**
1. El visitante accede a `/office-hours`
2. El calendario muestra los días disponibles del mes (consultando Google Calendar + DB)
3. El visitante selecciona un día; el sistema muestra los slots de 30 minutos disponibles (09:00–16:00)
4. El visitante ingresa nombre, empresa y email; confirma la reservación
5. El sistema crea el evento en Google Calendar y registra la reservación en MongoDB
6. Se envía email de confirmación al visitante

---

#### CU-03: Realizar diagnóstico Oracle

**Actor:** Visitante / Prospecto  
**Flujo principal:**
1. El visitante accede a `/optimizador-oci` o al módulo de diagnóstico
2. Responde el cuestionario modular sobre su infraestructura Oracle (módulos, licencias, carga, riesgo)
3. El sistema calcula un índice de riesgo y genera un reporte visual
4. El reporte incluye recomendaciones de migración y acción prioritaria

---

#### CU-04: Gestionar leads (admin)

**Actor:** Administrador  
**Precondición:** Sesión autenticada con rol 'admin'  
**Flujo principal:**
1. El administrador accede a `/admin/leads`
2. Visualiza todos los leads con su estado, score, empresa e industria
3. Cambia el estado de un lead (Nuevo → En revisión → Aceptado / Rechazado)
4. Agrega notas internas; el historial de cambios se registra automáticamente con timestamp y autor

---

### 3.5 Modelo de Datos Conceptual

El sistema maneja las siguientes entidades principales y sus relaciones:

```
Usuario (Clerk + MongoDB)
  │── tiene muchos → Lead (via email/solicitud)
  │── tiene muchos → OfficeHoursBooking
  └── tiene muchos → ConversaciónIA

Lead
  │── pertenece a → Usuario (si está registrado)
  └── tiene historial → HistorialCambios[]

OfficeHoursBooking
  └── sincronizado con → GoogleCalendarEvent

DiagnósticoOracle
  └── genera → Reporte de Riesgo

RescueAssessment
  └── compuesto de → ConjuntoPreguntas[]

PaperCatalog
  └── tiene muchos → PaperAccess (registro de descargas)

Transparencia
  └── tiene muchas → MétricasPúblicas (versionadas)

AgenteIA
  └── tiene muchas → ConversacionesIA
        └── tiene muchos → Mensajes[]
```

---

## 4. Diseño del Sistema

### 4.1 Arquitectura General

El sistema FABRIC sigue una arquitectura **cliente–servidor desacoplada** (también conocida como arquitectura de dos capas con API REST). Los dos subsistemas principales se despliegan de forma independiente y se comunican exclusivamente a través de HTTP/JSON.

```
┌──────────────────────────────────────────────────────────────┐
│                    DIAGRAMA DE ARQUITECTURA                  │
│                                                              │
│   ┌───────────────┐          ┌───────────────────────────┐   │
│   │   NAVEGADOR   │          │      SERVICIOS EXTERNOS    │   │
│   │  (Cliente)    │          │                           │   │
│   │               │          │  ┌─────────┐  ┌────────┐ │   │
│   │  React SPA    │          │  │  Clerk  │  │MongoDB │ │   │
│   │  (Vite build) │          │  │  Auth   │  │ Atlas  │ │   │
│   │               │          │  └────┬────┘  └───┬────┘ │   │
│   └──────┬────────┘          │       │            │      │   │
│          │                   │  ┌────┴────┐  ┌───┴────┐ │   │
│          │ HTTPS/JSON        │  │ Google  │  │ Resend │ │   │
│          │                   │  │Calendar │  │ Email  │ │   │
│          ▼                   │  └─────────┘  └────────┘ │   │
│   ┌──────────────┐           │                           │   │
│   │   VERCEL CDN  │          │  ┌─────────┐  ┌────────┐ │   │
│   │  (Frontend)   │          │  │ OpenAI  │  │ DeepL  │ │   │
│   └──────┬───────┘           │  │   API   │  │  API   │ │   │
│          │                   │  └─────────┘  └────────┘ │   │
│          │ /api/*            └───────────────────────────┘   │
│          ▼                              ▲                    │
│   ┌──────────────┐                      │                    │
│   │   BACKEND    │──────────────────────┘                    │
│   │  Node.js +   │   HTTP calls a APIs externas              │
│   │  Express     │                                           │
│   └──────────────┘                                           │
└──────────────────────────────────────────────────────────────┘
```

> **[ESPACIO PARA IMAGEN: Diagrama de Arquitectura del Sistema]**
>
> *Insertar aquí el diagrama de arquitectura definitivo (PNG/SVG) con los componentes, flujos de datos y servicios externos integrados.*

---

### 4.2 Estructura del Repositorio

El proyecto es un **monorepo gestionado con pnpm workspaces**, donde frontend y backend conviven en el mismo repositorio pero se despliegan de forma independiente.

```
FabriSoft/
├── src/                         # Frontend — React + TypeScript
│   ├── auth/                    # Lógica de protección de rutas
│   ├── components/              # Componentes reutilizables
│   │   └── ui/                  # Componentes de interfaz base
│   ├── config/                  # Configuración de axios y API
│   ├── hooks/                   # Custom React Hooks
│   ├── i18n/                    # Internacionalización
│   ├── layouts/                 # Layouts de página (público / admin)
│   ├── pages/                   # Páginas por ruta
│   │   ├── admin/               # Panel de administración (20+ páginas)
│   │   └── public/              # Páginas públicas
│   ├── seo/                     # Gestión dinámica de meta tags
│   ├── store/                   # Estado global (Context API)
│   └── App.tsx                  # Raíz: Providers + Router
│
├── Backend/                     # Backend — Node.js + Express
│   ├── components/              # Routers de cada módulo
│   ├── config/                  # DB, validación de env
│   ├── controllers/             # Lógica de negocio (19 controladores)
│   ├── models/                  # Esquemas Mongoose (23 modelos)
│   ├── routers/                 # Router principal
│   ├── services/                # Servicios externos (email, calendario)
│   └── utils/                   # Utilidades (tracking UTM)
│
├── public/                      # Assets estáticos (robots, sitemap, imágenes)
├── docs/                        # Documentación del proyecto
├── index.html                   # Entry point HTML
├── vite.config.ts               # Configuración de Vite
├── vercel.json                  # Config de despliegue frontend
└── pnpm-workspace.yaml          # Definición del monorepo
```

### 4.3 Diseño del Frontend

#### 4.3.1 Sistema de Rutas

El enrutamiento se gestiona con **React Router DOM v7**. Las rutas se dividen en tres grupos protegidos:

```
App Router
├── PublicRouteProtector (bloquea si ya autenticado)
│   ├── /                         → Home
│   ├── /casos/:slug              → Caso de estudio
│   ├── /casos/:slug/audit-trail  → Audit trail del caso
│   ├── /aplicar                  → Formulario de aplicación
│   ├── /rechazados               → Proyectos rechazados
│   ├── /post-mortem              → Análisis post-mortem
│   ├── /roundtable               → Eventos roundtable
│   ├── /modelos                  → Modelos de engagement
│   ├── /transparencia            → Métricas de transparencia
│   ├── /office-hours             → Agenda de consultoría
│   ├── /optimizador-oci          → Optimizador de costos OCI
│   ├── /roadmap                  → Generador de roadmap
│   ├── /readiness                → Evaluación de madurez
│   ├── /rfp-template             → Plantilla RFP
│   ├── /benchmark                → Índice benchmark
│   ├── /research-letters         → Publicaciones de investigación
│   ├── /investigacion/paper/:num → Papers (01, 02, 03)
│   ├── /terminos                 → Términos de uso
│   ├── /privacidad               → Política de privacidad
│   └── /doctrina/no-alineacion   → Doctrina de independencia
│
├── Rutas de autenticación (Clerk)
│   ├── /acceso                   → Inicio de sesión
│   └── /crear-cuenta             → Registro
│
└── ProtectorRoles (requiere rol 'admin')
    ├── /admin                    → Dashboard principal
    ├── /admin/leads              → Gestión de leads
    ├── /admin/papers             → Gestión de papers
    ├── /admin/nda                → Solicitudes NDA
    ├── /admin/referencias        → Referencias
    ├── /admin/transparencia      → Editor de métricas
    ├── /admin/metricas           → Editor de métricas públicas
    ├── /admin/capacidad          → Editor de slots de capacidad
    ├── /admin/office-hours       → Gestión de agenda
    ├── /admin/logs               → Logs del sistema
    ├── /admin/agente-ia          → Configuración del agente IA
    ├── /admin/conversaciones-ia  → Historial de conversaciones
    ├── /admin/diagnosticos-oracle → Diagnósticos enviados
    ├── /admin/rescue-assessment  → Assessments de rescate
    ├── /admin/oci-audit          → Auditorías OCI
    ├── /admin/migration-roadmap  → Editor de roadmaps
    ├── /admin/readiness-score    → Editor de readiness
    └── /admin/cloud-comparator   → Comparador de costos cloud
```

#### 4.3.2 Gestión de Estado Global

El estado compartido entre componentes se gestiona mediante **React Context API** con un patrón de reducer. El `FabricContext` centraliza:

```typescript
// Tipos principales del store
interface FabricState {
  capacidad: CapacidadState;   // Slots de proyectos
  metricas: MetricaPublica[];  // Métricas visibles al público
  leads: Lead[];               // Lista de prospectos (admin)
  officeHours: OfficeHoursSlot[]; // Slots de agenda
}
```

Las acciones disponibles incluyen ciclar el estado de slots, actualizar métricas con versionado, cambiar el estado de leads con historial, y gestionar reservaciones de office hours.

#### 4.3.3 Flujo de Autenticación

```
1. Usuario visita /acceso
2. Clerk muestra formulario de login (branded, tema oscuro)
3. Clerk emite JWT y redirige a /verificar-acceso
4. VerificarAcceso.tsx extrae el token → llama POST /api/auth/login
5. Backend valida el token con Clerk SDK, consulta MongoDB
6. Si usuario existe y está activo: sincroniza rol en Clerk publicMetadata
7. Si rol = 'admin': redirige a /admin; si no: redirige a /
8. En cada request posterior: useAuthApi() inyecta Bearer token automáticamente
```

#### 4.3.4 Sistema de Internacionalización

```
Cambio de idioma
      │
      ▼
I18nProvider (Context)
      │── actualiza localStorage ('fabric_lang')
      │── re-renderiza componentes con useI18n()
      │
      ▼
PageTranslator.tsx (MutationObserver)
      │── detecta nuevos nodos de texto en el DOM
      │── omite elementos con data-no-translate
      │── omite textos protegidos ("Julio Álvarez", etc.)
      │── consulta caché local (WeakMap) → si existe: aplica
      │── si no: llama POST /api/i18n/translate (debounce 120ms)
      │── guarda en caché y aplica la traducción
      └── backend guarda en MongoDB para requests futuros
```

### 4.4 Diseño del Backend

#### 4.4.1 Arquitectura de la API

La API REST sigue una estructura MVC (Modelo–Vista–Controlador adaptado a API):

```
HTTP Request
      │
      ▼
index.js (Server Entry)
      │── CORS middleware
      │── Raw body parser (solo /webhook)
      │── JSON body parser
      │
      ▼
app.routers.js (Router principal)
      │── /api/auth/*          → auth.component.js
      │── /api/leads/*         → leads.component.js
      │── /api/office-hours/*  → officeHours.component.js
      │── /api/i18n/*          → i18n.component.js
      │── /api/agente-ia/*     → agenteIA.component.js
      │── ... (19 componentes)
      │
      ▼
Controller (lógica de negocio)
      │── valida datos de entrada
      │── consulta/actualiza modelos Mongoose
      │── llama servicios externos si aplica
      │── registra log en MongoDB
      └── responde JSON al cliente

      ▼
Model (Mongoose Schema)
      └── interactúa con MongoDB Atlas
```

#### 4.4.2 Manejo de Autenticación en el Backend

Para rutas públicas: no se requiere token.  
Para rutas administrativas: el middleware `ClerkExpressRequireAuth()` verifica el token Bearer, rechaza con HTTP 401 si es inválido.

El webhook de Clerk se procesa antes que el JSON middleware porque requiere el cuerpo crudo (raw body) para verificar la firma Svix:

```javascript
// Orden correcto de middleware (index.js)
app.post('/api/auth/webhook', express.raw({type: 'application/json'}), webhookHandler);
app.use(express.json()); // Después del webhook
```

### 4.5 Diseño de la Base de Datos

> **[ESPACIO PARA IMAGEN: Diagrama de Clases / Diagrama Entidad-Relación]**
>
> *Insertar aquí el diagrama de la base de datos (ER o diagrama de clases de Mongoose) con todas las colecciones, campos y relaciones.*

A continuación se describen los modelos principales:

#### Colección `users`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| clerkId | String (único) | Identificador de Clerk |
| email | String | Correo electrónico |
| firstName, lastName | String | Nombre completo |
| photoUrl | String | URL de foto de perfil |
| rol | String | Rol del usuario ('admin', 'user') |
| status | String | Estado ('activo', 'bloqueado', 'desactivado') |
| createdAt | Date | Fecha de registro |

#### Colección `leads`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| nombre | String | Nombre del prospecto |
| cargo, empresa | String | Cargo y empresa |
| email | String | Email corporativo |
| industria | String | Sector de la empresa |
| ingresos | Number | Ingresos anuales (referencia) |
| iniciativa | String | Descripción de la iniciativa Oracle |
| plazo | String | Urgencia de decisión |
| score | Number | Puntuación calculada (0–95) |
| status | String | Estado del lead en el proceso |
| source | String | Canal de origen |
| notas | String | Notas internas |
| historial | Array | Historial de cambios de estado |

#### Colección `capacidad`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| slots | Array | Estado de cada slot (activo/reservado/libre) |
| admissionOpen | Boolean | Si está abierto el período de admisión |
| waitlist | Array | Lista de espera |
| quarters | Object | Datos de trimestres activos |

#### Colección `officeHoursbookings`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| fecha | Date | Fecha del slot |
| horaInicio | String | Hora de inicio (HH:MM) |
| disponible | Boolean | Si el slot está libre |
| reservadoPor | String | Nombre del reservante |
| empresa | String | Empresa del reservante |
| email | String | Email de contacto |
| confirmado | Boolean | Si fue confirmado |
| googleEventId | String | ID del evento en Google Calendar |

#### Colección `diagnosticooracles`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| empresa | String | Empresa que realiza el diagnóstico |
| modulos | Array | Módulos Oracle evaluados |
| riskScore | Number | Índice de riesgo calculado |
| reporte | Object | Reporte generado con recomendaciones |
| createdAt | Date | Fecha del diagnóstico |

#### Colección `translationcaches`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| originalText | String | Texto fuente |
| translatedText | String | Texto traducido |
| sourceLang | String | Idioma origen |
| targetLang | String | Idioma destino |
| provider | String | Proveedor usado (deepl, fallback) |

### 4.6 Diseño de Interfaz de Usuario

#### 4.6.1 Sistema de Diseño

FABRIC utiliza un sistema de diseño minimalista dark-first con los siguientes fundamentos:

| Token | Valor | Uso |
|-------|-------|-----|
| Color de fondo | `#050203` | Fondo base de toda la aplicación |
| Color de acento | `#C9A96E` | Botones primarios, bordes destacados, titulares |
| Color de texto | `#FFFFFF` | Texto principal |
| Color de texto secundario | `rgba(255,255,255,0.6)` | Texto descriptivo |
| Fuente principal | Inter / sistema | Texto corrido |
| Radio de bordes | 4–8px | Bordes de tarjetas |

#### 4.6.2 Componentes de Animación

- **Framer Motion:** Transiciones de entrada de secciones (fade-in, slide-up), animaciones de estado en botones y hover de tarjetas
- **Spline 3D:** Modelos 3D interactivos embebidos en secciones clave del hero
- **tsParticles:** Efectos de partículas en el fondo del hero
- **Scroll Reveal:** Hook `useInViewOnce` con IntersectionObserver para activar animaciones al llegar al viewport

---

## 5. Costos

### 5.1 Costos de Desarrollo

El sistema fue desarrollado por el **Equipo A** como participación en el concurso FabriSoft 2026. La estimación de horas se basa en el trabajo efectivo registrado durante el período de desarrollo.

| Módulo | Horas estimadas | Descripción |
|--------|----------------|-------------|
| Arquitectura base (monorepo, Vite, Express, MongoDB) | 12 h | Configuración inicial, estructura de carpetas, pipelines |
| Sistema de autenticación (Clerk + roles + webhooks) | 16 h | Login, registro, protección de rutas, sync DB |
| Landing page y secciones animadas (S01–S15) | 40 h | Hero, secciones, animaciones, mobile layout |
| Formulario de aplicación y scoring de leads | 10 h | Validación, cálculo de score, email |
| Panel de administración (20+ páginas) | 35 h | Dashboard, leads, papers, métricas, capacidad, etc. |
| Office Hours (frontend + backend + Google Calendar) | 14 h | Calendario, reservas, Google Calendar API |
| Diagnóstico Oracle y Rescue Assessment | 18 h | Formularios modulares, scoring, reportes |
| Herramientas OCI (Optimizer, Roadmap, Comparator, TCO) | 20 h | Calculadoras y generadores |
| Agente IA (frontend chat + backend streaming) | 16 h | Chat, historial, integración OpenAI |
| Internacionalización ES/EN | 10 h | Context i18n, PageTranslator, caché DeepL |
| SEO (SeoManager, sitemap, robots, JSON-LD) | 6 h | Meta dinámicos, structured data |
| Casos de estudio y audit trail | 8 h | Páginas de proyectos |
| Papers, Research Letters, NDA, Referencias | 10 h | Gestión de contenido |
| Transparencia y métricas versionadas | 6 h | Historial de métricas públicas |
| Email service (templates Resend) | 8 h | Emails transaccionales branded |
| Estado global (FabricContext + store) | 6 h | Context API, reducers, hooks |
| Testing, depuración y ajustes finales | 20 h | QA, corrección de bugs, optimización |
| **Total** | **255 h** | |

### 5.2 Costos de Infraestructura (Operación Mensual)

Los costos de operación están diseñados para ser mínimos durante la fase de concurso, aprovechando los niveles gratuitos de cada servicio.

| Servicio | Plan | Costo/mes | Notas |
|----------|------|-----------|-------|
| Vercel (Frontend) | Hobby | $0 USD | Hasta 100 GB de ancho de banda |
| Vercel (Backend) | Hobby | $0 USD | Hasta 100 GB de ancho de banda |
| MongoDB Atlas | M0 Free | $0 USD | 512 MB de almacenamiento |
| Clerk | Free | $0 USD | Hasta 10,000 usuarios activos/mes |
| Resend | Free | $0 USD | 100 emails/día, 3,000/mes |
| Google Calendar API | Free | $0 USD | Sin límite práctico para volumen bajo |
| OpenAI API | Pay-per-use | ~$5–15 USD | Depende del uso del agente IA |
| DeepL API | Free | $0 USD | 500,000 caracteres/mes |
| **Total mínimo** | | **$0–15 USD/mes** | |

### 5.3 Costos en Producción (Estimado Escalado)

En caso de que el sistema pase a producción real con carga alta:

| Servicio | Plan Recomendado | Costo/mes |
|----------|-----------------|-----------|
| Vercel | Pro | $20 USD |
| MongoDB Atlas | M10 Shared | $57 USD |
| Clerk | Pro | $25 USD |
| Resend | Pro | $20 USD |
| OpenAI | Pay-per-use | $50–200 USD |
| Dominio + SSL | Cualquier registrador | $15 USD/año |
| **Total estimado** | | **~$175–320 USD/mes** |

### 5.4 Costo de Licencias de Software

Todas las tecnologías usadas en el proyecto son de código abierto o tienen licencias gratuitas para proyectos comerciales:

| Tecnología | Licencia | Costo |
|------------|----------|-------|
| React 19 | MIT | $0 |
| Vite 6 | MIT | $0 |
| TypeScript | Apache 2.0 | $0 |
| Express 5 | MIT | $0 |
| Mongoose | MIT | $0 |
| Tailwind CSS 4 | MIT | $0 |
| Framer Motion | MIT | $0 |
| Lucide React | ISC | $0 |
| **Total licencias** | | **$0** |

---

## 6. Implementación del Sistema

### 6.1 Tecnologías Utilizadas

#### Stack Frontend

| Tecnología | Versión | Rol en el sistema |
|------------|---------|-------------------|
| React | 19.2.6 | Framework de UI |
| TypeScript | 6.0.2 | Tipado estático |
| Vite | 6.3.5 | Build tool y dev server |
| React Router DOM | 7.15.1 | Enrutamiento SPA |
| Tailwind CSS | 4.3.0 | Estilos utilitarios |
| Framer Motion | 12.39.0 | Animaciones y transiciones |
| @clerk/clerk-react | 5.61.6 | Autenticación frontend |
| Axios | 1.16.1 | Cliente HTTP |
| @splinetool/react-spline | 4.1.0 | Modelos 3D interactivos |
| @tsparticles/react | 4.0.4 | Efectos de partículas |
| Lucide React | 1.16.0 | Íconos SVG |
| Sonner | 2.0.7 | Notificaciones toast |

#### Stack Backend

| Tecnología | Versión | Rol en el sistema |
|------------|---------|-------------------|
| Node.js | ≥18 LTS | Runtime del servidor |
| Express | 5.2.1 | Framework web |
| MongoDB Atlas | Cloud | Base de datos |
| Mongoose | 9.6.2 | ODM para MongoDB |
| @clerk/clerk-sdk-node | 4.13.23 | Verificación de tokens |
| svix | 1.94.0 | Verificación de webhooks |
| googleapis | 172.0.0 | Google Calendar API |
| Resend | 6.12.3 | Servicio de email |
| xlsx | 0.18.5 | Exportación a Excel |
| luxon | 3.7.2 | Manejo de fechas y zonas horarias |
| multer | 2.1.1 | Subida de archivos |

### 6.2 Módulos Implementados

#### 6.2.1 Módulo de Scoring de Leads

Uno de los módulos más importantes es el algoritmo de calificación automática de prospectos, implementado en `leads.controller.js`:

```
Puntuación máxima: 95 puntos

Componente 1 — Ingresos anuales (35 pts máx)
  ≥ $500M MXN  → 35 pts
  ≥ $200M MXN  → 25 pts
  ≥ $50M MXN   → 15 pts
  < $50M MXN   → 10 pts

Componente 2 — Industria calificada (25 pts)
  Financiero, Inmobiliario, Logística,
  Manufactura, Gobierno, Healthcare → 25 pts
  Otras industrias                  →  0 pts

Componente 3 — Urgencia de decisión (25 pts máx)
  < 1 mes      → 25 pts
  1–3 meses    → 20 pts
  3–6 meses    → 15 pts
  6–12 meses   → 10 pts
  > 12 meses   →  5 pts

Componente 4 — Descripción de iniciativa (10 pts máx)
  ≥ 200 caracteres → 10 pts
  ≥ 100 caracteres →  7 pts
  < 100 caracteres →  5 pts
```

#### 6.2.2 Módulo de Traducción Dinámica

El `PageTranslator` observa el DOM en tiempo real y traduce el contenido cuando el usuario cambia de idioma. El flujo de datos es:

```
1. Usuario hace clic en LanguageToggle
2. I18nContext.setLanguage('en') actualiza localStorage
3. MutationObserver de PageTranslator detecta cambio de lang
4. Por cada nodo de texto en el DOM:
   a. Verifica si está en caché local (WeakMap) → aplica directamente
   b. Si no: acumula en batch (debounce 120ms)
5. POST /api/i18n/translate con textos en batch
6. Backend consulta caché en MongoDB (translationCache)
7. Si no existe en caché: llama DeepL API → guarda en MongoDB
8. Responde textos traducidos
9. Frontend aplica traducciones y actualiza caché local
```

#### 6.2.3 Módulo de Office Hours

La integración con Google Calendar usa **Service Account** (autenticación server-to-server sin interacción del usuario):

```
Configuración:
  - GOOGLE_SERVICE_ACCOUNT_EMAIL: cuenta de servicio en Google Cloud
  - GOOGLE_PRIVATE_KEY: clave privada de la cuenta de servicio
  - GOOGLE_CALENDAR_ID: ID del calendario del director

Flujo de reservación:
1. Frontend GET /api/office-hours/mes?year=YYYY&month=MM
2. Backend consulta Google Calendar: listEvents con timeMin/timeMax
3. Backend consulta MongoDB: bookings del mes
4. Calcula slots libres: 10 slots/día × días laborables
5. Marca como ocupados: slots con evento en GCal O booking en DB
6. Frontend muestra calendario visual

Flujo de creación de evento:
1. POST /api/office-hours/reservar con datos del visitante
2. Backend crea GoogleCalendarEvent con metadata extendida
3. Backend crea documento en MongoDB officeHoursbookings
4. Backend envía email de confirmación (Resend)
```

#### 6.2.4 Módulo de Agente IA

```
Arquitectura del agente:
  - Conversaciones almacenadas en MongoDB (agenteIA collection)
  - Cada conversación tiene: id, empresa, historial[], contextoDiagnostico
  - Los mensajes se envían con historial completo para mantener contexto
  - La respuesta se transmite en streaming (Server-Sent Events)
  - El admin puede ver y gestionar todas las conversaciones desde /admin/conversaciones-ia
```

#### 6.2.5 Seguridad del Sistema

| Mecanismo | Implementación |
|-----------|----------------|
| Autenticación de usuarios | JWT firmado por Clerk, verificado en cada request |
| Verificación de webhooks | Firma Svix (HMAC) verificada antes de procesar eventos |
| Protección de rutas frontend | HOC `ProtectorRoles` con verificación de publicMetadata |
| Validación de email corporativo | Regex que rechaza dominios públicos (gmail, yahoo, hotmail, etc.) |
| CORS | Lista blanca de orígenes permitidos (no comodín `*`) |
| Variables de entorno | Nunca expuestas al cliente; validadas al arrancar el servidor |
| Rutas admin sin indexar | `noindex` en SeoManager + `Disallow: /admin` en robots.txt |

### 6.3 Configuración de Variables de Entorno

#### Frontend (`.env`)

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_...       # Clave pública de Clerk
VITE_API_URL=http://localhost:4000/api  # URL del backend
```

#### Backend (`Backend/.env`)

```env
# Base de datos
MONGO_URI=mongodb+srv://...

# Autenticación
CLERK_SECRET_KEY=sk_...
CLERK_WEBHOOK_SECRET=whsec_...

# Email
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@tudominio.com

# IA
OPENAI_API_KEY=sk-proj-...

# Traducción
DEEPL_API_KEY=...

# Google Calendar
GOOGLE_CALENDAR_ID=...@google.com
GOOGLE_SERVICE_ACCOUNT_EMAIL=...@...iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n..."

# Sistema
PORT=4000
FRONTEND_URL=https://tudominio.com
ADMIN_API_KEY=...  # Clave para endpoints internos
```

### 6.4 Build y Despliegue

#### Build de producción del frontend

```bash
pnpm install
pnpm run build        # Genera /dist con assets optimizados
```

Vite optimiza el bundle: tree-shaking, code splitting por ruta, compresión de assets, eliminación de sourcemaps en producción.

#### Despliegue en Vercel

```json
// vercel.json (frontend)
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}

// Backend/vercel.json
{
  "builds": [{ "src": "index.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "index.js" }]
}
```

La configuración SPA reescribe todas las rutas al `index.html`, permitiendo que React Router maneje el enrutamiento en el cliente.

---

## 7. Pruebas

### 7.1 Estrategia de Pruebas

Durante el desarrollo de FABRIC se aplicaron pruebas funcionales manuales organizadas por módulos. Al tratarse de un proyecto de concurso con plazos ajustados, la estrategia priorizó la cobertura de rutas críticas y escenarios de uso principales sobre la automatización de pruebas unitarias.

### 7.2 Pruebas Funcionales

#### PF-01 — Autenticación y Control de Acceso

| Caso | Descripción | Resultado Esperado | Estado |
|------|-------------|-------------------|--------|
| PF-01-A | Inicio de sesión con credenciales válidas | Redirige a /admin | ✅ Pasa |
| PF-01-B | Inicio de sesión con credenciales inválidas | Error de Clerk visible | ✅ Pasa |
| PF-01-C | Acceso a /admin sin autenticar | Redirige a /acceso | ✅ Pasa |
| PF-01-D | Usuario con rol 'user' intenta acceder a /admin | Redirige a / | ✅ Pasa |
| PF-01-E | Token expirado en request a API | Backend responde 401 | ✅ Pasa |
| PF-01-F | Webhook de Clerk crea usuario en MongoDB | Documento creado automáticamente | ✅ Pasa |

#### PF-02 — Formulario de Aplicación

| Caso | Descripción | Resultado Esperado | Estado |
|------|-------------|-------------------|--------|
| PF-02-A | Email de Gmail en formulario | Error: "Email corporativo requerido" | ✅ Pasa |
| PF-02-B | Empresa del sector financiero, ingresos altos, urgencia inmediata | Score alto, status "Nuevo" | ✅ Pasa |
| PF-02-C | Empresa de sector no calificado | Status "WaitList" | ✅ Pasa |
| PF-02-D | Envío exitoso | Email de confirmación recibido | ✅ Pasa |
| PF-02-E | Lead aparece en /admin/leads | Lead visible con datos correctos | ✅ Pasa |

#### PF-03 — Office Hours

| Caso | Descripción | Resultado Esperado | Estado |
|------|-------------|-------------------|--------|
| PF-03-A | Consultar disponibilidad de un mes | Calendario con días disponibles | ✅ Pasa |
| PF-03-B | Seleccionar día con slots libres | Lista de horarios disponibles | ✅ Pasa |
| PF-03-C | Reservar un slot | Evento creado en Google Calendar + email | ✅ Pasa |
| PF-03-D | Cancelar reservación desde admin | Evento eliminado de Google Calendar | ✅ Pasa |
| PF-03-E | Slot ya reservado no aparece disponible | Slot oculto o marcado como ocupado | ✅ Pasa |

#### PF-04 — Internacionalización

| Caso | Descripción | Resultado Esperado | Estado |
|------|-------------|-------------------|--------|
| PF-04-A | Cambiar idioma a inglés | Textos del navbar cambian a inglés | ✅ Pasa |
| PF-04-B | Recargar la página en inglés | Idioma se mantiene (localStorage) | ✅ Pasa |
| PF-04-C | Texto con data-no-translate | No se traduce | ✅ Pasa |
| PF-04-D | Nombre propio protegido ("Julio Álvarez") | No se modifica | ✅ Pasa |

#### PF-05 — SEO y Meta Tags

| Caso | Descripción | Resultado Esperado | Estado |
|------|-------------|-------------------|--------|
| PF-05-A | Inspeccionar `<head>` en / | Title, description, og:image presentes | ✅ Pasa |
| PF-05-B | Inspeccionar `<head>` en /admin | `<meta name="robots" content="noindex">` | ✅ Pasa |
| PF-05-C | Acceder a /sitemap.xml | Devuelve XML con 46 URLs | ✅ Pasa |
| PF-05-D | Acceder a /robots.txt | Disallow: /admin visible | ✅ Pasa |

#### PF-06 — Panel de Administración

| Caso | Descripción | Resultado Esperado | Estado |
|------|-------------|-------------------|--------|
| PF-06-A | Cambiar estado de un lead | Estado actualizado + historial registrado | ✅ Pasa |
| PF-06-B | Ciclar estado de slot de capacidad | Activo → Reservado → Libre → Activo | ✅ Pasa |
| PF-06-C | Actualizar métrica pública | Valor actualizado con nueva versión | ✅ Pasa |
| PF-06-D | Ver logs del sistema | Lista de acciones recientes | ✅ Pasa |

### 7.3 Pruebas de Seguridad

| Caso | Descripción | Resultado Esperado | Estado |
|------|-------------|-------------------|--------|
| PS-01 | Request a /api/leads sin token | HTTP 401 Unauthorized | ✅ Pasa |
| PS-02 | Webhook con firma inválida | HTTP 400 / rechazado | ✅ Pasa |
| PS-03 | Request desde origen no permitido | CORS rechaza con error | ✅ Pasa |
| PS-04 | Acceder a /admin desde URL directa sin sesión | Redirige a /acceso | ✅ Pasa |

### 7.4 Pruebas de Rendimiento

Las siguientes métricas fueron medidas con Chrome DevTools Lighthouse en el entorno de producción de Vercel:

| Métrica | Valor obtenido | Objetivo |
|---------|---------------|----------|
| First Contentful Paint (FCP) | ~1.2 s | < 2 s |
| Largest Contentful Paint (LCP) | ~2.4 s | < 3 s |
| Total Blocking Time (TBT) | ~80 ms | < 300 ms |
| Cumulative Layout Shift (CLS) | ~0.02 | < 0.1 |
| Performance Score (Lighthouse) | ~78 | > 70 |

*Nota: Los modelos 3D de Spline afectan LCP y performance score en primera carga. Se aplica lazy loading para mitigar el impacto.*

### 7.5 Pruebas de Compatibilidad

| Navegador / Dispositivo | Resultado |
|------------------------|-----------|
| Chrome 124 (Windows) | ✅ Funcional |
| Firefox 125 (Windows) | ✅ Funcional |
| Safari 17 (macOS) | ✅ Funcional |
| Edge 124 (Windows) | ✅ Funcional |
| Chrome Mobile (Android 13) | ✅ Funcional |
| Safari Mobile (iOS 17) | ✅ Funcional |
| Pantalla 375px (mobile) | ✅ Layout responsivo |
| Pantalla 768px (tablet) | ✅ Layout responsivo |
| Pantalla 1440px (desktop) | ✅ Layout completo |

### 7.6 Observaciones y Áreas de Mejora

1. **Pruebas automatizadas:** El proyecto no cuenta con suite de pruebas unitarias o de integración automatizadas (Jest, Vitest, Playwright). Esto es una deuda técnica que debe abordarse antes de escalar el sistema a producción con múltiples colaboradores.

2. **Manejo de errores offline:** Si el backend no está disponible, algunas herramientas muestran errores genéricos; se recomienda mejorar los mensajes de error de cara al usuario.

3. **Carga de modelos 3D:** El componente Spline en el hero aumenta el tiempo de carga inicial; se recomienda implementar un placeholder hasta que el modelo termine de cargar.

4. **Internacionalización parcial:** Algunas secciones de la landing no están completamente traducidas; el sistema está preparado pero algunas cadenas siguen solo en español.

---

## Anexo A — Manual de Usuario

### A.1 Para el Visitante Público

#### A.1.1 Navegar por la Landing Page

Al ingresar a `https://fabricsoft.com.mx` (o al dominio configurado), encontrará:

- **Hero:** Presentación principal con propuesta de valor y estadísticas de operación
- **Secciones de servicio:** Descripción de metodología, casos de uso y modelos de engagement
- **Métricas en tiempo real:** Indicadores de capacidad y proyectos activos
- **Footer:** Contacto, enlaces a términos y políticas

Use la barra de navegación superior para moverse entre secciones. El botón de cambio de idioma (ES/EN) se encuentra en la esquina superior derecha.

#### A.1.2 Enviar una Solicitud de Aplicación

1. Haga clic en el botón **"Aplicar"** o navegue a `/aplicar`
2. Complete el formulario con:
   - **Nombre completo** y **cargo**
   - **Email corporativo** (no se aceptan Gmail, Yahoo, Hotmail u otros proveedores públicos)
   - **Empresa** e **industria**
   - **Ingresos anuales aproximados** de su empresa
   - **Descripción de la iniciativa Oracle** (mínimo 100 caracteres recomendados)
   - **Urgencia de decisión**
3. Haga clic en **"Enviar solicitud"**
4. Recibirá un email de confirmación en la dirección proporcionada
5. El equipo revisará su solicitud y se pondrá en contacto dentro de 5 días hábiles

**Nota:** Si su industria no está en la lista de sectores calificados, su solicitud pasará a lista de espera. Esto no implica un rechazo definitivo.

#### A.1.3 Reservar una Sesión de Office Hours

1. Navegue a `/office-hours`
2. El calendario mostrará los días con disponibilidad del mes actual
3. Haga clic en un día disponible (días en verde o con indicador)
4. Seleccione un horario de 30 minutos (slots de 09:00 a 16:00, zona horaria Ciudad de México)
5. Ingrese su nombre, empresa y email de contacto
6. Confirme la reservación
7. Recibirá un email con los detalles de la sesión

**Nota:** Si cancela o no puede asistir, contacte al equipo con al menos 24 horas de anticipación.

#### A.1.4 Acceder a Herramientas de Diagnóstico

Las herramientas gratuitas se encuentran en el menú de navegación:

- **Optimizador OCI** (`/optimizador-oci`): Estime costos de Oracle Cloud según su carga de trabajo
- **Roadmap Generator** (`/roadmap`): Obtenga un plan de migración personalizado
- **Readiness Score** (`/readiness`): Evalúe la madurez de su organización para migrar a OCI
- **Diagnóstico Oracle** (desde la landing): Cuestionario modular de infraestructura Oracle con reporte de riesgo

#### A.1.5 Descargar Papers de Investigación

1. Navegue a `/research-letters` para ver el catálogo
2. Seleccione el paper de interés
3. Proporcione su email corporativo para acceder a la descarga
4. El acceso queda registrado para seguimiento

#### A.1.6 Cambiar Idioma

Haga clic en el selector de idioma en la barra de navegación. La página se traducirá automáticamente al idioma seleccionado. La preferencia se guarda en su navegador para futuras visitas.

---

### A.2 Para el Administrador del Sistema

#### A.2.1 Acceso al Panel de Administración

1. Navegue a `/acceso`
2. Ingrese con su email y contraseña de administrador
3. Será redirigido automáticamente a `/admin`

**Importante:** Solo los usuarios con rol 'admin' pueden acceder al panel. Si recibe un error de permisos, contacte al administrador principal para verificar su rol.

#### A.2.2 Gestión de Leads

Navegue a `/admin/leads` para ver todos los prospectos.

**Filtros disponibles:**
- Por estado: Nuevo, En revisión, Aceptado, Rechazado, WaitList
- Por industria y fecha de solicitud

**Acciones por lead:**
- **Cambiar estado:** Seleccione el nuevo estado en el desplegable. El cambio queda registrado en el historial con timestamp y nombre del administrador.
- **Agregar notas:** Use el campo de notas para comentarios internos. Las notas no son visibles para el prospecto.
- **Ver historial:** Cada lead muestra el historial completo de cambios de estado.

#### A.2.3 Gestión de Capacidad

Navegue a `/admin/capacidad`:

- **Slots de proyectos:** Cada slot puede estar en estado Activo, Reservado o Libre. Haga clic en el slot para cambiar su estado (cicla entre los tres estados).
- **Apertura de admisión:** Use el toggle para abrir o cerrar el período de nuevas solicitudes.
- **Lista de espera:** Visualice y gestione los prospectos en lista de espera.

#### A.2.4 Gestión de Office Hours

Navegue a `/admin/office-hours`:

- Ver todas las reservaciones del mes
- Confirmar una reservación pendiente (envía email de confirmación al prospecto)
- Liberar un slot reservado (elimina el evento de Google Calendar)
- Ver historial de sesiones pasadas

#### A.2.5 Gestión de Métricas Públicas

Navegue a `/admin/metricas`:

- Cada métrica tiene: etiqueta pública, valor, unidad y visibilidad (pública/privada)
- Al actualizar un valor, el sistema incrementa automáticamente la versión de la métrica
- Las métricas marcadas como públicas se muestran en la landing page en tiempo real

#### A.2.6 Gestión de Papers

Navegue a `/admin/papers`:

- Agregar nuevos papers al catálogo (título, descripción, archivo)
- Ver estadísticas de acceso (cuántas descargas, por quién)
- Activar o desactivar la disponibilidad de un paper

#### A.2.7 Visualización de Logs

Navegue a `/admin/logs` para ver el registro de todas las acciones del sistema:
- Creación y cambios de estado en leads
- Reservaciones de office hours
- Accesos a papers
- Errores del sistema

Cada log incluye: acción, categoría, estado (OK/WARN/ERROR), detalle y timestamp.

#### A.2.8 Gestión del Agente IA

Navegue a `/admin/agente-ia` para:
- Configurar el agente (nombre, instrucciones base)
- Ver todas las conversaciones en `/admin/conversaciones-ia`
- Revisar el historial de mensajes de cada sesión
- Eliminar conversaciones si es necesario

---

## Anexo B — Manual de Instalación y Despliegue

### B.1 Requisitos del Sistema

| Herramienta | Versión mínima | Versión recomendada |
|-------------|---------------|---------------------|
| Node.js | 18.0.0 | 20.x LTS |
| pnpm | 8.0.0 | 9.x |
| Git | 2.30 | Última |
| Cuenta MongoDB Atlas | — | M0 Free o superior |
| Cuenta Clerk | — | Free o Pro |
| Cuenta Resend | — | Free o Pro |
| Cuenta Google Cloud | — | Para Calendar API |
| Cuenta Vercel | — | Para despliegue |

### B.2 Instalación en Entorno Local

#### Paso 1: Clonar el repositorio

```bash
git clone https://github.com/[org]/fabricsoft.git
cd fabricsoft
```

#### Paso 2: Instalar dependencias

```bash
# Instala dependencias del frontend y del monorepo
pnpm install

# Instala dependencias del backend
cd Backend
pnpm install
cd ..
```

#### Paso 3: Configurar variables de entorno del frontend

Cree el archivo `.env` en la raíz del proyecto:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_XXXXXXXXXXXXXXX
VITE_API_URL=http://localhost:4000/api
```

Obtenga la clave de Clerk en: Dashboard de Clerk → API Keys → Publishable Key.

#### Paso 4: Configurar variables de entorno del backend

Cree el archivo `Backend/.env` con el siguiente contenido:

```env
# Puerto del servidor
PORT=4000

# Frontend (para CORS)
FRONTEND_URL=http://localhost:5173

# Base de datos MongoDB Atlas
MONGO_URI=mongodb+srv://<usuario>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority

# Clerk
CLERK_SECRET_KEY=sk_test_XXXXXXXXXXXXXXX
CLERK_WEBHOOK_SECRET=whsec_XXXXXXXXXXXXXXX

# Email (Resend)
RESEND_API_KEY=re_XXXXXXXXXXXXXXX
EMAIL_FROM=FABRIC <noreply@tudominio.com>

# OpenAI
OPENAI_API_KEY=sk-proj-XXXXXXXXXXXXXXX

# DeepL (opcional)
DEEPL_API_KEY=XXXXXXXXXXXXXXX

# Google Calendar
GOOGLE_CALENDAR_ID=xxxx@group.calendar.google.com
GOOGLE_SERVICE_ACCOUNT_EMAIL=fabricsoft@proyecto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nXXXX...\n-----END RSA PRIVATE KEY-----\n"

# Seguridad interna
ADMIN_API_KEY=clave-segura-aleatoria
```

#### Paso 5: Iniciar los servidores de desarrollo

Abra **dos terminales**:

**Terminal 1 — Frontend:**
```bash
# En la raíz del proyecto
pnpm run dev
# Disponible en http://localhost:5173
```

**Terminal 2 — Backend:**
```bash
cd Backend
pnpm run dev
# Disponible en http://localhost:4000
# Health check: http://localhost:4000/health
```

#### Paso 6: Verificar la instalación

1. Abra `http://localhost:5173` en el navegador — debe ver la landing page
2. Abra `http://localhost:4000/health` — debe ver `{ "status": "ok", "db": "connected" }`
3. Intente navegar a `/admin` — debe redirigir a `/acceso`

---

### B.3 Configuración de Servicios Externos

#### B.3.1 MongoDB Atlas

1. Cree una cuenta en [mongodb.com/atlas](https://mongodb.com/atlas)
2. Cree un clúster nuevo (M0 Free es suficiente para desarrollo)
3. En **Database Access**: cree un usuario con permisos `readWriteAnyDatabase`
4. En **Network Access**: agregue su IP o `0.0.0.0/0` para acceso universal (solo en desarrollo)
5. En **Connect**: elija "Connect your application", copie el URI y reemplace `<password>`
6. Pegue el URI en `MONGO_URI` del `.env` del backend

#### B.3.2 Clerk

1. Cree una cuenta en [clerk.com](https://clerk.com)
2. Cree una nueva aplicación (nombre: "FABRIC")
3. En **Appearance**: configure el tema oscuro con colores `#C9A96E` (primario) y `#111111` (fondo)
4. En **API Keys**: copie "Publishable Key" → `VITE_CLERK_PUBLISHABLE_KEY`
5. En **API Keys**: copie "Secret Key" → `CLERK_SECRET_KEY`
6. En **Webhooks**: cree un endpoint apuntando a `https://tu-backend.vercel.app/api/auth/webhook`
   - Eventos: `user.created`, `user.updated`, `user.deleted`
   - Copie el "Signing Secret" → `CLERK_WEBHOOK_SECRET`
7. En **User & Authentication → Metadata**: asegúrese de que `publicMetadata.rol` esté habilitado

#### B.3.3 Resend (Email)

1. Cree una cuenta en [resend.com](https://resend.com)
2. En **API Keys**: cree una clave → `RESEND_API_KEY`
3. En **Domains**: añada y verifique su dominio para enviar emails con `@tudominio.com`
4. Actualice `EMAIL_FROM` con el email verificado

*En desarrollo puede usar `onboarding@resend.dev` sin verificar dominio, pero con límite de 100 emails/día.*

#### B.3.4 Google Calendar API

1. Abra [Google Cloud Console](https://console.cloud.google.com)
2. Cree un proyecto nuevo o seleccione uno existente
3. Habilite la **Google Calendar API** (APIs & Services → Library → buscar "Google Calendar API")
4. Cree una cuenta de servicio (IAM & Admin → Service Accounts → Create Service Account)
   - Nombre: `fabricsoft-calendar`
   - Rol: No es necesario (acceso solo al calendario)
5. En la cuenta de servicio → **Keys** → Add Key → JSON → descargue el archivo
6. Del archivo JSON, copie:
   - `client_email` → `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `private_key` → `GOOGLE_PRIVATE_KEY` (reemplace saltos de línea `\n` manualmente)
7. En Google Calendar, abra **Configuración del calendario** del calendario del director
8. En **Compartir con personas específicas**: agregue `GOOGLE_SERVICE_ACCOUNT_EMAIL` con permisos "Hacer cambios en eventos"
9. Copie el **ID del calendario** → `GOOGLE_CALENDAR_ID`

#### B.3.5 OpenAI

1. Cree una cuenta en [platform.openai.com](https://platform.openai.com)
2. En **API Keys**: cree una clave → `OPENAI_API_KEY`
3. Asegúrese de tener créditos o una forma de pago activa

#### B.3.6 DeepL (Opcional)

1. Cree una cuenta en [deepl.com/pro-api](https://www.deepl.com/pro-api)
2. En la sección API: copie la **Authentication Key** → `DEEPL_API_KEY`
3. Si no se configura, el sistema funciona pero sin traducción dinámica

---

### B.4 Despliegue en Producción (Vercel)

#### B.4.1 Desplegar el Frontend

1. Instale Vercel CLI: `pnpm install -g vercel`
2. Desde la raíz del proyecto: `vercel`
3. Siga el asistente: seleccione la organización y el nombre del proyecto
4. En el dashboard de Vercel → **Settings → Environment Variables**: agregue:
   - `VITE_CLERK_PUBLISHABLE_KEY`
   - `VITE_API_URL` (URL del backend desplegado, ej: `https://tu-backend.vercel.app/api`)
5. En **Settings → Build & Development Settings**:
   - Framework: Vite
   - Build Command: `pnpm run build`
   - Output Directory: `dist`

#### B.4.2 Desplegar el Backend

1. Desde la carpeta `Backend/`: `vercel`
2. En el dashboard de Vercel → **Settings → Environment Variables**: agregue todas las variables del `.env` del backend
3. Verifique que el `Backend/vercel.json` esté correctamente configurado:

```json
{
  "version": 2,
  "builds": [{ "src": "index.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "index.js" }]
}
```

4. Actualice en MongoDB Atlas el **Network Access** para permitir `0.0.0.0/0` (Vercel usa IPs dinámicas)
5. Actualice el webhook de Clerk con la URL del backend desplegado

#### B.4.3 Actualizar el Clerk Webhook

Después de desplegar el backend, actualice el endpoint del webhook en el dashboard de Clerk:

```
https://tu-backend-url.vercel.app/api/auth/webhook
```

O si usa el path alternativo:

```
https://tu-backend-url.vercel.app/_/backend/api/auth/webhook
```

#### B.4.4 Dominio Personalizado

1. En Vercel → **Domains**: agregue su dominio personalizado (ej: `fabricsoft.com.mx`)
2. Configure los registros DNS en su registrador de dominios según las instrucciones de Vercel
3. Actualice en el `.env` del backend: `FRONTEND_URL=https://fabricsoft.com.mx`
4. Actualice las variables de entorno de Vercel con el nuevo dominio
5. Actualice la lista de orígenes CORS en `Backend/index.js`
6. Actualice `FRONTEND_URL` en las variables de entorno del backend en Vercel
7. Actualice el sitemap XML en `public/sitemap.xml` con las URLs del dominio definitivo

---

### B.5 Comandos de Referencia

```bash
# Desarrollo local
pnpm run dev                    # Inicia frontend en http://localhost:5173
cd Backend && pnpm run dev      # Inicia backend en http://localhost:4000

# Build de producción
pnpm run build                  # Genera /dist optimizado
pnpm run preview                # Previsualiza el build localmente

# Linting
pnpm run lint                   # Verifica código con ESLint

# Backend
cd Backend
pnpm run dev                    # Nodemon con recarga automática
node index.js                   # Inicio directo (sin recarga)
```

### B.6 Solución de Problemas Comunes

| Problema | Causa probable | Solución |
|---------|---------------|----------|
| Backend no conecta a MongoDB | MONGO_URI inválido o IP no whitelisted | Verificar URI y agregar IP en Atlas Network Access |
| Webhook de Clerk no llega | URL incorrecta o CLERK_WEBHOOK_SECRET mal copiado | Verificar URL en Clerk dashboard y el secret |
| Google Calendar no crea eventos | Service account no tiene permisos en el calendario | Verificar que el email de service account esté compartido en el calendario |
| Emails no se envían | RESEND_API_KEY inválida o dominio no verificado | Verificar API key y estado del dominio en Resend |
| Error CORS en el frontend | FRONTEND_URL no coincide con el origen | Actualizar FRONTEND_URL en backend y re-desplegar |
| /admin redirige a /acceso en producción | VITE_CLERK_PUBLISHABLE_KEY incorrecta | Verificar que sea la clave de producción (pk_live_...) |
| Traducción no funciona | DEEPL_API_KEY no configurada | Configurar clave o aceptar que la traducción dinámica no estará disponible |

---

*Documento elaborado por el Equipo A — Concurso FabriSoft 2026*  
*Versión 1.0 — Mayo 2026*  

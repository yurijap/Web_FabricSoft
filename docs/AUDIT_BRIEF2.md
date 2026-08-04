# AUDITORÍA BRIEF2 vs PROYECTO — 26 mayo 2026
> Estado real. No usar PENDIENTES.md ni CHECKLIST_BRIEF2.md (desactualizados).

---

## HOME — SECCIONES

### S01 HERO
- ✅ Etiqueta "ORACLE CRITICAL ENGINEERING" en mono, champagne
- ✅ Titular con promesa primer ciclo crítico
- ✅ CTA "Iniciar conversación →"
- ✅ CTA "Auditoría OCI gratuita" → `/optimizador-oci`
- ⚠️ Brief pide "cero animaciones, quietud" — tiene TypewriterCarousel, BackgroundParticles, PremiumGlobe. Revisar si el jurado lo penaliza.

### S02 PUENTE / TESIS
- ✅ Existe `s02b-puente.tsx`
- ✅ Copy coincide con el brief en 3 ideas/oraciones: abandono post go-live, nos quedamos hasta el primer cierre contable en producción, "Por contrato."

### S02B RESCUE COUNTER (métricas de impacto)
- ✅ Existe `s02-optimizador.tsx` con 4 métricas animadas
- ⚠️ Números están hardcodeados en el componente. El brief pide que sean "números reales, verificables bajo NDA". Los actuales: 2 implementaciones, ~12,000 horas, 7 reportes, 2 cierres — confirmar con Julio que son reales.
- ✅ Footer ya está en español: "Números verificables bajo NDA".
- ✅ Ya tiene contexto narrativo: "Proyectos documentados · 2022–2026" y métricas que explican rescates, horas, reportes y cierres.

### S03 FABRIC AI DIAGNOSTIC (ChatIA)
- ✅ UI de chat existe en `chatIa.tsx`
- ❌ Brief especifica Claude Sonnet 4.6 + RAG con base curada. Lo actual es UI sin backend IA real.
- ❌ Falta disclaimer obligatorio al final de toda respuesta.
- ❌ Falta captura de correo corporativo dentro del chat (lead intelligence).
- ❌ Falta rechazo amable de temas fuera de scope Oracle.

### S03B ERP TCO COMPARATOR
- ✅ Existe `s03-tco-calculator.tsx`
- ⚠️ Verificar que tenga: selector ERP actual (SAP/EBS/JDE/Dynamics/NetSuite/Greenfield), inputs de costos, output comparativo en pantalla, CTA para análisis con datos reales.

### S04 CLOUD COST COMPARATOR
- ✅ Existe `s04-tco-waitlist.tsx`
- ⚠️ Verificar que compare AWS/GCP/Azure vs OCI con datos reales, no solo inputs manuales.

### S05 ANÁLISIS DE FALLAS (Rescue Assessment)
- ✅ Existe `s07b-rescue-assessment.tsx` con 12 preguntas
- ✅ Output: severidad, patrón, acción, inversión, ROI
- ✅ Selección de escenario (Fusion fallando / Migrando / Greenfield)
- ⚠️ Verificar que el copy de resultado tenga las 12 variantes (3 escenarios × 4 niveles)

### S06 DOCTRINA
- ✅ Las 5 cláusulas completas con texto del brief
- ✅ Modal DoctrinaModal existe
- ⚠️ Verificar que DoctrinaModal lleve a `/doctrina/generator` o genere algo, no sea solo decorativo.

### S06B FIXED-PRICE VISUAL
- ✅ Existe `s06b-fixed-price.tsx`
- ⚠️ Verificar que el canvas/animación comunique la propuesta de valor, no sea solo decorativo.

### S07 CASOS — APE PLAZAS
- ✅ Existe sección y caso completo en `/casos/ape-plazas`
- ⚠️ Brief pide paper formal de caso (4-6 páginas estilo McKinsey) — verificar si `/casos/ape-plazas` tiene ese nivel de contenido.

### S07B RESCUE ASSESSMENT (sección home)
- ✅ Existe como sección visible en home
- ✅ Lead magnet funcional

### S08 INDUSTRIAS
- ✅ Las 3 industrias focales con copy correcto
- ✅ Servicios Financieros, Inmobiliario, Logística

### S09 FABRIC OS
- ✅ 4 capas expandibles con stack visual
- ✅ FSO Engine con 6 FSOs y estados (Available/Building/Concept)
- ❌ Botón "Explorar FABRIC OS →" eliminado (correcto — no tenía destino válido)
- ⚠️ FSOs no tienen costo/tiempo estimado — brief menciona "tiempo y costo aproximado" por FSO

### S10 LIFECYCLE
- ✅ 5 fases presentes incluyendo STABILIZE (fase 04)
- ✅ STABILIZE marcado como diferenciador
- ✅ Duraciones y entregables por fase

### S11 OFFICE HOURS
- ✅ Sección en home + página `/office-hours`
- ✅ Calendario funcional, formulario, admin
- ⚠️ Brief pide criterios visibles de admisión (quién puede reservar) — verificar si están explícitos en la UI.

### S12 REFERENCIAS
- ✅ Existe con concepto de referencias bajo NDA
- ⚠️ Verificar que el copy sea el del brief: acceso post-evaluación, contacto directo verificable.

### S12B CRITERIOS DE ADMISIÓN
- ✅ Existe `s12b-criterios.tsx`

### S13 TRANSPARENCIA
- ✅ Sección en home + página `/transparencia`
- ✅ Integración con API
- ✅ Home S13 ahora muestra valor/unidad/período de cada métrica y liga explícita a `Metodología pública: /transparencia`.
- ✅ Cada métrica ahora soporta y muestra ficha metodológica: definición, universo, N, fórmula, período, validación y auditoría.
- ✅ Backend/admin premium: workflow editorial, riesgo legal/comercial, evidencia bajo NDA, próxima revisión, notas internas y bitácora de cambios.
- ✅ Home S13 ya no promete auditor externo para métricas actuales; indica revisión interna formal y auditoría externa para agregadas Q4 2026.

### S14 INVESTIGACIÓN
- ✅ 3 papers con metadata
- ✅ Gating por correo corporativo en `PaperPage.tsx`: el usuario registra datos y descarga sin aprobación manual.
- ✅ PDFs simulados para demo generados en `Backend/assets/papers/` y descarga inmediata tras registro corporativo.
- ✅ Los PDFs simulados usan los índices/outlines de Brief2 para Paper 01, 02 y 03.
- ✅ AdminPapers permite reemplazar cada PDF simulado por un PDF real (`paper-01`, `paper-02`, `paper-03`) sin cambiar el flujo público.
- ⚠️ Luego reemplazar PDFs simulados por papers reales 4-6 págs McKinsey cuando estén autorizados.
- ⚠️ FABRIC Benchmark Index existe visualmente — ¿tiene descarga real o es decorativo?

### S15 FOUNDER + WAIT LIST
- ✅ Sección Julio Álvarez con bio
- ✅ Wait list con contador regresivo
- ✅ Estado proyectos activos / próxima ventana / lista espera
- ❌ Foto editorial de Julio — brief tiene 15 líneas de specs fotográficas (retrato medio, 3/4, vestimenta específica, locación, RAW+JPG). Es producción fotográfica pendiente, no código.

---

## PÁGINAS DEDICADAS

### `/aplicar`
- ✅ Existe `AplicarPage.tsx` con form multipaso
- ✅ Validación correo corporativo, industrias, plazos
- ✅ Integración API `/aplicar`

### `/transparencia`
- ✅ Existe `TransparenciaPage.tsx`
- ✅ Tiene metodología completa por métrica: definición + universo + N + fórmula + período + validación + auditoría.
- ✅ Admin y backend soportan esos campos para métricas nuevas o editadas.
- ✅ Admin ahora tiene semáforo editorial por métrica, estado editorial, riesgo, evidencia NDA, próxima revisión, nota interna y bitácora de cambios.

### `/casos/ape-plazas`
- ✅ Existe `CasoPage.tsx`
- ✅ Tiene caso robusto con contexto, reto, modelo FABRIC, ejecución, timeline, lecciones y resultados.
- ✅ Para demo, el flujo NDA abre un PDF simulado del paper/evidencia desde `InteractionManager`.
- ⚠️ Luego reemplazar el PDF simulado por paper real 4-6 páginas estilo McKinsey con autorización del cliente.

### `/casos/ape-plazas/audit-trail`
- ✅ Existe `AuditTrailPage.tsx`
- ✅ Tiene timeline con fechas 06 abr, 15 abr, 30 abr.
- ✅ Tiene solicitudes de evidencia bajo NDA por hito (`data-interaction="nda-pdf"`).
- ✅ Para demo, cada hito abre PDF simulado: acta de go-live, reporte quincenal y acta de transición.
- ⚠️ Luego reemplazar PDFs simulados por PDFs reales y confirmar contacto verificable autorizado.

### `/rechazados`
- ✅ Existe `RechazadosPage.tsx`
- ✅ Incluye 7 proyectos anonimizados Q1/Q2 2026, razones de rechazo y resumen "23 evaluados · 7 rechazados · 30%".
- ⚠️ Pendiente confirmar que esos datos sean reales/autorizados y no dataset editorial.

### `/doctrina/generator`
- ✅ Existe `GeneratorPage.tsx`
- ⚠️ Brief pide 6 preguntas → PDF descargable "Cláusulas Oracle Critical Engineering". Verificar si genera PDF real o solo muestra resultado en pantalla.

### `/optimizador-oci`
- ✅ Existe `OptimizadorOciPage.tsx`
- ⚠️ Brief pide form con: empresa, cargo, email corporativo, gasto mensual OCI, aceptación NDA. Verificar campos.
- ⚠️ Post-envío debe decir: "nos contactamos en 24h, reporte en 48-72h". Verificar mensaje.

### `/roadmap`
- ✅ Existe `MigrationRoadmapPage.tsx`
- ⚠️ Brief pide wizard de 12 preguntas + PDF 30-60-90-180 días. Verificar si está implementado.

### `/readiness`
- ✅ Existe `ReadinessScorePage.tsx`
- ⚠️ Brief pide 15 preguntas, score 0-100, recomendaciones. Verificar.

### `/rfp-template`
- ✅ Existe `RFPTemplatePage.tsx`
- ⚠️ Brief pide PDF con 47 preguntas, criterios, cláusulas, alertas y scorecard. Verificar si entrega algo real.

### `/benchmark`
- ✅ Existe `BenchmarkIndexPage.tsx`
- ⚠️ Brief pide gating por correo corporativo + descarga real. Verificar.

### `/post-mortem`
- ✅ Existe `PostMortemPage.tsx`
- ✅ Precio explícito visible: "USD 25,000" / "USD 25K"; queda claro que no es gratis.

### `/roundtable`
- ✅ Existe `RoundtablePage.tsx`
- ⚠️ Brief pide: trimestral, 8-12 CFO/CTO, cena privada, NDA, moderada por Julio. Verificar contenido.

### `/research-letters`
- ✅ Existe `ResearchLettersPage.tsx`
- ⚠️ Brief pide análisis quincenal exclusivo para CFOs/CTOs con iniciativa Oracle activa. Verificar contenido.

### `/modelos`
- ✅ Existe `ModelosPage.tsx`
- ⚠️ Verificar contenido vs brief (modelos comerciales: Fixed-Price, Success-Fee)

### `/terminos`, `/privacidad`, `/doctrina/no-alineacion`
- ✅ Existen las 3 páginas legales

---

## ADMIN

- ✅ 18 paneles de admin implementados
- ✅ AdminOfficeHours con bookings reales en MongoDB
- ✅ AdminTransparencia elevado a control premium: publicación solo con `Visible + Verificada + Publicada`, evidencia NDA, riesgo y audit log.
- ✅ AdminTransparencia reorganizado para reducir confusión: dato público primero y secciones plegables para gobierno, metodología, evidencia y fuente.
- ⚠️ Verificar que AdminLeads, AdminOciAudit, AdminRescueAssessment persisten datos reales desde backend

---

## GAPS QUE NO SON CÓDIGO

- ❌ **Foto editorial Julio** — producción fotográfica pendiente (retrato medio + 3/4, vestimenta, locación, RAW+JPG+derechos)
- ❌ **Chat IA real** — backend con Claude API + RAG sobre docs Oracle
- ❌ **PDFs reales** — papers (3), doctrine generator output, RFP template, roadmap

---

## PRIORIDAD DE TRABAJO

### 🔴 Alta — visible y verificable por el jurado
1. S02 Rescue Counter — solo falta confirmar con Julio que las métricas son reales/verificables bajo NDA
2. `/rechazados` — confirmar si los datos anonimizados son reales/autorizados
3. `/casos/ape-plazas` — reemplazar PDF simulado por paper real 4-6 páginas cuando esté autorizado
4. `/audit-trail` — reemplazar PDFs simulados por evidencia real bajo NDA y confirmar contacto verificable autorizado

### 🟡 Media — funcional pero incompleto
7. S13/`/transparencia` — resuelto a nivel código; queda validar evidencia real bajo NDA cuando se publiquen métricas finales
8. S14 papers — demo resuelta con PDFs simulados; falta reemplazar por PDFs reales autorizados
9. `/doctrina/generator` — ¿genera PDF real?
10. `/optimizador-oci` — form completo + mensaje post-envío
11. FSO Engine — agregar tiempo/costo por FSO
12. ChatIA — al menos rechazo de out-of-scope + disclaimer

### 🟢 Baja — pulido
13. S01 Hero — evaluar animaciones vs "quietud" del brief
14. S03/S04 calculadoras — validar outputs vs especificación

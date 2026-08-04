const mongoose = require('mongoose');

// ---------------------------------------------------------------------------
// Sub-schemas
// ---------------------------------------------------------------------------

const publicadaSchema = new mongoose.Schema({
  label:               { type: String, required: true, trim: true },
  valor:               { type: String, required: true, trim: true },
  unidad:              { type: String, required: true, trim: true },
  metodologia:         { type: String, required: true, trim: true },
  definicion:          { type: String, default: '', trim: true },
  universo:            { type: String, default: '', trim: true },
  n:                   { type: String, default: '', trim: true },
  formula:             { type: String, default: '', trim: true },
  validacion:          { type: String, default: '', trim: true },
  auditoria:           { type: String, default: '', trim: true },
  editorialEstado:     {
    type: String,
    enum: ['borrador', 'revision', 'aprobada_interna', 'verificada_cliente', 'publicada', 'retirada'],
    default: 'borrador',
  },
  riesgo:              {
    type: String,
    enum: ['bajo', 'medio', 'alto'],
    default: 'medio',
  },
  evidencia: {
    titulo:      { type: String, default: '', trim: true },
    tipo:        {
      type: String,
      enum: ['acta', 'reporte', 'contrato', 'certificacion', 'correo_cliente', 'portal', 'otro'],
      default: 'otro',
    },
    estado:      {
      type: String,
      enum: ['simulada', 'pendiente', 'disponible_nda', 'validada'],
      default: 'pendiente',
    },
    fecha:       { type: Date },
    notas:       { type: String, default: '', trim: true },
  },
  periodo:             { type: String, required: true, trim: true },
  fuente: {
    tipo:        { type: String, enum: ['interna', 'auditoria_externa', 'cliente'], default: 'interna' },
    descripcion: { type: String, default: '' },
  },
  verificadoPor:       { type: String, default: '' },
  ultimaActualizacion: { type: Date, required: true, default: Date.now },
  // Candado doble: visible activa la intención, verified confirma el dato
  visible:             { type: Boolean, default: false },
  verified:            { type: Boolean, default: false },
  proximaRevision:     { type: Date },
  notaInterna:         { type: String, default: '', trim: true },
  orden:               { type: Number, default: 0 },
}, { _id: true });

const proximaSchema = new mongoose.Schema({
  label:         { type: String, required: true, trim: true },
  fechaObjetivo: { type: String, required: true, trim: true },
  descripcion:   { type: String, default: '' },
  visible:       { type: Boolean, default: true },
  orden:         { type: Number, default: 0 },
}, { _id: true });

const compromisoSchema = new mongoose.Schema({
  titulo: { type: String, required: true, trim: true },
  cuerpo: { type: String, required: true, trim: true },
  orden:  { type: Number, default: 0 },
}, { _id: true });

const auditLogSchema = new mongoose.Schema({
  fecha:   { type: Date, default: Date.now },
  autor:   { type: String, default: 'admin', trim: true },
  accion:  { type: String, required: true, trim: true },
  detalle: { type: String, default: '', trim: true },
}, { _id: true });

// ---------------------------------------------------------------------------
// Defaults — replican exactamente el contenido editorial hardcodeado actual
// ---------------------------------------------------------------------------

const DEFAULT_PUBLICADAS = [
  {
    label:               'Go-live APE Plazas en fecha contractual',
    valor:               '✓',
    unidad:              'Verificable',
    metodologia:         'Go-live planeado 06 abril 2026 · Ejecutado 06 abril 2026 · Verificable bajo NDA',
    definicion:          'Cumplimiento del hito contractual de salida a producción en la fecha planeada para APE Plazas.',
    universo:            'Proyecto APE Plazas · Implementación Oracle Fusion Cloud · Abril 2026.',
    n:                   '1 proyecto',
    formula:             'Go-live ejecutado en fecha contractual = Sí/No.',
    validacion:          'Acta de go-live y bitácora de despliegue disponibles bajo NDA mutuo.',
    auditoria:           'Revisión interna formal FABRIC + validación del responsable financiero del cliente.',
    editorialEstado:     'publicada',
    riesgo:              'alto',
    evidencia:           {
      titulo: 'Acta de go-live APE Plazas',
      tipo: 'acta',
      estado: 'disponible_nda',
      fecha: new Date('2026-04-06'),
      notas: 'Evidencia de demo disponible; reemplazar por PDF real autorizado cuando aplique.',
    },
    periodo:             'abr 2026',
    fuente:              { tipo: 'cliente', descripcion: 'CFO APE Plazas' },
    verificadoPor:       'CFO APE Plazas',
    ultimaActualizacion: new Date('2026-04-30'),
    proximaRevision:     new Date('2026-07-01'),
    notaInterna:         'Confirmar autorización final de cliente antes de difundir evidencia real.',
    visible:             true,
    verified:            true,
    orden:               1,
  },
  {
    label:               'Primer cierre contable APE Plazas',
    valor:               '✓',
    unidad:              'Verificable',
    metodologia:         'Cierre planeado abril 2026 · Ejecutado 30 abril 2026 · Acta en firma mayo 2026',
    definicion:          'Ejecución del primer cierre contable completo en producción después del go-live.',
    universo:            'Primer ciclo contable de APE Plazas operado en Oracle Fusion Cloud.',
    n:                   '1 cierre contable',
    formula:             'Cierre ejecutado dentro del mes operativo comprometido = Sí/No.',
    validacion:          'Acta de transición, evidencia de cierre y confirmación ejecutiva disponibles bajo NDA.',
    auditoria:           'Revisión interna formal FABRIC + validación del responsable financiero del cliente.',
    editorialEstado:     'publicada',
    riesgo:              'alto',
    evidencia:           {
      titulo: 'Acta de transición y evidencia de cierre',
      tipo: 'acta',
      estado: 'disponible_nda',
      fecha: new Date('2026-04-30'),
      notas: 'Evidencia de demo disponible; reemplazar por PDF real autorizado cuando aplique.',
    },
    periodo:             'abr–may 2026',
    fuente:              { tipo: 'cliente', descripcion: 'CFO APE Plazas' },
    verificadoPor:       'CFO APE Plazas',
    ultimaActualizacion: new Date('2026-05-01'),
    proximaRevision:     new Date('2026-07-01'),
    notaInterna:         'Confirmar firma final del acta antes de compartir documentos reales.',
    visible:             true,
    verified:            true,
    orden:               2,
  },
  {
    label:               'Sin incidencias críticas post go-live',
    valor:               '✓',
    unidad:              'APE Plazas',
    metodologia:         'Cero incidencias bloqueantes al cierre del primer ciclo · Verificable bajo NDA',
    definicion:          'Ausencia de incidencias críticas bloqueantes abiertas al completar el primer ciclo contable.',
    universo:            'Incidencias clasificadas como críticas durante la fase STABILIZE de APE Plazas.',
    n:                   '1 proyecto / fase STABILIZE abril 2026',
    formula:             'Incidencias críticas bloqueantes abiertas al cierre del ciclo = 0.',
    validacion:          'Bitácora operativa de incidencias y reporte FABRIC del ciclo disponibles bajo NDA.',
    auditoria:           'Revisión interna formal FABRIC + validación del responsable financiero del cliente.',
    editorialEstado:     'publicada',
    riesgo:              'alto',
    evidencia:           {
      titulo: 'Bitácora de incidencias STABILIZE',
      tipo: 'reporte',
      estado: 'disponible_nda',
      fecha: new Date('2026-04-30'),
      notas: 'Evidencia de demo disponible; reemplazar por bitácora real autorizada cuando aplique.',
    },
    periodo:             'abr 2026',
    fuente:              { tipo: 'cliente', descripcion: 'CFO APE Plazas' },
    verificadoPor:       'CFO APE Plazas',
    ultimaActualizacion: new Date('2026-04-30'),
    proximaRevision:     new Date('2026-07-01'),
    notaInterna:         'Validar clasificación de severidad con responsable operativo.',
    visible:             true,
    verified:            true,
    orden:               3,
  },
  {
    label:               'Experiencia Oracle promedio del equipo',
    valor:               '15+',
    unidad:              'años',
    metodologia:         'Promedio de años de experiencia Oracle por consultor senior facturable',
    definicion:          'Experiencia promedio mínima documentada del equipo senior facturable asignado a proyectos Oracle.',
    universo:            'Consultores senior facturables FABRIC activos al cierre de enero 2026.',
    n:                   'Plantilla senior facturable vigente',
    formula:             'Suma de años documentados de experiencia Oracle / total de consultores senior facturables.',
    validacion:          'CVs, historial de proyectos y perfiles profesionales verificables.',
    auditoria:           'Revisión interna formal de Dirección FABRIC.',
    editorialEstado:     'publicada',
    riesgo:              'bajo',
    evidencia:           {
      titulo: 'CVs y perfiles senior del equipo',
      tipo: 'otro',
      estado: 'disponible_nda',
      fecha: new Date('2026-01-01'),
      notas: 'Documentación interna verificable bajo NDA.',
    },
    periodo:             'auditado',
    fuente:              { tipo: 'interna', descripcion: 'Currículum + certificaciones verificadas' },
    verificadoPor:       'Dirección FABRIC',
    ultimaActualizacion: new Date('2026-01-01'),
    proximaRevision:     new Date('2026-07-01'),
    notaInterna:         'Actualizar cuando cambie la plantilla facturable.',
    visible:             true,
    verified:            true,
    orden:               4,
  },
  {
    label:               'Plantilla 100% senior Oracle',
    valor:               '100%',
    unidad:              'del equipo',
    metodologia:         'Cero juniors facturables · Condición contractual en cada SOW · Verificable',
    definicion:          'Porcentaje de personal facturable de proyecto que cumple criterio senior FABRIC.',
    universo:            'Roles facturables incluidos en SOWs Oracle activos.',
    n:                   'SOWs vigentes bajo doctrina FABRIC',
    formula:             '(Roles senior facturables / total roles facturables de proyecto) × 100.',
    validacion:          'SOWs y staffing plan por proyecto disponibles bajo NDA.',
    auditoria:           'Revisión interna formal de Dirección FABRIC.',
    editorialEstado:     'publicada',
    riesgo:              'medio',
    evidencia:           {
      titulo: 'SOWs vigentes y staffing plan',
      tipo: 'contrato',
      estado: 'disponible_nda',
      fecha: new Date('2026-01-01'),
      notas: 'Requiere anonimización antes de compartir.',
    },
    periodo:             'SOW',
    fuente:              { tipo: 'interna', descripcion: 'Contratos SOW vigentes' },
    verificadoPor:       'Dirección FABRIC',
    ultimaActualizacion: new Date('2026-01-01'),
    proximaRevision:     new Date('2026-07-01'),
    notaInterna:         'Mantener alineado con contratos activos.',
    visible:             true,
    verified:            true,
    orden:               5,
  },
  {
    label:               'Certificaciones Oracle vigentes',
    valor:               '100%',
    unidad:              'del equipo',
    metodologia:         'Certificaciones activas verificables por consultor facturable',
    definicion:          'Porcentaje de consultores facturables con certificaciones Oracle vigentes o evidencia equivalente validada.',
    universo:            'Consultores facturables asignables a proyectos Oracle.',
    n:                   'Plantilla facturable vigente',
    formula:             '(Consultores con certificación vigente / total consultores facturables Oracle) × 100.',
    validacion:          'Oracle Certification Portal y evidencia individual verificable.',
    auditoria:           'Revisión interna formal de Dirección FABRIC.',
    editorialEstado:     'publicada',
    riesgo:              'bajo',
    evidencia:           {
      titulo: 'Oracle Certification Portal',
      tipo: 'portal',
      estado: 'disponible_nda',
      fecha: new Date('2026-01-01'),
      notas: 'Verificar vigencia antes de cada revisión trimestral.',
    },
    periodo:             'vigente',
    fuente:              { tipo: 'interna', descripcion: 'Oracle Certification Portal' },
    verificadoPor:       'Dirección FABRIC',
    ultimaActualizacion: new Date('2026-01-01'),
    proximaRevision:     new Date('2026-07-01'),
    notaInterna:         'Actualizar si alguna certificación vence.',
    visible:             true,
    verified:            true,
    orden:               6,
  },
];

const DEFAULT_PROXIMAS = [
  { label: 'NPS clientes activos',                  fechaObjetivo: 'Oct 2026', descripcion: '', visible: true, orden: 1 },
  { label: 'Retención a 24 meses',                  fechaObjetivo: 'Nov 2026', descripcion: '', visible: true, orden: 2 },
  { label: 'Tiempo medio respuesta crítica',         fechaObjetivo: 'Q4 2026', descripcion: '', visible: true, orden: 3 },
  { label: 'Cumplimiento Fixed-Price contractual',   fechaObjetivo: 'Dic 2026', descripcion: '', visible: true, orden: 4 },
  { label: 'Tasa de proyectos completados en ciclo', fechaObjetivo: 'Anual',   descripcion: '', visible: true, orden: 5 },
];

const DEFAULT_COMPROMISOS = [
  {
    titulo: 'Publicamos solo números reales',
    cuerpo:  'Las métricas de esta página reflejan proyectos reales documentados. No proyectamos tasas de éxito ni publicamos benchmarks de mercado como si fueran propios. Si no tenemos el número, no lo publicamos.',
    orden:   1,
  },
  {
    titulo: 'Metodología pública por cada métrica',
    cuerpo:  'Cada número tiene una definición, un universo y un método de cálculo documentado. Ninguna métrica es un claim sin sustento.',
    orden:   2,
  },
  {
    titulo: 'Actualización trimestral',
    cuerpo:  'Las métricas se actualizan al cierre de cada trimestre. La fecha de última actualización aparece en cada dato. Preferimos retrasar una publicación a publicar un número sin validar.',
    orden:   3,
  },
];

// ---------------------------------------------------------------------------
// Singleton schema
// ---------------------------------------------------------------------------

const transparenciaConfigSchema = new mongoose.Schema({
  publicadas:  { type: [publicadaSchema],  default: () => DEFAULT_PUBLICADAS  },
  proximas:    { type: [proximaSchema],    default: () => DEFAULT_PROXIMAS    },
  compromisos: { type: [compromisoSchema], default: () => DEFAULT_COMPROMISOS },
  auditLog:    { type: [auditLogSchema],   default: () => [] },
}, { timestamps: true, versionKey: false });

transparenciaConfigSchema.statics.defaults = () => ({
  publicadas:  DEFAULT_PUBLICADAS,
  proximas:    DEFAULT_PROXIMAS,
  compromisos: DEFAULT_COMPROMISOS,
  auditLog:    [],
});

module.exports = mongoose.model('TransparenciaConfig', transparenciaConfigSchema);

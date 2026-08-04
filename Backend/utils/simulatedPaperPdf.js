const fs = require('fs');
const path = require('path');

const PAPER_CONTENT = {
  '01': {
    title: 'Por que fallan los go-live de Oracle Fusion',
    subtitle: 'Research Note - Analisis de patrones de fracaso en implementaciones LATAM',
    sections: [
      ['Paginas y audiencia', 'Paginas esperadas: 8-10. Audiencia: CFOs, CIOs y Directores de Transformacion. Autoria: Julio Alvarez, Founder FABRIC.'],
      ['1. Introduccion', 'El mito del go-live como hito final. Datos de mercado: tasa de fracaso real.'],
      ['2. Patrones de fracaso', 'Patron 1: abandono post go-live. Patron 2: cierre contable como primera crisis. Patron 3: usuarios sin adopcion real. Patron 4: integraciones a medio terminar. Patron 5: reportes manuales paralelos.'],
      ['3. Causas raiz', 'Modelos de incentivos del proveedor. Definicion ambigua de entregado. Falta de tablero ejecutivo de estabilizacion. Ausencia de celula post go-live.'],
      ['4. Modelo alternativo', 'Definicion de primer ciclo critico. Hitos verificables de estabilizacion. Doctrina contractual FABRIC.'],
      ['5. Conclusion y recomendaciones', 'Como evaluar a un proveedor Oracle. Clausulas contractuales a exigir. Senales de alerta tempranas.'],
      ['Nota demo', 'Documento simulado para mostrar el flujo de gated download. Reemplazar por paper final autorizado antes de uso publico definitivo.'],
    ],
  },
  '02': {
    title: 'IA aplicada a cierre contable en Fusion Cloud',
    subtitle: 'Technical Framework - Framework FABRIC con casos de aplicacion',
    sections: [
      ['Paginas y audiencia', 'Paginas esperadas: 10-12. Audiencia: CFOs, Controllers y Directores de Sistemas. Autoria: Equipo FABRIC + Julio Alvarez.'],
      ['1. Contexto', 'El cierre contable como cuello de botella. Estado del arte: lo que Oracle nativo ofrece. Lo que no ofrece y crea oportunidad de IA.'],
      ['2. Framework FABRIC', 'Capa 1: deteccion de anomalias en cuentas. Capa 2: conciliacion automatica inteligente. Capa 3: prediccion de partidas pendientes. Capa 4: generacion automatizada de notas. Capa 5: tablero ejecutivo predictivo.'],
      ['3. Arquitectura tecnica', 'Componentes. Integracion con Fusion Cloud. Modelo de seguridad. Modelo de aislamiento de datos.'],
      ['4. Casos de aplicacion', 'Caso A: reduccion de tiempo de cierre 60%. Caso B: deteccion de errores pre-cierre. Caso C: generacion automatica de reportes.'],
      ['5. Consideraciones', 'Cuando aplica, cuando no. Pre-requisitos tecnicos. ROI esperado.'],
      ['Nota demo', 'Documento simulado para mostrar el flujo de gated download. Reemplazar por paper final autorizado antes de uso publico definitivo.'],
    ],
  },
  '03': {
    title: 'Modelo de entrega en primer ciclo critico',
    subtitle: 'Doctrina Operativa - La doctrina contractual de FABRIC',
    sections: [
      ['Paginas y audiencia', 'Paginas esperadas: 6-8. Audiencia: CFOs, COO, CIOs y area legal de cliente. Autoria: Julio Alvarez, Founder FABRIC.'],
      ['1. Problema de la industria', 'Definicion ambigua de entregado. Riesgos contractuales que esto genera. Como lo aprovechan proveedores irresponsables.'],
      ['2. Definicion FABRIC de entrega', 'Concepto: primer ciclo critico. Tipos de ciclo critico: financiero, operativo y regulatorio. Hitos verificables de cada tipo.'],
      ['3. Clausulas contractuales modelo', 'Definicion de alcance hasta primer ciclo. Hitos de pago alineados a estabilizacion. Penalizacion por atraso del proveedor. Tablero ejecutivo de estabilizacion. Acta formal de transicion a soporte.'],
      ['4. Ejecucion practica', 'Como se ejecuta la fase STABILIZE. Composicion de la celula FABRIC. Gobierno durante estabilizacion. Documentacion obligatoria.'],
      ['5. Resultados esperados', 'Para el cliente. Para el proveedor. Para la industria.'],
      ['Nota demo', 'Documento simulado para mostrar el flujo de gated download. Reemplazar por paper final autorizado antes de uso publico definitivo.'],
    ],
  },
};

function cleanPdfText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/[()\\]/g, match => `\\${match}`);
}

function wrap(text, max = 78) {
  const words = cleanPdfText(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > max) {
      if (line) lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function buildPageContent(paperId) {
  const paper = PAPER_CONTENT[paperId] || PAPER_CONTENT['01'];
  const lines = [
    '/F2 18 Tf 54 760 Td',
    `(${cleanPdfText(`FABRIC Paper ${paperId}`)}) Tj`,
    '0 -30 Td /F1 24 Tf',
    `(${cleanPdfText(paper.title)}) Tj`,
    '0 -24 Td /F1 11 Tf',
    `(${cleanPdfText(paper.subtitle)}) Tj`,
    '0 -34 Td /F1 10 Tf',
    '(Documento simulado para demo comercial. No sustituye el paper final autorizado.) Tj',
  ];

  for (const [heading, body] of paper.sections) {
    lines.push('0 -28 Td /F2 12 Tf');
    lines.push(`(${cleanPdfText(heading)}) Tj`);
    lines.push('/F1 10 Tf');
    for (const line of wrap(body, 82)) {
      lines.push('0 -15 Td');
      lines.push(`(${line}) Tj`);
    }
  }

  lines.push('0 -36 Td /F1 9 Tf');
  lines.push('(FABRIC Oracle Critical Engineering - Verificable bajo NDA para prospectos calificados.) Tj');

  return `BT\n${lines.join('\n')}\nET`;
}

function buildPdfBuffer(paperId) {
  const content = buildPageContent(paperId);
  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n',
    `6 0 obj\n<< /Length ${Buffer.byteLength(content, 'utf8')} >>\nstream\n${content}\nendstream\nendobj\n`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += obj;
  }
  const xref = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf, 'utf8');
}

function ensureSimulatedPaperPdf(paperId, options = {}) {
  const dir = path.join(__dirname, '..', 'assets', 'papers');
  const file = path.join(dir, `paper-${paperId}.pdf`);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (options.force || !fs.existsSync(file)) fs.writeFileSync(file, buildPdfBuffer(paperId));
  return file;
}

module.exports = {
  PAPER_CONTENT,
  buildPdfBuffer,
  ensureSimulatedPaperPdf,
};

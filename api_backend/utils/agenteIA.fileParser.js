const XLSX = require('xlsx');

const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
const MAX_EXTRACTED_CHARS = 60000;

const TEXT_MIME_TYPES = new Set([
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/json',
]);

function extensionOf(filename = '') {
  const parts = filename.toLowerCase().split('.');
  return parts.length > 1 ? parts.pop() : '';
}

function isAllowedFile(file) {
  const ext = extensionOf(file.originalname);

  return (
    ['txt', 'md', 'csv', 'json', 'xlsx', 'xls'].includes(ext) ||
    TEXT_MIME_TYPES.has(file.mimetype)
  );
}

function trimText(text) {
  return String(text || '').replace(/\u0000/g, '').slice(0, MAX_EXTRACTED_CHARS);
}

function parseSpreadsheet(buffer) {
  const workbook = XLSX.read(buffer, {
    type: 'buffer',
    cellDates: true,
  });

  const chunks = [];

  workbook.SheetNames.slice(0, 8).forEach((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      blankrows: false,
      defval: '',
    });

    chunks.push(`Hoja: ${sheetName}`);

    rows.slice(0, 250).forEach((row) => {
      const line = row
        .map((cell) => String(cell).trim())
        .filter(Boolean)
        .join(' | ');

      if (line) chunks.push(line);
    });
  });

  return trimText(chunks.join('\n'));
}

function parseText(buffer) {
  return trimText(buffer.toString('utf8'));
}

function parseKnowledgeFile(file) {
  if (!file) {
    throw new Error('No se recibio archivo.');
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error('El archivo debe pesar menos de 2 MB.');
  }

  if (!isAllowedFile(file)) {
    throw new Error('Formato no soportado. Usa TXT, MD, CSV, JSON, XLS o XLSX.');
  }

  const ext = extensionOf(file.originalname);
  const content = ['xlsx', 'xls'].includes(ext)
    ? parseSpreadsheet(file.buffer)
    : parseText(file.buffer);

  if (!content.trim()) {
    throw new Error('No se pudo extraer texto util del archivo.');
  }

  return {
    name: file.originalname,
    mimeType: file.mimetype || 'application/octet-stream',
    size: file.size,
    content,
  };
}

module.exports = {
  MAX_UPLOAD_BYTES,
  MAX_EXTRACTED_CHARS,
  parseKnowledgeFile,
};

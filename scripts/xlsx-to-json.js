#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

function usage() {
  console.log('Usage: node scripts/xlsx-to-json.js <input.xlsx> [sheetName]');
  process.exit(1);
}

const infile = process.argv[2];
if (!infile) usage();
const sheetName = process.argv[3] || null;

const workbook = xlsx.readFile(infile);
const sheetNames = workbook.SheetNames;
const targetSheet = sheetName || sheetNames[0];
if (!sheetNames.includes(targetSheet)) {
  console.error('Sheet not found:', targetSheet);
  process.exit(2);
}

const sheet = workbook.Sheets[targetSheet];
const rows = xlsx.utils.sheet_to_json(sheet, { defval: null });

// Build a simple mapping draft: column headers -> sample values
const headers = Object.keys(rows[0] || {});
const samples = headers.map((h) => ({ header: h, examples: rows.slice(0, 10).map((r) => r[h]) }));

const output = {
  meta: { file: path.basename(infile), sheet: targetSheet, rows: rows.length },
  headers: samples,
  entitiesSuggestion: {
    mantenimiento: headers.filter((h) => /evento|inscrip|piloto|categoria|campeonato|fecha|nombre|email|telefono|dorsal/i.test(h)).map((h) => ({ header: h, entity: 'inscripcion_or_maintenance_entity' })),
  },
  previewRows: rows.slice(0, 20),
};

const outPath = path.join(process.cwd(), 'tmp', `${path.basename(infile, path.extname(infile))}.json`);
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf8');
console.log('Wrote mapping draft to', outPath);

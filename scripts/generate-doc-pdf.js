import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const pageWidth = 595;
const pageHeight = 842;
const margin = 48;

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = path.join(rootDir, "docs", "AuraCinema-documentatie.pdf");

function normalizeText(text) {
  const replacements = {
    ă: "a",
    â: "a",
    î: "i",
    ș: "s",
    ş: "s",
    ț: "t",
    ţ: "t",
    Ă: "A",
    Â: "A",
    Î: "I",
    Ș: "S",
    Ş: "S",
    Ț: "T",
    Ţ: "T"
  };

  return String(text)
    .replace(/[ăâîșşțţĂÂÎȘŞȚŢ]/g, (character) => replacements[character])
    .replace(/[–—]/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[’]/g, "'");
}

function escapePdfText(text) {
  return normalizeText(text).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrapText(text, maxChars) {
  const words = normalizeText(text).split(/\s+/);
  const lines = [];
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;

    if (candidate.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }

  if (line) {
    lines.push(line);
  }

  return lines;
}

function text(page, value, x, y, options = {}) {
  const size = options.size ?? 11;
  const font = options.bold ? "F2" : "F1";
  page.push(`BT /${font} ${size} Tf ${x} ${y} Td (${escapePdfText(value)}) Tj ET`);
}

function paragraph(page, value, x, y, maxChars, options = {}) {
  const size = options.size ?? 11;
  const lineHeight = options.lineHeight ?? size + 5;
  const lines = wrapText(value, maxChars);
  lines.forEach((line, index) => {
    text(page, line, x, y - index * lineHeight, { size, bold: options.bold });
  });

  return y - lines.length * lineHeight;
}

function stroke(page, color = "0.70 0.64 0.53") {
  page.push(`${color} RG`);
}

function fill(page, color = "0.09 0.08 0.09") {
  page.push(`${color} rg`);
}

function rect(page, x, y, width, height, options = {}) {
  page.push("q");
  fill(page, options.fill ?? "0.09 0.08 0.09");
  stroke(page, options.stroke ?? "0.58 0.51 0.39");
  page.push(`${x} ${y} ${width} ${height} re B`);
  page.push("Q");
}

function line(page, x1, y1, x2, y2, color = "0.65 0.72 0.68") {
  page.push("q");
  stroke(page, color);
  page.push(`1.4 w ${x1} ${y1} m ${x2} ${y2} l S`);
  page.push("Q");
}

function arrow(page, x1, y1, x2, y2) {
  line(page, x1, y1, x2, y2);

  const angle = Math.atan2(y2 - y1, x2 - x1);
  const size = 7;
  const a1 = angle + Math.PI * 0.82;
  const a2 = angle - Math.PI * 0.82;
  const p1 = [x2 + Math.cos(a1) * size, y2 + Math.sin(a1) * size];
  const p2 = [x2 + Math.cos(a2) * size, y2 + Math.sin(a2) * size];

  page.push("q");
  fill(page, "0.65 0.72 0.68");
  page.push(`${x2} ${y2} m ${p1[0]} ${p1[1]} l ${p2[0]} ${p2[1]} l h f`);
  page.push("Q");
}

function box(page, x, y, width, height, label, options = {}) {
  rect(page, x, y, width, height, options);
  const labelLines = wrapText(label, Math.floor(width / 6.2));
  const startY = y + height / 2 + (labelLines.length - 1) * 6;
  labelLines.forEach((lineValue, index) => {
    text(page, lineValue, x + 10, startY - index * 13, {
      size: options.size ?? 10,
      bold: options.bold
    });
  });
}

function ellipse(page, x, y, width, height, label) {
  const k = 0.5522847498;
  const ox = (width / 2) * k;
  const oy = (height / 2) * k;
  const xe = x + width;
  const ye = y + height;
  const xm = x + width / 2;
  const ym = y + height / 2;

  page.push("q");
  fill(page, "0.13 0.11 0.09");
  stroke(page, "0.72 0.57 0.26");
  page.push(
    `${xm} ${ye} m ${xm + ox} ${ye} ${xe} ${ym + oy} ${xe} ${ym} c ${xe} ${ym - oy} ${xm + ox} ${y} ${xm} ${y} c ${xm - ox} ${y} ${x} ${ym - oy} ${x} ${ym} c ${x} ${ym + oy} ${xm - ox} ${ye} ${xm} ${ye} c B`
  );
  page.push("Q");
  text(page, label, x + 16, y + height / 2 - 4, { size: 9, bold: true });
}

function diamond(page, x, y, width, height, label) {
  page.push("q");
  fill(page, "0.11 0.12 0.11");
  stroke(page, "0.36 0.78 0.70");
  page.push(
    `${x + width / 2} ${y + height} m ${x + width} ${y + height / 2} l ${x + width / 2} ${y} l ${x} ${y + height / 2} l h B`
  );
  page.push("Q");
  text(page, label, x + 18, y + height / 2 - 4, { size: 9, bold: true });
}

function header(page, title, subtitle) {
  text(page, "AuraCinema", margin, 794, { size: 10, bold: true });
  text(page, title, margin, 760, { size: 22, bold: true });
  if (subtitle) {
    paragraph(page, subtitle, margin, 736, 78, { size: 10, lineHeight: 14 });
  }
}

function createPages() {
  const pages = [];

  const page1 = [];
  header(
    page1,
    "Documentatie proiect",
    "Aplicatie full-stack React + Node/Express pentru cautarea filmelor, recomandari pe baza ratingului si cache local JSON."
  );
  text(page1, "Tehnologii", margin, 674, { size: 15, bold: true });
  paragraph(
    page1,
    "Frontend: React, JavaScript, Vite si CSS standard. Backend: Node.js, Express, CORS si dotenv. Stocare: fisier JSON local. API extern: OMDb.",
    margin,
    650,
    80
  );
  text(page1, "Arhitectura de ansamblu", margin, 588, { size: 15, bold: true });
  box(page1, 54, 496, 92, 48, "Utilizator", { bold: true, fill: "0.11 0.09 0.08" });
  box(page1, 178, 496, 98, 48, "Frontend React", { bold: true, fill: "0.10 0.13 0.12" });
  box(page1, 308, 496, 104, 48, "Backend Express", { bold: true, fill: "0.11 0.10 0.13" });
  box(page1, 444, 544, 96, 44, "OMDb API", { bold: true, fill: "0.13 0.10 0.08" });
  box(page1, 444, 448, 96, 44, "Cache JSON", { bold: true, fill: "0.09 0.12 0.12" });
  arrow(page1, 146, 520, 178, 520);
  arrow(page1, 276, 520, 308, 520);
  arrow(page1, 412, 528, 444, 560);
  arrow(page1, 412, 512, 444, 470);
  arrow(page1, 444, 558, 412, 528);
  arrow(page1, 444, 470, 412, 512);
  text(page1, "Flux principal", margin, 392, { size: 15, bold: true });
  paragraph(
    page1,
    "Backend-ul verifica intai cache-ul. Daca intrarea lipseste, a expirat sau cererea are refresh=true, datele sunt cerute de la OMDb, normalizate si salvate cu o expirare calculata din CACHE_TTL_HOURS.",
    margin,
    368,
    80
  );
  pages.push(page1.join("\n"));

  const page2 = [];
  header(page2, "Use Case si reguli de recomandare", "Actorul principal este utilizatorul aplicatiei AuraCinema.");
  box(page2, 58, 590, 86, 48, "Utilizator", { bold: true, fill: "0.11 0.09 0.08" });
  rect(page2, 190, 470, 330, 210, { fill: "0.08 0.08 0.09", stroke: "0.44 0.40 0.33" });
  text(page2, "Sistem: AuraCinema", 210, 654, { size: 12, bold: true });
  ellipse(page2, 228, 604, 210, 38, "Cauta film dupa titlu");
  ellipse(page2, 228, 560, 210, 38, "Vizualizeaza detalii film");
  ellipse(page2, 228, 516, 210, 38, "Primeste recomandare");
  ellipse(page2, 228, 472, 210, 38, "Reimprospateaza datele");
  arrow(page2, 144, 614, 228, 624);
  arrow(page2, 144, 614, 228, 580);
  arrow(page2, 144, 614, 228, 536);
  arrow(page2, 144, 614, 228, 492);
  text(page2, "Praguri", margin, 404, { size: 15, bold: true });
  paragraph(page2, "Peste 80%: film recomandat pentru vizionare imediata.", margin, 378, 82);
  paragraph(page2, "Sub 50%: aplicatia recomanda evitarea filmului.", margin, 354, 82);
  paragraph(page2, "Intre 50% si 80%: recomandare neutra.", margin, 330, 82);
  paragraph(page2, "Fara scor: se afiseaza datele filmului fara recomandare ferma.", margin, 306, 82);
  pages.push(page2.join("\n"));

  const page3 = [];
  header(page3, "Diagrama de activitate", "Procesul porneste din interfata React si se termina prin afisarea rezultatului sau a erorii.");
  box(page3, 200, 674, 190, 36, "Start: titlul este introdus", { bold: true });
  diamond(page3, 215, 598, 160, 58, "Titlu valid?");
  box(page3, 52, 548, 160, 40, "Eroare 400", { fill: "0.18 0.08 0.08" });
  diamond(page3, 215, 502, 160, 58, "Cache valid?");
  box(page3, 52, 454, 160, 40, "Returneaza cache", { fill: "0.09 0.12 0.12" });
  box(page3, 380, 454, 160, 40, "Apeleaza OMDb", { fill: "0.13 0.10 0.08" });
  diamond(page3, 395, 370, 130, 58, "Film gasit?");
  box(page3, 380, 308, 160, 40, "Normalizeaza si salveaza", { fill: "0.10 0.13 0.12" });
  box(page3, 52, 308, 160, 40, "Eroare 404", { fill: "0.18 0.08 0.08" });
  box(page3, 200, 228, 190, 42, "Afiseaza rezultat", { bold: true });
  arrow(page3, 295, 674, 295, 656);
  arrow(page3, 215, 627, 132, 588);
  arrow(page3, 295, 598, 295, 560);
  arrow(page3, 215, 531, 132, 494);
  arrow(page3, 375, 531, 460, 494);
  arrow(page3, 132, 454, 234, 270);
  arrow(page3, 460, 454, 460, 428);
  arrow(page3, 460, 370, 460, 348);
  arrow(page3, 395, 399, 132, 348);
  arrow(page3, 460, 308, 390, 249);
  pages.push(page3.join("\n"));

  const page4 = [];
  header(page4, "Diagrama de interactiune", "Secventa principala pentru cautarea unui film si popularea cache-ului.");
  const actors = [
    ["Utilizator", 72],
    ["Frontend", 190],
    ["Backend", 310],
    ["Cache JSON", 430],
    ["OMDb", 528]
  ];
  actors.forEach(([label, x]) => {
    box(page4, x - 42, 650, 84, 32, label, { bold: true });
    line(page4, x, 650, x, 284, "0.38 0.37 0.34");
  });
  arrow(page4, 72, 618, 190, 618);
  text(page4, "introduce titlu", 92, 626, { size: 8 });
  arrow(page4, 190, 574, 310, 574);
  text(page4, "GET /api/movies", 208, 582, { size: 8 });
  arrow(page4, 310, 530, 430, 530);
  text(page4, "verifica intrare", 326, 538, { size: 8 });
  arrow(page4, 430, 486, 310, 486);
  text(page4, "cache valid", 342, 494, { size: 8 });
  arrow(page4, 310, 442, 528, 442);
  text(page4, "daca lipseste: cerere OMDb", 342, 450, { size: 8 });
  arrow(page4, 528, 398, 310, 398);
  text(page4, "date film", 414, 406, { size: 8 });
  arrow(page4, 310, 354, 430, 354);
  text(page4, "salvare cache", 330, 362, { size: 8 });
  arrow(page4, 310, 310, 190, 310);
  text(page4, "JSON normalizat", 216, 318, { size: 8 });
  arrow(page4, 190, 284, 72, 284);
  text(page4, "poster, rating, recomandare", 82, 292, { size: 8 });
  text(page4, "Rulare locala", margin, 210, { size: 15, bold: true });
  paragraph(page4, "npm install | cp .env.example .env | completati OMDB_API_KEY | npm run dev", margin, 184, 82);
  pages.push(page4.join("\n"));

  return pages;
}

function buildPdf(pageStreams) {
  const objects = [
    null,
    "<< /Type /Catalog /Pages 2 0 R >>",
    null,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>"
  ];
  const pageObjectIds = [];

  for (const stream of pageStreams) {
    const streamObjectId = objects.length;
    objects.push(`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`);

    const pageObjectId = objects.length;
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${streamObjectId} 0 R >>`
    );
    pageObjectIds.push(pageObjectId);
  }

  objects[2] = `<< /Type /Pages /Kids [${pageObjectIds
    .map((id) => `${id} 0 R`)
    .join(" ")}] /Count ${pageObjectIds.length} >>`;

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  for (let index = 1; index < objects.length; index += 1) {
    offsets[index] = Buffer.byteLength(pdf);
    pdf += `${index} 0 obj\n${objects[index]}\nendobj\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length}\n`;
  pdf += "0000000000 65535 f \n";

  for (let index = 1; index < objects.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return pdf;
}

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, buildPdf(createPages()));
console.log(`PDF generat: ${outputPath}`);

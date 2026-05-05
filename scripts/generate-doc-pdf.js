import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = path.join(rootDir, "docs", "AuraCinema-documentatie.pdf");
const sourcePath = path.join(rootDir, "docs", "documentatie.md");
const pageWidth = 595;
const pageHeight = 842;
const margin = 48;

function normalizeText(text) {
  return String(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E\n]/g, "-")
    .replace(/[()\\]/g, "\\$&");
}

function wrap(line, max = 92) {
  const words = line.trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > max && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) lines.push(current);
  return lines;
}

function textLine(value, x, y, size = 10, bold = false) {
  return `BT /${bold ? "F2" : "F1"} ${size} Tf ${x} ${y} Td (${normalizeText(value)}) Tj ET`;
}

function makePage(lines, pageIndex) {
  const commands = [];
  commands.push(textLine("AuraCinema", margin, 792, 12, true));
  commands.push(textLine(`Documentatie proiect - pagina ${pageIndex + 1}`, margin, 772, 9));

  let y = 736;
  for (const line of lines) {
    if (!line.trim()) {
      y -= 12;
      continue;
    }

    const heading = line.startsWith("#");
    const cleaned = line.replace(/^#+\s*/, "").replace(/^[-*]\s*/, "- ");
    const size = heading ? 13 : 9;
    for (const part of wrap(cleaned, heading ? 70 : 88)) {
      commands.push(textLine(part, margin, y, size, heading));
      y -= heading ? 18 : 13;
    }
  }

  return commands.join("\n");
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
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f\n`;
  for (let index = 1; index < objects.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n\n`;
  }
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return pdf;
}

const markdown = await readFile(sourcePath, "utf8");
const plainLines = markdown
  .split(/\r?\n/)
  .filter((line) => !line.startsWith("```"))
  .slice(0, 180);
const pages = [];
for (let index = 0; index < 4; index += 1) {
  pages.push(makePage(plainLines.slice(index * 34, index * 34 + 34), index));
}

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, buildPdf(pages));
console.log(`PDF generat: ${outputPath}`);

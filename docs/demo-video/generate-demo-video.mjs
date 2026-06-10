import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "build");
const slidesDir = path.join(outDir, "slides");
const pngDir = path.join(outDir, "png");
const segmentsDir = path.join(outDir, "segments");
const finalVideo = path.join(__dirname, "kira-product-demo.mp4");
const concatPath = path.join(outDir, "segments.txt");

mkdirSync(slidesDir, { recursive: true });
mkdirSync(pngDir, { recursive: true });
mkdirSync(segmentsDir, { recursive: true });

const W = 1920;
const H = 1080;

const palette = {
  ink: "#16211d",
  muted: "#5a685f",
  warm: "#efe7da",
  paper: "#f8f5ee",
  card: "#fffdf8",
  border: "#d8c8ae",
  accent: "#a06f42",
  sage: "#6f8778",
  deep: "#22322b",
  red: "#b65f4d",
  green: "#4f8f62",
};

const slides = [
  {
    kicker: "Kira for D2C apparel ops",
    title: "Marketplace POs to dispatch documents",
    subtitle: "Upload a buyer PO. Review extracted data. Generate barcodes, invoices, and packing lists in minutes.",
    kind: "hero",
    duration: 4.4,
  },
  {
    kicker: "The old way",
    title: "Every PO becomes a manual paperwork sprint",
    subtitle: "Ops teams rebuild line items, GST details, labels, and packing sheets across buyer-specific formats.",
    kind: "pain",
    duration: 4.6,
  },
  {
    kicker: "Step 1",
    title: "Upload received marketplace POs",
    subtitle: "PDF, XLS, or XLSX files enter one review queue with background parsing and job status.",
    kind: "upload",
    duration: 4.8,
  },
  {
    kicker: "Step 2",
    title: "Review extracted line items before confirmation",
    subtitle: "Quantities, style codes, HSN, prices, sizes, and buyer fields stay editable before downstream documents are created.",
    kind: "review",
    duration: 5.2,
  },
  {
    kicker: "Built for trust",
    title: "Exceptions are surfaced instead of hidden",
    subtitle: "Low-confidence rows can be accepted, corrected, or rejected so the team keeps control.",
    kind: "exceptions",
    duration: 4.7,
  },
  {
    kicker: "Step 3",
    title: "Generate the dispatch pack",
    subtitle: "Barcode PDFs, GST-aware invoices, and invoice-linked packing lists are created from the confirmed PO.",
    kind: "documents",
    duration: 5.1,
  },
  {
    kicker: "Operational memory",
    title: "Every document stays traceable",
    subtitle: "History views show PO references, statuses, files, and templates across companies and buyers.",
    kind: "history",
    duration: 4.6,
  },
  {
    kicker: "What to sell first",
    title: "A paid pilot for PO-to-dispatch automation",
    subtitle: "Start with brands processing 10-100 marketplace POs a month. Add Tally or Unicommerce export after the workflow is trusted.",
    kind: "cta",
    duration: 5.4,
  },
];

function esc(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function textBlock(lines, x, y, size, fill = palette.ink, weight = 600, gap = size * 1.18) {
  return lines
    .map(
      (line, i) =>
        `<text x="${x}" y="${y + i * gap}" fill="${fill}" font-family="Geist, Inter, Arial, sans-serif" font-size="${size}" font-weight="${weight}">${esc(line)}</text>`,
    )
    .join("\n");
}

function wrap(text, maxChars) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function frame() {
  return `
    <rect x="0" y="0" width="${W}" height="${H}" fill="${palette.paper}"/>
    <circle cx="210" cy="120" r="360" fill="#e6d5bd" opacity="0.38"/>
    <circle cx="1790" cy="980" r="430" fill="#c7d4ca" opacity="0.38"/>
    <path d="M0 780 C420 700 620 850 1040 770 C1420 690 1620 760 1920 700 L1920 1080 L0 1080 Z" fill="#eadfcd" opacity="0.45"/>
    <g opacity="0.22" stroke="${palette.border}" stroke-width="1">
      ${Array.from({ length: 21 }, (_, i) => `<line x1="${i * 96}" y1="0" x2="${i * 96}" y2="${H}"/>`).join("")}
      ${Array.from({ length: 13 }, (_, i) => `<line x1="0" y1="${i * 90}" x2="${W}" y2="${i * 90}"/>`).join("")}
    </g>
  `;
}

function topLabel(slide) {
  const label = slide.kicker.toUpperCase();
  const labelWidth = Math.max(300, Math.min(620, label.length * 18 + 70));
  return `
    <g>
      <rect x="120" y="90" width="${labelWidth}" height="42" rx="21" fill="${palette.deep}" opacity="0.94"/>
      <text x="150" y="118" fill="${palette.paper}" font-family="Geist, Inter, Arial, sans-serif" font-size="22" font-weight="700" letter-spacing="1.4">${esc(label)}</text>
    </g>
  `;
}

function uiShell(x, y, w, h, title = "Kira dashboard") {
  return `
    <g filter="url(#shadow)">
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="22" fill="${palette.card}" stroke="${palette.border}" stroke-width="2"/>
      <rect x="${x}" y="${y}" width="${w}" height="78" rx="22" fill="#fbf4e8"/>
      <rect x="${x}" y="${y + 56}" width="${w}" height="24" fill="#fbf4e8"/>
      <circle cx="${x + 36}" cy="${y + 38}" r="8" fill="#c87b61"/>
      <circle cx="${x + 64}" cy="${y + 38}" r="8" fill="#d8b656"/>
      <circle cx="${x + 92}" cy="${y + 38}" r="8" fill="#74a77d"/>
      <text x="${x + 128}" y="${y + 47}" fill="${palette.ink}" font-family="Geist, Inter, Arial, sans-serif" font-size="24" font-weight="700">${esc(title)}</text>
    </g>
  `;
}

function tableRows(x, y, rows, widths) {
  let out = "";
  let cy = y;
  const headers = rows[0];
  for (let r = 0; r < rows.length; r += 1) {
    const isHeader = r === 0;
    out += `<rect x="${x}" y="${cy}" width="${widths.reduce((a, b) => a + b, 0)}" height="${isHeader ? 52 : 58}" fill="${isHeader ? "#efe1cc" : r % 2 ? "#fffdf8" : "#f7efe3"}" stroke="${palette.border}" stroke-width="1"/>`;
    let cx = x;
    for (let c = 0; c < rows[r].length; c += 1) {
      out += `<text x="${cx + 18}" y="${cy + (isHeader ? 33 : 37)}" fill="${isHeader ? palette.muted : palette.ink}" font-family="Geist, Inter, Arial, sans-serif" font-size="${isHeader ? 18 : 20}" font-weight="${isHeader ? 800 : 600}">${esc(rows[r][c])}</text>`;
      cx += widths[c];
      if (c < widths.length - 1) out += `<line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy + (isHeader ? 52 : 58)}" stroke="${palette.border}" stroke-width="1"/>`;
    }
    cy += isHeader ? 52 : 58;
  }
  return out;
}

function iconCard(x, y, title, body, accent = palette.accent) {
  return `
    <g>
      <rect x="${x}" y="${y}" width="360" height="190" rx="18" fill="${palette.card}" stroke="${palette.border}" stroke-width="2"/>
      <rect x="${x + 28}" y="${y + 28}" width="54" height="54" rx="14" fill="${accent}" opacity="0.95"/>
      <path d="M${x + 42} ${y + 56} L${x + 55} ${y + 69} L${x + 74} ${y + 43}" fill="none" stroke="${palette.paper}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="${x + 104}" y="${y + 55}" fill="${palette.ink}" font-family="Geist, Inter, Arial, sans-serif" font-size="28" font-weight="800">${esc(title)}</text>
      ${textBlock(wrap(body, 31), x + 28, y + 118, 21, palette.muted, 600, 28)}
    </g>
  `;
}

function slideContent(slide, index) {
  const titleLines = wrap(slide.title, 21);
  const subtitleLines = wrap(slide.subtitle, 48);
  const heading = `
    ${topLabel(slide)}
    ${textBlock(titleLines, 120, 245, 66, palette.ink, 850, 76)}
    ${textBlock(subtitleLines, 124, 245 + titleLines.length * 76 + 24, 29, palette.muted, 550, 39)}
  `;

  if (slide.kind === "hero") {
    return `
      ${heading}
      <g transform="translate(1170 170)">
        <rect x="0" y="0" width="540" height="650" rx="30" fill="${palette.card}" stroke="${palette.border}" stroke-width="2" filter="url(#shadow)"/>
        <rect x="42" y="52" width="456" height="78" rx="18" fill="#f2e6d5"/>
        <text x="76" y="102" fill="${palette.ink}" font-family="Geist, Inter, Arial, sans-serif" font-size="26" font-weight="800">Received PO</text>
        <path d="M90 215 L450 215 M90 292 L450 292 M90 369 L450 369" stroke="${palette.border}" stroke-width="18" stroke-linecap="round"/>
        <rect x="72" y="466" width="396" height="88" rx="18" fill="${palette.deep}"/>
        <text x="126" y="522" fill="${palette.paper}" font-family="Geist, Inter, Arial, sans-serif" font-size="28" font-weight="800">Generate docs</text>
      </g>
    `;
  }

  if (slide.kind === "pain") {
    return `
      ${heading}
      <g transform="translate(1070 220)">
        ${iconCard(0, 0, "POs", "manual line-item entry", palette.red)}
        ${iconCard(190, 230, "Invoices", "GST math and buyer formats", palette.accent)}
        ${iconCard(-90, 460, "Labels", "barcode and packing sheets", palette.sage)}
      </g>
    `;
  }

  if (slide.kind === "upload") {
    return `
      ${heading}
      ${uiShell(990, 180, 760, 610, "Received POs")}
      <rect x="1070" y="310" width="600" height="250" rx="22" fill="#f8f1e6" stroke="${palette.border}" stroke-width="3" stroke-dasharray="14 14"/>
      <text x="1200" y="406" fill="${palette.ink}" font-family="Geist, Inter, Arial, sans-serif" font-size="34" font-weight="850">Drop marketplace PO</text>
      <text x="1228" y="456" fill="${palette.muted}" font-family="Geist, Inter, Arial, sans-serif" font-size="25" font-weight="600">PDF, XLS, XLSX</text>
      <rect x="1130" y="620" width="485" height="62" rx="16" fill="${palette.deep}"/>
      <text x="1228" y="660" fill="${palette.paper}" font-family="Geist, Inter, Arial, sans-serif" font-size="23" font-weight="800">Parsing in background</text>
    `;
  }

  if (slide.kind === "review") {
    return `
      ${heading}
      ${uiShell(850, 155, 940, 700, "PO review")}
      ${tableRows(910, 280, [
        ["Style", "Size", "Qty", "Rate", "Status"],
        ["RA-101", "M", "24", "749", "OK"],
        ["RA-101", "L", "32", "749", "OK"],
        ["MX-220", "S", "18", "899", "Review"],
        ["CR-044", "XL", "12", "699", "OK"],
      ], [170, 110, 110, 130, 170])}
      <rect x="1408" y="502" width="112" height="34" rx="17" fill="#fff0df" stroke="${palette.accent}"/>
      <text x="1432" y="526" fill="${palette.accent}" font-family="Geist, Inter, Arial, sans-serif" font-size="18" font-weight="900">Review</text>
      <rect x="1290" y="735" width="410" height="66" rx="16" fill="${palette.green}"/>
      <text x="1372" y="777" fill="${palette.paper}" font-family="Geist, Inter, Arial, sans-serif" font-size="24" font-weight="850">Confirm PO</text>
    `;
  }

  if (slide.kind === "exceptions") {
    return `
      ${heading}
      ${uiShell(970, 190, 760, 570, "Exception inbox")}
      <rect x="1040" y="318" width="620" height="96" rx="18" fill="#fff6eb" stroke="${palette.accent}" stroke-width="2"/>
      <text x="1076" y="360" fill="${palette.ink}" font-family="Geist, Inter, Arial, sans-serif" font-size="28" font-weight="850">Low confidence: size mapping</text>
      <text x="1076" y="396" fill="${palette.muted}" font-family="Geist, Inter, Arial, sans-serif" font-size="22" font-weight="600">Suggested fix: XL from buyer alias X-Large</text>
      <rect x="1040" y="454" width="180" height="56" rx="14" fill="${palette.green}"/>
      <text x="1086" y="491" fill="${palette.paper}" font-family="Geist, Inter, Arial, sans-serif" font-size="22" font-weight="850">Accept</text>
      <rect x="1242" y="454" width="180" height="56" rx="14" fill="${palette.deep}"/>
      <text x="1284" y="491" fill="${palette.paper}" font-family="Geist, Inter, Arial, sans-serif" font-size="22" font-weight="850">Correct</text>
      <rect x="1444" y="454" width="180" height="56" rx="14" fill="${palette.red}"/>
      <text x="1490" y="491" fill="${palette.paper}" font-family="Geist, Inter, Arial, sans-serif" font-size="22" font-weight="850">Reject</text>
    `;
  }

  if (slide.kind === "documents") {
    return `
      ${heading}
      <g transform="translate(880 250)">
        ${iconCard(0, 0, "Barcodes", "ready-to-print label PDFs", palette.deep)}
        ${iconCard(390, 0, "Invoices", "IGST or CGST + SGST handled", palette.accent)}
        ${iconCard(780, 0, "Packing lists", "linked to invoice snapshots", palette.sage)}
        <path d="M135 250 C240 335 420 335 530 250" fill="none" stroke="${palette.border}" stroke-width="10" stroke-linecap="round"/>
        <path d="M525 250 C630 335 810 335 920 250" fill="none" stroke="${palette.border}" stroke-width="10" stroke-linecap="round"/>
      </g>
    `;
  }

  if (slide.kind === "history") {
    return `
      ${heading}
      ${uiShell(860, 160, 900, 660, "Documents")}
      ${tableRows(920, 285, [
        ["PO", "Document", "Status", "File"],
        ["STY-00991", "Invoice", "Final", "PDF"],
        ["STY-00991", "Packing list", "Ready", "PDF"],
        ["AJ-77512", "Barcode labels", "Ready", "PDF"],
        ["MYN-10202", "Invoice", "Draft", "Open"],
      ], [190, 230, 150, 120])}
      <text x="966" y="727" fill="${palette.muted}" font-family="Geist, Inter, Arial, sans-serif" font-size="24" font-weight="650">Company-scoped, buyer-aware, and traceable.</text>
    `;
  }

  return `
    ${heading}
    <g transform="translate(1060 240)">
      <rect x="0" y="0" width="610" height="450" rx="28" fill="${palette.deep}" filter="url(#shadow)"/>
      <text x="56" y="92" fill="${palette.paper}" font-family="Geist, Inter, Arial, sans-serif" font-size="40" font-weight="900">Best first pitch</text>
      ${textBlock(["Send us your PO formats.", "We automate the dispatch docs.", "You review, then download."], 58, 170, 32, "#f8f5ee", 750, 58)}
      <rect x="56" y="338" width="392" height="62" rx="18" fill="${palette.accent}"/>
      <text x="96" y="379" fill="${palette.paper}" font-family="Geist, Inter, Arial, sans-serif" font-size="24" font-weight="900">Book a paid pilot</text>
    </g>
  `;
}

function svg(slide, index) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="24" stdDeviation="28" flood-color="#16211d" flood-opacity="0.16"/>
    </filter>
  </defs>
  <g transform="scale(0.5625)">
    ${frame()}
    ${slideContent(slide, index)}
    <text x="120" y="1000" fill="${palette.muted}" font-family="Geist, Inter, Arial, sans-serif" font-size="22" font-weight="700">kira</text>
    <text x="1710" y="1000" fill="${palette.muted}" font-family="Geist, Inter, Arial, sans-serif" font-size="22" font-weight="700">${index + 1}/${slides.length}</text>
  </g>
</svg>`;
}

function run(command, args) {
  console.log(`$ ${command} ${args.join(" ")}`);
  execFileSync(command, args, { stdio: "inherit" });
}

slides.forEach((slide, index) => {
  writeFileSync(path.join(slidesDir, `slide-${String(index).padStart(2, "0")}.svg`), svg(slide, index));
});

const segmentPaths = [];
slides.forEach((slide, index) => {
  const svgInput = path.join(slidesDir, `slide-${String(index).padStart(2, "0")}.svg`);
  run("qlmanage", ["-t", "-s", "1920", "-o", pngDir, svgInput]);
  const input = path.join(pngDir, `slide-${String(index).padStart(2, "0")}.svg.png`);
  const segment = path.join(segmentsDir, `segment-${String(index).padStart(2, "0")}.mp4`);
  segmentPaths.push(segment);
  run("ffmpeg", [
    "-y",
    "-loop",
    "1",
    "-t",
    String(slide.duration),
    "-i",
    input,
    "-vf",
    "crop=1920:1080:0:0,scale=1920:1080,format=yuv420p,fade=t=in:st=0:d=0.25,fade=t=out:st=" + Math.max(0.1, slide.duration - 0.35).toFixed(2) + ":d=0.35",
    "-r",
    "30",
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    segment,
  ]);
});

writeFileSync(concatPath, segmentPaths.map((segment) => `file '${segment.replaceAll("'", "'\\''")}'`).join("\n"));

const silentVideo = path.join(outDir, "silent-demo.mp4");
run("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", concatPath, "-c", "copy", silentVideo]);

run("ffmpeg", [
  "-y",
  "-i",
  silentVideo,
  "-f",
  "lavfi",
  "-i",
  "anullsrc=channel_layout=stereo:sample_rate=44100",
  "-c:v",
  "copy",
  "-c:a",
  "aac",
  "-shortest",
  "-movflags",
  "+faststart",
  finalVideo,
]);

console.log(`\nCreated ${finalVideo}`);

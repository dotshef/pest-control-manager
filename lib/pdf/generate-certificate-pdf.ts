import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { readFile } from "fs/promises";
import { join } from "path";
import type { CertificateInput } from "@/lib/hwpx/generate-certificate";

const FONT_SIZE = 10;
const COLOR = rgb(0, 0, 0);

export async function generateCertificatePdf(input: CertificateInput): Promise<Buffer> {
  const root = process.cwd();
  const [templateBytes, fontBytes] = await Promise.all([
    readFile(join(root, "lib/template/소독증명서_템플릿.pdf")),
    readFile(join(root, "lib/fonts/NanumGothic-Regular.ttf")),
  ]);

  const pdf = await PDFDocument.load(templateBytes);
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(fontBytes);

  const page = pdf.getPages()[0];
  const s = FONT_SIZE;

  const fields: [number, number, string][] = [
    [160, 724, input.issueNumber],
    [235, 607, input.businessName],
    [427, 602, input.areaM2],
    [497, 602, input.areaM3],
    [235, 575, input.address],
    [345, 552, input.position],
    [345, 523, input.managerName],
    [265, 488, input.periodStart],
    [352, 488, input.periodEnd],
    [365, 288, input.year],
    [435, 288, input.month],
    [492, 288, input.day],
    [325, 158, input.operatorName],
    [325, 135, input.operatorAddress],
    [325, 111, input.operatorCeo],
  ];

  for (const [x, y, text] of fields) {
    if (!text) continue;
    page.drawText(text, { x, y, size: s, font, color: COLOR });
  }

  // 소독 방법 — 동적 중앙 정렬
  if (input.disinfectionType) {
    const cellLeft = 140;
    const cellRight = 540;
    const cellCenter = (cellLeft + cellRight) / 2;
    const textWidth = font.widthOfTextAtSize(input.disinfectionType, s);
    const methodX = Math.max(cellLeft, cellCenter - textWidth / 2);
    page.drawText(input.disinfectionType, { x: methodX, y: 454, size: s, font, color: COLOR });
  }

  // 약품 사용 내용 — 동적 중앙 정렬 + 자동 줄바꿈
  if (input.chemicals) {
    const cellLeft = 140;
    const cellRight = 540;
    const maxWidth = cellRight - cellLeft;
    const lineHeight = 14;
    const baseY = 415;

    // 쉼표 기준으로 분리 후 줄 구성
    const items = input.chemicals.split(", ");
    const lines: string[] = [];
    let currentLine = "";

    for (const item of items) {
      const candidate = currentLine ? `${currentLine}, ${item}` : item;
      const candidateWidth = font.widthOfTextAtSize(candidate, s);
      if (candidateWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = item;
      } else {
        currentLine = candidate;
      }
    }
    if (currentLine) lines.push(currentLine);

    // 각 줄을 중앙 정렬하여 출력
    const cellCenter = (cellLeft + cellRight) / 2;
    for (let i = 0; i < lines.length; i++) {
      const lineWidth = font.widthOfTextAtSize(lines[i], s);
      const lineX = Math.max(cellLeft, cellCenter - lineWidth / 2);
      page.drawText(lines[i], { x: lineX, y: baseY - i * lineHeight, size: s, font, color: COLOR });
    }
  }

  const pdfBytes = await pdf.save();
  return Buffer.from(pdfBytes);
}

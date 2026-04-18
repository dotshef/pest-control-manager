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
    [220, 612, input.businessName],
    [448, 612, input.areaM2],
    [505, 612, input.areaM3],
    [220, 580, input.address],
    [310, 552, input.position],
    [310, 528, input.managerName],
    [300, 490, input.periodStart],
    [410, 490, input.periodEnd],
    [270, 454, input.disinfectionType],
    [270, 420, input.chemicals],
    [310, 295, input.year],
    [400, 295, input.month],
    [480, 295, input.day],
    [340, 155, input.operatorName],
    [340, 132, input.operatorAddress],
    [340, 108, input.operatorCeo],
  ];

  for (const [x, y, text] of fields) {
    if (!text) continue;
    page.drawText(text, { x, y, size: s, font, color: COLOR });
  }

  const pdfBytes = await pdf.save();
  return Buffer.from(pdfBytes);
}

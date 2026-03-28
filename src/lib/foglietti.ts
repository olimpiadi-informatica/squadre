import { PDFDocument, rgb as rgbColor, StandardFonts } from "@cantoo/pdf-lib";

export interface Credential {
  teamName: string;
  school: string;
  username: string;
  password: string;
}

export async function createCredentialsPdf(credentials: Credential[]) {
  const pdfDoc = await PDFDocument.create();
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const courier = await pdfDoc.embedFont(StandardFonts.Courier);
  const zapfDingbats = await pdfDoc.embedFont(StandardFonts.ZapfDingbats);

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 20;

  const cardsPerPage = 8;
  const cardHeight = (pageHeight - margin * 2) / cardsPerPage;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let cardIndex = 0;

  for (let i = 0; i < credentials.length; i++) {
    if (cardIndex === cardsPerPage) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      cardIndex = 0;
    }

    const cred = credentials[i];
    const yTop = pageHeight - margin - cardIndex * cardHeight;
    const yCenter = yTop - cardHeight / 2;
    const yBottom = yTop - cardHeight;

    page.drawLine({
      start: { x: margin, y: yTop },
      end: { x: pageWidth - margin, y: yTop },
      thickness: 1,
      color: rgbColor(0, 0, 0),
      dashArray: [5, 5],
    });

    page.drawText("✂", {
      x: margin - 5,
      y: yTop - 4,
      size: 14,
      font: zapfDingbats,
      color: rgbColor(0, 0, 0),
    });

    const centerAreaLeft = margin;
    const centerAreaRight = pageWidth - 210;
    const centerX = (centerAreaLeft + centerAreaRight) / 2;

    const teamNameWidth = helveticaBold.widthOfTextAtSize(cred.teamName, 18);
    page.drawText(cred.teamName, {
      x: centerX - teamNameWidth / 2,
      y: yCenter + 8,
      size: 18,
      font: helveticaBold,
    });

    const schoolWidth = helvetica.widthOfTextAtSize(cred.school, 12);
    page.drawText(cred.school, {
      x: centerX - schoolWidth / 2,
      y: yCenter - 10,
      size: 12,
      font: helvetica,
    });

    page.drawText("slug", {
      x: pageWidth - 200,
      y: yCenter + 10,
      size: 12,
      font: helvetica,
    });
    page.drawText(cred.username, {
      x: pageWidth - 130,
      y: yCenter + 10,
      size: 12,
      font: courier,
    });

    page.drawText("password", {
      x: pageWidth - 200,
      y: yCenter - 15,
      size: 12,
      font: helvetica,
    });
    page.drawText(cred.password, {
      x: pageWidth - 130,
      y: yCenter - 15,
      size: 12,
      font: courier,
    });

    if (i === credentials.length - 1 || cardIndex === cardsPerPage - 1) {
      page.drawLine({
        start: { x: margin, y: yBottom },
        end: { x: pageWidth - margin, y: yBottom },
        thickness: 1,
        color: rgbColor(0, 0, 0),
        dashArray: [5, 5],
      });
      page.drawText("✂", {
        x: margin - 5,
        y: yBottom - 4,
        size: 14,
        font: zapfDingbats,
        color: rgbColor(0, 0, 0),
      });
    }

    cardIndex++;
  }

  return pdfDoc.save();
}

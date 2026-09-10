import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import {
  Document as DocxDocument,
  Packer,
  Paragraph,
  HeadingLevel,
  TextRun,
  AlignmentType,
} from "docx";

/**
 * Clean HTML tags into clean text lines for export
 */
const stripHtml = (html = "") => {
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
};

/**
 * Client-Side Pure JS PDF Export using pdf-lib
 * Zero headless browser, zero server RAM consumption
 */
export const exportToPdf = async ({ title, sections = [] }) => {
  const pdfDoc = await PDFDocument.create();
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const pageWidth = 595.28; // A4
  const pageHeight = 841.89;
  const margin = 50;
  const contentWidth = pageWidth - margin * 2;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  // Title Header
  page.drawText(title || "NexAI Document", {
    x: margin,
    y: y - 20,
    size: 22,
    font: helveticaBold,
    color: rgb(0.09, 0.13, 0.24), // #17213d
  });

  y -= 45;

  // Subtitle / generated timestamp
  page.drawText(
    `Generated with NexAI Document Studio • ${new Date().toLocaleDateString()}`,
    {
      x: margin,
      y,
      size: 9,
      font: helveticaOblique,
      color: rgb(0.45, 0.5, 0.6),
    },
  );

  y -= 25;

  // Divider line
  page.drawLine({
    start: { x: margin, y },
    end: { x: pageWidth - margin, y },
    thickness: 1,
    color: rgb(0.85, 0.88, 0.92),
  });

  y -= 25;

  // Render Sections
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const heading = section.heading || `Section ${i + 1}`;
    const plainBody = stripHtml(section.body || "");

    // Check if new page needed for heading
    if (y < 120) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }

    // Section Heading
    page.drawText(heading, {
      x: margin,
      y,
      size: 14,
      font: helveticaBold,
      color: rgb(0.12, 0.16, 0.25),
    });

    y -= 18;

    // Wrap body text paragraphs
    const paragraphs = plainBody.split("\n").filter((p) => p.trim().length > 0);

    for (const p of paragraphs) {
      // Simple word-wrap
      const words = p.split(/\s+/);
      let currentLine = "";

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const textWidth = helvetica.widthOfTextAtSize(testLine, 10);

        if (textWidth > contentWidth) {
          if (y < 60) {
            page = pdfDoc.addPage([pageWidth, pageHeight]);
            y = pageHeight - margin;
          }
          page.drawText(currentLine, {
            x: margin,
            y,
            size: 10,
            font: helvetica,
            color: rgb(0.2, 0.23, 0.28),
          });
          y -= 14;
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }

      if (currentLine) {
        if (y < 60) {
          page = pdfDoc.addPage([pageWidth, pageHeight]);
          y = pageHeight - margin;
        }
        page.drawText(currentLine, {
          x: margin,
          y,
          size: 10,
          font: helvetica,
          color: rgb(0.2, 0.23, 0.28),
        });
        y -= 18;
      }
    }

    y -= 12; // Gap between sections
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const filename = `${(title || "document").toLowerCase().replace(/[^a-z0-9]/g, "-")}.pdf`;

  triggerDownload(blob, filename);
};

/**
 * Client-Side Pure JS DOCX Export using docx npm package
 */
export const exportToDocx = async ({ title, sections = [] }) => {
  const docxParagraphs = [
    new Paragraph({
      text: title || "NexAI Document",
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.START,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Generated with NexAI Document Studio • ${new Date().toLocaleDateString()}`,
          italics: true,
          size: 18, // half-points (9pt)
          color: "666666",
        }),
      ],
      spacing: { after: 400 },
    }),
  ];

  sections.forEach((section, idx) => {
    docxParagraphs.push(
      new Paragraph({
        text: section.heading || `Section ${idx + 1}`,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 300, after: 150 },
      }),
    );

    const plainText = stripHtml(section.body || "");
    const lines = plainText.split("\n").filter((l) => l.trim().length > 0);

    lines.forEach((line) => {
      docxParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: line,
              size: 22, // 11pt
            }),
          ],
          spacing: { after: 150 },
        }),
      );
    });
  });

  const doc = new DocxDocument({
    sections: [
      {
        properties: {},
        children: docxParagraphs,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const filename = `${(title || "document").toLowerCase().replace(/[^a-z0-9]/g, "-")}.docx`;

  triggerDownload(blob, filename);
};

/**
 * Helper to initiate browser file download
 */
const triggerDownload = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

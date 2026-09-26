import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

/**
 * Wraps text into lines that do not exceed maxWidth using the specified font and font size.
 * Correctly accounts for manual newlines (\n).
 *
 * @param {string} text
 * @param {import('pdf-lib').PDFFont} font
 * @param {number} fontSize
 * @param {number} maxWidth
 * @returns {string[]}
 */
function wrapText(text, font, fontSize, maxWidth) {
  if (!text) return [];

  const rawParagraphs = text.split('\n');
  const lines = [];

  for (const paragraph of rawParagraphs) {
    if (!paragraph.trim()) {
      lines.push(''); // Preserves paragraph separation
      continue;
    }

    const words = paragraph.split(' ');
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const width = font.widthOfTextAtSize(testLine, fontSize);

      if (width <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          // Single word exceeds full line width - force break
          let fragment = '';
          for (const char of word) {
            if (font.widthOfTextAtSize(fragment + char, fontSize) <= maxWidth) {
              fragment += char;
            } else {
              lines.push(fragment);
              fragment = char;
            }
          }
          currentLine = fragment;
        }
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }
  }

  return lines;
}

/**
 * Generates a clean, styled multi-page PDF document buffer from structured document data.
 *
 * @param {Object} documentData
 * @param {string} documentData.title - Document title
 * @param {string} [documentData.category] - Document category
 * @param {string} [documentData.summary] - Document summary
 * @param {Array<{ heading: string, body: string }>} documentData.sections - Document sections
 * @param {Date|string} [documentData.createdAt] - Creation timestamp
 * @returns {Promise<Buffer>}
 */
export async function generateDocumentPdf(documentData) {
  const {
    title = 'NexAI Document',
    category = 'document',
    summary = '',
    sections = [],
    createdAt = new Date(),
  } = documentData;

  const pdfDoc = await PDFDocument.create();

  // Set standard metadata
  pdfDoc.setTitle(title);
  pdfDoc.setAuthor('NexAI');
  pdfDoc.setSubject(category.toUpperCase());
  pdfDoc.setProducer('NexAI Knowledge Hub');

  // Embed standard typography fonts
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // Palette constants
  const colorPrimary = rgb(0.08, 0.1, 0.14); // Dark slate
  const colorBody = rgb(0.2, 0.23, 0.28); // Slate body
  const colorMuted = rgb(0.48, 0.53, 0.6); // Grey
  const colorAccent = rgb(0.063, 0.725, 0.506); // Emerald Green
  const colorBorder = rgb(0.88, 0.9, 0.93); // Light line
  const colorSummaryBg = rgb(0.96, 0.97, 0.98); // Light surface

  // Page geometry
  const pageWidth = 612; // Standard Letter width
  const pageHeight = 792; // Standard Letter height
  const marginLeft = 50;
  const marginRight = 50;
  const marginTop = 50;
  const marginBottom = 50;
  const contentWidth = pageWidth - marginLeft - marginRight;

  const pages = [];
  let currentPage = null;
  let currentY = 0;

  // Helper to append a new page
  const addNewPage = () => {
    currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
    pages.push(currentPage);
    currentY = pageHeight - marginTop;

    // If subsequent page, add running subtle header
    if (pages.length > 1) {
      currentPage.drawText(title.slice(0, 50), {
        x: marginLeft,
        y: currentY,
        size: 9,
        font: fontRegular,
        color: colorMuted,
      });

      currentPage.drawLine({
        start: { x: marginLeft, y: currentY - 6 },
        end: { x: pageWidth - marginRight, y: currentY - 6 },
        thickness: 0.5,
        color: colorBorder,
      });

      currentY -= 25;
    }
  };

  // Helper to ensure vertical space
  const ensureSpace = (neededHeight) => {
    if (currentY - neededHeight < marginBottom) {
      addNewPage();
    }
  };

  // Start Page 1
  addNewPage();

  // 1. Header: Category badge & Date
  const categoryLabel = `NEXAI ${category.toUpperCase()}`;
  currentPage.drawText(categoryLabel, {
    x: marginLeft,
    y: currentY,
    size: 9,
    font: fontBold,
    color: colorAccent,
  });

  const formattedDate = new Date(createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const dateWidth = fontRegular.widthOfTextAtSize(formattedDate, 9);
  currentPage.drawText(formattedDate, {
    x: pageWidth - marginRight - dateWidth,
    y: currentY,
    size: 9,
    font: fontRegular,
    color: colorMuted,
  });

  currentY -= 20;

  // 2. Document Title
  const titleLines = wrapText(title, fontBold, 20, contentWidth);
  for (const line of titleLines) {
    ensureSpace(26);
    currentPage.drawText(line, {
      x: marginLeft,
      y: currentY,
      size: 20,
      font: fontBold,
      color: colorPrimary,
    });
    currentY -= 24;
  }

  currentY -= 6;

  // 3. Summary callout box (if present)
  if (summary && summary.trim()) {
    const summaryLines = wrapText(summary.trim(), fontOblique, 10, contentWidth - 24);
    const boxHeight = summaryLines.length * 15 + 16;
    ensureSpace(boxHeight + 10);

    // Summary container background
    currentPage.drawRectangle({
      x: marginLeft,
      y: currentY - boxHeight + 10,
      width: contentWidth,
      height: boxHeight,
      color: colorSummaryBg,
      borderColor: colorBorder,
      borderWidth: 1,
    });

    // Emerald accent bar on left of summary
    currentPage.drawRectangle({
      x: marginLeft,
      y: currentY - boxHeight + 10,
      width: 3,
      height: boxHeight,
      color: colorAccent,
    });

    let summaryTextY = currentY - 4;
    for (const sLine of summaryLines) {
      currentPage.drawText(sLine, {
        x: marginLeft + 14,
        y: summaryTextY,
        size: 10,
        font: fontOblique,
        color: colorBody,
      });
      summaryTextY -= 15;
    }

    currentY -= boxHeight + 14;
  } else {
    // Divider line
    currentPage.drawLine({
      start: { x: marginLeft, y: currentY },
      end: { x: pageWidth - marginRight, y: currentY },
      thickness: 0.5,
      color: colorBorder,
    });
    currentY -= 18;
  }

  // 4. Sections
  for (const section of sections) {
    const heading = section.heading || 'Untitled Section';
    const body = section.body || '';

    // Section heading needs space for heading + at least 2 lines of body
    ensureSpace(45);

    // Section Accent indicator
    currentPage.drawRectangle({
      x: marginLeft,
      y: currentY - 2,
      width: 4,
      height: 14,
      color: colorAccent,
    });

    // Section Heading text
    currentPage.drawText(heading, {
      x: marginLeft + 12,
      y: currentY,
      size: 13,
      font: fontBold,
      color: colorPrimary,
    });
    currentY -= 18;

    // Body lines
    const bodyLines = wrapText(body, fontRegular, 10, contentWidth);
    for (const bLine of bodyLines) {
      if (bLine === '') {
        currentY -= 8;
        continue;
      }

      ensureSpace(16);

      // Check if line looks like a bullet
      if (bLine.startsWith('- ') || bLine.startsWith('* ') || bLine.startsWith('• ')) {
        const cleanBulletText = bLine.replace(/^[-*•]\s*/, '');
        currentPage.drawText('•', {
          x: marginLeft + 4,
          y: currentY,
          size: 11,
          font: fontBold,
          color: colorAccent,
        });
        currentPage.drawText(cleanBulletText, {
          x: marginLeft + 16,
          y: currentY,
          size: 10,
          font: fontRegular,
          color: colorBody,
        });
      } else {
        currentPage.drawText(bLine, {
          x: marginLeft,
          y: currentY,
          size: 10,
          font: fontRegular,
          color: colorBody,
        });
      }

      currentY -= 15;
    }

    // Space after section
    currentY -= 14;
  }

  // 5. Draw Footers with Page Numbers across all pages
  const totalPages = pages.length;
  for (let i = 0; i < totalPages; i++) {
    const page = pages[i];
    const pageNumText = `Page ${i + 1} of ${totalPages}`;
    const pageNumWidth = fontRegular.widthOfTextAtSize(pageNumText, 9);

    // Bottom divider
    page.drawLine({
      start: { x: marginLeft, y: marginBottom - 12 },
      end: { x: pageWidth - marginRight, y: marginBottom - 12 },
      thickness: 0.5,
      color: colorBorder,
    });

    // Left footer brand
    page.drawText('NexAI Personal Knowledge & Document Hub', {
      x: marginLeft,
      y: marginBottom - 25,
      size: 8,
      font: fontRegular,
      color: colorMuted,
    });

    // Right footer page count
    page.drawText(pageNumText, {
      x: pageWidth - marginRight - pageNumWidth,
      y: marginBottom - 25,
      size: 8,
      font: fontRegular,
      color: colorMuted,
    });
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

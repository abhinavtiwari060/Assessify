/**
 * OCR Provider Adapter Module
 * Allows plugging in OCR engines (e.g. Tesseract.js, AWS Textract, Google Cloud Vision)
 * when scanned or image-only PDFs are detected.
 */

/**
 * Attempt OCR on a PDF buffer if an OCR provider is configured.
 * @param {Buffer} pdfBuffer 
 * @returns {Promise<{ text: string, pages: Array<{ pageNum: number, text: string }> } | null>}
 */
const extractTextWithOcr = async (pdfBuffer) => {
  // Plug point for future OCR implementations.
  // Return null if no OCR provider is installed/configured.
  return null;
};

module.exports = {
  extractTextWithOcr,
};

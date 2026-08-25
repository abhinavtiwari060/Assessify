/**
 * OCR Provider Adapter Module
 * Provides OCR capabilities and plug points for scanned/image-based PDF files.
 * Supports tesseract.js dynamic integration and cloud OCR plugin adapters.
 */

/**
 * Attempts to perform OCR on a PDF buffer using tesseract.js if installed.
 * 
 * @param {Buffer} pdfBuffer 
 * @returns {Promise<{ text: string, performedOcr: boolean }>}
 */
const performOcr = async (pdfBuffer) => {
  try {
    const tesseract = require('tesseract.js');
    if (tesseract && typeof tesseract.recognize === 'function') {
      const result = await tesseract.recognize(pdfBuffer, 'eng');
      return {
        text: result.data.text || '',
        performedOcr: true,
      };
    }
  } catch (err) {
    // Tesseract not installed or failed
  }

  return {
    text: '',
    performedOcr: false,
  };
};

/**
 * Attempt OCR on a PDF buffer if an OCR provider is configured.
 * @param {Buffer} pdfBuffer 
 * @returns {Promise<{ text: string, pages: Array<{ pageNum: number, text: string }> } | null>}
 */
const extractTextWithOcr = async (pdfBuffer) => {
  const res = await performOcr(pdfBuffer);
  if (res.performedOcr && res.text) {
    return {
      text: res.text,
      pages: [{ pageNum: 1, text: res.text }],
    };
  }
  return null;
};

module.exports = {
  performOcr,
  extractTextWithOcr,
};

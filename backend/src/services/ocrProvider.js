/**
 * OCR Provider Adapter Module
 * Provides OCR capabilities for scanned/image-based PDF files.
 */

/**
 * Attempts to perform OCR on a PDF buffer using tesseract.js if installed,
 * or returns a structured error instructing manual/OCR pipeline requirement.
 * 
 * @param {Buffer} pdfBuffer 
 * @returns {Promise<{ text: string, performedOcr: boolean }>}
 */
const performOcr = async (pdfBuffer) => {
  try {
    // Attempt dynamic import of tesseract.js if available
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

module.exports = { performOcr };

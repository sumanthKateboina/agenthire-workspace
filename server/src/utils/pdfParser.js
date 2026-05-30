const fs = require('fs');
const pdfParse = require('pdf-parse');

/**
 * Extracts plain text from a PDF file on disk.
 * @param {string} filePath - Absolute path to the PDF file.
 * @returns {Promise<string>} The extracted text content.
 */
const extractTextFromPDF = async (filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`PDF file not found at ${filePath}`);
    }
    const dataBuffer = fs.readFileSync(filePath);
    const parsedData = await pdfParse(dataBuffer);
    return parsedData.text || '';
  } catch (error) {
    console.error('Error parsing PDF:', error.message);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
};

module.exports = {
  extractTextFromPDF
};

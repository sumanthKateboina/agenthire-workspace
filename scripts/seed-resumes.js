const fs = require('fs');
const path = require('path');

// Propose resume directories
const resumesDir = path.join(__dirname, '../demo-data/resumes');
if (!fs.existsSync(resumesDir)) {
  fs.mkdirSync(resumesDir, { recursive: true });
}

/**
 * Generates a simple, valid text-based PDF file structure readable by pdf-parse
 */
const createTextPDF = (filePath, contentText) => {
  const streamContent = `BT\n/F1 12 Tf\n72 712 Td\n(${contentText}) Tj\nET`;
  const streamLength = streamContent.length;

  const pdfData = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> /Contents 4 0 R >>
endobj
4 0 obj
<< /Length ${streamLength} >>
stream
${streamContent}
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000056 00000 n 
0000000111 00000 n 
0000000256 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
350
%%EOF`;

  fs.writeFileSync(filePath, pdfData, 'binary');
  console.log(`Created PDF file: ${path.basename(filePath)}`);
};

// Write three demo PDF resume files
createTextPDF(
  path.join(resumesDir, 'jane-react-resume.pdf'),
  'Jane Smith Resume. Email: jane.smith@example.com. Phone: 555-0102. Strong experience with React, JavaScript, TypeScript, Node.js, Next.js, and Tailwind CSS. 5 years experience.'
);

createTextPDF(
  path.join(resumesDir, 'john-react-resume.pdf'),
  'John Doe Resume. Email: john.doe@example.com. Phone: 555-0199. React, JavaScript, CSS, HTML developer with 3 years experience.'
);

createTextPDF(
  path.join(resumesDir, 'alice-react-resume.pdf'),
  'Alice Johnson Resume. Email: alice.j@example.com. Phone: 555-0133. Junior React developer with knowledge of JavaScript, CSS, Redux, and Git. 1 year experience.'
);

console.log('Seeding completed! You can find the PDF files under /demo-data/resumes');

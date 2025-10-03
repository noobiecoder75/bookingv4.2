import Papa from 'papaparse';
import * as XLSX from 'xlsx';

// Lazy load pdf-parse only on server-side to avoid Next.js bundling issues
let pdfParse: any = null;

async function loadPdfParser() {
  if (typeof window !== 'undefined') {
    throw new Error('PDF parsing is only available server-side');
  }
  if (!pdfParse) {
    // @ts-ignore - pdf-parse doesn't have proper types
    pdfParse = (await import('pdf-parse')).default;
  }
  return pdfParse;
}

/**
 * Parse CSV file to text
 */
export async function parseCSV(file: File): Promise<string> {
  // Read file as text first (works in Node.js)
  const fileText = await file.text();

  return new Promise((resolve, reject) => {
    Papa.parse(fileText, {
      complete: (results) => {
        // Convert parsed data back to readable text format
        const header = results.data[0] as string[];
        const rows = results.data.slice(1) as string[][];

        let text = `CSV Data:\n\n`;
        text += `Columns: ${header.join(', ')}\n\n`;

        rows.forEach((row, index) => {
          if (row.length > 1) {
            // Skip empty rows
            text += `Row ${index + 1}:\n`;
            header.forEach((col, colIndex) => {
              if (row[colIndex]) {
                text += `  ${col}: ${row[colIndex]}\n`;
              }
            });
            text += '\n';
          }
        });

        resolve(text);
      },
      error: (error) => reject(error),
    });
  });
}

/**
 * Parse PDF file to text
 */
export async function parsePDF(file: File): Promise<string> {
  try {
    // Load pdf-parse dynamically (server-side only)
    const pdf = await loadPdfParser();

    const arrayBuffer = await file.arrayBuffer();
    const data = await pdf(Buffer.from(arrayBuffer));
    return `PDF Content:\n\n${data.text}`;
  } catch (error: any) {
    throw new Error(`PDF parsing failed: ${error.message}`);
  }
}

/**
 * Parse Excel file to text using xlsx library
 */
export async function parseExcel(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    let text = `Excel Content:\n\n`;

    // Process all sheets
    workbook.SheetNames.forEach((sheetName, index) => {
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

      text += `Sheet ${index + 1}: ${sheetName}\n`;

      if (data.length > 0) {
        const header = data[0];
        const rows = data.slice(1);

        text += `Columns: ${header.join(', ')}\n\n`;

        rows.forEach((row, rowIndex) => {
          if (row.length > 0 && row.some(cell => cell !== null && cell !== undefined && cell !== '')) {
            text += `Row ${rowIndex + 1}:\n`;
            header.forEach((col, colIndex) => {
              const value = row[colIndex];
              if (value !== null && value !== undefined && value !== '') {
                text += `  ${col}: ${value}\n`;
              }
            });
            text += '\n';
          }
        });
      }

      text += '\n';
    });

    return text;
  } catch (error: any) {
    throw new Error(`Excel parsing failed: ${error.message}`);
  }
}

/**
 * Parse image file (for OCR in future)
 */
export async function parseImage(file: File): Promise<string> {
  // TODO: Add Tesseract.js or similar for OCR
  return `Image file detected: ${file.name}\n\nNote: OCR support coming soon. For now, please use CSV, PDF, or text files.`;
}

/**
 * Parse plain text file
 */
export async function parseText(file: File): Promise<string> {
  const text = await file.text();
  return `Text Content:\n\n${text}`;
}

/**
 * Main file parser - routes to appropriate parser
 */
export async function parseFile(file: File): Promise<{
  success: boolean;
  content: string;
  error?: string;
}> {
  try {
    console.log('📄 [Parser] Parsing file:', {
      name: file.name,
      type: file.type,
      size: `${(file.size / 1024).toFixed(2)} KB`,
    });

    let content: string;

    // Route to appropriate parser based on file type
    if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
      content = await parseCSV(file);
    } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      content = await parsePDF(file);
    } else if (
      file.type.includes('spreadsheet') ||
      file.name.endsWith('.xlsx') ||
      file.name.endsWith('.xls')
    ) {
      content = await parseExcel(file);
    } else if (file.type.startsWith('image/')) {
      content = await parseImage(file);
    } else if (file.type.startsWith('text/') || file.name.endsWith('.txt')) {
      content = await parseText(file);
    } else {
      // Try to parse as text by default
      content = await parseText(file);
    }

    console.log('✅ [Parser] File parsed successfully:', {
      contentLength: content.length,
    });

    return {
      success: true,
      content,
    };
  } catch (error: any) {
    console.error('❌ [Parser] Parsing failed:', error);

    return {
      success: false,
      content: '',
      error: error.message || 'File parsing failed',
    };
  }
}

/**
 * Validate file before processing
 */
export function validateFile(file: File): {
  valid: boolean;
  error?: string;
} {
  // Max file size: 10MB
  const MAX_SIZE = 10 * 1024 * 1024;

  if (file.size > MAX_SIZE) {
    return {
      valid: false,
      error: 'File size exceeds 10MB limit',
    };
  }

  // Allowed file types
  const allowedExtensions = [
    '.csv',
    '.pdf',
    '.xlsx',
    '.xls',
    '.txt',
    '.jpg',
    '.jpeg',
    '.png',
  ];

  const extension = '.' + file.name.split('.').pop()?.toLowerCase();

  if (!allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: `File type not supported. Allowed: ${allowedExtensions.join(', ')}`,
    };
  }

  return { valid: true };
}

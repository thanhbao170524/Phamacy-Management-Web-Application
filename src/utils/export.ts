// Export utilities for PDF and Excel

export async function exportToPDF(data: any, title: string) {
  try {
    // Try to import jspdf dynamically
    let jsPDFConstructor: any;
    try {
      // jsPDF v3.x: default export is { jsPDF: class, ... }
      const jspdfModule: any = await import('jspdf');
      
      // Handle different export formats
      if (jspdfModule.default) {
        jsPDFConstructor = jspdfModule.default.jsPDF || jspdfModule.default;
      } else if (jspdfModule.jsPDF) {
        jsPDFConstructor = jspdfModule.jsPDF;
      } else {
        jsPDFConstructor = jspdfModule;
      }
      
      if (!jsPDFConstructor) {
        throw new Error('jsPDF constructor not found');
      }
    } catch (importError: any) {
      console.error('Import error:', importError);
      // Fallback: Use browser's print functionality or download as text
      const content = generateTextReport(data, title);
      downloadAsText(content, title, 'txt');
      throw new Error('Chưa cài đặt jspdf. Đã tải xuống file text thay thế. Vui lòng cài đặt: npm install jspdf');
    }
    
    const doc = new jsPDFConstructor();
    
    // Title
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    
    // Date
    doc.setFontSize(10);
    doc.text(`Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`, 14, 30);
    
    let yPosition = 40;
    
    // Add data
    if (Array.isArray(data)) {
      data.forEach((item: any, index: number) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        doc.setFontSize(12);
        const text = `${index + 1}. ${item.name || item.title || JSON.stringify(item)}`;
        doc.text(text.substring(0, 80), 14, yPosition); // Limit text length
        yPosition += 10;
      });
    } else {
      doc.setFontSize(12);
      Object.keys(data).forEach(key => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        const text = `${key}: ${data[key]}`;
        doc.text(text.substring(0, 80), 14, yPosition); // Limit text length
        yPosition += 10;
      });
    }
    
    doc.save(`${title}_${new Date().toISOString().split('T')[0]}.pdf`);
    return true;
  } catch (error: any) {
    console.error('Error exporting PDF:', error);
    if (error.message && error.message.includes('Chưa cài đặt')) {
      throw error; // Re-throw our custom message
    }
    throw new Error('Không thể xuất PDF. Vui lòng cài đặt jspdf: npm install jspdf');
  }
}

function generateTextReport(data: any, title: string): string {
  let content = `========== ${title} ==========\n`;
  content += `Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}\n\n`;
  
  if (Array.isArray(data)) {
    data.forEach((item: any, index: number) => {
      content += `${index + 1}. ${item.name || item.title || JSON.stringify(item)}\n`;
    });
  } else {
    Object.keys(data).forEach(key => {
      content += `${key}: ${data[key]}\n`;
    });
  }
  
  return content;
}

function downloadAsText(content: string, filename: string, extension: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.${extension}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function exportToExcel(data: any[], filename: string, headers: string[]) {
  try {
    // Try to import xlsx dynamically
    let XLSX: any;
    try {
      const xlsxModule: any = await import('xlsx');
      XLSX = xlsxModule.default || xlsxModule;
      if (!XLSX || !XLSX.utils) {
        throw new Error('XLSX not found');
      }
    } catch (importError: any) {
      console.error('Import error:', importError);
      // Fallback: Export as CSV
      const csv = generateCSV(data, headers);
      downloadAsText(csv, filename, 'csv');
      throw new Error('Chưa cài đặt xlsx. Đã tải xuống file CSV thay thế. Vui lòng cài đặt: npm install xlsx');
    }
    
    // Prepare worksheet data
    const worksheetData = [
      headers,
      ...data.map(item => headers.map(header => {
        const keys = header.split('.');
        let value = item;
        for (const key of keys) {
          value = value?.[key];
        }
        return value ?? '';
      }))
    ];
    
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    
    XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
    return true;
  } catch (error: any) {
    console.error('Error exporting Excel:', error);
    if (error.message && error.message.includes('Chưa cài đặt')) {
      throw error; // Re-throw our custom message
    }
    throw new Error('Không thể xuất Excel. Vui lòng cài đặt xlsx: npm install xlsx');
  }
}

function generateCSV(data: any[], headers: string[]): string {
  // Generate CSV content
  let csv = headers.map(h => `"${h}"`).join(',') + '\n';
  
  data.forEach(item => {
    const row = headers.map(header => {
      const keys = header.split('.');
      let value = item;
      for (const key of keys) {
        value = value?.[key];
      }
      // Escape quotes and wrap in quotes
      const stringValue = String(value ?? '').replace(/"/g, '""');
      return `"${stringValue}"`;
    });
    csv += row.join(',') + '\n';
  });
  
  return csv;
}


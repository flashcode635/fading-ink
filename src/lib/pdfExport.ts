import { DocumentPage } from '@/types/document';

export async function exportToPDF(
  title: string,
  pages: DocumentPage[],
  containerRef: HTMLElement | null
): Promise<void> {
  if (!containerRef) return;

  // Dynamic imports to avoid blocking initial load
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
  ]);

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // Add title
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text(title || 'Untitled Document', pageWidth / 2, 20, { align: 'center' });
  
  // Capture the current page as image
  const canvas = await html2canvas(containerRef, {
    backgroundColor: '#FAF7F2',
    scale: 2,
    logging: false,
    useCORS: true,
  });
  
  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  const imgWidth = pageWidth - 20;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
  pdf.addImage(imgData, 'JPEG', 10, 30, imgWidth, Math.min(imgHeight, pageHeight - 40));
  
  pdf.save(`${title.replace(/[^a-z0-9]/gi, '_') || 'document'}_aged.pdf`);
}

export async function exportAllPagesToPDF(
  title: string,
  pageElements: HTMLElement[],
): Promise<void> {
  // Dynamic imports to avoid blocking initial load
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
  ]);

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  for (let i = 0; i < pageElements.length; i++) {
    if (i > 0) {
      pdf.addPage();
    }
    
    const canvas = await html2canvas(pageElements[i], {
      backgroundColor: '#FAF7F2',
      scale: 2,
      logging: false,
      useCORS: true,
    });
    
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const imgWidth = pageWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Add page number
    pdf.setFontSize(10);
    pdf.text(`Page ${i + 1}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    
    pdf.addImage(imgData, 'JPEG', 10, 10, imgWidth, Math.min(imgHeight, pageHeight - 25));
  }
  
  pdf.save(`${title.replace(/[^a-z0-9]/gi, '_') || 'document'}_aged.pdf`);
}

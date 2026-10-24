/**
 * Programmatically triggers a PDF download by fetching the file as a blob
 * and creating a temporary download link. This bypasses any SPA router
 * interference or service worker caching that might serve HTML instead of the PDF.
 */
const createPdfDownloader = (pdfUrl: string, fileName: string) => {
  return (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Use fetch + blob to ensure we get the actual PDF binary
    fetch(pdfUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to fetch PDF: ${response.status}`);
        }
        return response.blob();
      })
      .then((blob) => {
        // Create a blob URL and trigger download
        const blobUrl = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        // Cleanup
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
        }, 100);
      })
      .catch((err) => {
        console.error('PDF download failed:', err);
        // Fallback: open in new tab
        window.open(pdfUrl, '_blank');
      });
  };
};

/**
 * Creates a PDF preview handler that opens the PDF in a new browser tab.
 */
const createPdfPreviewer = (pdfUrl: string) => {
  return (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(pdfUrl, '_blank', 'noopener,noreferrer');
  };
};

// Data House Checklist PDF
export const downloadPdf = createPdfDownloader(
  '/assets/DataHouse-Checklist.pdf',
  'DataHouse-Checklist.pdf'
);

export const previewPdf = createPdfPreviewer('/assets/DataHouse-Checklist.pdf');

// Dashboard Planning Template PDF
export const downloadDashboardPdf = createPdfDownloader(
  '/assets/Dashboard-Planning-Template.pdf',
  'Dashboard-Planning-Template.pdf'
);

export const previewDashboardPdf = createPdfPreviewer('/assets/Dashboard-Planning-Template.pdf');
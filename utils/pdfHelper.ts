// Utility to handle PDF to Image conversion using PDF.js
// Assumes PDF.js is loaded in window (via CDN in index.html)

export const convertPdfToImage = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async function() {
      try {
        const typedarray = new Uint8Array(this.result as ArrayBuffer);
        
        // @ts-ignore
        const pdf = await window.pdfjsLib.getDocument(typedarray).promise;
        const page = await pdf.getPage(1); // Get first page
        
        const scale = 2.0; // Higher scale for better quality
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (!context) {
          reject("Could not create canvas context");
          return;
        }

        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;

        // Convert to base64 string (remove prefix for the service)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(dataUrl); 
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

export const extractPdfText = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async function() {
      try {
        const typedarray = new Uint8Array(this.result as ArrayBuffer);
        
        // @ts-ignore
        const pdf = await window.pdfjsLib.getDocument(typedarray).promise;
        let fullText = '';
        
        // Extract text from all pages
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const strings = textContent.items.map((item: any) => item.str);
          fullText += strings.join(' ') + '\n\n';
        }
        
        resolve(fullText.trim());
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};
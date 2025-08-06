import { pdfjs } from 'react-pdf';

// Configure PDF.js worker to use our local copy
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
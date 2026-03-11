/**
 * Generate a test PDF with e-sign fields similar to what eSign.com/DocuSign would create
 * Run with: npx ts-node scripts/generate-test-esign-pdf.ts
 */

import { PDFDocument, PDFName, PDFString, rgb, StandardFonts } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';

async function generateTestEsignPDF() {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Add a page
  const page = pdfDoc.addPage([612, 792]); // Letter size
  const { width, height } = page.getSize();

  // Add title
  page.drawText('Sample Lease Agreement', {
    x: 50,
    y: height - 50,
    size: 24,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  // Add some body text
  page.drawText('This is a test document with pre-existing e-sign fields.', {
    x: 50,
    y: height - 100,
    size: 12,
    font: font,
    color: rgb(0, 0, 0),
  });

  page.drawText('The signature fields below contain embedded URLs to esign.com', {
    x: 50,
    y: height - 120,
    size: 12,
    font: font,
    color: rgb(0, 0, 0),
  });

  page.drawText('that should be stripped when uploaded to our system.', {
    x: 50,
    y: height - 140,
    size: 12,
    font: font,
    color: rgb(0, 0, 0),
  });

  // Add landlord signature section
  page.drawText('Landlord Signature:', {
    x: 50,
    y: height - 250,
    size: 12,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  // Add tenant signature section
  page.drawText('Tenant Signature:', {
    x: 50,
    y: height - 350,
    size: 12,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  // Create the form
  const form = pdfDoc.getForm();

  // Create a signature field for landlord with an action URL
  const landlordSigField = form.createTextField('landlord_signature');
  landlordSigField.setText('Click here to sign');
  landlordSigField.addToPage(page, {
    x: 50,
    y: height - 300,
    width: 200,
    height: 30,
    borderColor: rgb(0, 0, 0),
    backgroundColor: rgb(1, 1, 0.8),
  });

  // Create a signature field for tenant
  const tenantSigField = form.createTextField('tenant_signature');
  tenantSigField.setText('Click here to sign');
  tenantSigField.addToPage(page, {
    x: 50,
    y: height - 400,
    width: 200,
    height: 30,
    borderColor: rgb(0, 0, 0),
    backgroundColor: rgb(1, 1, 0.8),
  });

  // Add a link annotation that points to esign.com (simulating what e-sign services add)
  const linkAnnotation = pdfDoc.context.obj({
    Type: 'Annot',
    Subtype: 'Link',
    Rect: [50, height - 300, 250, height - 270],
    Border: [0, 0, 0],
    A: {
      Type: 'Action',
      S: 'URI',
      URI: PDFString.of('https://www.esign.com/complete-signature?doc=12345'),
    },
  });

  // Add another link annotation
  const linkAnnotation2 = pdfDoc.context.obj({
    Type: 'Annot',
    Subtype: 'Link',
    Rect: [50, height - 400, 250, height - 370],
    Border: [0, 0, 0],
    A: {
      Type: 'Action',
      S: 'URI',
      URI: PDFString.of('https://www.esign.com/complete-signature?doc=12345&signer=2'),
    },
  });

  // Get or create annotations array for the page
  const annots = page.node.get(PDFName.of('Annots'));
  if (annots) {
    // If annotations exist, we need to add to them
    const annotsArray = pdfDoc.context.lookup(annots);
    if (annotsArray && 'push' in annotsArray) {
      (annotsArray as any).push(pdfDoc.context.register(linkAnnotation));
      (annotsArray as any).push(pdfDoc.context.register(linkAnnotation2));
    }
  } else {
    // Create new annotations array
    const annotsArray = pdfDoc.context.obj([
      pdfDoc.context.register(linkAnnotation),
      pdfDoc.context.register(linkAnnotation2),
    ]);
    page.node.set(PDFName.of('Annots'), annotsArray);
  }

  // Add visible text indicating there are hidden links
  page.drawText('(Contains hidden esign.com link)', {
    x: 260,
    y: height - 290,
    size: 8,
    font: font,
    color: rgb(0.6, 0, 0),
  });

  page.drawText('(Contains hidden esign.com link)', {
    x: 260,
    y: height - 390,
    size: 8,
    font: font,
    color: rgb(0.6, 0, 0),
  });

  // Add date field
  page.drawText('Date:', {
    x: 50,
    y: height - 500,
    size: 12,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  const dateField = form.createTextField('date');
  dateField.setText('MM/DD/YYYY');
  dateField.addToPage(page, {
    x: 100,
    y: height - 510,
    width: 150,
    height: 25,
  });

  // Save the PDF
  const pdfBytes = await pdfDoc.save();

  // Write to file
  const outputPath = path.join(process.cwd(), 'test-esign-document.pdf');
  fs.writeFileSync(outputPath, pdfBytes);

  console.log(`✅ Test PDF with e-sign fields created at: ${outputPath}`);
  console.log('');
  console.log('This PDF contains:');
  console.log('  - 2 text fields (simulating signature fields)');
  console.log('  - 2 link annotations pointing to esign.com');
  console.log('  - 1 date field');
  console.log('');
  console.log('Upload this to the lease creation flow to test the stripping functionality.');
}

generateTestEsignPDF().catch(console.error);

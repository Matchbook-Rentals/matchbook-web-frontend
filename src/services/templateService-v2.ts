import { FieldFormType } from '@/components/pdf-editor-v2/types';
import { Recipient } from '@/components/pdf-editor-v2/RecipientManager';
import { PdfTemplate } from '@prisma/client';

/**
 * Upload PDF and save template
 * Extracted from PDFEditor.tsx (lines ~1034-1166)
 */
export async function saveTemplateAndCreateDocument(params: {
  pdfFile: File;
  fields: FieldFormType[];
  recipients: Recipient[];
  templateName?: string;
  templateType?: 'lease' | 'addendum' | 'disclosure' | 'other';
  listingId?: string;
  router: any; // Next.js router
  sessionStorage: Storage;
  brandAlert: (message: string, type: 'success' | 'error' | 'warning', title: string, callback?: () => void) => void;
  onSaveCallback?: () => void;
  onUploadSuccess?: () => void;
}): Promise<{ success: boolean; templateId?: string; error?: string }> {
  const {
    pdfFile,
    fields,
    recipients,
    templateName,
    templateType,
    listingId,
    router,
    sessionStorage,
    brandAlert,
    onSaveCallback,
    onUploadSuccess
  } = params;

  if (!pdfFile) {
    brandAlert('Please upload a PDF file first.', 'warning', 'File Required');
    return { success: false, error: 'No PDF file provided' };
  }

  try {
    console.log('🚀 Starting template save process...');
    console.log('📄 PDF File:', {
      name: pdfFile.name,
      size: pdfFile.size,
      type: pdfFile.type
    });
    console.log('🎯 Fields to save:', {
      count: fields.length,
      fields: fields.map(f => ({ id: f.formId, type: f.type, recipientIndex: f.recipientIndex }))
    });
    console.log('👥 Recipients to save:', {
      count: recipients.length,
      recipients: recipients.map(r => ({ id: r.id, name: r.name, email: r.email }))
    });

    // Step 1: Upload PDF file to UploadThing
    console.log('📤 STEP 1: Uploading PDF to UploadThing...');
    const formData = new FormData();
    formData.append('file', pdfFile);

    const uploadResponse = await fetch('/api/pdf-templates/upload', {
      method: 'POST',
      body: formData,
    });

    console.log('📤 Upload response status:', uploadResponse.status);

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('❌ Upload failed:', errorText);
      throw new Error(`Upload failed: ${errorText}`);
    }

    const uploadResult = await uploadResponse.json();

    // Step 2: Save template with annotations
    const templateData = {
      title: templateName || pdfFile.name.replace('.pdf', ' Template') || 'PDF Template',
      description: `Template created from ${pdfFile.name}`,
      type: templateType,
      listingId,
      fields,
      recipients,
      pdfFileUrl: uploadResult.fileUrl,
      pdfFileName: uploadResult.fileName,
      pdfFileSize: uploadResult.fileSize,
      pdfFileKey: uploadResult.fileKey,
      author: 'PDF Editor User',
      subject: 'PDF Template'
    };

    console.log('💾 Template data being sent:', {
      title: templateData.title,
      fieldsCount: templateData.fields.length,
      recipientsCount: templateData.recipients.length,
      pdfFileUrl: templateData.pdfFileUrl ? 'Present' : 'Missing',
      pdfFileKey: templateData.pdfFileKey ? 'Present' : 'Missing'
    });

    const templateResponse = await fetch('/api/pdf-templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(templateData),
    });

    console.log('💾 Template save response status:', templateResponse.status);

    if (!templateResponse.ok) {
      const errorText = await templateResponse.text();
      console.error('❌ Template save failed:', errorText);
      throw new Error(`Template save failed: ${errorText}`);
    }

    const { template } = await templateResponse.json();
    console.log('✅ Template saved successfully:', {
      id: template.id,
      title: template.title,
      createdAt: template.createdAt
    });

    // Step 3: Complete and navigate
    console.log('🎉 STEP 3: Finalizing...');
    sessionStorage.setItem('currentTemplateId', template.id);
    console.log('✅ Template ID stored in sessionStorage:', template.id);

    // Trigger success state
    if (onUploadSuccess) {
      onUploadSuccess();
    }

    // Wait 1000ms then redirect
    setTimeout(() => {
      if (listingId) {
        router.push(`/app/host/${listingId}/leases`);
      }
      if (onSaveCallback) {
        onSaveCallback();
      }
    }, 1000);

    console.log('🏁 Template save process completed successfully!');
    return { success: true, templateId: template.id };

  } catch (error: any) {
    console.error('❌ SAVE TEMPLATE FAILED:', error);
    console.error('❌ Full error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    let errorMessage = '❌ Failed to save template!\n\n';
    if (error.message.includes('Upload failed')) {
      errorMessage += '📤 PDF Upload Error: ' + error.message;
    } else if (error.message.includes('Template save failed')) {
      errorMessage += '💾 Database Save Error: ' + error.message;
    } else {
      errorMessage += '🔧 Unknown Error: ' + error.message;
    }

    errorMessage += '\n\n🔍 Check console for detailed logs.';
    brandAlert(errorMessage, 'error', 'Save Failed');
    return { success: false, error: error.message };
  }
}

/**
 * Load template data and fetch PDF
 * Extracted from PDFEditor.tsx (lines ~1765-1900)
 */
export async function loadTemplate(params: {
  template: PdfTemplate;
  hostName?: string;
  hostEmail?: string;
  sessionStorage: Storage;
  brandAlert: (message: string, type: 'success' | 'error' | 'warning', title: string) => void;
}): Promise<{
  success: boolean;
  fields?: FieldFormType[];
  recipients?: Recipient[];
  pdfFile?: File;
  preFilledFields?: Record<string, any>;
  error?: string;
}> {
  const { template, hostName, hostEmail, sessionStorage, brandAlert } = params;

  try {
    console.log('📄 Loading template for document creation:', template.id);

    console.log('🔍 Raw template data received:', template);

    // Parse template data from database
    const templateData = template.templateData as any;
    const templateFields = templateData.fields || [];
    const templateRecipients = templateData.recipients || [];

    console.log('📋 Parsed template data:', {
      fields: templateFields.length,
      recipients: templateRecipients.length,
      fieldsData: templateFields,
      recipientsData: templateRecipients
    });

    // Auto-populate default recipients with real names
    const defaultRecipients = templateRecipients.map((r: any) => {
      if (r.role === 'HOST') {
        return { ...r, name: hostName || 'John Smith', email: hostEmail || 'host@host.com' };
      }
      if (r.role === 'RENTER') {
        return { ...r, name: 'Jane Doe', email: 'renter@renter.com' };
      }
      return r;
    });

    // Load the PDF file from the template
    let pdfFile: File | undefined;
    if (template.pdfFileUrl) {
      console.log('📄 Fetching PDF from:', template.pdfFileUrl);
      const pdfResponse = await fetch(template.pdfFileUrl);
      const pdfBlob = await pdfResponse.blob();
      pdfFile = new File([pdfBlob], template.pdfFileName, { type: 'application/pdf' });
      console.log('📄 PDF file created:', pdfFile);
    }

    // Pre-fill fields based on tags and predefined values
    const preFilledFields: Record<string, any> = {};
    const documentValues = {
      monthlyRent: '2,500.00',
      startDate: new Date().toISOString().split('T')[0], // Today's date
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // One year from now
    };

    console.log('🔍 Available recipients for pre-fill:', defaultRecipients);
    console.log('📝 Document values for pre-fill:', documentValues);
    console.log('🔍 Available fields for pre-fill:', templateFields);

    templateFields.forEach((field: any, index: number) => {
      console.log(`🔍 Processing field ${index + 1}/${templateFields.length}: ${field.formId} (${field.type})`);

      // Pre-fill NAME fields based on recipient roles
      if (field.type === 'NAME') {
        console.log(`📝 Processing NAME field: ${field.formId}, signerEmail: ${field.signerEmail}, recipientIndex: ${field.recipientIndex}`);

        // Simplified matching logic - just alternate between HOST and RENTER
        const nameFields = templateFields.filter((f: any) => f.type === 'NAME');
        const nameFieldIndex = nameFields.findIndex((f: any) => f.formId === field.formId);

        console.log(`🎯 NEW ALTERNATING LOGIC: Field ${field.formId} is NAME field #${nameFieldIndex} of ${nameFields.length} total NAME fields`);

        let recipient;
        if (nameFieldIndex % 2 === 0) {
          // Even index (0, 2, 4...) = HOST
          recipient = defaultRecipients.find((r: any) => r.role === 'HOST');
          console.log(`🎯 Even index ${nameFieldIndex} -> Using HOST:`, recipient);
        } else {
          // Odd index (1, 3, 5...) = RENTER
          recipient = defaultRecipients.find((r: any) => r.role === 'RENTER');
          console.log(`🎯 Odd index ${nameFieldIndex} -> Using RENTER:`, recipient);
        }

        console.log(`🔍 Final recipient for field ${field.formId} (index ${nameFieldIndex}):`, recipient);

        // Pre-fill with actual names from default recipients
        if (recipient && recipient.name) {
          preFilledFields[field.formId] = recipient.name;
          console.log(`📝 Pre-filling NAME field ${field.formId} with "${recipient.name}"`);
        } else {
          console.log(`⏭️ No recipient found for NAME field ${field.formId}`);
        }
      }

      // Pre-fill common document fields by field type or position
      if (field.type === 'TEXT' || field.type === 'NUMBER') {
        // Pre-fill all TEXT/NUMBER fields with rent for demo purposes
        preFilledFields[field.formId] = documentValues.monthlyRent;
        console.log(`📝 Pre-filling TEXT/NUMBER field ${field.formId} with monthly rent: ${documentValues.monthlyRent}`);
      }

      if (field.type === 'DATE') {
        // Alternate between start and end dates based on field index
        const dateFields = templateFields.filter((f: any) => f.type === 'DATE');
        const dateFieldIndex = dateFields.findIndex((f: any) => f.formId === field.formId);

        if (dateFieldIndex % 2 === 0) {
          // Even index (0, 2, 4...) = start date
          preFilledFields[field.formId] = documentValues.startDate;
          console.log(`📝 Pre-filling DATE field ${field.formId} with start date: ${documentValues.startDate}`);
        } else {
          // Odd index (1, 3, 5...) = end date
          preFilledFields[field.formId] = documentValues.endDate;
          console.log(`📝 Pre-filling DATE field ${field.formId} with end date: ${documentValues.endDate}`);
        }
      }
    });

    console.log('✅ Pre-filled fields (should be handled by parent):', preFilledFields);

    // Store current template ID for document creation
    sessionStorage.setItem('currentTemplateId', template.id);

    console.log('✅ Template loaded into document editor:', {
      templateId: template.id,
      fields: templateFields.length,
      recipients: templateRecipients.length,
      fieldsData: templateFields,
      recipientsData: templateRecipients
    });

    return {
      success: true,
      fields: templateFields,
      recipients: defaultRecipients,
      pdfFile,
      preFilledFields
    };

  } catch (error: any) {
    console.error('❌ Error loading template:', error);
    brandAlert('Failed to load template: ' + error.message, 'error', 'Load Failed');
    return { success: false, error: error.message };
  }
}

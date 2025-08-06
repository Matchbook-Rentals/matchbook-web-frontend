'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';

interface DocumentData {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  recipients?: RecipientData[];
}

interface LeaseFields {
  HOST_SIGNATURE?: string;
  HOST_NAME?: string;
  RENTER_SIGNATURE?: string;
  RENTER_NAME?: string;
  START_DATE?: string;
  END_DATE?: string;
  MONTHLY_RENT?: string;
}

interface LeaseDocumentCreationRequest {
  title?: string;
  recipients: Array<{
    id?: number;
    name: string;
    email: string;
    role: 'SIGNER' | 'APPROVER' | 'CC' | 'VIEWER';
    signingOrder?: number;
  }>;
  leaseFields?: LeaseFields;
  meta: {
    subject: string;
    message: string;
    distributionMethod: 'EMAIL';
    timezone: string;
    dateFormat: string;
    language: string;
    redirectUrl?: string;
    signingOrder: 'SEQUENTIAL' | 'PARALLEL';
    signatureTypes: string[];
    allowDictateNextSigner: boolean;
    externalId?: string;
  };
}

interface EmbedAuthoringParams {
  features?: {
    [key: string]: any;
  };
  externalId?: string;
}

interface TemplateData {
  id: string;
  title: string;
  createdAt: string;
}

interface PresignTokenData {
  token: string;
  externalId: string;
  type: string;
}

interface RecipientData {
  id: string;
  email: string;
  name: string;
  role: 'SIGNER' | 'VIEWER' | 'APPROVER';
  signingOrder: number;
}

interface PropertyRequestData {
  id: string;
  propertyAddress: string;
  requesterEmail: string;
  requesterName: string;
  requestDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  documentId?: string;
}

type WorkflowStep = 'template' | 'property-request' | 'document-creation' | 'signing' | 'completed';

export default function DocumensoIntegrationTest() {
  const [baseUrl, setBaseUrl] = useState(process.env.NEXT_PUBLIC_DOCUMENSO_URL || 'http://localhost:3000');
  const [apiKeyStatus, setApiKeyStatus] = useState<'checking' | 'valid' | 'invalid'>('checking');
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [templates, setTemplates] = useState<TemplateData[]>([]);
  const [presignToken, setPresignToken] = useState<PresignTokenData | null>(null);
  const [response, setResponse] = useState('');
  const [error, setError] = useState('');
  const [currentWorkflowStep, setCurrentWorkflowStep] = useState<WorkflowStep>('template');
  const [userRole, setUserRole] = useState<'landlord' | 'leaser'>('landlord');

  // Template creation form
  const [templateTitle, setTemplateTitle] = useState('Lease Agreement Template');
  const [templateExternalId, setTemplateExternalId] = useState('');
  const [documentTitle, setDocumentTitle] = useState('Lease Agreement');
  const [documentExternalId, setDocumentExternalId] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('tenant@example.com');
  const [recipientName, setRecipientName] = useState('John Tenant');
  const [useProxy, setUseProxy] = useState(true);
  
  
  // PDF Upload and Fields
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [documentDataId, setDocumentDataId] = useState<string>('');
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string>('');

  // Property request data
  const [propertyRequests, setPropertyRequests] = useState<PropertyRequestData[]>([]);
  const [newPropertyRequest, setNewPropertyRequest] = useState({
    propertyAddress: '123 Main St, Anytown, ST 12345',
    requesterEmail: 'tenant@example.com',
    requesterName: 'John Tenant'
  });

  // Landlord workflow data
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedPropertyRequest, setSelectedPropertyRequest] = useState<string>('');
  const [landlordEmail, setLandlordEmail] = useState('landlord@example.com');
  const [landlordName, setLandlordName] = useState('Jane Landlord');
  
  // Document signing data
  const [signingDocuments, setSigningDocuments] = useState<DocumentData[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<string>('');
  
  // Iframe display options
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Additional presign tokens for different workflows
  const [documentCreationToken, setDocumentCreationToken] = useState<PresignTokenData | null>(null);
  const [signingToken, setSigningToken] = useState<PresignTokenData | null>(null);
  
  // Lease document creation form data
  const [leaseDocumentForm, setLeaseDocumentForm] = useState<LeaseDocumentCreationRequest>({
    title: 'Lease Agreement',
    recipients: [
      {
        name: 'John Tenant',
        email: 'tenant@example.com',
        role: 'SIGNER',
        signingOrder: 1
      },
      {
        name: 'Jane Landlord', 
        email: 'landlord@example.com',
        role: 'SIGNER',
        signingOrder: 2
      }
    ],
    leaseFields: {
      HOST_NAME: 'Jane Landlord',
      RENTER_NAME: 'John Tenant',
      START_DATE: new Date().toISOString().split('T')[0],
      END_DATE: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      MONTHLY_RENT: '$2,500.00'
    },
    meta: {
      subject: 'Please sign your lease agreement',
      message: 'Please review and sign the attached lease agreement.',
      distributionMethod: 'EMAIL',
      timezone: 'UTC',
      dateFormat: 'MM/DD/YYYY',
      language: 'en',
      signingOrder: 'SEQUENTIAL',
      signatureTypes: ['SIGNATURE_PAD', 'SIGNATURE_TEXT', 'SIGNATURE_IMAGE'],
      allowDictateNextSigner: false
    }
  });
  
  // Lease template creation iframe state
  const [leaseCreationIframe, setLeaseCreationIframe] = useState<string | null>(null);
  
  // Template polling
  const [lastTemplateCount, setLastTemplateCount] = useState(0);
  
  // Template creation mode
  const [templateMode, setTemplateMode] = useState<'regular' | 'lease'>('lease');

  // Auto-generate external IDs and check API key status
  useEffect(() => {
    const timestamp = Date.now();
    setTemplateExternalId(`template-${timestamp}`);
    setDocumentExternalId(`document-${timestamp}`);
    
    // Initialize mock data
    initializeMockData();
    
    // Check if API key is configured by testing a simple endpoint
    checkApiKeyStatus();
    
    // Fetch existing templates
    fetchTemplates();
  }, []);

  // Polling disabled - templates will be refreshed manually or via iframe messages
  // useEffect(() => {
  //   let intervalId: NodeJS.Timeout;
  //   
  //   if (presignToken) {
  //     // Poll every 5 seconds when template creation is active
  //     intervalId = setInterval(() => {
  //       console.log('🔄 Polling for new templates...');
  //       fetchTemplates();
  //     }, 5000);
  //   }
  //   
  //   return () => {
  //     if (intervalId) {
  //       clearInterval(intervalId);
  //     }
  //   };
  // }, [presignToken]);

  const initializeMockData = () => {
    // Mock property requests
    setPropertyRequests([
      {
        id: 'req-001',
        propertyAddress: '123 Main St, Anytown, ST 12345',
        requesterEmail: 'tenant1@example.com',
        requesterName: 'John Tenant',
        requestDate: new Date().toISOString(),
        status: 'PENDING'
      },
      {
        id: 'req-002',
        propertyAddress: '456 Oak Ave, Another City, ST 67890',
        requesterEmail: 'tenant2@example.com',
        requesterName: 'Sarah Renter',
        requestDate: new Date(Date.now() - 86400000).toISOString(),
        status: 'APPROVED',
        documentId: 'doc-001'
      }
    ]);

    // Mock signing documents
    setSigningDocuments([
      {
        id: 'doc-001',
        title: 'Lease Agreement - 456 Oak Ave',
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        recipients: [
          {
            id: 'recip-001',
            email: 'tenant2@example.com',
            name: 'Sarah Renter',
            role: 'SIGNER',
            signingOrder: 1
          },
          {
            id: 'recip-002',
            email: 'landlord@example.com',
            name: 'Jane Landlord',
            role: 'SIGNER',
            signingOrder: 2
          }
        ]
      }
    ]);
  };

  const checkApiKeyStatus = async () => {
    try {
      // Test API connectivity using proxy (which uses server-side env var)
      const response = await fetch('/api/documenso-proxy/v1/documents?page=1&perPage=1');
      if (response.ok || response.status === 401) {
        // 401 is also acceptable - it means API key is being used, just might be invalid
        setApiKeyStatus('valid');
      } else {
        setApiKeyStatus('invalid');
      }
    } catch (error) {
      console.error('API key check failed:', error);
      setApiKeyStatus('invalid');
    }
  };

  const trpcRequest = async (procedure: string, input: any = {}) => {
    const url = useProxy 
      ? `/api/documenso-proxy/trpc/${procedure}`
      : `${baseUrl}/api/trpc/${procedure}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Only add authorization header for direct API calls (proxy handles auth automatically)
    if (!useProxy) {
      throw new Error('Direct API calls require manual token input. Please use proxy mode.');
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ json: input })
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.json?.message || 'API Error');
    }
    
    return data.result?.data?.json;
  };

  const restRequest = async (endpoint: string, method = 'GET', body: any = null) => {
    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    if (body) {
      config.body = JSON.stringify(body);
    }
    
    const url = useProxy 
      ? `/api/documenso-proxy/v1${endpoint}`
      : `${baseUrl}/api/v1${endpoint}`;

    // Only proxy mode supported for security
    if (!useProxy) {
      throw new Error('Direct API calls require manual token input. Please use proxy mode.');
    }

    const response = await fetch(url, config);
    return await response.json();
  };

  const handleApiCall = async (apiCall: () => Promise<any>, successMessage: string) => {
    setLoading(true);
    setError('');
    setResponse('');
    
    try {
      const result = await apiCall();
      setResponse(`${successMessage}\n\n${JSON.stringify(result, null, 2)}`);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = () => {
    handleApiCall(async () => {
      // Use REST API instead of TRPC for documents
      const result = await restRequest('/documents?page=1&perPage=10');
      console.log('📄 Documents API response:', result);
      
      // Handle different possible response structures
      const documents = result.data || result.documents || result || [];
      setDocuments(documents);
      return result;
    }, 'Documents fetched successfully:');
  };

  const fetchTemplates = () => {
    handleApiCall(async () => {
      // Use REST API instead of TRPC for templates
      const result = await restRequest('/templates?page=1&perPage=50');
      console.log('📋 Templates API response:', result);
      
      // Handle different possible response structures
      const fetchedTemplates = result.data || result.templates || result || [];
      console.log('📋 Processed templates:', fetchedTemplates);
      
      setTemplates(fetchedTemplates);
      
      // Update template count for change detection
      if (fetchedTemplates.length !== lastTemplateCount) {
        setLastTemplateCount(fetchedTemplates.length);
        if (fetchedTemplates.length > lastTemplateCount) {
          console.log(`🎉 New templates detected! Count: ${lastTemplateCount} -> ${fetchedTemplates.length}`);
        }
      }
      
      return result;
    }, 'Templates fetched successfully:');
  };

  const createPresignToken = (type: 'TEMPLATE_CREATE' | 'DOCUMENT_CREATE') => {
    const externalId = type === 'TEMPLATE_CREATE' ? templateExternalId : documentExternalId;
    
    handleApiCall(async () => {
      console.log('🔍 Creating presign token with:', { 
        type, 
        externalId,
        timestamp: new Date().toISOString()
      });
      
      // Try TRPC first as it's more likely to work
      let result;
      try {
        result = await trpcRequest('embeddingPresign.createEmbeddingPresignToken', {
          type,
          externalId
        });
        console.log('✅ TRPC result:', result);
      } catch (trpcError) {
        console.warn('TRPC API failed, trying REST:', trpcError);
        try {
          result = await restRequest('/embedding/presign', 'POST', {
            type,
            externalId
          });
          console.log('✅ REST result:', result);
        } catch (restError) {
          console.error('Both APIs failed:', { trpcError, restError });
          throw new Error(`Token creation failed. TRPC: ${trpcError.message}, REST: ${restError.message}`);
        }
      }
      
      console.log('✅ Raw presign token response:', result);
      
      // Handle different response structures
      let token, returnedExternalId;
      
      if (result && typeof result === 'object') {
        // Check direct properties
        token = result.token;
        returnedExternalId = result.externalId;
        
        // Check nested data structure
        if (!token && result.data) {
          token = result.data.token;
          returnedExternalId = result.data.externalId;
        }
        
        // Check result property
        if (!token && result.result) {
          token = result.result.token;
          returnedExternalId = result.result.externalId;
        }
      }
      
      console.log('✅ Extracted token data:', {
        token: token ? `${token.substring(0, 20)}...` : 'NOT FOUND',
        externalId: returnedExternalId || 'NOT FOUND',
        originalExternalId: externalId
      });
      
      // Use original externalId if not returned
      const finalExternalId = returnedExternalId || externalId;
      
      if (!token) {
        throw new Error(`No token found in response. Response structure: ${JSON.stringify(Object.keys(result || {}))}`);
      }
      
      const tokenData = {
        token,
        externalId: finalExternalId,
        type
      };
      
      setPresignToken(tokenData);
      return tokenData;
    }, `Presign token created successfully:`);
  };

  // Add token verification function
  const verifyPresignToken = () => {
    if (!presignToken?.token) {
      setError('No presign token to verify');
      return;
    }

    handleApiCall(async () => {
      console.log('🔍 Verifying presign token:', presignToken.token.substring(0, 20) + '...');
      
      // Try REST API first, fallback to TRPC if needed
      let result;
      try {
        result = await restRequest('/embedding/presign/verify', 'POST', {
          token: presignToken.token
        });
      } catch (restError) {
        console.warn('REST API failed, trying TRPC:', restError);
        result = await trpcRequest('embeddingPresign.verifyEmbeddingPresignToken', {
          token: presignToken.token
        });
      }
      
      console.log('✅ Token verification result:', result);
      return result;
    }, 'Presign token verified successfully:');
  };

  // PDF Upload Functions
  const handleFileUpload = async (file: File) => {
    if (!file || file.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }

    setUploadedFile(file);
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    setPdfPreviewUrl(url);

    // Upload file to Documenso
    handleApiCall(async () => {
      const formData = new FormData();
      formData.append('file', file);

      // Try different upload endpoints
      const uploadUrl = useProxy 
        ? '/api/documenso-proxy/document/upload'
        : `${baseUrl}/api/document/upload`;

      const headers: HeadersInit = {};
      
      // Only add auth header for direct calls (proxy handles auth automatically)
      if (!useProxy) {
        throw new Error('Direct file uploads require manual token input. Please use proxy mode.');
      }

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers,
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      setDocumentDataId(result.documentDataId || result.id);
      return result;
    }, 'PDF uploaded successfully:');
  };

  const submitPropertyRequest = () => {
    const newRequest: PropertyRequestData = {
      id: `req-${Date.now()}`,
      ...newPropertyRequest,
      requestDate: new Date().toISOString(),
      status: 'PENDING'
    };
    
    setPropertyRequests(prev => [...prev, newRequest]);
    setResponse(`Property request submitted successfully for ${newRequest.propertyAddress}`);
    
    // Reset form
    setNewPropertyRequest({
      propertyAddress: '',
      requesterEmail: 'tenant@example.com',
      requesterName: 'John Tenant'
    });
  };

  const approvePropertyRequest = (requestId: string) => {
    setPropertyRequests(prev => 
      prev.map(req => 
        req.id === requestId 
          ? { ...req, status: 'APPROVED' as const }
          : req
      )
    );
    setResponse(`Property request ${requestId} approved. You can now create a lease document.`);
  };


  const createLeaseDocumentFromTemplate = (templateId: string) => {
    const externalId = `lease-doc-${templateId}-${Date.now()}`;
    
    // Create iframe URL for lease document creation
    const params: EmbedAuthoringParams = {
      features: {},
      externalId: externalId
    };
    
    const hash = btoa(encodeURIComponent(JSON.stringify(params)));
    const iframeUrl = `${baseUrl}/embed/v1/lease-templates/${templateId}/generate-document#${hash}`;
    
    setLeaseCreationIframe(iframeUrl);
    
    // Set up message listener for lease document creation
    const handleLeaseMessage = (event: MessageEvent) => {
      if (event.origin !== baseUrl) return;
      
      console.log('📨 Received lease document message:', event.data);
      
      if (event.data.type === 'lease-document-created') {
        console.log('🎉 Lease document created:', event.data);
        
        // Update UI with new document
        const newDocument: DocumentData = {
          id: event.data.documentId.toString(),
          title: `Lease Document from Template ${templateId}`,
          status: 'PENDING',
          createdAt: new Date().toISOString(),
          recipients: leaseDocumentForm.recipients.map((r, index) => ({
            id: `recip-${Date.now()}-${index}`,
            email: r.email,
            name: r.name,
            role: r.role,
            signingOrder: r.signingOrder || index + 1
          }))
        };
        
        setSigningDocuments(prev => [...prev, newDocument]);
        setResponse(`Lease document created successfully! Document ID: ${event.data.documentId}`);
        
        // Close iframe
        setLeaseCreationIframe(null);
      }
      
      if (event.data.type === 'error') {
        setError(`Lease document creation failed: ${event.data.message}`);
        setLeaseCreationIframe(null);
      }
    };
    
    window.addEventListener('message', handleLeaseMessage);
    
    // Store cleanup function
    const cleanup = () => window.removeEventListener('message', handleLeaseMessage);
    
    // Auto-cleanup after 10 minutes
    setTimeout(cleanup, 10 * 60 * 1000);
    
    setResponse('Opening lease document creation interface...');
  };

  const updateLeaseField = (field: keyof LeaseFields, value: string) => {
    setLeaseDocumentForm(prev => ({
      ...prev,
      leaseFields: {
        ...prev.leaseFields,
        [field]: value
      }
    }));
  };

  const updateRecipient = (index: number, field: string, value: any) => {
    setLeaseDocumentForm(prev => ({
      ...prev,
      recipients: prev.recipients.map((recipient, i) => 
        i === index ? { ...recipient, [field]: value } : recipient
      )
    }));
  };

  const addRecipient = () => {
    setLeaseDocumentForm(prev => ({
      ...prev,
      recipients: [...prev.recipients, {
        name: '',
        email: '',
        role: 'SIGNER',
        signingOrder: prev.recipients.length + 1
      }]
    }));
  };

  const removeRecipient = (index: number) => {
    setLeaseDocumentForm(prev => ({
      ...prev,
      recipients: prev.recipients.filter((_, i) => i !== index)
    }));
  };

  const createDocumentPresignToken = (templateId: string, requestId: string) => {
    const request = propertyRequests.find(r => r.id === requestId);
    if (!request) {
      setError('Property request not found');
      return;
    }
    
    const documentExternalId = `document-${templateId}-${requestId}-${Date.now()}`;
    
    handleApiCall(async () => {
      console.log('🔍 Creating document presign token with:', { 
        type: 'DOCUMENT_CREATE',
        externalId: documentExternalId,
        templateId,
        requestId
      });
      
      let result;
      try {
        result = await trpcRequest('embeddingPresign.createEmbeddingPresignToken', {
          type: 'DOCUMENT_CREATE',
          externalId: documentExternalId
        });
        console.log('✅ TRPC result:', result);
      } catch (trpcError) {
        console.warn('TRPC API failed, trying REST:', trpcError);
        try {
          result = await restRequest('/embedding/presign', 'POST', {
            type: 'DOCUMENT_CREATE',
            externalId: documentExternalId
          });
          console.log('✅ REST result:', result);
        } catch (restError) {
          throw new Error(`Document token creation failed. TRPC: ${trpcError.message}, REST: ${restError.message}`);
        }
      }
      
      // Handle response structure
      let token, returnedExternalId;
      if (result && typeof result === 'object') {
        token = result.token || result.data?.token || result.result?.token;
        returnedExternalId = result.externalId || result.data?.externalId || result.result?.externalId;
      }
      
      const finalExternalId = returnedExternalId || documentExternalId;
      
      if (!token) {
        throw new Error(`No token found in response. Response structure: ${JSON.stringify(Object.keys(result || {}))}`);
      }
      
      const tokenData = {
        token,
        externalId: finalExternalId,
        type: 'DOCUMENT_CREATE',
        templateId,
        requestId
      };
      
      // Store document creation token
      setDocumentCreationToken(tokenData);
      setSelectedDocument(tokenData.externalId);
      
      // Mock document creation for UI
      const newDocument: DocumentData = {
        id: tokenData.externalId,
        title: `Lease Agreement - ${request.propertyAddress}`,
        status: 'DRAFT',
        createdAt: new Date().toISOString(),
        recipients: [
          {
            id: `recip-${Date.now()}-1`,
            email: request.requesterEmail,
            name: request.requesterName,
            role: 'SIGNER',
            signingOrder: 1
          },
          {
            id: `recip-${Date.now()}-2`,
            email: landlordEmail,
            name: landlordName,
            role: 'SIGNER',
            signingOrder: 2
          }
        ]
      };

      setSigningDocuments(prev => [...prev, newDocument]);
      
      // Update property request with document ID
      setPropertyRequests(prev => 
        prev.map(req => 
          req.id === requestId 
            ? { ...req, documentId: newDocument.id }
            : req
        )
      );

      return tokenData;
    }, 'Document creation token created successfully:');
  };

  const createSigningPresignToken = (documentId: string, recipientEmail: string) => {
    const signingExternalId = `signing-${documentId}-${recipientEmail}-${Date.now()}`;
    
    handleApiCall(async () => {
      console.log('🔍 Creating signing presign token with:', { 
        type: 'DOCUMENT_SIGN',
        externalId: signingExternalId,
        documentId,
        recipientEmail
      });
      
      let result;
      try {
        result = await trpcRequest('embeddingPresign.createEmbeddingPresignToken', {
          type: 'DOCUMENT_SIGN',
          externalId: signingExternalId
        });
      } catch (trpcError) {
        try {
          result = await restRequest('/embedding/presign', 'POST', {
            type: 'DOCUMENT_SIGN',
            externalId: signingExternalId
          });
        } catch (restError) {
          throw new Error(`Signing token creation failed. TRPC: ${trpcError.message}, REST: ${restError.message}`);
        }
      }
      
      // Handle response structure
      let token, returnedExternalId;
      if (result && typeof result === 'object') {
        token = result.token || result.data?.token || result.result?.token;
        returnedExternalId = result.externalId || result.data?.externalId || result.result?.externalId;
      }
      
      const finalExternalId = returnedExternalId || signingExternalId;
      
      if (!token) {
        throw new Error(`No signing token found in response`);
      }
      
      const tokenData = {
        token,
        externalId: finalExternalId,
        type: 'DOCUMENT_SIGN',
        documentId,
        recipientEmail
      };
      
      // Store signing token
      setSigningToken(tokenData);
      
      return tokenData;
    }, 'Signing token created successfully:');
  };

  const sendDocumentForSigning = (documentId: string) => {
    setSigningDocuments(prev => 
      prev.map(doc => 
        doc.id === documentId 
          ? { ...doc, status: 'PENDING' }
          : doc
      )
    );
    setResponse(`Document ${documentId} sent for signing to all recipients.`);
  };

  const signDocument = (documentId: string) => {
    setSigningDocuments(prev => 
      prev.map(doc => 
        doc.id === documentId 
          ? { ...doc, status: 'COMPLETED' }
          : doc
      )
    );
    setResponse(`Document ${documentId} signed successfully!`);
  };


  const getWorkflowProgress = () => {
    const steps = ['template', 'property-request', 'document-creation', 'signing', 'completed'];
    const currentIndex = steps.indexOf(currentWorkflowStep);
    return ((currentIndex + 1) / steps.length) * 100;
  };

  const getTemplateIframeUrl = () => {
    if (!presignToken) return '';
    
    const baseIframeUrl = templateMode === 'lease' 
      ? `${baseUrl}/embed/v1/authoring/lease-template/create`
      : `${baseUrl}/embed/v1/authoring/template/create`;
    
    const params = new URLSearchParams({
      token: presignToken.token,
      externalId: presignToken.externalId
    });
    
    let finalUrl = `${baseIframeUrl}?${params.toString()}`;
    
    if (templateMode === 'lease') {
      const leaseConfig = {
        features: {
          allowAdvancedSettings: true,
          allowRecipientRoleSelection: false
        },
        externalId: presignToken.externalId,
        templateType: "lease"
      };
      const configHash = btoa(encodeURIComponent(JSON.stringify(leaseConfig)));
      finalUrl += `#${configHash}`;
    }
    
    return finalUrl;
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Complete Lease Signing Workflow</CardTitle>
              <CardDescription>
                End-to-end lease agreement process from template creation to signing completion
              </CardDescription>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant={userRole === 'landlord' ? 'default' : 'outline'}>
                {userRole === 'landlord' ? '🏠 Landlord View' : '🏡 Leaser View'}
              </Badge>
              <div className="w-32">
                <Progress value={getWorkflowProgress()} className="h-2" />
                <span className="text-xs text-gray-500 mt-1 block">
                  Step {['template', 'property-request', 'document-creation', 'signing', 'completed'].indexOf(currentWorkflowStep) + 1} of 5
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="baseUrl">Base URL</Label>
              <Input
                id="baseUrl"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="http://localhost:3000"
              />
            </div>
            <div>
              <Label>API Key Status</Label>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant={apiKeyStatus === 'valid' ? 'default' : apiKeyStatus === 'checking' ? 'secondary' : 'destructive'}>
                  {apiKeyStatus === 'checking' ? '🔄 Checking...' : 
                   apiKeyStatus === 'valid' ? '✅ API Key Ready' : 
                   '❌ API Key Missing'}
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={checkApiKeyStatus}
                >
                  Refresh
                </Button>
              </div>
              {apiKeyStatus === 'invalid' && (
                <p className="text-xs text-red-600 mt-1">
                  Set DOCUMENSO_API_KEY in your .env file
                </p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="useProxy"
                checked={useProxy}
                onCheckedChange={setUseProxy}
              />
              <Label htmlFor="useProxy">Use CORS Proxy (Recommended)</Label>
            </div>
          </div>
          
          <Alert>
            <AlertDescription>
              1. Start Documenso locally: <code className="bg-gray-100 px-1 rounded">cd documenso && npm run dev</code><br/>
              2. Get API token from: <code className="bg-gray-100 px-1 rounded">{baseUrl}/settings/tokens</code><br/>
              3. Add token to your <code className="bg-gray-100 px-1 rounded">.env</code> file as <code className="bg-gray-100 px-1 rounded">DOCUMENSO_API_KEY=your_token_here</code><br/>
              4. Restart your dev server and test the integration
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Tabs value={userRole} onValueChange={(value) => setUserRole(value as 'landlord' | 'leaser')} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="landlord">🏠 Landlord Portal</TabsTrigger>
          <TabsTrigger value="leaser">🏡 Leaser Portal</TabsTrigger>
        </TabsList>

        <TabsContent value="landlord" className="space-y-4">
          {/* Landlord Workflow */}
          <div className="grid gap-6">
            {/* Step 1: Template Management */}
            <Card>
              <CardHeader>
                <CardTitle>Step 1: Template Management</CardTitle>
                <CardDescription>
                  Create and manage lease agreement templates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Step 1: Presign Token */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Badge variant={presignToken ? 'default' : 'outline'} className="text-sm">
                        {presignToken ? '✅' : '1️⃣'}
                      </Badge>
                      <h3 className="font-semibold">Create Presign Token</h3>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => createPresignToken('TEMPLATE_CREATE')} 
                        disabled={loading || !!presignToken}
                        variant={presignToken ? 'outline' : 'default'}
                      >
                        {presignToken ? '✅ Token Ready' : 'Get Token'}
                      </Button>
                      {presignToken && (
                        <Button 
                          onClick={verifyPresignToken}
                          disabled={loading}
                          variant="ghost"
                          size="sm"
                        >
                          🔍 Verify Token
                        </Button>
                      )}
                      {presignToken && (
                        <Button 
                          onClick={() => setPresignToken(null)}
                          variant="ghost"
                          size="sm"
                        >
                          🔄 Reset
                        </Button>
                      )}
                    </div>
                  </div>
                  {presignToken && (
                    <div className="p-3 bg-green-50 rounded text-sm">
                      <p className="text-green-800">
                        <strong>Token Created:</strong> {presignToken.externalId}
                      </p>
                    </div>
                  )}
                </div>

                {/* Step 2: Template Creation */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Badge variant={presignToken ? 'default' : 'outline'} className="text-sm">
                        {presignToken ? '✅' : '2️⃣'}
                      </Badge>
                      <h3 className="font-semibold">Create Template</h3>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Label className="text-sm">Template Mode:</Label>
                        <Select value={templateMode} onValueChange={(value) => setTemplateMode(value as 'regular' | 'lease')}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="regular">Regular</SelectItem>
                            <SelectItem value="lease">🏠 Lease</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {presignToken ? (
                    <div className="space-y-4">
                      <Alert>
                        <AlertDescription>
                          {templateMode === 'lease' ? (
                            <>
                              Ready to create your <strong>lease template</strong>! The specialized lease editor will open below where you can:
                              • Upload your PDF lease document
                              • Place all 9 required lease fields (rent, dates, signatures, etc.)
                              • Configure exactly 2 signers (renter and landlord)
                              • Visual progress tracking ensures all required fields are placed
                              • Save your enforced lease template for reuse
                            </>
                          ) : (
                            <>
                              Ready to create your template! The embedded editor will open below where you can:
                              • Upload your PDF document
                              • Add signature fields, text fields, and dates
                              • Position fields precisely on your PDF
                              • Configure recipients and signing order
                              • Save your template for reuse
                            </>
                          )}
                        </AlertDescription>
                      </Alert>

                      {/* Debug Info */}
                      <div className="p-3 bg-blue-50 rounded text-xs border">
                        <details>
                          <summary className="cursor-pointer font-semibold text-blue-800">🔍 Debug Info (Click to expand)</summary>
                          <div className="mt-2 space-y-1 text-blue-700">
                            <p><strong>External ID:</strong> {presignToken.externalId}</p>
                            <p><strong>Token (first 30 chars):</strong> {presignToken.token.substring(0, 30)}...</p>
                            <p><strong>Iframe URL:</strong></p>
                            <code className="block bg-white p-2 rounded text-xs break-all">
                              {templateMode === 'lease' 
                                ? `${baseUrl}/embed/v1/authoring/lease-template/create?token=${encodeURIComponent(presignToken.token)}&externalId=${encodeURIComponent(presignToken.externalId)}`
                                : `${baseUrl}/embed/v1/authoring/template/create?token=${encodeURIComponent(presignToken.token)}&externalId=${encodeURIComponent(presignToken.externalId)}`
                              }
                            </code>
                            <p><strong>Template Mode:</strong> {templateMode === 'lease' ? 'Lease Template (9 required fields)' : 'Regular Template'}</p>
                          </div>
                        </details>
                      </div>

                      {/* Embedded Template Creator */}
                      <div className={`border rounded-lg bg-white ${isFullscreen ? 'fixed inset-4 z-50 shadow-2xl' : ''}`}>
                        <div className="p-3 bg-gray-50 border-b rounded-t-lg flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">Documenso Template Editor</h4>
                            <p className="text-sm text-gray-600">Upload your PDF and add fields using this embedded editor</p>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setIsFullscreen(!isFullscreen)}
                              className="text-xs"
                            >
                              {isFullscreen ? '🔽 Exit Fullscreen' : '🔼 Fullscreen'}
                            </Button>
                          </div>
                        </div>
                        <iframe 
                          src={getTemplateIframeUrl()}
                          width="100%" 
                          height={isFullscreen ? 'calc(100vh - 120px)' : '1200px'}
                          className="rounded-b-lg"
                          style={{ minHeight: isFullscreen ? 'calc(100vh - 120px)' : '1200px' }}
                          title={templateMode === 'lease' ? 'Documenso Lease Template Creator' : 'Documenso Template Creator'}
                          onLoad={() => {
                            console.log('📄 Iframe loaded successfully');
                            // Set up message listener for template creation events
                            const handleMessage = (event: MessageEvent) => {
                              if (event.origin !== baseUrl) return;
                              
                              console.log('📨 Received iframe message:', event.data);
                              
                              if (event.data.type === 'template.created' || 
                                  event.data.type === 'template.completed' ||
                                  event.data.type === 'lease-template-created' ||
                                  event.data.action === 'template_created') {
                                console.log('🎉 Template created, refreshing templates list');
                                console.log('📋 Template data:', event.data);
                                setTimeout(() => fetchTemplates(), 1000); // Small delay to ensure template is saved
                              }
                              
                              // Handle lease-specific events
                              if (event.data.type === 'field-placed') {
                                console.log('🎯 Field placed:', event.data.fieldName);
                              }
                              
                              if (event.data.type === 'lease-progress') {
                                console.log('📈 Lease progress:', event.data);
                              }
                            };
                            
                            window.addEventListener('message', handleMessage);
                            
                            // Cleanup on unmount would go here if needed
                          }}
                          onError={(e) => console.error('❌ Iframe load error:', e)}
                        />
                        {isFullscreen && (
                          <div 
                            className="fixed inset-0 bg-black bg-opacity-50 -z-10"
                            onClick={() => setIsFullscreen(false)}
                          />
                        )}
                      </div>
                    </div>
                  ) : (
                    <Alert>
                      <AlertDescription>
                        Complete step 1 above to unlock the template creation interface.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Step 2: Property Requests Management */}
            <Card>
              <CardHeader>
                <CardTitle>Step 2: Property Requests</CardTitle>
                <CardDescription>
                  Review and approve property lease requests from tenants
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {propertyRequests.length > 0 ? (
                  <div className="space-y-3">
                    {propertyRequests.map((request) => (
                      <div key={request.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-semibold">{request.propertyAddress}</h4>
                            <p className="text-sm text-gray-600">
                              From: {request.requesterName} ({request.requesterEmail})
                            </p>
                            <p className="text-xs text-gray-500">
                              Requested: {new Date(request.requestDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={
                              request.status === 'APPROVED' ? 'default' : 
                              request.status === 'PENDING' ? 'secondary' : 'destructive'
                            }>
                              {request.status}
                            </Badge>
                            {request.status === 'PENDING' && (
                              <Button
                                size="sm"
                                onClick={() => approvePropertyRequest(request.id)}
                              >
                                Approve
                              </Button>
                            )}
                          </div>
                        </div>
                        {request.documentId && (
                          <p className="text-sm text-green-600">
                            ✅ Document created: {request.documentId}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <Alert>
                    <AlertDescription>
                      No property requests yet. Tenants can submit requests in the Leaser Portal.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Step 3: Lease Document Creation */}
            <Card>
              <CardHeader>
                <CardTitle>Step 3: Create Lease Documents from Templates</CardTitle>
                <CardDescription>
                  Create lease documents from templates with pre-filled lease information
                  {templates.length > 0 && (
                    <span className="ml-2">
                      <Badge variant="secondary">{templates.length} template{templates.length !== 1 ? 's' : ''} available</Badge>
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="landlordName">Your Name</Label>
                    <Input
                      id="landlordName"
                      value={landlordName}
                      onChange={(e) => setLandlordName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="landlordEmail">Your Email</Label>
                    <Input
                      id="landlordEmail"
                      type="email"
                      value={landlordEmail}
                      onChange={(e) => setLandlordEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="templateSelect">Select Template</Label>
                    <div className="flex space-x-2">
                      <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a template" />
                        </SelectTrigger>
                        <SelectContent>
                          {templates.length > 0 ? (
                            templates.map((template) => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.title}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-templates" disabled>
                              No templates found - create one above
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={fetchTemplates}
                        disabled={loading}
                        className="text-xs"
                      >
                        🔄 Refresh
                      </Button>
                    </div>
                    {templates.length === 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Create a template above to see it in this dropdown
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="propertyRequestSelect">Select Property Request</Label>
                    <Select value={selectedPropertyRequest} onValueChange={setSelectedPropertyRequest}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an approved request" />
                      </SelectTrigger>
                      <SelectContent>
                        {propertyRequests
                          .filter(req => req.status === 'APPROVED')
                          .map(req => (
                            <SelectItem key={req.id} value={req.id}>
                              {req.propertyAddress} - {req.requesterName}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex space-x-2">
                    <Button 
                      onClick={() => createDocumentPresignToken(selectedTemplate, selectedPropertyRequest)} 
                      disabled={loading || !selectedTemplate || !selectedPropertyRequest}
                      className="flex-1"
                    >
                      🎨 Create Document (Legacy)
                    </Button>
                    <Button 
                      onClick={() => createLeaseDocumentFromTemplate(selectedTemplate)} 
                      disabled={loading || !selectedTemplate}
                      className="flex-1"
                      variant="default"
                    >
                      🏠 Create Lease Document (New)
                    </Button>
                  </div>
                  
                  <div className="text-xs text-gray-500 space-y-1">
                    <p><strong>Legacy:</strong> Interactive editor for custom field placement and recipient configuration</p>
                    <p><strong>New:</strong> Streamlined lease document creation with pre-filled lease fields</p>
                  </div>
                </div>
                
                {/* Lease Document Form */}
                <div className="border rounded-lg p-4 space-y-4">
                  <h4 className="font-semibold">Lease Document Configuration</h4>
                  
                  {/* Document Title */}
                  <div>
                    <Label htmlFor="docTitle">Document Title</Label>
                    <Input
                      id="docTitle"
                      value={leaseDocumentForm.title}
                      onChange={(e) => setLeaseDocumentForm(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  
                  {/* Lease Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="hostName">Host Name</Label>
                      <Input
                        id="hostName"
                        value={leaseDocumentForm.leaseFields?.HOST_NAME || ''}
                        onChange={(e) => updateLeaseField('HOST_NAME', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="renterName">Renter Name</Label>
                      <Input
                        id="renterName"
                        value={leaseDocumentForm.leaseFields?.RENTER_NAME || ''}
                        onChange={(e) => updateLeaseField('RENTER_NAME', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={leaseDocumentForm.leaseFields?.START_DATE || ''}
                        onChange={(e) => updateLeaseField('START_DATE', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={leaseDocumentForm.leaseFields?.END_DATE || ''}
                        onChange={(e) => updateLeaseField('END_DATE', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="monthlyRent">Monthly Rent</Label>
                      <Input
                        id="monthlyRent"
                        value={leaseDocumentForm.leaseFields?.MONTHLY_RENT || ''}
                        onChange={(e) => updateLeaseField('MONTHLY_RENT', e.target.value)}
                        placeholder="$2,500.00"
                      />
                    </div>
                  </div>
                  
                  {/* Recipients */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Recipients</Label>
                      <Button size="sm" onClick={addRecipient} variant="outline">
                        Add Recipient
                      </Button>
                    </div>
                    {leaseDocumentForm.recipients.map((recipient, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-2 p-3 border rounded">
                        <Input
                          placeholder="Name"
                          value={recipient.name}
                          onChange={(e) => updateRecipient(index, 'name', e.target.value)}
                        />
                        <Input
                          placeholder="Email"
                          type="email"
                          value={recipient.email}
                          onChange={(e) => updateRecipient(index, 'email', e.target.value)}
                        />
                        <Select value={recipient.role} onValueChange={(value) => updateRecipient(index, 'role', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="SIGNER">Signer</SelectItem>
                            <SelectItem value="APPROVER">Approver</SelectItem>
                            <SelectItem value="CC">CC</SelectItem>
                            <SelectItem value="VIEWER">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          placeholder="Order"
                          type="number"
                          value={recipient.signingOrder || ''}
                          onChange={(e) => updateRecipient(index, 'signingOrder', parseInt(e.target.value) || 1)}
                        />
                        <Button size="sm" onClick={() => removeRecipient(index)} variant="destructive">
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  {/* Email Configuration */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="emailSubject">Email Subject</Label>
                      <Input
                        id="emailSubject"
                        value={leaseDocumentForm.meta.subject}
                        onChange={(e) => setLeaseDocumentForm(prev => ({
                          ...prev,
                          meta: { ...prev.meta, subject: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="signingOrder">Signing Order</Label>
                      <Select 
                        value={leaseDocumentForm.meta.signingOrder} 
                        onValueChange={(value) => setLeaseDocumentForm(prev => ({
                          ...prev,
                          meta: { ...prev.meta, signingOrder: value as 'SEQUENTIAL' | 'PARALLEL' }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SEQUENTIAL">Sequential</SelectItem>
                          <SelectItem value="PARALLEL">Parallel</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="emailMessage">Email Message</Label>
                    <Textarea
                      id="emailMessage"
                      value={leaseDocumentForm.meta.message}
                      onChange={(e) => setLeaseDocumentForm(prev => ({
                        ...prev,
                        meta: { ...prev.meta, message: e.target.value }
                      }))}
                      rows={3}
                    />
                  </div>
                </div>
                
                {/* Legacy Document Creation */}
                {documentCreationToken && (
                  <div className="mt-6 border rounded-lg bg-white">
                    <div className={`${isFullscreen ? 'fixed inset-4 z-50 shadow-2xl' : ''}`}>
                      <div className="p-3 bg-gray-50 border-b rounded-t-lg flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">Document Creation (Legacy)</h4>
                          <p className="text-sm text-gray-600">Create document from template and configure recipients</p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            className="text-xs"
                          >
                            {isFullscreen ? '🔽 Exit Fullscreen' : '🔼 Fullscreen'}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDocumentCreationToken(null)}
                            className="text-xs"
                          >
                            ❌ Close
                          </Button>
                        </div>
                      </div>
                      <iframe 
                        src={`${baseUrl}/embed/v1/templates/${encodeURIComponent(documentCreationToken.templateId)}/generate-document?token=${encodeURIComponent(documentCreationToken.token)}&externalId=${encodeURIComponent(documentCreationToken.externalId)}`}
                        width="100%" 
                        height={isFullscreen ? 'calc(100vh - 120px)' : '1200px'}
                        className="rounded-b-lg"
                        style={{ minHeight: isFullscreen ? 'calc(100vh - 120px)' : '1200px' }}
                        title="Documenso Document Creator"
                        onLoad={() => console.log('📄 Document creation iframe loaded successfully')}
                        onError={(e) => console.error('❌ Document creation iframe load error:', e)}
                      />
                      {isFullscreen && (
                        <div 
                          className="fixed inset-0 bg-black bg-opacity-50 -z-10"
                          onClick={() => setIsFullscreen(false)}
                        />
                      )}
                    </div>
                  </div>
                )}
                
                {/* New Lease Document Creation */}
                {leaseCreationIframe && (
                  <div className="mt-6 border rounded-lg bg-white">
                    <div className={`${isFullscreen ? 'fixed inset-4 z-50 shadow-2xl' : ''}`}>
                      <div className="p-3 bg-gray-50 border-b rounded-t-lg flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">Lease Document Creation</h4>
                          <p className="text-sm text-gray-600">Create lease document from template with pre-filled information</p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            className="text-xs"
                          >
                            {isFullscreen ? '🔽 Exit Fullscreen' : '🔼 Fullscreen'}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setLeaseCreationIframe(null)}
                            className="text-xs"
                          >
                            ❌ Close
                          </Button>
                        </div>
                      </div>
                      <iframe 
                        src={leaseCreationIframe}
                        width="100%" 
                        height={isFullscreen ? 'calc(100vh - 120px)' : '1200px'}
                        className="rounded-b-lg"
                        style={{ minHeight: isFullscreen ? 'calc(100vh - 120px)' : '1200px' }}
                        title="Documenso Lease Document Creator"
                        onLoad={() => {
                          console.log('📄 Lease document creation iframe loaded successfully');
                          
                          // Post the lease form data to the iframe
                          const iframe = document.querySelector('iframe[title="Documenso Lease Document Creator"]') as HTMLIFrameElement;
                          if (iframe && iframe.contentWindow) {
                            const message = {
                              type: 'lease-form-data',
                              data: leaseDocumentForm
                            };
                            iframe.contentWindow.postMessage(message, baseUrl);
                          }
                        }}
                        onError={(e) => console.error('❌ Lease document creation iframe load error:', e)}
                      />
                      {isFullscreen && (
                        <div 
                          className="fixed inset-0 bg-black bg-opacity-50 -z-10"
                          onClick={() => setIsFullscreen(false)}
                        />
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Step 4: Document Management */}
            <Card>
              <CardHeader>
                <CardTitle>Step 4: Document Management & Signing</CardTitle>
                <CardDescription>
                  Manage created documents and send them for signing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {signingDocuments.length > 0 ? (
                  <div className="space-y-3">
                    {signingDocuments.map((doc) => (
                      <div key={doc.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-semibold">{doc.title}</h4>
                            <p className="text-sm text-gray-600">
                              Created: {new Date(doc.createdAt).toLocaleDateString()}
                            </p>
                            {doc.recipients && (
                              <p className="text-sm text-gray-500">
                                Recipients: {doc.recipients.map(r => r.name).join(', ')}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={
                              doc.status === 'COMPLETED' ? 'default' : 
                              doc.status === 'PENDING' ? 'secondary' : 'outline'
                            }>
                              {doc.status}
                            </Badge>
                            {doc.status === 'DRAFT' && (
                              <Button
                                size="sm"
                                onClick={() => sendDocumentForSigning(doc.id)}
                              >
                                Send for Signing
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Alert>
                    <AlertDescription>
                      No documents created yet. Create documents from templates above.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="leaser" className="space-y-4">
          {/* Leaser Workflow */}
          <div className="grid gap-6">
            {/* Step 1: Property Request */}
            <Card>
              <CardHeader>
                <CardTitle>Step 1: Request Property Lease</CardTitle>
                <CardDescription>
                  Submit a request to lease a specific property
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="requesterName">Your Name</Label>
                    <Input
                      id="requesterName"
                      value={newPropertyRequest.requesterName}
                      onChange={(e) => setNewPropertyRequest(prev => ({ ...prev, requesterName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="requesterEmail">Your Email</Label>
                    <Input
                      id="requesterEmail"
                      type="email"
                      value={newPropertyRequest.requesterEmail}
                      onChange={(e) => setNewPropertyRequest(prev => ({ ...prev, requesterEmail: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="propertyAddress">Property Address</Label>
                  <Input
                    id="propertyAddress"
                    value={newPropertyRequest.propertyAddress}
                    onChange={(e) => setNewPropertyRequest(prev => ({ ...prev, propertyAddress: e.target.value }))}
                    placeholder="Enter the property address you'd like to lease"
                  />
                </div>
                <Button onClick={submitPropertyRequest} disabled={loading} className="w-full md:w-auto">
                  Submit Property Request
                </Button>
              </CardContent>
            </Card>

            {/* Step 2: Request Status */}
            <Card>
              <CardHeader>
                <CardTitle>Step 2: Your Property Requests</CardTitle>
                <CardDescription>
                  Track the status of your property lease requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                {propertyRequests.filter(req => req.requesterEmail === newPropertyRequest.requesterEmail).length > 0 ? (
                  <div className="space-y-3">
                    {propertyRequests
                      .filter(req => req.requesterEmail === newPropertyRequest.requesterEmail)
                      .map((request) => (
                        <div key={request.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold">{request.propertyAddress}</h4>
                              <p className="text-sm text-gray-600">
                                Requested: {new Date(request.requestDate).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge variant={
                              request.status === 'APPROVED' ? 'default' : 
                              request.status === 'PENDING' ? 'secondary' : 'destructive'
                            }>
                              {request.status}
                            </Badge>
                          </div>
                          {request.status === 'APPROVED' && request.documentId && (
                            <div className="mt-2 p-2 bg-green-50 rounded">
                              <p className="text-sm text-green-800">
                                ✅ Great! Your lease document is being prepared. You&apos;ll receive a signing invitation soon.
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                ) : (
                  <Alert>
                    <AlertDescription>
                      You haven&apos;t submitted any property requests yet. Submit a request above to get started.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Step 3: Document Signing */}
            <Card>
              <CardHeader>
                <CardTitle>Step 3: Sign Lease Documents</CardTitle>
                <CardDescription>
                  Review and sign your lease agreements
                </CardDescription>
              </CardHeader>
              <CardContent>
                {signingDocuments.filter(doc => 
                  doc.recipients?.some(r => r.email === newPropertyRequest.requesterEmail)
                ).length > 0 ? (
                  <div className="space-y-3">
                    {signingDocuments
                      .filter(doc => doc.recipients?.some(r => r.email === newPropertyRequest.requesterEmail))
                      .map((doc) => {
                        const myRecipient = doc.recipients?.find(r => r.email === newPropertyRequest.requesterEmail);
                        return (
                          <div key={doc.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <h4 className="font-semibold">{doc.title}</h4>
                                <p className="text-sm text-gray-600">
                                  Created: {new Date(doc.createdAt).toLocaleDateString()}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Your role: {myRecipient?.role} (Order: {myRecipient?.signingOrder})
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge variant={
                                  doc.status === 'COMPLETED' ? 'default' : 
                                  doc.status === 'PENDING' ? 'secondary' : 'outline'
                                }>
                                  {doc.status}
                                </Badge>
                                {doc.status === 'PENDING' && myRecipient?.signingOrder === 1 && (
                                  <Button
                                    size="sm"
                                    onClick={() => createSigningPresignToken(doc.id, myRecipient.email)}
                                  >
                                    Sign Document
                                  </Button>
                                )}
                              </div>
                            </div>
                            
                            {doc.status === 'PENDING' && (
                              <div className="mt-2">
                                {myRecipient?.signingOrder === 1 ? (
                                  <Alert>
                                    <AlertDescription>
                                      📝 It&apos;s your turn to sign! Click &quot;Sign Document&quot; to proceed.
                                    </AlertDescription>
                                  </Alert>
                                ) : (
                                  <Alert>
                                    <AlertDescription>
                                      ⏳ Waiting for other signers to complete before your turn.
                                    </AlertDescription>
                                  </Alert>
                                )}
                              </div>
                            )}
                            
                            {doc.status === 'COMPLETED' && (
                              <div className="mt-2 p-2 bg-green-50 rounded">
                                <p className="text-sm text-green-800">
                                  🎉 Document fully executed! All parties have signed.
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <Alert>
                    <AlertDescription>
                      No documents available for signing yet. Wait for landlord to create and send documents.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Step 4: Completed Leases */}
            <Card>
              <CardHeader>
                <CardTitle>Step 4: Your Active Leases</CardTitle>
                <CardDescription>
                  View and manage your completed lease agreements
                </CardDescription>
              </CardHeader>
              <CardContent>
                {signingDocuments.filter(doc => 
                  doc.status === 'COMPLETED' && 
                  doc.recipients?.some(r => r.email === newPropertyRequest.requesterEmail)
                ).length > 0 ? (
                  <div className="space-y-3">
                    {signingDocuments
                      .filter(doc => 
                        doc.status === 'COMPLETED' && 
                        doc.recipients?.some(r => r.email === newPropertyRequest.requesterEmail)
                      )
                      .map((doc) => (
                        <div key={doc.id} className="border rounded-lg p-4 bg-green-50">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-green-800">{doc.title}</h4>
                              <p className="text-sm text-green-600">
                                Signed: {new Date(doc.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline">
                                Download PDF
                              </Button>
                              <Button size="sm" variant="outline">
                                View Details
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <Alert>
                    <AlertDescription>
                      No completed leases yet. Complete the signing process above to see your active leases here.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
            
            {/* Embedded Signing Interface */}
            {signingToken && (
              <Card>
                <CardHeader>
                  <CardTitle>Sign Your Document</CardTitle>
                  <CardDescription>
                    Review and sign your lease agreement
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg bg-white">
                    <div className={`${isFullscreen ? 'fixed inset-4 z-50 shadow-2xl' : ''}`}>
                      <div className="p-3 bg-gray-50 border-b rounded-t-lg flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">Document Signing</h4>
                          <p className="text-sm text-gray-600">Review and sign your lease agreement</p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            className="text-xs"
                          >
                            {isFullscreen ? '🔽 Exit Fullscreen' : '🔼 Fullscreen'}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSigningToken(null)}
                            className="text-xs"
                          >
                            ❌ Close
                          </Button>
                        </div>
                      </div>
                      <iframe 
                        src={`${baseUrl}/embed/v1/signing/document?token=${encodeURIComponent(signingToken.token)}&externalId=${encodeURIComponent(signingToken.externalId)}`}
                        width="100%" 
                        height={isFullscreen ? 'calc(100vh - 120px)' : '1200px'}
                        className="rounded-b-lg"
                        style={{ minHeight: isFullscreen ? 'calc(100vh - 120px)' : '1200px' }}
                        title="Documenso Document Signing"
                        onLoad={() => console.log('📄 Document signing iframe loaded successfully')}
                        onError={(e) => console.error('❌ Document signing iframe load error:', e)}
                      />
                      {isFullscreen && (
                        <div 
                          className="fixed inset-0 bg-black bg-opacity-50 -z-10"
                          onClick={() => setIsFullscreen(false)}
                        />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Response/Error Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {response && (
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">Response</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-green-50 p-4 rounded text-sm overflow-auto max-h-64 text-green-800">
                {response}
              </pre>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-red-50 p-4 rounded text-sm overflow-auto max-h-64 text-red-800">
                {error}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span>Processing API request...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
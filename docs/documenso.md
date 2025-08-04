# 🚀 Documenso Embedding Guide

## Overview

This guide covers how to embed Documenso's document creation, template creation, and signing experience directly into your application using the official Documenso embedding SDK and iframe integration.

**Your Documenso Instance:** `https://documenso-matchbook-rentals-production.up.railway.app`

---

## **Three Main Approaches:**

### 1. **Document Creation** (Embedded Authoring)
Users create documents directly in your app.

### 2. **Template Creation** (iframe Embedding)
Users create reusable templates directly in your app.

### 3. **Document Signing** (Two Ways)
- **Direct Template Signing** (Recommended) - Reusable templates
- **Specific Document Signing** - For existing documents

---

## 1. **Document Creation** (Embedded Authoring)

Users create documents directly in your app without leaving your interface.

### Setup:
```bash
npm install @documenso/embed-react
```

### Get Presign Token:
Create presign tokens from your backend using your API key:

```javascript
// Call from your backend with your API key
POST https://documenso-matchbook-rentals-production.up.railway.app/api/v2-beta/embedding/create-presign-token
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

// Response contains:
{
  "token": "presign_token_here",
  "expiresAt": "2024-01-01T12:00:00Z"
}
```

### Embed Component:
```jsx
import { unstable_EmbedCreateDocument as EmbedCreateDocument } from '@documenso/embed-react';

function DocumentCreator() {
  return (
    <div style={{ height: '800px', width: '100%' }}>
      <EmbedCreateDocument
        presignToken="YOUR_PRESIGN_TOKEN"
        externalId="order-12345"
        host="https://documenso-matchbook-rentals-production.up.railway.app"
        onDocumentCreated={(data) => {
          console.log('Document created:', data.documentId);
          console.log('External reference:', data.externalId);
          // Handle success - redirect, save to DB, etc.
        }}
        features={{
          allowConfigureSignatureTypes: true,
          allowConfigureLanguage: true,
          allowConfigureDateFormat: true,
          allowConfigureTimezone: true,
          allowConfigureRedirectUrl: true,
          allowConfigureCommunication: true,
        }}
      />
    </div>
  );
}
```

---

## 2. **Template Creation** (iframe Embedding)

Create reusable templates using Documenso's built-in template authoring interface.

### Setup:

#### Get Presign Token:
```javascript
// Backend endpoint to create presign token
const getPresignToken = async () => {
  const response = await fetch('/api/documenso/presign-token', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${YOUR_API_KEY}` }
  });
  return response.json();
};
```

#### Configure Template Creation:
```javascript
// Template creation configuration
const createTemplateConfig = (presignToken, externalId) => {
  const config = {
    token: presignToken,
    externalId: externalId || `template-${Date.now()}`,
    features: {
      allowConfigureSignatureTypes: true,
      allowConfigureLanguage: true,
      allowConfigureDateFormat: true,
      allowConfigureTimezone: true,
      allowConfigureRedirectUrl: true,
      allowConfigureCommunication: true,
    }
  };
  
  // Encode config for URL hash
  return btoa(encodeURIComponent(JSON.stringify(config)));
};
```

### React Component:
```jsx
import { useState, useEffect } from 'react';

function TemplateCreator({ presignToken, externalId, onTemplateCreated }) {
  const [templateId, setTemplateId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Listen for template creation completion
    const handleMessage = (event) => {
      if (event.origin !== 'https://documenso-matchbook-rentals-production.up.railway.app') {
        return; // Security: only accept messages from your Documenso instance
      }
      
      if (event.data.type === 'template-created') {
        setTemplateId(event.data.templateId);
        setIsLoading(false);
        onTemplateCreated({
          templateId: event.data.templateId,
          externalId: event.data.externalId
        });
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onTemplateCreated]);

  if (templateId) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>✅ Template Created Successfully!</h2>
        <p>Template ID: {templateId}</p>
        <p>External ID: {externalId}</p>
      </div>
    );
  }

  const encodedConfig = createTemplateConfig(presignToken, externalId);
  const iframeUrl = `https://documenso-matchbook-rentals-production.up.railway.app/embed/v1/authoring/template.create#${encodedConfig}`;

  return (
    <iframe 
      src={iframeUrl}
      style={{ 
        width: '100%', 
        height: '800px', 
        border: 'none',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
      }}
      title="Template Creator"
      onLoad={() => setIsLoading(false)}
    />
  );
}
```

### Template Management Flow:
```javascript
// Complete template creation and usage workflow
function TemplateWorkflow() {
  const [step, setStep] = useState('create'); // 'create', 'enable', 'use'
  const [templateData, setTemplateData] = useState(null);
  const [directLinkToken, setDirectLinkToken] = useState(null);

  // Step 1: Create template via iframe
  const handleTemplateCreated = async (data) => {
    setTemplateData(data);
    setStep('enable');
    
    // Step 2: Enable direct link for the template
    await enableDirectLink(data.templateId);
  };

  // Step 2: Enable direct link via API
  const enableDirectLink = async (templateId) => {
    try {
      const response = await fetch(`/api/documenso/templates/${templateId}/direct-link`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${YOUR_API_KEY}` }
      });
      const directLink = await response.json();
      setDirectLinkToken(directLink.token);
      setStep('use');
    } catch (error) {
      console.error('Failed to enable direct link:', error);
    }
  };

  return (
    <div>
      {step === 'create' && (
        <TemplateCreator 
          presignToken={presignToken}
          externalId="rental-agreement-template"
          onTemplateCreated={handleTemplateCreated}
        />
      )}
      
      {step === 'enable' && (
        <div>Setting up template for use...</div>
      )}
      
      {step === 'use' && directLinkToken && (
        <EmbedDirectTemplate 
          token={directLinkToken}
          host="https://documenso-matchbook-rentals-production.up.railway.app"
        />
      )}
    </div>
  );
}
```

---

## 3. **Document Signing**

### A) **Direct Template Signing** (Recommended)
Use templates created above for signing.

#### Embed Template:
```jsx
import { EmbedDirectTemplate } from '@documenso/embed-react';

function TemplateEmbedder() {
  return (
    <div style={{ height: '800px', width: '100%' }}>
      <EmbedDirectTemplate 
        token="YOUR_TEMPLATE_TOKEN_HERE"
        host="https://documenso-matchbook-rentals-production.up.railway.app"
        css={`
          .documenso-embed {
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
        `}
        cssVars={{
          primary: '#0000FF',
          background: '#F5F5F5',
          radius: '8px',
        }}
      />
    </div>
  );
}
```

### B) **Specific Document Signing**
For existing documents with specific recipients.

#### Embed Document:
```jsx
import { EmbedSignDocument } from '@documenso/embed-react';

function DocumentSigner() {
  return (
    <div style={{ height: '800px', width: '100%' }}>
      <EmbedSignDocument 
        token="YOUR_SIGNING_TOKEN_HERE"
        host="https://documenso-matchbook-rentals-production.up.railway.app"
        darkModeDisabled={true}
      />
    </div>
  );
}
```

---

## **Complete React Example**

```jsx
import { useState, useEffect } from 'react';
import { 
  unstable_EmbedCreateDocument as EmbedCreateDocument,
  EmbedDirectTemplate,
  EmbedSignDocument
} from '@documenso/embed-react';

function DocumensoEmbedding() {
  const [mode, setMode] = useState('template'); // 'template', 'create', 'sign'
  const [presignToken, setPresignToken] = useState('');
  const [templateToken, setTemplateToken] = useState('');
  const [documentId, setDocumentId] = useState(null);

  // Get presign token from your backend
  const getPresignToken = async () => {
    try {
      const response = await fetch('/api/documenso/presign-token', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${process.env.DOCUMENSO_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      setPresignToken(data.token);
    } catch (error) {
      console.error('Failed to get presign token:', error);
    }
  };

  useEffect(() => {
    if (mode === 'create' || mode === 'template') {
      getPresignToken();
    }
  }, [mode]);

  const handleTemplateCreated = async (data) => {
    // Enable direct link and get token for immediate use
    const response = await fetch(`/api/documenso/templates/${data.templateId}/direct-link`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.DOCUMENSO_API_KEY}` }
    });
    const directLink = await response.json();
    setTemplateToken(directLink.token);
    setMode('sign');
  };

  if (documentId) {
    return (
      <div>
        <h2>Document Created Successfully!</h2>
        <p>Document ID: {documentId}</p>
        <button onClick={() => {
          setDocumentId(null);
          setMode('create');
        }}>
          Create Another Document
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Mode Selection */}
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => setMode('template')}
          style={{ 
            marginRight: '10px', 
            backgroundColor: mode === 'template' ? '#0000FF' : '#ccc',
            color: mode === 'template' ? 'white' : 'black'
          }}
        >
          Create Template
        </button>
        <button 
          onClick={() => setMode('create')}
          style={{ 
            marginRight: '10px', 
            backgroundColor: mode === 'create' ? '#0000FF' : '#ccc',
            color: mode === 'create' ? 'white' : 'black'
          }}
        >
          Create Document
        </button>
        <button 
          onClick={() => setMode('sign')}
          style={{ 
            backgroundColor: mode === 'sign' ? '#0000FF' : '#ccc',
            color: mode === 'sign' ? 'white' : 'black'
          }}
        >
          Sign Document
        </button>
      </div>

      {/* Embedding Container */}
      <div style={{ height: '800px', width: '100%', border: '1px solid #ddd' }}>
        {mode === 'template' && presignToken && (
          <TemplateCreator
            presignToken={presignToken}
            externalId={`template-${Date.now()}`}
            onTemplateCreated={handleTemplateCreated}
          />
        )}

        {mode === 'create' && presignToken && (
          <EmbedCreateDocument
            presignToken={presignToken}
            externalId={`order-${Date.now()}`}
            host="https://documenso-matchbook-rentals-production.up.railway.app"
            onDocumentCreated={(data) => {
              setDocumentId(data.documentId);
              alert(`Document created with ID: ${data.documentId}`);
            }}
          />
        )}

        {mode === 'sign' && templateToken && (
          <EmbedDirectTemplate 
            token={templateToken}
            host="https://documenso-matchbook-rentals-production.up.railway.app"
          />
        )}

        {((mode === 'create' || mode === 'template') && !presignToken) && (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            Loading presign token...
          </div>
        )}
      </div>
    </div>
  );
}

export default DocumensoEmbedding;
```

---

## **Backend API Integration**

### Create Presign Token Endpoint:
```javascript
// Example Express.js endpoint
app.post('/api/documenso/presign-token', async (req, res) => {
  try {
    const response = await fetch(
      'https://documenso-matchbook-rentals-production.up.railway.app/api/v2-beta/embedding/create-presign-token',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.DOCUMENSO_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create presign token' });
  }
});
```

### Template Direct Link Endpoint:
```javascript
// Enable direct link for template
app.post('/api/documenso/templates/:id/direct-link', async (req, res) => {
  try {
    const response = await fetch(
      `https://documenso-matchbook-rentals-production.up.railway.app/api/v1/templates/${req.params.id}/direct-link`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.DOCUMENSO_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to enable direct link' });
  }
});
```

---

## **Styling and Customization**

### Custom CSS:
```jsx
<EmbedDirectTemplate
  token="YOUR_TOKEN"
  css={`
    .documenso-embed {
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .documenso-embed .button {
      background-color: #0000FF;
    }
  `}
/>
```

### CSS Variables:
```jsx
<EmbedDirectTemplate
  token="YOUR_TOKEN"
  cssVars={{
    primary: '#0000FF',        // Primary color
    background: '#F5F5F5',     // Background color
    radius: '8px',             // Border radius
    fontFamily: 'Arial, sans-serif'
  }}
/>
```

### iframe Styling:
```jsx
<iframe 
  src={templateCreateUrl}
  style={{
    width: '100%',
    height: '800px',
    border: 'none',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
  }}
  title="Template Creator"
/>
```

---

## **Environment Variables**

Set these in your application:

```bash
# Your Documenso API Key (from dashboard)
DOCUMENSO_API_KEY=your_api_key_here

# Your Documenso instance URL
DOCUMENSO_HOST=https://documenso-matchbook-rentals-production.up.railway.app
```

---

## **Framework Support**

Documenso supports multiple frameworks:

| Framework | Package                          | Import                                    |
|-----------|----------------------------------|-------------------------------------------|
| React     | `@documenso/embed-react`         | `import { EmbedDirectTemplate } from '@documenso/embed-react'` |
| Vue       | `@documenso/embed-vue`           | `import { EmbedDirectTemplate } from '@documenso/embed-vue'`   |
| Svelte    | `@documenso/embed-svelte`        | `import { EmbedDirectTemplate } from '@documenso/embed-svelte'` |
| Angular   | `@documenso/embed-angular`       | `import { EmbedDirectTemplate } from '@documenso/embed-angular'` |
| Solid     | `@documenso/embed-solid`         | `import { EmbedDirectTemplate } from '@documenso/embed-solid'`  |
| Preact    | `@documenso/embed-preact`        | `import { EmbedDirectTemplate } from '@documenso/embed-preact'` |

---

## **Security Considerations**

### iframe Security:
- Always validate `event.origin` in postMessage listeners
- Use your specific Documenso instance URL, not wildcards
- Implement proper CORS policies
- Validate all data received from iframe communications

### API Security:
- Store API keys securely on your backend
- Never expose API keys in frontend code
- Implement proper authentication for your backend endpoints
- Use HTTPS for all API communications

---

## **Error Handling**

### Template Creation Errors:
```javascript
const handleMessage = (event) => {
  if (event.data.type === 'template-created') {
    onTemplateCreated(event.data);
  } else if (event.data.type === 'template-error') {
    console.error('Template creation failed:', event.data.error);
    // Handle error appropriately
  }
};
```

### API Error Handling:
```javascript
const createPresignToken = async () => {
  try {
    const response = await fetch('/api/documenso/presign-token', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to create presign token:', error);
    // Handle error - show user feedback, retry logic, etc.
  }
};
```

---

## **Next Steps**

1. **Set up your backend endpoints** for presign token creation
2. **Create your first template** using the iframe approach
3. **Enable direct link** for the template via API
4. **Embed the template** using `EmbedDirectTemplate`
5. **Customize styling** to match your brand
6. **Implement error handling** and user feedback
7. **Test the complete workflow** end-to-end

---

## **Resources**

- **Your Documenso Instance:** https://documenso-matchbook-rentals-production.up.railway.app
- **API Documentation:** https://openapi.documenso.com/reference
- **Official Docs:** https://docs.documenso.com/developers/embedding

---

## **Requirements**

- ✅ Teams Plan (you have this)
- ✅ Valid API key (you have this)  
- ✅ Deployed Documenso instance (Railway deployment working)
- ✅ React/Vue/etc application for embedding

**You're all set to start embedding!** 🎉

---

## **Complete Workflow Summary**

1. **Template Creation**: Use iframe to embed template creation interface
2. **Template Configuration**: Enable direct link via API after creation
3. **Template Usage**: Embed template signing with `EmbedDirectTemplate`
4. **Document Creation**: Use `EmbedCreateDocument` for one-off documents
5. **Document Signing**: Use `EmbedSignDocument` for specific recipient signing

This approach gives you a complete document workflow solution embedded directly in your application!
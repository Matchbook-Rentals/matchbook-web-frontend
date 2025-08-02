# 🚀 Documenso Embedding Guide

## Overview

This guide covers how to embed Documenso's document creation and signing experience directly into your application using the official Documenso embedding SDK.

**Your Documenso Instance:** `https://documenso-matchbook-rentals-production.up.railway.app`

---

## **Two Main Approaches:**

### 1. **Document Creation** (Embedded Authoring)
Users create documents directly in your app.

### 2. **Document Signing** (Two Ways)
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

### Configuration Options:
| Option             | Type    | Description                                                        |
| ------------------ | ------- | ------------------------------------------------------------------ |
| `presignToken`     | string  | **Required**. The authentication token for the embedding session  |
| `externalId`       | string  | Optional reference ID from your system to link with the document  |
| `host`             | string  | Optional custom host URL. Use your Railway deployment URL         |
| `css`              | string  | Optional custom CSS to style the embedded component               |
| `cssVars`          | object  | Optional CSS variables for colors, spacing, and more              |
| `darkModeDisabled` | boolean | Optional flag to disable dark mode                                |
| `className`        | string  | Optional CSS class name for the iframe                            |

---

## 2. **Document Signing**

### A) **Direct Template Signing** (Recommended)
Create reusable templates that generate new documents when signed.

#### Setup Template:
1. **Create template in Documenso dashboard**
2. **Enable "Direct Link"** on template:
   - Go to Templates page
   - Click the actions dropdown on your template
   - Select "Direct Link"
   - Configure which recipient should be the direct link signer
3. **Copy the template URL token**
   - From URL like: `https://documenso-matchbook-rentals-production.up.railway.app/d/-WoSwWVT-fYOERS2MI37k`
   - Token is: `-WoSwWVT-fYOERS2MI37k`

#### Embed Template:
```jsx
import { EmbedDirectTemplate } from '@documenso/embed-react';

function TemplateEmbedder() {
  return (
    <div style={{ height: '800px', width: '100%' }}>
      <EmbedDirectTemplate 
        token="-WoSwWVT-fYOERS2MI37k"
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

#### Get Signing Token:
1. **Create document** (via API or manually in dashboard)
2. **Get recipient signing URL:**
   - Hover over recipient's avatar in document view
   - Click their email to copy signing URL
3. **Extract token** from URL:
   - From: `https://documenso-matchbook-rentals-production.up.railway.app/sign/lm7Tp2_yhvFfzdeJQzYQF`
   - Token is: `lm7Tp2_yhvFfzdeJQzYQF`

#### Embed Document:
```jsx
import { EmbedSignDocument } from '@documenso/embed-react';

function DocumentSigner() {
  return (
    <div style={{ height: '800px', width: '100%' }}>
      <EmbedSignDocument 
        token="lm7Tp2_yhvFfzdeJQzYQF"
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
  const [mode, setMode] = useState('create'); // 'create', 'template', or 'sign'
  const [presignToken, setPresignToken] = useState('');
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
    if (mode === 'create') {
      getPresignToken();
    }
  }, [mode]);

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
          onClick={() => setMode('template')}
          style={{ 
            marginRight: '10px',
            backgroundColor: mode === 'template' ? '#0000FF' : '#ccc',
            color: mode === 'template' ? 'white' : 'black'
          }}
        >
          Sign Template
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

        {mode === 'template' && (
          <EmbedDirectTemplate 
            token="YOUR_TEMPLATE_TOKEN_HERE" // Replace with actual template token
            host="https://documenso-matchbook-rentals-production.up.railway.app"
          />
        )}

        {mode === 'sign' && (
          <EmbedSignDocument 
            token="YOUR_SIGNING_TOKEN_HERE" // Replace with actual signing token
            host="https://documenso-matchbook-rentals-production.up.railway.app"
          />
        )}

        {mode === 'create' && !presignToken && (
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

## **Next Steps**

1. **Create a template** in your Documenso dashboard
2. **Enable Direct Link** on the template
3. **Copy the template token** from the URL
4. **Install the React SDK** and try the template embedding first
5. **Set up presign token endpoint** for document creation
6. **Customize styling** to match your brand

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
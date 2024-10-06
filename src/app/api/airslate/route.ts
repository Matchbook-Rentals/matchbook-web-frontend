
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const bearerObject = await getBearerToken();
    const bearerToken = bearerObject.access_token;
    const orgId = process.env.AIRSLATE_ORG_ID!;
    const templateId = process.env.AIRSLATE_TEMPLATE_ID!;
    const documentId = process.env.AIRSLATE_DOCUMENT_ID!;
    const versionId = process.env.AIRSLATE_VERSION_ID!;
    const body = await request.json();

    const templateInfo = await getDocumentInfo(orgId, templateId, versionId, documentId, bearerToken);
    console.log(templateInfo)

    // Log each value separately with a caption
    return NextResponse.json({ status: 'success', data: bearerToken });
  } catch (error: any) {
    console.error('AirSlate API Error:', error);
    return NextResponse.json({ status: 'fail', error: error.message }, { status: 500 });
  }
}

const getBearerToken = async (): Promise<any> => {
  let JWT = process.env.AIRSLATE_JWT!
  const response = await fetch('https://oauth.airslate.com/public/oauth/token', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: JWT  // Replace '{{oauth.jwt.payload}}' with JWT variable
    })
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

const getOrgList = async (bearerToken: string): Promise<any> => {
  const response = await fetch('https://api.airslate.io/v1/organizations', {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${bearerToken}`
    }
  });

  if (!response.ok) {
    console.log(bearerToken)
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

const createTemplate = async (organizationId: string, bearerToken: string, templateData: any): Promise<any> => {
  const response = await fetch(`https://api.airslate.io/v1/organizations/${organizationId}/templates`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${bearerToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(templateData)
  });

  if (!response.ok) {
    console.log('STARTING');
    const reader = response.body?.getReader();

    // Step 2: Convert the stream data to text
    let result = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      result += new TextDecoder().decode(value);
    }

    // Step 3: Display the text
    console.log('ERROR:', result);
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

const addFileToTemplate = async (organizationId: string, templateId: string, bearerToken: string, fileData: any): Promise<any> => {
  const response = await fetch(`https://api.airslate.io/v1/organizations/${organizationId}/templates/${templateId}/documents`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${bearerToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: fileData.name,
      type: fileData.type,
      is_conditional: fileData.is_conditional,
      content: fileData.content
    })
  });

  if (!response.ok) {
    const message = await response.json();
    console.log(message);
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}
//
const getTemplateById = async (organizationId: string, templateId: string, bearerToken: string): Promise<any> => {
  const response = await fetch(`https://api.airslate.io/v1/organizations/${organizationId}/templates/${templateId}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${bearerToken}`
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

const getDocumentsFromTemplate = async (organizationId: string, templateId: string, bearerToken: string): Promise<any> => {
  const response = await fetch(`https://api.airslate.io/v1/organizations/${organizationId}/templates/${templateId}/documents`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${bearerToken}`
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

const getDocumentInfo = async (
  organizationId: string,
  templateId: string,
  versionId: string,
  documentId: string,
  bearerToken: string
): Promise<any> => {
  const response = await fetch(
    `https://api.airslate.io/v1/organizations/${organizationId}/templates/${templateId}/versions/${versionId}/documents/${documentId}`,
    {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${bearerToken}`
      }
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}


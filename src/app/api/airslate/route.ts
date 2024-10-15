
import { NextResponse } from 'next/server';

//Interfaces
interface BearerTokenResponse {
  access_token: string;
  // Add other properties if needed
}

interface TemplateData {
  // Add properties based on what's expected in createTemplate
  name: string;
  // Add other properties as needed
}

interface FileData {
  name: string;
  type: string;
  is_conditional: boolean;
  content: string;
}

interface StepData {
  name: string;
  document_settings: Array<{
    document_id: string;
    access_option: string;
  }>;
}

interface WorkflowData {
  documents: Array<{
    id: string;
    fields: Array<{
      name: string;
      value: string;
    }>;
  }>;
  invites: Array<{
    step_name: string;
    email?: string;
    phone_number?: string;
  }>;
  share_links: Array<{
    auth_method: string;
    signer_identity: string;
    expire: number;
    step_name: string;
  }>;
  webhooks: Array<{
    event_name: string;
    callback: {
      url: string;
    };
  }>;
}

export async function POST(request: Request) {
  try {
    const bearerObject = await getBearerToken();
    const bearerToken = bearerObject.access_token;
    const orgId = process.env.AIRSLATE_ORG_ID!;
    const templateId = process.env.AIRSLATE_TEMPLATE_ID!;
    const documentId = process.env.AIRSLATE_DOCUMENT_ID!;
    const versionId = process.env.AIRSLATE_VERSION_ID!;
    const body = await request.json();

    let allVersions = await getTemplateVersions(orgId, templateId, bearerToken);
    console.log('VERSIONS', allVersions);

    // Build sample data for the step
    const stepData: StepData = {
      name: "New Step",
      document_settings: [
        {
          document_id: documentId,
          access_option: "fill"
        }
      ]
    };
    let newStep = await addStepToTemplate(orgId, templateId, bearerToken, stepData);
    console.log('New Step Added:', newStep);

    const prefillData: WorkflowData = {
      documents: [{
        id: documentId,
        fields: [{ name: 'hostName', value: 'Melanie Johnston' }]
      }],
      invites: [
        { step_name: 'Recipient 1', email: 'tyler.bennett52@gmail.com' },
        //{ step_name: 'Fill and Sign 2', phone_number: '+17028488141' },
      ],
      //share_links: [],
      webhooks: []
    };
    //const filledDoc = await fillAndStartWorkflow(orgId, templateId, bearerToken, prefillData);

    // Log each value separately with a caption
    return NextResponse.json({ status: 'success', data: bearerToken });
  } catch (error: any) {
    console.error('AirSlate API Error:', error);
    return NextResponse.json({ status: 'fail', error: error.message }, { status: 500 });
  }
}

const getBearerToken = async (): Promise<BearerTokenResponse> => {
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

const getAllTemplates = async (organizationId: string, bearerToken: string): Promise<any> => {
  const response = await fetch(`https://api.airslate.io/v1/organizations/${organizationId}/templates`, {
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

const createTemplate = async (organizationId: string, bearerToken: string, templateData: TemplateData): Promise<any> => {
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

const addFileToTemplate = async (organizationId: string, templateId: string, bearerToken: string, fileData: FileData): Promise<any> => {
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

const getTemplateSteps = async (organizationId: string, templateId: string, versionId: string, bearerToken: string): Promise<any> => {
  const url = `https://api.airslate.io/v1/organizations/${organizationId}/templates/${templateId}/versions/${versionId}/steps`;
  console.log('URL', url);
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${bearerToken}`
    }
  });

  if (!response.ok) {
    const message = await response.json();
    console.log(message)
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

const addStepToTemplate = async (
  organizationId: string,
  templateId: string,
  bearerToken: string,
  stepData: StepData
): Promise<any> => {
  const response = await fetch(
    `https://api.airslate.io/v1/organizations/${organizationId}/templates/${templateId}/steps`,
    {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${bearerToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(stepData)
    }
  );

  if (!response.ok) {
    const message = await response.json();
    console.log(message);
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

const fillAndStartWorkflow = async (
  organizationId: string,
  templateId: string,
  bearerToken: string,
  workflowData: WorkflowData
): Promise<any> => {
  const response = await fetch(
    `https://api.airslate.io/v1/organizations/${organizationId}/templates/${templateId}/flows`,
    {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${bearerToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(workflowData)
    }
  );

  if (!response.ok) {
    const message = await response.json();
    console.log(message);
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};


const getTemplateVersions = async (organizationId: string, templateId: string, bearerToken: string): Promise<any> => {
  const response = await fetch(`https://api.airslate.io/v1/organizations/${organizationId}/templates/${templateId}/versions`, {
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


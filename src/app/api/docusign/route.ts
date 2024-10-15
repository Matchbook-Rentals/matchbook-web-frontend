// Import necessary Next.js types
import { NextResponse } from 'next/server';

// INTERFACES
interface EnvelopeRequestBody {
  customFields?: {
    textCustomFields: TextCustomField[];
  };
  status: string;
  templateId: string;
  templateRoles: TemplateRole[];
}

interface TextCustomField {
  name: string;
  required: string;
  show: string;
  value: string;
}

interface TemplateRole {
  clientUserId?: string;
  email: string;
  name: string;
  roleName: string;
  tabs?: Tabs;
}

interface Tabs {
  checkboxTabs?: CheckboxTab[];
  listTabs?: ListTab[];
  radioGroupTabs?: RadioGroupTab[];
  textTabs?: TextTab[];
}

interface CheckboxTab {
  selected: string;
  tabLabel: string;
}

interface ListTab {
  documentId: string;
  pageNumber: string;
  tabLabel: string;
  value: string;
}

interface RadioGroupTab {
  groupName: string;
  radios: Radio[];
}

interface Radio {
  selected: string;
  value: string;
}

interface TextTab {
  tabLabel: string;
  value: string;
  bold?: string;
  documentId?: string;
  font?: string;
  fontSize?: string;
  height?: string;
  locked?: string;
  pageNumber?: string;
  required?: string;
  tabId?: string;
  width?: string;
  xPosition?: string;
  yPosition?: string;
}

const jwtData = process.env.DOCUSIGN_JWT;
const templateId = '5bae198c-8c5e-476e-9b09-0a72d2207ceb';

export async function GET() {
  if (!jwtData) {
    return NextResponse.json({ error: "DocuSign JWT is not configured" }, { status: 500 });
  }
  const jwt = jwtData;
  const accessToken = await getAccessToken(jwt);
  console.log('access_token, access_token')

  let templateDetails = await getTemplateDetails(accessToken);
  console.log('TEMPLATE DETAILS', templateDetails);

  if (accessToken) {
    return NextResponse.json({ accessToken });
  } else {
    return NextResponse.json({ error: "Failed to get access token" }, { status: 500 });
  }
}

// Fetch implementation for sending envelope
function sendEnvelope(accessToken: string) {
  const accountId = process.env.DOCUSIGN_ACCOUNT_ID;
  const basePath = process.env.DOCUSIGN_BASE_PATH;
  const url = `${basePath}/v2.1/accounts/${accountId}/envelopes`;

  // Fetch implementation to send envelope using requestBody here...
}

// Rewritten to use try/catch
async function getTemplateDetails(accessToken: string) {
  const accountId = process.env.DOCUSIGN_ACCOUNT_ID;
  const basePath = process.env.DOCUSIGN_BASE_URL;
  const url = `${basePath}/v2.1/accounts/${accountId}/templates/${templateId}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json', 
      }
    });

    if (!response.ok) {
      console.error('Error response:', errorBody);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data =  await response.text();
    console.log('DATA', data);
    return response;
  }
  catch (error) {
    console.error('Failed to get template details:', error);
    throw error;
  }
}

// Request body moved and commented out
// const requestBody: EnvelopeRequestBody = {
//   customFields: {
//     textCustomFields: [{
//       name: "app metadata item",
//       required: "false",
//       show: "true",
//       value: "1234567"
//     }]
//   },
//   status: "Sent",
//   templateId: templateId,
//   templateRoles: [{
//     clientUserId: process.env.DOCUSIGN_USER_ID,
//     email: process.env.SIGNER_EMAIL,
//     name: process.env.SIGNER_NAME,
//     roleName: "landlord",
//     tabs: {
//       checkboxTabs: [{
//         selected: "true",
//         tabLabel: "ckAuthorization"
//       }, {
//         selected: "true",
//         tabLabel: "ckAgreement"
//       }],
//       listTabs: [{
//         documentId: "1",
//         pageNumber: "1",
//         tabLabel: "list",
//         value: "green"
//       }],
//       radioGroupTabs: [{
//         groupName: "radio1",
//         radios: [{
//           selected: "true",
//           value: "white"
//         }]
//       }],
//       textTabs: [{
//         tabLabel: "text",
//         value: "Jabberywocky!"
//       }, {
//         bold: "true",
//         documentId: "1",
//         font: "helvetica",
//         fontSize: "size14",
//         height: "23",
//         locked: "false",
//         pageNumber: "1",
//         required: "false",
//         tabId: "name",
//         tabLabel: "added text field",
//         value: process.env.SIGNER_NAME,
//         width: "84",
//         xPosition: "280",
//         yPosition: "172"
//       }]
//     }
//   }, {
//     email: process.env.CC_EMAIL,
//     name: process.env.CC_NAME,
//     roleName: "cc"
//   }]
// };

// Fetch implementation for getting access token
async function getAccessToken(jwt: string): Promise<string | null> {
  const url = process.env.DOCUSIGN_ACCESS_TOKEN_URL;
  if (!url) {
    throw new Error('DOCUSIGN_ACCESS_TOKEN_URL is not defined');
  }

  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion: jwt,
  });

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Error response:', errorBody);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (typeof data.access_token !== 'string') {
      throw new Error('Unexpected response format: access_token is missing or not a string');
    }

    return data.access_token;
  } catch (error) {
    console.error("Failed to get access token:", error);
    return null;
  }
}

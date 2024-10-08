
import { NextRequest, NextResponse } from 'next/server';
const pandaApiKey = process.env.PANDADOC_API_KEY;
const defaultLeaseTemplate = 'tx8zGvArnGLuqGJoeoRd2R';

export async function POST(request: NextRequest) {
  if (!pandaApiKey) {
    return NextResponse.json({ error: 'No APi Key found', status: 500 })
  }
  const body = await request.json();
  console.log(body);

  //const url = 'https://api.pandadoc.com/public/v1/templates';
  //const options = {
  //  method: 'GET',
  //  headers: {
  //    accept: 'application/json',
  //    // Add your PandaDoc API key here
  //    'Authorization': `API-Key ${pandaApiKey}`
  //  }
  //};

  //grab .id
  //let newDocument = await createDocFromTemplate(defaultLeaseTemplate)

  try {
    //const response = await fetch(url, options);
    //const data = await response.json();
    let newDocument = await createDocFromTemplate(defaultLeaseTemplate)
    let isSendable = await isDocSendable(newDocument.id);
    if (!isSendable) {
      return NextResponse.json({ error: 'Document not progressing to docuemnt.draft' }, { status: 500 });
    }
    let documentSendStatus = await sendDocument(newDocument.id);
    let embedSessionData = await createEmbedSession(newDocument.id);

    console.log('FETCH RESPONSE', embedSessionData);
    return NextResponse.json(embedSessionData);
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

// Function to create a document from a template
async function createDocFromTemplate(templateId: string) {
  if (!pandaApiKey) {
    throw new Error('No API Key found');
  }

  const url = 'https://api.pandadoc.com/public/v1/documents';
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'accept': 'application/json',
      'Authorization': `API-Key ${pandaApiKey}`
    },
    body: JSON.stringify({
      name: 'Dev Lease',
      template_uuid: templateId,
      recipients: [
        {
          email: 'tyler.bennett@matchbookrentals.com',
          first_name: 'Tyler',
          last_name: 'Bennett',
          role: 'Landlord',
          signingOrder: 1,
          deliveryMethods: { email: true, sms: false }

        },
        {
          email: 'tyler.bennett2@matchbookrentals.com',
          first_name: 'Tyler',
          last_name: 'Bennett',
          role: 'Tenant',
          signingOrder: 2,
          deliveryMethods: { email: true, sms: false }
        }

      ],
      tokens: [
        { name: 'variableTest', value: 'This came from a variable' },
        { name: 'Landlord.FirstName', value: 'Blue' },
        { name: 'Landlord.LastName', value: 'Green' },
      ],

      fields: {
        monthlyRent: { value: '$9999.00' },
        depositSize: { value: '$999.00' },
        startDate: { value: '11/12/2025' },
        endDate: { value: '12/12/2025' },
      }
    }
    )
  };

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    console.log('Document created:', data);
    return data;
  } catch (error) {
    console.error('Error creating document:', error);
    throw error;
  }
}

// Function to send a document
async function sendDocument(documentId: string) {
  if (!pandaApiKey) {
    throw new Error('No API Key found');
  }

  const url = `https://api.pandadoc.com/public/v1/documents/${documentId}/send`;
  const options = {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'content-type': 'application/json',
      'Authorization': `API-Key ${pandaApiKey}`
    },
    body: JSON.stringify({
      message: 'Please review and sign this document',
      subject: 'Document for signature',
      silent: true,
    })
  };

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    console.log('Document sent:', data);
    return data;
  } catch (error) {
    console.error('Error sending document:', error);
    throw error;
  }
}

async function isDocSendable(documentId: string) {
  if (!pandaApiKey) {
    throw new Error('No API Key found');
  }

  const url = `https://api.pandadoc.com/public/v1/documents/${documentId}`;
  const options = {
    method: 'GET',
    headers: {
      'accept': 'application/json',
      'Authorization': `API-Key ${pandaApiKey}`
    }
  };

  for (let i = 0; i < 5; i++) {
    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for 1 second

    try {
      const response = await fetch(url, options);
      const data = await response.json();
      console.log(data);

      if (data.status === 'document.draft') {
        return true;
      }
    } catch (error) {
      console.error('Error checking document status:', error);
      return false;
    }
  }

  throw new Error('Document status check timed out');
}

async function createEmbedSession(documentId: string) {
  if (!pandaApiKey) {
    throw new Error('No API Key found');
  }

  const url = `https://api.pandadoc.com/public/v1/documents/${documentId}/session`;
  const options = {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `API-Key ${pandaApiKey}`
    },
    body: JSON.stringify({
      expires_in: 3600, // Session expiration time in seconds
      recipient: 'tyler.bennett@matchbookrentals.com', // Replace with the actual recipient email
    })
  };

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    console.log('Embed session created:', data);
    return data;
  } catch (error) {
    console.error('Error creating embed session:', error);
    throw error;
  }
}


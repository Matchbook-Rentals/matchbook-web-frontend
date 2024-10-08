
import { NextPage } from 'next';
import { notFound } from 'next/navigation';
import DocumentEmbed from './document-embed';

export const revalidate = 0;

const StartLeaseFlow: NextPage<{ params: { housingRequestId: string } }> = async ({ params }) => {
  const { housingRequestId } = params;

  try {
    const url = `${process.env.NEXT_PUBLIC_URL}/api/pandadoc/templates`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ housingRequestId }),
    });

    if (!response.ok) {
      const message = await response.json();
      throw new Error('Failed to start lease flow');
    }

    const result = await response.json();

    return (
      <div className='mx auto p-2 w-full'>
        <h1>Lease Flow Started</h1>
        <pre>{JSON.stringify(result, null, 2)}</pre>
        <DocumentEmbed sessionId={result.id} />

      </div>
    );
  } catch (error: any) {
    return (
      <div>
        <h1>Error: {error.message}</h1>
        <h2> {housingRequestId} </h2>
      </div>
    )
  }
};

export default StartLeaseFlow;

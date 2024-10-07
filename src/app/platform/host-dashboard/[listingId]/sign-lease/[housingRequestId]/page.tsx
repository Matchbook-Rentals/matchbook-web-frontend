
import { NextPage } from 'next';
import { notFound } from 'next/navigation';

const StartLeaseFlow: NextPage<{ params: { housingRequestId: string } }> = async ({ params }) => {
  const { housingRequestId } = params;
  console.log('PAGE LOAD');


  try {
    const url = `${process.env.NEXT_PUBLIC_URL}/api/leases/start-flow`
    console.log('URL', url)
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        "cache": "no-store"
      },
      body: JSON.stringify({ housingRequestId }),
    });

    if (!response.ok) {
      const message = await response.json();
      console.log(message)
      throw new Error('Failed to start lease flow');
    }

    const result = await response.json();
    console.log('RESULT', result);

    return (
      <div>
        <h1>Lease Flow Started</h1>
        <pre>{JSON.stringify(result, null, 2)}</pre>
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

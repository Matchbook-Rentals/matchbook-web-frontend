'use client';
import { useEffect, useState } from 'react';
import { useHostProperties } from '@/contexts/host-properties-provider';

const SignLeasePage = ({ params }: { params: { listingId: string } }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currHousingRequest } = useHostProperties();

  useEffect(() => {
    if (!currHousingRequest) {
      setIsLoading(false);
      return;
    }

    const fetchLeaseDocument = async () => {
      try {
        const response = await fetch('/api/leases/start-flow', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ housingRequestId: currHousingRequest.id }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch lease document');
        }

        // Handle the response if needed
        // const data = await response.json();

        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setIsLoading(false);
      }
    };

    fetchLeaseDocument();
  }, [currHousingRequest]);

  if (!currHousingRequest) {
    return <p>Loading Details, try refreshing if stalled. If seen again try revisiting applications tab and clicking approve and sign</p>;
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}, currHousingRequest: {currHousingRequest.id || 'FUCK'}</div>;
  }

  return <div>BoldSign Lease Signing</div>;
};

export default SignLeasePage;
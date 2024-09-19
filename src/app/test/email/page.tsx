'use client';

import { useState } from 'react';

export default function EmailInvitationPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInvite = async () => {
    setStatus(null);
    setError(null);

    try {
      const response = await fetch('/api/emails/invite-to-trip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ outboundEmail: email, tripId: process.env.NEXT_PUBLIC_TEST_TRIP_ID }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus(data.message);
        setEmail(''); // Clear the input field upon success
      } else {
        setError(data.error || 'An unexpected error occurred.');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to send invitation.');
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 p-6 border border-gray-300 rounded-lg text-center font-sans">
      <h1 className="text-2xl font-bold mb-4">Invite to Trip</h1>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Recipient's email"
        className="w-full p-2 mb-4 rounded border border-gray-300 text-base"
      />
      <button
        onClick={handleInvite}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200 text-base"
      >
        Send Invitation
      </button>
      {status && <p className="mt-4 text-green-600">{status}</p>}
      {error && <p className="mt-4 text-red-600">{error}</p>}
    </div>
  );
}

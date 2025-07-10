'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SuccessPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    const redirectTimer = setTimeout(() => {
      router.push('/app/background-check');
    }, 5000);

    return () => {
      clearTimeout(redirectTimer);
      clearInterval(countdownInterval);
    };
  }, [router]);

  return (
    <div className="text-center mt-10">
      <h1 className="text-2xl font-bold">Payment Successful!</h1>
      <p className="mt-4">Thank you for your purchase. Next we will collect your personal information.</p>
      <p className="mt-4 text-gray-600">Redirecting in {countdown} seconds...</p>
    </div>
  );
}

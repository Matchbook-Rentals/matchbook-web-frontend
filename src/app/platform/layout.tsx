
"use client";

import PlatformNavbar from '@/components/platform-components/platformNavbar'
import React, { useEffect, useState } from 'react'
import { useRouter } from "next/navigation";
import { getAgreedToTerms } from "../actions/user";

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function checkTermsAgreement() {
      try {
        const agreedToTerms = await getAgreedToTerms();
        
        if (!agreedToTerms) {
          router.push("/terms");
        } else {
          setTermsAgreed(true);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error checking terms agreement:", error);
        setLoading(false);
      }
    }

    checkTermsAgreement();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!termsAgreed) {
    return null; // Don't render anything while redirecting
  }

  return (
    <>
      <PlatformNavbar />
      <div style={{ fontFamily: 'Poppins' }}>{children}</div>
    </>
  )
}

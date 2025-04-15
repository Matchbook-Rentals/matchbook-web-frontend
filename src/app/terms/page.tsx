"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { agreeToTerms } from "../actions/user";

export default function TermsPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAgree = async () => {
    setLoading(true);
    try {
      await agreeToTerms();
      router.push("/platform/dashboard");
    } catch (error) {
      console.error("Failed to agree to terms:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">Terms and Conditions</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-8 max-h-[60vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">1. Introduction</h2>
        <p className="mb-4">
          Welcome to Matchbook. These Terms and Conditions govern your use of our platform and services.
          By using Matchbook, you agree to these terms in full. If you disagree with any part of these terms,
          you must not use our platform.
        </p>

        <h2 className="text-xl font-semibold mb-4">2. Service Description</h2>
        <p className="mb-4">
          Matchbook provides a platform for property owners to list their properties and for users to find
          suitable housing options. We facilitate connections between property owners and potential tenants
          but are not a party to any agreements between users.
        </p>

        <h2 className="text-xl font-semibold mb-4">3. User Accounts</h2>
        <p className="mb-4">
          To use certain features of the platform, you must register for an account. You agree to provide
          accurate, current, and complete information during the registration process and to update such information
          to keep it accurate, current, and complete.
        </p>

        <h2 className="text-xl font-semibold mb-4">4. User Responsibilities</h2>
        <p className="mb-4">
          You are responsible for all activities that occur under your account. You agree not to share your
          account credentials with any third party. You agree to use the platform in compliance with all
          applicable laws and regulations.
        </p>

        <h2 className="text-xl font-semibold mb-4">5. Privacy Policy</h2>
        <p className="mb-4">
          Your use of Matchbook is also governed by our Privacy Policy, which is incorporated by reference
          into these Terms and Conditions.
        </p>

        <h2 className="text-xl font-semibold mb-4">6. Property Listings</h2>
        <p className="mb-4">
          Property owners are responsible for the accuracy of their listings. Matchbook reserves the right to
          remove any listing that violates these terms or applicable laws.
        </p>

        <h2 className="text-xl font-semibold mb-4">7. Background Checks</h2>
        <p className="mb-4">
          Matchbook may offer background check services for users. These services are provided by third-party
          vendors, and Matchbook makes no guarantees regarding their accuracy or completeness.
        </p>

        <h2 className="text-xl font-semibold mb-4">8. Limitation of Liability</h2>
        <p className="mb-4">
          To the maximum extent permitted by law, Matchbook shall not be liable for any indirect, incidental,
          special, consequential, or punitive damages, or any loss of profits or revenues.
        </p>

        <h2 className="text-xl font-semibold mb-4">9. Changes to Terms</h2>
        <p className="mb-4">
          Matchbook reserves the right to modify these Terms and Conditions at any time. We will provide
          notice of significant changes as appropriate.
        </p>

        <h2 className="text-xl font-semibold mb-4">10. Governing Law</h2>
        <p className="mb-4">
          These Terms and Conditions shall be governed by and construed in accordance with the laws of the
          state of Wisconsin, without regard to its conflict of law provisions.
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <Button 
          onClick={handleAgree} 
          disabled={loading}
          className="w-full sm:w-auto"
        >
          {loading ? "Processing..." : "I Agree to the Terms and Conditions"}
        </Button>
      </div>
    </div>
  );
}
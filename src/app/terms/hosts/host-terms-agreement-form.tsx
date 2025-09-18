'use client'

import { Button } from "@/components/ui/button";
import { useState, useTransition } from "react";
import { agreeToHostTerms } from "../../actions/user";
import { Loader2 } from "lucide-react";

interface HostTermsAgreementFormProps {
  redirectUrl?: string;
}

export function HostTermsAgreementForm({ redirectUrl }: HostTermsAgreementFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    console.log(`[HOST TERMS FORM] ========== STARTING FORM SUBMISSION ==========`);
    console.log(`[HOST TERMS FORM] Redirect URL: ${redirectUrl}`);
    setError(null);
    
    // Set a timeout to detect if the action is hanging
    const timeoutId = setTimeout(() => {
      console.error(`[HOST TERMS FORM] Action timed out after 30 seconds`);
      setError("Request timed out. Please try again.");
    }, 30000);
    
    startTransition(async () => {
      try {
        console.log(`[HOST TERMS FORM] Calling agreeToHostTerms action...`);
        const result = await agreeToHostTerms(formData);
        console.log(`[HOST TERMS FORM] Action completed:`, result);
        clearTimeout(timeoutId);
        
        if (result?.success && result?.redirectUrl) {
          console.log(`[HOST TERMS FORM] ========== SUCCESS! ==========`);
          console.log(`[HOST TERMS FORM] Database updated. Redirecting immediately...`);
          
          // Remove any unnecessary parameters from the redirect URL
          const url = new URL(result.redirectUrl, window.location.origin);
          const cleanRedirectUrl = url.pathname + url.search;
          
          console.log(`[HOST TERMS FORM] ========== EXECUTING REDIRECT ==========`);
          console.log(`[HOST TERMS FORM] Redirecting to: ${cleanRedirectUrl}`);
          window.location.href = cleanRedirectUrl;
        } else {
          console.error(`[HOST TERMS FORM] Invalid result from action:`, result);
          setError("Invalid response from server. Please try again.");
        }
      } catch (err) {
        console.error("[HOST TERMS FORM] ========== ERROR IN FORM SUBMISSION ==========");
        console.error("[HOST TERMS FORM] Error type:", err?.constructor?.name);
        console.error("[HOST TERMS FORM] Error message:", err?.message);
        console.error("[HOST TERMS FORM] Full error:", err);
        clearTimeout(timeoutId);
        setError(`Failed to agree to host terms: ${err?.message || 'Unknown error'}`);
      }
    });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
      <form action={handleSubmit}>
        {redirectUrl && (
          <input type="hidden" name="redirect_url" value={redirectUrl} />
        )}
        <Button 
          type="submit"
          className="w-full sm:w-auto"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Agreeing to Host Terms...
            </>
          ) : (
            "I Agree to the Host Terms and Conditions"
          )}
        </Button>
      </form>
      {error && (
        <div className="text-red-600 text-sm mt-2">
          {error}
        </div>
      )}
    </div>
  );
}
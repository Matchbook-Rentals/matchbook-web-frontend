'use client'

import { Button } from "@/components/ui/button";
import { useState, useTransition } from "react";
import { agreeToTerms } from "../actions/user";
import { Loader2 } from "lucide-react";

interface TermsAgreementFormProps {
  redirectUrl?: string;
}

export function TermsAgreementForm({ redirectUrl }: TermsAgreementFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    console.log(`[TERMS FORM] ========== STARTING FORM SUBMISSION ==========`);
    console.log(`[TERMS FORM] Redirect URL: ${redirectUrl}`);
    setError(null);
    
    // Set a timeout to detect if the action is hanging
    const timeoutId = setTimeout(() => {
      console.error(`[TERMS FORM] Action timed out after 30 seconds`);
      setError("Request timed out. Please try again.");
    }, 30000);
    
    startTransition(async () => {
      try {
        console.log(`[TERMS FORM] Calling agreeToTerms action...`);
        const result = await agreeToTerms(formData);
        console.log(`[TERMS FORM] Action completed:`, result);
        clearTimeout(timeoutId);
        
        if (result?.success && result?.redirectUrl) {
          console.log(`[TERMS FORM] ========== SUCCESS! ==========`);
          console.log(`[TERMS FORM] Database updated. Redirecting immediately...`);
          
          // Remove the redirect URL from the result since we don't need the terms_agreed parameter anymore
          // The middleware will check the database directly
          const url = new URL(result.redirectUrl, window.location.origin);
          url.searchParams.delete('terms_agreed');
          const cleanRedirectUrl = url.pathname + url.search;
          
          console.log(`[TERMS FORM] ========== EXECUTING REDIRECT ==========`);
          console.log(`[TERMS FORM] Redirecting to: ${cleanRedirectUrl}`);
          window.location.href = cleanRedirectUrl;
        } else {
          console.error(`[TERMS FORM] Invalid result from action:`, result);
          setError("Invalid response from server. Please try again.");
        }
      } catch (err) {
        console.error("[TERMS FORM] ========== ERROR IN FORM SUBMISSION ==========");
        console.error("[TERMS FORM] Error type:", err?.constructor?.name);
        console.error("[TERMS FORM] Error message:", err?.message);
        console.error("[TERMS FORM] Full error:", err);
        clearTimeout(timeoutId);
        setError(`Failed to agree to terms: ${err?.message || 'Unknown error'}`);
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
              Agreeing to Terms...
            </>
          ) : (
            "I Agree to the Terms and Conditions"
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
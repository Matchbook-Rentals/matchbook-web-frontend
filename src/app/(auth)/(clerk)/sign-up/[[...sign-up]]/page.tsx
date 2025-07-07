import { SignUp } from "@clerk/nextjs";
import './sign-up.css'

export default function Page() {
  // Redirect to /terms after sign-up.
  // The /terms page should handle the agreement process
  // and then redirecting to the final destination (e.g., /platform/trips).

  return (
    <div className="w-full h-screen bg-white overflow-hidden relative">
      <div className="flex justify-center items-center w-full h-full py-8 relative z-10">
        <SignUp />
      </div>
      
      {/* Background image positioned at bottom */}
      <div className="absolute w-[100vw] h-[65vh] bottom-0 left-0 pointer-events-none">
        <img 
          src="/auth/3.png" 
          alt="Background gradient" 
          className="w-full h-full object-cover object-top"
        />
      </div>
    </div>
  )
}

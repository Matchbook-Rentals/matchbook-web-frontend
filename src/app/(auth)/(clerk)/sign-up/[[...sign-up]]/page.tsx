import { SignUp } from "@clerk/nextjs";
import './sign-up.css'

export default function Page() {
  // Redirect to /terms after sign-up.
  // The /terms page should handle the agreement process
  // and then redirecting to the final destination (e.g., /platform/trips).

  return (
    <div className="auth-container flex flex-col md:flex-row w-full mx-auto">
      <div className="w-full md:w-0 lg:w-1/2 relative z-0">
        <img className="object-cover w-full flex-1 md:h-screen object-bottom block md:hidden" src="/auth/2.png" alt="Matchbook sign up" />
        <img className="object-cover w-full h-56 md:h-screen object-[80%] hidden md:block" src="/vertical-shot-golden-gate-bridge-against-misty-blue-sky-san-francisco-california-usa.jpg" alt="Matchbook sign up" />
      </div>
      <div className="flex justify-center items-center w-full lg:w-1/2 py-8 relative z-10 -mt-6 md:mt-0">
        <SignUp />
      </div>
    </div>
  )
}

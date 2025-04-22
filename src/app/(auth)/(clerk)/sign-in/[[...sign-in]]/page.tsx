import { SignIn } from "@clerk/nextjs";
import './sign-in.css'

export default function Page() {
  // Redirect to /terms after sign-in.
  // The /terms page should handle checking if agreement is needed
  // and then redirecting to the final destination (e.g., /platform/trips).
  const afterSignInUrl = "/terms";

  return (
    <div className="flex flex-col md:flex-row w-full mx-auto max-h-[100vh]">
      <div className="flex justify-center items-center w-full lg:w-1/2 py-8">
        <SignIn afterSignInUrl={afterSignInUrl} />
      </div>
      <div className="hidden md:block w-0 lg:w-1/2">
        <img className="object-cover w-full h-screen" src="/mesmerizing-view-calm-ocean-with-bridge-mountains-background-usa.jpg" alt="Matchbook sign in" />
      </div>
    </div>
  )
}

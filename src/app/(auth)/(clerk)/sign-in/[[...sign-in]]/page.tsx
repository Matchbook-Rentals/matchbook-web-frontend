import { SignIn } from "@clerk/nextjs";
import './sign-in.css'

export default function Page() {
  return (
    <div className="flex flex-col md:flex-row w-full mx-auto max-h-[100vh]">
      <div className="flex justify-center items-center w-full lg:w-1/2 py-8">
        <SignIn />
      </div>
      <div className="hidden md:block w-0 lg:w-1/2">
        <img className="object-cover w-full h-screen" src="/sign-in.png" alt="Matchbook sign in" />
      </div>
    </div>
  )
}

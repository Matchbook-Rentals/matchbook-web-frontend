import { SignIn } from "@clerk/nextjs";
import './sign-in.css'

export default function Page() {

  return (
    <div className="auth-container flex flex-col md:flex-row w-full mx-auto">
      <div className="w-full md:w-0 lg:w-1/2 relative z-0 ">
        <img className="object-cover w-full flex-1 md:h-screen object-bottom block md:hidden" src="/auth/2.png" alt="Matchbook sign in" />
        <img className="object-cover w-full h-56 md:h-screen object-[80%] hidden md:block" src="/auth/1.jpg" alt="Matchbook sign in" />
      </div>
      <div className="flex justify-center items-center w-full lg:w-1/2  relative z-10 md:mt-0">
        <SignIn />
      </div>
    </div>
  )
}

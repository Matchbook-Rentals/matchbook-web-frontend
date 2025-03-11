import { SignIn } from "@clerk/nextjs";
import './sign-in.css'

export default function Page() {
  return (
    <div className="md:grid md:grid-cols-2 md:w-[70%] ">
      <SignIn />
      <div />
    </div>
  )
}

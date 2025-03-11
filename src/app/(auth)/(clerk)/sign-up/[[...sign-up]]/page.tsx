import { SignUp } from "@clerk/nextjs";
import './sign-up.css'

export default function Page() {
  return (
    <div className="sign-up md:grid md:grid-cols-2 md:w-[70%] ">
      <SignUp/>
      <div />
    </div>
  )
}

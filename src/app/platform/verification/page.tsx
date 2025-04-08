import { Button } from "@/components/ui/button"
import { Building, Menu, User } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { PAGE_MARGIN } from "@/constants/styles"

export default function VerificationPage() {
  return (
    <div className={`min-h-screen bg-background ${PAGE_MARGIN} `}>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
          {/* Village Illustration */}
          <div className="relative aspect-square max-w-md mx-auto">
            <Image
              src="/Verification-Village.png"
              alt="Verification Village"
              width={400}
              height={300}
              className="w-full h-auto"
            />
          </div>

          {/* Content */}
          <div className="text-center md:text-left space-y-6">
            <h1 className="text-2xl font-semibold">Get Matchbook Verification <span className="p-1 aspect-square border border-black rounded-full">?</span> </h1>
            <h1 className="text-2xl font-semibold text-blue-400">Set yourself Apart</h1>
            <div className="space-y-2">
              <p className="text-xl">
                One-time fee of only <span className="text-blue-400">$25.00</span>
              </p>
              <p className="text-lg">
                <span className="text-blue-400">One</span> Screening | <span className="text-blue-400">Unlimited</span>{" "}
                Applications
              </p>
              <p className="text-gray-400">Valid for up to 3 Months</p>
            </div>
            <Button variant={'outline'}
              className="inline-block px-8 py-6 flex items-center justify-center text-lg border-2 border-blue-600 text-blue-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-700 rounded-md transition-colors">
              Start Screening
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}

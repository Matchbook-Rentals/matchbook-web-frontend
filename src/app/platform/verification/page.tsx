import { PAGE_MARGIN } from "@/constants/styles"
import Image from "next/image"
import VerificationClient from "./verification-client"

export default function VerificationPage() {
  return (
    <div className={`min-h-screen bg-background ${PAGE_MARGIN} `}>
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <VerificationClient />
      </main>
    </div>
  )
}

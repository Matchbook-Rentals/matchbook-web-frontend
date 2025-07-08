// pages/unauthorized.tsx
import { BrandButton } from "@/components/ui/brandButton";
import Link from "next/link";

export default function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
        <p className="text-gray-600 mb-6">
          Sorry, this feature isn&apos;t available to the public yet. 
          We&apos;re working hard to make it available to everyone soon.
        </p>
        <p className="text-gray-600 mb-6">
          To request access or learn more about our platform, please visit our contact page.
        </p>
        <div className="space-y-4">
          <BrandButton
            variant={'outline'}
            >
          <Link 
            href="/contact"
            className=""
          >
            Contact Us
          </Link>
          </BrandButton>
          <div>
            <Link 
              href="/"
              className="text-secondaryBrand hover:text-secondaryBrand/60 transition-colors"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

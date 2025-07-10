'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import PlatformNavbar from '@/components/platform-components/platformNavbar'
import MatchbookHeader from "@/components/marketing-landing-components/matchbook-header";
import { useUser } from '@clerk/nextjs';

export default function NotFound() {
  const pathname = usePathname()
  const isPlatformPage = pathname?.includes('app') && !pathname?.includes('admin')
  const { user, isSignedIn } = useUser();

  // Serialize user data to plain object
  const userObject = user ? {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    imageUrl: user.imageUrl,
    emailAddresses: user.emailAddresses?.map(email => ({ emailAddress: email.emailAddress })),
    publicMetadata: user.publicMetadata
  } : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Conditional Navigation */}
      {isPlatformPage ? <PlatformNavbar /> : <MatchbookHeader userId={user?.id || null} user={userObject} isSignedIn={isSignedIn} />}
      
      {/* 404 Content */}
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
        <div className="text-center max-w-md">
          {/* 404 Graphic */}
          <div className="mb-8">
            <h1 className="text-9xl font-bold text-gray-200">404</h1>
          </div>
          
          {/* Error Message */}
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Page Not Found
          </h2>
          
          <p className="text-gray-600 mb-8">
            {isPlatformPage 
              ? "The page you're looking for doesn't exist yet. It might be coming soon!"
              : "Sorry, we couldn't find the page you're looking for."
            }
          </p>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={isPlatformPage ? "/app/searches" : "/"}>
              <Button className="w-full sm:w-auto">
                {isPlatformPage ? "Go to Searches" : "Go Home"}
              </Button>
            </Link>
            
            {isPlatformPage && (
              <Link href="/app/bookings">
                <Button variant="outline" className="w-full sm:w-auto">
                  View Bookings
                </Button>
              </Link>
            )}
            
            {!isPlatformPage && (
              <Link href="/app/host/add-property">
                <Button variant="outline" className="w-full sm:w-auto">
                  Become a Host
                </Button>
              </Link>
            )}
          </div>
          
          {/* Helpful Links */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-4">
              Looking for something specific?
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              {isPlatformPage ? (
                <>
                  <Link href="/app/messages" className="text-blue-600 hover:text-blue-800">
                    Messages
                  </Link>
                  <Link href="/app/bookings" className="text-blue-600 hover:text-blue-800">
                    Bookings
                  </Link>
                  <Link href="/app/host/dashboard/listings" className="text-blue-600 hover:text-blue-800">
                    Host Dashboard
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/about" className="text-blue-600 hover:text-blue-800">
                    About
                  </Link>
                  <Link href="/contact" className="text-blue-600 hover:text-blue-800">
                    Contact
                  </Link>
                  <Link href="/faq" className="text-blue-600 hover:text-blue-800">
                    FAQ
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

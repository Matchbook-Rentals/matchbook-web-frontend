import React from 'react'
import { redirect } from 'next/navigation'
import { currentUser } from '@clerk/nextjs/server'
import { checkAdminAccess } from '@/utils/roles'
import Link from 'next/link'
import UserMenu from '@/components/userMenu'
import { APP_PAGE_MARGIN } from '@/constants/styles'

export const dynamic = 'force-dynamic'

export default async function ManageLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const hasAdminAccess = await checkAdminAccess()

  if (!hasAdminAccess) {
    redirect('/unauthorized')
  }

  const user = await currentUser()

  const userObject = user ? {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    imageUrl: user.imageUrl,
    emailAddresses: user.emailAddresses?.map(email => ({ emailAddress: email.emailAddress })),
    publicMetadata: user.publicMetadata
  } : null

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-background border-b">
        <div className={`flex mx-auto items-center py-3 justify-between ${APP_PAGE_MARGIN}`}>
          <div className="w-1/3">
            <Link href="/">
              <img
                src="/new-green-logo.png"
                alt="MatchBook Logo"
                className="w-[200px] hidden md:block"
              />
              <img
                src="/logo-small.svg"
                alt="MatchBook Logo"
                className="w-[35px] block md:hidden"
              />
            </Link>
          </div>

          <div className="w-1/3 flex justify-center">
          </div>

          <div className="w-1/3 flex justify-end">
            <UserMenu
              color="white"
              mode="header"
              userId={user?.id || null}
              user={userObject}
              isSignedIn={!!user?.id}
              hasListings={false}
            />
          </div>
        </div>
      </nav>

      <main>
        {children}
      </main>
    </div>
  )
}

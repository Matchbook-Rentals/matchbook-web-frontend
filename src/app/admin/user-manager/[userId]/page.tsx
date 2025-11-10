import { redirect } from 'next/navigation'
import { checkAdminAccess } from '@/utils/roles'
import { clerkClient } from '@clerk/nextjs/server'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from 'next/link'
import { ArrowLeft, User } from 'lucide-react'
import { UserTabs } from './user-tabs'
import { getUserData } from './user-data-actions'

interface PageProps {
  params: {
    userId: string
  }
}

export default async function UserDetailPage({ params }: PageProps) {
  if (!(await checkAdminAccess())) {
    redirect('/unauthorized')
  }

  const { userId } = params
  
  try {
    const client = clerkClient
    const user = await client.users.getUser(userId)
    
    // Get user data from database
    let userData
    try {
      userData = await getUserData(userId)
    } catch (error) {
      console.error('Failed to get user data:', error)
      return (
        <div className="container mx-auto py-10">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-destructive mb-2">Error Loading User Data</h2>
                <p className="text-muted-foreground mb-4">
                  {error instanceof Error ? error.message : 'An unknown error occurred'}
                </p>
                <Link href="/admin/user-manager">
                  <Button variant="outline">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to User Management
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }
    
    const userInfo = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
      emailAddress: user.emailAddresses.find(
        email => email.id === user.primaryEmailAddressId
      )?.emailAddress || '',
      role: (user.publicMetadata.role as string) || 'No role',
      createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : null,
      lastSignInAt: user.lastSignInAt ? new Date(user.lastSignInAt).toISOString() : null,
      phoneNumbers: user.phoneNumbers?.map(phone => ({
        phoneNumber: phone.phoneNumber,
        id: phone.id
      })) || [],
      renterBookings: userData.renterBookings,
      hostBookings: userData.hostBookings,
      trips: userData.trips,
      listings: userData.listings,
      housingRequests: userData.housingRequests,
      matches: userData.matches,
      favorites: userData.favorites
    }

    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-6 w-6 text-primary" />
              <CardTitle>User Details</CardTitle>
            </div>
            <Link href="/admin/user-manager">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to User Management
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* User Header */}
              <div className="flex items-start gap-6 p-6 bg-muted/50 rounded-lg">
                {userInfo.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={userInfo.imageUrl} 
                    alt={`${userInfo.firstName} ${userInfo.lastName}`}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                )}
                <div className="flex-1">
                  <h2 className="text-2xl font-bold">
                    {userInfo.firstName} {userInfo.lastName}
                  </h2>
                  <p className="text-lg text-muted-foreground">
                    {userInfo.emailAddress}
                  </p>
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Role:</span>
                      <p className="text-muted-foreground">{userInfo.role}</p>
                    </div>
                    <div>
                      <span className="font-medium">Member since:</span>
                      <p className="text-muted-foreground">
                        {userInfo.createdAt ? new Date(userInfo.createdAt).toLocaleDateString() : 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Last sign in:</span>
                      <p className="text-muted-foreground">
                        {userInfo.lastSignInAt ? new Date(userInfo.lastSignInAt).toLocaleDateString() : 'Never'}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Phone:</span>
                      <p className="text-muted-foreground">
                        {userInfo.phoneNumbers?.[0]?.phoneNumber || 'Not provided'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* User Activity Tabs */}
              <UserTabs userInfo={userInfo} />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  } catch (error) {
    console.error('Error fetching user:', error)
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-destructive mb-2">User Not Found</h2>
              <p className="text-muted-foreground mb-4">
                The user you&apos;re looking for doesn&apos;t exist or has been deleted.
              </p>
              <Link href="/admin/user-manager">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to User Management
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
}
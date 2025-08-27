'use client'

import { useState } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Calendar, 
  Search, 
  Heart, 
  Home, 
  FileText, 
  ExternalLink,
  MapPin,
  DollarSign,
  Clock,
  User
} from 'lucide-react'
import Link from 'next/link'

interface UserInfo {
  id: string
  firstName: string | null
  lastName: string | null
  emailAddress: string
  role: string
  renterBookings?: any[]
  hostBookings?: any[]
  trips?: any[]
  matches?: any[]
  listings?: any[]
  housingRequests?: any[]
  favorites?: any[]
}

interface UserTabsProps {
  userInfo: UserInfo
}

export function UserTabs({ userInfo }: UserTabsProps) {
  const [activeTab, setActiveTab] = useState('renterBookings')

  const tabs = [
    { 
      id: 'renterBookings', 
      label: 'Renter Bookings', 
      icon: Calendar, 
      count: userInfo.renterBookings?.length || 0,
      color: 'bg-blue-100 text-blue-800'
    },
    { 
      id: 'hostBookings', 
      label: 'Host Bookings', 
      icon: Home, 
      count: userInfo.hostBookings?.length || 0,
      color: 'bg-indigo-100 text-indigo-800'
    },
    { 
      id: 'trips', 
      label: 'Trips', 
      icon: Search, 
      count: userInfo.trips?.length || 0,
      color: 'bg-green-100 text-green-800'
    },
    { 
      id: 'matches', 
      label: 'Matches', 
      icon: Heart, 
      count: userInfo.matches?.length || 0,
      color: 'bg-pink-100 text-pink-800'
    },
    { 
      id: 'listings', 
      label: 'Listings', 
      icon: MapPin, 
      count: userInfo.listings?.length || 0,
      color: 'bg-purple-100 text-purple-800'
    },
    { 
      id: 'housingRequests', 
      label: 'Housing Requests', 
      icon: FileText, 
      count: userInfo.housingRequests?.length || 0,
      color: 'bg-orange-100 text-orange-800'
    },
  ]

  const renderTabContent = () => {
    const data = userInfo[activeTab as keyof UserInfo] as any[] || []
    
    if (data.length === 0) {
      const TabIcon = tabs.find(tab => tab.id === activeTab)?.icon || FileText
      const tabLabels = {
        renterBookings: 'renter bookings',
        hostBookings: 'host bookings',
        trips: 'trips',
        matches: 'matches', 
        listings: 'listings',
        housingRequests: 'housing requests'
      }
      
      return (
        <div className="text-center py-12">
          <TabIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No {tabLabels[activeTab as keyof typeof tabLabels]} found</h3>
          <p className="text-muted-foreground">
            This user doesn&apos;t have any {tabLabels[activeTab as keyof typeof tabLabels]} yet.
          </p>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {data.map((item, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              {renderItemContent(activeTab, item)}
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const renderItemContent = (type: string, item: any) => {
    switch (type) {
      case 'renterBookings':
        return (
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {item.startDate ? new Date(item.startDate).toLocaleDateString() : 'Date TBD'} - 
                  {item.endDate ? new Date(item.endDate).toLocaleDateString() : 'Date TBD'}
                </span>
                <Badge variant={item.status === 'confirmed' || item.status === 'active' ? 'default' : 'secondary'}>
                  {item.status || 'pending'}
                </Badge>
              </div>
              {item.listing && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{item.listing.title || `${item.listing.city || 'Unknown'}, ${item.listing.state || ''}`}</span>
                </div>
              )}
              {item.listing?.user && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>Host: {item.listing.user.firstName} {item.listing.user.lastName}</span>
                </div>
              )}
              {item.totalAmount && (
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4" />
                  <span className="font-medium">${item.totalAmount}</span>
                </div>
              )}
            </div>
            {item.id && (
              <Link href={`/admin/booking-management/${item.id}`}>
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View
                </Button>
              </Link>
            )}
          </div>
        )

      case 'hostBookings':
        return (
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {item.startDate ? new Date(item.startDate).toLocaleDateString() : 'Date TBD'} - 
                  {item.endDate ? new Date(item.endDate).toLocaleDateString() : 'Date TBD'}
                </span>
                <Badge variant={item.status === 'confirmed' || item.status === 'active' ? 'default' : 'secondary'}>
                  {item.status || 'pending'}
                </Badge>
              </div>
              {item.listing && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{item.listing.title || `${item.listing.city || 'Unknown'}, ${item.listing.state || ''}`}</span>
                </div>
              )}
              {item.renter && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>Renter: {item.renter.firstName} {item.renter.lastName}</span>
                </div>
              )}
              {item.totalAmount && (
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4" />
                  <span className="font-medium">${item.totalAmount}</span>
                </div>
              )}
            </div>
            {item.id && (
              <Link href={`/admin/booking-management/${item.id}`}>
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View
                </Button>
              </Link>
            )}
          </div>
        )

      case 'trips':
        return (
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {item.locationString || `${item.city || 'Unknown'}, ${item.state || ''}`}
                </span>
                <Badge variant="outline">
                  {item.tripStatus || 'searching'}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                {item.startDate && item.endDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {(item.minPrice || item.maxPrice) && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <span>
                      ${item.minPrice || 0} - ${item.maxPrice || '∞'}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>
                    {item.numAdults || 1} adults{item.numPets ? `, ${item.numPets} pets` : ''}
                  </span>
                </div>
                {item.createdAt && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Created: {new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
            {item.id && (
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                View
              </Button>
            )}
          </div>
        )

      case 'matches':
        return (
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Match #{item.id.slice(0, 8)}</span>
                <Badge variant={item.paymentStatus === 'succeeded' ? 'default' : 'secondary'}>
                  {item.paymentStatus || 'pending'}
                </Badge>
              </div>
              {item.listing && (
                <div className="text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    <span>{item.listing.title || `${item.listing.city}, ${item.listing.state}`}</span>
                  </div>
                </div>
              )}
              {item.monthlyRent && (
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4" />
                  <span className="font-medium">${item.monthlyRent}/month</span>
                </div>
              )}
              {item.matchScore && (
                <div className="text-sm">
                  <span className="font-medium">Match Score: {item.matchScore}%</span>
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                {item.tenantSignedAt ? '✅ Tenant signed' : '⏳ Awaiting tenant signature'}
                {' • '}
                {item.landlordSignedAt ? '✅ Landlord signed' : '⏳ Awaiting landlord signature'}
              </div>
            </div>
            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              View
            </Button>
          </div>
        )

      case 'listings':
        return (
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{item.title || 'Untitled Listing'}</span>
                <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
                  {item.status || 'draft'}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                {(item.streetAddress1 || item.city) && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{item.streetAddress1 || `${item.city}, ${item.state}`}</span>
                  </div>
                )}
                {(item.shortestLeasePrice || item.longestLeasePrice) && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <span>
                      {item.shortestLeasePrice === item.longestLeasePrice 
                        ? `$${item.shortestLeasePrice}/month`
                        : `$${item.longestLeasePrice}-${item.shortestLeasePrice}/month`
                      }
                    </span>
                  </div>
                )}
                {(item.roomCount || item.bathroomCount) && (
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    <span>{item.roomCount || 0} bed, {item.bathroomCount || 0} bath</span>
                  </div>
                )}
                {item.createdAt && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Created: {new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
            {item.id && (
              <Link href={`/admin/listing-management/${item.id}`}>
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View
                </Button>
              </Link>
            )}
          </div>
        )

      case 'housingRequests':
        return (
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Request #{item.id.slice(0, 8)}</span>
                <Badge variant={item.status === 'approved' ? 'default' : 'secondary'}>
                  {item.status || 'pending'}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                {item.listing && (
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    <span>{item.listing.title || `${item.listing.city}, ${item.listing.state}`}</span>
                  </div>
                )}
                {item.startDate && item.endDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {item.trip && (
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    <span>Trip: {item.trip.locationString}</span>
                  </div>
                )}
                {item.submittedAt && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Submitted: {new Date(item.submittedAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              View
            </Button>
          </div>
        )

      default:
        return <div>Unknown item type</div>
    }
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const TabIcon = tab.icon
          return (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "outline"}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2"
            >
              <TabIcon className="h-4 w-4" />
              {tab.label}
              <Badge 
                variant="secondary" 
                className={tab.count > 0 ? tab.color : ""}
              >
                {tab.count}
              </Badge>
            </Button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {renderTabContent()}
      </div>
    </div>
  )
}
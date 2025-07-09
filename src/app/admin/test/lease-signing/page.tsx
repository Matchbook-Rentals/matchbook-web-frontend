'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  FileText, 
  User, 
  Home, 
  Calendar, 
  DollarSign, 
  Settings,
  Play,
  RotateCcw,
  Users
} from 'lucide-react'
import { LeaseSigningClient } from '@/app/platform/match/[matchId]/lease-signing-client'
import HostMatchClient from '@/app/platform/host/match/[matchId]/host-match-client'
import { MatchWithRelations } from '@/types'

export default function LeaseSigningTestPage() {
  const [userType, setUserType] = useState<'host' | 'renter'>('renter')
  const [simulationStep, setSimulationStep] = useState<'sign-lease' | 'complete-payment' | 'completed'>('sign-lease')
  const [hostSimulationStep, setHostSimulationStep] = useState<'setup-stripe-connect' | 'waiting-tenant-signature' | 'sign-lease' | 'waiting-payment-auth' | 'ready-to-collect' | 'completed'>('setup-stripe-connect')
  const [mockData, setMockData] = useState({
    matchId: 'test-match-123',
    listingLocation: 'Test Property, San Francisco, CA',
    monthlyRent: 2500,
    rentDueAtBooking: 77,
    startDate: '2024-01-15',
    endDate: '2024-06-15',
    hostName: 'John Doe',
    hostEmail: 'john@example.com',
    renterName: 'Jane Smith',
    renterEmail: 'jane@example.com'
  })

  // Create mock match data based on current settings
  const createMockMatch = (): MatchWithRelations => {
    const currentStep = userType === 'host' ? hostSimulationStep : simulationStep;
    
    // Host-specific conditions
    const hostConditions = {
      hasStripeConnect: ['waiting-tenant-signature', 'sign-lease', 'waiting-payment-auth', 'ready-to-collect', 'completed'].includes(hostSimulationStep),
      tenantSigned: ['sign-lease', 'waiting-payment-auth', 'ready-to-collect', 'completed'].includes(hostSimulationStep),
      hostSigned: ['waiting-payment-auth', 'ready-to-collect', 'completed'].includes(hostSimulationStep),
      paymentAuthorized: ['ready-to-collect', 'completed'].includes(hostSimulationStep),
      paymentCaptured: hostSimulationStep === 'completed'
    };
    
    // Renter-specific conditions  
    const renterConditions = {
      leaseSigned: ['complete-payment', 'completed'].includes(simulationStep),
      paymentAuthorized: ['completed'].includes(simulationStep),
      paymentCaptured: simulationStep === 'completed'
    };
    
    const mockMatch = {
      id: mockData.matchId,
      listingId: 'test-listing-123',
      tripId: 'test-trip-123',
      monthlyRent: mockData.monthlyRent,
      paymentAmount: null,
      paymentStatus: null,
      stripePaymentIntentId: (userType === 'host' && hostConditions.paymentAuthorized) || (userType === 'renter' && renterConditions.paymentAuthorized) ? 'pi_test_123' : null,
      paymentAuthorizedAt: (userType === 'host' && hostConditions.paymentAuthorized) || (userType === 'renter' && renterConditions.paymentAuthorized) ? new Date() : null,
      paymentCapturedAt: (userType === 'host' && hostConditions.paymentCaptured) || (userType === 'renter' && renterConditions.paymentCaptured) ? new Date() : null,
      stripePaymentMethodId: (userType === 'host' && hostConditions.paymentAuthorized) || (userType === 'renter' && (simulationStep === 'completed' || simulationStep === 'complete-payment')) ? 'pm_test_123' : null,
      leaseDocumentId: 'test-lease-doc-123',
      createdAt: new Date(),
      updatedAt: new Date(),
      listing: {
        id: 'test-listing-123',
        locationString: mockData.listingLocation,
        propertyType: 'Apartment',
        rentDueAtBooking: mockData.rentDueAtBooking,
        user: {
          id: 'test-host-123',
          firstName: mockData.hostName.split(' ')[0],
          lastName: mockData.hostName.split(' ')[1] || '',
          email: mockData.hostEmail,
          profileImage: null,
          stripeAccountId: userType === 'host' && hostConditions.hasStripeConnect ? 'acct_test_123' : null,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        userId: 'test-host-123',
        title: 'Test Property',
        description: 'A beautiful test property',
        price: mockData.monthlyRent,
        images: [],
        amenities: [],
        listingImages: [],
        depositSize: 1000,
        petDeposit: 200,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      trip: {
        id: 'test-trip-123',
        startDate: new Date(mockData.startDate),
        endDate: new Date(mockData.endDate),
        user: {
          id: 'test-renter-123',
          firstName: mockData.renterName.split(' ')[0],
          lastName: mockData.renterName.split(' ')[1] || '',
          email: mockData.renterEmail,
          profileImage: null,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        userId: 'test-renter-123',
        destination: mockData.listingLocation,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      BoldSignLease: {
        id: 'test-boldsign-123',
        tenantSigned: (userType === 'host' && hostConditions.tenantSigned) || (userType === 'renter' && renterConditions.leaseSigned),
        landlordSigned: (userType === 'host' && hostConditions.hostSigned) || (userType === 'renter' && simulationStep === 'completed'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      Lease: null
    } as MatchWithRelations

    return mockMatch
  }

  const handleSimulationStep = (step: 'sign-lease' | 'complete-payment' | 'completed') => {
    setSimulationStep(step)
  }

  const handleHostSimulationStep = (step: 'setup-stripe-connect' | 'waiting-tenant-signature' | 'sign-lease' | 'waiting-payment-auth' | 'ready-to-collect' | 'completed') => {
    setHostSimulationStep(step)
  }

  const handleReset = () => {
    setSimulationStep('sign-lease')
    setHostSimulationStep('setup-stripe-connect')
  }

  const handleMockDataChange = (field: string, value: any) => {
    setMockData(prev => ({ ...prev, [field]: value }))
  }

  const mockMatch = createMockMatch()

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Lease Signing Test Environment</h1>
        <p className="text-muted-foreground">
          Test the lease signing client component with different states and user types
        </p>
      </div>

      <Tabs defaultValue="simulator" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="simulator">Simulator</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="simulator" className="space-y-6">
          {/* Control Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Simulation Controls
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* User Type Toggle */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">User Type</Label>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <Switch 
                      checked={userType === 'host'} 
                      onCheckedChange={(checked) => setUserType(checked ? 'host' : 'renter')}
                    />
                    <Badge variant={userType === 'host' ? 'default' : 'secondary'}>
                      {userType === 'host' ? 'Host' : 'Renter'}
                    </Badge>
                  </div>
                </div>

                {/* Simulation Step Controls */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Simulation Step</Label>
                  {userType === 'renter' ? (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={simulationStep === 'sign-lease' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleSimulationStep('sign-lease')}
                      >
                        Sign Lease
                      </Button>
                      <Button
                        variant={simulationStep === 'complete-payment' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleSimulationStep('complete-payment')}
                      >
                        Payment
                      </Button>
                      <Button
                        variant={simulationStep === 'completed' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleSimulationStep('completed')}
                      >
                        Complete
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      <Button
                        variant={hostSimulationStep === 'setup-stripe-connect' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleHostSimulationStep('setup-stripe-connect')}
                      >
                        Setup Stripe
                      </Button>
                      <Button
                        variant={hostSimulationStep === 'waiting-tenant-signature' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleHostSimulationStep('waiting-tenant-signature')}
                      >
                        Wait Tenant
                      </Button>
                      <Button
                        variant={hostSimulationStep === 'sign-lease' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleHostSimulationStep('sign-lease')}
                      >
                        Sign Lease
                      </Button>
                      <Button
                        variant={hostSimulationStep === 'waiting-payment-auth' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleHostSimulationStep('waiting-payment-auth')}
                      >
                        Wait Payment
                      </Button>
                      <Button
                        variant={hostSimulationStep === 'ready-to-collect' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleHostSimulationStep('ready-to-collect')}
                      >
                        Collect
                      </Button>
                      <Button
                        variant={hostSimulationStep === 'completed' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleHostSimulationStep('completed')}
                      >
                        Complete
                      </Button>
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Quick Actions</Label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleReset}
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Reset
                    </Button>
                  </div>
                </div>

                {/* Status Display */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Current Status</Label>
                  <div className="flex flex-col gap-1">
                    <Badge variant="outline" className="text-xs">
                      {userType === 'host' ? 'Host View' : 'Renter View'}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Step: {userType === 'host' ? hostSimulationStep : simulationStep}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Component Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Component Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                  <strong>Testing Mode:</strong> Viewing as {userType} • Step: {userType === 'host' ? hostSimulationStep : simulationStep}
                  <br />
                  <strong>Note:</strong> This is a simulation using localStorage/memory - no database changes
                </div>
                
                <div className="bg-white rounded-lg overflow-hidden">
                  {userType === 'host' ? (
                    <HostMatchClient 
                      match={mockMatch} 
                      matchId={mockData.matchId}
                    />
                  ) : (
                    <LeaseSigningClient 
                      match={mockMatch} 
                      matchId={mockData.matchId}
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          {/* Mock Data Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Mock Data Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Property Details */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    Property Details
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={mockData.listingLocation}
                        onChange={(e) => handleMockDataChange('listingLocation', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="monthlyRent">Monthly Rent ($)</Label>
                      <Input
                        id="monthlyRent"
                        type="number"
                        value={mockData.monthlyRent}
                        onChange={(e) => handleMockDataChange('monthlyRent', parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="rentDueAtBooking">Rent Due at Booking ($)</Label>
                      <Input
                        id="rentDueAtBooking"
                        type="number"
                        value={mockData.rentDueAtBooking}
                        onChange={(e) => handleMockDataChange('rentDueAtBooking', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                </div>

                {/* Date Range */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Lease Dates
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={mockData.startDate}
                        onChange={(e) => handleMockDataChange('startDate', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={mockData.endDate}
                        onChange={(e) => handleMockDataChange('endDate', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Host Details */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Host Details
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="hostName">Host Name</Label>
                      <Input
                        id="hostName"
                        value={mockData.hostName}
                        onChange={(e) => handleMockDataChange('hostName', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="hostEmail">Host Email</Label>
                      <Input
                        id="hostEmail"
                        type="email"
                        value={mockData.hostEmail}
                        onChange={(e) => handleMockDataChange('hostEmail', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Renter Details */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Renter Details
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="renterName">Renter Name</Label>
                      <Input
                        id="renterName"
                        value={mockData.renterName}
                        onChange={(e) => handleMockDataChange('renterName', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="renterEmail">Renter Email</Label>
                      <Input
                        id="renterEmail"
                        type="email"
                        value={mockData.renterEmail}
                        onChange={(e) => handleMockDataChange('renterEmail', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Test Scenarios */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Pre-configured Test Scenarios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  className="h-auto p-4 text-left"
                  onClick={() => {
                    handleMockDataChange('monthlyRent', 1800)
                    handleMockDataChange('rentDueAtBooking', 50)
                    handleMockDataChange('listingLocation', 'Budget Apartment, Austin, TX')
                    setUserType('renter')
                    handleSimulationStep('sign-lease')
                    handleHostSimulationStep('setup-stripe-connect')
                  }}
                >
                  <div>
                    <div className="font-medium">Budget Rental (Renter)</div>
                    <div className="text-sm text-muted-foreground">$1,800/month, $50 due at booking</div>
                  </div>
                </Button>
                
                <Button
                  variant="outline"
                  className="h-auto p-4 text-left"
                  onClick={() => {
                    handleMockDataChange('monthlyRent', 3500)
                    handleMockDataChange('rentDueAtBooking', 150)
                    handleMockDataChange('listingLocation', 'Luxury Condo, Manhattan, NY')
                    setUserType('host')
                    handleHostSimulationStep('setup-stripe-connect')
                    handleSimulationStep('sign-lease')
                  }}
                >
                  <div>
                    <div className="font-medium">Luxury Rental (Host)</div>
                    <div className="text-sm text-muted-foreground">$3,500/month, $150 due at booking</div>
                  </div>
                </Button>
                
                <Button
                  variant="outline"
                  className="h-auto p-4 text-left"
                  onClick={() => {
                    handleMockDataChange('monthlyRent', 2200)
                    handleMockDataChange('rentDueAtBooking', 77)
                    handleMockDataChange('listingLocation', 'Standard Apartment, Denver, CO')
                    setUserType('host')
                    handleHostSimulationStep('ready-to-collect')
                    handleSimulationStep('completed')
                  }}
                >
                  <div>
                    <div className="font-medium">Payment Ready (Host)</div>
                    <div className="text-sm text-muted-foreground">Ready to collect payment</div>
                  </div>
                </Button>
                
                <Button
                  variant="outline"
                  className="h-auto p-4 text-left"
                  onClick={() => {
                    handleMockDataChange('monthlyRent', 2800)
                    handleMockDataChange('rentDueAtBooking', 100)
                    handleMockDataChange('listingLocation', 'Modern Apartment, Seattle, WA')
                    setUserType('renter')
                    handleSimulationStep('complete-payment')
                    handleHostSimulationStep('waiting-payment-auth')
                  }}
                >
                  <div>
                    <div className="font-medium">Payment Ready (Renter)</div>
                    <div className="text-sm text-muted-foreground">Lease signed, ready for payment</div>
                  </div>
                </Button>
                
                <Button
                  variant="outline"
                  className="h-auto p-4 text-left"
                  onClick={() => {
                    handleMockDataChange('monthlyRent', 2400)
                    handleMockDataChange('rentDueAtBooking', 85)
                    handleMockDataChange('listingLocation', 'Cozy Home, Portland, OR')
                    setUserType('host')
                    handleHostSimulationStep('waiting-tenant-signature')
                    handleSimulationStep('sign-lease')
                  }}
                >
                  <div>
                    <div className="font-medium">Waiting for Tenant (Host)</div>
                    <div className="text-sm text-muted-foreground">Waiting for tenant to sign lease</div>
                  </div>
                </Button>
                
                <Button
                  variant="outline"
                  className="h-auto p-4 text-left"
                  onClick={() => {
                    handleMockDataChange('monthlyRent', 3200)
                    handleMockDataChange('rentDueAtBooking', 125)
                    handleMockDataChange('listingLocation', 'Premium Suite, Miami, FL')
                    setUserType('host')
                    handleHostSimulationStep('completed')
                    handleSimulationStep('completed')
                  }}
                >
                  <div>
                    <div className="font-medium">Completed Booking</div>
                    <div className="text-sm text-muted-foreground">Fully completed lease and payment</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
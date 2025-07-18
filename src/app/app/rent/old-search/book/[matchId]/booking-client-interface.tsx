'use client'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { QuestionMarkCircledIcon, CalendarIcon, PersonIcon } from "@radix-ui/react-icons"
import { Match, Trip, Listing } from "@prisma/client"
import { useState } from "react"
import StripeCheckoutEmbed from "./stripe-checkout-embed"
import { useUser } from '@clerk/nextjs'
import { updateBoldSignLease } from "@/app/actions/documents"
import { toast } from "@/components/ui/use-toast"
import { MatchWithRelations } from "@/types"

interface PropertyBookingPageProps {
  match: MatchWithRelations
  clientSecret: string;
}




export default function PropertyBookingPage({ match, clientSecret }: PropertyBookingPageProps) {
  const [useStripeCheckout, setUseStripeCheckout] = useState(false)
  const { user } = useUser()
  const [isLeaseSigned, setIsLeaseSigned] = useState(false)
  // Calculate length of stay
  const calculateStayLength = () => {
    const startDate = new Date(match.trip.startDate);
    const endDate = new Date(match.trip.endDate);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const months = Math.floor(diffDays / 30);
    const days = diffDays % 30;
    return `${months} M | ${days} D`;
  };

  const handleSignLease = async () => {
    // Redirect to our new BoldSign lease signing page
    window.location.href = `/app/match/${match.id}`;
  };

  const handleUpdateLease = async () => {
    const response = await updateBoldSignLease(match.BoldSignLease.id, { tenantSigned: true })
    toast({
      title: 'Lease Signed',
      description: 'The lease has been signed by the tenant',
    })
    console.log(response)
  }


  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-end mb-4">
        <Button onClick={() => {
          console.log(match.BoldSignLease)
        }}>
          Log BoldSign Lease
        </Button>
        <Label htmlFor="use-stripe" className="mr-2">Use Stripe Checkout</Label>
        <Switch
          id="use-stripe"
          checked={useStripeCheckout}
          onCheckedChange={setUseStripeCheckout}
        />

      </div>

      {/* BoldSign lease signing is now handled through /app/match/[matchId] route */}


      {useStripeCheckout ? (
        <StripeCheckoutEmbed clientSecret={clientSecret} />
      ) : (
        <>
          <h2 className="text-3xl font-semibold text-center mb-8">Almost There!</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Date Review</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor="move-in">Move in</Label>
                  <Input id="move-in" type="date" defaultValue={match.trip.startDate?.toISOString().split('T')[0]} />
                </div>
                <div>
                  <Label htmlFor="move-out">Move out</Label>
                  <Input id="move-out" type="date" defaultValue={match.trip.endDate?.toISOString().split('T')[0]} />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">Reminder: Date change requests need to be approved by host</p>

              <Button className="w-full mb-4" onClick={handleSignLease} disabled={isLeaseSigned}> {isLeaseSigned ? 'Lease Signed' : 'Review and Sign Lease'}</Button>

              <h4 className="text-lg font-semibold mb-2">Payment</h4>
              <Select>
                <option>ACH payments</option>
              </Select>
              <p className="text-sm text-muted-foreground mt-1">Processing fee: Free</p>

              <h4 className="text-lg font-semibold mt-4 mb-2">Additional Payment Options</h4>
              <Select className="mb-2">
                <option>Credit Card</option>
              </Select>
              <p className="text-sm text-muted-foreground mb-2">Processing fee: 3%</p>
              <Select>
                <option>Venmo</option>
              </Select>
              <p className="text-sm text-muted-foreground">Processing fee: 3%</p>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Booking Summary</h3>
              <div className="flex items-center mb-4">
                <PersonIcon className="w-6 h-6 mr-2" />
                <h4 className="text-lg font-semibold">Guests</h4>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <p>Adults: {match.trip.numAdults}</p>
                <p>Kids: {match.trip.numKids || 0}</p>
                <p>Dogs: {match.trip.numPets || 0}</p>
                <p>Cats: {match.trip.numPets || 0}</p>
                <p className="font-semibold">Total: {match.trip.numAdults + (match.trip.numKids || 0) + (match.trip.numPets || 0)}</p>
              </div>
              <Separator className="my-4" />
              <div className="flex items-center mb-4">
                <CalendarIcon className="w-6 h-6 mr-2" />
                <h4 className="text-lg font-semibold">Dates</h4>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <p>Move in: {match.trip.startDate?.toISOString().split('T')[0]}</p>
                <p>Move out: {match.trip.endDate?.toISOString().split('T')[0]}</p>
                <p>Length: {calculateStayLength()}</p>
              </div>
              <Separator className="my-4" />
              <div className="flex items-center mb-4">
                <QuestionMarkCircledIcon className="w-6 h-6 mr-2" />
                <h4 className="text-lg font-semibold">Payments</h4>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <p>Deposit:</p>
                <p className="text-right">$ 2,350</p>
                <p className="font-semibold">Monthly Charges</p>
                <p></p>
                <p>Rent:</p>
                <p className="text-right">$ 2,350</p>
                <p>Service fee:</p>
                <p className="text-right">$ 70.50</p>
                <Separator className="col-span-2 my-2" />
                <p className="font-semibold">Total:</p>
                <p className="text-right font-semibold">$2,420.5</p>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}

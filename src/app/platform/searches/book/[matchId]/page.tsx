import { getMatch } from '@/app/actions/matches'
import PropertyBookingPage from './booking-client-interface'
import { CheckoutSessionRequest } from '@/app/api/create-checkout-session/start-booking/route'
import { calculateRent } from '@/lib/calculate-rent'

export default async function MatchPage({ params }: { params: { matchId: string } }) {
  try {

    const { matchId } = params
    const { match, error } = await getMatch(matchId)
    if (!match) {
      return <div>Error 1: {error || 'Failed to fetch match'}</div>
    }
    const monthlyRentDollars = calculateRent({ listing: match.listing, trip: match.trip })
    const CENTS_PER_DOLLAR = 100
    const monthlyRentCents = Math.round(monthlyRentDollars * CENTS_PER_DOLLAR)
    const depositAmountCents = match?.listing?.depositSize ? match.listing.depositSize * CENTS_PER_DOLLAR : 0


    const checkoutRequest: CheckoutSessionRequest = {
      depositAmountCents,
      rentAmountCents: monthlyRentCents,
      listingTitle: match.listing.title || 'Test Listing',
      locationString: match.listing.locationString || 'Test Location',
      listingOwnerId: match.listing.userId,
      matchId: match.id,
    }

    const clientSecret = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/create-checkout-session/start-booking`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(checkoutRequest),
    }).then(res => res.json())
      .then(data => data.clientSecret); // Extract the sessionId string from the response

    return (
      <div>
        <h1>Confirm Booking</h1>
        <p>{checkoutRequest.listingOwnerId}</p>
        <PropertyBookingPage match={match} clientSecret={clientSecret} />
      </div>
    )
  } catch (error) {
    console.error('Error fetching match:', error)
    return <div>Error 2: {error?.message || 'Failed to fetch match'}</div>
  }
}


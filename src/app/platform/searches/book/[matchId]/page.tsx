import { getMatch } from '@/app/actions/matches'
import PropertyBookingPage from './booking-client-interface'
import { CheckoutSessionRequest } from '@/app/api/create-checkout-session/start-booking/route'



export default async function MatchPage({ params }: { params: { matchId: string } }) {
  const { matchId } = params
  const { success, match, error } = await getMatch(matchId)

  if (!success || !match) {
    return <div>Error: {error || 'Failed to fetch match'}</div>
  }

  const checkoutRequest: CheckoutSessionRequest = {
    depositAmountCents: 1000,
    rentAmountCents: 1000,
    listingTitle: match.listing.title || 'Test Listing',
    locationString: match.listing.locationString || 'Test Location',
    listingOwnerId: match.listing.userId,
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
      <p>{clientSecret}</p>
      <p>{checkoutRequest.listingOwnerId}</p>
      <PropertyBookingPage match={match} clientSecret={clientSecret} />
    </div>
  )
}

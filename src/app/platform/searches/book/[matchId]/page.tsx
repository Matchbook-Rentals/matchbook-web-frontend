import { getMatch } from '@/app/actions/matches'
import PropertyBookingPage from './client-side'

export default async function MatchPage({ params }: { params: { matchId: string } }) {
  const { matchId } = params
  const { success, match, error } = await getMatch(matchId)

  if (!success || !match) {
    return <div>Error: {error || 'Failed to fetch match'}</div>
  }

  return (
    <div>
      <PropertyBookingPage match={match} />
    </div>
  )
}

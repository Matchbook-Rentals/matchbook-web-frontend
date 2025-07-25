import { MetadataRoute } from 'next'
import prisma from '@/lib/prismadb'
import { ApprovalStatus } from '@prisma/client'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://matchbookrentals.com'
  
  // Static public routes (highest priority) - verified to have real content
  const staticRoutes = [
    '',
    '/about',
    '/contact',
    '/faq',
    '/hosts',
    '/terms',
    '/articles',
    '/view-terms',
  ]

  // Generate sitemap entries for static routes
  const staticPages = staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  // Authentication routes - these use Clerk catch-all routes
  const authRoutes = [
    '/sign-in',
    '/sign-up',
  ]

  const authPages = authRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'yearly' as const,
    priority: 0.3,
  }))

  // App routes - Rent (require authentication, verified to have real content)
  const rentAppRoutes = [
    '/app/rent/dashboard',
    '/app/rent/searches',
    '/app/rent/bookings',
    '/app/rent/messages',
    '/app/rent/settings',
    '/app/rent/preferences',
    '/app/rent/application',
    '/app/rent/verification',
    '/app/rent/background-check',
  ]

  const rentAppPages = rentAppRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  // App routes - Host (require authentication, verified to have real content)
  // Note: /app/host/dashboard redirects to /app/host/dashboard/overview so excluded
  const hostAppRoutes = [
    '/app/host/listings',
    '/app/host/add-property',
    '/app/host/applications',
    '/app/host/bookings',
    '/app/host/payouts',
  ]

  const hostAppPages = hostAppRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  // Guest routes (verified to exist) - removed trips route as it's not SEO-friendly content
  const guestRoutes: string[] = []

  const guestPages = guestRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  // Success/completion routes (verified to exist)
  const completionRoutes = [
    '/lease-success',
    '/stripe-callback',
    '/onboarding-incomplete',
    '/unauthorized',
  ]

  const completionPages = completionRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'yearly' as const,
    priority: 0.2,
  }))

  // Dynamic listing routes (public guest listing pages)
  let listingPages: MetadataRoute.Sitemap = []
  
  try {
    // Test basic connection first
    const count = await prisma.listing.count()
    console.log('Total listing count:', count)
    
    // Fetch approved and active listings for sitemap
    const listings = await prisma.listing.findMany({
      where: {
        approvalStatus: 'approved',
        markedActiveByUser: true
      },
      select: {
        id: true,
        lastModified: true,
        createdAt: true
      },
      take: 10000 // Limit to prevent sitemap from becoming too large
    })

    listingPages = listings.map((listing) => ({
      url: `${baseUrl}/guest/listing/${listing.id}`,
      lastModified: listing.lastModified || listing.createdAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  } catch (error) {
    console.error('Error fetching listings for sitemap:', error)
    // Continue without listing pages if database is unavailable
  }

  // TODO: Add other dynamic routes for:
  // - Individual articles: /articles/[slug]
  // - Trip details: /app/rent/searches/[tripId]
  // - Match details: /match/[matchId]
  // These would typically be fetched from your database

  return [
    ...staticPages,
    ...authPages,
    ...rentAppPages,
    ...hostAppPages,
    ...guestPages,
    ...completionPages,
    ...listingPages,
  ]
}

import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://matchbookrentals.com'
  
  // Static routes
  const staticRoutes = [
    '',
    '/about',
    '/contact',
    '/faq',
    '/hosts',
    '/terms',
    '/articles',
  ]

  // Generate sitemap entries for static routes
  const staticPages = staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  // App routes (require authentication, lower priority)
  const appRoutes = [
    '/app/rent/dashboard',
    '/app/rent/searches',
    '/app/rent/bookings',
    '/app/rent/messages',
    '/app/rent/settings',
    '/app/rent/preferences',
    '/app/host/dashboard',
    '/app/host/listings',
    '/app/host/add-property',
  ]

  const appPages = appRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.5,
  }))

  // Guest routes
  const guestRoutes = [
    '/guest/trips',
  ]

  const guestPages = guestRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  // TODO: Add dynamic routes for:
  // - Individual articles: /articles/[slug]
  // - Individual listings: /app/host/[listingId]
  // - Trip details: /app/rent/searches/[tripId]
  // These would typically be fetched from your database

  return [...staticPages, ...appPages, ...guestPages]
}
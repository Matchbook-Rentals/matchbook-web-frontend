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

  // Platform routes (require authentication, lower priority)
  const platformRoutes = [
    '/platform/dashboard',
    '/platform/trips',
    '/platform/searches',
    '/platform/bookings',
    '/platform/messages',
    '/platform/settings',
    '/platform/preferences',
    '/platform/host/dashboard',
    '/platform/host/listings',
    '/platform/host/add-property',
  ]

  const platformPages = platformRoutes.map((route) => ({
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
  // - Individual listings: /platform/host/[listingId]
  // - Trip details: /platform/trips/[tripId]
  // These would typically be fetched from your database

  return [...staticPages, ...platformPages, ...guestPages]
}
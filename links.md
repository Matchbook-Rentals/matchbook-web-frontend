# Links and Navigation Documentation

This document catalogs all URL navigation patterns in the Matchbook web frontend application, including anchor tags, Link components, router.push calls, redirects, and other URL changing mechanisms.

## Overview

The application uses multiple navigation patterns:
- Next.js Link components for client-side navigation
- HTML anchor tags for external links and specific behaviors
- Programmatic navigation with router.push()
- Server-side redirects
- Form actions and other navigation mechanisms

## Navigation Patterns by Type

### 1. HTML Anchor Tags (`<a>` tags with href attributes)

#### `/src/components/app-sidebar.tsx`
| Line | Destination | Context |
|------|-------------|---------|
| 166 | `#` | Generic placeholder anchor |
| 185 | `{item.url}` (dynamic) | Dynamic URL navigation |
| 194 | `{item.url}` (dynamic) | Dynamic URL navigation with title |

#### `/src/components/SocialLinks.tsx`
| Line | Destination | Context |
|------|-------------|---------|
| 14 | `https://x.com/matchbookrent` | Twitter/X social link |
| 21 | `https://www.facebook.com/share/MpdT4CSW4cp75vZh/?mibextid=LQQJ4d` | Facebook social link |
| 28 | `https://www.instagram.com/matchbookrentals?igsh=MWh4NngyZ2Q4Nnlmbw==` | Instagram social link |
| 35 | `https://www.tiktok.com/@matchbookrentals?_t=8qlshKMhmfe&_r=1` | TikTok social link |
| 42 | `https://www.linkedin.com/company/matchbookrentals/` | LinkedIn social link |

### 2. Next.js Link Components with href props

#### `/src/components/NavMenu.tsx`
| Line | Destination | Context |
|------|-------------|---------|
| 7 | `/app/rent/searches` | Main search page |
| 10 | `/` | Home page |
| 13 | `/` | Home page |
| 19 | `/app/rent/messages` | Messages page |
| 25 | `/` | Home page |
| 34 | `/` | Home page |
| 37 | `/admin` | Admin dashboard |
| 40 | `/` | Home page |
| 43 | `/` | Home page |

#### `/src/components/marketing-landing-components/footer.tsx`
| Line | Destination | Context |
|------|-------------|---------|
| 25 | `/#` | Home with hash |
| 32 | `/about/#` | About page |
| 39 | `/contact/#` | Contact page |
| 53 | `/articles` | Articles section |
| 60 | `/faq` | FAQ page |

#### `/src/components/marketing-landing-components/matchbook-header.tsx`
| Line | Destination | Context |
|------|-------------|---------|
| 28 | `/` | Logo link to home |
| 40 | `/hosts` | Hosts landing page |

#### `/src/components/admin/AdminSidebar.tsx`
| Line | Destination | Context |
|------|-------------|---------|
| 12 | `/admin` | Admin dashboard |
| 19 | `/admin/user-management` | User management |
| 26 | `/admin/listing-approval` | Listing approval |
| 33 | `/admin/tickets` | Support tickets |
| 40 | `/admin/notifications` | Notifications management |
| 47 | `/admin/upload-article` | Article upload |
| 54 | `/admin/application-errors` | Error tracking |
| 61 | `/admin/client-logs` | Client logs |
| 68 | `/admin/cron-jobs` | Cron job management |
| 75 | `/admin/stripe-integration` | Stripe integration |
| 82 | `/admin/boldsign` | BoldSign integration |
| 89 | `/admin/clerk-integration` | Clerk integration |
| 133 | `/` | Return to site |

#### `/src/components/platform-components/sidebar.tsx`
| Line | Destination | Context |
|------|-------------|---------|
| 32 | `/app/rent/dashboard` | Renter dashboard |

#### `/src/app/not-found.tsx`
| Line | Destination | Context |
|------|-------------|---------|
| 51 | `/app/rent/searches` or `/` (conditional) | Conditional navigation based on platform |
| 58 | `/app/rent/bookings` | Bookings page |
| 66 | `/app/host/add-property` | Add property page |
| 82 | `/app/rent/messages` | Messages page |
| 85 | `/app/rent/bookings` | Bookings page |
| 88 | `/app/host/dashboard/listings` | Host listings |
| 94 | `/about` | About page |
| 97 | `/contact` | Contact page |
| 100 | `/faq` | FAQ page |

#### `/src/components/userMenu.tsx` - Role-based Navigation
| Line | Destination | Context |
|------|-------------|---------|
| 218 | `/app/host/dashboard/listings` | Host properties |
| 219 | `/app/host/dashboard/applications` | Host applications |
| 220 | `/app/host/dashboard/bookings` | Host bookings |
| 224 | `/app/rent/messages?view=host` | Host inbox |
| 228 | `/app/rent/searches` | Switch to renting |
| 238 | `/app/rent/searches` | Renter searches |
| 239 | `/app/rent/application` | Renter application |
| 240 | `/app/rent/bookings` | Renter bookings |
| 241 | `/app/rent/messages` | Renter inbox |
| 245 | `/app/host/dashboard/listings` | Switch to hosting |
| 251 | `/app/rent/verification` | Identity verification |
| 252 | `/admin` | Admin dashboard |
| 554 | `/sign-in` | Sign in page |

### 3. Programmatic Navigation (router.push)

#### `/src/components/home-components/SearchInputsDesktop.tsx`
| Line | Destination | Context |
|------|-------------|---------|
| 152 | `/app/searches/${response.trip.id}` | Navigate to trip search results |

#### `/src/components/home-components/SearchDialog.tsx`
| Line | Destination | Context |
|------|-------------|---------|
| 110 | `/app/rent/searches/set-preferences/${response.trip.id}` | Navigate to trip preferences |

#### `/src/app/app/rent/application/applicationClientComponent.tsx`
| Line | Destination | Context |
|------|-------------|---------|
| 272 | `/app/dashboard` | Navigate to dashboard |

### 4. Server-side Redirects (redirect)

#### `/src/middleware.ts`
| Line | Destination | Context |
|------|-------------|---------|
| 105 | `cleanUrl` (dynamic) | Clean URL redirect |
| 134 | `termsUrl` (dynamic) | Terms agreement redirect |
| 145 | `unauthorizedUrl` (dynamic) | Unauthorized access redirect |

#### `/src/app/auth/callback/route.ts`
| Line | Destination | Context |
|------|-------------|---------|
| 40 | `finalRedirectUrl` (dynamic) | Post-authentication redirect |

### 5. Window Location Navigation

#### `/src/components/userMenu.tsx`
| Line | Destination | Context |
|------|-------------|---------|
| 177 | `window.location.href` (read) | Get current URL for Stripe callback |
| 205 | `linkData.url` (Stripe onboarding) | Redirect to Stripe onboarding |

### 6. Form Actions

#### `/src/app/terms/terms-agreement-form.tsx`
- Contains form actions for terms agreement processing

#### `/src/app/admin/tickets/[ticketId]/page.tsx`
- Contains form actions for ticket management

### 7. Error Navigation (notFound)

The following files use Next.js `notFound()` function to trigger 404 responses:

- `/src/app/app/host/bookings/[bookingId]/page.tsx`
- `/src/app/app/host/[listingId]/payments/page.tsx`
- `/src/app/app/host/[listingId]/bookings/page.tsx`
- `/src/app/app/host/[listingId]/reviews/page.tsx`
- `/src/app/app/host/[listingId]/applications/page.tsx`
- `/src/app/app/host/[listingId]/layout.tsx`
- `/src/app/not-found.tsx`
- `/src/app/app/rent/match/[matchId]/page.tsx`
- `/src/app/app/host/match/[matchId]/page.tsx`
- `/src/app/articles/[slug]/page.tsx`
- `/src/app/admin/listing-approval/[listingId]/page.tsx`

## URL Categories and Patterns

### Internal Application Routes (`/app/`)

**Renter Routes:**
- `/app/rent/searches` - Main search interface
- `/app/rent/dashboard` - Renter dashboard
- `/app/rent/messages` - Messaging interface
- `/app/rent/bookings` - Booking management
- `/app/rent/application` - Application status
- `/app/rent/verification` - Identity verification
- `/app/rent/searches/set-preferences/{tripId}` - Trip preferences
- `/app/renter/bookings/{bookingId}/authorize-payment` - Payment authorization

**Host Routes:**
- `/app/host/dashboard/listings` - Property management
- `/app/host/dashboard/applications` - Application management
- `/app/host/dashboard/bookings` - Booking management
- `/app/host/add-property` - Property listing creation
- `/app/host-dashboard/{listingId}?tab=bookings` - Property-specific dashboard
- `/app/host/match/{matchId}` - Match management
- `/app/host/{listingId}/applications` - Property applications

**Shared Routes:**
- `/app/dashboard` - General dashboard
- `/app/messages` - Messaging system
- `/app/searches/{tripId}` - Search results
- `/app/match/{matchId}` - Match details

### Administrative Routes (`/admin/`)

- `/admin` - Main admin dashboard
- `/admin/user-management` - User administration
- `/admin/listing-approval` - Property approval
- `/admin/tickets` - Support tickets
- `/admin/notifications` - Notification management
- `/admin/upload-article` - Content management
- `/admin/application-errors` - Error tracking
- `/admin/client-logs` - Logging interface
- `/admin/cron-jobs` - Scheduled task management
- `/admin/stripe-integration` - Payment integration
- `/admin/boldsign` - Document signing integration
- `/admin/clerk-integration` - Authentication management

### Marketing/Public Routes

- `/` - Homepage
- `/about` - About page
- `/contact` - Contact information
- `/faq` - Frequently asked questions
- `/articles` - Content articles
- `/hosts` - Host landing page
- `/sign-in` - Authentication
- `/terms` - Terms of service

### External Links

**Social Media:**
- Twitter/X: `https://x.com/matchbookrent`
- Facebook: `https://www.facebook.com/share/MpdT4CSW4cp75vZh/?mibextid=LQQJ4d`
- Instagram: `https://www.instagram.com/matchbookrentals?igsh=MWh4NngyZ2Q4Nnlmbw==`
- TikTok: `https://www.tiktok.com/@matchbookrentals?_t=8qlshKMhmfe&_r=1`
- LinkedIn: `https://www.linkedin.com/company/matchbookrentals/`

**Third-party Integrations:**
- Stripe onboarding URLs (dynamic)
- BoldSign document URLs (dynamic)

## Dynamic URL Patterns

The application extensively uses dynamic routing with:
- `{tripId}` - Trip/search identifiers
- `{listingId}` - Property identifiers
- `{matchId}` - Match identifiers
- `{bookingId}` - Booking identifiers
- `{ticketId}` - Support ticket identifiers
- `{slug}` - Article slugs

## Navigation Hooks and State Management

The codebase uses:
- `useRouter()` from Next.js for programmatic navigation
- `usePathname()` for current route detection
- Conditional navigation based on user roles and authentication status
- Query parameters for filtering and state management (e.g., `?tab=bookings`, `?view=host`)

## Summary

- **Total Navigation Points:** 100+ individual navigation elements
- **Internal Routes:** 50+ distinct application routes
- **External Links:** 5 social media platforms
- **Dynamic Routes:** Extensive use of parameterized URLs
- **Role-based Navigation:** Separate flows for renters, hosts, and admins
- **Error Handling:** Comprehensive 404 and unauthorized access handling
# SEO Implementation Guide for MatchBook Rentals

## Framework

All top-level public pages should follow this SEO structure:

### Title Tag
```typescript
<title>MatchBook Rentals | *Page name/keyword*</title>
```

### Meta Description
```typescript
<meta name="description" content="*Brief selling point (max 160 characters)*"/>
```

### Heading Tags
- **H1**: Important keyword read by search engines (one per page)
- **H2**: Secondary keywords
- **H3**: Supporting keywords

## Implementation in Next.js App Router

Use the `Metadata` API in each `page.tsx`:

```typescript
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MatchBook Rentals | Page Name',
  description: 'Page description under 160 characters',
};
```

For pages that should NOT be indexed by search engines:

```typescript
export const metadata: Metadata = {
  title: 'Page Name',
  robots: {
    index: false,
    follow: false,
  },
};
```

## Page-by-Page SEO Specifications

### High Priority Marketing Pages

#### Home Page (`/`)
- **URL**: https://matchbookrentals.com/
- **Title**: `MatchBook Rentals | Monthly Rentals`
- **Description**: "MatchBook is a monthly rental platform built to make renting easier and more affordable for hosts and renters. Find furnished and unfurnished rentals, with leases from 30 days to 1 year."
- **H1**: Midterm Rentals
- **H2**: List Your Monthly Rental for Free
- **H3**: MatchBook Makes Renting Easy

#### Become a Host (`/hosts`)
- **URL**: https://matchbookrentals.com/hosts
- **Title**: `MatchBook Rentals | Become a Host`
- **Description**: "Become a MatchBook host today. List your midterm rental, screen renters, manage bookings, and receive rent directly to your account; all completely free."
- **H1**: Manage your Midterm Rental
- **H2**: List Your Monthly Rental for Free
- **H3**: MatchBook is Free for Hosts

#### About Us (`/about`)
- **URL**: https://matchbookrentals.com/about
- **Title**: `MatchBook Rentals | About Us`
- **Description**: "MatchBook is committed to honesty and integrity, simplifying rentals, putting relationships over transactions, providing real value upfront, and creating a better renting experience for all. Learn more about us here."
- **H1**: Simplifying Midterm Rentals
- **H2**: Better Rental Experience
- **H3**: Tenant Screening and Rental Tools

#### FAQ (`/faq`)
- **URL**: https://matchbookrentals.com/faq
- **Title**: `MatchBook Rentals | Frequently Asked Questions`
- **Description**: "Renter and host frequently asked questions. Get answers to your questions here."
- **H1**: Renter Questions
- **H2**: Host Questions

### Medium Priority Pages

#### Contact (`/contact`)
- **URL**: https://matchbookrentals.com/contact
- **Title**: `MatchBook Rentals | Contact Us`
- **Description**: "Have questions? Contact the MatchBook team. We're here to help hosts and renters with support for monthly rentals."
- **H1**: Contact Us

#### Verification (`/verification`)
- **URL**: https://matchbookrentals.com/verification
- **Title**: `MatchBook Rentals | Renter Verification`
- **Description**: "MatchBook's comprehensive renter verification includes background checks, credit reports, and income verification to help hosts find qualified tenants."
- **H1**: MatchBook Renter Verification
- **H2**: How Verification Works

#### Articles (`/articles`)
- **URL**: https://matchbookrentals.com/articles
- **Title**: `MatchBook Rentals | Articles & Resources`
- **Description**: "Expert advice and resources for monthly rentals, midterm leasing, and property management. Learn tips for hosts and renters."
- **H1**: Rental Resources & Articles

### Pages Set to NoIndex

The following pages should have `robots: { index: false }`:

**Legal Pages:**
- `/acceptable-use-policy`
- `/california-privacy-notice`
- `/cookie-notice`
- `/cookie-policy`
- `/privacy-policy`
- `/terms-of-service`
- `/host-fcra-compliance`
- `/terms` (auth required)
- `/terms/hosts` (auth required)
- `/view-terms`

**Authentication Pages:**
- `/sign-in`
- `/sign-up`

**Utility/Callback Pages:**
- `/stripe-callback`
- `/lease-success`
- `/unauthorized`

## SEO Best Practices

1. **One H1 per page**: Each page should have exactly one H1 tag
2. **Character limits**: Meta descriptions should be 150-160 characters
3. **Title format**: Always use "MatchBook Rentals | Page Name" format
4. **Heading hierarchy**: Use H1 → H2 → H3 in logical order
5. **NoIndex appropriately**: Don't index transactional, legal, or auth pages

## Status

✅ Implemented: All pages listed above
⏳ Pending: Dynamic article pages (awaiting major changes to articles section)

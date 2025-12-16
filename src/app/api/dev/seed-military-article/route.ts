import { NextResponse } from 'next/server'
import prisma from '@/lib/prismadb'

// DEV ONLY - Seeds the military article to test markdown rendering
export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  const content = `Anyone in the military and their families know that moves can be frequent, stressful, and often unpredictable. Many service members choose military lodging or on-base lodging for their temporary stays.

This is true for both [Permanent Change of Station (PCS)](https://www.militaryonesource.mil/moving-pcs/plan-to-move/pcs-the-basics-about-permanent-change-of-station/) and Temporary Duty (TDY) assignments. They often use these options before finding long-term housing. Some even go to platforms like Airbnb or VRBO to find monthly rentals off-base, but these options can be limited, expensive, and not ideal for families.

So, what is your alternative? Midterm rentals.

Midterm or monthly rentals are stays that last from 30 days to less than one year. They offer a flexible, convenient, and comfortable option for living off-base. They've historically been hard to find or negotiate with long-term landlords but are becoming increasingly common (thankfully).

<h2>Brief Dive: Understanding Military Moves</h2>

<h3>What is a PCS (Permanent Change of Station)?</h3>

PCS-ing is a long-term relocation to a new duty station and typically lasts for years. This kind of move often involves moving entire households, families, and pets. Once arriving at their new duty station, service members may wait weeks/months for on-base housing, an apartment, or to buy a new home. During their wait, they often find themselves staying at the on-base hotel or in a short-term rental with their family and their belongings.

Midterm rentals help bridge the gap during wait times. They allow for a comfortable stay, at affordable monthly rates, for the "in-between" when you arrive and before you find long-term housing.

<h3>What is TDY (Temporary Duty)?</h3>

TDYs are short-term assignments, usually ranging from a few weeks to several months. When on a TDY, military members attend training, work temporarily, or provide assistance at a new base. Because of TDY's temporary nature, service members need housing that is flexible in length, but more comfortable and affordable than hotels.

Midterm rentals match perfectly with TDY length, offering home-like comfort without a long lease.

<h2>The Challenges with On-base Military Lodging</h2>

**Limited availability:** Base lodging fills quickly, especially during peak PCS season. It can be hard to find a room that fits your needs or your timeline.

**Lack of flexibility:** Hotels and base lodging aren't designed for longer family stays and can be expensive for long-term stays.

**Not family-friendly:** On-base lodging often has limited space, no yard, and can be restrictive for children or pets.

**Cost & comfort trade-offs:** Hotels can get expensive and lack a "home" environment. Staying at a hotel can feel uncomfortable and unsettled.

**Distance from base:** On-base lodging may not always be conveniently located to daily needs (schools, groceries, etc.).

<h2>Why Midterm Rentals Are a Great Solution</h2>

**Flexibility in lease lengths:** Month-to-month or custom lease terms fit PCS wait times and TDY assignments. This also allows service members to avoid locking themselves into a 12-month lease when orders may change.

**Fully furnished convenience:** If you're on a TDY or need a temporary place while you wait for your long-term home, you can avoid needing to unpack or buy furniture during your move. With midterm rentals, it's convenient and easy to arrive and settle in immediately. If you would like the ability to unpack your furniture though, unfurnished midterm options are also available.

**Cost-Effective & BAH-Friendly:** Midterm rentals align with [Basic Allowance for Housing (BAH)](https://www.travel.dod.mil/Allowances/Basic-Allowance-for-Housing/), as BAH is set based on housing costs in the local market. Monthly rentals are also more affordable than extended hotel stays and provide a better value for military families managing moving budgets.

**Family & Pet-Friendly Options:** Many midterm rentals offer multiple bedrooms, kitchens, and outdoor space, which can be more suitable for families and pets than standard lodging. They also can provide more stability and a more comfortable stay than a hotel during a stressful transition period.

<h2>How MatchBook Supports Military Members</h2>

**We are 100% veteran owned:** Our [founding team](https://matchbookrentals.com/about) is made up entirely of veterans who have experienced TDY and PCS moves constantly. We've built our platform with those experiences in mind.

**Search by flexibility:** On MatchBook, it's easy to find differing lease lengths, furnished, and unfurnished rentals. We also have filters for pet friendly listings, certain desired amenities, and proximity to your chosen location (base, school, etc.).

**Streamlined booking:** Our platform allows service members to handle the entire renting process on site. It's easy to quickly find a reliable booking to match PCS/TDY timelines.

**Off-base convenience:** Book properties located near bases but with the comfort and benefit of living in the community.

**Vetted listings:** Listings on MatchBook are secure, safe, and trustworthy options for military families.

<h2>In the End</h2>

PCS and TDY moves don't have to be stressful when flexible housing options like midterm rentals are accessible. Midterm rentals allow service members to find comfort, affordability, and adaptability in their stay that matches the often fast-paced unpredictability of military life.

So, if you're military and looking for your next monthly stay, [browse our military-friendly midterm rentals](https://matchbookrentals.com/) today and make your next move easier.`

  try {
    const article = await prisma.blogArticle.upsert({
      where: { slug: 'military-moves-made-easy-flexible-rentals-for-pcs-and-tdy-moves' },
      update: { content },
      create: {
        slug: 'military-moves-made-easy-flexible-rentals-for-pcs-and-tdy-moves',
        title: 'Military moves made easy: Flexible rentals for PCS, and TDY moves',
        content,
        imageUrl: 'https://utfs.io/f/e1e2d82c-4646-4f18-9fe5-3ce277a07027-9zqxap.jpg',
        published: false,
        authorName: 'Daniel Resner',
        authorTitle: 'CEO',
        metaTitle: 'Military moves made easy: Flexible rentals for PCS, and TDY moves',
        metaDescription: 'Discover how midterm rentals offer flexible, affordable housing for military PCS and TDY moves. Learn why MatchBook is the veteran-owned platform built for service members.',
      },
    })

    return NextResponse.json({ success: true, articleId: article.id, slug: article.slug })
  } catch (error) {
    console.error('Failed to seed article:', error)
    return NextResponse.json({ error: 'Failed to seed article' }, { status: 500 })
  }
}

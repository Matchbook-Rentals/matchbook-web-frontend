-- Migration SQL for converting existing listings to new monthly pricing structure
-- NOTE: For PlanetScale, UUID() has caching issues and only generates UUIDv1
-- Run this migration through Prisma or application code for proper UUID generation

-- Step 1: Create monthly pricing records for all existing listings
-- This creates a pricing entry for each month between shortest and longest lease length
INSERT INTO ListingMonthlyPricing (listingId, months, price, utilitiesIncluded, createdAt, updatedAt)
SELECT
    l.id as listingId,
    m.month_num as months,
    CASE 
        WHEN l.shortestLeaseLength = l.longestLeaseLength THEN l.shortestLeasePrice
        WHEN m.month_num = l.shortestLeaseLength THEN l.shortestLeasePrice
        WHEN m.month_num = l.longestLeaseLength THEN l.longestLeasePrice
        ELSE ROUND(
            l.shortestLeasePrice - 
            ((l.shortestLeasePrice - l.longestLeasePrice) * (m.month_num - l.shortestLeaseLength) / (l.longestLeaseLength - l.shortestLeaseLength))
        )
    END as price,
    l.utilitiesIncluded as utilitiesIncluded,
    NOW() as createdAt,
    NOW() as updatedAt
FROM Listing l
CROSS JOIN (
    SELECT 1 as month_num UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL 
    SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL 
    SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12
) m
WHERE m.month_num >= l.shortestLeaseLength 
  AND m.month_num <= l.longestLeaseLength
  AND NOT EXISTS (
    SELECT 1 FROM ListingMonthlyPricing lmp 
    WHERE lmp.listingId = l.id AND lmp.months = m.month_num
  );

-- Step 2: Handle edge cases - listings with NULL or 0 pricing
UPDATE ListingMonthlyPricing lmp
JOIN Listing l ON lmp.listingId = l.id
SET lmp.price = 2000
WHERE lmp.price IS NULL OR lmp.price <= 0;

-- Step 3: Validation queries to check migration results

-- Check total records created
SELECT 
    COUNT(*) as total_monthly_pricing_records,
    COUNT(DISTINCT listingId) as unique_listings_with_pricing
FROM ListingMonthlyPricing;

-- Check pricing distribution
SELECT 
    months,
    COUNT(*) as listing_count,
    MIN(price) as min_price,
    MAX(price) as max_price,
    AVG(price) as avg_price
FROM ListingMonthlyPricing
GROUP BY months
ORDER BY months;

-- Verify all listings have pricing records
SELECT 
    l.id,
    l.title,
    l.shortestLeaseLength,
    l.longestLeaseLength,
    l.shortestLeasePrice,
    l.longestLeasePrice,
    COUNT(lmp.id) as pricing_records_count
FROM Listing l
LEFT JOIN ListingMonthlyPricing lmp ON l.id = lmp.listingId
GROUP BY l.id, l.title, l.shortestLeaseLength, l.longestLeaseLength, l.shortestLeasePrice, l.longestLeasePrice
HAVING pricing_records_count = 0
ORDER BY l.createdAt DESC;

-- Check for any invalid pricing data
SELECT 
    lmp.*,
    l.title,
    l.shortestLeaseLength,
    l.longestLeaseLength
FROM ListingMonthlyPricing lmp
JOIN Listing l ON lmp.listingId = l.id
WHERE lmp.price <= 0 
   OR lmp.months < 1 
   OR lmp.months > 12
   OR lmp.months < l.shortestLeaseLength 
   OR lmp.months > l.longestLeaseLength;
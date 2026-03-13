-- How many listings within 100 miles of Miami (any status)
-- Miami coords: 25.7617, -80.1918
SELECT COUNT(*) AS miami_area_total
FROM Listing l
WHERE l.deletedAt IS NULL
  AND l.latitude != 0
  AND l.longitude != 0
  AND (3959 * acos(
    cos(radians(25.7617)) * cos(radians(l.latitude)) *
    cos(radians(l.longitude) - radians(-80.1918)) +
    sin(radians(25.7617)) * sin(radians(l.latitude))
  )) <= 100;

-- How many listings within 100 miles of Miami satisfy all homepage display requirements
-- (approved, active, not deleted, has monthly pricing)
SELECT COUNT(*) AS miami_area_qualified
FROM Listing l
WHERE l.deletedAt IS NULL
  AND l.approvalStatus = 'approved'
  AND l.markedActiveByUser = true
  AND l.latitude != 0
  AND l.longitude != 0
  AND (3959 * acos(
    cos(radians(25.7617)) * cos(radians(l.latitude)) *
    cos(radians(l.longitude) - radians(-80.1918)) +
    sin(radians(25.7617)) * sin(radians(l.latitude))
  )) <= 100
  AND EXISTS (
    SELECT 1 FROM ListingMonthlyPricing lmp
    WHERE lmp.listingId = l.id
  );

-- Diagnostic: show the 2 Miami-area listings and why they might be excluded
SELECT
  l.id,
  l.city,
  l.state,
  l.approvalStatus,
  l.markedActiveByUser,
  l.deletedAt,
  l.latitude,
  l.longitude,
  (SELECT COUNT(*) FROM ListingMonthlyPricing lmp WHERE lmp.listingId = l.id) AS monthlyPricingCount,
  (3959 * acos(
    cos(radians(25.7617)) * cos(radians(l.latitude)) *
    cos(radians(l.longitude) - radians(-80.1918)) +
    sin(radians(25.7617)) * sin(radians(l.latitude))
  )) AS distance_miles
FROM Listing l
WHERE l.deletedAt IS NULL
  AND l.latitude != 0
  AND l.longitude != 0
  AND (3959 * acos(
    cos(radians(25.7617)) * cos(radians(l.latitude)) *
    cos(radians(l.longitude) - radians(-80.1918)) +
    sin(radians(25.7617)) * sin(radians(l.latitude))
  )) <= 100;

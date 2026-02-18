-- ============================================================================
-- Fix non-canonical category values on Listing table
-- Expected bad values: 'Single Family', 'Apartment', 'Private Room', 'Townhouse'
-- Canonical values:    'singleFamily', 'apartment', 'privateRoom', 'townhouse'
-- ============================================================================

-- STEP 1: Pre-migration snapshot
SELECT BINARY category as category, COUNT(*) as cnt
FROM Listing
GROUP BY BINARY category
ORDER BY cnt DESC;

-- STEP 2: Apply fixes (verify rows affected match bad counts from Step 1)
UPDATE Listing SET category = 'singleFamily' WHERE BINARY category = 'Single Family';
UPDATE Listing SET category = 'apartment' WHERE BINARY category = 'Apartment';
UPDATE Listing SET category = 'privateRoom' WHERE BINARY category = 'Private Room';
UPDATE Listing SET category = 'townhouse' WHERE BINARY category = 'Townhouse';

-- STEP 3: Post-migration verification (should only show 4 canonical values + null)
SELECT BINARY category as category, COUNT(*) as cnt
FROM Listing
GROUP BY BINARY category
ORDER BY cnt DESC;

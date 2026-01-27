-- Query to show verification status for user with last name "parrent"
-- Shows all verifications for the user

SELECT
  u.id,
  u.firstName,
  u.lastName,
  u.email,
  u.verifiedAt,
  u.medallionVerificationStatus,
  u.stripeVerificationStatus,
  v.id AS verification_id,
  v.status AS verification_status,
  v.creditBucket,
  v.creditStatus,
  v.screeningDate,
  v.validUntil,
  v.createdAt AS verification_created
FROM User u
LEFT JOIN Verification v ON v.userId = u.id
WHERE LOWER(u.lastName) = 'parrent';


-- Query to check Stripe Connect account status (important for debugging identity verification)

SELECT
  id,
  firstName,
  lastName,
  stripeAccountId,
  stripeChargesEnabled,
  stripePayoutsEnabled,
  stripeDetailsSubmitted,
  stripeAccountStatus
FROM User
WHERE LOWER(lastName) = 'parrent';


-- Query to show only the most recent verification for the user

SELECT
  u.id,
  u.firstName,
  u.lastName,
  u.email,
  v.status AS verification_status,
  v.creditBucket,
  v.screeningDate,
  v.validUntil
FROM User u
LEFT JOIN Verification v ON v.userId = u.id
WHERE LOWER(u.lastName) = 'parrent'
ORDER BY v.createdAt DESC
LIMIT 1;

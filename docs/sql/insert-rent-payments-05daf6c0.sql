-- ============================================
-- RentPayment Corrections for Booking: 05daf6c0-bfaa-4cf1-b1cb-3d9751807613
-- ============================================

-- ============================================
-- STEP 1: Remove erroneous ~$500 payments
-- ============================================

DELETE FROM RentPayment
WHERE id IN (
  'cmkeqv19p0009d28qvcbb57hu',  -- $564.84 payment due 2026-01-15 (created in error)
  'cmkeqv19o0007d28qos7s6o56'   -- $551.78 payment due 2026-02-01 (created in error)
);

-- ============================================
-- STEP 2: Insert prorated January payment
-- ============================================

-- Prorated for Jan 15-31 (17 days out of 31)
-- Base rent: $1000 × (17/31) = $548.39 (54839 cents)
-- Service fee: $15 × (17/31) = $8.23 (823 cents)
-- Total: $556.62 (55662 cents)

INSERT INTO RentPayment (
  id,
  bookingId,
  amount,
  totalAmount,
  baseAmount,
  dueDate,
  status,
  isPaid,
  type,
  createdAt,
  updatedAt
) VALUES (
  'cm5rp000jan2026rent00000',
  '05daf6c0-bfaa-4cf1-b1cb-3d9751807613',
  55662,
  55662,
  54839,
  '2026-01-15 00:00:00',
  'PENDING',
  false,
  'MONTHLY_RENT',
  NOW(),
  NOW()
);

-- ============================================
-- STEP 3: Update existing Feb-June payments
-- ============================================

-- Fix baseAmount to be $1000 (100000 cents) - rent only, without service fee
-- totalAmount stays at $1015 (101500 cents) - rent + $15 service fee

UPDATE RentPayment
SET baseAmount = 100000, updatedAt = NOW()
WHERE id IN (
  'cm5rp001feb2026rent00001',  -- February 2026
  'cm5rp002mar2026rent00002',  -- March 2026
  'cm5rp003apr2026rent00003',  -- April 2026
  'cm5rp004may2026rent00004',  -- May 2026
  'cm5rp005jun2026rent00005'   -- June 2026
);

-- ============================================
-- STEP 4: Change due dates to 1st of month
-- ============================================

-- Move Feb-June payments from 15th to 1st of each month

UPDATE RentPayment SET dueDate = '2026-02-01 00:00:00', updatedAt = NOW() WHERE id = 'cm5rp001feb2026rent00001';
UPDATE RentPayment SET dueDate = '2026-03-01 00:00:00', updatedAt = NOW() WHERE id = 'cm5rp002mar2026rent00002';
UPDATE RentPayment SET dueDate = '2026-04-01 00:00:00', updatedAt = NOW() WHERE id = 'cm5rp003apr2026rent00003';
UPDATE RentPayment SET dueDate = '2026-05-01 00:00:00', updatedAt = NOW() WHERE id = 'cm5rp004may2026rent00004';
UPDATE RentPayment SET dueDate = '2026-06-01 00:00:00', updatedAt = NOW() WHERE id = 'cm5rp005jun2026rent00005';

-- ============================================
-- STEP 5: Insert prorated July payment
-- ============================================

-- Prorated for Jul 1-15 (15 days out of 31)
-- Base rent: $1000 × (15/31) = $483.87 (48387 cents)
-- Service fee: $1000 × 1.5% × (15/31) = $7.26 (726 cents)
-- Total: $491.13 (49113 cents)

INSERT INTO RentPayment (
  id,
  bookingId,
  amount,
  totalAmount,
  baseAmount,
  dueDate,
  status,
  isPaid,
  type,
  createdAt,
  updatedAt
) VALUES (
  'cm5rp006jul2026rent00006',
  '05daf6c0-bfaa-4cf1-b1cb-3d9751807613',
  49113,
  49113,
  48387,
  '2026-07-01 00:00:00',
  'PENDING',
  false,
  'MONTHLY_RENT',
  NOW(),
  NOW()
);

-- ============================================
-- STEP 6: Update all payment times to 9am UTC
-- ============================================

-- Cron runs at 3am EST (8am UTC), so 9am UTC ensures payments are found
-- Time doesn't affect cron matching (uses calendar date range), but 9am UTC is cleaner

UPDATE RentPayment SET dueDate = '2026-01-15 09:00:00', updatedAt = NOW() WHERE id = 'cm5rp000jan2026rent00000';
UPDATE RentPayment SET dueDate = '2026-02-01 09:00:00', updatedAt = NOW() WHERE id = 'cm5rp001feb2026rent00001';
UPDATE RentPayment SET dueDate = '2026-03-01 09:00:00', updatedAt = NOW() WHERE id = 'cm5rp002mar2026rent00002';
UPDATE RentPayment SET dueDate = '2026-04-01 09:00:00', updatedAt = NOW() WHERE id = 'cm5rp003apr2026rent00003';
UPDATE RentPayment SET dueDate = '2026-05-01 09:00:00', updatedAt = NOW() WHERE id = 'cm5rp004may2026rent00004';
UPDATE RentPayment SET dueDate = '2026-06-01 09:00:00', updatedAt = NOW() WHERE id = 'cm5rp005jun2026rent00005';
UPDATE RentPayment SET dueDate = '2026-07-01 09:00:00', updatedAt = NOW() WHERE id = 'cm5rp006jul2026rent00006';

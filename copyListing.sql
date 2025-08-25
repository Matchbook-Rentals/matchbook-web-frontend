-- Copy listing from one user to another with all related data
-- Source user: user_31bpsKjK5qIQx3zNg3cWZYfpdU2
-- Target user: user_2x4CypV8imcBLrCzqoeJGiKjWa4

-- First, set variables for the source and target users
SET @source_user = 'user_31bpsKjK5qIQx3zNg3cWZYfpdU2';
SET @target_user = 'user_2x4CypV8imcBLrCzqoeJGiKjWa4';
SET @source_listing_id = (SELECT id FROM Listing WHERE userId = @source_user LIMIT 1);

-- Step 1: Copy the listing with a new UUID and new userId
INSERT INTO Listing (
    id, isApproved, approvalStatus, isTestListing, createdAt, lastModified,
    lastApprovalDecision, lastDecisionComment, status, title, description,
    imageSrc, category, roomCount, bathroomCount, guestCount, latitude, longitude,
    locationString, city, state, streetAddress1, streetAddress2, postalCode,
    userId, squareFootage, depositSize, petDeposit, petRent, reservationDeposit,
    rentDueAtBooking, requireBackgroundCheck, shortestLeaseLength, longestLeaseLength,
    shortestLeasePrice, longestLeasePrice, furnished, utilitiesIncluded, petsAllowed,
    markedActiveByUser, airConditioner, laundryFacilities, fitnessCenter, elevator,
    wheelchairAccess, doorman, parking, wifi, kitchen, dedicatedWorkspace, hairDryer,
    iron, heater, hotTub, smokingAllowed, eventsAllowed, privateEntrance, security,
    waterfront, beachfront, mountainView, cityView, waterView, washerInUnit,
    washerHookup, washerNotAvailable, washerInComplex, dryerInUnit, dryerHookup,
    dryerNotAvailable, dryerInComplex, offStreetParking, streetParking,
    streetParkingFree, coveredParking, coveredParkingFree, uncoveredParking,
    uncoveredParkingFree, garageParking, garageParkingFree, evCharging, allowDogs,
    allowCats, gym, balcony, patio, sunroom, fireplace, firepit, pool, sauna,
    jacuzzi, grill, oven, stove, wheelAccessible, fencedInYard, secureLobby,
    keylessEntry, alarmSystem, storageShed, gatedEntry, smokeDetector, carbonMonoxide,
    garbageDisposal, dishwasher, fridge, tv, workstation, microwave, kitchenEssentials,
    linens, privateBathroom, hospitablePropertyId, moveInPropertyAccess,
    moveInParkingInfo, moveInWifiInfo, moveInOtherNotes, tripId, boldSignTemplateId
)
SELECT 
    UUID() as id, isApproved, approvalStatus, isTestListing, NOW() as createdAt, NOW() as lastModified,
    lastApprovalDecision, lastDecisionComment, status, CONCAT(title, ' (Copy)') as title, description,
    imageSrc, category, roomCount, bathroomCount, guestCount, latitude, longitude,
    locationString, city, state, streetAddress1, streetAddress2, postalCode,
    @target_user as userId, squareFootage, depositSize, petDeposit, petRent, reservationDeposit,
    rentDueAtBooking, requireBackgroundCheck, shortestLeaseLength, longestLeaseLength,
    shortestLeasePrice, longestLeasePrice, furnished, utilitiesIncluded, petsAllowed,
    markedActiveByUser, airConditioner, laundryFacilities, fitnessCenter, elevator,
    wheelchairAccess, doorman, parking, wifi, kitchen, dedicatedWorkspace, hairDryer,
    iron, heater, hotTub, smokingAllowed, eventsAllowed, privateEntrance, security,
    waterfront, beachfront, mountainView, cityView, waterView, washerInUnit,
    washerHookup, washerNotAvailable, washerInComplex, dryerInUnit, dryerHookup,
    dryerNotAvailable, dryerInComplex, offStreetParking, streetParking,
    streetParkingFree, coveredParking, coveredParkingFree, uncoveredParking,
    uncoveredParkingFree, garageParking, garageParkingFree, evCharging, allowDogs,
    allowCats, gym, balcony, patio, sunroom, fireplace, firepit, pool, sauna,
    jacuzzi, grill, oven, stove, wheelAccessible, fencedInYard, secureLobby,
    keylessEntry, alarmSystem, storageShed, gatedEntry, smokeDetector, carbonMonoxide,
    garbageDisposal, dishwasher, fridge, tv, workstation, microwave, kitchenEssentials,
    linens, privateBathroom, NULL as hospitablePropertyId, moveInPropertyAccess,
    moveInParkingInfo, moveInWifiInfo, moveInOtherNotes, tripId, boldSignTemplateId
FROM Listing
WHERE id = @source_listing_id;

-- Get the ID of the newly created listing
SET @new_listing_id = LAST_INSERT_ID();

-- Step 2: Copy the monthly pricing data
INSERT INTO ListingMonthlyPricing (id, listingId, months, price, utilitiesIncluded, createdAt, updatedAt)
SELECT 
    UUID() as id,
    @new_listing_id as listingId,
    months,
    price,
    utilitiesIncluded,
    NOW() as createdAt,
    NOW() as updatedAt
FROM ListingMonthlyPricing
WHERE listingId = @source_listing_id;

-- Step 3: Copy the listing images
INSERT INTO ListingImage (id, url, listingId, category, `rank`)
SELECT 
    UUID() as id,
    url,
    @new_listing_id as listingId,
    category,
    `rank`
FROM ListingImage
WHERE listingId = @source_listing_id;

-- Step 4: Copy the bedrooms (if any)
INSERT INTO Bedroom (id, listingId, bedroomNumber, bedType)
SELECT 
    UUID() as id,
    @new_listing_id as listingId,
    bedroomNumber,
    bedType
FROM Bedroom
WHERE listingId = @source_listing_id;

-- Verification: Show both listings with their related data counts
SELECT 
    'Original Listing' as type,
    id,
    title,
    userId,
    (SELECT COUNT(*) FROM ListingMonthlyPricing WHERE listingId = @source_listing_id) as pricing_count,
    (SELECT COUNT(*) FROM ListingImage WHERE listingId = @source_listing_id) as image_count,
    (SELECT COUNT(*) FROM Bedroom WHERE listingId = @source_listing_id) as bedroom_count
FROM Listing 
WHERE id = @source_listing_id
UNION ALL
SELECT 
    'Copied Listing' as type,
    id,
    title,
    userId,
    (SELECT COUNT(*) FROM ListingMonthlyPricing WHERE listingId = @new_listing_id) as pricing_count,
    (SELECT COUNT(*) FROM ListingImage WHERE listingId = @new_listing_id) as image_count,
    (SELECT COUNT(*) FROM Bedroom WHERE listingId = @new_listing_id) as bedroom_count
FROM Listing 
WHERE id = @new_listing_id;
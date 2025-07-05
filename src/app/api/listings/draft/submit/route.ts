import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prismadb';

// Convert draft to listing
export async function POST(request: Request) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { draftId, listingImages, monthlyPricing } = body;
    
    if (!draftId) {
      return NextResponse.json({ error: 'Draft ID required' }, { status: 400 });
    }
    
    // Fetch the draft with images
    const draft = await prisma.listingInCreation.findFirst({
      where: {
        id: draftId,
        userId
      },
      include: {
        listingImages: {
          orderBy: { rank: 'asc' }
        }
      }
    });
    
    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }
    
    // Create listing from draft in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the listing with all fields from draft
      const listing = await tx.listing.create({
        data: {
          // Copy all fields from draft, excluding id and timestamps
          title: draft.title || 'Untitled Listing',
          description: draft.description || '',
          status: 'available',
          approvalStatus: 'pendingReview',
          imageSrc: draft.imageSrc,
          category: draft.category,
          roomCount: draft.roomCount || 1,
          bathroomCount: draft.bathroomCount || 1,
          guestCount: draft.guestCount || draft.roomCount || 1,
          latitude: draft.latitude || 0,
          longitude: draft.longitude || 0,
          locationString: draft.locationString,
          city: draft.city,
          state: draft.state,
          streetAddress1: draft.streetAddress1,
          streetAddress2: draft.streetAddress2,
          postalCode: draft.postalCode,
          userId: draft.userId || userId,
          squareFootage: draft.squareFootage || 0,
          depositSize: draft.depositSize || 0,
          petDeposit: draft.petDeposit || 0,
          petRent: draft.petRent || 0,
          reservationDeposit: draft.reservationDeposit || 0,
          requireBackgroundCheck: draft.requireBackgroundCheck || false,
          shortestLeaseLength: draft.shortestLeaseLength || 1,
          longestLeaseLength: draft.longestLeaseLength || 12,
          shortestLeasePrice: draft.shortestLeasePrice || 0,
          longestLeasePrice: draft.longestLeasePrice || 0,
          furnished: draft.furnished || false,
          utilitiesIncluded: draft.utilitiesIncluded || false,
          petsAllowed: draft.petsAllowed || false,
          
          // Copy all amenities
          airConditioner: draft.airConditioner || false,
          laundryFacilities: draft.laundryFacilities || false,
          fitnessCenter: draft.fitnessCenter || false,
          elevator: draft.elevator || false,
          wheelchairAccess: draft.wheelchairAccess || false,
          doorman: draft.doorman || false,
          parking: draft.parking || false,
          wifi: draft.wifi || false,
          kitchen: draft.kitchen || false,
          dedicatedWorkspace: draft.dedicatedWorkspace || false,
          hairDryer: draft.hairDryer || false,
          iron: draft.iron || false,
          heater: draft.heater || false,
          hotTub: draft.hotTub || false,
          smokingAllowed: draft.smokingAllowed || false,
          eventsAllowed: draft.eventsAllowed || false,
          privateEntrance: draft.privateEntrance || false,
          security: draft.security || false,
          waterfront: draft.waterfront || false,
          beachfront: draft.beachfront || false,
          mountainView: draft.mountainView || false,
          cityView: draft.cityView || false,
          waterView: draft.waterView || false,
          washerInUnit: draft.washerInUnit || false,
          washerHookup: draft.washerHookup || false,
          washerNotAvailable: draft.washerNotAvailable || false,
          washerInComplex: draft.washerInComplex || false,
          dryerInUnit: draft.dryerInUnit || false,
          dryerHookup: draft.dryerHookup || false,
          dryerNotAvailable: draft.dryerNotAvailable || false,
          dryerInComplex: draft.dryerInComplex || false,
          offStreetParking: draft.offStreetParking || false,
          streetParking: draft.streetParking || false,
          streetParkingFree: draft.streetParkingFree || false,
          coveredParking: draft.coveredParking || false,
          coveredParkingFree: draft.coveredParkingFree || false,
          uncoveredParking: draft.uncoveredParking || false,
          uncoveredParkingFree: draft.uncoveredParkingFree || false,
          garageParking: draft.garageParking || false,
          garageParkingFree: draft.garageParkingFree || false,
          evCharging: draft.evCharging || false,
          allowDogs: draft.allowDogs || false,
          allowCats: draft.allowCats || false,
          gym: draft.gym || false,
          balcony: draft.balcony || false,
          patio: draft.patio || false,
          sunroom: draft.sunroom || false,
          fireplace: draft.fireplace || false,
          firepit: draft.firepit || false,
          pool: draft.pool || false,
          sauna: draft.sauna || false,
          jacuzzi: draft.jacuzzi || false,
          grill: draft.grill || false,
          oven: draft.oven || false,
          stove: draft.stove || false,
          wheelAccessible: draft.wheelAccessible || false,
          fencedInYard: draft.fencedInYard || false,
          secureLobby: draft.secureLobby || false,
          keylessEntry: draft.keylessEntry || false,
          alarmSystem: draft.alarmSystem || false,
          storageShed: draft.storageShed || false,
          gatedEntry: draft.gatedEntry || false,
          smokeDetector: draft.smokeDetector || false,
          carbonMonoxide: draft.carbonMonoxide || false,
          garbageDisposal: draft.garbageDisposal || false,
          dishwasher: draft.dishwasher || false,
          fridge: draft.fridge || false,
          tv: draft.tv || false,
          workstation: draft.workstation || false,
          microwave: draft.microwave || false,
          kitchenEssentials: draft.kitchenEssentials || false,
          linens: draft.linens || false,
          privateBathroom: draft.privateBathroom || false,
        },
      });
      
      // Handle listing images - use provided ones or existing ones from draft
      const imagesToCreate = listingImages && listingImages.length > 0 
        ? listingImages 
        : draft.listingImages || [];
      
      if (imagesToCreate.length > 0) {
        await tx.listingImage.createMany({
          data: imagesToCreate.map((image: any) => ({
            url: image.url,
            listingId: listing.id,
            category: image.category || null,
            rank: image.rank || null,
          })),
        });
      }
      
      // Create monthly pricing if provided
      if (monthlyPricing && monthlyPricing.length > 0) {
        await tx.listingMonthlyPricing.createMany({
          data: monthlyPricing.map((pricing: any) => ({
            listingId: listing.id,
            months: pricing.months,
            price: pricing.price || 0,
            utilitiesIncluded: pricing.utilitiesIncluded || false,
          })),
        });
      }
      
      // Delete the draft after successful creation
      await tx.listingInCreation.delete({
        where: { id: draftId }
      });
      
      return listing;
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] Error submitting draft:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to submit draft' },
      { status: 500 }
    );
  }
}
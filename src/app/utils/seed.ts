
function generateRandomListings(count = 200) {
  const listings = [];



  // Please replace this logic with a fx so that I may call it in a loop and get different result. Please one for washer and one for dryer


  for (let i = 0; i < count; i++) {

    let washerInUnit = false;
    let washerHookup = false;
    let washerNotAvailable = false;
    let washerInComplex = false;

    let dryerInUnit = false;
    let dryerHookup = false;
    let dryerNotAvailable = false;
    let dryerInComplex = false;

    let shortestLeaseLength = Math.floor(Math.random() * 12) + 1;

    let longestLeaseLength = Math.floor(Math.random() * (12 - shortestLeaseLength + 1)) + shortestLeaseLength;


    if (Math.random() < 0.6) {
      washerInUnit = true;
    } else if (Math.random() < 0.8) {
      washerHookup = true;
    } else if (Math.random() < 0.9) {
      washerNotAvailable = true;
    } else {
      washerInComplex = true;
    }

    if (Math.random() < 0.6) {
      dryerInUnit = true;
    } else if (Math.random() < 0.8) {
      dryerHookup = true;
    } else if (Math.random() < 0.9) {
      dryerNotAvailable = true;
    } else {
      dryerInComplex = true;
    }

    const listing = {
      title: generateRandomTitle(),
      description: generateRandomDescription(),
      imageSrc: "",
      category: getRandomElement(["single_family", "apartment", "condo", "townhouse"]),
      roomCount: getRandomInt(1, 5),
      bathroomCount: getRandomInt(1, 4),
      guestCount: getRandomInt(0, 6),
      latitude: 40.7128,
      longitude: -74.0060,
      locationString: generateRandomAddress(),
      city: "",
      state: "",
      streetAddress1: "",
      streetAddress2: "",
      postalCode: "",
      squareFootage: getRandomInt(500, 3000),
      depositSize: getRandomInt(500, 5000),
      requireBackgroundCheck: Math.random() < 0.7,
      furnished: Math.random() < 0.3,
      airConditioning: Math.random() < 0.8,
      laundryFacilities: Math.random() < 0.6,
      fitnessCenter: Math.random() < 0.3,
      pool: Math.random() < 0.2,
      dishwasher: Math.random() < 0.7,
      elevator: Math.random() < 0.2,
      wheelchairAccess: Math.random() < 0.3,
      doorman: Math.random() < 0.1,
      parking: Math.random() < 0.6,
      fireplace: Math.random() < 0.2,
      wifi: Math.random() < 0.9,
      kitchen: Math.random() < 0.95,
      washerInUnit: washerInUnit,
      washerHookup: washerHookup,
      washerNotAvailable: washerNotAvailable,
      washerInComplex: washerInComplex,
      dryerInUnit: dryerInUnit,
      dryerHookup: dryerHookup,
      dryerNotAvailable: dryerNotAvailable,
      dryerInComplex: dryerInComplex,
      dedicatedWorkspace: Math.random() < 0.4,
      tv: Math.random() < 0.7,
      hairDryer: Math.random() < 0.8,
      iron: Math.random() < 0.7,
      heating: Math.random() < 0.9,
      hotTub: Math.random() < 0.1,
      gym: Math.random() < 0.2,
      petsAllowed: Math.random() < 0.5,
      smokingAllowed: Math.random() < 0.2,
      eventsAllowed: Math.random() < 0.3,
      privateEntrance: Math.random() < 0.4,
      secure: Math.random() < 0.6,
      waterfront: Math.random() < 0.1,
      beachfront: Math.random() < 0.05,
      mountainView: Math.random() < 0.1,
      streetParking: Math.random() < 0.7,
      streetParkingFree: Math.random() < 0.5,
      coveredParking: Math.random() < 0.3,
      coveredParkingFree: Math.random() < 0.1,
      uncoveredParking: Math.random() < 0.4,
      uncoveredParkingFree: Math.random() < 0.2,
      garageParking: Math.random() < 0.3,
      garageParkingFree: Math.random() < 0.1,
      allowDogs: Math.random() < 0.4,
      allowCats: Math.random() < 0.5,
      bedrooms: generateRandomBedrooms(),
      listingImages: generateRandomListingImages(),
      // Please helm me ensure that longestLeaseLength is longer than shortestLeaseLength
      shortestLeaseLength: shortestLeaseLength,
      shortestLeasePrice: getRandomInt(1500, 3500),
      longestLeaseLength: longestLeaseLength,
      longestLeasePrice: getRandomInt(1000, 3000),
      privateBathroom: Math.random() < 0.8,
      balcony: Math.random() < 0.4
    };

    listings.push(listing);
  }

  return listings;
}


function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function generateRandomTitle() {
  const adjectives = ["Cozy", "Spacious", "Modern", "Charming", "Luxurious"];
  const types = ["Apartment", "House", "Condo", "Loft", "Studio"];
  const features = ["with View", "in the Heart of the City", "Near Park", "with Parking", ""];
  return `${getRandomElement(adjectives)} ${getRandomElement(types)} ${getRandomElement(features)}`;
}

function generateRandomDescription() {
  const descriptions = [
    "A wonderful place to call home!",
    "Perfect for those who love city living.",
    "Enjoy the peaceful surroundings in this comfortable space.",
    "Modern amenities meet classic charm in this unique property.",
    "Ideal for professionals or small families."
  ];
  return getRandomElement(descriptions);
}

function generateRandomAddress() {
  const streetNumbers = ["123", "456", "789", "1010", "2222"];
  const streetNames = ["Main St", "Oak Ave", "Maple Rd", "Broadway", "Park Ln"];
  const cities = ["New York"];
  const states = ["NY", "CA", "IL", "TX", "AZ"];
  return `${getRandomElement(streetNumbers)} ${getRandomElement(streetNames)}, ${getRandomElement(cities)}, ${getRandomElement(states)}`;
}

function generateRandomBedrooms() {
  const bedTypes = ["twin", "full", "queen", "king"];
  const bedroomCount = getRandomInt(1, 4);
  const bedrooms = [];

  for (let i = 1; i <= bedroomCount; i++) {
    bedrooms.push({
      bedType: getRandomElement(bedTypes),
      bedroomNumber: i
    });
  }

  return bedrooms;
}

function generateRandomCategory() {
    const categories = ['General', 'Bedroom 1', 'Miscellaneous'];
    const randomIndex = Math.floor(Math.random() * categories.length);
    return categories[randomIndex];
}

function generateRandomListingImages() {
  const imageCount = getRandomInt(1, 5);
  const images = [];

  for (let i = 0; i < imageCount; i++) {
    images.push({
      url: `/placeholderImages/image_${i + 1}.jpg`,
      category: generateRandomCategory(),
      rank: i
    });
  }

  return images;
}

export default generateRandomListings

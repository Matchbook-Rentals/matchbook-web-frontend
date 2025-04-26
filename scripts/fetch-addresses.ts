// Use require for CommonJS compatibility with ts-node in this project setup
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Define the structure for an address object
interface Address {
  street?: string;
  housenumber?: string;
  city?: string;
  postcode?: string;
  lat?: number;
  lon?: number;
}

// Overpass API endpoint
const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter';
const MAX_ADDRESSES = 1000;

// Function to fetch addresses
async function fetchAddresses(cityName: string): Promise<Address[]> {
  console.log(`Fetching addresses for ${cityName}...`);

  // Overpass QL query to find nodes/ways with addresses in the specified city
  // This query first finds the administrative boundary for the city (adjust admin_level if needed)
  // Then searches for elements with housenumber and street tags within that area.
  const query = `
    [out:json][timeout:60];
    area["name"="${cityName}"]["admin_level"="8"]->.searchArea; // Assuming admin_level=8 for cities in many regions
    (
      node["addr:housenumber"]["addr:street"](area.searchArea);
      way["addr:housenumber"]["addr:street"](area.searchArea);
      // relation["addr:housenumber"]["addr:street"](area.searchArea); // Optionally include relations
    );
    out center ${MAX_ADDRESSES};
  `;
  // Using 'out center' gets the center point coordinates for ways/relations

  try {
    const response = await axios.post(OVERPASS_API_URL, query, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    if (response.status !== 200) {
      throw new Error(`Overpass API request failed with status ${response.status}`);
    }

    const data = response.data;
    const addresses: Address[] = [];

    if (data && data.elements) {
      for (const element of data.elements) {
        if (addresses.length >= MAX_ADDRESSES) break;

        const tags = element.tags;
        if (tags && tags['addr:housenumber'] && tags['addr:street']) {
          const address: Address = {
            street: tags['addr:street'],
            housenumber: tags['addr:housenumber'],
            city: tags['addr:city'] || cityName, // Use provided city name if tag is missing
            postcode: tags['addr:postcode'],
          };

          // Get coordinates (use center for ways/relations, direct for nodes)
          if (element.type === 'node') {
            address.lat = element.lat;
            address.lon = element.lon;
          } else if (element.center) {
            address.lat = element.center.lat;
            address.lon = element.center.lon;
          }

          addresses.push(address);
        }
      }
    }

    console.log(`Found ${addresses.length} addresses.`);
    return addresses;

  } catch (error: any) {
    console.error('Error fetching addresses from Overpass API:');
    // Check if it's an Axios error (note: axios.isAxiosError might not work directly with require)
    // A more robust check might be needed depending on the error structure
    if (error.isAxiosError) {
      console.error('Status:', error.response?.status);
      console.error('Data:', error.response?.data);
    } else {
      console.error(error.message);
    }
    // Try a simpler query if the area search failed (e.g., city name ambiguity)
    // Note: This requires knowing the bounding box, which is harder without another API.
    // For simplicity, we'll just return an empty array on error here.
    console.warn('Could not fetch addresses using area search. Check city name and admin_level or Overpass API status.');
    return [];
  }
}

// Main execution block
async function main() {
  const args = process.argv.slice(2);
  if (args.length !== 1) {
    console.error('Usage: ts-node scripts/fetch-addresses.ts <CityName>');
    process.exit(1);
  }

  const cityName = args[0];
  const addresses = await fetchAddresses(cityName);

  if (addresses.length > 0) {
    const outputFileName = `${cityName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_addresses.json`;
    const outputPath = path.join(process.cwd(), outputFileName); // Write to current directory

    try {
      fs.writeFileSync(outputPath, JSON.stringify(addresses, null, 2));
      console.log(`Successfully wrote ${addresses.length} addresses to ${outputPath}`);
    } catch (writeError: any) {
      console.error(`Error writing addresses to file ${outputPath}:`, writeError.message);
    }
  } else {
    console.log('No addresses found or an error occurred, file not written.');
  }
}

main().catch((err) => {
  console.error('Script execution failed:', err);
  process.exit(1);
});

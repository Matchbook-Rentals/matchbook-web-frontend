//Imports
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { Trip } from "@prisma/client";

interface TripCardSmallProps {
  trip: Trip;
  stateCode: string;
}

// Here's a function that takes a two-letter state code and returns the URL for that state's flag from Wikipedia Commons in TypeScript:

function getStateFlagUrl(stateCode: string): string {
  // Convert the state code to uppercase to ensure consistency
  const upperStateCode = stateCode.toUpperCase();

  // Create a mapping of state codes to their full names
  const stateNames: { [key: string]: string } = {
    AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
    CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
    HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
    KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
    MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri",
    MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New_Hampshire", NJ: "New_Jersey",
    NM: "New_Mexico", NY: "New_York", NC: "North_Carolina", ND: "North_Dakota", OH: "Ohio",
    OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode_Island", SC: "South_Carolina",
    SD: "South_Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
    VA: "Virginia", WA: "Washington", WV: "West_Virginia", WI: "Wisconsin", WY: "Wyoming"
  };

  // Check if the state code is valid
  if (!stateNames.hasOwnProperty(upperStateCode)) {
    console.log("Invalid state code");
    return `https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_the_United_States.svg`;
  }

  // Get the full state name
  const stateName = stateNames[upperStateCode];

  // Construct the Wikipedia Commons URL for the state flag
  const flagUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_${stateName}.svg`;

  return flagUrl;
}

const TripCardSmall: React.FC<TripCardSmallProps> = ({ trip, stateCode }) => {
  //State Items
  const [stateFlagURL, setStateFlagURL] = React.useState(getStateFlagUrl(stateCode));


  return (
    <Card className="flex overflow-hidden w-2/5 border-2">
      <div className="w-1/2 relative">
        <Image
          src={stateFlagURL}
          alt={`Flag of ${stateCode}`}
          layout="fill"
          objectFit="cover"
        />
      </div>
      <CardContent className="w-2/3 p-4">
        <div className="flex flex-col space-y-2 text-center">
          <div className="text-lg font-semibold">{trip.locationString}</div>
          <div className="text-sm text-gray-600">{`${trip.numAdults || 0} Adults, ${trip.numChildren || 0} Children, ${trip.numPets || 0} Pets`}</div>
          <div className="text-sm text-gray-600">{`${trip.startDate?.toDateString()} - ${trip.endDate?.toDateString()}`}</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TripCardSmall;

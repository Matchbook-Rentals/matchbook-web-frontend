//Imports
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { Trip } from "@prisma/client";
import { X } from "lucide-react";
import { deleteTrip } from "@/app/actions/trips";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface SearchCardSmallProps {
  trip: Trip;
  stateCode: string;
  handleClientDelete: () => void;
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

const SearchCardSmall: React.FC<SearchCardSmallProps> = ({ trip, stateCode, handleClientDelete }) => {
  const [stateFlagURL, setStateFlagURL] = React.useState(getStateFlagUrl(stateCode));
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const handleDelete = async () => {
    await deleteTrip(trip.id);
    setIsDialogOpen(false);
    handleClientDelete();
  };

  const handleXClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDialogOpen(true);
  };

  const handleCancelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDialogOpen(false);
  };

  const handleDeleteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await handleDelete();
  };

  return (
    <Card className="overflow-hidden border-0 w-60 cursor-pointer relative group">
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <div
          className="absolute top-2 left-2 z-10 p-1 rounded-full bg-black bg-opacity-50 
                     opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          onClick={handleXClick}
        >
          <X
            className="w-4 h-4 text-white hover:text-red-500 transition-colors duration-200"
          />
        </div>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this search and any open applications associated with it?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelClick}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteClick}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="h-28 relative">
        <Image
          src={stateFlagURL}
          alt={`Flag of ${stateCode}`}
          layout="fill"
          objectFit="cover"
        />
      </div>
      <CardContent className="p-4 border-0">
        <div className="flex flex-col space-y-2">
          <div className="text-xl font-semibold">{trip.locationString}</div>
          <div className="text-md text-gray-600">{`${trip.startDate?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${trip.endDate?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SearchCardSmall;
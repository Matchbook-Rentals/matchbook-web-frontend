// components/Summary.tsx
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import PropertyTypeCheckboxes from "./(summary-components)/property-type-checkboxes";
import FurnishedCheckboxes from "./(summary-components)/furnished-checkboxes";
import AddressInput from "./(summary-components)/address-input";
import InputFields from "./(summary-components)/input-fields";
import ImageDragDrop from "./(image-components)/image-drag-drop";
import { ListingImage } from "@prisma/client";
import PropertyAmenitySelect from "./property-amenities";
import CarouselButtonControls from "./carousel-button-controls";
import LeaseTermsForm from "./lease-terms-form";

interface PropertyDetails {
  locationString: string | null;
  listingImages?: ListingImage[];
  [key: string]: string | number | null | undefined | boolean | ListingImage[]; // Allowing for null or undefined to handle them explicitly
}

interface SummaryProps {
  propertyDetails: PropertyDetails;
  setPropertyDetails: (propertyDetails: PropertyDetails) => void;
  handleListingCreation: (propertyDetails: PropertyDetails) => string; // Typing the argument
  goToPrevious: () => void;
}

const Summary: React.FC<SummaryProps> = ({
  propertyDetails,
  setPropertyDetails,
  handleListingCreation,
  goToPrevious,
}) => {
  const [groupingCategories, setGroupingCategories] = React.useState<string[]>(
    [],
  ); // Initialize state
  const [listingImages, setListingImages] = React.useState<ListingImage[]>([]);
  const router = useRouter();

  useEffect(() => {
    setListingImages(propertyDetails.listingImages || []);
    const initialCategories: string[] = [];
    propertyDetails.listingImages?.forEach((image) => {
      if (image.category && !initialCategories.includes(image.category)) {
        initialCategories.push(image.category);
      }
    });
    setGroupingCategories(initialCategories);
  }, [propertyDetails.listingImages]);

  // Check if propertyDetails is empty
  const isEmpty = Object.keys(propertyDetails).length === 0;

  const handleBack = () => {
    goToPrevious();
    window.scrollTo(0, 0);
  };

  const handleSubmit = async () => {
    console.log("SUBMITTING");
    let isSuccessful = await handleListingCreation(propertyDetails);
    console.log("IS SUCCESSFUL", isSuccessful);
    if (isSuccessful === "true") {
      router.push("/platform/host-dashboard");
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-5 my-5 ">
      <h2
        onClick={() => console.log(propertyDetails)}
        className="text-2xl text-center border font-semibold text-gray-700 mb-4"
      >
        Property Details
      </h2>
      <h3 className="text-lg text-center mb-2">Property Type</h3>
      <PropertyTypeCheckboxes
        propertyDetails={propertyDetails}
        setPropertyDetails={setPropertyDetails}
      />
      <h3 className="text-lg text-center my-2">Furnished?</h3>
      <FurnishedCheckboxes
        propertyDetails={propertyDetails}
        setPropertyDetails={setPropertyDetails}
      />
      <h3 className="text-lg text-center my-2">Address</h3>
      <AddressInput
        propertyDetails={propertyDetails}
        setPropertyDetails={setPropertyDetails}
      />
      <InputFields
        propertyDetails={propertyDetails}
        setPropertyDetails={setPropertyDetails}
      />
      <h3 className="text-lg text-center my-2">Photos</h3>
      <div className="scale-75 transform origin-top p-0 m-0 -mb-16">
        {propertyDetails.listingImages &&
          propertyDetails.listingImages.length > 0 && (
            <ImageDragDrop
              listingImages={listingImages}
              setListingImages={setListingImages}
              groupingCategories={groupingCategories} // Pass state
              setGroupingCategories={setGroupingCategories}
            />
          )}
      </div>
      <h3 className="text-lg text-center my-2">Amenities</h3>
      <div className="scale-[90%] transform origin-top -mb-24">
        <PropertyAmenitySelect
          withButton={false}
          propertyDetails={propertyDetails}
          setPropertyDetails={setPropertyDetails}
        />
      </div>

      <h3 className="text-lg text-center my-2">Lease Terms</h3>
      <div className="scale-[90%] transform origin-top -mb-16">
        <LeaseTermsForm
          withButtons={false}
          propertyDetails={propertyDetails}
          setPropertyDetails={setPropertyDetails}
        />
      </div>
      <CarouselButtonControls
        onBack={handleBack}
        onNext={handleSubmit}
        backLabel="BACK"
        nextLabel="FINISH"
      />
    </div>
  );
};

export default Summary;

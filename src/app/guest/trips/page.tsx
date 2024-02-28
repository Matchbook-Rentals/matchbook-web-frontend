import ListingPhotos from "@/app/platform/trips/[tripId]/listingPhotos";
import MatchBar from "@/app/platform/trips/[tripId]/matchBar";
import PlatformNavbar from "@/components/platform-components/platformNavbar";
import PrefereceDisplay from "./preference-display";

type TripsPageProps = {
  params: { slug: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export default function TripsPage({ params, searchParams }: TripsPageProps) {
  return (
    <>
      <PlatformNavbar />
      <div className="p-2 text-xl">
        {Object.entries(searchParams).map(([key, value], index) => (
          // Handle both single string and array values for each query parameter
          <p key={index}>{`${key}: ${Array.isArray(value) ? value.join(', ') : value}`}</p>
        ))}
      </div>
      <MatchBar />
      <ListingPhotos />
      <PrefereceDisplay />
    </>
  );
}

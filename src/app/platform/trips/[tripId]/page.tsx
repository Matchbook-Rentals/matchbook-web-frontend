import PlatformNavbar from "@/components/platform-components/platformNavbar";
import MatchBar from "./matchBar";
import ListingPhotos from "./listingPhotos";


type TripsPageProps = {
  params: { tripId: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export default function TripsPage({ params, searchParams }: TripsPageProps) {
  console.log(params)
  return (
    <>
      <PlatformNavbar />
      {/* MatchBar */}
      <MatchBar />
      {/* ListingPhotos */}
      <ListingPhotos />
      {/* ListingDetails */}
    </>
  );
}

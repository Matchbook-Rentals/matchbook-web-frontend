import ListingPhotos from "@/app/app/rent/searches/[tripId]/listingPhotos";
import MatchBar from "@/app/app/rent/searches/[tripId]/matchBar";
import RenterNavbar from "@/components/platform-components/renterNavbar";
import PrefereceDisplay from "./preference-display";

type TripsPageProps = {
  params: { slug: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export default function TripsPage({ params, searchParams }: TripsPageProps) {
  return (
    <>
      <RenterNavbar />
      <MatchBar />
      <ListingPhotos />
    </>
  );
}

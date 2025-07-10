import ListingPhotos from "@/app/app/rent/searches/[tripId]/listingPhotos";
import MatchBar from "@/app/app/rent/searches/[tripId]/matchBar";
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
      <MatchBar />
      <ListingPhotos />
    </>
  );
}

type TripsPageProps = {
  params: { tripId: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export default function TripsPage({ params, searchParams }: TripsPageProps) {
  console.log(params)
  return (
    <div>
      <h1>Trips Details: {params.tripId}</h1>
    </div>
  );
}

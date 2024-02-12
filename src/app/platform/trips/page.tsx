
type TripsPageProps = {
  params: { slug: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export default function TripsPage({ params, searchParams }: TripsPageProps) {
  return (
    <div>
      <h1>Trips Details</h1>
      {/* Iterate over the searchParams object's entries and display each key-value pair */}
      {Object.entries(searchParams).map(([key, value], index) => (
        // Handle both single string and array values for each query parameter
        <p key={index}>{`${key}: ${Array.isArray(value) ? value.join(', ') : value}`}</p>
      ))}
    </div>
  );
}

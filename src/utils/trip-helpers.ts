export const getTripLocationString = (trip: any) => {
  return trip?.locationString || 'Loading...';
};
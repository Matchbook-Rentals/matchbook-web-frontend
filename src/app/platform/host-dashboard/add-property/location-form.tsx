import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export default function LocationForm() {
  const [coordinates, setCoordinates] = useState({ lat: 0, lng: 0 }); // Default coordinates (0,0)

  // Initialize map after component mounts
  React.useEffect(() => {
    const mapContainer = document.getElementById('property-location-map');
    if (!mapContainer) return;

    const map = new maplibregl.Map({
      container: mapContainer,
      style: 'https://tiles.openfreemap.org/styles/bright',
      center: [coordinates.lng, coordinates.lat],
      zoom: 2,
    });

    // Add navigation controls
    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    // Add a marker at the center
    const marker = new maplibregl.Marker({ color: '#FF0000' })
      .setLngLat([coordinates.lng, coordinates.lat])
      .addTo(map);

    // Cleanup on unmount
    return () => {
      map.remove();
    };
  }, [coordinates]);

  return (
    <main className="relative w-full max-w-[883px] h-[601px]">
      <section className="w-full h-full">
        <h1 className="font-medium text-2xl text-[#3f3f3f] font-['Poppins',Helvetica] mb-4">
          Where is your property located?
        </h1>

        <div className="w-full h-[547px] relative bg-gray-100">
          {/* Map container replaces the background image */}
          <div id="property-location-map" className="w-full h-full absolute inset-0"></div>
          
          {/* Address input overlay positioned at top */}
          <div className="absolute top-[34px] left-0 right-0 px-[107px]">
            <Card className="w-full max-w-[670px] mx-auto rounded-[30px] shadow-[0px_4px_4px_#00000040] border-none bg-white">
              <CardContent className="p-0">
                <Input
                  className="h-14 border-none shadow-none rounded-[30px] pl-10 font-['Poppins',Helvetica] font-normal text-xl text-[#3f3f3f]"
                  placeholder="Enter property address"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
}
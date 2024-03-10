'use client'
import React, { useState, useMemo } from 'react'
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';
import usePlacesAutoComplete, { getGeocode, getLatLng } from 'use-places-autocomplete';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger, } from "@/components/ui/popover"


export default function LocationSuggest() {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries: ["places"],
  });

  if (!isLoaded) return <div>Loading...</div>
  return (
    <div>LocationSuggest</div>
  )
  return <CitiesDropDown />
}

const CitiesDropDown = () => {
  const [selected, setSelected] = useState(null);
  return (
    <>


    </>
  )
}

const PlacesAutoComplete = ({ setSelected }: { setSelected: Function }) => {

  const [open, setOpen] = useState();
  // const [value, setValue] = useState();

  const {
    ready,
    value,
    setValue,
    suggestions: { status, data },
    clearSuggestions,
  } = usePlacesAutoComplete();

  const handleSelect = async (address) => {
    setValue(address, false);
    clearSuggestions();

    const results = await getGeocode({ address })
    const { lat, lng } = await getLatLng(results[0]);
    setSelected({ lat, lng })
  }

  return (
    
    
  )
}
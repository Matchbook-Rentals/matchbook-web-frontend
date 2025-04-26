'use client';

import React, { useState } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Add Input import
import { ScrollArea } from "@/components/ui/scroll-area"; // Add ScrollArea import

// Define a type for better address object handling
type Address = {
  streetAddress?: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  postalCode?: string;
  [key: string]: any; // Allow other properties
};

export default function SampleListingsPage() {
  const [addressObjectString, setAddressObjectString] = useState('');
  const [numberOfItems, setNumberOfItems] = useState<number>(10); // State for number input
  const [error, setError] = useState<string | null>(null);
  const [parsedAddresses, setParsedAddresses] = useState<Address[] | null>(null); // Use Address type

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAddressObjectString(event.target.value);
    setError(null); // Clear error when input changes
    setParsedAddresses(null); // Clear parsed addresses when input changes
  };

  const handleSubmit = () => {
    try {
      // Basic validation: Check if it looks like an array
      const trimmedInput = addressObjectString.trim();
      if (!trimmedInput.startsWith('[') || !trimmedInput.endsWith(']')) {
        throw new Error('Input must be a valid JavaScript array (starts with [ and ends with ]).');
      }

      // Attempt to parse the string as JSON (safer than eval)
      // Note: This requires the input to be valid JSON, not just a JS object literal.
      // For a pure JS object literal, parsing is more complex and potentially unsafe (e.g., using eval).
      // Using JSON.parse is the recommended approach for data exchange.
      let parsedData: any;
      try {
        parsedData = JSON.parse(trimmedInput);
      } catch (parseError: any) {
        throw new Error(`Invalid JSON format: ${parseError.message}`);
      }


      if (!Array.isArray(parsedData)) {
        throw new Error('Input must parse into a JavaScript array.');
      }

      // Optional: Validate structure of each item if needed
      const validatedAddresses: Address[] = parsedData.map((item, index) => {
        if (typeof item !== 'object' || item === null) {
          throw new Error(`Item at index ${index} is not a valid object.`);
        }
        // Add more specific checks here if necessary
        return item as Address;
      });

      // Optional: Add more specific validation for address structure if needed
      // e.g., check if each item is an object with expected keys like street, city, zip, etc.

      console.log('Successfully parsed addresses:', validatedAddresses);
      setParsedAddresses(validatedAddresses);
      setError(null);
      // Here you would typically send the validatedAddresses to your backend or process it further
      // alert(`Successfully parsed ${validatedAddresses.length} addresses.`); // Replaced alert with display area

    } catch (e: any) {
      console.error('Error parsing address object:', e);
      setError(`Parsing Error: ${e.message}. Please ensure the input is a valid JSON array string.`);
      setParsedAddresses(null);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-4">Input Sample Addresses</h1>
      <p className="mb-4 text-sm text-gray-600">
        Paste a JSON array string representing a list of addresses below. Example: 
      </p>
      <div className="space-y-4">
        <div>
          <Label htmlFor="addressObjectInput">Address List (JSON Array String)</Label>
          <Textarea
            id="addressObjectInput"
            placeholder="Paste your JavaScript array of addresses here (e.g., [{...}, {...}, ...])"
            value={addressObjectString}
            onChange={handleInputChange}
            rows={15} // Adjust rows as needed
            className="font-mono" // Use monospace font for code-like input
          />
        </div>
        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}
        <div className="flex items-center space-x-4">
           <Button onClick={handleSubmit}>Parse Addresses</Button>
           {/* New Number Input and Button */}
           <div className="flex items-center space-x-2">
             <Label htmlFor="numberOfItemsInput">Items:</Label>
             <Input
               id="numberOfItemsInput"
               type="number"
               value={numberOfItems}
               onChange={(e) => setNumberOfItems(parseInt(e.target.value, 10) || 0)}
               className="w-20" // Adjust width as needed
             />
             <Button variant="outline" onClick={() => console.log('Process button clicked with value:', numberOfItems)}>
               Process First {numberOfItems}
             </Button>
           </div>
        </div>

        {/* Display Parsed Addresses in Scroll Area */}
        {parsedAddresses && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-3">Parsed Addresses ({parsedAddresses.length} found)</h2>
            <ScrollArea className="h-72 w-full rounded-md border p-4"> {/* Adjust height as needed */}
              {parsedAddresses.map((address, index) => (
                <div key={index} className="mb-4 p-3 border-b last:border-b-0">
                  <p><strong>Street Address:</strong> {address.streetAddress || address.street || 'N/A'}</p>
                  <p><strong>City:</strong> {address.city || 'N/A'}</p>
                  <p><strong>State:</strong> {address.state || 'N/A'}</p>
                  <p><strong>Postal Code:</strong> {address.zip || address.postalCode || 'N/A'}</p>
                  <p className="mt-1 text-xs text-gray-500 break-all">
                    <strong>Location String:</strong> {JSON.stringify(address)}
                  </p>
                </div>
              ))}
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { Textarea } from "@/components/ui/textarea"; // Assuming you have a Textarea component
import { Label } from "@/components/ui/label"; // Assuming you have a Label component
import { Button } from "@/components/ui/button"; // Assuming you have a Button component

export default function SampleListingsPage() {
  const [addressObjectString, setAddressObjectString] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [parsedAddresses, setParsedAddresses] = useState<any[] | null>(null);

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
      const parsedData = JSON.parse(trimmedInput);

      if (!Array.isArray(parsedData)) {
        throw new Error('Input must parse into a JavaScript array.');
      }

      // Optional: Add more specific validation for address structure if needed
      // e.g., check if each item is an object with expected keys like street, city, zip, etc.

      console.log('Successfully parsed addresses:', parsedData);
      setParsedAddresses(parsedData);
      setError(null);
      // Here you would typically send the parsedData to your backend or process it further
      alert(`Successfully parsed ${parsedData.length} addresses.`);

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
        Paste a JSON array string representing a list of addresses below. Example: `[{"street": "123 Main St", "city": "Anytown", "zip": "12345"}, ...]`
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
        <Button onClick={handleSubmit}>Parse Addresses</Button>
        {parsedAddresses && (
          <div className="mt-4 p-4 border rounded bg-green-50">
            <h2 className="text-lg font-semibold mb-2">Successfully Parsed Addresses</h2>
            <p>Found {parsedAddresses.length} addresses.</p>
            {/* Optionally display a preview of the parsed data */}
            {/* <pre className="text-sm overflow-auto max-h-60">{JSON.stringify(parsedAddresses.slice(0, 5), null, 2)}</pre> */}
          </div>
        )}
      </div>
    </div>
  );
}

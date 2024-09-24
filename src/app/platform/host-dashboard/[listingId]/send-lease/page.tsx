'use client'
import React, { useState, useEffect } from 'react';
import { useHostProperties } from '@/contexts/host-properties-provider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const SendLeasePage: React.FC = () => {
  const { currListing } = useHostProperties();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [numRoles, setNumRoles] = useState<number>(2);

  useEffect(() => {
    if (!currListing) {
      return;
    }
    if (currListing?.boldSignTemplateId) {
      setSelectedTemplateId(currListing.boldSignTemplateId);
    }

    const fetchTemplateDetails = async () => {
      try {
        const response = await fetch(`/api/leases/template?templateId=${currListing?.boldSignTemplateId}`);
        const data = await response.json();
        console.log("BoldSign API response:", data);
        setNumRoles(data?.roles?.length || 2);
        // You can set state or perform other operations with the data here
      } catch (error) {
        console.error('Error fetching template properties:', error);
      }
    };

    fetchTemplateDetails();
  }, [currListing]);

  const handleTemplateSelection = (value: string) => {
    setSelectedTemplateId(value);
  };

  const selectedTemplate = currListing?.user.boldSignTemplates.find(
    (template) => template.id === selectedTemplateId
  );

  if (!currListing) {
    return <div>Loading...</div>;
  }

  return (
    <div onMouseEnter={() => console.log(currListing)} className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Create Lease</h1>
      {numRoles}
      <p className="mb-4">Creating lease for: {currListing?.locationString}</p>
      <Card>
        <CardContent>
          <div className="space-y-2">
            <h3>Current Template - {selectedTemplateId}</h3>
            <h3>Current Template Name - {selectedTemplate?.templateName}</h3>
            <h3>Current Template Description - {selectedTemplate?.templateDescription}</h3>
            <h3>Select a different template</h3>
            <Select onValueChange={handleTemplateSelection} value={selectedTemplateId || undefined}>
              <SelectTrigger>
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                {currListing?.user?.boldSignTemplates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>{template.templateName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => console.log('handle create from template')}
              disabled={!selectedTemplateId}
            >
              Create from Template
            </Button>
          </div>
        </CardContent>
      </Card>
      OR
      <div className="mt-4">
        <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
          Upload New
        </button>
      </div>
    </div>
  );
};

export default SendLeasePage;

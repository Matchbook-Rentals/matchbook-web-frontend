'use client'
import React, { useState, useEffect, useRef } from 'react';
import { useHostProperties } from '@/contexts/host-properties-provider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/use-toast';
import { createMatch } from '@/app/actions/matches';

const SendLeasePage: React.FC = () => {
  const router = useRouter();
  const { currListing, currHousingRequest, currApplication, trip } = useHostProperties();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [numRoles, setNumRoles] = useState<number>(2);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

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

  const handleCreateFromTemplate = async () => {
    if (!selectedTemplateId || !currListing) return;

    const requestBody = {
      showToolbar: true,
      sendViewOption: "PreparePage",
      showSaveButton: true,
      showSendButton: true,
      showPreviewButton: true,
      showNavigationButtons: true,
      sendLinkValidTill: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      title: "Lease Agreement for " + currListing.locationString,
      message: "Please review and sign the lease agreement.",
      roles: [
        {
          roleIndex: 1,
          signerName: currListing.user?.firstName + " " + currListing.user?.lastName || "",
          signerEmail: currListing.user?.email || "",
          signerOrder: 1,
          signerType: "signer",
        },
        {
          roleIndex: 2,
          signerName: currApplication?.firstName + " " + currApplication?.lastName || "",
          signerEmail: currApplication?.email || "mockedForNow@gmail.com",
          signerOrder: 2,
          signerType: "signer",
        }
      ],
      reminderSettings: {
        enableAutoReminder: true,
        reminderDays: 3,
        reminderCount: 5
      },
      expiryDays: 30,
      expiryDateType: "Days",
      expiryValue: 30,
      disableExpiryAlert: false,
      enablePrintAndSign: true,
      enableReassign: true
    };

    try {
      const response = await fetch(`/api/leases/document?templateId=${selectedTemplateId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('Failed to create embedded request URL');
      }

      const data = await response.json();
      setEmbedUrl(data.sendUrl);
    } catch (error) {
      console.error('Error creating embedded request:', error);
      // Handle error (e.g., show an error message to the user)
    }
  };

  // New functions for client-side triggers
  const triggerIframeAction = (action: string) => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage(action, "*");
    }
  };

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== "https://app.boldsign.com") {
        return;
      }

      switch (event.data) {
        case "onDraftSuccess":
          console.log("Draft saved successfully");
          break;
        case "onDraftFailed":
          console.error("Failed to save draft");
          break;
        case "onCreateSuccess":
          console.log("Document created successfully");
          try {
            const result = await createMatch(trip, currListing);
            console.log('Match creation result:', result);
            toast({
              title: 'Match created',
              description: 'The match has been created',
            });
          } catch (error) {
            console.error('Error creating match:', error);
          }
          break;
        case "onCreateFailed":
          console.error("Failed to create document");
          break;
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  if (!currListing) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Create Lease</h1>
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
              onClick={handleCreateFromTemplate}
              disabled={!selectedTemplateId}
            >
              Create from Template
            </Button>
          </div>

          {embedUrl ? (
            <div className="mt-4">
              <iframe
                ref={iframeRef}
                src={embedUrl}
                height="768px"
                width="100%"
                className="border-0"
                title="Lease Agreement Document"
              />
              <div className="mt-4 space-x-2">
                <Button onClick={() => triggerIframeAction("onNextClick")}>Configure fields</Button>
                <Button onClick={() => triggerIframeAction("onPreviewClick")}>Preview document</Button>
                <Button onClick={() => triggerIframeAction("onSaveClick")}>Save</Button>
                <Button onClick={() => triggerIframeAction("onSaveAndCloseClick")}>Save and close</Button>
                <Button onClick={() => triggerIframeAction("onSendClick")}>Send document</Button>
                <Button onClick={() => triggerIframeAction("onPreviewExit")}>Exit preview</Button>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
                Upload New
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SendLeasePage;
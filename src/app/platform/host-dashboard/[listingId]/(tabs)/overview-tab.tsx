import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { createTemplateFromListing } from "@/app/actions/templates";
import { toast } from "@/components/ui/use-toast";
import { useHostProperties } from "@/contexts/host-properties-provider";
import { updateListingTemplate } from "@/app/actions/listings";


export default function OverviewTab() {
  // State Variables
  const { listingId } = useParams();
  const { currListing } = useHostProperties();
  const [templateTitle, setTemplateTitle] = useState("");
  const [documentTitle, setDocumentTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (uploadedFile) {
      setFile(uploadedFile);
    }
  };

  const handleCreateTemplate = async () => {
    if (!templateTitle.trim() || !documentTitle.trim()) {
      setError("Template Title and Document Title are required");
      return;
    }
    if (!file) {
      setError("Please upload a file");
      return;
    }
    setError("");

    try {
      const formData = new FormData();
      formData.append("ShowToolbar", "true");
      formData.append("ViewOption", "PreparePage");
      formData.append("ShowSaveButton", "true");
      formData.append("ShowSendButton", "true");
      formData.append("ShowPreviewButton", "true");
      formData.append("ShowNavigationButtons", "true");
      formData.append("AutoDetectFields", "true");
      formData.append("Title", templateTitle);
      formData.append("Description", description);
      formData.append("DocumentMessage", "document message for signers");
      formData.append("Roles[0][Name]", "Host");
      formData.append("Roles[0][DefaultSignerName]", currListing?.user?.firstName + " " + currListing?.user?.lastName || "Host");
      formData.append("Roles[0][DefaultSignerEmail]", currListing?.user?.email || '');
      formData.append("Roles[0][Index]", "1");
      formData.append("Roles[0][SignerOrder]", "1");
      formData.append("Roles[0][SignerType]", "Signer");
      formData.append("Roles[0][Locale]", "EN");
      formData.append("Roles[0][ImposeAuthentication]", "EmailOTP");
      formData.append("Roles[0][DeliveryMode]", "Email");
      formData.append("Roles[1][Name]", "Tenant");
      formData.append("Roles[1][Index]", "2");
      formData.append("Roles[1][SignerOrder]", "2");
      formData.append("Roles[1][SignerType]", "Signer");
      formData.append("Roles[1][Locale]", "EN");
      formData.append("Roles[1][ImposeAuthentication]", "EmailOTP");
      formData.append("Roles[1][DeliveryMode]", "Email");
      formData.append("AllowNewRoles", "true");
      formData.append("AllowMessageEditing", "true");
      formData.append("EnableSigningOrder", "false");
      formData.append("DocumentInfo[0][Title]", documentTitle);
      formData.append("DocumentInfo[0][Locale]", "EN");
      formData.append("DocumentInfo[0][Description]", description);
      formData.append("EnableReassign", "true");
      formData.append("Files", file);
      formData.append("DocumentDownloadOption", "Combined");

      const response = await fetch('/api/leases/template', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        alert('failed')
        throw new Error('Failed to create template');
      }

      const data = await response.json();
      setEmbedUrl(data.createUrl);
      setTemplateId(data.templateId);
    } catch (err) {
      setError('Error creating template: ' + (err as Error).message);
    }
  };

  const handleTemplateSelection = (templateId: string) => {
    setSelectedTemplateId(templateId);
  };

  const handleUpdateTemplate = async () => {
    if (!selectedTemplateId) {
      toast({
        title: "Error",
        description: "Please select a template first",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    try {
      await updateListingTemplate(listingId as string, selectedTemplateId);
      toast({
        title: "Success",
        description: "Template updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update template",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== "https://app.boldsign.com") {
        return;
      }

      switch (event.data.status) {
        case "OnDraftSavedSuccess":
          // handle draft success
          console.log("Draft saved successfully");
          break;
        case "onDraftFailed":
          // handle draft failure
          console.error("Draft save failed");
          break;
        case "onCreateSuccess":
          // handle create success
          const newTemplateData = {
            templateId: templateId,
            templateName: templateTitle,
            templateDescription: description,
          }
          const newTemplate = await createTemplateFromListing(listingId as string, newTemplateData);
          toast({
            title: "Template created successfully",
            description: "Your template has been created",
          });
          break;
        case "onCreateFailed":
          // handle create failure
          console.error("Template creation failed");
          break;
        case "onTemplateEditingCompleted":
          // handle edit success
          console.log("Template editing completed");
          break;
        case "onTemplateEditingFailed":
          // handle edit failure
          console.error("Template editing failed");
          break;
        default:
          break;
      }
    };

    window.addEventListener("message", handleMessage);

    // Cleanup function to remove the event listener
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [templateId]); // Empty dependency array means this effect runs once on mount and cleanup on unmount

  const triggerIframeAction = (action: string) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(action, "https://app.boldsign.com");
    }
  };

  const handleSendPOST = async () => {
    if (!file) {
      console.error('No file selected');
      return;
    }

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64Content = reader.result?.toString().split(',')[1];

        if (!base64Content) {
          throw new Error('Failed to convert file to base64');
        }

        const postBody = {
          name: file.name,
          type: "DOC_GENERATION",
          is_conditional: false,
          content: base64Content
        };

        const response = await fetch('/api/airslate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(postBody),
        });

        if (!response.ok) {
          throw new Error('Failed to send POST request');
        }

        const data = await response.json();
        console.log('POST request successful:', data);
      };
    } catch (error) {
      console.error('Error sending POST request:', error);
    }
  };

  return (
    <div className="flex flex-col space-y-4 p-4">

      <Card>
        <Button onClick={handleSendPOST}> SEND POST </Button>
        <p> {file?.name || 'not found'} </p>
        <CardHeader>
          <CardTitle>Your Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <h3>Current Template - {currListing?.boldSignTemplateId}</h3>
            <h3>Current Template Name - {currListing.user.boldSignTemplates.find((template) => template.id === currListing?.boldSignTemplateId)?.templateName}</h3>
            <h3>Current Template Description - {currListing.user.boldSignTemplates.find((template) => template.id === currListing?.boldSignTemplateId)?.templateDescription}</h3>
            <h3>Select a different template</h3>
            <Select onValueChange={handleTemplateSelection}>
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
              onClick={handleUpdateTemplate}
              disabled={!selectedTemplateId || isUpdating}
            >
              {isUpdating ? "Updating..." : "Confirm Template Change"}
            </Button>
          </div>
        </CardContent>

      </Card>
      <Card>
        <CardHeader>
          <CardTitle>File Upload</CardTitle>
        </CardHeader>
        <CardContent>
          <Input type="file" onChange={handleFileUpload} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Template Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="templateTitle">Template Title</Label>
            <Input
              id="templateTitle"
              value={templateTitle}
              onChange={(e) => setTemplateTitle(e.target.value)}
              placeholder="Enter template title"
            />
            <Label htmlFor="documentTitle">Document Title</Label>
            <Input
              id="documentTitle"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              placeholder="Enter document title"
            />
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description"
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleCreateTemplate}>Create Template</Button>
      {embedUrl && (
        <Card>
          <CardHeader>
            <CardTitle>Template Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-4">
              <Button className="hidden" onClick={() => triggerIframeAction("onNextClick")}>Configure fields</Button>
              <Button className="hidden" onClick={() => triggerIframeAction("onPreviewClick")}>Preview template</Button>
              <Button className="hidden" onClick={() => triggerIframeAction("onSaveClick")}>Save</Button>
              <Button className="hidden" onClick={() => triggerIframeAction("onSaveAndCloseClick")}>Save and close</Button>
              <Button className="hidden" onClick={() => triggerIframeAction("onCreateClick")}>Create template</Button>
              <Button className="hidden" onClick={() => triggerIframeAction("onPreviewExit")}>Exit preview</Button>
            </div>
            <iframe
              ref={iframeRef}
              src={embedUrl}
              width="100%"
              height="1000px"
              frameBorder="0"
              title="Template Preview"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

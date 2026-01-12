"use client";

import React, { useState, useEffect } from "react";
import { FileText, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogClose } from "@/components/brandDialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { PdfTemplate } from "@prisma/client";
import { useRouter } from "next/navigation";

interface LeaseSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingId: string;
  onDocumentsSelected: (selectedTemplates: PdfTemplate[]) => void;
}

export const LeaseSelectionDialog: React.FC<LeaseSelectionDialogProps> = ({
  open,
  onOpenChange,
  listingId,
  onDocumentsSelected,
}) => {
  const router = useRouter();
  const [templates, setTemplates] = useState<PdfTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<Set<string>>(new Set());
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (open) {
      fetchTemplates();
    }
  }, [open, listingId]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/pdf-templates?listingId=${listingId}`);
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      } else {
        setError('Failed to fetch templates');
      }
    } catch (err) {
      setError('Error loading templates');
      console.error('Error fetching templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const getDocumentTypeBadge = (template: PdfTemplate) => {
    // Use the actual type field from the database instead of parsing title
    const templateType = template.type?.toLowerCase() || 'other';
    
    switch (templateType) {
      case 'lease':
        return {
          type: "Lease",
          badgeColor: "bg-[#e8f4fd] text-[#1976d2] border-[#1976d2]"
        };
      case 'addendum':
        return {
          type: "Addendum", 
          badgeColor: "bg-[#fff3e0] text-[#f57c00] border-[#f57c00]"
        };
      case 'disclosure':
        return {
          type: "Disclosure",
          badgeColor: "bg-[#f3e5f5] text-[#7b1fa2] border-[#7b1fa2]"
        };
      default:
        return {
          type: "Document",
          badgeColor: "bg-[#f5f5f5] text-[#616161] border-[#616161]"
        };
    }
  };


  // Filter for only completed templates and separate leases and addendums
  const completedTemplates = templates.filter(t => {
    const templateData = t.templateData as any;
    const hasFields = templateData?.fields?.length > 0;
    const hasRecipients = templateData?.recipients?.length > 0;
    return hasFields && hasRecipients;
  });

  const getSortOrder = (template: PdfTemplate) => {
    // Use the actual type field for sorting
    const templateType = template.type?.toLowerCase() || 'other';
    switch (templateType) {
      case 'lease': return 1;
      case 'addendum': return 2;
      case 'disclosure': return 3;
      default: return 4;
    }
  };

  // Sort templates by type and then by title
  const sortedCompletedTemplates = [...completedTemplates].sort((a, b) => {
    const orderA = getSortOrder(a);
    const orderB = getSortOrder(b);
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    return a.title.localeCompare(b.title);
  });
  
  const leaseTemplates = sortedCompletedTemplates.filter(t => 
    t.type?.toLowerCase() === 'lease'
  );
  const addendumTemplates = sortedCompletedTemplates.filter(t => 
    t.type?.toLowerCase() === 'addendum'
  );

  // Check if exactly one lease is selected
  const selectedLeaseCount = leaseTemplates.filter(t => selectedTemplateIds.has(t.id)).length;
  const hasExactlyOneLease = selectedLeaseCount === 1;
  const canProceed = hasExactlyOneLease && !loading;

  const handleTemplateToggle = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    const isLease = template?.type?.toLowerCase() === 'lease';
    
    const newSelected = new Set(selectedTemplateIds);
    
    if (newSelected.has(templateId)) {
      // Always allow deselection
      newSelected.delete(templateId);
    } else {
      // If selecting a lease, deselect all other leases first
      if (isLease) {
        leaseTemplates.forEach(t => newSelected.delete(t.id));
      }
      newSelected.add(templateId);
    }
    setSelectedTemplateIds(newSelected);
  };

  const handleProceed = () => {
    if (completedTemplates.length === 0) {
      router.push(`/app/host/${listingId}/leases/create`);
      onOpenChange(false);
    } else {
      const selectedTemplates = templates.filter(t => selectedTemplateIds.has(t.id));
      onDocumentsSelected(selectedTemplates);
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    setSelectedTemplateIds(new Set());
    onOpenChange(false);
  };

  const contentBody = (
    <div className="flex flex-col gap-6 w-full">
      <div className="text-center">
        <p className="text-gray-600 mb-2">
          Choose the lease and addendum documents that will be included in this rental agreement.
        </p>
        {!hasExactlyOneLease && leaseTemplates.length > 0 && (
          <div className="flex items-center justify-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span className="text-sm text-amber-700 font-medium">
              Exactly one lease document must be selected
            </span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#3c8787] mr-3"></div>
          <span className="text-gray-600">Loading documents...</span>
        </div>
      ) : error ? (
        <div className="text-center text-red-600 py-8">
          <p>{error}</p>
          <Button
            variant="outline"
            onClick={fetchTemplates}
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
      ) : completedTemplates.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Complete Documents Available</h3>
          <p className="text-gray-600 mb-4">
            No completed lease or addendum templates were found for this listing.
          </p>
          <p className="text-sm text-gray-500">
            Complete your lease templates by adding signature blocks before approving applications.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {leaseTemplates.length > 0 && (
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Lease Documents
                <Badge className="bg-blue-100 text-blue-800 text-xs">Required</Badge>
              </h3>
              <div className="space-y-3">
                {leaseTemplates.map((template) => {
                  const isSelected = selectedTemplateIds.has(template.id);

                  return (
                    <div
                      key={template.id}
                      className={`flex items-center gap-2 p-3 border rounded-md cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-[#3c8787] bg-[#3c8787]/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleTemplateToggle(template.id)}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleTemplateToggle(template.id)}
                        className="data-[state=checked]:bg-[#3c8787] data-[state=checked]:border-[#3c8787] h-4 w-4 rounded-none"
                        checkSize="h-3 w-3"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h4 className="font-medium text-gray-900 text-sm truncate">{template.title}</h4>
                        </div>
                        <p className="text-xs text-gray-500">
                          Last updated {new Date(template.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {addendumTemplates.length > 0 && (
            <>
              {leaseTemplates.length > 0 && <Separator />}
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Addendum Documents
                  <Badge className="bg-gray-100 text-gray-600 text-xs">Optional</Badge>
                </h3>
                <div className="space-y-3">
                  {addendumTemplates.map((template) => {
                    const isSelected = selectedTemplateIds.has(template.id);

                    return (
                      <div
                        key={template.id}
                        className={`flex items-center gap-2 p-3 border rounded-md cursor-pointer transition-colors ${
                          isSelected
                            ? 'border-[#3c8787] bg-[#3c8787]/5'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleTemplateToggle(template.id)}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleTemplateToggle(template.id)}
                          className="data-[state=checked]:bg-[#3c8787] data-[state=checked]:border-[#3c8787] h-4 w-4 rounded-none"
                          checkSize="h-3 w-3"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h4 className="font-medium text-gray-900 text-sm truncate">{template.title}</h4>
                          </div>
                          <p className="text-xs text-gray-500">
                            Last updated {new Date(template.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );

  const footerButtons = (
    <div className="flex gap-3 w-full pt-6 border-t border-gray-200">
      <Button
        variant="outline"
        onClick={handleCancel}
        disabled={loading}
        className="flex-1 h-12 rounded-lg border-gray-300 text-gray-700 hover:bg-gray-50"
      >
        Cancel
      </Button>
      <Button
        onClick={handleProceed}
        disabled={loading || (completedTemplates.length > 0 && !hasExactlyOneLease)}
        className="flex-1 h-12 rounded-lg bg-[#3c8787] hover:bg-[#2d6666] text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {completedTemplates.length === 0
          ? 'Create Lease'
          : selectedTemplateIds.size === 0
            ? 'Select Documents'
            : `Continue with ${selectedTemplateIds.size} Document${selectedTemplateIds.size !== 1 ? 's' : ''}`
        }
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="px-4 pb-6">
          <DrawerHeader className="text-center pb-2">
            <DrawerTitle>Select Lease Documents</DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto max-h-[60vh] px-1">
            {contentBody}
          </div>
          {footerButtons}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex flex-col items-center gap-6 p-6 bg-white w-full max-w-[98%] sm:max-w-[500px] mx-auto !top-[25vh] translate-y-0"
        showCloseButton={false}
      >
        <div className="flex items-center justify-between relative self-stretch w-full">
          <DialogClose asChild>
            <button
              onClick={handleCancel}
              className="p-1 hover:bg-gray-100 rounded-sm transition-colors"
            >
              <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="sr-only">Close</span>
            </button>
          </DialogClose>
          <h2 className="text-lg font-semibold text-gray-900">
            Select Lease Documents
          </h2>
          <div className="w-6 h-6" />
        </div>

        <div className="flex flex-col gap-6 w-full max-h-[70vh] overflow-hidden">
          <div className="overflow-y-auto flex-1 px-1">
            {contentBody}
          </div>
        </div>

        {footerButtons}
      </DialogContent>
    </Dialog>
  );
};
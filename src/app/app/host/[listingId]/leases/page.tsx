"use client";

import { DownloadIcon, MoreVerticalIcon, Trash2Icon } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PdfTemplate } from "@prisma/client";
import { Dialog, DialogContent, DialogClose } from "@/components/brandDialog";
import { toast } from "@/components/ui/use-toast";

export default function LeasesPage() {
  const router = useRouter();
  const params = useParams();
  const listingId = params.listingId as string;
  
  const [templates, setTemplates] = useState<PdfTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<PdfTemplate | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/pdf-templates');
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

  const getTemplateStatus = (template: PdfTemplate) => {
    const templateData = template.templateData as any;
    const hasFields = templateData?.fields?.length > 0;
    const hasRecipients = templateData?.recipients?.length > 0;
    
    if (hasFields && hasRecipients) {
      return {
        status: "Complete",
        statusColor: "bg-[#e9f7ee] text-[#1ca34e] border-[#1ca34e]",
        buttonText: "Modify"
      };
    } else {
      return {
        status: "Incomplete",
        statusColor: "bg-[#ffeaea] text-[#ff3b30] border-[#ff3b30]",
        buttonText: "Add Signature Blocks"
      };
    }
  };

  const formatLastUpdated = (updatedAt: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(updatedAt).getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return "Last updated today";
    } else if (diffDays === 1) {
      return "Last updated yesterday";
    } else if (diffDays < 7) {
      return `Last updated ${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `Last updated ${weeks} week${weeks > 1 ? 's' : ''} ago`;
    } else {
      return new Date(updatedAt).toLocaleDateString();
    }
  };

  const openDeleteDialog = (template: PdfTemplate) => {
    setTemplateToDelete(template);
    setDeleteDialogOpen(true);
  };

  const handleDeleteTemplate = async () => {
    if (!templateToDelete) return;

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/pdf-templates/${templateToDelete.id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // Remove the template from the local state
        setTemplates(prev => prev.filter(t => t.id !== templateToDelete.id));
        toast({
          title: "Template deleted",
          description: `"${templateToDelete.title}" has been successfully deleted.`,
        });
        setDeleteDialogOpen(false);
        setTemplateToDelete(null);
      } else {
        const error = await response.json();
        console.error('Failed to delete template:', error);
        toast({
          title: "Delete failed",
          description: error.error || "Failed to delete template. Please try again.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error('Error deleting template:', err);
      toast({
        title: "Error",
        description: "Error deleting template. Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <main className="flex flex-col items-start gap-6 px-6 py-8 bg-[#f9f9f9]">
        <header className="flex items-end gap-6 w-full">
          <div className="flex flex-col items-start gap-2 flex-1">
            <h1 className="[font-family:'Poppins',Helvetica] font-medium text-[#020202] text-2xl tracking-[0] leading-[28.8px]">
              Lease and Addendums
            </h1>
            <p className="font-normal text-[#777b8b] text-base leading-6 [font-family:'Poppins',Helvetica] tracking-[0]">
              Renters will be required to sign these documents at booking
            </p>
          </div>
          <Button 
            className="bg-[#3c8787] hover:bg-[#2d6666] text-white h-auto"
            onClick={() => router.push(`/app/host/${listingId}/leases/create`)}
          >
            Add Lease or Addendum
          </Button>
        </header>
        <div className="flex items-center justify-center py-8 w-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3c8787] mx-auto mb-4"></div>
            <p className="text-[#777b8b]">Loading templates...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex flex-col items-start gap-6 px-6 py-8 bg-[#f9f9f9]">
        <header className="flex items-end gap-6 w-full">
          <div className="flex flex-col items-start gap-2 flex-1">
            <h1 className="[font-family:'Poppins',Helvetica] font-medium text-[#020202] text-2xl tracking-[0] leading-[28.8px]">
              Lease and Addendums
            </h1>
            <p className="font-normal text-[#777b8b] text-base leading-6 [font-family:'Poppins',Helvetica] tracking-[0]">
              Renters will be required to sign these documents at booking
            </p>
          </div>
          <Button 
            className="bg-[#3c8787] hover:bg-[#2d6666] text-white h-auto"
            onClick={() => router.push(`/app/host/${listingId}/leases/create`)}
          >
            Add Lease or Addendum
          </Button>
        </header>
        <div className="flex items-center justify-center py-8 w-full">
          <div className="text-center text-red-600">
            <p>{error}</p>
            <Button 
              variant="outline" 
              onClick={fetchTemplates}
              className="mt-4"
            >
              Try Again
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col items-start gap-6 px-6 py-8 bg-[#f9f9f9]">
      <header className="flex items-end gap-6 w-full">
        <div className="flex flex-col items-start gap-2 flex-1">
          <h1 className="[font-family:'Poppins',Helvetica] font-medium text-[#020202] text-2xl tracking-[0] leading-[28.8px]">
            Lease and Addendums
          </h1>
          <p className="font-normal text-[#777b8b] text-base leading-6 [font-family:'Poppins',Helvetica] tracking-[0]">
            Renters will be required to sign these documents at booking
          </p>
        </div>
        <Button 
          className="bg-[#3c8787] hover:bg-[#2d6666] text-white h-auto"
          onClick={() => router.push(`/app/host/${listingId}/leases/create`)}
        >
          Add Lease or Addendum
        </Button>
      </header>

      <section className="flex flex-col items-start gap-6 w-full">
        {templates.length === 0 ? (
          <div className="w-full text-center py-12">
            <h3 className="text-lg font-semibold text-[#484a54] mb-2">No lease templates found</h3>
            <p className="text-[#777b8b] mb-4">Create your first lease template to get started</p>
            <Button 
              className="bg-[#3c8787] hover:bg-[#2d6666] text-white"
              onClick={() => router.push(`/app/host/${listingId}/leases/create`)}
            >
              Create Template
            </Button>
          </div>
        ) : (
          templates.map((template) => {
            const { status, statusColor, buttonText } = getTemplateStatus(template);
            
            return (
              <Card
                key={template.id}
                className="w-full bg-white rounded-xl shadow-[0px_0px_5px_#00000029] border-0"
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-2 w-full">
                    <div className="flex items-start gap-6 flex-1">
                      <div className="flex flex-col items-start gap-2.5 flex-1">
                        <div className="flex flex-col items-start justify-center gap-2 w-full">
                          <div className="inline-flex items-start gap-2">
                            <h2 className="font-text-label-large-medium font-[number:var(--text-label-large-medium-font-weight)] text-[#484a54] text-[length:var(--text-label-large-medium-font-size)] tracking-[var(--text-label-large-medium-letter-spacing)] leading-[var(--text-label-large-medium-line-height)] [font-style:var(--text-label-large-medium-font-style)]">
                              {template.title}
                            </h2>
                            <Badge
                              className={`${statusColor} rounded-full border-solid font-medium text-sm text-center leading-5 whitespace-nowrap [font-family:'Poppins',Helvetica] tracking-[0]`}
                            >
                              {status}
                            </Badge>
                          </div>
                          <p className="font-text-label-small-regular font-[number:var(--text-label-small-regular-font-weight)] text-[#777b8b] text-[length:var(--text-label-small-regular-font-size)] tracking-[var(--text-label-small-regular-letter-spacing)] leading-[var(--text-label-small-regular-line-height)] [font-style:var(--text-label-small-regular-font-style)]">
                            {formatLastUpdated(template.updatedAt)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="default"
                        className="bg-[#3c8787] hover:bg-[#2d6666] text-white h-auto"
                        onClick={() => router.push(`/app/host/${listingId}/leases/create?templateId=${template.id}`)}
                      >
                        {buttonText}
                      </Button>
                    </div>
                    <div className="inline-flex flex-col items-end justify-center gap-2">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="p-2.5 rounded-lg border-[#3c8787] h-auto"
                          onClick={() => {
                            // Download template PDF
                            if (template.pdfFileUrl) {
                              window.open(template.pdfFileUrl, '_blank');
                            }
                          }}
                          title="Download PDF"
                        >
                          <DownloadIcon className="w-5 h-5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="p-2.5 rounded-lg border-red-500 hover:bg-red-50 h-auto"
                          onClick={() => openDeleteDialog(template)}
                          title="Delete template"
                        >
                          <Trash2Icon className="w-5 h-5 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </section>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="flex flex-col items-center gap-6 p-6 bg-white w-full max-w-md mx-auto !top-[20vh] translate-y-0">
          <div className="flex items-center justify-center relative self-stretch w-full">
            <h2 className="text-lg font-semibold text-gray-900">Delete Template</h2>
          </div>

          <div className="flex flex-col gap-4 text-center">
            <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
              <Trash2Icon className="w-8 h-8 text-red-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Are you sure?
              </h3>
              <p className="text-gray-600 leading-relaxed">
                You are about to delete <strong>"{templateToDelete?.title}"</strong>. 
                This action cannot be undone and will permanently remove the template and its associated PDF file.
              </p>
            </div>
          </div>

          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setTemplateToDelete(null);
              }}
              disabled={isDeleting}
              className="flex-1 h-12 rounded-lg border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteTemplate}
              disabled={isDeleting}
              className="flex-1 h-12 rounded-lg bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </>
              ) : (
                "Delete Template"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
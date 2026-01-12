"use client";

import { DownloadIcon, Trash2Icon } from "lucide-react";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PdfTemplate } from "@prisma/client";
import { Dialog, DialogContent } from "@/components/brandDialog";
import { toast } from "@/components/ui/use-toast";

interface LeasesPageClientProps {
  listingId: string;
}

export function LeasesPageClient({ listingId }: LeasesPageClientProps) {
  const router = useRouter();

  const [templates, setTemplates] = useState<PdfTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<PdfTemplate | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTemplates = useCallback(async () => {
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
  }, [listingId]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const getTemplateStatus = (template: PdfTemplate) => {
    const templateData = template.templateData as any;
    const hasFields = templateData?.fields?.length > 0;
    const hasRecipients = templateData?.recipients?.length > 0;

    if (hasFields && hasRecipients) {
      return {
        status: "Complete",
        statusColor: "bg-[#e9f7ee] text-[#1ca34e] border-[#1ca34e] hover:bg-[#e9f7ee] hover:text-[#1ca34e]",
        buttonText: "Modify"
      };
    } else {
      return {
        status: "Incomplete",
        statusColor: "bg-[#ffeaea] text-[#ff3b30] border-[#ff3b30] hover:bg-[#ffeaea] hover:text-[#ff3b30]",
        buttonText: "Add Signature Blocks"
      };
    }
  };

  const getDocumentTypeBadge = (template: PdfTemplate) => {
    const templateType = template.type?.toLowerCase() || 'other';

    switch (templateType) {
      case 'lease':
        return {
          type: "Lease",
          badgeColor: "bg-[#e8f4fd] text-[#1976d2] border-[#1976d2] hover:bg-[#e8f4fd] hover:text-[#1976d2]"
        };
      case 'addendum':
        return {
          type: "Addendum",
          badgeColor: "bg-[#fff3e0] text-[#f57c00] border-[#f57c00] hover:bg-[#fff3e0] hover:text-[#f57c00]"
        };
      case 'disclosure':
        return {
          type: "Disclosure",
          badgeColor: "bg-[#f3e5f5] text-[#7b1fa2] border-[#7b1fa2] hover:bg-[#f3e5f5] hover:text-[#7b1fa2]"
        };
      default:
        return {
          type: "Document",
          badgeColor: "bg-[#f5f5f5] text-[#616161] border-[#616161] hover:bg-[#f5f5f5] hover:text-[#616161]"
        };
    }
  };

  const getSortOrder = (template: PdfTemplate) => {
    const templateType = template.type?.toLowerCase() || 'other';
    switch (templateType) {
      case 'lease': return 1;
      case 'addendum': return 2;
      case 'disclosure': return 3;
      default: return 4;
    }
  };

  const sortedTemplates = [...templates].sort((a, b) => {
    const orderA = getSortOrder(a);
    const orderB = getSortOrder(b);
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    return a.title.localeCompare(b.title);
  });

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
      <main className="flex flex-col items-start gap-6 px-4 md:px-6 py-6 md:py-8 bg-[#f9f9f9]">
        <header className="flex flex-row items-start md:items-end justify-between gap-4 md:gap-6 w-full">
          <div className="flex flex-col items-start gap-2 flex-1">
            <h1 className="[font-family:'Poppins',Helvetica] font-medium text-[#020202] text-xl md:text-2xl tracking-[0] leading-tight md:leading-[28.8px]">
              Lease and Addendums
            </h1>
            <p className="font-normal text-[#777b8b] text-sm md:text-base leading-5 md:leading-6 [font-family:'Poppins',Helvetica] tracking-[0]">
              Renters will be required to sign these documents at booking
            </p>
          </div>
          <Button
            className="bg-[#3c8787] hover:bg-[#2d6666] text-white h-auto shrink-0"
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
      <main className="flex flex-col items-start gap-6 px-4 md:px-6 py-6 md:py-8 bg-[#f9f9f9]">
        <header className="flex flex-row items-start md:items-end justify-between gap-4 md:gap-6 w-full">
          <div className="flex flex-col items-start gap-2 flex-1">
            <h1 className="[font-family:'Poppins',Helvetica] font-medium text-[#020202] text-xl md:text-2xl tracking-[0] leading-tight md:leading-[28.8px]">
              Lease and Addendums
            </h1>
            <p className="font-normal text-[#777b8b] text-sm md:text-base leading-5 md:leading-6 [font-family:'Poppins',Helvetica] tracking-[0]">
              Renters will be required to sign these documents at booking
            </p>
          </div>
          <Button
            className="bg-[#3c8787] hover:bg-[#2d6666] text-white h-auto shrink-0"
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
    <main className="flex flex-col items-start gap-6 px-4 md:px-6 py-6 md:py-8 bg-[#f9f9f9]">
      <header className="flex flex-row items-start md:items-end justify-between gap-4 md:gap-6 w-full">
        <div className="flex flex-col items-start gap-2 flex-1">
          <h1 className="[font-family:'Poppins',Helvetica] font-medium text-[#020202] text-xl md:text-2xl tracking-[0] leading-tight md:leading-[28.8px]">
            Lease and Addendums
          </h1>
          <p className="font-normal text-[#777b8b] text-sm md:text-base leading-5 md:leading-6 [font-family:'Poppins',Helvetica] tracking-[0]">
            Renters will be required to sign these documents at booking
          </p>
        </div>
        <Button
          className="bg-[#3c8787] hover:bg-[#2d6666] text-white h-auto shrink-0"
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
          sortedTemplates.map((template) => {
            const { status, statusColor, buttonText } = getTemplateStatus(template);
            const { type, badgeColor } = getDocumentTypeBadge(template);

            return (
              <Card
                key={template.id}
                className="w-full bg-white rounded-xl shadow-[0px_0px_5px_#00000029] border-0"
              >
                <CardContent className="p-4 md:p-6">
                  {/* Desktop Layout */}
                  <div className="hidden md:flex items-start gap-2 w-full">
                    <div className="flex items-start gap-6 flex-1">
                      <div className="flex flex-col items-start gap-2.5 flex-1">
                        <div className="flex flex-col items-start justify-center gap-2 w-full">
                          <div className="inline-flex items-start gap-2">
                            <h2 className="font-text-label-large-medium font-[number:var(--text-label-large-medium-font-weight)] text-[#484a54] text-[length:var(--text-label-large-medium-font-size)] tracking-[var(--text-label-large-medium-letter-spacing)] leading-[var(--text-label-large-medium-line-height)] [font-style:var(--text-label-large-medium-font-style)]">
                              {template.title}
                            </h2>
                            <Badge
                              className={`${badgeColor} rounded-full border-solid font-medium text-sm text-center leading-5 whitespace-nowrap [font-family:'Poppins',Helvetica] tracking-[0]`}
                            >
                              {type}
                            </Badge>
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
                        onClick={() => router.push(`/app/host/${listingId}/leases/${template.id}/edit`)}
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

                  {/* Mobile Layout */}
                  <div className="flex md:hidden flex-col gap-3 w-full">
                    {/* Row 1: Title and Date */}
                    <div className="flex flex-col gap-1">
                      <h2 className="font-medium text-[#484a54] text-base leading-tight">
                        {template.title}
                      </h2>
                      <p className="text-[#777b8b] text-sm">
                        {formatLastUpdated(template.updatedAt)}
                      </p>
                    </div>

                    {/* Row 2: Badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        className={`${badgeColor} rounded-full border-solid font-medium text-sm text-center leading-5 whitespace-nowrap [font-family:'Poppins',Helvetica] tracking-[0]`}
                      >
                        {type}
                      </Badge>
                      <Badge
                        className={`${statusColor} rounded-full border-solid font-medium text-sm text-center leading-5 whitespace-nowrap [font-family:'Poppins',Helvetica] tracking-[0]`}
                      >
                        {status}
                      </Badge>
                    </div>

                    {/* Row 3: Buttons */}
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        variant="default"
                        className="bg-[#3c8787] hover:bg-[#2d6666] text-white h-auto flex-1"
                        onClick={() => router.push(`/app/host/${listingId}/leases/${template.id}/edit`)}
                      >
                        {buttonText}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="p-2.5 rounded-lg border-[#3c8787] h-auto shrink-0"
                        onClick={() => {
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
                        className="p-2.5 rounded-lg border-red-500 hover:bg-red-50 h-auto shrink-0"
                        onClick={() => openDeleteDialog(template)}
                        title="Delete template"
                      >
                        <Trash2Icon className="w-5 h-5 text-red-500" />
                      </Button>
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
                You are about to delete <strong>&quot;{templateToDelete?.title}&quot;</strong>.
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

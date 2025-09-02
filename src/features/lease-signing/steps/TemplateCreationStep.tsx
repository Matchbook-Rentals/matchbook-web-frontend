"use client";

import React, { useState } from "react";
import { Upload, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PDFEditor } from "@/components/pdf-editor/PDFEditor";
import { formatFileSize } from "@/lib/utils";
import { clientLogger } from "@/lib/clientLogger";

interface TemplateCreationStepProps {
  existingTemplate?: any;
  onTemplateCreated?: (template: any) => void;
  onCancel?: () => void;
  hostName?: string;
  hostEmail?: string;
  listingAddress?: string;
  listingId?: string;
}

export function TemplateCreationStep({ existingTemplate, onTemplateCreated, onCancel, hostName, hostEmail, listingAddress, listingId }: TemplateCreationStepProps) {
  const [step, setStep] = useState<"upload" | "edit">(existingTemplate ? "edit" : "upload");
  const [templateName, setTemplateName] = useState(existingTemplate?.title || "");
  const [templateType, setTemplateType] = useState<"lease" | "addendum" | "">(
    existingTemplate?.type || "lease"
  );
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  clientLogger.info('TemplateCreationStep - Component initialized', {
    hasExistingTemplate: !!existingTemplate,
    existingTemplateType: existingTemplate?.type,
    initialTemplateType: existingTemplate?.type || "lease",
    step
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setUploadedFile(file);
    }
  };

  const handleFileRemove = () => {
    setUploadedFile(null);
  };


  if (step === "upload" && !existingTemplate) {
    return (
      <div className="flex flex-col items-start gap-6 px-4 py-6 sm:px-6 sm:py-8 relative bg-[#f9f9f9]">
        <div className="flex items-end gap-6 relative self-stretch w-full flex-[0_0_auto]">
          <div className="flex flex-col items-start gap-2 relative flex-1 grow">
            <h1 className="relative self-stretch mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#020202] text-xl sm:text-2xl tracking-[0] leading-[28.8px]">
              Lease and Addendums
            </h1>

            <p className="relative w-full [font-family:'Poppins',Helvetica] font-normal text-greygrey-500 text-sm sm:text-base tracking-[0] leading-6">
              Renters will be required to sign these documents at booking
            </p>
          </div>
        </div>

        <div className="flex flex-col items-start gap-6 relative self-stretch w-full flex-[0_0_auto]">
          <Card className="flex flex-col w-full items-start justify-end gap-2 p-4 sm:p-6 relative flex-[0_0_auto] bg-white rounded-xl overflow-hidden shadow-[0px_0px_5px_#00000029]">
            <CardContent className="flex flex-col items-start gap-4 relative self-stretch w-full flex-[0_0_auto] p-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 relative self-stretch w-full flex-[0_0_auto]">
                <div className="flex-col items-start gap-1.5 flex-1 grow flex relative">
                  <div className="flex-col items-start gap-1.5 self-stretch w-full flex-[0_0_auto] flex relative">
                    <div className="flex-col items-start gap-1.5 self-stretch w-full flex-[0_0_auto] flex relative">
                      <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
                        <Label className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap">
                          Document Type
                        </Label>
                      </div>

                      <Select 
                        value={templateType} 
                        onValueChange={(value: "lease" | "addendum") => {
                          clientLogger.info('TemplateCreationStep - Template type changed', {
                            oldValue: templateType,
                            newValue: value
                          });
                          setTemplateType(value);
                        }}
                      >
                        <SelectTrigger className="h-12 items-center gap-2 px-3 py-2 self-stretch w-full bg-white rounded-lg border border-solid border-[#d0d5dd] shadow-shadows-shadow-xs">
                          <SelectValue
                            placeholder="Select a Type"
                            className="relative flex-1 mt-[-1.00px] font-text-label-medium-regular font-[number:var(--text-label-medium-regular-font-weight)] text-[#667085] text-[length:var(--text-label-medium-regular-font-size)] tracking-[var(--text-label-medium-regular-letter-spacing)] leading-[var(--text-label-medium-regular-line-height)] [font-style:var(--text-label-medium-regular-font-style)]"
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lease">Lease Agreement</SelectItem>
                          <SelectItem value="addendum">Addendum</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="flex-col items-start gap-1.5 flex-1 grow flex relative">
                  <div className="flex-col items-start gap-1.5 self-stretch w-full flex-[0_0_auto] flex relative">
                    <Label className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap">
                      Document Name
                    </Label>

                    <Input
                      placeholder="Enter Document name"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      className="h-12 items-center gap-2 px-3 py-2 self-stretch w-full bg-white rounded-lg border border-solid border-[#d0d5dd] shadow-shadows-shadow-xs font-text-label-medium-regular font-[number:var(--text-label-medium-regular-font-weight)] text-[#667085] text-[length:var(--text-label-medium-regular-font-size)] tracking-[var(--text-label-medium-regular-letter-spacing)] leading-[var(--text-label-medium-regular-line-height)] [font-style:var(--text-label-medium-regular-font-style)]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex-col items-start gap-1.5 self-stretch w-full flex-[0_0_auto] flex relative">
                <div className="flex-col items-start gap-1.5 self-stretch w-full flex-[0_0_auto] flex relative">
                  <div className="flex-col items-start gap-1.5 self-stretch w-full flex-[0_0_auto] flex relative">
                    <div className="flex flex-col items-start justify-center gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
                      <Label className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap">
                        Upload Document
                      </Label>
                    </div>

                    <div className="flex flex-col items-start gap-[18px] relative self-stretch w-full flex-[0_0_auto]">
                      <div className="flex flex-col items-start gap-3 relative self-stretch w-full flex-[0_0_auto]">
                        {!uploadedFile ? (
                          <>
                            <div className="flex flex-col h-[100px] sm:h-[140px] items-center justify-center gap-[35px] px-6 sm:px-[100px] py-4 sm:py-[21px] relative self-stretch w-full bg-white rounded-xl border border-dashed border-[#036e49]">
                              <div className="inline-flex flex-col items-center justify-center gap-3 relative flex-[0_0_auto]">
                                <Upload className="relative w-8 h-8 text-[#036e49]" />

                                <div className="flex items-center gap-2 relative self-stretch w-full flex-[0_0_auto]">
                                  <span className="relative w-fit mt-[-1.00px] font-text-label-small-regular font-[number:var(--text-label-small-regular-font-weight)] text-[#717680] text-[length:var(--text-label-small-regular-font-size)] tracking-[var(--text-label-small-regular-letter-spacing)] leading-[var(--text-label-small-regular-line-height)] [font-style:var(--text-label-small-regular-font-style)] hidden sm:inline">
                                    Drag and drop file or
                                  </span>

                                  <label className="relative w-fit mt-[-1.00px] font-text-label-small-medium font-[number:var(--text-label-small-medium-font-weight)] text-[#0b6969] text-[length:var(--text-label-small-medium-font-size)] tracking-[var(--text-label-small-medium-letter-spacing)] leading-[var(--text-label-small-medium-line-height)] [font-style:var(--text-label-small-medium-font-style)] cursor-pointer">
                                    <span className="sm:hidden">Tap to upload PDF</span>
                                    <span className="hidden sm:inline">Browse</span>
                                    <input
                                      type="file"
                                      accept=".pdf"
                                      onChange={handleFileUpload}
                                      className="hidden"
                                    />
                                  </label>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 relative self-stretch w-full flex-[0_0_auto]">
                              <span className="relative flex-1 mt-[-1.00px] font-text-label-small-regular font-[number:var(--text-label-small-regular-font-weight)] text-neutralneutral-400 text-[length:var(--text-label-small-regular-font-size)] tracking-[var(--text-label-small-regular-letter-spacing)] leading-[var(--text-label-small-regular-line-height)] [font-style:var(--text-label-small-regular-font-style)]">
                                Supported formats: PDF
                              </span>

                              <span className="relative w-fit mt-[-1.00px] font-text-label-small-regular font-[number:var(--text-label-small-regular-font-weight)] text-neutralneutral-400 text-[length:var(--text-label-small-regular-font-size)] tracking-[var(--text-label-small-regular-letter-spacing)] leading-[var(--text-label-small-regular-line-height)] [font-style:var(--text-label-small-regular-font-style)]">
                                Maximum size: 50MB
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center gap-3 px-4 py-3 relative self-stretch w-full bg-white rounded-xl border border-solid border-[#036e49]">
                            <FileText className="relative w-8 h-8 text-[#036e49] flex-shrink-0" />
                            
                            <div className="flex flex-col gap-1 relative flex-1 min-w-0">
                              <span className="relative w-fit font-text-label-small-medium font-[number:var(--text-label-small-medium-font-weight)] text-[#344054] text-[length:var(--text-label-small-medium-font-size)] tracking-[var(--text-label-small-medium-letter-spacing)] leading-[var(--text-label-small-medium-line-height)] [font-style:var(--text-label-small-medium-font-style)] truncate">
                                {uploadedFile.name}
                              </span>
                              <span className="relative w-fit font-text-label-small-regular font-[number:var(--text-label-small-regular-font-weight)] text-neutralneutral-400 text-[length:var(--text-label-small-regular-font-size)] tracking-[var(--text-label-small-regular-letter-spacing)] leading-[var(--text-label-small-regular-line-height)] [font-style:var(--text-label-small-regular-font-style)]">
                                {formatFileSize(uploadedFile.size)}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={handleFileRemove}
                              className="relative w-6 h-6 flex items-center justify-center text-neutralneutral-400 hover:text-[#036e49] transition-colors cursor-pointer flex-shrink-0"
                              aria-label="Remove file"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:inline-flex sm:items-center gap-3 relative w-full sm:w-auto sm:flex-[0_0_auto]">
                <Button 
                  className="h-auto inline-flex items-center justify-center gap-1 px-3.5 py-2.5 relative w-full sm:w-auto sm:flex-[0_0_auto] bg-[#3c8787] hover:bg-[#2d6666] rounded-lg overflow-hidden border-0"
                  disabled={!templateName || !templateType || !uploadedFile}
                  onClick={() => {
                    clientLogger.info('TemplateCreationStep - Submit button clicked', {
                      templateName,
                      templateType,
                      fileName: uploadedFile?.name,
                      fileSize: uploadedFile?.size,
                      hasAllRequiredFields: !!(templateName && templateType && uploadedFile),
                      transitioningToEdit: true
                    });
                    setStep("edit");
                  }}
                >
                  <span className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-white text-sm tracking-[0] leading-5 whitespace-nowrap">
                    Submit
                  </span>
                </Button>

                <Button
                  variant="outline"
                  onClick={onCancel}
                  className="h-auto inline-flex items-center justify-center gap-1 px-3.5 py-2.5 relative w-full sm:w-auto sm:flex-[0_0_auto] rounded-lg overflow-hidden border border-solid border-[#3c8787] bg-transparent hover:bg-[#3c8787]/10"
                >
                  <span className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-[#3c8787] text-sm tracking-[0] leading-5 whitespace-nowrap">
                    Cancel
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="relative self-stretch w-full h-[74px]" />
        </div>
      </div>
    );
  }

  if (step === "edit") {
    clientLogger.info('TemplateCreationStep - Rendering PDFEditor', {
      templateType,
      templateTypeAsString: String(templateType),
      templateName,
      hasUploadedFile: !!uploadedFile,
      hasExistingTemplate: !!existingTemplate
    });

    return (
      <div className="space-y-6">
        <PDFEditor 
          initialPdfFile={uploadedFile || undefined}
          initialWorkflowState="template"
          templateType={templateType as 'lease' | 'addendum'}
          templateName={templateName}
          initialTemplate={existingTemplate}
          hostName={hostName}
          hostEmail={hostEmail}
          listingAddress={listingAddress}
          listingId={listingId}
          onCancel={() => setStep("upload")}
          onSave={(templateData) => {
            // Combine the metadata from step 1 with the field data from editor
            const template = {
              name: templateName,
              type: templateType,
              file: templateData.pdfFile,
              fields: templateData.fields,
              recipients: templateData.recipients,
            };
            onTemplateCreated?.(template);
          }}
          onCancel={existingTemplate ? onCancel : () => setStep("upload")}
        />
      </div>
    );
  }


  return null;
}

"use client";

import React, { useState, useEffect } from "react";
import { FileText, User, Calendar, DollarSign, Home, ChevronRight, Save, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PDFEditor } from "@/components/pdf-editor/PDFEditor";
import type { Template, DocumentCreateInput, DocumentField } from "../types";

interface DocumentCreationStepProps {
  template?: Template;
  propertyData?: {
    id: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    monthlyRent: number;
    securityDeposit: number;
    bedrooms: number;
    bathrooms: number;
  };
  tenantData?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  onDocumentCreated?: (document: DocumentCreateInput) => void;
  onCancel?: () => void;
  onBack?: () => void;
}

export function DocumentCreationStep({ 
  template, 
  propertyData, 
  tenantData, 
  onDocumentCreated, 
  onCancel,
  onBack 
}: DocumentCreationStepProps) {
  const [activeTab, setActiveTab] = useState("details");
  const [documentName, setDocumentName] = useState("");
  const [leaseStartDate, setLeaseStartDate] = useState("");
  const [leaseEndDate, setLeaseEndDate] = useState("");
  const [monthlyRent, setMonthlyRent] = useState(propertyData?.monthlyRent?.toString() || "");
  const [securityDeposit, setSecurityDeposit] = useState(propertyData?.securityDeposit?.toString() || "");
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});
  const [recipients, setRecipients] = useState([
    {
      role: 'HOST' as const,
      name: '',
      email: ''
    },
    {
      role: 'RENTER' as const,
      name: tenantData ? `${tenantData.firstName} ${tenantData.lastName}` : '',
      email: tenantData?.email || ''
    }
  ]);

  // Auto-generate document name
  useEffect(() => {
    if (propertyData && tenantData && !documentName) {
      const date = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      setDocumentName(`Lease - ${propertyData.address} - ${tenantData.lastName} - ${date}`);
    }
  }, [propertyData, tenantData, documentName]);

  // Auto-populate field values based on property and tenant data
  useEffect(() => {
    if (template) {
      const autoFieldValues: Record<string, any> = {};
      
      template.fields.forEach(field => {
        // Auto-populate based on field label patterns
        const label = (field.label || '').toLowerCase();
        
        if (propertyData) {
          if (label.includes('property address') || label.includes('premises address')) {
            autoFieldValues[field.id] = propertyData.address;
          } else if (label.includes('city')) {
            autoFieldValues[field.id] = propertyData.city;
          } else if (label.includes('state')) {
            autoFieldValues[field.id] = propertyData.state;
          } else if (label.includes('zip') || label.includes('postal')) {
            autoFieldValues[field.id] = propertyData.zipCode;
          } else if (label.includes('monthly rent') || label.includes('rent amount')) {
            autoFieldValues[field.id] = propertyData.monthlyRent;
          } else if (label.includes('security deposit') || label.includes('deposit amount')) {
            autoFieldValues[field.id] = propertyData.securityDeposit;
          } else if (label.includes('bedroom')) {
            autoFieldValues[field.id] = propertyData.bedrooms;
          } else if (label.includes('bathroom')) {
            autoFieldValues[field.id] = propertyData.bathrooms;
          }
        }
        
        if (tenantData) {
          if (label.includes('tenant name') || label.includes('renter name')) {
            autoFieldValues[field.id] = `${tenantData.firstName} ${tenantData.lastName}`;
          } else if (label.includes('tenant email') || label.includes('renter email')) {
            autoFieldValues[field.id] = tenantData.email;
          } else if (label.includes('tenant phone') || label.includes('renter phone')) {
            autoFieldValues[field.id] = tenantData.phone;
          } else if (label.includes('first name')) {
            autoFieldValues[field.id] = tenantData.firstName;
          } else if (label.includes('last name')) {
            autoFieldValues[field.id] = tenantData.lastName;
          }
        }
        
        // Date fields
        if (label.includes('lease start') || label.includes('commencement date')) {
          autoFieldValues[field.id] = leaseStartDate;
        } else if (label.includes('lease end') || label.includes('termination date')) {
          autoFieldValues[field.id] = leaseEndDate;
        }
      });
      
      setFieldValues(autoFieldValues);
    }
  }, [template, propertyData, tenantData, leaseStartDate, leaseEndDate]);

  const handleCreateDocument = () => {
    if (!template) return;

    const documentData: DocumentCreateInput = {
      templateId: template.id,
      name: documentName,
      recipients,
      fields: Object.entries(fieldValues).map(([fieldId, value]) => ({
        id: fieldId,
        value
      })),
      metadata: {
        propertyId: propertyData?.id,
        propertyAddress: propertyData?.address,
        leaseStartDate: leaseStartDate ? new Date(leaseStartDate) : undefined,
        leaseEndDate: leaseEndDate ? new Date(leaseEndDate) : undefined,
        monthlyRent: monthlyRent ? parseFloat(monthlyRent) : undefined,
        securityDeposit: securityDeposit ? parseFloat(securityDeposit) : undefined,
        tenantId: tenantData?.id,
        tenantName: tenantData ? `${tenantData.firstName} ${tenantData.lastName}` : undefined,
      },
      autoPopulate: true
    };

    onDocumentCreated?.(documentData);
  };

  const updateRecipient = (index: number, field: 'name' | 'email', value: string) => {
    const newRecipients = [...recipients];
    newRecipients[index][field] = value;
    setRecipients(newRecipients);
  };

  if (!template) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <FileText className="w-12 h-12 mx-auto text-gray-400" />
              <h3 className="text-lg font-semibold">No Template Selected</h3>
              <p className="text-sm text-gray-500">Please select a template to create a document</p>
              <Button onClick={onBack} className="mt-4">
                Select Template
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-[#020202]">Create Document</h2>
          <p className="text-[#777b8b]">Generate a new document from template: {template.name}</p>
        </div>
        <div className="flex gap-3">
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              Back
            </Button>
          )}
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="recipients">Recipients</TabsTrigger>
          <TabsTrigger value="fields">Fields</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Document Details</CardTitle>
              <CardDescription>Basic information about the lease document</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="documentName">Document Name</Label>
                <Input
                  id="documentName"
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  placeholder="e.g., Lease Agreement - 123 Main St"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="leaseStart">Lease Start Date</Label>
                  <Input
                    id="leaseStart"
                    type="date"
                    value={leaseStartDate}
                    onChange={(e) => setLeaseStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="leaseEnd">Lease End Date</Label>
                  <Input
                    id="leaseEnd"
                    type="date"
                    value={leaseEndDate}
                    onChange={(e) => setLeaseEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="monthlyRent">Monthly Rent</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="monthlyRent"
                      type="number"
                      value={monthlyRent}
                      onChange={(e) => setMonthlyRent(e.target.value)}
                      className="pl-9"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="securityDeposit">Security Deposit</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="securityDeposit"
                      type="number"
                      value={securityDeposit}
                      onChange={(e) => setSecurityDeposit(e.target.value)}
                      className="pl-9"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {propertyData && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Home className="w-4 h-4" />
                    Property Information
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>{propertyData.address}</p>
                    <p>{propertyData.city}, {propertyData.state} {propertyData.zipCode}</p>
                    <p>{propertyData.bedrooms} bed, {propertyData.bathrooms} bath</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recipients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Document Recipients</CardTitle>
              <CardDescription>People who will sign this document</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recipients.map((recipient, index) => (
                <div key={index} className="space-y-4 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{recipient.role}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={recipient.name}
                        onChange={(e) => updateRecipient(index, 'name', e.target.value)}
                        placeholder="Enter recipient name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={recipient.email}
                        onChange={(e) => updateRecipient(index, 'email', e.target.value)}
                        placeholder="Enter email address"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fields" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Document Fields</CardTitle>
              <CardDescription>Review and edit field values</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {template.fields.map((field) => (
                  <div key={field.id} className="flex items-center gap-4 p-3 border rounded-lg">
                    <div className="flex-1 space-y-2">
                      <Label>{field.label || 'Field'}</Label>
                      {field.type === 'checkbox' ? (
                        <input
                          type="checkbox"
                          checked={fieldValues[field.id] || false}
                          onChange={(e) => setFieldValues({
                            ...fieldValues,
                            [field.id]: e.target.checked
                          })}
                          className="w-4 h-4"
                        />
                      ) : field.type === 'date' ? (
                        <Input
                          type="date"
                          value={fieldValues[field.id] || ''}
                          onChange={(e) => setFieldValues({
                            ...fieldValues,
                            [field.id]: e.target.value
                          })}
                        />
                      ) : (
                        <Input
                          value={fieldValues[field.id] || ''}
                          onChange={(e) => setFieldValues({
                            ...fieldValues,
                            [field.id]: e.target.value
                          })}
                          placeholder={field.placeholder || `Enter ${(field.label || 'value').toLowerCase()}`}
                        />
                      )}
                    </div>
                    <Badge variant={field.required ? "default" : "secondary"}>
                      {field.required ? 'Required' : 'Optional'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Document Preview</CardTitle>
              <CardDescription>Review the document before sending</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[600px] bg-gray-50 flex items-center justify-center">
                <p className="text-gray-500">Document preview will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => handleCreateDocument()}>
          <Save className="w-4 h-4 mr-2" />
          Save as Draft
        </Button>
        <Button 
          className="bg-[#3c8787] hover:bg-[#2d6666]"
          onClick={() => {
            handleCreateDocument();
          }}
        >
          <Send className="w-4 h-4 mr-2" />
          Create & Send
        </Button>
      </div>
    </div>
  );
}
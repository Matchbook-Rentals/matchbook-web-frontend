"use client";

import React, { useState, useEffect } from "react";
import { Send, CheckCircle, Clock, AlertCircle, FileSignature, Download, RefreshCw, User, Mail, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import type { Document, DocumentRecipient, SigningWorkflow } from "../types";

interface SignerXStepProps {
  document: Document;
  signers?: DocumentRecipient[];
  onSigningComplete?: (signedDocument: Document) => void;
  onCancel?: () => void;
  onBack?: () => void;
}

export function SignerXStep({ 
  document, 
  signers = [], 
  onSigningComplete, 
  onCancel,
  onBack 
}: SignerXStepProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [signingStatus, setSigningStatus] = useState<'ready' | 'sending' | 'sent' | 'completed'>('ready');
  const [recipients, setRecipients] = useState<DocumentRecipient[]>(signers.length > 0 ? signers : document.recipients || []);
  const [signingProgress, setSigningProgress] = useState(0);
  const [selectedRecipient, setSelectedRecipient] = useState<string | null>(null);

  // Calculate signing progress
  useEffect(() => {
    const signedCount = recipients.filter(r => r.status === 'signed').length;
    const totalCount = recipients.length;
    setSigningProgress(totalCount > 0 ? (signedCount / totalCount) * 100 : 0);
    
    if (signedCount === totalCount && totalCount > 0) {
      setSigningStatus('completed');
    }
  }, [recipients]);

  const handleSendForSignature = async () => {
    setSigningStatus('sending');
    
    // Simulate sending process
    setTimeout(() => {
      setSigningStatus('sent');
      // Update recipients to "sent" status
      setRecipients(recipients.map(r => ({
        ...r,
        status: 'sent',
        sentAt: new Date()
      })));
    }, 2000);
  };

  const handleResendToRecipient = (recipientId: string) => {
    setRecipients(recipients.map(r => 
      r.id === recipientId 
        ? { ...r, sentAt: new Date() }
        : r
    ));
  };

  const handleDownloadDocument = () => {
    // Implement document download
    console.log('Downloading document...');
  };

  const getStatusColor = (status: DocumentRecipient['status']) => {
    switch (status) {
      case 'signed': return 'text-green-600 bg-green-50';
      case 'sent': return 'text-blue-600 bg-blue-50';
      case 'viewed': return 'text-yellow-600 bg-yellow-50';
      case 'declined': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: DocumentRecipient['status']) => {
    switch (status) {
      case 'signed': return <CheckCircle className="w-4 h-4" />;
      case 'sent': return <Send className="w-4 h-4" />;
      case 'viewed': return <Eye className="w-4 h-4" />;
      case 'declined': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  // Simulate receiving signature updates
  useEffect(() => {
    if (signingStatus === 'sent') {
      const interval = setInterval(() => {
        setRecipients(prev => {
          const updated = [...prev];
          const pendingIndex = updated.findIndex(r => r.status === 'sent');
          
          if (pendingIndex !== -1) {
            // Simulate progression: sent -> viewed -> signed
            if (Math.random() > 0.5) {
              updated[pendingIndex] = {
                ...updated[pendingIndex],
                status: 'viewed',
                viewedAt: new Date()
              };
            }
          }
          
          const viewedIndex = updated.findIndex(r => r.status === 'viewed');
          if (viewedIndex !== -1 && Math.random() > 0.3) {
            updated[viewedIndex] = {
              ...updated[viewedIndex],
              status: 'signed',
              signedAt: new Date()
            };
          }
          
          return updated;
        });
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [signingStatus]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-[#020202]">Document Signing</h2>
          <p className="text-[#777b8b]">{document.name}</p>
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

      {/* Status Overview */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Signing Progress</p>
              <p className="text-2xl font-bold">{Math.round(signingProgress)}% Complete</p>
            </div>
            <Badge className={`px-3 py-1 ${
              signingStatus === 'completed' ? 'bg-green-100 text-green-800' :
              signingStatus === 'sent' ? 'bg-blue-100 text-blue-800' :
              signingStatus === 'sending' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {signingStatus === 'completed' ? 'All Signed' :
               signingStatus === 'sent' ? 'In Progress' :
               signingStatus === 'sending' ? 'Sending...' :
               'Ready to Send'}
            </Badge>
          </div>
          <Progress value={signingProgress} className="h-2" />
          <div className="flex justify-between mt-2 text-sm text-gray-500">
            <span>{recipients.filter(r => r.status === 'signed').length} signed</span>
            <span>{recipients.length} total signers</span>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="recipients">Recipients</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {signingStatus === 'ready' && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Document is ready to send for signatures. Review the recipients and click &quot;Send for Signature&quot; to begin.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3">
                {signingStatus === 'ready' && (
                  <Button 
                    className="bg-[#3c8787] hover:bg-[#2d6666]"
                    onClick={handleSendForSignature}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send for Signature
                  </Button>
                )}
                
                {signingStatus === 'sent' && (
                  <Button variant="outline" onClick={() => handleSendForSignature()}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Resend Reminders
                  </Button>
                )}
                
                {signingStatus === 'completed' && (
                  <>
                    <Button 
                      className="bg-[#3c8787] hover:bg-[#2d6666]"
                      onClick={() => onSigningComplete?.(document)}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Complete Process
                    </Button>
                    <Button variant="outline" onClick={handleDownloadDocument}>
                      <Download className="w-4 h-4 mr-2" />
                      Download Signed Document
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Signing Order */}
          <Card>
            <CardHeader>
              <CardTitle>Signing Order</CardTitle>
              <CardDescription>Recipients will sign in this order</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recipients.map((recipient, index) => (
                  <div key={recipient.id} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{recipient.name}</p>
                      <p className="text-sm text-gray-500">{recipient.role}</p>
                    </div>
                    <Badge className={getStatusColor(recipient.status)}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(recipient.status)}
                        {recipient.status}
                      </span>
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recipients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recipient Details</CardTitle>
              <CardDescription>Manage and track individual signers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recipients.map((recipient) => (
                <div key={recipient.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <p className="font-medium">{recipient.name}</p>
                        <Badge variant="outline">{recipient.role}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <p className="text-sm text-gray-600">{recipient.email}</p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(recipient.status)}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(recipient.status)}
                        {recipient.status}
                      </span>
                    </Badge>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Sent</p>
                      <p className="font-medium">
                        {recipient.sentAt ? new Date(recipient.sentAt).toLocaleDateString() : 'Not sent'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Viewed</p>
                      <p className="font-medium">
                        {recipient.viewedAt ? new Date(recipient.viewedAt).toLocaleDateString() : 'Not viewed'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Signed</p>
                      <p className="font-medium">
                        {recipient.signedAt ? new Date(recipient.signedAt).toLocaleDateString() : 'Not signed'}
                      </p>
                    </div>
                  </div>
                  
                  {signingStatus === 'sent' && recipient.status !== 'signed' && (
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleResendToRecipient(recipient.id)}
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Resend
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
              <CardDescription>Timeline of all signing events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Simulated activity log */}
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Document created</p>
                    <p className="text-xs text-gray-500">{new Date().toLocaleString()}</p>
                  </div>
                </div>
                
                {signingStatus !== 'ready' && (
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Document sent for signature</p>
                      <p className="text-xs text-gray-500">{new Date().toLocaleString()}</p>
                    </div>
                  </div>
                )}
                
                {recipients.filter(r => r.viewedAt).map((recipient) => (
                  <div key={`${recipient.id}-viewed`} className="flex gap-3">
                    <div className="flex-shrink-0 w-2 h-2 rounded-full bg-yellow-500 mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{recipient.name} viewed the document</p>
                      <p className="text-xs text-gray-500">
                        {recipient.viewedAt ? new Date(recipient.viewedAt).toLocaleString() : ''}
                      </p>
                    </div>
                  </div>
                ))}
                
                {recipients.filter(r => r.signedAt).map((recipient) => (
                  <div key={`${recipient.id}-signed`} className="flex gap-3">
                    <div className="flex-shrink-0 w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{recipient.name} signed the document</p>
                      <p className="text-xs text-gray-500">
                        {recipient.signedAt ? new Date(recipient.signedAt).toLocaleString() : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
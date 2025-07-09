'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ImageIcon, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';

export default function ImageUploadTest() {
  const TEST_IMAGE_URL = "https://www.furnishedfinder.com/_pdp_/224115/1/224115_1_6143029-650-570.jpg";

  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [checked, setChecked] = useState(0);
  const [changed, setChanged] = useState(0);

  const handleProcessCSV = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);
    setChecked(0);
    setChanged(0);
    
    try {
      const res = await fetch('/api/process-furnishedfinder-csv');
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        setError(data.error || "Unknown error");
      } else {
        setChecked(data.checked);
        setChanged(data.changed);
        setResponse(data);
      }
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);
    setChecked(0);
    setChanged(0);
    
    try {
      setChecked(1);
      const res = await fetch(`/api/uploadthing/direct?fileURL=${encodeURIComponent(TEST_IMAGE_URL)}`);
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || "Unknown error");
      } else {
        setResponse(data);
        if (data.url) {
          setChanged(1);
        }
      }
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <ImageIcon className="h-8 w-8" />
          Image Upload Test
        </h1>
        <p className="text-muted-foreground">
          Test image upload functionality and FurnishedFinder CSV processing
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              FurnishedFinder CSV Processing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Process CSV data from FurnishedFinder to upload and convert image URLs
            </p>
            
            <Button
              onClick={handleProcessCSV}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              {loading ? "Processing..." : "Process CSV for FurnishedFinder URLs"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Direct Image Upload Test
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Test direct image upload using a sample FurnishedFinder image
            </p>
            
            <div className="text-sm text-muted-foreground">
              <p><strong>Test Image URL:</strong></p>
              <p className="break-all font-mono text-xs bg-muted p-2 rounded">
                {TEST_IMAGE_URL}
              </p>
            </div>
            
            <Button
              onClick={handleUpload}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <ImageIcon className="h-4 w-4" />
              {loading ? "Uploading..." : "Upload Test Image"}
            </Button>
          </CardContent>
        </Card>

        {/* Progress and Status */}
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{checked}</div>
                <div className="text-sm text-muted-foreground">Checked</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{changed}</div>
                <div className="text-sm text-muted-foreground">Changed</div>
              </div>
            </div>

            {loading && (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Processing...</div>
                <Progress value={undefined} className="w-full" />
              </div>
            )}

            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  Error: {error}
                </AlertDescription>
              </Alert>
            )}

            {response && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Operation completed successfully!
                </AlertDescription>
              </Alert>
            )}

            {response && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Response:</div>
                <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
                  {JSON.stringify(response, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
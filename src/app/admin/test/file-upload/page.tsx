"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileUpload, FileUploadButton } from '@/components/ui/file-upload';
import { FileList, FileObject } from '@/components/ui/file-preview';
import { Upload, FileUp } from 'lucide-react';

export default function FileUploadTest() {
  const [uploadedFiles, setUploadedFiles] = useState<FileObject[]>([]);
  const [buttonUploadedFiles, setButtonUploadedFiles] = useState<FileObject[]>([]);

  const handleFilesUploaded = (files: FileObject[]) => {
    console.log('Files uploaded:', files);
    setUploadedFiles(files);
  };

  const handleButtonFilesUploaded = (files: FileObject[]) => {
    console.log('Files uploaded with button:', files);
    setButtonUploadedFiles((prev) => [...prev, ...files]);
  };

  const handleUploadError = (error: Error) => {
    console.error('Upload error:', error);
    alert(`Upload error: ${error.message}`);
  };

  const handleRemoveButtonFile = (index: number) => {
    const newFiles = [...buttonUploadedFiles];
    newFiles.splice(index, 1);
    setButtonUploadedFiles(newFiles);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Upload className="h-8 w-8" />
          File Upload Test
        </h1>
        <p className="text-muted-foreground">
          Test file upload functionality including dropzone and button upload methods
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* File Upload Dropzone */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              File Upload Dropzone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Upload files by dragging and dropping them into the area below, or click to select files.
            </p>
            
            <FileUpload
              onFilesUploaded={handleFilesUploaded}
              onUploadError={handleUploadError}
              uploadType="documentUploader"
              maxFiles={10}
              maxSize={16 * 1024 * 1024} // 16MB
              uploadText="Drop files here or click to upload"
              showPreview={true}
            />
          </CardContent>
        </Card>
        
        {/* File Upload Button */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileUp className="h-5 w-5" />
              File Upload Button
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Upload files by clicking the button below to select files.
            </p>
            
            <FileUploadButton
              onFilesUploaded={handleButtonFilesUploaded}
              onUploadError={handleUploadError}
              uploadType="documentUploader"
              buttonText="Upload Documents"
              variant="default"
            />
            
            {/* Preview of uploaded files */}
            {buttonUploadedFiles.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-2">Uploaded Files</h3>
                <FileList
                  files={buttonUploadedFiles}
                  onRemove={handleRemoveButtonFile}
                  showRemove={true}
                  previewSize="small"
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Implementation Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Key Features</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                <li>Support for various file types including documents, images, PDFs</li>
                <li>Preview functionality for images and thumbnails for other file types</li>
                <li>File download support with proper file naming</li>
                <li>Support for both public and private files through signed URLs</li>
                <li>Multiple file upload with drag and drop</li>
                <li>Progress tracking during uploads</li>
                <li>File size formatting and validation</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Technical Implementation</h3>
              <p className="text-sm text-muted-foreground">
                These components use UploadThing for file uploads, which provides a secure and efficient way to handle files.
                Files are stored in cloud storage and served via a CDN for optimal performance.
                The components handle both public and private files, with signed URLs generated for access-controlled files.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
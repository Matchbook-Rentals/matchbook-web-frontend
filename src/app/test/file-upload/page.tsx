"use client";

import React, { useState } from 'react';
import { FileUpload, FileUploadButton } from '@/components/ui/file-upload';
import { FileList, FileObject } from '@/components/ui/file-preview';
import { Card } from '@/components/ui/card';

export default function FileUploadDemoPage() {
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
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">File Upload Demo</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* File Upload Dropzone */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">File Upload Dropzone</h2>
          <p className="text-gray-500 mb-4">
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
        </Card>
        
        {/* File Upload Button */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">File Upload Button</h2>
          <p className="text-gray-500 mb-4">
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
        </Card>
      </div>
      
      <div className="mt-12">
        <h2 className="text-xl font-semibold mb-4">Using the File Components</h2>
        
        <div className="prose max-w-none">
          <h3>Key Features</h3>
          <ul>
            <li>Support for various file types including documents, images, PDFs</li>
            <li>Preview functionality for images and thumbnails for other file types</li>
            <li>File download support with proper file naming</li>
            <li>Support for both public and private files through signed URLs</li>
            <li>Multiple file upload with drag and drop</li>
            <li>Progress tracking during uploads</li>
            <li>File size formatting and validation</li>
          </ul>
          
          <h3>Implementation Details</h3>
          <p>
            These components use UploadThing for file uploads, which provides a secure and efficient way to handle files.
            Files are stored in cloud storage and served via a CDN for optimal performance.
            The components handle both public and private files, with signed URLs generated for access-controlled files.
          </p>
          
          <h3>Component Integration</h3>
          <p>
            To use these components in your project:
          </p>
          <ol>
            <li>Import the components: <code>FileUpload</code>, <code>FileUploadButton</code>, <code>FileList</code>, and <code>FilePreview</code></li>
            <li>Configure the UploadThing endpoint in your component</li>
            <li>Handle the uploaded files in your component state</li>
            <li>Display the files using the <code>FileList</code> or <code>FilePreview</code> components</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
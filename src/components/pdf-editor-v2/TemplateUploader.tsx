'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

interface TemplateUploaderProps {
  onFileUpload: (file: File) => void;
  setWorkflowState: (state: 'selection' | 'template' | 'document' | 'signer1' | 'signer2' | 'completed') => void;
}

export const TemplateUploader: React.FC<TemplateUploaderProps> = ({ onFileUpload, setWorkflowState }) => {
  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles[0]?.type === 'application/pdf') {
      onFileUpload(acceptedFiles[0]);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
  });

  return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Create Template</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWorkflowState('selection')}
            >
              ← Back to Menu
            </Button>
          </div>
          <div {...getRootProps()} className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            {isDragActive ? (
              <div>
                <p className="text-lg font-medium text-blue-600 mb-2">Drop the PDF here</p>
                <p className="text-sm text-gray-500">Release to upload</p>
              </div>
            ) : (
              <div>
                <p className="text-lg font-medium text-gray-900 mb-2">Upload PDF Document</p>
                <p className="text-sm text-gray-500 mb-4">Drag & drop a PDF here, or click to select</p>
                <Button variant="outline">
                  Choose File
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

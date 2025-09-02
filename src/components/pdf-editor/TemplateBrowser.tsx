'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, Trash2, Calendar, User, FileText } from 'lucide-react';
import { PdfTemplate } from '@prisma/client';
import { useBrandAlert, createBrandAlert, createBrandConfirm } from '@/hooks/useBrandAlert';

interface TemplateBrowserProps {
  onLoadTemplate: (template: PdfTemplate) => void;
  onClose: () => void;
}

export const TemplateBrowser: React.FC<TemplateBrowserProps> = ({
  onLoadTemplate,
  onClose,
}) => {
  const { showAlert, showConfirm } = useBrandAlert();
  const brandAlert = createBrandAlert(showAlert);
  const brandConfirm = createBrandConfirm(showConfirm);
  const [templates, setTemplates] = useState<PdfTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTemplate, setLoadingTemplate] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/pdf-templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates);
      } else {
        console.error('Failed to fetch templates');
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadTemplate = async (templateId: string) => {
    try {
      setLoadingTemplate(templateId);
      const response = await fetch(`/api/pdf-templates/${templateId}`);
      if (response.ok) {
        const data = await response.json();
        onLoadTemplate(data.template);
        // Don't auto-close - let the parent component handle navigation
      } else {
        brandAlert('Failed to load template', 'error', 'Load Failed');
      }
    } catch (error) {
      console.error('Error loading template:', error);
      brandAlert('Error loading template', 'error', 'Load Error');
    } finally {
      setLoadingTemplate(null);
    }
  };

  const handleDeleteTemplate = async (templateId: string, templateTitle: string) => {
    brandConfirm(
      `Are you sure you want to delete "${templateTitle}"? This action cannot be undone.`,
      async () => {
        await performDelete(templateId);
      },
      {
        title: 'Delete Template',
        type: 'warning',
        variant: 'destructive',
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    );
  };

  const performDelete = async (templateId: string) => {

    try {
      const response = await fetch(`/api/pdf-templates/${templateId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setTemplates(templates.filter(t => t.id !== templateId));
      } else {
        brandAlert('Failed to delete template', 'error', 'Delete Failed');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      brandAlert('Error deleting template', 'error', 'Delete Error');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl max-h-[80vh] mx-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">Load PDF Template</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </CardHeader>
        <CardContent className="overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading templates...</p>
              </div>
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No templates found</p>
              <p className="text-sm text-gray-500">Create and save templates to see them here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-lg truncate pr-2">
                        {template.title}
                      </h3>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLoadTemplate(template.id)}
                          disabled={loadingTemplate === template.id}
                          className="h-8 w-8 p-0"
                          title="Load template"
                        >
                          {loadingTemplate === template.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTemplate(template.id, template.title)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                          title="Delete template"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600">
                      {template.description && (
                        <p className="text-xs text-gray-500 line-clamp-2">
                          {template.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        <span>{template.pdfFileName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>Created: {formatDate(template.createdAt.toString())}</span>
                      </div>
                      {template.updatedAt.toString() !== template.createdAt.toString() && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>Modified: {formatDate(template.updatedAt.toString())}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-xs">Size: {formatFileSize(template.pdfFileSize || 0)}</span>
                        <div className="flex gap-1">
                          <Badge variant="outline" className="text-xs">
                            {(template.templateData as any)?.fields?.length || 0} fields
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {(template.templateData as any)?.recipients?.length || 0} recipients
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
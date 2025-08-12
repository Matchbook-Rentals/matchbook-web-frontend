"use client";

import { useState, useCallback, useEffect } from 'react';
import type { Template, TemplateCreateInput, TemplateUpdateInput, TemplateFilter } from '../types';

interface UseTemplateManagerReturn {
  templates: Template[];
  selectedTemplate?: Template;
  isLoading: boolean;
  error?: string;
  loadTemplates: (filter?: TemplateFilter) => Promise<void>;
  getTemplate: (id: string) => Promise<Template | undefined>;
  createTemplate: (input: TemplateCreateInput) => Promise<Template>;
  updateTemplate: (input: TemplateUpdateInput) => Promise<Template>;
  deleteTemplate: (id: string) => Promise<void>;
  selectTemplate: (template: Template) => void;
  clearSelection: () => void;
}

// Mock templates for demonstration
const MOCK_TEMPLATES: Template[] = [
  {
    id: 'template-1',
    name: 'Standard Residential Lease',
    description: 'A comprehensive lease agreement for residential properties',
    type: 'lease',
    fields: [
      {
        id: 'field-1',
        type: 'text',
        label: 'Tenant Name',
        required: true,
        recipientId: 'renter',
        page: 1,
        x: 100,
        y: 200,
        width: 200,
        height: 30,
      },
      {
        id: 'field-2',
        type: 'signature',
        label: 'Tenant Signature',
        required: true,
        recipientId: 'renter',
        page: 1,
        x: 100,
        y: 400,
        width: 200,
        height: 60,
      },
      {
        id: 'field-3',
        type: 'signature',
        label: 'Landlord Signature',
        required: true,
        recipientId: 'host',
        page: 1,
        x: 350,
        y: 400,
        width: 200,
        height: 60,
      },
    ],
    recipients: [
      {
        id: 'host',
        name: '[Host Name]',
        role: 'HOST',
        title: 'Host',
        color: '#0B6E6E',
        signingOrder: 2,
      },
      {
        id: 'renter',
        name: '[Renter Name]',
        role: 'RENTER',
        title: 'Primary Renter',
        color: '#fb8c00',
        signingOrder: 1,
      },
    ],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    createdBy: 'user-1',
    isActive: true,
    metadata: {
      propertyType: 'apartment',
      duration: '12-months',
      state: 'CA',
      tags: ['standard', 'residential'],
    },
  },
  {
    id: 'template-2',
    name: 'Month-to-Month Lease',
    description: 'Flexible month-to-month rental agreement',
    type: 'lease',
    fields: [
      {
        id: 'field-4',
        type: 'text',
        label: 'Tenant Name',
        required: true,
        recipientId: 'renter',
        page: 1,
        x: 100,
        y: 200,
        width: 200,
        height: 30,
      },
      {
        id: 'field-5',
        type: 'date',
        label: 'Start Date',
        required: true,
        recipientId: 'renter',
        page: 1,
        x: 100,
        y: 250,
        width: 150,
        height: 30,
      },
    ],
    recipients: [
      {
        id: 'host-2',
        name: '[Host Name]',
        role: 'HOST',
        title: 'Host',
        color: '#0B6E6E',
        signingOrder: 2,
      },
      {
        id: 'renter-2',
        name: '[Renter Name]',
        role: 'RENTER',
        title: 'Primary Renter',
        color: '#fb8c00',
        signingOrder: 1,
      },
    ],
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
    createdBy: 'user-1',
    isActive: true,
    metadata: {
      propertyType: 'apartment',
      duration: 'month-to-month',
      state: 'CA',
      tags: ['flexible', 'short-term'],
    },
  },
];

export function useTemplateManager(): UseTemplateManagerReturn {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const loadTemplates = useCallback(async (filter?: TemplateFilter) => {
    setIsLoading(true);
    setError(undefined);

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      let filteredTemplates = [...MOCK_TEMPLATES];

      if (filter) {
        if (filter.type) {
          filteredTemplates = filteredTemplates.filter(t => t.type === filter.type);
        }
        if (filter.isActive !== undefined) {
          filteredTemplates = filteredTemplates.filter(t => t.isActive === filter.isActive);
        }
        if (filter.searchTerm) {
          const term = filter.searchTerm.toLowerCase();
          filteredTemplates = filteredTemplates.filter(t => 
            t.name.toLowerCase().includes(term) || 
            t.description?.toLowerCase().includes(term)
          );
        }
        if (filter.tags && filter.tags.length > 0) {
          filteredTemplates = filteredTemplates.filter(t =>
            filter.tags!.some(tag => t.metadata?.tags?.includes(tag))
          );
        }
      }

      setTemplates(filteredTemplates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getTemplate = useCallback(async (id: string): Promise<Template | undefined> => {
    setIsLoading(true);
    setError(undefined);

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const template = MOCK_TEMPLATES.find(t => t.id === id);
      if (!template) {
        throw new Error('Template not found');
      }
      
      return template;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get template');
      return undefined;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createTemplate = useCallback(async (input: TemplateCreateInput): Promise<Template> => {
    setIsLoading(true);
    setError(undefined);

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      const newTemplate: Template = {
        id: Math.random().toString(36).substr(2, 9),
        name: input.name,
        description: input.description,
        type: input.type,
        fields: input.fields.map(field => ({
          ...field,
          id: Math.random().toString(36).substr(2, 9),
        })),
        recipients: input.recipients.map(recipient => ({
          ...recipient,
          id: Math.random().toString(36).substr(2, 9),
        })),
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'current-user',
        isActive: true,
        metadata: input.metadata,
      };

      setTemplates(prev => [...prev, newTemplate]);
      return newTemplate;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create template';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateTemplate = useCallback(async (input: TemplateUpdateInput): Promise<Template> => {
    setIsLoading(true);
    setError(undefined);

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const existingTemplate = templates.find(t => t.id === input.id);
      if (!existingTemplate) {
        throw new Error('Template not found');
      }

      const updatedTemplate: Template = {
        ...existingTemplate,
        ...input,
        updatedAt: new Date(),
      };

      setTemplates(prev => prev.map(t => t.id === input.id ? updatedTemplate : t));
      
      if (selectedTemplate?.id === input.id) {
        setSelectedTemplate(updatedTemplate);
      }

      return updatedTemplate;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update template';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [templates, selectedTemplate]);

  const deleteTemplate = useCallback(async (id: string): Promise<void> => {
    setIsLoading(true);
    setError(undefined);

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));

      setTemplates(prev => prev.filter(t => t.id !== id));
      
      if (selectedTemplate?.id === id) {
        setSelectedTemplate(undefined);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete template';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [selectedTemplate]);

  const selectTemplate = useCallback((template: Template) => {
    setSelectedTemplate(template);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedTemplate(undefined);
  }, []);

  // Load templates on mount
  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  return {
    templates,
    selectedTemplate,
    isLoading,
    error,
    loadTemplates,
    getTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    selectTemplate,
    clearSelection,
  };
}
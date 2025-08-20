import prisma from '@/lib/prismadb';
import { PdfTemplate } from '@prisma/client';

export interface PdfTemplateData {
  fields: any[];
  recipients: any[];
  metadata: {
    author: string;
    subject: string;
    createdWith: string;
  };
}

export interface CreatePdfTemplateInput {
  title: string;
  description?: string;
  type?: string;
  listingId?: string;
  templateData: PdfTemplateData;
  pdfFileUrl: string;
  pdfFileName: string;
  pdfFileSize: number;
  pdfFileKey: string;
  userId: string;
}

export interface UpdatePdfTemplateInput {
  title?: string;
  description?: string;
  type?: string;
  listingId?: string;
  templateData?: PdfTemplateData;
}

export class PdfTemplateService {
  /**
   * Create a new PDF template
   */
  async createTemplate(input: CreatePdfTemplateInput): Promise<PdfTemplate> {
    try {
      return await prisma.pdfTemplate.create({
        data: {
          title: input.title,
          description: input.description,
          type: input.type || 'lease',
          listingId: input.listingId,
          templateData: input.templateData as any,
          pdfFileUrl: input.pdfFileUrl,
          pdfFileName: input.pdfFileName,
          pdfFileSize: input.pdfFileSize,
          pdfFileKey: input.pdfFileKey,
          userId: input.userId,
        },
      });
    } catch (error) {
      console.error('Error creating PDF template:', error);
      throw new Error('Failed to create PDF template');
    }
  }

  /**
   * Get a PDF template by ID
   */
  async getTemplate(id: string, userId?: string): Promise<PdfTemplate | null> {
    try {
      const whereClause: any = { id };
      
      // If userId is provided, ensure user can only access their own templates
      if (userId) {
        whereClause.userId = userId;
      }

      return await prisma.pdfTemplate.findFirst({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });
    } catch (error) {
      console.error('Error getting PDF template:', error);
      throw new Error('Failed to get PDF template');
    }
  }

  /**
   * List PDF templates for a user, optionally filtered by listing
   */
  async listTemplates(userId: string, limit: number = 50, offset: number = 0, listingId?: string): Promise<{
    templates: (PdfTemplate & { user: { id: string; firstName: string | null; lastName: string | null; email: string | null } })[];
    total: number;
  }> {
    try {
      const whereClause: any = { userId };
      if (listingId !== undefined) {
        whereClause.listingId = listingId;
      }

      const [templates, total] = await Promise.all([
        prisma.pdfTemplate.findMany({
          where: whereClause,
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        prisma.pdfTemplate.count({
          where: whereClause,
        }),
      ]);

      return { templates, total };
    } catch (error) {
      console.error('Error listing PDF templates:', error);
      throw new Error('Failed to list PDF templates');
    }
  }

  /**
   * Update a PDF template
   */
  async updateTemplate(id: string, userId: string, input: UpdatePdfTemplateInput): Promise<PdfTemplate> {
    try {
      // First check if the template exists and belongs to the user
      const existingTemplate = await this.getTemplate(id, userId);
      if (!existingTemplate) {
        throw new Error('Template not found or access denied');
      }

      return await prisma.pdfTemplate.update({
        where: { id },
        data: {
          ...(input.title && { title: input.title }),
          ...(input.description !== undefined && { description: input.description }),
          ...(input.type && { type: input.type }),
          ...(input.listingId !== undefined && { listingId: input.listingId }),
          ...(input.templateData && { templateData: input.templateData as any }),
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Error updating PDF template:', error);
      throw new Error('Failed to update PDF template');
    }
  }

  /**
   * Delete a PDF template
   */
  async deleteTemplate(id: string, userId: string): Promise<void> {
    try {
      // First check if the template exists and belongs to the user
      const existingTemplate = await this.getTemplate(id, userId);
      if (!existingTemplate) {
        throw new Error('Template not found or access denied');
      }

      await prisma.pdfTemplate.delete({
        where: { id },
      });
    } catch (error) {
      console.error('Error deleting PDF template:', error);
      throw new Error('Failed to delete PDF template');
    }
  }

  /**
   * Search templates by title
   */
  async searchTemplates(userId: string, query: string, limit: number = 10): Promise<PdfTemplate[]> {
    try {
      return await prisma.pdfTemplate.findMany({
        where: {
          userId,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        orderBy: { updatedAt: 'desc' },
        take: limit,
      });
    } catch (error) {
      console.error('Error searching PDF templates:', error);
      throw new Error('Failed to search PDF templates');
    }
  }

  /**
   * Get template usage statistics
   */
  async getTemplateStats(userId: string): Promise<{
    totalTemplates: number;
    templatesThisMonth: number;
    totalFileSize: number;
  }> {
    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const [totalTemplates, templatesThisMonth, templates] = await Promise.all([
        prisma.pdfTemplate.count({ where: { userId } }),
        prisma.pdfTemplate.count({
          where: {
            userId,
            createdAt: { gte: startOfMonth },
          },
        }),
        prisma.pdfTemplate.findMany({
          where: { userId },
          select: { pdfFileSize: true },
        }),
      ]);

      const totalFileSize = templates.reduce((sum, template) => {
        return sum + (template.pdfFileSize || 0);
      }, 0);

      return {
        totalTemplates,
        templatesThisMonth,
        totalFileSize,
      };
    } catch (error) {
      console.error('Error getting template stats:', error);
      throw new Error('Failed to get template statistics');
    }
  }
}

// Export singleton instance
export const pdfTemplateService = new PdfTemplateService();
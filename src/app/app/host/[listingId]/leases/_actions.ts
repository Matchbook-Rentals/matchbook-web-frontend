'use server'

import prisma from '@/lib/prismadb'
import { revalidatePath } from 'next/cache'
import { UTApi } from 'uploadthing/server'
import { checkRole } from '@/utils/roles'
import { redirect } from 'next/navigation'

export async function getPdfTemplateStats(listingId: string) {
  try {
    // Security check
    const isAdminDev = await checkRole('admin_dev')
    if (!isAdminDev) {
      return {
        totalTemplates: 0,
        lastTemplateCreated: null,
      }
    }

    const templates = await prisma.pdfTemplate.findMany({
      where: {
        listingId,
      },
      select: {
        id: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return {
      totalTemplates: templates.length,
      lastTemplateCreated: templates[0]?.createdAt || null,
    }
  } catch (error) {
    console.error('Error fetching PDF template stats:', error)
    return {
      totalTemplates: 0,
      lastTemplateCreated: null,
    }
  }
}

export async function deleteAllPdfTemplates(listingId: string) {
  try {
    // Security checks
    const isAdminDev = await checkRole('admin_dev')
    if (!isAdminDev) {
      return {
        success: false,
        message: 'Unauthorized: admin_dev role required',
        deletedTemplates: 0,
        deletedFiles: 0,
      }
    }

    // Environment check - only allow in development
    if (process.env.NODE_ENV !== 'development') {
      return {
        success: false,
        message: 'This action is only available in development environment',
        deletedTemplates: 0,
        deletedFiles: 0,
      }
    }

    // Get all templates with their file keys before deletion
    const templates = await prisma.pdfTemplate.findMany({
      where: {
        listingId,
      },
      select: {
        id: true,
        pdfFileKey: true,
      }
    })

    if (templates.length === 0) {
      return {
        success: true,
        message: 'No templates found to delete',
        deletedTemplates: 0,
        deletedFiles: 0,
      }
    }

    // Delete from database using transaction
    const result = await prisma.$transaction(async (tx) => {
      const deletedTemplates = await tx.pdfTemplate.deleteMany({
        where: {
          listingId,
        }
      })

      return {
        deletedTemplates: deletedTemplates.count,
      }
    })

    // Delete PDF files from UploadThing
    let deletedFiles = 0
    const utapi = new UTApi()
    const fileKeysToDelete = templates
      .map(t => t.pdfFileKey)
      .filter((key): key is string => key !== null && key !== undefined)

    if (fileKeysToDelete.length > 0) {
      try {
        await utapi.deleteFiles(fileKeysToDelete)
        deletedFiles = fileKeysToDelete.length
      } catch (uploadThingError) {
        console.warn('Warning: Failed to delete some PDF files from UploadThing:', uploadThingError)
        // Don't fail the entire operation if UploadThing deletion fails
      }
    }

    revalidatePath(`/app/host/${listingId}/leases`)

    return {
      success: true,
      message: `Successfully deleted ${result.deletedTemplates} templates and ${deletedFiles} PDF files`,
      deletedTemplates: result.deletedTemplates,
      deletedFiles,
    }
  } catch (error) {
    console.error('Error deleting PDF templates:', error)
    return {
      success: false,
      message: 'Failed to delete templates. Please try again.',
      deletedTemplates: 0,
      deletedFiles: 0,
    }
  }
}

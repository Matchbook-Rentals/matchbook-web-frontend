'use server'

import prisma from '@/lib/prismadb'
import { auth } from '@clerk/nextjs/server'
import { PdfTemplate } from '@prisma/client'

export async function getTemplateForEdit(templateId: string, listingId: string) {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Unauthorized')
  }

  const template = await prisma.pdfTemplate.findFirst({
    where: {
      id: templateId,
      listingId: listingId,
      userId: userId
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        }
      }
    }
  })

  if (!template) {
    return null
  }

  return template
}

export async function fetchPdfFromUrl(pdfFileUrl: string): Promise<ArrayBuffer> {
  try {
    const response = await fetch(pdfFileUrl)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.statusText}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    return arrayBuffer
  } catch (error) {
    console.error('Error fetching PDF from URL:', error)
    throw new Error('Failed to fetch PDF file')
  }
}

export async function getListingDetails(listingId: string) {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Unauthorized')
  }

  const listing = await prisma.listing.findFirst({
    where: {
      id: listingId,
      userId: userId
    },
    select: {
      id: true,
      title: true,
      streetAddress1: true,
      streetAddress2: true,
      city: true,
      state: true,
      postalCode: true,
    }
  })

  return listing
}
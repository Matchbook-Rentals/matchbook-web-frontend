'use server'
import prisma from '@/lib/prismadb';
import { auth } from '@clerk/nextjs/server'

// Helper function to check authentication
async function checkAuth() {
  const { userId } = auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }
  return userId;
}

// Create
async function createBoldSignTemplate(data: {
  templateName?: string;
  templateDescription?: string;
}) {
  const userId = await checkAuth();
  return prisma.boldSignTemplate.create({
    data: {
      templateName: data.templateName || null,
      templateDescription: data.templateDescription || null,
      userId: userId,
    },
  });
}

// Read
async function getBoldSignTemplate(id: string) {
  const userId = await checkAuth();
  return prisma.boldSignTemplate.findUnique({
    where: { id, userId },
  });
}

// Update
async function updateBoldSignTemplate(id: string, data: {
  templateName?: string;
  templateDescription?: string;
}) {
  const userId = await checkAuth();
  return prisma.boldSignTemplate.update({
    where: { id, userId },
    data: {
      templateName: data.templateName,
      templateDescription: data.templateDescription,
    },
  });
}

// Delete
async function deleteBoldSignTemplate(id: string) {
  const userId = await checkAuth();
  return prisma.boldSignTemplate.delete({
    where: { id, userId },
  });
}

// Create template from listing
async function createTemplateFromListing(listingId: string, templateData: {
  templateId?: string;
  templateName?: string;
  templateDescription?: string;
}) {
  const userId = await checkAuth();

  const newTemplate = await prisma.boldSignTemplate.create({
    data: {
      id: templateData.templateId,
      templateName: templateData.templateName,
      templateDescription: templateData.templateDescription,
      userId: userId,
    },
  });

  await prisma.listing.update({
    where: { id: listingId },
    data: { boldSignTemplateId: newTemplate.id },
  });

  return newTemplate;
}

// Export the functions
export {
  createBoldSignTemplate,
  getBoldSignTemplate,
  updateBoldSignTemplate,
  deleteBoldSignTemplate,
  createTemplateFromListing,
};
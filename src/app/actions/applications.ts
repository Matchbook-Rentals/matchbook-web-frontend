'use server'

import prisma from '@/lib/prismadb'

export async function createApplication(data: any) {
  try {
    // Check for existing default
    const existingDefaultApplication = await prisma.application.findFirst({
      where: { isDefault: true }
    });
    const application = await prisma.application.create({
      data: {
        ...data,
        identifications: {
          create: data.identifications
        },
        incomes: {
          create: data.incomes
        },
        verificationImages: {
          create: data.verificationImages,
        },
        isDefault: !existingDefaultApplication,
        // tripId: someTrip.id, // if you have a trip to associate
      },
    });

    return { success: true, data: application };
  } catch (error) {
    console.error('Failed to create application:', error);
    return { success: false, error: 'Failed to create application' };
  }
}
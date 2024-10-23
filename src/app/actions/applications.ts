'use server'

import prisma from '@/lib/prismadb'
import { auth } from '@clerk/nextjs/server'

export async function createApplication(data: any) {
  try {
    const { userId } = auth();
    if (!userId) return { success: false, error: 'Unauthorized' };

    const application = await prisma.application.upsert({
      where: {
        userId_isDefault: {
          userId,
          isDefault: true,
        },
      },
      update: {
        ...data,
        identifications: {
          upsert: data.identifications.map((id: any) => ({
            where: { id: id.id || 'new' },
            update: id,
            create: id
          }))
        },
        incomes: {
          upsert: data.incomes.map((income: any) => ({
            where: { id: income.id || 'new' },
            update: income,
            create: income
          }))
        },
        verificationImages: {
          upsert: data.verificationImages.map((img: any) => ({
            where: { id: img.id || 'new' },
            update: img,
            create: img
          }))
        },
      },
      create: {
        ...data,
        userId,
        identifications: { create: data.identifications },
        incomes: { create: data.incomes },
        verificationImages: { create: data.verificationImages },
        isDefault: true,
      },
    });

    return { success: true, application };
  } catch (error) {
    console.error('Failed to create/update application:', error);
    return { success: false, error: 'Failed to create/update application' };
  }
}

export async function createDefaultApplication(data: any) {
  const { userId } = auth();
  if (!userId) return { success: false, error: 'Unauthorized' };

  try {
    const existingApplication = await prisma.application.findFirst({
      where: { userId }
    });

    if (existingApplication) {
      return { success: false, error: 'Application already exists' };
    }

    const application = await prisma.application.create({
      data: {
        ...data,
        userId,
        identifications: { create: data.identifications },
        incomes: { create: data.incomes },
        verificationImages: { create: data.verificationImages },
        isDefault: true,
      },
    });
    return { success: true, data: application };
  } catch (error) {
    console.error('Failed to create default application:', error);
    return { success: false, error: 'Failed to create default application' };
  }
}

export async function upsertNonDefaultApplication(data: any) {
  const { userId } = auth();
  if (!userId) return { success: false, error: 'Unauthorized' };

  if (!data.tripId) {
    return { success: false, error: 'tripId is required for non-default applications' };
  }

  try {
    const application = await prisma.application.upsert({
      where: {
        userId_tripId: {
          userId,
          tripId: data.tripId,
        },
      },
      update: {
        ...data,
        identifications: { upsert: data.identifications.map((id: any) => ({ where: { id: id.id }, update: id, create: id })) },
        incomes: { upsert: data.incomes.map((income: any) => ({ where: { id: income.id }, update: income, create: income })) },
        verificationImages: { upsert: data.verificationImages.map((img: any) => ({ where: { id: img.id }, update: img, create: img })) },
        isDefault: false,
      },
      create: {
        ...data,
        userId,
        identifications: { create: data.identifications },
        incomes: { create: data.incomes },
        verificationImages: { create: data.verificationImages },
        isDefault: false,
      },
    });
    return { success: true, data: application };
  } catch (error) {
    console.error('Failed to upsert non-default application:', error);
    return { success: false, error: 'Failed to upsert non-default application' };
  }
}

export async function getTripApplication(tripId?: string) {
  const { userId } = auth();
  if (!userId) return { success: false, error: 'Unauthorized' };

  try {
    let application;

    if (tripId) {
      application = await prisma.application.findUnique({
        where: {
          userId_tripId: {
            userId,
            tripId,
          },
        },
        include: {
          incomes: true,
          verificationImages: true,
          identifications: true,
        },
      });
    }

    if (!application) {
      application = await prisma.application.findUnique({
        where: {
          userId_isDefault: {
            userId,
            isDefault: true,
          },
        },
        include: {
          incomes: true,
          verificationImages: true,
          identifications: true,
        },
      });
    }

    if (!application) {
      return { success: false, application: null };
    }

    return { success: true, application };
  } catch (error) {
    console.error('Failed to get trip application:', error);
    return { success: false, error: 'Failed to get trip application' };
  }
}

export async function getUserApplication() {
  const { userId } = auth();
  if (!userId) return null;

  try {
    const application = await prisma.application.findFirst({
      where: {
        userId,
        isDefault: true,
      },
      include: {
        incomes: true,
        verificationImages: true,
        identifications: true,
      },
    });

    return application; // This will be null if no application is found
  } catch (error) {
    console.error('Failed to get user application:', error);
    return null;
  }
}


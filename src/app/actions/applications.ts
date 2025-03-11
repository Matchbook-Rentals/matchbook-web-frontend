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
        incomes: { create: data.incomes.map(({ id, ...rest }: any) => rest) },
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
        incomes: { create: data.incomes.map(({ id, ...rest }: any) => rest) },
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
        incomes: { upsert: data.incomes.map((income: any) => ({ where: { id: income.id || 'new' }, update: income, create: income })) },
        verificationImages: { upsert: data.verificationImages.map((img: any) => ({ where: { id: img.id }, update: img, create: img })) },
        isDefault: false,
      },
      create: {
        ...data,
        userId,
        identifications: { create: data.identifications },
        incomes: { create: data.incomes.map(({ id, ...rest }: any) => rest) },
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
          residentialHistories: true,
        },
      });
    }
    console.log('residentialHistories', application?.residentialHistories);

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
          residentialHistories: true,
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
        residentialHistories: {
          orderBy: {
            index: 'asc',
          },
        },
      },
    });
    console.log('residentialHistories', application?.residentialHistories);
    console.log('application', application);

    return application; // This will be null if no application is found
  } catch (error) {
    console.error('Failed to get user application:', error);
    return null;
  }
}

export async function updateApplication(data: any) {
  const { userId } = auth();
  if (!userId) return { success: false, error: 'Unauthorized' };

  const { identifications, incomes, verificationImages, tripId, ...rest } = data;

  const filteredData: any = {};
  for (const [key, value] of Object.entries(rest)) {
    if (value !== undefined) {
      filteredData[key] = value;
    }
  }

  if (identifications) {
    filteredData.identifications = {
      upsert: identifications.map((id: any) => ({
        where: { id: id.id || 'new' },
        update: id,
        create: id,
      })),
    };
  }

  if (incomes) {
    filteredData.incomes = {
      upsert: incomes.map((income: any) => ({
        where: { id: income.id || 'new' },
        update: income,
        create: (({ id, ...rest }: any) => rest)(income)
      })),
    };
  }

  if (verificationImages) {
    filteredData.verificationImages = {
      upsert: verificationImages.map((img: any) => ({
        where: { id: img.id || 'new' },
        update: img,
        create: img,
      })),
    };
  }

  let whereClause;
  if (tripId) {
    whereClause = { userId_tripId: { userId, tripId } };
  } else {
    whereClause = { userId_isDefault: { userId, isDefault: true } };
  }

  try {
    const updatedApplication = await prisma.application.update({
      where: whereClause,
      data: filteredData,
    });
    return { success: true, application: updatedApplication };
  } catch (error) {
    console.error('Failed to update application:', error);
    return { success: false, error: 'Failed to update application' };
  }
}

export async function upsertApplication(data: any) {
  // Get the user ID from Clerk. If no user is authenticated, return an error.
  const { userId } = auth();
  if (!userId) return { success: false, error: 'Unauthorized' };

  // Destructure the incoming data.  We separate out the nested arrays
  // and the tripId, and gather the rest of the fields into 'rest'.
  const { identifications, incomes, verificationImages, tripId, residentialHistories, ...rest } = data;
  console.log('IDENTIFICATIONS', identifications);

  // Create a new object 'filteredData' to store only the defined (non-undefined) values from 'rest'.
  // This prevents accidentally overwriting existing data with undefined values.
  const filteredData: any = {};
  for (const [key, value] of Object.entries(rest)) {
    if (value !== undefined) {
      filteredData[key] = value;
    }
  }

  // Prepare the nested objects for identifications, incomes, and verificationImages.
  // Each of these uses an 'upsert' operation, which is crucial for preventing duplicates.

  if (identifications) {
    filteredData.identifications = {
      // The 'upsert' array operation allows us to update existing records or create new ones.
      upsert: identifications.map((identificaiton: any) => ({
        // 'where':  Try to find an existing identification by its ID.  If 'id.id' is undefined (e.g., for a new identification),
        // it will use 'new'. Prisma will treat 'new' string as not matching any existing ID, forcing a create.
        where: { id: identificaiton.id || 'new' },
        // 'update': If a record with the given ID *is* found, update it with the provided data ('id').
        update: identificaiton,
        // 'create': If a record with the given ID is *not* found, create a new one with the provided data ('id').
        create: identificaiton,
      })),
    };
  }
  console.log('INCOMES', incomes);

  // The same 'upsert' logic is applied to incomes and verificationImages.
  if (incomes) {
    console.log('incomes', incomes);
    console.log('filteredData', filteredData);
    filteredData.incomes = {
      upsert: incomes.map((income: any) => ({
        where: { id: income.id || 'new' },
        update: income,
        create: (({ id, ...rest }: any) => rest)(income)
      })),
    };
  }

  if (verificationImages) {
    filteredData.verificationImages = {
      upsert: verificationImages.map((img: any) => ({
        where: { id: img.id || 'new' },
        update: img,
        create: img,
      })),
    };
  }

  if (residentialHistories) {
    filteredData.residentialHistories = {
      upsert: residentialHistories.map((rh: any, idx: number) => {
        const { applicationId, ...payload } = rh;
        return {
          where: { id: rh.id || 'new' },
          update: payload,
          create: { ...payload, index: idx },
        };
      }),
    };
  }

  // Prepare the data for creating a new application.  This is used in the 'create' part of the main upsert.
  const createData: any = {
    ...data, // Includes all fields from the input data
    userId,
    isDefault: tripId ? false : true, // Set 'isDefault' based on whether a 'tripId' is provided.
    // Conditionally include the creation of related records.  If, for example, 'identifications' is null,
    // we don't want to create an empty 'identifications' relation.
    identifications: identifications ? { create: identifications } : undefined,
    incomes: incomes ? { create: incomes.map(({ id, ...rest }: any) => rest) } : undefined,
    verificationImages: verificationImages ? { create: verificationImages } : undefined,
    residentialHistories: residentialHistories
      ? { create: residentialHistories.map(({ applicationId, ...rest }: any) => rest) }
      : undefined,
  };

  // Determine the 'where' clause for the main upsert.  This selects *which* application to update/create.
  let whereClause;
  if (tripId) {
    // If a 'tripId' is provided, we're dealing with a trip-specific application.
    whereClause = { userId_tripId: { userId, tripId } };
  } else {
    // Otherwise, we're dealing with the user's default application.
    whereClause = { userId_isDefault: { userId, isDefault: true } };
  }

  // Perform the main upsert operation on the 'application' table.
  try {
    const application = await prisma.application.upsert({
      where: whereClause, // Select the application to update or create.
      update: filteredData, // If the application exists, update it with the filtered data.
      create: createData, // If the application doesn't exist, create it with the 'createData'.
    });
    return { success: true, application };
  } catch (error) {
    console.error('Failed to upsert application:', error);
    return { success: false, error: 'Failed to upsert application' };
  }
}

export async function deleteIncome(incomeId: string) {
  const { userId } = auth();
  if (!userId) return { success: false, error: 'Unauthorized' };

  try {
    await prisma.income.delete({
      where: {
        id: incomeId,
      },
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to delete income:', error);
    return { success: false, error: 'Failed to delete income' };
  }
}

export async function markComplete(applicationId: string) {
  try {
    const application = await prisma.application.update({
      where: { id: applicationId },
      data: { isComplete: true },
    });
    return { success: true, application };
  } catch (error) {
    console.error("Failed to mark application as complete:", error);
    return { success: false, error: 'Failed to mark application as complete.' };
  }
}

export async function getFullApplication(applicationId: string) {
  try {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        identifications: {
          include: {
            idPhotos: true
          }
        },
        incomes: true,
        residentialHistories: true,
        verificationImages: true
      }
    });
    
    return { success: true, application };
  } catch (error) {
    console.error("Failed to fetch full application:", error);
    return { success: false, error: 'Failed to fetch application details.' };
  }
}

export async function markSynced(applicationId: string) {
  try {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        identifications: true,
        incomes: true,
        verificationImages: true,
      },
    });

    if (!application) {
      return { success: false, error: 'Application not found' };
    }

    if (
      !application.identifications || application.identifications.length === 0 ||
      !application.incomes || application.incomes.length === 0 ||
      !application.verificationImages || application.verificationImages.length === 0
    ) {
      return { success: false, error: 'Not all required fields are complete' };
    }

    return await markComplete(applicationId);
  } catch (error) {
    console.error("Failed to mark application as synced:", error);
    return { success: false, error: 'Failed to mark application as synced.' };
  }
}


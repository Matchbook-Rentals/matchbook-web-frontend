'use server'

import prisma from '@/lib/prismadb'
import { auth } from '@clerk/nextjs/server'

export async function createApplication(data: any) {
  try {
    const { userId } = auth();
    if (!userId) return { success: false, error: 'Unauthorized' };

    // Handle SSN encryption
    let applicationData = { ...data };
    if (data.ssn) {
      try {
        const { encryptData } = await import('@/utils/encryption');
        const encryptedSsn = await encryptData(data.ssn);
        if (encryptedSsn) {
          applicationData.ssn = encryptedSsn;
        } else {
          console.error('Failed to encrypt SSN');
        }
      } catch (error) {
        console.error('SSN encryption error:', error);
      }
    }

    const application = await prisma.application.upsert({
      where: {
        userId_isDefault: {
          userId,
          isDefault: true,
        },
      },
      update: {
        ...applicationData,
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

    // Handle SSN encryption
    let applicationData = { ...data };
    if (data.ssn) {
      try {
        const { encryptData } = await import('@/utils/encryption');
        const encryptedSsn = await encryptData(data.ssn);
        if (encryptedSsn) {
          applicationData.ssn = encryptedSsn;
        } else {
          console.error('Failed to encrypt SSN');
        }
      } catch (error) {
        console.error('SSN encryption error:', error);
      }
    }

    const application = await prisma.application.create({
      data: {
        ...applicationData,
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

  // Handle SSN encryption
  let applicationData = { ...data };
  if (data.ssn) {
    try {
      const { encryptData } = await import('@/utils/encryption');
      const encryptedSsn = await encryptData(data.ssn);
      if (encryptedSsn) {
        applicationData.ssn = encryptedSsn;
      } else {
        console.error('Failed to encrypt SSN');
      }
    } catch (error) {
      console.error('SSN encryption error:', error);
    }
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
        ...applicationData,
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
    // Debug residential histories if needed

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

    // Decrypt SSN if it exists
    let applicationWithDecryptedSSN = application;
    if (application.ssn) {
      try {
        const { decryptData } = await import('@/utils/encryption');
        const decryptedSsn = await decryptData(application.ssn);
        if (decryptedSsn) {
          // Create a new object instead of reassigning
          applicationWithDecryptedSSN = {
            ...application,
            ssn: decryptedSsn
          };
        }
      } catch (error) {
        console.error('Failed to decrypt SSN:', error);
      }
    }

    return { success: true, application: applicationWithDecryptedSSN };
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
        identifications: {
          include: {
            idPhotos: true
          }
        },
        residentialHistories: {
          orderBy: {
            index: 'asc',
          },
        },
      },
    });
    // Debug data if needed

    // Decrypt SSN if it exists
    let applicationWithDecryptedSSN = application;
    if (application?.ssn) {
      try {
        const { decryptData } = await import('@/utils/encryption');
        const decryptedSsn = await decryptData(application.ssn);
        if (decryptedSsn) {
          // Create a new object instead of reassigning
          applicationWithDecryptedSSN = {
            ...application,
            ssn: decryptedSsn
          };
        }
      } catch (error) {
        console.error('Failed to decrypt SSN:', error);
      }
    }

    return applicationWithDecryptedSSN; // This will be null if no application is found
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

  // Handle SSN encryption if present
  if (rest.ssn) {
    try {
      const { encryptData } = await import('@/utils/encryption');
      const encryptedSsn = await encryptData(rest.ssn);
      if (encryptedSsn) {
        filteredData.ssn = encryptedSsn;
      } else {
        console.error('Failed to encrypt SSN');
      }
    } catch (error) {
      console.error('SSN encryption error:', error);
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

  // Destructure the incoming data
  const { identifications, incomes, verificationImages, tripId, residentialHistories, ...rest } = data;

  // Create a new object 'filteredData' to store only the defined values
  const filteredData: any = {};
  for (const [key, value] of Object.entries(rest)) {
    if (value !== undefined) {
      filteredData[key] = value;
    }
  }

  // Handle SSN encryption if it's in the data
  if (rest.ssn) {
    try {
      const { encryptData } = await import('@/utils/encryption');
      const encryptedSsn = await encryptData(rest.ssn);
      if (encryptedSsn) {
        filteredData.ssn = encryptedSsn;
      } else {
        console.error('Failed to encrypt SSN');
      }
    } catch (error) {
      console.error('SSN encryption error:', error);
    }
  }

  try {
    // Log incoming identifications for debugging
    console.log('===== DETAILED IDENTIFICATION STRUCTURE DEBUG =====');
    if (identifications) {
      console.log(JSON.stringify({
        identifications_count: identifications.length,
        full_structure: identifications.map((id: any) => ({
          id: id.id,
          idType: id.idType,
          idNumber: id.idNumber,
          isPrimary: id.isPrimary,
          idPhotos: id.idPhotos ? {
            count: id.idPhotos.length,
            details: id.idPhotos.map((photo: any) => ({
              url: photo.url,
              isPrimary: photo.isPrimary,
              id: photo.id
            }))
          } : 'No idPhotos found'
        }))
      }, null, 2));
    } else {
      console.log('No identifications provided');
    }
    console.log('===== END OF DETAILED DEBUG =====');

    // Determine the where clause for upsert
    let whereClause;
    if (tripId) {
      whereClause = { userId_tripId: { userId, tripId } };
      filteredData.isDefault = false;
    } else {
      whereClause = { userId_isDefault: { userId, isDefault: true } };
      filteredData.isDefault = true;
    }

    console.log('DEBUG - Upsert where clause:', JSON.stringify(whereClause));

    // Check if record exists first - this lets us handle relationships differently for create vs update
    const existingApp = await prisma.application.findUnique({
      where: whereClause
    });

    // Process relationships based on whether it's a create or update operation
    if (existingApp) {
      console.log('DEBUG - Updating existing application');

      // Update the base record first
      await prisma.application.update({
        where: { id: existingApp.id },
        data: filteredData
      });

      // Handle relationships separately using connect/disconnect pattern
      if (identifications && identifications.length > 0) {
        // Delete all existing identifications for this application
        await prisma.identification.deleteMany({
          where: { applicationId: existingApp.id }
        });

        // Create new identifications
        for (const id of identifications) {
          // Create the identification
          const newId = await prisma.identification.create({
            data: {
              idType: id.idType,
              idNumber: id.idNumber,
              isPrimary: !!id.isPrimary,
              application: { connect: { id: existingApp.id } }
            }
          });

          // Create photos if they exist
          if (id.idPhotos && Array.isArray(id.idPhotos) && id.idPhotos.length > 0) {
            await Promise.all(id.idPhotos.map((photo: any) =>
              prisma.iDPhoto.create({
                data: {
                  url: photo.url || '',
                  fileKey: photo.fileKey,
                  customId: photo.customId,
                  fileName: photo.fileName,
                  isPrimary: !!photo.isPrimary,
                  identification: { connect: { id: newId.id } }
                }
              })
            ));
          }
        }
      }

      // Handle other relationships similarly
      if (incomes && incomes.length > 0) {
        await prisma.income.deleteMany({
          where: { applicationId: existingApp.id }
        });

        await Promise.all(incomes.map((income: any) => {
          const { id, ...incomeData } = income;
          return prisma.income.create({
            data: {
              source: incomeData.source,
              monthlyAmount: incomeData.monthlyAmount,
              imageUrl: incomeData.imageUrl,
              fileKey: incomeData.fileKey,
              customId: incomeData.customId,
              fileName: incomeData.fileName,
              application: { connect: { id: existingApp.id } }
            }
          });
        }));
      }

      if (verificationImages && verificationImages.length > 0) {
        await prisma.verificationImage.deleteMany({
          where: { applicationId: existingApp.id }
        });

        await Promise.all(verificationImages.map((img: any) => {
          const { id, ...imgData } = img;
          return prisma.verificationImage.create({
            data: {
              ...imgData,
              application: { connect: { id: existingApp.id } }
            }
          });
        }));
      }

      if (residentialHistories && residentialHistories.length > 0) {
        await prisma.residentialHistory.deleteMany({
          where: { applicationId: existingApp.id }
        });

        await Promise.all(residentialHistories.map((rh: any, idx: number) => {
          const { id, applicationId, ...rhData } = rh;
          return prisma.residentialHistory.create({
            data: {
              ...rhData,
              index: idx,
              application: { connect: { id: existingApp.id } }
            }
          });
        }));
      }

      // Fetch and return the updated application with all relationships
      const application = await prisma.application.findUnique({
        where: { id: existingApp.id },
        include: {
          identifications: {
            include: {
              idPhotos: true
            }
          },
          incomes: true,
          verificationImages: true,
          residentialHistories: {
            orderBy: {
              index: 'asc',
            },
          }
        }
      });

      return { success: true, application };
    } else {
      // Create new application with all relationships in one go
      console.log('DEBUG - Creating new application');

      // Process identifications for creation
      if (identifications) {
        filteredData.identifications = {
          create: identifications.map((id: any) => {
            const { id: idId, ...idData } = id;

            // Handle nested idPhotos
            let idPhotoData = undefined;
            if (id.idPhotos && Array.isArray(id.idPhotos) && id.idPhotos.length > 0) {
              idPhotoData = {
                create: id.idPhotos.map((photo: any) => {
                  const { id: photoId, ...photoData } = photo;
                  return {
                    url: photoData.url || '',
                    fileKey: photoData.fileKey,
                    customId: photoData.customId,
                    fileName: photoData.fileName,
                    isPrimary: !!photoData.isPrimary
                  };
                })
              };
            }

            return {
              ...idData,
              ...(idPhotoData ? { idPhotos: idPhotoData } : {})
            };
          })
        };
      }

      // Process incomes for creation
      if (incomes) {
        filteredData.incomes = {
          create: incomes.map(({ id, ...incomeData }: any) => ({
            source: incomeData.source,
            monthlyAmount: incomeData.monthlyAmount,
            imageUrl: incomeData.imageUrl,
            fileKey: incomeData.fileKey,
            customId: incomeData.customId,
            fileName: incomeData.fileName
          }))
        };
      }

      // Process verificationImages for creation
      if (verificationImages) {
        filteredData.verificationImages = {
          create: verificationImages.map(({ id, ...imgData }: any) => imgData)
        };
      }

      // Process residentialHistories for creation
      if (residentialHistories) {
        filteredData.residentialHistories = {
          create: residentialHistories.map(({ id, applicationId, ...rhData }: any, idx: number) => ({
            ...rhData,
            index: idx
          }))
        };
      }

      // Create the application with all relationships
      const application = await prisma.application.create({
        data: {
          ...filteredData,
          userId,
          tripId: tripId || undefined
        },
        include: {
          identifications: {
            include: {
              idPhotos: true
            }
          },
          incomes: true,
          verificationImages: true,
          residentialHistories: {
            orderBy: {
              index: 'asc',
            },
          }
        }
      });

      return { success: true, application };
    }
  } catch (error) {
    console.error('Failed to upsert application:', error);
    return { success: false, error: `Failed to upsert application: ${error}` };
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

    // Decrypt SSN if it exists
    let applicationWithDecryptedSSN = application;
    if (application?.ssn) {
      try {
        const { decryptData } = await import('@/utils/encryption');
        const decryptedSsn = await decryptData(application.ssn);
        if (decryptedSsn) {
          // Create a new object instead of reassigning
          applicationWithDecryptedSSN = {
            ...application,
            ssn: decryptedSsn
          };
        }
      } catch (error) {
        console.error('Failed to decrypt SSN:', error);
      }
    }

    return { success: true, application: applicationWithDecryptedSSN };
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


'use server'

import prisma from '@/lib/prismadb'
import { auth } from '@clerk/nextjs/server'
import { UTApi } from 'uploadthing/server'
import { checkApplicationCompletionServer } from '@/utils/application-completion'
import { revalidatePath } from 'next/cache'

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
    // Use upsert to handle race conditions when multiple requests try to create simultaneously
    const application = await prisma.application.upsert({
      where: {
        userId_isDefault: {
          userId,
          isDefault: true,
        },
      },
      update: {
        // Don't update if application already exists
      },
      create: {
        userId,
        isDefault: true,
        // All other fields are nullable and will be filled in later
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

    return applicationWithDecryptedSSN;
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

      // Wrap all update operations in a transaction for atomicity
      const application = await prisma.$transaction(async (tx) => {
        // Update the base record first
        await tx.application.update({
          where: { id: existingApp.id },
          data: filteredData
        });

        // Handle relationships separately using connect/disconnect pattern
        if (identifications && identifications.length > 0) {
          // Delete all existing identifications for this application
          await tx.identification.deleteMany({
            where: { applicationId: existingApp.id }
          });

          // Create new identifications
          for (const id of identifications) {
            // Create the identification
            const newId = await tx.identification.create({
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
                tx.iDPhoto.create({
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
          await tx.income.deleteMany({
            where: { applicationId: existingApp.id }
          });

          await Promise.all(incomes.map((income: any) => {
            const { id, ...incomeData } = income;
            return tx.income.create({
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
          await tx.verificationImage.deleteMany({
            where: { applicationId: existingApp.id }
          });

          await Promise.all(verificationImages.map((img: any) => {
            const { id, ...imgData } = img;
            return tx.verificationImage.create({
              data: {
                ...imgData,
                application: { connect: { id: existingApp.id } }
              }
            });
          }));
        }

        if (residentialHistories && residentialHistories.length > 0) {
          await tx.residentialHistory.deleteMany({
            where: { applicationId: existingApp.id }
          });

          await Promise.all(residentialHistories.map((rh: any, idx: number) => {
            const { id, applicationId, ...rhData } = rh;
            return tx.residentialHistory.create({
              data: {
                ...rhData,
                index: idx,
                application: { connect: { id: existingApp.id } }
              }
            });
          }));
        }

        // Fetch and return the updated application with all relationships
        return await tx.application.findUnique({
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
      });

      // Transaction is committed - check completion on the saved data
      const completionResult = checkApplicationCompletionServer(application);

      // Update isComplete if requirements are met
      if (completionResult.isComplete && !application.isComplete) {
        await prisma.application.update({
          where: { id: application.id },
          data: { isComplete: true }
        });
        application.isComplete = true;
      } else if (!completionResult.isComplete && application.isComplete) {
        // Application was previously complete but no longer is
        await prisma.application.update({
          where: { id: application.id },
          data: { isComplete: false }
        });
        application.isComplete = false;
      }

      // Revalidate paths to clear cached application data
      revalidatePath('/app/rent/old-search');
      revalidatePath('/app/rent/applications/general');

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

      // Create the application with all relationships (atomic operation)
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

      // Check completion on the created data
      const completionResult = checkApplicationCompletionServer(application);

      // Update isComplete if requirements are met
      if (completionResult.isComplete) {
        await prisma.application.update({
          where: { id: application.id },
          data: { isComplete: true }
        });
        application.isComplete = true;
      }

      // Revalidate paths to clear cached application data
      revalidatePath('/app/rent/old-search');
      revalidatePath('/app/rent/applications/general');

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

export async function deleteIDPhoto(photoId: string) {
  const { userId } = auth();
  if (!userId) return { success: false, error: 'Unauthorized' };

  try {
    // First verify the photo belongs to the user's application
    const photo = await prisma.iDPhoto.findUnique({
      where: { id: photoId },
      include: {
        identification: {
          include: {
            application: true
          }
        }
      }
    });

    if (!photo) {
      return { success: false, error: 'Photo not found' };
    }

    if (photo.identification.application.userId !== userId) {
      return { success: false, error: 'Unauthorized to delete this photo' };
    }

    // Delete the photo from database
    await prisma.iDPhoto.delete({
      where: { id: photoId }
    });

    // Delete from UploadThing if fileKey exists
    if (photo.fileKey) {
      try {
        const utapi = new UTApi();
        await utapi.deleteFiles([photo.fileKey]);
        console.log(`Successfully deleted ID photo from UploadThing: ${photo.fileKey}`);
      } catch (uploadThingError) {
        console.warn('Warning: Failed to delete ID photo from UploadThing:', uploadThingError);
        // Don't fail the entire operation if UploadThing deletion fails
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Failed to delete ID photo:', error);
    return { success: false, error: 'Failed to delete photo' };
  }
}

export async function deleteIncomeProof(incomeId: string) {
  const { userId } = auth();
  if (!userId) return { success: false, error: 'Unauthorized' };

  try {
    // First verify the income belongs to the user's application
    const income = await prisma.income.findUnique({
      where: { id: incomeId },
      include: {
        application: true
      }
    });

    if (!income) {
      return { success: false, error: 'Income not found' };
    }

    if (income.application.userId !== userId) {
      return { success: false, error: 'Unauthorized to delete this proof' };
    }

    // Delete from UploadThing if fileKey exists
    if (income.fileKey) {
      try {
        const utapi = new UTApi();
        await utapi.deleteFiles([income.fileKey]);
        console.log(`Successfully deleted income proof from UploadThing: ${income.fileKey}`);
      } catch (uploadThingError) {
        console.warn('Warning: Failed to delete income proof from UploadThing:', uploadThingError);
        // Don't fail the entire operation if UploadThing deletion fails
      }
    }

    // Clear all proof-related fields in the database
    await prisma.income.update({
      where: { id: incomeId },
      data: {
        imageUrl: null,     // Clear legacy unsigned URL field
        fileKey: null,      // Clear UploadThing file key
        customId: null,     // Clear custom identifier
        fileName: null      // Clear original file name
      }
    });
    
    return { success: true };
  } catch (error) {
    console.error('Failed to delete income proof:', error);
    return { success: false, error: 'Failed to delete proof' };
  }
}

export async function updateApplicationField(fieldPath: string, value: any, tripId?: string, checkCompletion?: boolean) {
  const { userId } = auth();
  if (!userId) return { success: false, error: 'Unauthorized' };

  try {
    // Parse the field path to handle nested fields like "personalInfo.firstName"
    const pathParts = fieldPath.split('.');
    let updateData: any = {};
    
    // Map frontend nested structure to flat database structure
    if (pathParts.length === 2 && pathParts[0] === 'personalInfo') {
      // Personal info fields are stored directly on the Application model
      // Map personalInfo.firstName -> firstName
      const fieldName = pathParts[1];
      updateData[fieldName] = value;
    } else if (pathParts.length === 2 && pathParts[0] === 'currentAddress') {
      // Current address fields are also stored directly on the Application model
      // Map currentAddress.street -> street
      const fieldName = pathParts[1];
      updateData[fieldName] = value;
    } else if (pathParts.length === 2 && pathParts[0] === 'questionnaire') {
      // Questionnaire fields are stored directly on the Application model
      // Map questionnaire.evicted -> evicted
      const fieldName = pathParts[1];
      updateData[fieldName] = value;
    } else if (pathParts.length === 3 && pathParts[0] === 'identifications') {
      // Handle identification fields (e.g., identifications.0.idType, identifications.0.idPhotos)
      const index = parseInt(pathParts[1]);
      const fieldName = pathParts[2];
      
      // First, get the application to see if identifications exist
      const app = await prisma.application.findFirst({
        where: tripId 
          ? { userId, tripId }
          : { userId, isDefault: true },
        include: { 
          identifications: {
            include: {
              idPhotos: true
            }
          } 
        }
      });
      
      if (!app) {
        return { success: false, error: 'Application not found' };
      }
      
      // Special handling for idPhotos
      if (fieldName === 'idPhotos') {
        let identificationId: string;
        
        // Get or create the identification
        if (app.identifications && app.identifications[index]) {
          identificationId = app.identifications[index].id;
        } else {
          // Create new identification if it doesn't exist
          const newIdentification = await prisma.identification.create({
            data: {
              applicationId: app.id,
              idType: '',
              idNumber: '',
              isPrimary: index === 0
            }
          });
          identificationId = newIdentification.id;
        }
        
        // Delete existing photos for this identification
        await prisma.iDPhoto.deleteMany({
          where: { identificationId }
        });
        
        // Create new photos
        if (value && Array.isArray(value) && value.length > 0) {
          await Promise.all(value.map((photo: any, photoIndex: number) =>
            prisma.iDPhoto.create({
              data: {
                identificationId,
                fileKey: photo.fileKey || '',
                fileName: photo.fileName || '',
                customId: photo.customId || '',
                isPrimary: photo.isPrimary || photoIndex === 0,
                url: photo.url || ''
              }
            })
          ));
        }
      } else {
        // Handle other identification fields (idType, idNumber)
        if (app.identifications && app.identifications[index]) {
          await prisma.identification.update({
            where: { id: app.identifications[index].id },
            data: { [fieldName]: value }
          });
        } else {
          // Create new identification
          await prisma.identification.create({
            data: {
              applicationId: app.id,
              idType: fieldName === 'idType' ? value : '',
              idNumber: fieldName === 'idNumber' ? value : '',
              isPrimary: index === 0
            }
          });
        }
      }
      
      // Check completion status if requested
      if (checkCompletion) {
        const completionStatus = await updateApplicationCompletionStatus(app.id);
        return { 
          success: true, 
          application: app, 
          completionStatus,
          isComplete: completionStatus?.isComplete ?? false 
        };
      }
      
      return { success: true, application: app };
    } else if (pathParts.length === 3 && pathParts[0] === 'incomes') {
      // Handle income fields (e.g., incomes.0.source)
      const index = parseInt(pathParts[1]);
      const fieldName = pathParts[2];
      
      // First, get the application to see if incomes exist
      const app = await prisma.application.findFirst({
        where: tripId 
          ? { userId, tripId }
          : { userId, isDefault: true },
        include: { incomes: true }
      });
      
      if (!app) {
        return { success: false, error: 'Application not found' };
      }
      
      // If income exists at this index, update it
      if (app.incomes && app.incomes[index]) {
        await prisma.income.update({
          where: { id: app.incomes[index].id },
          data: { [fieldName]: value }
        });
      } else {
        // Create new income
        await prisma.income.create({
          data: {
            applicationId: app.id,
            source: fieldName === 'source' ? value : '',
            monthlyAmount: fieldName === 'monthlyAmount' ? value : '',
            fileKey: fieldName === 'fileKey' ? value : undefined,
            fileName: fieldName === 'fileName' ? value : undefined,
            customId: fieldName === 'customId' ? value : undefined
          }
        });
      }
      
      // Check completion status if requested
      if (checkCompletion) {
        const completionStatus = await updateApplicationCompletionStatus(app.id);
        return { 
          success: true, 
          application: app, 
          completionStatus,
          isComplete: completionStatus?.isComplete ?? false 
        };
      }
      
      return { success: true, application: app };
    } else if (pathParts.length === 3 && pathParts[0] === 'residentialHistory') {
      // Handle residential history fields (e.g., residentialHistory.0.street)
      const index = parseInt(pathParts[1]);
      const fieldName = pathParts[2];
      
      // First, get the application to see if residential histories exist
      const app = await prisma.application.findFirst({
        where: tripId 
          ? { userId, tripId }
          : { userId, isDefault: true },
        include: { residentialHistories: { orderBy: { index: 'asc' } } }
      });
      
      if (!app) {
        return { success: false, error: 'Application not found' };
      }
      
      // If residential history exists at this index, update it
      if (app.residentialHistories && app.residentialHistories[index]) {
        await prisma.residentialHistory.update({
          where: { id: app.residentialHistories[index].id },
          data: { [fieldName]: value }
        });
      } else {
        // Create new residential history
        await prisma.residentialHistory.create({
          data: {
            applicationId: app.id,
            index: index,
            [fieldName]: value
          }
        });
      }
      
      // Check completion status if requested
      if (checkCompletion) {
        const completionStatus = await updateApplicationCompletionStatus(app.id);
        return { 
          success: true, 
          application: app, 
          completionStatus,
          isComplete: completionStatus?.isComplete ?? false 
        };
      }
      
      return { success: true, application: app };
    } else if (pathParts.length === 1) {
      // Simple field - use as is
      updateData[fieldPath] = value;
    } else {
      // For other nested structures, we might need special handling
      return { success: false, error: `Unsupported field path: ${fieldPath}` };
    }
    
    // Handle SSN encryption if updating SSN field
    if (fieldPath === 'ssn' || fieldPath.endsWith('.ssn')) {
      try {
        const { encryptData } = await import('@/utils/encryption');
        const encryptedSsn = await encryptData(value);
        if (encryptedSsn) {
          updateData.ssn = encryptedSsn;
        }
      } catch (error) {
        console.error('SSN encryption error:', error);
      }
    }
    
    // Handle date fields
    if (fieldPath.endsWith('dateOfBirth') && value) {
      // Even with @db.Date, Prisma client expects ISO-8601 DateTime format
      // But MySQL will store it as DATE only (no time component)
      // We append T00:00:00.000Z to make it a valid DateTime string
      const dateValue = `${value}T00:00:00.000Z`;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[updateApplicationField] Date of Birth handling:', {
          originalValue: value,
          convertedValue: dateValue,
          fieldPath: fieldPath
        });
      }
      
      updateData[pathParts.length === 2 ? pathParts[1] : fieldPath] = dateValue;
    }
    
    // Determine where clause
    const whereClause = tripId 
      ? { userId_tripId: { userId, tripId } }
      : { userId_isDefault: { userId, isDefault: true } };
    
    // Log for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('[updateApplicationField] Updating with:', { whereClause, updateData });
    }
    
    // Update the application
    const application = await prisma.application.update({
      where: whereClause,
      data: updateData
    });
    
    // Send notifications to hosts if this is a trip application with pending housing requests
    if (tripId) {
      try {
        // Find all pending housing requests for this trip
        const housingRequests = await prisma.housingRequest.findMany({
          where: {
            tripId: tripId,
            status: 'pending'
          },
          include: {
            listing: {
              select: {
                id: true,
                title: true,
                userId: true
              }
            },
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        });
        
        // Send notification to each host
        if (housingRequests.length > 0) {
          const { createNotification } = await import('@/app/actions/notifications');
          
          for (const housingRequest of housingRequests) {
            const renterName = `${housingRequest.user.firstName || ''} ${housingRequest.user.lastName || ''}`.trim() || 'A renter';
            
            await createNotification({
              userId: housingRequest.listing.userId,
              content: `${renterName} has updated their application for ${housingRequest.listing.title}`,
              url: `/app/host/${housingRequest.listing.id}/applications`,
              actionType: 'application_updated',
              actionId: housingRequest.id,
              emailData: {
                renterName: renterName,
                listingTitle: housingRequest.listing.title
              }
            });
          }
        }
      } catch (error) {
        // Log error but don't fail the update
        console.error('Failed to send application update notifications:', error);
      }
    }
    
    // Check completion status if requested
    if (checkCompletion) {
      const completionStatus = await updateApplicationCompletionStatus(application.id);
      return { 
        success: true, 
        application, 
        completionStatus,
        isComplete: completionStatus?.isComplete ?? false 
      };
    }
    
    return { success: true, application };
  } catch (error) {
    console.error('Failed to update application field:', error);
    return { success: false, error: `Failed to update field: ${error}` };
  }
}

export async function markComplete(applicationId: string) {
  try {
    // Get the application with all related data to check if it's actually complete
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
      }
    });

    if (!application) {
      return { success: false, error: 'Application not found' };
    }

    // Use the centralized completion check to verify requirements are met
    const completionResult = checkApplicationCompletionServer(application);

    if (completionResult.isComplete) {
      // Only mark complete if requirements are actually met
      const updatedApplication = await prisma.application.update({
        where: { id: applicationId },
        data: { isComplete: true },
      });

      // Revalidate paths to clear cached application data
      revalidatePath('/app/rent/old-search');
      revalidatePath('/app/rent/applications/general');

      return { success: true, application: updatedApplication };
    } else {
      // Don't mark as complete if requirements aren't met
      console.log(`Application ${applicationId} not marked complete - missing: ${completionResult.missingRequirements.join(', ')}`);
      return {
        success: false,
        error: 'Application does not meet completion requirements',
        missingRequirements: completionResult.missingRequirements
      };
    }
  } catch (error) {
    console.error("Failed to mark application as complete:", error);
    return { success: false, error: 'Failed to mark application as complete.' };
  }
}

export async function updateApplicationCompletionStatus(applicationId?: string) {
  const { userId } = auth();
  if (!userId) return { success: false, error: 'Unauthorized' };

  try {
    // Get the application with all related data
    const application = await prisma.application.findFirst({
      where: applicationId 
        ? { id: applicationId, userId }
        : { userId, isDefault: true },
      include: {
        identifications: {
          include: {
            idPhotos: true
          }
        },
        incomes: true,
        residentialHistories: true,
      }
    });

    if (!application) {
      return { success: false, error: 'Application not found' };
    }

    // Use centralized completion check
    const completionResult = checkApplicationCompletionServer(application);
    const missingRequirements = completionResult.missingRequirements;
    const isNowComplete = completionResult.isComplete;
    
    // Update if status changed
    if (application.isComplete !== isNowComplete) {
      await prisma.application.update({
        where: { id: application.id },
        data: { isComplete: isNowComplete }
      });

      console.log(`Application ${application.id} completion status updated: ${isNowComplete}`);
      
      return { 
        success: true, 
        isComplete: isNowComplete,
        statusChanged: true,
        missingRequirements 
      };
    }

    return { 
      success: true, 
      isComplete: isNowComplete,
      statusChanged: false,
      missingRequirements 
    };
  } catch (error) {
    console.error('Failed to update application completion status:', error);
    return { success: false, error: 'Failed to update completion status' };
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


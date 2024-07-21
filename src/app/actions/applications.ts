'use server'

import { prisma } from '@/lib/prisma';
import { ApplicationFormData } from '@/lib/zod-schemas';

export async function createApplication(data: ApplicationFormData) {
  try {
    const application = await prisma.application.create({
      data: {
        firstName: data.personalInfo.firstName,
        lastName: data.personalInfo.lastName,
        currentStreet: data.residentialHistory.currentAddress.street,
        currentApt: data.residentialHistory.currentAddress.apt,
        currentCity: data.residentialHistory.currentAddress.city,
        currentState: data.residentialHistory.currentAddress.state,
        currentZipCode: data.residentialHistory.currentAddress.zipCode,
        housingStatus: data.residentialHistory.housingStatus,
        monthlyPayment: data.residentialHistory.monthlyPayment,
        durationOfTenancy: data.residentialHistory.durationOfTenancy,
        landlordFirstName: data.landlord.firstName,
        landlordLastName: data.landlord.lastName,
        identifications: {
          create: data.identification.map(id => ({
            idType: id.idType,
            idNumber: id.idNumber,
          }))
        },
        incomes: {
          create: data.income.map(inc => ({
            source: inc.source,
            monthlyAmount: inc.monthlyAmount,
          }))
        },
        verificationImages: {
          create: [
            ...data.identification.flatMap(id => 
              id.verificationImages.map(img => ({
                url: img.url,
                category: 'Identification',
              }))
            ),
            ...data.income.flatMap(inc => 
              inc.verificationImages.map(img => ({
                url: img.url,
                category: 'Income',
              }))
            ),
          ],
        },
        isDefault: false, // or set based on some logic
        // tripId: someTrip.id, // if you have a trip to associate
      },
    });

    return { success: true, data: application };
  } catch (error) {
    console.error('Failed to create application:', error);
    return { success: false, error: 'Failed to create application' };
  }
}

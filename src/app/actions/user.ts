'use server'
import prismadb from '@/lib/prismadb'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { currentUser, auth } from '@clerk/nextjs/server'
import { clerkClient } from '@clerk/nextjs/server'
import { logger } from '@/lib/logger';
import { unstable_noStore as noStore } from 'next/cache';

export async function getHostUserData() {
  noStore(); // Prevent caching to always get fresh data
  const clerkUser = await currentUser();
  
  if (!clerkUser) {
    return null;
  }

  try {
    const user = await prismadb.user.findUnique({
      where: { id: clerkUser.id },
      select: {
        id: true,
        stripeAccountId: true,
        agreedToHostTerms: true,
        stripeChargesEnabled: true,
        stripeDetailsSubmitted: true,
        medallionIdentityVerified: true,
        medallionVerificationStatus: true,
      }
    });

    return user;
  } catch (error) {
    logger.error('Failed to fetch host user data', {
      userId: clerkUser.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return null;
  }
}

export async function updateUserStripeAccount(stripeAccountId: string) {
  const clerkUser = await currentUser();
  
  if (!clerkUser) {
    throw new Error("Unauthorized");
  }

  try {
    const user = await prismadb.user.update({
      where: { id: clerkUser.id },
      data: { stripeAccountId },
    });

    // Revalidate the overview page to show updated checklist
    revalidatePath('/app/host/dashboard/overview');
    revalidatePath('/app/host');
    
    logger.info('Updated user Stripe account', {
      userId: clerkUser.id,
      stripeAccountId
    });

    return user;
  } catch (error) {
    logger.error('Failed to update user Stripe account', {
      userId: clerkUser.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw new Error("Failed to update Stripe account");
  }
}

export async function createUser() {

  const clerkUser = await currentUser();

  if (!clerkUser) {
    throw new Error("Unauthorized");
  }

  const user = await prismadb.user.create({
    data: {
      id: clerkUser.id,
      firstName: clerkUser?.firstName,
      lastName: clerkUser?.lastName,
      email: clerkUser?.emailAddresses[0].emailAddress,
      imageUrl: clerkUser?.imageUrl,
    },
  });

  revalidatePath('/user')
  return user;
}

export async function updateUserInitials(initials: string) {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    throw new Error("Unauthorized");
  }

  try {
    // Update the user's initials
    const user = await prismadb.user.update({
      where: { id: clerkUser.id },
      data: { signingInitials: initials },
    });

    logger.info('Updated user initials', {
      userId: clerkUser.id,
      initials: initials
    });

    // Immediately verify the save by pulling the user back from database
    const verificationUser = await prismadb.user.findUnique({
      where: { id: clerkUser.id },
      select: { 
        id: true, 
        signingInitials: true 
      }
    });

    if (!verificationUser || verificationUser.signingInitials !== initials) {
      logger.error('Verification failed after saving initials', {
        userId: clerkUser.id,
        expectedInitials: initials,
        actualInitials: verificationUser?.signingInitials || 'null',
        userExists: !!verificationUser
      });
      throw new Error("Failed to verify initials save to database");
    }

    logger.info('Successfully verified initials saved to database', {
      userId: clerkUser.id,
      verifiedInitials: verificationUser.signingInitials
    });

    revalidatePath('/');
    return user;
  } catch (error) {
    logger.error('Failed to update user initials', {
      userId: clerkUser.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw new Error("Failed to update initials");
  }
}


export async function updateUserImage() {
  'use server'

  const clerkUser = await currentUser();

  try {
    if (!clerkUser?.id) {
      throw new Error('User ID is missing' + clerkUser)
    }

    const dbUser = await prismadb?.user.findUnique({
      where: { id: clerkUser.id }
    })

    if (!dbUser) {
      await createUser();
      return { success: true };
    }

    if (clerkUser.imageUrl !== dbUser.imageUrl) {
      await prismadb?.user.update({
        where: { id: dbUser.id },
        data: { imageUrl: clerkUser.imageUrl }
      });
      return { success: true };
    }

    return { success: true };

  } catch (error) {
    logger.error('Error updating user image', error);
    return { success: false, error: 'Failed to update user image' }
  }
}


export async function updateUserLogin(timestamp: Date) {
  'use server'

  try {
    const clerkUser = await currentUser();

    if (!clerkUser?.id) {
      logger.warn('updateUserLogin: No Clerk user ID available');
      return { success: false, error: 'User ID is missing' };
    }

    const dbUser = await prismadb.user.findUnique({
      where: { id: clerkUser.id }
    });

    if (!dbUser) {
      logger.info('updateUserLogin: User not found, creating user', { userId: clerkUser.id });
      await createUser();
    }

    await prismadb.user.update({
      where: { id: clerkUser.id },
      data: { lastLogin: timestamp }
    });

    logger.info('updateUserLogin: Successfully updated login timestamp', { userId: clerkUser.id });
    return { success: true };

  } catch (error) {
    logger.error('updateUserLogin: Error updating user login timestamp', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: timestamp?.toISOString()
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update login timestamp'
    };
  }
}

export async function agreeToTerms(formData: FormData) {
  try {
    console.log(`[AGREE TO TERMS] ========== STARTING AGREEMENT PROCESS ==========`);
    console.log(`[AGREE TO TERMS] FormData contents:`, Object.fromEntries(formData.entries()));
    
    const { userId } = auth();
    const clerkUser = await currentUser();
    
    console.log(`[AGREE TO TERMS] User ID: ${userId}`);
    console.log(`[AGREE TO TERMS] Clerk User exists: ${!!clerkUser}`);

    if (!userId || !clerkUser) {
      console.error(`[AGREE TO TERMS] Authentication failed - userId: ${userId}, clerkUser: ${!!clerkUser}`);
      throw new Error("Not authenticated");
    }

    console.log(`[AGREE TO TERMS] Step 1: Checking if user exists in database...`);
    // Check if user exists in our database
    const dbUser = await prismadb.user.findUnique({
      where: { id: userId }
    });
    
    console.log(`[AGREE TO TERMS] DB user exists: ${!!dbUser}`);

    // If user doesn't exist, create them first
    if (!dbUser) {
      console.log(`[AGREE TO TERMS] Step 2: Creating new user in database...`);
      await createUser();
      console.log(`[AGREE TO TERMS] New user created successfully`);
    }

    console.log(`[AGREE TO TERMS] Step 3: Updating database with terms agreement...`);
    // Update the user's agreedToTerms field with the current timestamp
    const updateResult = await prismadb.user.update({
      where: { id: userId },
      data: { agreedToTerms: new Date() }
    });
    
    console.log(`[AGREE TO TERMS] Database updated successfully:`, updateResult.agreedToTerms);

    console.log(`[AGREE TO TERMS] Step 4: Updating Clerk metadata...`);
    // Update user metadata to reflect terms agreement in session
    const metadataUpdate = await clerkClient.users.updateUserMetadata(userId, {
      privateMetadata: {
        ...clerkUser.privateMetadata,
        agreedToTerms: true,
      },
      publicMetadata: {
        ...clerkUser.publicMetadata,
        agreedToTerms: true,
      },
    });
    
    console.log(`[AGREE TO TERMS] Clerk metadata updated successfully`);

    console.log(`[AGREE TO TERMS] Step 5: Preparing redirect...`);
    // Get redirect URL from form data, default to home page
    const redirectUrl = formData.get("redirect_url") as string || "/";
    console.log(`[AGREE TO TERMS] Redirect URL from form: ${redirectUrl}`);
    
    // Decode the URL in case it was URL encoded
    const decodedRedirectUrl = decodeURIComponent(redirectUrl);
    console.log(`[AGREE TO TERMS] Decoded redirect URL: ${decodedRedirectUrl}`);
    
    console.log(`[AGREE TO TERMS] Step 6: Returning redirect URL for client...`);
    // Return the redirect URL - middleware will check database directly
    console.log(`[AGREE TO TERMS] ========== AGREEMENT PROCESS COMPLETE ==========`);
    return { success: true, redirectUrl: decodedRedirectUrl };
    
  } catch (error) {
    console.error(`[AGREE TO TERMS] ========== ERROR IN AGREEMENT PROCESS ==========`);
    console.error(`[AGREE TO TERMS] Error type:`, error?.constructor?.name);
    console.error(`[AGREE TO TERMS] Error message:`, error?.message);
    console.error(`[AGREE TO TERMS] Full error:`, error);
    console.error(`[AGREE TO TERMS] Stack trace:`, error?.stack);
    throw error; // Re-throw so the client can handle it
  }
}

export async function agreeToHostTerms(formData: FormData) {
  try {
    console.log(`[AGREE TO HOST TERMS] ========== STARTING AGREEMENT PROCESS ==========`);
    console.log(`[AGREE TO HOST TERMS] FormData contents:`, Object.fromEntries(formData.entries()));
    
    const { userId } = auth();
    const clerkUser = await currentUser();
    
    console.log(`[AGREE TO HOST TERMS] User ID: ${userId}`);
    console.log(`[AGREE TO HOST TERMS] Clerk User exists: ${!!clerkUser}`);

    if (!userId || !clerkUser) {
      console.error(`[AGREE TO HOST TERMS] Authentication failed - userId: ${userId}, clerkUser: ${!!clerkUser}`);
      throw new Error("Not authenticated");
    }

    console.log(`[AGREE TO HOST TERMS] Step 1: Checking if user exists in database...`);
    // Check if user exists in our database
    const dbUser = await prismadb.user.findUnique({
      where: { id: userId }
    });
    
    console.log(`[AGREE TO HOST TERMS] DB user exists: ${!!dbUser}`);

    // If user doesn't exist, create them first
    if (!dbUser) {
      console.log(`[AGREE TO HOST TERMS] Step 2: Creating new user in database...`);
      await createUser();
      console.log(`[AGREE TO HOST TERMS] New user created successfully`);
    }

    console.log(`[AGREE TO HOST TERMS] Step 3: Updating database with host terms agreement...`);
    // Update the user's agreedToHostTerms field with the current timestamp
    const updateResult = await prismadb.user.update({
      where: { id: userId },
      data: { agreedToHostTerms: new Date() }
    });
    
    console.log(`[AGREE TO HOST TERMS] Database updated successfully:`, updateResult.agreedToHostTerms);

    console.log(`[AGREE TO HOST TERMS] Step 4: Updating Clerk metadata...`);
    // Update user metadata to reflect host terms agreement in session
    const metadataUpdate = await clerkClient.users.updateUserMetadata(userId, {
      privateMetadata: {
        ...clerkUser.privateMetadata,
        agreedToHostTerms: true,
      },
      publicMetadata: {
        ...clerkUser.publicMetadata,
        agreedToHostTerms: true,
      },
    });
    
    console.log(`[AGREE TO HOST TERMS] Clerk metadata updated successfully`);

    console.log(`[AGREE TO HOST TERMS] Step 5: Preparing redirect...`);
    // Get redirect URL from form data, default to host overview page
    const redirectUrl = formData.get("redirect_url") as string || "/app/host/dashboard/overview";
    console.log(`[AGREE TO HOST TERMS] Redirect URL from form: ${redirectUrl}`);
    
    // Decode the URL in case it was URL encoded
    const decodedRedirectUrl = decodeURIComponent(redirectUrl);
    console.log(`[AGREE TO HOST TERMS] Decoded redirect URL: ${decodedRedirectUrl}`);
    
    console.log(`[AGREE TO HOST TERMS] Step 6: Returning redirect URL for client...`);
    // Return the redirect URL - middleware will check database directly
    console.log(`[AGREE TO HOST TERMS] ========== AGREEMENT PROCESS COMPLETE ==========`);
    return { success: true, redirectUrl: decodedRedirectUrl };
    
  } catch (error) {
    console.error(`[AGREE TO HOST TERMS] ========== ERROR IN AGREEMENT PROCESS ==========`);
    console.error(`[AGREE TO HOST TERMS] Error type:`, error?.constructor?.name);
    console.error(`[AGREE TO HOST TERMS] Error message:`, error?.message);
    console.error(`[AGREE TO HOST TERMS] Full error:`, error);
    console.error(`[AGREE TO HOST TERMS] Stack trace:`, error?.stack);
    throw error; // Re-throw so the client can handle it
  }
}

export async function getAgreedToTerms() {
  const { userId } = auth();
  
  if (!userId) {
    throw new Error("Not authenticated");
  }

  // First check if user exists
  const user = await prismadb.user.findUnique({
    where: { id: userId }
  });

  // If user doesn't exist in our database, create them
  if (!user) {
    await createUser();
    return null; // New user hasn't agreed to terms yet
  }

  return user.agreedToTerms;
}

export async function updateNotificationPreferences(preferences: {
  // Messages & Communication
  emailNewMessageNotifications?: boolean;
  emailNewConversationNotifications?: boolean;
  
  // Applications & Matching  
  emailApplicationReceivedNotifications?: boolean;
  emailApplicationApprovedNotifications?: boolean;
  emailApplicationDeclinedNotifications?: boolean;
  
  // Reviews & Verification
  emailSubmitHostReviewNotifications?: boolean;
  emailSubmitRenterReviewNotifications?: boolean;
  emailLandlordInfoRequestNotifications?: boolean;
  emailVerificationCompletedNotifications?: boolean;
  
  // Bookings & Stays
  emailBookingCompletedNotifications?: boolean;
  emailBookingCanceledNotifications?: boolean;
  emailMoveOutUpcomingNotifications?: boolean;
  emailMoveInUpcomingNotifications?: boolean;
  
  // Payments
  emailPaymentSuccessNotifications?: boolean;
  emailPaymentFailedNotifications?: boolean;
  
  // External Communications
  emailOffPlatformHostNotifications?: boolean;
}) {
  'use server'

  const clerkUser = await currentUser();

  try {
    if (!clerkUser?.id) {
      throw new Error('User ID is missing');
    }

    // Ensure user exists
    const dbUser = await prismadb.user.findUnique({
      where: { id: clerkUser.id },
      include: { preferences: true }
    });

    if (!dbUser) {
      await createUser();
    }

    // Check if user preferences exist, create if not
    if (!dbUser?.preferences) {
      await prismadb.userPreferences.create({
        data: {
          userId: clerkUser.id,
          listingType: 'apartment',
          bedroomCount: 1,
          bathroomCount: 1,
          ...preferences
        }
      });
    } else {
      // Update existing preferences
      await prismadb.userPreferences.update({
        where: { userId: clerkUser.id },
        data: preferences
      });
    }

    return { success: true };

  } catch (error) {
    logger.error('Error updating notification preferences', error);
    return { success: false, error: 'Failed to update notification preferences' };
  }
}

export async function getNotificationPreferences() {
  'use server'

  const clerkUser = await currentUser();

  try {
    if (!clerkUser?.id) {
      return { success: false, error: 'User not authenticated' };
    }

    const userPreferences = await prismadb.userPreferences.findUnique({
      where: { userId: clerkUser.id },
      select: {
        // Messages & Communication
        emailNewMessageNotifications: true,
        emailNewConversationNotifications: true,
        
        // Applications & Matching  
        emailApplicationReceivedNotifications: true,
        emailApplicationApprovedNotifications: true,
        emailApplicationDeclinedNotifications: true,
        
        // Reviews & Verification
        emailSubmitHostReviewNotifications: true,
        emailSubmitRenterReviewNotifications: true,
        emailLandlordInfoRequestNotifications: true,
        emailVerificationCompletedNotifications: true,
        
        // Bookings & Stays
        emailBookingCompletedNotifications: true,
        emailBookingCanceledNotifications: true,
        emailMoveOutUpcomingNotifications: true,
        emailMoveInUpcomingNotifications: true,
        
        // Payments
        emailPaymentSuccessNotifications: true,
        emailPaymentFailedNotifications: true,
        
        // External Communications
        emailOffPlatformHostNotifications: true,
      }
    });

    return { 
      success: true, 
      preferences: userPreferences || {
        // Messages & Communication
        emailNewMessageNotifications: false,
        emailNewConversationNotifications: false,
        
        // Applications & Matching  
        emailApplicationReceivedNotifications: false,
        emailApplicationApprovedNotifications: false,
        emailApplicationDeclinedNotifications: false,
        
        // Reviews & Verification
        emailSubmitHostReviewNotifications: false,
        emailSubmitRenterReviewNotifications: false,
        emailLandlordInfoRequestNotifications: false,
        emailVerificationCompletedNotifications: false,
        
        // Bookings & Stays
        emailBookingCompletedNotifications: false,
        emailBookingCanceledNotifications: false,
        emailMoveOutUpcomingNotifications: false,
        emailMoveInUpcomingNotifications: false,
        
        // Payments
        emailPaymentSuccessNotifications: false,
        emailPaymentFailedNotifications: false,
        
        // External Communications
        emailOffPlatformHostNotifications: false,
      }
    };

  } catch (error) {
    logger.error('Error getting notification preferences', error);
    return { success: false, error: 'Failed to get notification preferences' };
  }
}

export async function confirmAuthenticatedName(dateOfBirth: string) {
  'use server';

  const clerkUser = await currentUser();

  if (!clerkUser?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // Get current user data
    const userData = await prismadb.user.findUnique({
      where: { id: clerkUser.id },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        medallionUserAccessCode: true
      },
    });

    if (!userData?.firstName || !userData?.lastName) {
      return { success: false, error: 'No name on file to confirm' };
    }

    if (!userData?.email) {
      return { success: false, error: 'Email address is required for verification' };
    }

    // Create user in Medallion API first (if not already created)
    let userAccessCode = userData.medallionUserAccessCode;
    let medallionUserId = null;

    if (!userAccessCode) {
      try {
        console.log('🚀 Creating Medallion user for:', {
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email
        });

        const medallionApiKey = process.env.MEDALLION_API_KEY;
        if (!medallionApiKey) {
          return { success: false, error: 'Medallion API not configured. Please contact support.' };
        }

        const medallionResponse = await fetch('https://api-v3.authenticating.com/user/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${medallionApiKey}`,
          },
          body: JSON.stringify({
            firstName: userData.firstName,
            middleName: '',
            lastName: userData.lastName,
            dob: dateOfBirth.trim(), // DD-MM-YYYY format
            email: userData.email,
          }),
        });

        if (!medallionResponse.ok) {
          const errorText = await medallionResponse.text();
          logger.error('Medallion API error during user confirmation', {
            status: medallionResponse.status,
            statusText: medallionResponse.statusText,
            error: errorText,
            userId: clerkUser.id
          });

          return {
            success: false,
            error: `Failed to set up identity verification. Please try again or contact support. (Error: ${medallionResponse.status})`
          };
        }

        const medallionData = await medallionResponse.json();
        userAccessCode = medallionData.userAccessCode;
        medallionUserId = medallionData.user_id || medallionData.userId;

        if (!userAccessCode) {
          logger.error('No userAccessCode returned from Medallion API', {
            medallionData,
            userId: clerkUser.id
          });
          return { success: false, error: 'Failed to set up identity verification. Please try again.' };
        }

        console.log('✅ Medallion user created:', { userAccessCode, medallionUserId });
      } catch (medallionError) {
        logger.error('Error creating Medallion user during confirmation', {
          error: medallionError instanceof Error ? medallionError.message : 'Unknown error',
          userId: clerkUser.id
        });
        return {
          success: false,
          error: 'Failed to set up identity verification. Please check your connection and try again.'
        };
      }
    }

    // Copy display names to authenticated names, save DOB, and store Medallion data
    await prismadb.user.update({
      where: { id: clerkUser.id },
      data: {
        authenticatedFirstName: userData.firstName,
        authenticatedLastName: userData.lastName,
        authenticatedDateOfBirth: dateOfBirth.trim(),
        ...(userAccessCode && { medallionUserAccessCode: userAccessCode }),
        ...(medallionUserId && { medallionUserId: medallionUserId }),
        ...(userAccessCode && {
          medallionVerificationStatus: "pending",
          medallionVerificationStartedAt: new Date(),
        }),
      },
    });

    logger.info('User authenticated information confirmed', {
      userId: clerkUser.id,
      authenticatedFirstName: userData.firstName,
      authenticatedLastName: userData.lastName,
      authenticatedDateOfBirth: dateOfBirth.trim(),
      medallionUserAccessCode: userAccessCode,
      medallionUserId: medallionUserId,
    });

    return { success: true };
  } catch (error) {
    logger.error('Error confirming authenticated information', {
      userId: clerkUser.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return { success: false, error: 'Failed to confirm information' };
  }
}

export async function updateAuthenticatedName(firstName: string, middleName: string | null, lastName: string, dateOfBirth: string) {
  'use server';

  const clerkUser = await currentUser();

  if (!clerkUser?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // Update authenticated names and DOB (not display names)
    await prismadb.user.update({
      where: { id: clerkUser.id },
      data: {
        authenticatedFirstName: firstName.trim(),
        authenticatedMiddleName: middleName?.trim() || null,
        authenticatedLastName: lastName.trim(),
        authenticatedDateOfBirth: dateOfBirth.trim(),
      },
    });

    logger.info('User authenticated information updated', {
      userId: clerkUser.id,
      authenticatedFirstName: firstName.trim(),
      authenticatedMiddleName: middleName?.trim() || null,
      authenticatedLastName: lastName.trim(),
      authenticatedDateOfBirth: dateOfBirth.trim(),
    });

    return { success: true };
  } catch (error) {
    logger.error('Error updating authenticated information', {
      userId: clerkUser.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return { success: false, error: 'Failed to update authenticated information' };
  }
}


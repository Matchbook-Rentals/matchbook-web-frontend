'use server'
import prismadb from '@/lib/prismadb'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { currentUser, auth } from '@clerk/nextjs/server'
import { clerkClient } from '@clerk/nextjs/server'
import { logger } from '@/lib/logger';

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
    const user = await prismadb.user.update({
      where: { id: clerkUser.id },
      data: { signingInitials: initials },
    });

    logger.info('Updated user initials', {
      userId: clerkUser.id,
      initials: initials
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

  const clerkUser = await currentUser();

  try {
    if (!clerkUser?.id) {
      throw new Error('User ID is missing')
    }

    const dbUser = await prismadb.user.findUnique({
      where: { id: clerkUser.id }
    })

    if (!dbUser) {
      await createUser();
    }

    await prismadb.user.update({
      where: { id: clerkUser.id },
      data: { lastLogin: timestamp }
    });

    return { success: true };

  } catch (error) {
    logger.error('Error updating user login timestamp', error);
    return { success: false, error: 'Failed to update login timestamp' }
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


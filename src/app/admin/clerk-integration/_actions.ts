'use server'

import { auth } from '@clerk/nextjs/server'
import { clerkClient } from '@clerk/nextjs/server'
import prismadb from '@/lib/prismadb'
import { checkRole } from '@/utils/roles'
import { redirect } from 'next/navigation'

export async function resetTermsAgreement() {
  const { userId } = auth()
  
  if (!userId) {
    throw new Error('Not authenticated')
  }

  // Check if user has admin role
  const hasAdminRole = await checkRole('admin')
  if (!hasAdminRole) {
    redirect('/unauthorized')
  }

  try {
    // Get current user metadata
    const user = await clerkClient.users.getUser(userId)
    
    // Reset terms agreement in database
    await prismadb.user.update({
      where: { id: userId },
      data: { agreedToTerms: null }
    })

    // Reset terms agreement in Clerk metadata
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: {
        ...user.publicMetadata,
        agreedToTerms: false,
      },
    })

    return { success: true, message: 'Terms agreement reset successfully' }
  } catch (error) {
    console.error('Error resetting terms agreement:', error)
    return { success: false, message: 'Failed to reset terms agreement' }
  }
}